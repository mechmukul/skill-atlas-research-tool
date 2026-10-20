"use client";
import {useEffect,useState} from 'react';
import {Progress} from '@/components/ui/progress';
import {api} from '@/lib/research';
import {screeningGroups,type ScreeningPaper} from '@/lib/screening';
import type {EvidenceSnapshot} from '@/lib/evidence-map';

export function ResearchProgressStrip({data}:{data:EvidenceSnapshot}){
 const [screening,setScreening]=useState<{done:number;total:number}|null>(null),[error,setError]=useState(false);
 useEffect(()=>{let alive=true;const refresh=async()=>{try{const result=await api<{papers:ScreeningPaper[]}>('/papers');const groups=screeningGroups(result.papers);if(alive){setScreening({done:groups.filter(g=>g.reviewed&&['include','exclude'].includes(g.decision)).length,total:groups.length});setError(false);}}catch{if(alive)setError(true);}};void refresh();const timer=setInterval(refresh,20000);return()=>{alive=false;clearInterval(timer);};},[data.generatedAt]);
 const total=data.cards.length,done=data.cards.filter(p=>p.ready).length,left=total-done;
 const rows=[{id:'analysis',label:'Papers analysed',count:done,total,detail:`${done} of ${total} papers · evidence available`},{id:'remaining',label:'Papers remaining',count:left,total,detail:`${left} papers still need an evidence record`},{id:'screening',label:'Papers screened',count:screening?.done??0,total:screening?.total??0,detail:error?'Screening count unavailable · retrying':screening?`${screening.done} of ${screening.total} · reviewed include/exclude decisions`:'Loading screening decisions…'}];
 return <section className="research-progress-strip" aria-label="Whole-library paper progress">{rows.map(row=>{const known=row.id!=='screening'||(!!screening&&!error),percent=row.total?Math.round(row.count/row.total*100):0;return <div key={row.id} className={'paper-progress-item '+(row.id!=='remaining'&&row.total>0&&row.count===row.total?'is-complete':'')}><div><span id={'paper-progress-'+row.id}>{row.label}</span><strong>{known?`${percent}%`:'—'}</strong></div><Progress value={known?percent:null} aria-labelledby={'paper-progress-'+row.id} aria-valuetext={known?`${row.count} of ${row.total} papers`:row.detail}/><p>{row.detail}</p></div>;})}<small>Whole library · exact PDFs counted once · updates every 20 seconds. Analysis includes earlier reviews and validated extractions; screening is your decision.</small></section>;
}
