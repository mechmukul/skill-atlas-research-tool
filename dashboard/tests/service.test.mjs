import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
const state=fs.mkdtempSync(path.join(os.tmpdir(),'research-api-test-'));
const base='http://127.0.0.1:44311/api';let child;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function launch(extra={}){child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,RESEARCH_STATE_DIR:state,RESEARCH_PROJECT_ROOT:path.join(state,'projects'),RESEARCH_API_PORT:'44311',RESEARCH_UI_PORT:'44310',CODEX_BIN:path.resolve('tests/fake-codex.mjs'),...extra},stdio:['ignore','pipe','pipe']});let logs='';child.stderr.on('data',b=>logs+=b);for(let n=0;n<80;n++){try{await fetch(base+'/state');return;}catch{}await delay(50);}throw new Error('Server failed: '+logs);}
async function stop(){if(!child)return;const ended=once(child,'exit');child.kill('SIGTERM');await ended;child=null;}
async function api(url,data,headers={}){const res=await fetch(base+url,{...(data?{method:'POST',body:JSON.stringify(data),headers:{'Content-Type':'application/json',...headers}}:{headers})});const value=await res.json();if(!res.ok)throw new Error(value.error);return value;}
async function until(fn){for(let i=0;i<100;i++){const value=await fn();if(value)return value;await delay(30);}throw new Error('Condition did not settle.');}
const selected=['atlas:skill:research-agent'];
test('service lifecycle, queue, approvals, questions, uploads and recovery',async t=>{
 await launch();t.after(stop);const initial=await api('/state'),projectId=initial.projects[0].id;
 assert.equal((await api('/paper-visuals/control',{action:'pause'})).paused,true);await stop();await launch();assert.equal((await api('/paper-visuals/control')).paused,true);assert.equal((await api('/paper-visuals/control',{action:'resume'})).paused,false);await assert.rejects(()=>api('/paper-visuals/control',{action:'invalid'}),/pause or resume/);
 const create=prompt=>api('/runs',{projectId,skillIds:selected,prompt});
 const fixture=path.join(state,'import-fixture');fs.mkdirSync(fixture);fs.writeFileSync(path.join(fixture,'SKILL.md'),'---\nname: writing-helper\ndescription: Edit prose clearly\n---\nImprove writing.');const imported=await api('/sources/preview',{type:'local',location:fixture});const catalog=await api('/sources/import',{token:imported.token});assert.ok(catalog.skills.some(s=>s.name==='writing-helper'));await api('/skills/favorite',{id:selected[0],favorite:true});assert.ok((await api('/state')).favorites.includes(selected[0]));
 await assert.rejects(()=>api('/runs',{projectId,skillIds:['phd:command:setup'],prompt:'test'}),/unsupported/);
 await assert.rejects(()=>api('/projects',{name:'Blocked',folder:path.resolve('..')}),/separate/);
 await assert.rejects(()=>api('/runs',{projectId,skillIds:selected,prompt:'test'},{Origin:'https://evil.example'}),/Origin/);
 const upload=await api('/upload',{projectId,files:[{name:'test.md',data:Buffer.from('Research fixture').toString('base64')}]});const preview=await api('/file?projectId='+projectId+'&path='+encodeURIComponent(upload.files[0])+'&preview=1');assert.equal(preview.content,'Research fixture');
 await assert.rejects(()=>api('/file?projectId='+projectId+'&path=../../dashboard/package.json'),/outside/);
 let r=await create('SLOW');await until(async()=> (await api('/runs/'+r.id)).status==='running');const queued=await create('queued');assert.equal((await api('/runs/'+queued.id)).status,'queued');await api('/runs/'+r.id+'/cancel',{});await until(async()=> (await api('/runs/'+queued.id)).status==='completed');assert.equal((await api('/runs/'+r.id)).status,'cancelled');
 for(const decision of ['accept','decline']){r=await create('APPROVE');const request=await until(async()=> (await api('/state')).requests.find(q=>q.runId===r.id));assert.equal((await api('/runs/'+r.id)).status,'waiting');await api('/requests/'+request.id,{decision});await until(async()=> (await api('/runs/'+r.id)).status==='completed');assert.match((await api('/runs/'+r.id)).result,new RegExp(decision));}
 r=await create('ASK');const request=await until(async()=> (await api('/state')).requests.find(q=>q.runId===r.id));await assert.rejects(()=>api('/requests/'+request.id,{answers:{}}),/every question/);await api('/requests/'+request.id,{answers:{scope:['Small']}});await until(async()=> (await api('/runs/'+r.id)).status==='completed');const threadId=(await api('/runs/'+r.id)).threadId;await api('/runs/'+r.id+'/continue',{prompt:'follow up'});await until(async()=> (await api('/runs/'+r.id)).status==='completed');assert.equal((await api('/runs/'+r.id)).threadId,threadId);assert.ok((await api('/runs/'+r.id+'/events')).some(e=>e.type==='delta'));
 r=await create('SLOW');await until(async()=> (await api('/runs/'+r.id)).status==='running');await stop();await launch();assert.ok((await api('/state')).favorites.includes(selected[0]));assert.ok((await api('/catalog')).skills.some(s=>s.name==='writing-helper'));const saved=await api('/runs/'+r.id);assert.equal(saved.status,'interrupted');assert.ok(saved.threadId);assert.equal((await api('/state')).requests.length,0);await api('/runs/'+r.id+'/continue',{prompt:'explicit resume'});await until(async()=> (await api('/runs/'+r.id)).status==='completed');
 await stop();await launch({FAKE_AUTH_FAIL:'1'});r=await create('auth');await until(async()=> (await api('/runs/'+r.id)).status==='failed');assert.match((await api('/runs/'+r.id)).error,/not signed in/);
});
