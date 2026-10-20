import {codexExecutable} from './codex-path.mjs';
import {PaperReading} from './paper-reading.mjs';
import {ReaderIndex} from './reader-index.mjs';
import {sendFile,requestFailure} from './file-response.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildCatalog, builtinCollection } from './catalog.mjs';
import { artifacts, safeFile, inside } from './paths.mjs';
import { Codex } from './codex.mjs';
import { SourceManager } from './sources.mjs';
import { Papers } from './papers.mjs';
import { AnalysisControl } from './analysis-control.mjs';
import { PaperVisuals } from './paper-visuals.mjs';
import { Knowledge } from './knowledge.mjs';
import { PaperSearch } from './paper-search.mjs';
import { KnowledgeBase } from './knowledge-base.mjs';
import { ReadingActivity } from './reading-activity.mjs';
import { Synthesis } from './synthesis.mjs';
import { ResearchPreparation } from './research-preparation.mjs';

const exec = promisify(execFile);
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspace = path.dirname(appRoot);
const local = process.env.RESEARCH_STATE_DIR || path.join(appRoot, '.local');
fs.mkdirSync(local, { recursive: true });
const adapterRoot = path.join(local, 'adapters');
const researchRoot = process.env.RESEARCH_PROJECT_ROOT || path.join(workspace, 'research');
const sourceManager = new SourceManager(local, workspace);
let catalog = buildCatalog(workspace, adapterRoot, [...sourceManager.list(),builtinCollection]);
fs.writeFileSync(path.join(local, 'sources.json'), JSON.stringify(catalog.sources, null, 2));
const db = new DatabaseSync(path.join(local, 'research.sqlite'));
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS favorites (id TEXT PRIMARY KEY); CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, name TEXT, folder TEXT UNIQUE); CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, data TEXT); CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY AUTOINCREMENT, run TEXT, data TEXT);');
const saveRun = r => db.prepare('INSERT OR REPLACE INTO runs VALUES (?, ?)').run(r.id, JSON.stringify(r));
const getRun = id => { const row = db.prepare('SELECT data FROM runs WHERE id=?').get(id); if (!row) throw new Error('Run not found.'); return JSON.parse(row.data); };
const allRuns = () => db.prepare('SELECT data FROM runs ORDER BY rowid DESC').all().map(x => JSON.parse(x.data));
const getProject = id => { const p = db.prepare('SELECT * FROM projects WHERE id=?').get(id); if (!p) throw new Error('Project not found.'); return p; };
if (!db.prepare('SELECT id FROM projects LIMIT 1').get()) {
  const folder = path.join(researchRoot, 'my-research'); fs.mkdirSync(folder, { recursive: true });
  db.prepare('INSERT INTO projects VALUES (?, ?, ?)').run(randomUUID(), 'My research', folder);
}
for (const r of allRuns()) if (['running', 'waiting', 'queued', 'starting'].includes(r.status)) { r.status = 'interrupted'; r.error = 'Dashboard restarted. Continue explicitly to resume this conversation.'; saveRun(r); }
const analysisControl = new AnalysisControl(local);
const codex = new Codex();
let active = null, busy = false, runnerError = '', stopping = false;
const clients = new Set(), requests = new Map();
function broadcast(type, data) { for (const res of clients) res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`); }
function event(id, type, data) {
  const payload = { type, data, at: new Date().toISOString() };
  const result = db.prepare('INSERT INTO events(run,data) VALUES (?,?)').run(id, JSON.stringify(payload));
  broadcast('activity', { runId: id, seq: Number(result.lastInsertRowid), ...payload });
}
function update(r) { r.updatedAt = new Date().toISOString(); saveRun(r); broadcast('run', r); }
function clearRequests(runId) { for (const [key, req] of requests) if (req.runId === runId) requests.delete(key); broadcast('requests', [...requests.values()]); }
async function connect() {
  await codex.start();
  await codex.rpc('skills/extraRoots/set', { extraRoots: [adapterRoot] });
  const account = await codex.rpc('account/read', {});
  if (!account.account) throw new Error('Codex is not signed in. Run “codex login” in Terminal, then reconnect.');
  runnerError = '';
  broadcast('connection', { connected: true, error: '' });
  for (const r of allRuns().filter(r => r.status === 'interrupted' && r.threadId && r.turnId)) {
    try {
      const snapshot = await codex.rpc('thread/read', { threadId: r.threadId, includeTurns: true });
      const turn = snapshot.thread?.turns?.find(t => t.id === r.turnId);
      if (turn?.status === 'completed') {
        r.status = 'completed'; r.error = null;
        const answer = turn.items?.filter(i => i.type === 'agentMessage').at(-1);
        if (answer) { r.result = answer.text; event(r.id, 'item/completed', answer); }
        update(r);
      }
    } catch { /* Keep interrupted runs available for an explicit resume. */ }
  }
  return account;
}
async function pump() {
  if (busy || active || stopping) return;
  const r = allRuns().sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).find(r => r.status === 'queued' && analysisControl.allows(r,visualIds())); if (!r) return;
  busy = true; active = r.id; r.status = 'starting'; update(r);
  try {
    await connect();
    const project = getProject(r.projectId);
    const selected = r.skillIds.map(id => catalog.skills.find(s => s.id === id));
    if (selected.some(s => !s || s.compatibility === 'unsupported')) throw new Error('A selected skill is no longer runnable. Choose another skill.');
    const available = await codex.rpc('skills/list', { cwds: [project.folder], forceReload: true });
    const discovered = available.data?.flatMap(entry => entry.skills) || [];
    if (selected.some(s => !discovered.some(found => found.path === s.adapterPath))) throw new Error('Codex could not discover a selected adapter. Reindex local files and reconnect.');
    if (r.threadId) await codex.rpc('thread/resume', { threadId: r.threadId, cwd: project.folder });
    else {
      const result = await codex.rpc('thread/start', { cwd: project.folder, approvalPolicy: 'on-request', approvalsReviewer: 'user', sandbox: 'workspace-write', config: { web_search: 'live' }, developerInstructions: 'You are running in Skill Atlas, a local skill library. Follow the explicitly selected skills and their decision gates. Default to English. Keep outputs in the selected project folder. Treat source repositories as read-only. Claude plugin hooks are not installed. Ask the researcher when the workflow needs a decision; never invent answers, citations, experiments, or results. Do not run long training jobs or install integrations unless requested. Save useful deliverables as files and include paths in your final response.' });
      r.threadId = result.thread.id; saveRun(r);
    }
    if (getRun(r.id).status === 'cancelled') { active = null; return; }
    const latestPrompt = r.nextPrompt || r.prompt;
    const text = `${selected.map(s => '$' + s.adapterName).join(' ')}\n\n${latestPrompt}\n\nResearch project: ${project.folder}\nSelected local adapters (read these exact paths):\n${selected.map(s => `${s.adapterName}: ${s.adapterPath}\nOriginal source: ${s.sourcePath}`).join('\n')}\n${r.attachments?.length ? 'User-provided files:\n' + r.attachments.map(f => path.join(project.folder, f)).join('\n') : ''}\nRead selected skill instructions before responding. Clearly distinguish evidence from hypotheses.`;
    r.status = 'running'; r.error = null; delete r.nextPrompt; update(r);
    event(r.id, 'user', { text: latestPrompt });
    const result = await codex.rpc('turn/start', { threadId: r.threadId, input: [{ type: 'text', text, text_elements: [] }, ...selected.map(s => ({ type: 'skill', name: s.adapterName, path: s.adapterPath }))] });
    // Notifications can arrive before this response; never overwrite a completed/cancelled status.
    const current = getRun(r.id); current.turnId = result.turn.id; update(current);
    if (current.status === 'cancelled') await codex.rpc('turn/interrupt', { threadId: r.threadId, turnId: result.turn.id });
  } catch (e) { const current = getRun(r.id); if (current.status !== 'cancelled') { current.status = 'failed'; current.error = e.message; update(current); } active = null; clearRequests(r.id); }
  finally { busy = false; if (!active) void pump(); }
}
codex.on('disconnected', error => {
  runnerError = error.message;
  if (active) { const r = getRun(active); r.status = 'interrupted'; r.error = error.message; update(r); clearRequests(active); active = null; }
  // A lost connection must not automatically restart queued work.
  for (const r of allRuns()) if (r.status === 'queued') { r.status = 'interrupted'; r.error = 'Runner disconnected; continue to resume.'; update(r); }
  broadcast('connection', { connected: false, error: runnerError });
});
codex.on('message', msg => {
  const p = msg.params || {};
  if (msg.method === 'serverRequest/resolved') {
    requests.delete(String(p.requestId)); broadcast('requests', [...requests.values()]); return;
  }
  if (!active) {
    if (msg.id !== undefined) codex.send({ id: msg.id, error: { code: -32601, message: 'No active research run.' } });
    return;
  }
  const r = getRun(active);
  if (p.threadId && p.threadId !== r.threadId) return;
  if (msg.id !== undefined) {
    const supported = ['item/commandExecution/requestApproval', 'item/fileChange/requestApproval', 'item/permissions/requestApproval', 'item/tool/requestUserInput'];
    if (!supported.includes(msg.method)) { codex.send({ id: msg.id, error: { code: -32601, message: 'This client does not support this request.' } }); event(r.id, 'notice', { text: `Unsupported Codex request: ${msg.method}` }); return; }
    const req = { id: msg.id, runId: r.id, method: msg.method, params: p };
    requests.set(String(msg.id), req); r.status = 'waiting'; update(r); event(r.id, 'request', req); broadcast('requests', [...requests.values()]); return;
  }
  if (msg.method === 'item/agentMessage/delta') event(r.id, 'delta', { itemId: p.itemId, text: p.delta });
  if (msg.method === 'item/started' || msg.method === 'item/completed') {
    event(r.id, msg.method, p.item);
    if (msg.method === 'item/completed' && p.item?.type === 'agentMessage' && p.item.phase === 'final_answer') { r.result = p.item.text; update(r); }
  }
  if (msg.method === 'error') event(r.id, 'error', p);
  if (msg.method === 'turn/completed') {
    r.status = p.turn.status === 'completed' ? 'completed' : p.turn.status === 'interrupted' ? 'cancelled' : 'failed';
    r.error = p.turn.error?.message || null; update(r); clearRequests(r.id); active = null; void pump();
  }
});

const port = Number(process.env.RESEARCH_API_PORT || 4311);
const uiPort = Number(process.env.RESEARCH_UI_PORT || 4310);
const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`, `127.0.0.1:${uiPort}`, `localhost:${uiPort}`]);
const allowedOrigins = new Set([...allowedHosts].map(h => 'http://' + h));
function checkRequest(req) {
  if (!allowedHosts.has(req.headers.host)) throw new Error('Invalid host.');
  if (req.headers.origin && !allowedOrigins.has(req.headers.origin)) throw new Error('Origin is not allowed.');
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new Error('Cross-site request rejected.');
  if (req.method === 'POST' && !req.headers['content-type']?.startsWith('application/json')) throw new Error('Expected application/json.');
}
async function body(req) {
  let total = 0, chunks = [];
  for await (const chunk of req) { total += chunk.length; if (total > 40 * 1024 * 1024) throw new Error('Upload exceeds 30 MB of file data.'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}
function json(res, data, status = 200) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); }
function validatePrompt(value) { if (typeof value !== 'string' || !value.trim() || value.length > 50000) throw new Error('Enter a research request between 1 and 50,000 characters.'); return value.trim(); }
function enqueue(b) {
    const project = getProject(b.projectId), prompt = validatePrompt(b.prompt);
    const builtins={'academic:skill:research-agent':'atlas:skill:research-agent','business:skill:paper-reading-companion':'atlas:skill:paper-reading-companion','phd:skill:paper-verification':'atlas:skill:paper-verification'};
    if(Array.isArray(b.skillIds))b={...b,skillIds:b.skillIds.map(id=>catalog.skills.some(s=>s.id===id)?id:(builtins[id]||id))};
    if (!Array.isArray(b.skillIds) || !b.skillIds.length || b.skillIds.length > 8) throw new Error('Select between 1 and 8 skills.');
    if (b.skillIds.some(id => !catalog.skills.some(s => s.id === id && s.compatibility !== 'unsupported'))) throw new Error('Unknown or unsupported skill.');
    const attachments = b.attachments || []; if (!Array.isArray(attachments)) throw new Error('Invalid attachments.'); for (const file of attachments) safeFile(project.folder, file);
    const r = { id: randomUUID(), projectId: project.id, prompt, skillIds: [...new Set(b.skillIds)], attachments, sources: catalog.sources.map(({ id, commit }) => ({ id, commit })), status: 'queued', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), threadId: null, result: '' }; saveRun(r); broadcast('run', r); queueMicrotask(()=>void pump()); return r;
}
const papers = new Papers(db,researchRoot,enqueue,getRun);
const paperReading = new PaperReading(db,papers);
const paperVisuals = new PaperVisuals(papers);
const visualIds=()=>new Set(papers.list().papers.map(p=>p.visualRunId).filter(Boolean));
let resumingAnalysis=false;
function analysisStatus(){const ids=visualIds(),runs=allRuns().filter(r=>ids.has(r.id)),counts={};for(const r of runs)counts[r.status]=(counts[r.status]||0)+1;
 const current=runs.find(r=>['starting','running','waiting'].includes(r.status));
 const last=current?db.prepare('SELECT data FROM events WHERE run=? ORDER BY seq DESC LIMIT 1').get(current.id):null;
 return {paused:analysisControl.paused,connected:!!codex.child,error:runnerError,counts,checkedAt:new Date().toISOString(),active:current?{id:current.id,status:current.status,lastActivityAt:last?JSON.parse(last.data).at:current.updatedAt}:null,scopeRequired:papers.list().papers.filter(p=>p.scopeRequired).length};}

