import fs from 'node:fs';
export function codexExecutable(){return process.env.CODEX_BIN||['/opt/homebrew/bin/codex','/usr/local/bin/codex','/Applications/Codex.app/Contents/Resources/codex','/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex'].find(file=>{try{fs.accessSync(file,fs.constants.X_OK);return true;}catch{return false;}})||'codex';}
