import fs from 'node:fs';
import path from 'node:path';
export class AnalysisControl {
 constructor(folder){this.file=path.join(folder,'analysis-control.json');this.paused=false;if(fs.existsSync(this.file)){try{this.paused=JSON.parse(fs.readFileSync(this.file,'utf8')).paused!==false;}catch{this.paused=true;}}}
 setPaused(paused){const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify({paused}));fs.renameSync(temp,this.file);this.paused=paused;}
 allows(run,ids){return !this.paused||!ids.has(run.id);}
 resume(runs,ids,update){let count=0;for(const r of runs.filter(r=>ids.has(r.id)&&['interrupted','failed'].includes(r.status)).sort((a,b)=>a.createdAt.localeCompare(b.createdAt))){if(r.threadId)r.nextPrompt='Continue the original paper extraction from the saved conversation. Inspect existing output first; preserve completed work and write the requested visual-evidence.json only if unfinished or invalid. Follow the original scope and instructions.';r.status='queued';r.error=null;r.turnId=null;update(r);count++;}return count;}
}