const readingActivity = new ReadingActivity(db,papers);
const knowledge = new Knowledge(db,papers,enqueue);
const knowledgeBase = new KnowledgeBase(db,papers,knowledge);
const paperSearch = new PaperSearch(papers,local);
const synthesis = new Synthesis(db,path.join(local,'synthesis'));
const preparation = new ResearchPreparation(local,()=>{
 const inventory=papers.list().papers;const visuals={};for(const p of inventory){try{visuals[p.id]=paperVisuals.detail(p.id);}catch(e){visuals[p.id]={error:e.message};}}
 let dataset=null;try{dataset=synthesis.dataset();}catch{}
 return {papers:inventory,visuals,dataset,state:synthesis.read().state,runs:allRuns()};
});
const preparationTimer=setInterval(()=>preparation.refresh(),60000);preparationTimer.unref();
setTimeout(()=>preparation.refresh(),1000).unref();
const readerIndex=new ReaderIndex(papers,paperVisuals,local);
async function route(req, res) {
  checkRequest(req);
  const url = new URL(req.url, `http://127.0.0.1:${port}`), key = url.pathname;
  if(key==='/api/research-preparation'){
    if(req.method==='GET')return json(res,preparation.read());
    if(req.method==='POST'){const b=await body(req);if(b.action==='refresh')return json(res,preparation.refresh(true));if(b.action==='pause')return json(res,preparation.set(false));if(b.action==='resume')return json(res,preparation.set(true));throw Error('Choose refresh, pause or resume.');}
  }
  if(req.method==='GET'&&key==='/api/synthesis')return json(res,synthesis.dataset());
  if(key==='/api/synthesis/workspace'){
    if(req.method==='GET')return json(res,synthesis.read());
    if(req.method==='POST')return json(res,synthesis.save(await body(req)));
  }
  if(req.method==='GET'&&key==='/api/synthesis/file'){
    const file=synthesis.file(url.searchParams.get('path'));
    const mime=file.endsWith('.png')?'image/png':file.endsWith('.csv')?'text/csv; charset=utf-8':'text/plain; charset=utf-8';
    await sendFile(res,file,{'Content-Type':mime,'Content-Disposition':`${url.searchParams.has('download')?'attachment':'inline'}; filename="${path.basename(file)}"`,'X-Content-Type-Options':'nosniff'});return;
  }
  if(key==='/api/paper-visuals/control'){
    if(req.method==='GET')return json(res,analysisStatus());
    if(req.method==='POST'){
      const b=await body(req);
      if(b.action==='pause'){if(resumingAnalysis)throw Error('Reconnect is in progress; try pause again shortly.');analysisControl.setPaused(true);return json(res,analysisStatus());}
      if(b.action!=='resume')throw Error('Choose pause or resume.');
      if(resumingAnalysis)throw Error('Reconnect is already in progress.');
      resumingAnalysis=true;
      try{await connect();analysisControl.resume(allRuns(),visualIds(),update);analysisControl.setPaused(false);void pump();return json(res,analysisStatus());}finally{resumingAnalysis=false;}
    }
  }
  if (req.method === 'GET' && key === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' }); res.write(': connected\n\n'); clients.add(res);
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
    req.on('close', () => { clients.delete(res); clearInterval(heartbeat); }); return;
  }
  if (req.method === 'POST' && key === '/api/sources/preview') {
    const b = await body(req);
    if (catalog.sources.some(s => (s.url && s.url.toLowerCase() === String(b.location).replace(/\/$/, '').toLowerCase()) || s.root === b.location)) throw new Error('This collection is already indexed.');
    return json(res, await sourceManager.preview(b));
  }
  if (req.method === 'POST' && key === '/api/sources/import') {
    if (active || busy) throw new Error('Wait for the active task before changing the skill library.');
    const b = await body(req); sourceManager.commit(b.token);
    catalog = buildCatalog(workspace, adapterRoot, [...sourceManager.list(),builtinCollection]);
    fs.writeFileSync(path.join(local, 'sources.json'), JSON.stringify(catalog.sources, null, 2));
    return json(res, catalog);
  }
  if (req.method === 'POST' && key === '/api/skills/favorite') {
    const b = await body(req); if (!catalog.skills.some(s => s.id === b.id)) throw new Error('Skill not found.');
    if (typeof b.favorite !== 'boolean') throw new Error('Invalid saved state.');
    if (b.favorite) db.prepare('INSERT OR IGNORE INTO favorites VALUES (?)').run(b.id);
    else db.prepare('DELETE FROM favorites WHERE id=?').run(b.id);
    return json(res, { favorites: db.prepare('SELECT id FROM favorites').all().map(r => r.id) });
  }
  if(req.method==='GET'&&key==='/api/paper-search')return json(res,paperSearch.search(Object.fromEntries(url.searchParams)));
  if(req.method==='POST'&&key==='/api/paper-search/index'){void paperSearch.build();return json(res,paperSearch.state);}
  const searchPage=key.match(/^\/api\/paper-search\/([^/]+)\/page$/);
  if(req.method==='GET'&&searchPage)return json(res,await paperSearch.page(searchPage[1],Object.fromEntries(url.searchParams)));
  if(req.method==='GET'&&key==='/api/knowledge-base')return json(res,knowledgeBase.snapshot());
  if(req.method==='GET'&&key==='/api/knowledge-base/export'){res.writeHead(200,{'Content-Type':'application/json','Content-Disposition':'attachment; filename=atlas-knowledge-base.json'});res.end(JSON.stringify(knowledgeBase.snapshot(),null,2));return;}
  if(req.method==='POST'&&key==='/api/knowledge-base/codes')return json(res,knowledgeBase.save(await body(req)));
  if(req.method==='GET'&&key==='/api/knowledge')return json(res,knowledge.map(url.searchParams.get('batchId')));
  const activityMatch=key.match(/^\/api\/paper-activity\/([^/]+)$/);
  if(activityMatch){const id=activityMatch[1],p=papers.get(id);if(req.method==='POST')return json(res,readingActivity.save(id,await body(req)));if(req.method==='GET'){
    const runs=[p.runId,p.visualRunId].filter(Boolean).map(id=>getRun(id));
    const events=runs.flatMap(r=>db.prepare("SELECT seq,data FROM events WHERE run=? AND json_extract(data, '$.type') != 'delta' ORDER BY seq DESC LIMIT 200").all(r.id).map(row=>({id:'analysis:'+row.seq,runId:r.id,channel:'analysis',...JSON.parse(row.data)}))).filter(e=>e.type!=='delta').map(e=>({...e,severity:e.type==='error'?'error':e.type==='request'?'warning':'info',text:e.type==='request'?'Your response is needed':e.type==='error'?'Analysis reported an error':e.type==='user'?'Analysis requested':e.type==='item/started'?`Started ${e.data?.type||'analysis step'}`:e.type==='item/completed'?`Finished ${e.data?.type||'analysis step'}`:'Analysis activity received'}));
    const notes=knowledge.notes(id).map(n=>({id:'note:'+n.id,at:n.updatedAt,channel:'reading',severity:'info',text:'Note saved'+(n.page?`: PDF page ${n.page}`:'')}));
    return json(res,{reading:readingActivity.get(id),runs:runs.map(r=>({id:r.id,status:r.status,error:r.error})),reviewed:p.reviewed,events:[...readingActivity.events(id),...events,...notes].sort((a,b)=>a.at.localeCompare(b.at)).slice(-200)});
  }}
  if(req.method==='GET'&&key==='/api/reading-notes')return json(res,knowledge.notes());
  if(req.method==='GET'&&key==='/api/journal-metrics')return json(res,knowledge.metrics());
  if(req.method==='GET'&&key==='/api/syntheses')return json(res,knowledge.synthesisList());
  if(req.method==='POST'&&key==='/api/syntheses')return json(res,knowledge.synthesis(await body(req)));
  const knowledgeMatch=key.match(/^\/api\/knowledge\/papers\/([^/]+)(?:\/(notes|metrics))?$/);
  if(knowledgeMatch){if(req.method==='GET')return json(res,knowledge.detail(knowledgeMatch[1]));if(req.method==='POST'&&knowledgeMatch[2]==='notes')return json(res,knowledge.saveNote(knowledgeMatch[1],await body(req)));if(req.method==='POST'&&knowledgeMatch[2]==='metrics')return json(res,knowledge.saveMetric(knowledgeMatch[1],await body(req)));}
  if(req.method==='GET'&&key==='/api/paper-reading')return json(res,paperReading.list());
  const readingRoute=key.match(/^\/api\/papers\/([^/]+)\/reading$/);
  if(readingRoute&&req.method==='GET')return json(res,paperReading.get(decodeURIComponent(readingRoute[1])));
  if(readingRoute&&req.method==='POST')return json(res,paperReading.save(decodeURIComponent(readingRoute[1]),await body(req)));
  if (req.method === 'GET' && key === '/api/papers') return json(res,papers.list());
  if (req.method === 'POST' && key === '/api/papers/import') return json(res,await papers.import(await body(req)));
  if(req.method==='GET'&&key==='/api/paper-visuals/status'){const ids=new Set(papers.list().papers.map(p=>p.visualRunId).filter(Boolean));const counts={};for(const r of allRuns().filter(r=>ids.has(r.id)))counts[r.status]=(counts[r.status]||0)+1;return json(res,counts);}
  if(req.method==='POST'&&key==='/api/paper-visuals/stop-queued'){const ids=new Set(papers.list().papers.map(p=>p.visualRunId).filter(Boolean));let cancelled=0;for(const r of allRuns().filter(r=>ids.has(r.id)&&r.status==='queued')){r.status='cancelled';update(r);cancelled++;}return json(res,{cancelled});}
  if(req.method==='POST'&&key==='/api/paper-visuals/queue'){const input=await body(req);return json(res,paperVisuals.startAll(input.batchId));}
  const readerMatch=key.match(/^\/api\/papers\/([^/]+)\/reader-index$/);if(readerMatch&&req.method==='GET')return json(res,await readerIndex.get(readerMatch[1]));
  const visualMatch=key.match(/^\/api\/papers\/([^/]+)\/visuals$/);
  if(visualMatch&&req.method==='GET')return json(res,paperVisuals.detail(visualMatch[1]));
  if(visualMatch&&req.method==='POST')return json(res,paperVisuals.start(visualMatch[1]));
  const paperMatch=key.match(/^\/api\/papers\/([^/]+)(?:\/(notes|scope|analyse|pdf))?$/);
  if(paperMatch){const id=paperMatch[1],action=paperMatch[2];
    if(req.method==='GET'&&action==='pdf'){const file=papers.pdf(id);await sendFile(res,file,{'Content-Type':'application/pdf','Content-Disposition':'inline; filename="paper.pdf"','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"});return;}
    if(req.method==='GET')return json(res,papers.detail(id));
    if(req.method==='POST'&&action==='notes')return json(res,papers.notes(id,await body(req)));
    if(req.method==='POST'&&action==='scope')return json(res,await papers.scope(id,await body(req)));
    if(req.method==='POST'&&action==='analyse')return json(res,papers.analyse(id));
  }
  const exportMatch=key.match(/^\/api\/paper-batches\/([^/]+)\/export$/);
  if(req.method==='GET'&&exportMatch){res.writeHead(200,{'Content-Type':'application/json','Content-Disposition':'attachment; filename="paper-review-records.json"'});const exported=JSON.parse(papers.export(exportMatch[1]));exported.papers=exported.papers.map(p=>({...p,linkedNotes:knowledge.notes(p.id),journalMetrics:knowledge.metrics(p.id),structuredEvidence:knowledge.evidence(p),visualEvidence:paperVisuals.detail(p.id)}));res.end(JSON.stringify(exported,null,2));return;}
  if (req.method === 'GET' && key === '/api/catalog') return json(res, catalog);
  if (req.method === 'POST' && key === '/api/catalog/refresh') {
    if (active || busy) throw new Error('Wait for the active run before refreshing skills.');
    catalog = buildCatalog(workspace, adapterRoot, [...sourceManager.list(),builtinCollection]); fs.writeFileSync(path.join(local, 'sources.json'), JSON.stringify(catalog.sources, null, 2)); return json(res, catalog);
  }
  if (req.method === 'GET' && key === '/api/state') return json(res, { favorites: db.prepare('SELECT id FROM favorites').all().map(r => r.id), projects: db.prepare('SELECT * FROM projects').all(), runs: allRuns(), requests: [...requests.values()], connected: !!codex.child, error: runnerError });
  if (req.method === 'POST' && key === '/api/connect') {
    const account = await connect();
    broadcast('connection', { connected: true, error: '' });
    return json(res, { connected: true, accountType: account.account.type });
  }
  if (req.method === 'GET' && key === '/api/health') {
    let version = '', auth = '', error = '';
    try { version = (await exec(codexExecutable(), ['--version'], { timeout: 10000 })).stdout.trim(); const x = await exec(codexExecutable(), ['login', 'status'], { timeout: 10000 }); auth = (x.stdout + x.stderr).split('\n').filter(x => !x.startsWith('WARNING:')).join('\n').trim(); } catch { error = 'Codex unavailable or not signed in. Run codex login, or set CODEX_BIN.'; }
    return json(res, { version, auth, error, node: process.version, workspace });
  }
  if (req.method === 'POST' && key === '/api/projects') {
    const b = await body(req); const name = String(b.name || '').trim(); if (!name || name.length > 100) throw new Error('Enter a project name (up to 100 characters).');
    const id = randomUUID(); let folder;
    if (b.folder) {
      if (!path.isAbsolute(b.folder)) throw new Error('Enter an absolute project folder path.');
      folder = fs.realpathSync(b.folder);
      if (!fs.statSync(folder).isDirectory()) throw new Error('Choose an existing folder.');
      if (inside(folder, appRoot) || inside(appRoot, folder) || inside(path.join(workspace, 'upstream'), folder)) throw new Error('Choose a research folder separate from the dashboard and upstream repositories.');
    } else { folder = path.join(researchRoot, name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 45) + '-' + id.slice(0, 6)); fs.mkdirSync(folder, { recursive: true }); }
    db.prepare('INSERT INTO projects VALUES (?, ?, ?)').run(id, name, folder); return json(res, { id, name, folder });
  }
  if (req.method === 'GET' && key === '/api/files') return json(res, artifacts(getProject(url.searchParams.get('projectId')).folder));
  if (req.method === 'GET' && key === '/api/file') {
    const file = safeFile(getProject(url.searchParams.get('projectId')).folder, url.searchParams.get('path'));
    if (url.searchParams.get('preview') === '1') {
      if (!/\.(md|txt|tex|bib|csv|tsv|json|log|py|r|ya?ml)$/i.test(file)) throw new Error('Preview is available for text files. Download this file to view it.');
      const fd = fs.openSync(file, 'r'); const bytes = Buffer.alloc(200000); const read = fs.readSync(fd, bytes, 0, bytes.length, 0); fs.closeSync(fd);
      return json(res, { content: bytes.subarray(0, read).toString('utf8'), truncated: fs.statSync(file).size > read });
    }
    await sendFile(res,file, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(file))}`, 'X-Content-Type-Options': 'nosniff' }); return;
  }
  if (req.method === 'POST' && key === '/api/upload') {
    const b = await body(req), project = getProject(b.projectId);
    if (!Array.isArray(b.files) || b.files.length > 20) throw new Error('Attach up to 20 files.');
    const inputs = path.join(project.folder, 'inputs');
    if (fs.existsSync(inputs) && !inside(fs.realpathSync(project.folder), fs.realpathSync(inputs))) throw new Error('Input folder is outside this project.');
    const folder = path.join(inputs, randomUUID()); fs.mkdirSync(folder, { recursive: true });
    const files = b.files.map(f => {
      const name = path.basename(String(f.name)).replace(/[^a-zA-Z0-9._ -]/g, '_'); if (!name || name === '.' || name === '..') throw new Error('Invalid file name.');
      const data = Buffer.from(String(f.data), 'base64'); const file = path.join(folder, name); fs.writeFileSync(file, data, { flag: 'wx' }); return path.relative(project.folder, file);
    }); return json(res, { files });
  }
  if (req.method === 'POST' && key === '/api/runs') {
    return json(res, enqueue(await body(req)), 201);
  }
  const runMatch = key.match(/^\/api\/runs\/([^/]+)(?:\/(events|cancel|continue))?$/);
  if (runMatch) {
    const r = getRun(runMatch[1]);
    if (req.method === 'GET') {
      if (runMatch[2] === 'events') return json(res, db.prepare('SELECT seq,data FROM events WHERE run=? ORDER BY seq').all(r.id).map(x => ({ seq: x.seq, ...JSON.parse(x.data) })));
      return json(res, r);
    }
    if (req.method === 'POST' && runMatch[2] === 'cancel') {
      if (!['queued', 'starting', 'running', 'waiting'].includes(r.status)) throw new Error('This run is not active.');
      r.status = 'cancelled'; update(r); clearRequests(r.id);
      if (r.id === active && r.turnId) await codex.rpc('turn/interrupt', { threadId: r.threadId, turnId: r.turnId });
      if (r.id !== active) void pump(); return json(res, r);
    }
    if (req.method === 'POST' && runMatch[2] === 'continue') {
      if (['running', 'waiting', 'starting', 'queued'].includes(r.status)) throw new Error('Wait for this run to finish before continuing.');
      const b = await body(req); r.nextPrompt = validatePrompt(b.prompt); r.status = 'queued'; r.error = null; r.turnId = null; update(r); void pump(); return json(res, r);
    }
  }
  const requestMatch = key.match(/^\/api\/requests\/([^/]+)$/);
  if (req.method === 'POST' && requestMatch) {
    const request = requests.get(requestMatch[1]); if (!request) throw new Error('This request has already been resolved.');
    const b = await body(req); let result;
    if (request.method === 'item/tool/requestUserInput') {
      const answers = {};
      for (const q of request.params.questions || []) { const a = b.answers?.[q.id]; if (!Array.isArray(a) || !a.length || a.some(v => typeof v !== 'string' || v.length > 10000)) throw new Error('Answer every question.'); answers[q.id] = { answers: a }; }
      result = { answers };
    } else if (request.method === 'item/permissions/requestApproval') result = { permissions: b.decision === 'accept' ? Object.fromEntries(Object.entries(request.params.permissions || {}).filter(([,v]) => v != null)) : {}, scope: 'turn' };
    else { if (!['accept', 'decline', 'cancel'].includes(b.decision)) throw new Error('Invalid approval decision.'); result = { decision: b.decision }; }
    codex.reply(request.id, result); requests.delete(requestMatch[1]); const r = getRun(request.runId); if (![...requests.values()].some(x => x.runId === r.id)) r.status = 'running'; update(r); event(r.id, 'response', { requestId: request.id, result }); broadcast('requests', [...requests.values()]); return json(res, { ok: true });
  }
  return json(res, { error: 'Not found' }, 404);
}
const server = http.createServer((req, res) => { route(req, res).catch(e => { if (!res.headersSent) {const failure=requestFailure(e);json(res,failure,failure.status);} else if(!res.destroyed) res.destroy(); }); });
server.on('error', error => { console.error(`Cannot start local API on port ${port}: ${error.message}`); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`Research API: http://127.0.0.1:${port}`));
function shutdown() { if (stopping) return; stopping = true; for (const res of clients) res.end(); codex.close(); server.close(() => { db.close(); process.exit(0); }); setTimeout(() => process.exit(0), 2000).unref(); }
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
