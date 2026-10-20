import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCatalog, parseMetadata, walk, repositories } from '../server/catalog.mjs';
import { safeFile } from '../server/paths.mjs';
const workspace=path.resolve('..');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'research-tests-'));
test('indexes every skill and command, with unique IDs and intact reference paths',{skip:!fs.existsSync(path.join(workspace,'upstream/Academic-Research-Agent-Skill'))},()=>{
 const c=buildCatalog(workspace,path.join(scratch,'adapters'));
 const sourceFiles=repositories.filter(r=>r.kind==='skills').flatMap(r=>(r.scanRoots||['']).flatMap(sub=>walk(path.join(workspace,'upstream',r.folder,sub)))).filter(p=>p.endsWith('/SKILL.md')||/(?:^|\/)commands\/[^/]+\.md$/.test(p));
 assert.equal(c.skills.length,sourceFiles.length);assert.equal(c.skills.length,44);assert.equal(new Set(c.skills.map(s=>s.id)).size,c.skills.length);
 assert.equal(c.skills.filter(s=>s.repoId==='business').length,6);assert.equal(c.skills.filter(s=>s.kind==='skill').length,20);
 assert.equal(c.skills.filter(s=>s.compatibility==='unsupported').length,2);
 assert.equal(c.skills.filter(s=>s.repoId==='awesome').length,0);assert.ok(c.discovery.length>40);
 for(const s of c.skills){assert.equal(s.instructions,fs.readFileSync(s.sourcePath,'utf8'));if(s.compatibility!=='unsupported')assert.ok(fs.readFileSync(s.adapterPath,'utf8').includes(s.sourcePath));else assert.ok(!fs.existsSync(s.adapterPath));}
 const main=c.skills.find(s=>s.id==='academic:skill:research-agent');assert.ok(main.references.find(r=>r.path==='references/workflow.md')?.exists);
 assert.ok(c.sources.every(s=>/^[a-f0-9]{40}$/.test(s.commit)));
});
test('metadata handles folded descriptions, absent and malformed YAML',()=>{
 assert.deepEqual(parseMetadata('---\nname: example\ndescription: >\n  first\n  second\n---\n# Test','fallback'),{name:'example',description:'first second',warning:''});
 assert.equal(parseMetadata('# Title','fallback').name,'fallback');assert.ok(parseMetadata('---\nname: broken','fallback').warning);
});
test('repository-qualified IDs disambiguate duplicate source names',()=>{
 const root=path.join(scratch,'duplicate');for(const repo of ['Business-Academic-Skill','Academic-Research-Agent-Skill']){const dir=path.join(root,'upstream',repo,'skills','same');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'SKILL.md'),'---\nname: same\ndescription: duplicate\n---\nTest');}
 const c=buildCatalog(root,path.join(scratch,'duplicate-adapters'));assert.equal(c.skills.length,2);assert.equal(new Set(c.skills.map(s=>s.id)).size,2);assert.equal(new Set(c.skills.map(s=>s.adapterPath)).size,2);
});
test('file access rejects traversal, absolute paths and symlink escapes',()=>{
 const root=path.join(scratch,'project');fs.mkdirSync(root);fs.writeFileSync(path.join(root,'paper.md'),'safe');fs.writeFileSync(path.join(scratch,'outside.txt'),'outside');fs.symlinkSync(path.join(scratch,'outside.txt'),path.join(root,'escape'));
 assert.equal(safeFile(root,'paper.md'),fs.realpathSync(path.join(root,'paper.md')));assert.throws(()=>safeFile(root,'../outside.txt'));assert.throws(()=>safeFile(root,path.join(scratch,'outside.txt')));assert.throws(()=>safeFile(root,'escape'));
});
test('curated skill files avoid indexing nested pipelines and directory contents',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-curated-'));
 for(const rel of ['skills/reader/SKILL.md','skills/reader/nested/SKILL.md']){const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,'---\nname: '+(rel.includes('nested')?'nested':'reader')+'\ndescription: bounded\n---\nRead source.');}
 const c=buildCatalog('/nonexistent',path.join(root,'adapters'),[{id:'curated',folder:'curated',root,kind:'skills',imported:true,skillFiles:['skills/reader/SKILL.md']},{id:'directory',root,kind:'directory'}]);
 assert.equal(c.skills.length,1);assert.equal(c.skills[0].name,'reader');assert.equal(c.sources.find(s=>s.id==='directory').skillCount,0);
});
