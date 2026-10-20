"use client";
import {openSourcePaper} from '@/lib/source-navigation';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {api} from '@/lib/research';
import {screeningNote} from '@/lib/screening';
import type {ScreeningPaper} from '@/lib/screening';
export function QuickScreening({recordIds,records,onSaved}:{recordIds:string[];records:ScreeningPaper[];onSaved:(decision:string)=>Promise<void>}){
 const [busy,setBusy]=useState(false),[reason,setReason]=useState(''),[message,setMessage]=useState('');
 const linked=records.filter(p=>recordIds.includes(p.id)),choices=new Set(linked.map(p=>p.decision||'undecided')),decision=choices.size===1?[...choices][0]:linked.length?'conflict':'loading';
 async function choose(value:string){setBusy(true);setMessage('');try{const at=new Date().toISOString();for(const id of recordIds){const p=await api<ScreeningPaper>('/papers/'+id);await api('/papers/'+id+'/notes',{decision:value,reviewed:value==='include'||value==='exclude',notes:screeningNote(p.notes,value,reason.trim()||'Selected by researcher in Knowledge Base; no additional rationale entered.',at)});}await onSaved(value);setReason('');setMessage('Saved to Screening.');}catch(e){setMessage('Could not save every copy. Refresh to check the saved decisions. '+(e as Error).message);}finally{setBusy(false);}}
 return <div className="kb-quick-screening"><div className="button-row"><strong>Screening: {decision}</strong><Button type="button" size="sm" variant="outline" className="kb-preview-paper" disabled={!recordIds[0]} onClick={()=>openSourcePaper(recordIds[0])}>Preview paper</Button><Button data-action="success" size="sm" variant={decision==='include'?'default':'outline'} aria-pressed={decision==='include'} disabled={busy||!linked.length} onClick={()=>choose('include')}>Include</Button><Button data-action="danger" size="sm" variant={decision==='exclude'?'default':'outline'} aria-pressed={decision==='exclude'} disabled={busy||!linked.length} onClick={()=>choose('exclude')}>Exclude</Button><Button size="sm" variant="ghost" disabled={busy||!linked.length||decision==='undecided'} onClick={()=>choose('undecided')}>Reset</Button><a href="#screening">Open Screening</a></div><Input aria-label="Optional screening reason" placeholder="Optional reason — enter before selecting Include or Exclude" value={reason} maxLength={12000} disabled={busy} onChange={e=>setReason(e.target.value)}/><p>Include or Exclude saves immediately and marks this paper reviewed by you. Reset returns it to undecided. Duplicate copies stay linked.</p><span role="status">{busy?'Saving decision…':message}</span></div>;
}
