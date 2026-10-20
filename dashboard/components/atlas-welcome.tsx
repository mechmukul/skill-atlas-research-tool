"use client";
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Layers3, Pause, Play } from 'lucide-react';
import {ThemeToggle} from '@/components/atlas-theme';
import {AnalysisStatus} from '@/components/analysis-status';
import { Button } from '@/components/ui/button';

export function AtlasWelcome({onEnter,onRun}:{onEnter:()=>void;onRun:(id:string)=>void}) {
  const [leaving,setLeaving]=useState(false),[paused,setPaused]=useState(false);
  const touch=useRef<{x:number;y:number}|null>(null),wheel=useRef(0);
  useEffect(()=>{if(!leaving)return;const timer=setTimeout(onEnter,450);return()=>clearTimeout(timer);},[leaving,onEnter]);
  const enter=()=>setLeaving(true);
  return <main className={'atlas-welcome'+(leaving?' is-leaving':'')} aria-label="Welcome to Skill Atlas"
    onTouchStart={e=>{const t=e.touches[0];touch.current={x:t.clientX,y:t.clientY};}}
    onTouchEnd={e=>{const t=e.changedTouches[0],start=touch.current;touch.current=null;if(start&&start.y-t.clientY>70&&Math.abs(start.x-t.clientX)<100)enter();}}
    onTouchCancel={()=>{touch.current=null;}}
    onWheel={e=>{wheel.current=e.deltaY>0?wheel.current+e.deltaY:0;if(wheel.current>140)enter();}}
    onKeyDown={e=>{if(['ArrowUp','PageDown'].includes(e.key)){e.preventDefault();enter();}}}>
    <div className={'atlas-press'+(paused?' is-paused':'')} aria-hidden="true">
      {/* Printing press animation adapted from Uiverse.io by preet_7613, supplied by the user. */}
      <div className="atlas-press-stage">{['sheet','roll','sheet','roll','sheet','roll','sheet','sheet','sheet','sheet','sheet','roll'].map((type,i)=><div className={type} key={i}/>)}</div>
    </div>
    <div className="welcome-shade" aria-hidden="true"/>
    <div className="welcome-topbar"><header className="welcome-brand"><Layers3 size={26}/><span>Skill Atlas</span></header>
    <div className="welcome-actions"><div className="welcome-theme"><ThemeToggle/></div><Button className="welcome-motion" variant="outline" onClick={()=>setPaused(p=>!p)} aria-pressed={paused}>{paused?<Play size={16}/>:<Pause size={16}/>} {paused?'Play animation':'Pause animation'}</Button></div></div>

    <div className="welcome-main"><section className="welcome-copy"><div className="welcome-analysis" onWheel={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()} onKeyDown={e=>{if(['ArrowUp','PageDown'].includes(e.key))e.stopPropagation();}}><AnalysisStatus compact onRun={onRun}/></div><p className="welcome-kicker">YOUR RESEARCH WORKSPACE</p><h1>Skill Atlas</h1><p>Papers. Evidence. Your ideas.</p></section>
    <div className="welcome-entry"><Button onClick={enter} disabled={leaving}><ArrowUp size={20}/>Enter Skill Atlas</Button><p>Swipe up or scroll to enter</p><small>Created by Mukul Mech · PhD security researcher</small></div></div>
  </main>;
}
