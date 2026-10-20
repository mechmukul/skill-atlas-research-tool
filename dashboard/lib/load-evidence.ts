import {api} from './research';
import {mergeEvidence} from './evidence-map';
import type {EvidenceSnapshot,PaperInventory,RunState,VisualPayload} from './evidence-map';
const cache=new Map<string,VisualPayload>();
export async function loadEvidence(runs?:RunState[]):Promise<EvidenceSnapshot>{
 const [base,inventory]=await Promise.all([api<EvidenceSnapshot>('/knowledge-base'),api<PaperInventory>('/papers')]);
 const states=runs||((await api<{runs:RunState[]}>('/state')).runs);const jobs=new Map(states.map(r=>[r.id,r]));const papers=inventory.papers.filter(p=>p.visualRunId&&jobs.get(p.visualRunId)?.status==='completed');const visuals:VisualPayload[]=[],warnings:string[]=[];
 for(let i=0;i<papers.length;i+=4){const settled=await Promise.allSettled(papers.slice(i,i+4).map(async p=>{const r=jobs.get(p.visualRunId!)!,key=p.id+':'+r.id+':'+r.updatedAt;if(cache.has(key))return cache.get(key)!;const v=await api<VisualPayload>('/papers/'+p.id+'/visuals');if(v.data&&!v.error)cache.set(key,v);return v;}));for(const item of settled){if(item.status==='fulfilled'){visuals.push(item.value);if(item.value.error)warnings.push(item.value.error);}else warnings.push(String(item.reason));}}
 if(cache.size>600)cache.clear();return mergeEvidence(base,inventory,states,visuals,warnings);
}
export function downloadEvidence(name:string,data:unknown){const content=typeof data==='string'?data:JSON.stringify(data,null,2);const blob=new Blob([content],{type:typeof data==='string'?'text/markdown;charset=utf-8':'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
