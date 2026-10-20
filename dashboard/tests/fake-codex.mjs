#!/usr/bin/env node
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
let roots=[];
let thread=0,turn=0;const callbacks=new Map();
const send=x=>process.stdout.write(JSON.stringify(x)+'\n');
function done(t,text='Mock research output'){send({method:'item/agentMessage/delta',params:{threadId:t.threadId,itemId:t.id,delta:text}});send({method:'item/completed',params:{threadId:t.threadId,item:{id:t.id,type:'agentMessage',phase:'final_answer',text}}});send({method:'turn/completed',params:{threadId:t.threadId,turn:{id:t.id,status:'completed'}}});}
readline.createInterface({input:process.stdin}).on('line',line=>{const m=JSON.parse(line);if(!m.method){const fn=callbacks.get(m.id);callbacks.delete(m.id);fn?.(m.result);return;}const result=r=>send({id:m.id,result:r});
 if(m.method==='initialize')return result({userAgent:'fake-codex'});
 if(m.method==='initialized')return;
 if(m.method==='skills/extraRoots/set'){roots=m.params.extraRoots;return result({});}
 if(m.method==='skills/list')return result({data:[{skills:roots.flatMap(root=>fs.readdirSync(root).filter(name=>fs.existsSync(path.join(root,name,'SKILL.md'))).map(name=>({name,path:path.join(root,name,'SKILL.md')}))),errors:[]}]});
 if(m.method==='account/read')return result({account:process.env.FAKE_AUTH_FAIL?null:{type:'chatgpt'}});
 if(m.method==='thread/start')return result({thread:{id:'thread-'+(++thread)}});
 if(m.method==='thread/resume'||m.method==='thread/read')return result({thread:{id:m.params.threadId,status:{type:'idle'},turns:[]}});
 if(m.method==='turn/interrupt'){result({});send({method:'turn/completed',params:{threadId:m.params.threadId,turn:{id:m.params.turnId,status:'interrupted'}}});return;}
 if(m.method==='turn/start'){
  const t={id:'turn-'+(++turn),threadId:m.params.threadId};result({turn:{id:t.id,status:'inProgress'}});const text=m.params.input[0].text;
  if(text.includes('SLOW'))return;
  if(text.includes('ASK')){const id=900+turn;callbacks.set(id,r=>done(t,JSON.stringify(r)));return setTimeout(()=>send({id,method:'item/tool/requestUserInput',params:{threadId:t.threadId,questions:[{id:'scope',header:'Scope',question:'Which scope?',options:[{label:'Small',description:'Small sample'}]}]}}),20);}
  if(text.includes('APPROVE')){const id=900+turn;callbacks.set(id,r=>done(t,'Decision: '+r.decision));return setTimeout(()=>send({id,method:'item/commandExecution/requestApproval',params:{threadId:t.threadId,command:'echo test',reason:'Mock approval'}}),20);}
  return setTimeout(()=>done(t),20);
 }
 result({});
});
