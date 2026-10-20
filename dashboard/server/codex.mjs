import {codexExecutable} from './codex-path.mjs';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createInterface } from 'node:readline';
export class Codex extends EventEmitter {
  constructor() { super(); this.pending = new Map(); this.sequence = 0; this.child = null; this.starting = null; }
  async start() {
    if (this.starting) return this.starting;
    if (this.child) return;
    this.starting = this.boot();
    try { await this.starting; } catch (error) { this.child?.kill(); this.child = null; throw error; } finally { this.starting = null; }
  }
  async boot() {
    this.child = spawn(codexExecutable(), ['app-server', '--stdio'], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.child.on('error', err => this.fail(new Error(`Cannot start Codex: ${err.message}. Set CODEX_BIN or install Codex CLI.`)));
    this.child.on('exit', (code) => this.fail(new Error(`Codex disconnected (exit ${code}). Reconnect before continuing.`)));
    this.child.stdin.on('error', err => this.fail(new Error('Codex input stream closed: '+err.message)));
    this.child.stderr.on('data', d => this.emit('diagnostic', String(d)));
    createInterface({ input: this.child.stdout }).on('line', line => {
      let msg; try { msg = JSON.parse(line); } catch { return; }
      if (msg.method) this.emit('message', msg);
      else if (this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id); this.pending.delete(msg.id); clearTimeout(p.timer);
        if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
      }
    });
    await this.rpc('initialize', { clientInfo: { name: 'research-studio', title: 'Research Studio', version: '1.0.0' }, capabilities: { experimentalApi: true } });
    this.send({ method: 'initialized', params: {} });
  }
  fail(error) {
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); }
    this.pending.clear(); this.child = null; this.emit('disconnected', error);
  }
  send(msg) { if (!this.child?.stdin.writable) throw new Error('Codex is not connected.'); this.child.stdin.write(JSON.stringify(msg) + '\n'); }
  rpc(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Codex timed out: ${method}`)); }, 45000);
      this.pending.set(id, { resolve, reject, timer });
      try { this.send({ id, method, params }); } catch (e) { clearTimeout(timer); this.pending.delete(id); reject(e); }
    });
  }
  reply(id, result) { this.send({ id, result }); }
  close() { this.child?.kill(); }
}
