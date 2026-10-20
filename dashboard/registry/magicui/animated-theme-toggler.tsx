"use client";
import {useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {useTheme} from 'next-themes';
import {Sun,Moon} from 'lucide-react';
import {Button} from '@/components/ui/button';
export function AnimatedThemeToggler(){const {resolvedTheme,setTheme}=useTheme();const ref=useRef<HTMLButtonElement>(null);const [busy,setBusy]=useState(false);
 async function toggle(){if(busy)return;const next=resolvedTheme==='dark'?'light':'dark';const doc=document as Document&{startViewTransition?:(callback:()=>void)=>{ready:Promise<void>;finished:Promise<void>}};if(!doc.startViewTransition||matchMedia('(prefers-reduced-motion: reduce)').matches){setTheme(next);return;}const rect=ref.current?.getBoundingClientRect();const x=rect?rect.left+rect.width/2:innerWidth/2,y=rect?rect.top+rect.height/2:0;setBusy(true);try{const transition=doc.startViewTransition(()=>flushSync(()=>setTheme(next)));await transition.ready;const radius=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));await document.documentElement.animate({clipPath:[`circle(0px at ${x}px ${y}px)`,`circle(${radius}px at ${x}px ${y}px)`]},{duration:420,easing:'ease-out',pseudoElement:'::view-transition-new(root)'}).finished;await transition.finished;}catch{setTheme(next);}finally{setBusy(false);}}
 return <Button ref={ref} className="theme-toggle animated-theme-toggle" variant="outline" disabled={busy} aria-label={resolvedTheme==='dark'?'Switch to light mode':'Switch to dark mode'} title={resolvedTheme==='dark'?'Switch to light mode':'Switch to dark mode'} onClick={toggle}><Sun className="theme-sun" size={18}/><Moon className="theme-moon" size={18}/></Button>;
}
