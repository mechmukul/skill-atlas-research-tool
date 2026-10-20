export type Skill = { id:string; name:string; title:string; description:string; repoId:string; repository:string; kind:string; stage:string; domain:string; compatibility:string; warning:string; tools:string[]; references:{path:string;exists:boolean}[]; source:string|null; sourcePath:string; adapterPath:string; instructions:string };
export type Source = { id:string; label:string; folder:string; url:string|null; root:string; imported?:boolean; skillCount:number; commit:string|null; available:boolean; kind:string };
export type Catalog = { skills:Skill[]; sources:Source[]; discovery:{name:string;url:string;description:string;category:string;stars:number}[]; generatedAt:string };
export type Project = { id:string; name:string; folder:string };
export type Run = { id:string; projectId:string; prompt:string; skillIds:string[]; status:string; createdAt:string; updatedAt:string; threadId:string; result:string; error?:string };
export type Pending = { id:number;runId:string;method:string;params:{reason?:string;command?:string;questions?:{id:string;header:string;question:string;options?:{label:string;description:string}[]}[];[key:string]:unknown} };
export type Activity = {seq:number;type:string;at:string;data:Record<string,unknown>};
export type FileEntry = {path:string;size:number;modified:string};
export async function api<T>(url:string, data?:unknown):Promise<T> {
  const topic=typeof window==='undefined'?'main':new URLSearchParams(window.location.search).get('topic')||'main';
  const response = await fetch('/api'+url, data === undefined ? {headers:{'X-Atlas-Topic':topic}} : { method:'POST', headers:{'Content-Type':'application/json','X-Atlas-Topic':topic}, body:JSON.stringify(data) });
  let result:T & {error?:string};try{result=await response.json();}catch{throw new Error(response.ok?'Atlas returned an unreadable response. Reload and retry.':'Atlas service is unavailable. Reload after the local service recovers.');} if (!response.ok) throw new Error(result.error || 'Request failed.'); return result;
}
