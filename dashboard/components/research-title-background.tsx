'use client';
import {useTopics} from './topic-provider';
import {useEffect,useRef} from 'react';
import './research-title-background.css';

/** Decorative working-title treatment; never overlays or intercepts research controls. */
export function ResearchTitleBackground(){
 const ctx=useTopics();const topic=ctx?.registry.topics.find(t=>t.id===ctx.registry.current);
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const layer=ref.current,workspace=layer?.parentElement;if(!layer||!workspace)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
  let frame=0,idle:ReturnType<typeof setTimeout>|undefined;
  function fade(){layer!.dataset.revealed='false';if(idle)clearTimeout(idle);}
  function move(event:PointerEvent){
   if(reduced.matches||!fine.matches)return;
   const target=event.target as Element|null;
   if(!target||!workspace!.contains(target)||target.closest('article,aside,nav,header,button,a,input,textarea,select,[role="dialog"],[role="note"],.slr-panel,.slr-evidence,.slr-context,.atlas-reading-panel,.atlas-term-card')||document.activeElement?.matches('input,textarea,[contenteditable="true"]')){fade();return;}
   if(frame)cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{const box=layer!.getBoundingClientRect();layer!.style.setProperty('--title-x',`${event.clientX-box.left}px`);layer!.style.setProperty('--title-y',`${event.clientY-box.top}px`);layer!.dataset.revealed='true';frame=0;});
   if(idle)clearTimeout(idle);idle=setTimeout(fade,900);
  }
  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('focusin',fade);document.addEventListener('pointerleave',fade);reduced.addEventListener('change',fade);
  return()=>{cancelAnimationFrame(frame);if(idle)clearTimeout(idle);document.removeEventListener('pointermove',move);document.removeEventListener('focusin',fade);document.removeEventListener('pointerleave',fade);reduced.removeEventListener('change',fade);};
 },[]);
 const title=topic?.template==='general'?<><span>{topic.name}</span><span>{topic.question||'Explore. Read. Connect.'}</span></>:<><span>Management-Oriented<br/>Assurance</span><span>Human Oversight &amp; Accountability</span><span>Agentic AI in Managed Security Services</span></>;
 return <div ref={ref} className="research-title-background" aria-hidden="true" data-revealed="false"><div className="research-title-lettering">{title}</div><div className="research-title-reveal"><div className="research-title-lettering">{title}</div></div></div>;
}
