import {resolveSourceLinks,type SavedSourceLinks,type PaperIdentity} from './source-links.ts';
import type {Dataset,SlrState,Row} from './synthesis.ts';
/** Match selections to unique PDF identity, including copies across imported collections. */
export function collectedEvidenceByPaper(data:Dataset,state:SlrState,papers:PaperIdentity[],saved?:SavedSourceLinks|null){
 const resolved=resolveSourceLinks(data,papers,saved),identity=new Map(papers.map(p=>[p.id,p.sha256||p.id])),groups=new Map<string,Map<string,Row>>();const unresolved:string[]=[];
 for(const s of data.statements){if(state.notes['reading-bank:'+s.statement_id]!=='selected')continue;const id=resolved.links[s.record_id],hash=identity.get(id);if(!hash){unresolved.push(s.statement_id);continue;}const rows=groups.get(hash)||new Map<string,Row>();rows.set(s.statement_id,s);groups.set(hash,rows);}
 return {byPaper:Object.fromEntries(papers.map(p=>[p.id,[...(groups.get(p.sha256||p.id)?.values()||[])]])),unresolved};
}
export function matchesPaperCollection(rows:Row[],selection:string,kind=''){if(selection==='uncollected')return rows.length===0;if(selection==='collected')return rows.some(s=>!kind||s.statement_type===kind);return !kind||rows.some(s=>s.statement_type===kind);}
