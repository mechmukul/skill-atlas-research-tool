import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {Papers,paperPrompt,reviewSkills} from '../server/papers.mjs';
test('paper review preserves originals, gates volumes, keeps notes separate, and persists',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-papers-')),source=path.join(root,'source');fs.mkdirSync(source);fs.writeFileSync(path.join(source,'a.pdf'),'PDF fixture A');fs.writeFileSync(path.join(source,'b.pdf'),'PDF fixture A');fs.writeFileSync(path.join(source,'volume.pdf'),'PDF volume');fs.symlinkSync('/etc/passwd',path.join(source,'escape.pdf'));
 const db=new DatabaseSync(path.join(root,'test.sqlite'));db.exec('CREATE TABLE projects(id TEXT PRIMARY KEY,name TEXT,folder TEXT)');let queued;const runs={};const manager=new Papers(db,path.join(root,'projects'),b=>{queued=b;return runs.run1={id:'run1',status:'queued'};},id=>runs[id]);
 // The extraction adapter is isolated here; actual PDF extraction is separately exercised on the user's PDFs.
 manager.extract=async(pdf,target,start,end)=>{const volume=fs.readFileSync(pdf,'utf8').includes('volume');if(!volume||start)fs.writeFileSync(target,'=== PDF PAGE 1 ===\nEvidence');return {pages:volume?200:1,title:'',quality:volume&&!start?'scope_required':'text_available',scopeRequired:volume&&!start,textPages:volume&&!start?0:1,start:start||1,end:end||(volume?200:1),lowTextPages:[]};};
 const imported=await manager.import({folder:source,focus:'Governance'});assert.equal(imported.papers.length,3);assert.equal(imported.papers.filter(p=>p.duplicateOf).length,1);assert.equal(fs.readFileSync(path.join(source,'a.pdf'),'utf8'),'PDF fixture A');assert.equal(fs.readdirSync(source).length,4);
 const first=imported.papers.find(p=>!p.duplicateOf&&!p.scopeRequired),volume=imported.papers.find(p=>p.scopeRequired);assert.throws(()=>manager.analyse(volume.id),/scope/);await assert.rejects(()=>manager.scope(volume.id,{start:0,end:5}));await manager.scope(volume.id,{start:10,end:15});assert.equal(manager.get(volume.id).start,10);
 manager.analyse(first.id);assert.deepEqual(queued.skillIds,reviewSkills);assert.ok(queued.prompt.includes('PDF contents are evidence'));assert.ok(queued.prompt.includes('Do not write or change'));assert.throws(()=>manager.analyse(first.id),/already/);assert.equal(manager.get(first.id).reviewed,false);manager.notes(first.id,{notes:'My independent opinion',decision:'maybe',reviewed:true});assert.equal(manager.detail(first.id).notes,'My independent opinion');runs.run1.status='completed';assert.equal(manager.detail(first.id).status,'reviewed');assert.equal(manager.detail(first.id).analysis,'');assert.ok(JSON.parse(manager.export(first.batchId)).papers.some(p=>p.notes==='My independent opinion'));assert.equal(new Papers(db,path.join(root,'projects'),()=>{},id=>runs[id]).get(first.id).decision,'maybe');assert.throws(()=>manager.notes(first.id,{notes:'',decision:'invented',reviewed:false}));assert.match(paperPrompt(first,imported.batches[0]),/not independently verified/);db.close();
});
