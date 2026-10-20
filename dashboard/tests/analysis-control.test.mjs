import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {AnalysisControl} from '../server/analysis-control.mjs';
test('pause survives restart and blocks paper queue only; resume preserves IDs and completed/cancelled work',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-control-'));try{const c=new AnalysisControl(dir),ids=new Set(['a','b','c','d']);c.setPaused(true);assert.equal(new AnalysisControl(dir).paused,true);assert.equal(c.allows({id:'a'},ids),false);assert.equal(c.allows({id:'other'},ids),true);
 const runs=[{id:'a',status:'completed'},{id:'b',status:'interrupted',createdAt:'1',threadId:'saved-thread'},{id:'c',status:'cancelled'},{id:'d',status:'failed',createdAt:'2',prompt:'original'},{id:'other',status:'interrupted'}];const saved=[];assert.equal(c.resume(runs,ids,r=>saved.push(r)),2);assert.deepEqual(saved.map(r=>r.id),['b','d']);assert.equal(saved[0].threadId,'saved-thread');assert.match(saved[0].nextPrompt,/saved conversation/);assert.equal(saved[1].prompt,'original');assert.equal(runs[0].status,'completed');assert.equal(runs[2].status,'cancelled');assert.equal(c.resume(runs,ids,()=>{}),0);c.setPaused(false);assert.equal(new AnalysisControl(dir).paused,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
