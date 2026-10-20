import http from 'node:http';
import {preparation} from '../scripts/prepare-research.mjs';
const origins=new Set(['http://127.0.0.1:4310','http://localhost:4310']);
const server=http.createServer(async(req,res)=>{
 const origin=req.headers.origin;if(origin&&!origins.has(origin)){res.writeHead(403);res.end();return;}
 if(origin)res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
 if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
 if(req.url!=='/api/research-preparation'){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type','application/json');
 try{let result=preparation.read();if(req.method==='POST'){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>1000)throw Error('Request too large');}const {action}=JSON.parse(raw);if(action==='refresh')result=preparation.refresh(true);else if(action==='resume'||action==='pause')result=preparation.set(action==='resume');else throw Error('Unknown action');}else if(req.method!=='GET')throw Error('Unsupported method');res.end(JSON.stringify(result));}catch(e){res.writeHead(400);res.end(JSON.stringify({error:e.message}));}
});
preparation.refresh();const timer=setInterval(()=>preparation.refresh(),60000);
server.listen(4312,'127.0.0.1',()=>console.log('Atlas preparation service: http://127.0.0.1:4312'));
function stop(){clearInterval(timer);server.close(()=>process.exit(0));}process.on('SIGTERM',stop);process.on('SIGINT',stop);
