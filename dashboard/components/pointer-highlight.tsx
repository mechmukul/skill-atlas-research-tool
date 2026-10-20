"use client";
import {useEffect,useRef} from 'react';
import {MousePointer2} from 'lucide-react';

/** Decorative hover outline; native mouse and text-selection cursors remain available. */
export function PointerHighlight(){
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const overlay=ref.current;if(!overlay)return;
  const media=matchMedia('(hover: hover) and (pointer: fine)');
  const hide=()=>{overlay.hidden=true;};
  const move=(event:PointerEvent)=>{
   if(!media.matches||event.pointerType!=='mouse'){hide();return;}
   const el=event.target instanceof Element?event.target.closest('button,a[href],[role="tab"],summary,[role="button"]'):null;
   if(!el||el.matches(':disabled,[aria-disabled="true"]')){hide();return;}
   const box=el.getBoundingClientRect();
   if(!box.width||!box.height){hide();return;}
   overlay.style.left=`${box.left-3}px`;overlay.style.top=`${box.top-3}px`;overlay.style.width=`${box.width+6}px`;overlay.style.height=`${box.height+6}px`;overlay.hidden=false;
  };
  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('pointerleave',hide);document.addEventListener('pointerdown',hide);
  window.addEventListener('scroll',hide,true);window.addEventListener('blur',hide);window.addEventListener('resize',hide);
  return()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',hide);document.removeEventListener('pointerdown',hide);window.removeEventListener('scroll',hide,true);window.removeEventListener('blur',hide);window.removeEventListener('resize',hide);};
 },[]);
 return <div ref={ref} hidden aria-hidden="true" className="atlas-pointer-highlight"><MousePointer2 size={20}/></div>;
}
