import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {Topics} from './topics.mjs';
const root=path.resolve(import.meta.dirname,'..');
const topics=new Topics(process.env.ATLAS_STATE_ROOT||path.join(root,'.local'));
const gatewayPort=Number(process.env.ATLAS_GATEWAY_PORT||4313),uiPort=Number(process.env.RESEARCH_UI_PORT||4310),workerBase=Number(process.env.ATLAS_WORKER_BASE||4410);
const workers=new Map();let closing=false;
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function topicId(req,url){let reference;try{reference=new URL(req.headers.referer);}catch{}return req.headers['x-atlas-topic']||url.searchParams.get('topic')||reference?.searchParams.get('topic')||'main';}
async function worker(id){topics.get(id);if(workers.has(id))return workers.get(id).ready;const paths=topics.paths(id),port=workerBase+topics.read().topics.findIndex(t=>t.id===id);fs.mkdirSync(paths.local,{recursive:true});
 const child=spawn(process.execPath,['server/index.mjs'],{cwd:root,stdio:'inherit',env:{...process.env,RESEARCH_API_PORT:String(port),RESEARCH_UI_PORT:String(uiPort),RESEARCH_STATE_DIR:paths.local,RESEARCH_PROJECT_ROOT:paths.research||path.join(root,'../research'),ATLAS_TOPIC_ID:id}});
 const entry={child,port,ready:null};workers.set(id,entry);child.on('exit',()=>workers.delete(id));child.on('error',()=>workers.delete(id));
 entry.ready=(async()=>{for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Research service stopped; inspect Atlas logs');try{const r=await fetch(`http://127.0.0.1:${port}/api/state`,{signal:AbortSignal.timeout(1000)});if(r.ok)return port;}catch{}await new Promise(r=>setTimeout(r,100));}child.kill();throw Error('Research service startup timed out');})();return entry.ready;}
const server=http.createServer(async(req,res)=>{try{
 const valid=new Set([`127.0.0.1:${uiPort}`,`localhost:${uiPort}`,`127.0.0.1:${gatewayPort}`,`localhost:${gatewayPort}`]);
 if(!valid.has(req.headers.host)||req.headers['sec-fetch-site']==='cross-site'||(req.headers.origin&&![`http://127.0.0.1:${uiPort}`,`http://localhost:${uiPort}`].includes(req.headers.origin)))return send(res,403,{error:'Origin rejected'});
 const url=new URL(req.url,'http://127.0.0.1:4313');const id=topicId(req,url);topics.get(id);
 if(url.pathname==='/api/desktop-health')return send(res,200,{application:'skill-atlas',workspace:path.dirname(root),pid:process.pid,launcherPid:Number(process.env.ATLAS_LAUNCHER_PID)||null});
 if(url.pathname==='/api/topics'){
 if(req.method==='GET')return send(res,200,{...topics.read(),current:id});
 if(req.method!=='POST'||!req.headers['content-type']?.startsWith('application/json'))return send(res,405,{error:'Expected JSON POST'});
 let raw='';for await(const c of req){raw+=c;if(raw.length>16000)throw Error('Request too large');}return send(res,200,{...topics.update(JSON.parse(raw)),current:id});}
 if(url.pathname==='/api/topic-config')return send(res,200,{topic:topics.get(id),profile:topics.read().profile});
 const port=await worker(id);url.searchParams.delete('topic');const upstream=http.request({hostname:'127.0.0.1',port,path:url.pathname+url.search,method:req.method,headers:{...req.headers,host:'127.0.0.1:'+port}},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
 upstream.on('error',e=>{if(!res.headersSent)send(res,502,{error:e.message});else res.destroy();});res.on('close',()=>upstream.destroy());req.pipe(upstream);
 }catch(e){if(!res.headersSent)send(res,400,{error:e.message});else res.destroy();}});
server.listen(gatewayPort,'127.0.0.1',()=>console.log('Atlas topic gateway ready'));
function stop(){if(closing)return;closing=true;server.close();for(const {child} of workers.values())child.kill('SIGTERM');setTimeout(()=>{for(const {child} of workers.values())child.kill('SIGKILL');process.exit(0);},2500).unref();}process.on('SIGTERM',stop);process.on('SIGINT',stop);
server.on('error',e=>{console.error(e.message);stop();process.exitCode=1;});
