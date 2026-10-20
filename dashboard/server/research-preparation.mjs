import {buildPreparationPlan} from './preparation-plan.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
export function prepareResearch({papers,detail,dataset,state,runs}){
 const groups=new Map();for(const p of papers){const key=p.sha256||p.id;groups.set(key,[...(groups.get(key)||[]),p]);}
 const issues=[],matrix=[],manual=[];let pending=0;
 for(const group of groups.values()){
  const p=group.find(x=>x.visualRunId)||group[0];const decisions=new Set(group.map(x=>x.decision||'undecided'));
  if(decisions.size>1)issues.push({paperId:p.id,title:p.title,type:'Conflicting duplicate decisions'});
  let v;try{v=detail(p.id);}catch(e){v={error:e.message};}
  if(!v?.data){pending++;issues.push({paperId:p.id,title:p.title,type:v?.error||'Validated extraction unavailable'});continue;}
  const d=v.data;
  matrix.push({paperId:p.id,title:p.title,batchId:p.batchId,question:d.question,methods:d.methods,studyType:d.studyType,summary:d.summary,samples:d.samples,claims:d.claims,limitations:d.limitations,missing:d.missing,coverage:d.coverage,decision:decisions.size===1?[...decisions][0]:'conflict',reviewed:group.every(x=>x.reviewed)});
  const steps=[];if(decisions.size>1||!group.every(x=>x.reviewed)||!['include','exclude'].includes(p.decision))steps.push('Confirm inclusion decision and record reason');
  steps.push('Verify important claims and page references against the PDF','Appraise study quality and relevance to your question');
  if(d.missing.length)steps.push('Resolve reported missing information where material');
  manual.push({paperId:p.id,title:p.title,steps,priority:decisions.size>1?0:!group.every(x=>x.reviewed)?1:2});
 }
 const corpus=dataset?.records||[],statements=dataset?.statements||[];
 const norm=s=>(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const crosswalk=corpus.map(r=>{const matches=[...groups.values()].filter(g=>g.some(p=>norm(p.title)===norm(r.title)));return {recordId:r.record_id,title:r.title,paperId:matches.length===1?matches[0][0].id:null,status:matches.length===1?'Title candidate: researcher confirmation required':matches.length?'Ambiguous title match':'No title match'};});
 const locators=statements.filter(s=>!s.location?.trim()||/not given|not reported|not supplied|unknown/i.test(s.location)).map(s=>({recordId:s.record_id,statementId:s.statement_id}));
 const active=runs.filter(r=>papers.some(p=>p.visualRunId===r.id||p.runId===r.id)&&['queued','starting','running','waiting','interrupted'].includes(r.status));
 const ready=groups.size>0&&pending===0&&active.length===0;
 const themes=(state.themes||[]).map(theme=>({theme,recordIds:corpus.filter(r=>(state.notes?.['themes:'+r.record_id]||'').split('\n').map(x=>x.trim()).includes(theme)).map(r=>r.record_id)}));
 const outline=(state.outline?.length?state.outline:['Introduction','Search and selection methods','Thematic synthesis','Gaps and limitations','Conclusion']).map(section=>({section,draftPresent:!!state.drafts?.[section]?.trim(),next:'Select verified evidence, compare studies, and write your argument'}));
 const protocol=['Research questions','Scope & boundaries','Audience'].filter(k=>!state.brief?.[k]?.trim());
 return {...buildPreparationPlan(corpus,statements,crosswalk,state),generatedAt:new Date().toISOString(),status:ready?'Preparation ready for manual review':'Partial preparation · awaiting extraction or recovery',ready,counts:{uniquePdfs:groups.size,validated:matrix.length,pending,active:active.length,duplicateEntries:papers.length-groups.size,corpusRecords:corpus.length,missingLocators:locators.length},issues,matrix,crosswalk,missingLocators:locators,themes,outline,manual:manual.sort((a,b)=>a.priority-b.priority),protocol, boundary:'Mechanical preparation from saved outputs. No new paper analysis, human decisions, verified quotations, research gaps or achievements are generated. Title matches and themes require researcher confirmation.'};
}
export class ResearchPreparation{
 constructor(local,input){this.folder=path.join(local,'preparation');this.input=input;this.enabled=true;this.error='';this.fingerprint='';fs.mkdirSync(this.folder,{recursive:true});try{this.enabled=JSON.parse(fs.readFileSync(path.join(this.folder,'control.json'),'utf8')).enabled;}catch{}}
 read(){let report=null;try{report=JSON.parse(fs.readFileSync(path.join(this.folder,'report.json'),'utf8'));}catch{}return {enabled:this.enabled,error:this.error,report};}
 refresh(force=false){try{this.enabled=JSON.parse(fs.readFileSync(path.join(this.folder,'control.json'),'utf8')).enabled;}catch{}if(!this.enabled&&!force)return this.read();try{const input=this.input();const hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');if(hash===this.fingerprint&&!force)return this.read();const report=prepareResearch({...input,detail:id=>input.visuals[id]});const file=path.join(this.folder,'report.json');fs.writeFileSync(file+'.tmp.'+process.pid,JSON.stringify(report,null,2));fs.renameSync(file+'.tmp.'+process.pid,file);const csv=v=>'"'+(typeof v==='object'?JSON.stringify(v):String(v??'')).replaceAll('"','""')+'"';
const cols=['paperId','title','studyType','question','methods','summary','samples','claims','limitations','missing','coverage','decision','reviewed'];
fs.writeFileSync(path.join(this.folder,'literature-matrix.csv'),[cols.join(','),...report.matrix.map(r=>cols.map(k=>csv(r[k])).join(','))].join('\n'));
fs.writeFileSync(path.join(this.folder,'manual-handoff.md'),'# Manual research handoff\n\n'+report.status+'\n\n'+report.boundary+'\n\n## Review protocol\n'+report.protocol.map(k=>'- Complete '+k).join('\n')+'\n\n'+report.manual.map(p=>'## '+p.title+'\nPaper ID: '+p.paperId+'\n'+p.steps.map(x=>'- [ ] '+x).join('\n')).join('\n\n'));
for(const [name,items] of [['reading-queue',report.readingQueue],['provisional-themes',report.provisionalThemes],['writing-plan',report.writingPlan],['reconciliation',report.reconciliation]])fs.writeFileSync(path.join(this.folder,name+'.json'),JSON.stringify(items,null,2));
fs.writeFileSync(path.join(this.folder,'next-steps.md'),'# Research preparation plan\n\n'+report.context.boundary+'\n\n## Reconciliation\n'+report.reconciliation.map(x=>'- '+x.issue+': '+x.detail).join('\n')+'\n\n## Reading batches\n'+report.readingQueue.map(x=>'### '+x.order+'. '+x.title+' ('+x.rqs.join(', ')+')\n'+x.purpose+'\n'+x.records.map(r=>'- '+r.recordId+': '+r.title+' ['+r.identityStatus+']').join('\n')).join('\n\n')+'\n\n## Researcher decisions\n'+report.decisions.map(x=>'- [ ] '+x).join('\n'));
this.fingerprint=hash;this.error='';}catch(e){this.error=e.message;}return this.read();}
 set(enabled){this.enabled=enabled;fs.writeFileSync(path.join(this.folder,'control.json'),JSON.stringify({enabled}));return this.refresh(enabled);}
}
