import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
const workspace=path.resolve(import.meta.dirname,'../..');
const target=path.join(workspace,'output','Skill Atlas.app');
const contents=path.join(target,'Contents');fs.mkdirSync(path.join(contents,'MacOS'),{recursive:true});
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
fs.writeFileSync(path.join(contents,'Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>SkillAtlas</string><key>CFBundleIconFile</key><string>Atlas</string><key>CFBundleIdentifier</key><string>local.skillatlas.desktop</string><key>CFBundleName</key><string>Skill Atlas</string><key>CFBundleDisplayName</key><string>Skill Atlas</string><key>CFBundleVersion</key><string>1</string><key>CFBundleShortVersionString</key><string>0.2.0</string><key>LSMinimumSystemVersion</key><string>12.0</string><key>NSHighResolutionCapable</key><true/><key>AtlasWorkspace</key><string>${xml(workspace)}</string><key>AtlasNode</key><string>${xml(process.execPath)}</string><key>NSAppTransportSecurity</key><dict><key>NSAllowsLocalNetworking</key><true/></dict></dict></plist>`);
execFileSync('/usr/bin/swiftc',['dashboard/desktop/SkillAtlas.swift','-o',path.join(contents,'MacOS','SkillAtlas'),'-framework','Cocoa','-framework','WebKit','-module-cache-path','/tmp/atlas-swift-module-cache'],{cwd:workspace,stdio:'inherit'});
const resources=path.join(contents,'Resources');fs.mkdirSync(resources,{recursive:true});
const iconset=path.join(workspace,'output/Atlas.iconset');fs.mkdirSync(iconset,{recursive:true});
const renderer=path.join(workspace,'output/atlas-icon-renderer');
execFileSync('/usr/bin/swiftc',['dashboard/desktop/RenderIcon.swift','-o',renderer,'-module-cache-path','/tmp/atlas-swift-module-cache'],{cwd:workspace,stdio:'inherit'});
execFileSync(renderer,[path.join(iconset,'icon_512x512@2x.png')]);
for(const size of [16,32,128,256,512])for(const scale of [1,2]){if(size===512&&scale===2)continue;execFileSync('/usr/bin/sips',['-z',String(size*scale),String(size*scale),path.join(iconset,'icon_512x512@2x.png'),'--out',path.join(iconset,`icon_${size}x${size}${scale===2?'@2x':''}.png`)],{stdio:'ignore'});}
const chunks=[['icp4','icon_16x16.png'],['icp5','icon_32x32.png'],['ic07','icon_128x128.png'],['ic08','icon_256x256.png'],['ic09','icon_512x512.png'],['ic10','icon_512x512@2x.png']].map(([type,name])=>{const png=fs.readFileSync(path.join(iconset,name));const header=Buffer.alloc(8);header.write(type);header.writeUInt32BE(png.length+8,4);return Buffer.concat([header,png]);});const iconHeader=Buffer.alloc(8);iconHeader.write('icns');iconHeader.writeUInt32BE(chunks.reduce((n,b)=>n+b.length,8),4);fs.writeFileSync(path.join(resources,'Atlas.icns'),Buffer.concat([iconHeader,...chunks]));
fs.rmSync(iconset,{recursive:true,force:true});fs.rmSync(renderer);
const runtime=path.join(contents,'Resources/runtime');fs.mkdirSync(runtime,{recursive:true});
const bundled=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node');
const nodeSource=process.env.ATLAS_NODE_RUNTIME||(fs.existsSync(bundled)?bundled:process.execPath);
const copied=new Map();
function copyBinary(source,name){const destination=path.join(runtime,name);if(copied.has(source))return;copied.set(source,destination);fs.copyFileSync(source,destination);fs.chmodSync(destination,0o755);
 const links=execFileSync('/usr/bin/otool',['-L',source],{encoding:'utf8'}).split('\n').slice(1).map(line=>line.trim().split(' ')[0]).filter(link=>link.startsWith('/opt/')||link.startsWith('/usr/local/'));
 for(const link of links){const libName=path.basename(link);copyBinary(link,libName);execFileSync('/usr/bin/install_name_tool',['-change',link,'@loader_path/'+libName,destination]);}
 execFileSync('/usr/bin/codesign',['--force','--sign','-',destination],{stdio:'inherit'});
}
copyBinary(nodeSource,'node');
execFileSync('/usr/bin/codesign' ,['--force','--deep','--sign','-',target],{stdio:'inherit'});
console.log(target);
