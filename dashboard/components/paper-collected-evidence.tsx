'use client';
import {useState} from 'react';
import {evidenceKinds} from '@/lib/paper-reading';
import {sourceStatus,type Row,type SlrState} from '@/lib/synthesis';
export function PaperCollectedEvidence({rows,state}:{rows:Row[];state:SlrState|null}){
 const [kind,setKind]=useState('');if(!rows.length)return <p className="ps-collection-empty">No evidence collected for strand reading from this paper.</p>;
 return <section className="ps-collected-evidence" aria-label="Collected evidence from this paper"><strong>✓ {rows.length} statements collected for strand reading</strong><div className="ps-collected-types" aria-label="Collected statement types">{evidenceKinds.map(([k,name,icon])=>{const count=rows.filter(s=>s.statement_type===k).length;return count?<button key={k} data-evidence-kind={k} aria-pressed={kind===k} onClick={()=>setKind(kind===k?'':k)}>{icon} {name} · {count}</button>:null;})}</div><details><summary>View collected statements{kind?' · '+(evidenceKinds.find(([k])=>k===kind)?.[1]||kind):''}</summary><p className="muted">Collection records your reading choice; it does not certify the source.</p>{rows.filter(s=>!kind||s.statement_type===kind).map(s=><article key={s.statement_id} data-evidence-kind={s.statement_type}><strong>{s.statement_id} · {s.strand} · {evidenceKinds.find(([k])=>k===s.statement_type)?.[1]||s.statement_type}</strong><p>{s.statement}</p><small>{sourceStatus(s)} · Location: {state?.notes['locator:'+s.statement_id]||s.location}</small>{state?.notes[s.statement_id]&&<p>My note: {state.notes[s.statement_id]}</p>}</article>)}</details></section>;
}
