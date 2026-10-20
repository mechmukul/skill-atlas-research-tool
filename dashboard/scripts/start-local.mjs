import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url='http://127.0.0.1:4310';
async function health(){try{const r=await fetch('http://127.0.0.1:4313/api/desktop-health',{signal:AbortSignal.timeout(1200)});const h=await r.json();return h.application==='skill-atlas'&&h.workspace===path.dirname(root)?h:null;}catch{return null;}}
const existing=await health();
if(process.argv.includes('--stop')){if(existing?.launcherPid){process.kill(existing.launcherPid,'SIGTERM');for(let i=0;i<80;i++){if(!await health())break;await new Promise(r=>setTimeout(r,100));}console.log('Skill Atlas stopped.');}else console.log('Skill Atlas is not running through this launcher.');process.exit(0);}
if(existing){console.log('Skill Atlas is already running.');if(process.argv.includes('--open'))spawn('open',[url],{stdio:'ignore'}).unref();process.exit(0);}
if(Number(process.versions.node.split('.')[0])<24)throw Error('Skill Atlas requires Node.js 24 or newer.');
if(!fs.existsSync(path.join(root,'node_modules/vite')))throw Error('Dependencies missing. Run npm ci --prefix dashboard.');
const children=[];let closing=false;
function close(code=0){if(closing)return;closing=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>{for(const child of children)if(child.exitCode===null)child.kill('SIGKILL');process.exit(code);},3500);}
for(const args of [['server/topic-gateway.mjs'],['node_modules/vite/bin/vite.js','--host','127.0.0.1']]){const child=spawn(process.execPath,args,{cwd:root,stdio:'inherit',env:{...process.env,ATLAS_LAUNCHER_PID:String(process.pid)}});children.push(child);child.on('error',e=>{console.error(e.message);close(1);});child.on('exit',code=>{if(!closing)close(code||1);});}
process.on('SIGINT',()=>close());process.on('SIGTERM',()=>close());
let ready=false;
for(let i=0;i<180&&!closing;i++){try{const r=await fetch(url,{signal:AbortSignal.timeout(2000)});if(r.ok&&await health()){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}
if(!ready&&!closing){console.error('Atlas could not start within 90 seconds. See the service errors above.');close(1);}
if(ready){console.log('Skill Atlas ready: '+url);if(process.argv.includes('--open'))spawn('open',[url],{stdio:'ignore'}).unref();}
