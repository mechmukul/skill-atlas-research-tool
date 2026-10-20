"use client";
import {useEffect,useRef,type ComponentProps} from 'react';
import {cn} from '@/lib/utils';

/** Decorative reading position guide; never marks a paper as reviewed. */
export function TracingBeam({children,className,...props}:ComponentProps<'div'>){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  let frame=0;
  const update=()=>{frame=0;const box=el.getBoundingClientRect();let top=80,bottom=window.innerHeight;for(let parent=el.parentElement;parent;parent=parent.parentElement){if(/auto|scroll/.test(getComputedStyle(parent).overflowY)){const rect=parent.getBoundingClientRect();top=Math.max(top,rect.top);bottom=Math.min(bottom,rect.bottom);break;}}const distance=Math.max(1,box.height-(bottom-top));const progress=Math.max(0,Math.min(1,(top-box.top)/distance));el.style.setProperty('--reading-progress',String(progress));};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const observer=new ResizeObserver(schedule);observer.observe(el);
  window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);schedule();
  return()=>{observer.disconnect();window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame);};
 },[]);
 return <div ref={ref} className={cn('atlas-tracing-beam',className)} {...props}><div className="tracing-rail" aria-hidden="true"><div className="tracing-fill"/><span className="tracing-tip"/></div>{children}</div>;
}
