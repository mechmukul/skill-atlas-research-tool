import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { walk, parseMetadata } from './catalog.mjs';
const exec = promisify(execFile);
export function githubRepository(value) {
  let url; try { url = new URL(value); } catch { throw new Error('Enter an HTTPS GitHub repository URL.'); }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password || url.port || url.search || url.hash) throw new Error('Use an HTTPS github.com repository URL without credentials or query parameters.');
  const parts = url.pathname.replace(/\/$/, '').replace(/\.git$/, '').split('/').filter(Boolean);
  if (parts.length !== 2 || parts.some(p => !/^[A-Za-z0-9_.-]+$/.test(p) || p === '.' || p === '..')) throw new Error('Use the repository root URL: https://github.com/owner/repository.');
  return { owner: parts[0], folder: parts[1], url: `https://github.com/${parts.join('/')}` };
}
export function inspectSource(root) {
  const files = walk(root).filter(p => path.basename(p) === 'SKILL.md' || /(?:^|\/)commands\/[^/]+\.md$/.test(p));
  if (!files.length) throw new Error('No SKILL.md files or command prompts found in this folder.');
  if (files.length > 2000) throw new Error('This collection contains more than 2,000 entries. Import a smaller subfolder.');
  return files.map(file => {
    if (fs.statSync(file).size > 2 * 1024 * 1024) throw new Error('A skill file exceeds the 2 MB limit.');
    const raw = fs.readFileSync(file, 'utf8');
    const meta = parseMetadata(raw, path.basename(file) === 'SKILL.md' ? path.basename(path.dirname(file)) : path.basename(file, '.md'));
    return { name: meta.name, description: meta.description, relativePath: path.relative(root, file), warning: meta.warning };
  });
}
export class SourceManager {
  constructor(local, workspace) {
    this.file = path.join(local, 'collections.json'); this.workspace = fs.realpathSync(workspace); this.local = local; this.previews = new Map();
  }
  list() { return fs.existsSync(this.file) ? JSON.parse(fs.readFileSync(this.file, 'utf8')) : []; }
  async preview(input) {
    let source;
    if (input.type === 'github') {
      const parsed = githubRepository(String(input.location || '').trim());
      const id = 'github-' + createHash('sha256').update(parsed.url.toLowerCase()).digest('hex').slice(0, 12);
      const root = path.join(this.local, 'imports', id);
      if (this.list().some(s => s.id === id)) throw new Error('This repository is already in your library. Use Reindex to refresh it.');
      fs.mkdirSync(path.dirname(root), { recursive: true });
      if (!fs.existsSync(root)) {
        try { await exec('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'protocol.file.allow=never', 'clone', '--depth', '1', '--', parsed.url, root], { timeout: 120000, maxBuffer: 2 * 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1' } }); }
        catch (e) { throw new Error('Could not clone this public repository. Check its URL and network access. ' + (e.stderr || '').slice(-350)); }
      }
      source = { ...parsed, id, root, label: input.label?.trim() || parsed.folder, kind: 'skills', imported: true };
    } else if (input.type === 'local') {
      const location = String(input.location || '').trim();
      if (!path.isAbsolute(location)) throw new Error('Enter an absolute local folder path.');
      const root = fs.realpathSync(location);
      if (!fs.statSync(root).isDirectory()) throw new Error('Choose a folder, not a file.');
      if (root === path.parse(root).root || root === process.env.HOME || root === this.workspace) throw new Error('Select a specific skills collection folder.');
      const id = 'local-' + createHash('sha256').update(root).digest('hex').slice(0, 12);
      if (this.list().some(s => s.id === id || s.root === root)) throw new Error('This folder is already in your library.');
      source = { id, root, folder: path.basename(root), label: input.label?.trim() || path.basename(root), kind: 'skills', imported: true, url: null };
    } else throw new Error('Choose GitHub or Local folder.');
    const entries = inspectSource(source.root);
    const token = randomUUID();
    for (const [key, p] of this.previews) if (Date.now() - p.created > 1800000) this.previews.delete(key);
    this.previews.set(token, { source, created: Date.now() });
    return { token, source, count: entries.length, entries: entries.slice(0, 12), note: 'Imports index instructions and references. Setup scripts, hooks, and MCP servers are not automatically installed or executed.' };
  }
  commit(token) {
    const preview = this.previews.get(token);
    if (!preview || Date.now() - preview.created > 1800000) throw new Error('Preview expired. Preview the collection again.');
    const sources = this.list();
    if (sources.some(s => s.id === preview.source.id)) throw new Error('This collection is already imported.');
    inspectSource(preview.source.root);
    sources.push(preview.source);
    const temporary = this.file + '.tmp'; fs.writeFileSync(temporary, JSON.stringify(sources, null, 2)); fs.renameSync(temporary, this.file); this.previews.delete(token);
    return preview.source;
  }
}
