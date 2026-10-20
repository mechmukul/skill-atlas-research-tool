'use client';
import {topicLocalStorage} from '@/lib/topic-storage';
import {useEffect,useState} from 'react';
import {api} from '@/lib/research';
import {journeyProgress} from '@/lib/slr-journey';
import type {SlrState} from '@/lib/synthesis';
import {pageWorkflow} from '@/lib/page-workflow';
import {Button} from './ui/button';
export function WorkflowSessionBar({page,onNavigate}:{page:string;onNavigate:(page:string)=>void}){
 const [objective,setObjective]=useState(''),[help,setHelp]=useState(true),[focus,setFocus]=useState(false);
 useEffect(()=>{let alive=true;api<{state:SlrState}>('/synthesis/workspace').then(r=>{let state=r.state;try{const recovery=JSON.parse(topicLocalStorage.getItem('atlas-slr-recovery')||'null');if(recovery?.state)state=recovery.state;}catch{}if(alive)setObjective(journeyProgress(state).next?.title||'Review and refine');}).catch(()=>{});return()=>{alive=false;};},[page]);
 useEffect(()=>{document.body.classList.toggle('atlas-focus',focus&&!!pageWorkflow[page]);return()=>document.body.classList.remove('atlas-focus');},[focus,page]);
 const flow=pageWorkflow[page];if(!flow)return null;
 return <aside className="workflow-session-bar" aria-label="Guided page workflow"><div className="button-row"><strong>Current objective: {objective||'Loading…'}</strong><Button variant="outline" onClick={()=>onNavigate('synthesis')}>Return to my session</Button><Button variant="ghost" aria-pressed={help} onClick={()=>setHelp(v=>!v)}>{help?'Hide step guide':'Show step guide'}</Button><Button variant="ghost" aria-pressed={focus} onClick={()=>setFocus(v=>!v)}>{focus?'Exit focus mode':'Focus mode'}</Button></div>{help&&<><h2>{flow.title}</h2><ol>{flow.steps.map(s=><li key={s}>{s}</li>)}</ol><p><strong>Useful output:</strong> {flow.output}</p><Button variant="outline" onClick={()=>onNavigate(flow.next)}>{flow.nextLabel}</Button><small>Use this next action when it fits your active objective. Page visits do not complete an achievement.</small></>}</aside>;
}
