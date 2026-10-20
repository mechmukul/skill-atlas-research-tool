import fs from 'node:fs';
import path from 'node:path';
export function inside(root, candidate) {
  const rel = path.relative(root, candidate);
  return rel === '' || (!rel.startsWith('..' + path.sep) && rel !== '..' && !path.isAbsolute(rel));
}
export function safeFile(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error('Use a project-relative file path.');
  const realRoot = fs.realpathSync(root);
  if (!inside(realRoot, path.resolve(realRoot, relative))) throw new Error('File is outside this project.');
  const full = fs.realpathSync(path.resolve(realRoot, relative));
  if (!inside(realRoot, full) || !fs.statSync(full).isFile()) throw new Error('File is outside this project.');
  return full;
}
export function artifacts(root) {
  const out = [];
  function scan(dir, depth) {
    if (depth > 6 || out.length >= 500) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isSymbolicLink() || ['.git', 'node_modules', '.venv', '.codex', '.agents', '__pycache__'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) scan(p, depth + 1);
      else out.push({ path: path.relative(root, p), size: fs.statSync(p).size, modified: fs.statSync(p).mtime.toISOString() });
    }
  }
  scan(root, 0);
  return out.sort((a,b) => b.modified.localeCompare(a.modified));
}
