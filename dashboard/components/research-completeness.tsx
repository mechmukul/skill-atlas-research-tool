'use client';
import {useEffect,useState} from 'react';
import {api,type Run} from '@/lib/research';
import {screeningGroups,type ScreeningPaper} from '@/lib/screening';
import {Button} from './ui/button';
type Paper=ScreeningPaper&{runId?:string;visualRunId?:string};
export function ResearchCompleteness({runs,onPaper}:{runs:Run[];onPaper:(id:string)=>void}){
 const [papers,setPapers]=useState<Paper[]>([]),[error,setError]=useState(''),[reading,setReading]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[done,setDone]=useState(0);
 async function refresh(){try{setPapers((await api<{papers:Paper[]}>('/papers')).papers);setError('');}catch(e){setError((e as Error).message);}}
 useEffect(()=>{void refresh();},[]);
 const groups=screeningGroups(papers),status=new Map(runs.map(r=>[r.id,r.status]));
 const main=(ids:string[])=>ids.some(id=>status.get(id)==='completed'),rows=[
 {label:'Visual extraction tasks finished',count:groups.filter(g=>main(g.records.map(p=>(p as Paper).visualRunId||''))).length,note:'Task completion; inspect validated records in the visual overview.'},
 {label:'Main reading analysis tasks finished',count:groups.filter(g=>main(g.records.map(p=>(p as Paper).runId||''))).length,note:'AI reading drafts, separate from visual extraction and your reading.'},
 {label:'Paper entries consistently marked reviewed',count:groups.filter(g=>g.reviewed).length,note:'Your paper review flags; this does not certify every extracted claim.'},
 {label:'Reviewed inclusion/exclusion decisions',count:groups.filter(g=>g.reviewed&&['include','exclude'].includes(g.decision)).length,note:'Revisit, undecided and conflicting decisions remain pending.'},
 ];
 async function loadReading(){setBusy(true);setDone(0);const result:Record<string,string>={};let cursor=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<papers.length){const p=papers[cursor++];try{const r=await api<{reading:{status:string}}>('/paper-activity/'+p.id);result[p.id]=r.reading.status;}catch{result[p.id]='unavailable';}setDone(n=>n+1);}}));setReading(result);setBusy(false);}
 const read=groups.filter(g=>g.records.some(p=>reading[p.id]==='read')).length;
 return <details className="slr-panel research-completeness"><summary>Research completeness · {groups.length} unique imported PDFs</summary><p>These stages are independent and overlap. Bars share the imported-PDF denominator; do not add their counts. Exact duplicate PDFs count once.</p><Button variant="outline" onClick={refresh}>Refresh inventory</Button>{error&&<p role="alert">{error}</p>}<div className="completeness-lanes">{rows.map(r=><div key={r.label}><div><strong>{r.label}</strong><span>{r.count}/{groups.length}</span></div><div className="completeness-track" role="progressbar" aria-label={r.label} aria-valuenow={r.count} aria-valuemin={0} aria-valuemax={groups.length||1}><i style={{width:r.count/Math.max(1,groups.length)*100+'%'}}/></div><small>{r.note}</small></div>)}</div><Button variant="outline" disabled={busy||!papers.length} onClick={loadReading}>{busy?'Checking reading statuses '+done+'/'+papers.length:Object.keys(reading).length?'Refresh my reading status':'Load my reading status'}</Button>{!!Object.keys(reading).length&&<p role="status">{read}/{groups.length} PDFs have at least one entry marked read by you. {groups.filter(g=>!g.records.some(p=>reading[p.id]==='read')&&g.records.some(p=>reading[p.id]==='unavailable')).length} PDFs have unavailable reading status. Reading is your attestation, not page-view telemetry.</p>}<details><summary>Screening decisions by state</summary><div className="completeness-lanes">{['include','exclude','maybe','undecided','conflict'].map(key=>{const list=groups.filter(g=>g.decision===key);return <details key={key}><summary>{key} · {list.length} PDFs</summary>{list.map(g=><button key={g.id} className="slr-title-button" onClick={()=>onPaper(g.id)}>{g.title}</button>)}</details>;})}</div></details></details>;
}
