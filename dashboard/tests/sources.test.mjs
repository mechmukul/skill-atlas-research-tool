import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SourceManager, githubRepository } from '../server/sources.mjs';
import { buildCatalog } from '../server/catalog.mjs';
test('GitHub import accepts repository roots and rejects other hosts and credentials',()=>{
 assert.equal(githubRepository('https://github.com/owner/repo.git').url,'https://github.com/owner/repo');
 for(const url of ['http://github.com/a/b','https://evil.com/a/b','https://github.com@evil.com/a/b','https://user:pass@github.com/a/b','https://github.com/a/b/tree/main','https://github.com/a/b?x=1','file:///tmp/repo'])assert.throws(()=>githubRepository(url));
});
test('local previews persist only on commit, preserve references and disambiguate same names',async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-import-'));const local=path.join(tmp,'state');fs.mkdirSync(local);const collection=path.join(tmp,'collection');
 for(const [name,content] of [['a','First'],['b','Second'],['copy','First']]){const dir=path.join(collection,name);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'SKILL.md'),`---\nname: same\ndescription: ${content}\n---\nRead [support](reference.md).`);fs.writeFileSync(path.join(dir,'reference.md'),'Supporting instructions');}
 const manager=new SourceManager(local,tmp);const preview=await manager.preview({type:'local',location:collection,label:'My collection'});assert.equal(preview.count,3);assert.equal(manager.list().length,0);manager.commit(preview.token);assert.equal(new SourceManager(local,tmp).list().length,1);assert.throws(()=>manager.commit(preview.token));await assert.rejects(()=>manager.preview({type:'local',location:collection}));
 const c=buildCatalog(tmp,path.join(tmp,'adapters'),manager.list());assert.equal(c.skills.length,2);assert.equal(new Set(c.skills.map(s=>s.id)).size,2);assert.equal(new Set(c.skills.map(s=>s.adapterPath)).size,2);for(const s of c.skills){assert.ok(s.references.some(r=>r.exists));assert.equal(s.source,null);assert.ok(s.domain);}
 await assert.rejects(()=>manager.preview({type:'local',location:tmp}));await assert.rejects(()=>manager.preview({type:'local',location:'relative'}));
});
