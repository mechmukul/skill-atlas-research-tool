import type {Dataset} from './synthesis.ts';
export type PaperIdentity={id:string;title:string;sha256?:string};
export type SavedSourceLinks={importedAt:string;records:{record_id:string;title:string;status:string;paper_id:string;source_sha256?:string;candidate_ids?:string[];bibliographic_flags?:string[]}[]};
export function resolveSourceLinks(data:Dataset,papers:PaperIdentity[],saved?:SavedSourceLinks|null){
 const links:Record<string,string>={},issues:Record<string,string>={},flags:Record<string,string[]>={};const ids=new Map(papers.map(p=>[p.id,p]));const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 for(const record of data.records){
  const checked=saved?.importedAt===data.importedAt?saved.records.find(r=>r.record_id===record.record_id&&r.title===record.title):undefined;if(checked?.bibliographic_flags?.length)flags[record.record_id]=checked.bibliographic_flags;
  const audited=data.statements.find(s=>s.record_id===record.record_id&&s.source_paper_id);const file=audited?ids.get(audited.source_paper_id):undefined;
  if(file&&(!audited!.source_sha256||file.sha256===audited!.source_sha256)){links[record.record_id]=file.id;continue;}
  const mapped=saved?.importedAt===data.importedAt?saved.records.find(r=>r.record_id===record.record_id&&r.title===record.title):undefined;const mappedFile=mapped?ids.get(mapped.paper_id):undefined;
  if(mapped?.status==='located'&&mappedFile&&(!mapped.source_sha256||mappedFile.sha256===mapped.source_sha256)){links[record.record_id]=mappedFile.id;continue;}
  const candidates=papers.filter(p=>norm(p.title)===norm(record.title));const unique=new Map(candidates.map(p=>[p.sha256||p.id,p]));
  if(unique.size===1){links[record.record_id]=[...unique.values()][0].id;continue;}
  issues[record.record_id]=unique.size>1||mapped?.status==='ambiguous'?'Multiple distinct PDF versions match this record. Confirm the intended source.':mappedFile&&mapped?.source_sha256&&mappedFile.sha256!==mapped.source_sha256?'The matched PDF fingerprint changed. Recheck its identity.':'No checked local PDF link is available. Refresh source links or check the paper inventory.';
 }
 return {links,issues,flags};
}
