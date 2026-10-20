import type {Dataset,Row,SlrState} from './synthesis.ts';
export type ClaimReview={statement_id:string;claim:string;status:'supported'|'partially_supported'|'unsupported'|'contradicted'|'quotation_mismatch'|'uncertain'|'source_unavailable';paper_id:string;source_sha256:string;checked_at:string;reviewer:string;pages:number[];section:string;excerpt:string;reason:string;correction:string;remaining_check:string};
export function claimReview(row:Row):ClaimReview|null{try{const r=JSON.parse(row.claim_review||'null');return r&&r.statement_id===row.statement_id&&r.claim===row.statement?r:null;}catch{return null;}}
export type PaperReadingProgress={paperIds:string[];fullyRead:boolean};
export function evidenceProgress(data:Dataset,state:SlrState,strand='',papers:PaperReadingProgress[]=[]){
 const rows=data.statements.filter(s=>!strand||s.strand===strand),collected=rows.filter(s=>state.notes['reading-bank:'+s.statement_id]==='selected');
 const assessed=collected.filter(s=>claimReview(s)),resolved=assessed.filter(s=>!['uncertain','source_unavailable'].includes(claimReview(s)!.status)),flagged=assessed.filter(s=>claimReview(s)!.status!=='supported');
 const ids=new Set(rows.map(s=>s.source_paper_id).filter(Boolean)),eligible=papers.filter(p=>!strand||p.paperIds.some(id=>ids.has(id))),fullyRead=eligible.filter(p=>p.fullyRead).length;
 const percent=(n:number,d:number)=>d?Math.round(n/d*1000)/10:null;
 return {total:rows.length,reviewed:fullyRead,papers:eligible.length,collected:collected.length,assessed:assessed.length,resolved:resolved.length,flagged:flagged.length,readingPercent:percent(fullyRead,eligible.length),collectionPercent:percent(collected.length,rows.length),verificationPercent:percent(resolved.length,collected.length)};
}
