import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const workspace=path.resolve(import.meta.dirname,'../..');
const destination=process.argv[2]?path.resolve(process.argv[2]):path.join(workspace,'output/github-release/skill-atlas');
if(destination===workspace||workspace.startsWith(destination+path.sep))throw Error('Choose a separate package directory');
if(fs.existsSync(destination)&&fs.readdirSync(destination).length)throw Error('Destination must be empty; existing packages are preserved');
fs.mkdirSync(destination,{recursive:true});const app=path.join(destination,'dashboard');fs.mkdirSync(app,{recursive:true});
for(const folder of ['app','components','hooks','lib','server','tests','registry','vendor','db','drizzle','design-system','build','desktop','workflows'])if(fs.existsSync(path.join(workspace,'dashboard',folder)))fs.cpSync(path.join(workspace,'dashboard',folder),path.join(app,folder),{recursive:true,filter:source=>!['.DS_Store','__pycache__'].includes(path.basename(source))});
for(const name of ['package.json','package-lock.json','components.json','tsconfig.json','next-env.d.ts','next.config.ts','vite.config.ts','postcss.config.mjs','eslint.config.mjs','drizzle.config.ts','cloudflare-env.d.ts','.npmrc'])if(fs.existsSync(path.join(workspace,'dashboard',name)))fs.copyFileSync(path.join(workspace,'dashboard',name),path.join(app,name));
fs.mkdirSync(path.join(app,'scripts'),{recursive:true});for(const name of ['start-local.mjs','build-mac-app.mjs','package-skeleton.mjs','install-ci.mjs','install-ci.sh'])fs.copyFileSync(path.join(workspace,'dashboard/scripts',name),path.join(app,'scripts',name));
fs.mkdirSync(path.join(app,'public'),{recursive:true});for(const name of ['favicon.svg','file.svg','globe.svg','window.svg'])fs.copyFileSync(path.join(workspace,'dashboard/public',name),path.join(app,'public',name));
fs.writeFileSync(path.join(app,'public/atlas-integrations.json'),JSON.stringify({sources:[],generatedAt:null}));
for(const name of ['Start Skill Atlas.command','Stop Skill Atlas.command']){fs.copyFileSync(path.join(workspace,name),path.join(destination,name));fs.chmodSync(path.join(destination,name),0o755);}
const screenshots=path.join(workspace,'docs/screenshots');
if(fs.existsSync(screenshots))fs.cpSync(screenshots,path.join(destination,'docs/screenshots'),{recursive:true,filter:source=>path.basename(source)!=='.DS_Store'});
for(const name of ['SECURITY.md','CHANGELOG.md','docs/security-review-2026-10-21.md','docs/START-HERE.md','docs/research-workflow.svg']){const source=path.join(workspace,name);if(fs.existsSync(source)){fs.mkdirSync(path.dirname(path.join(destination,name)),{recursive:true});fs.copyFileSync(source,path.join(destination,name));}}
fs.copyFileSync(path.join(workspace,'dashboard/desktop/PUBLIC-README.md'),path.join(destination,'README.md'));
fs.copyFileSync(path.join(workspace,'dashboard/desktop/VALIDATION.md'),path.join(destination,'VALIDATION.md'));
fs.writeFileSync(path.join(destination,'package.json'),JSON.stringify({name:'skill-atlas',version:'1.0.0',private:true,scripts:{start:'npm --prefix dashboard start',stop:'node dashboard/scripts/start-local.mjs --stop','app:mac':'node dashboard/scripts/build-mac-app.mjs',test:'npm test --prefix dashboard',typecheck:'npm run typecheck --prefix dashboard',build:'npm run build --prefix dashboard'}},null,2));
fs.writeFileSync(path.join(destination,'.gitignore'),'node_modules/\n.local/\nresearch/\nupstream/\noutput/\ndist/\n.next/\n.wrangler/\n.sites-runtime/\n.env\n.env.*\n!.env.example\n*.sqlite*\n*.db\n*.tsbuildinfo\n__pycache__/\n*.pyc\n.DS_Store\n');
fs.writeFileSync(path.join(app,'requirements.txt'),'pypdf>=5\nPyMuPDF>=1.24\n');
const files=[];function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else files.push({path:path.relative(destination,file),bytes:fs.statSync(file).size,sha256:createHash('sha256').update(fs.readFileSync(file)).digest('hex')});}}walk(destination);
fs.writeFileSync(path.join(destination,'MANIFEST.json'),JSON.stringify({version:'1.0.0',files,excluded:['Research papers and extracted text','SQLite databases and run history','Research drafts and notes','Local topic profiles','Account credentials','Machine-specific integration and paper mappings','Downloaded upstream repositories','Built applications and dependencies']},null,2));
const archive=destination+'.zip';execFileSync('/usr/bin/ditto',['-c','-k','--keepParent',destination,archive]);console.log(JSON.stringify({directory:destination,archive,files:files.length,sha256:createHash('sha256').update(fs.readFileSync(archive)).digest('hex')},null,2));
