'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
type Size='compact'|'comfortable';
const Context=createContext<{size:Size;setSize:(size:Size)=>void}>({size:'compact',setSize:()=>{}});
export function DisplayPreferences({children}:{children:ReactNode}){
 const [size,setSize]=useState<Size>('compact');
 useEffect(()=>{let saved:Size='compact';try{if(localStorage.getItem('atlas-control-size')==='comfortable')saved='comfortable';}catch{}document.documentElement.dataset.controlSize=saved;queueMicrotask(()=>setSize(saved));},[]);
 function update(value:Size){setSize(value);document.documentElement.dataset.controlSize=value;try{localStorage.setItem('atlas-control-size',value);}catch{}}
 return <Context.Provider value={{size,setSize:update}}>{children}</Context.Provider>;
}
export function ControlSizeToggle(){const {size,setSize}=useContext(Context);return <div className="control-size-switch" role="group" aria-label="Control size">{(['compact','comfortable'] as const).map(value=><button key={value} type="button" aria-pressed={size===value} onClick={()=>setSize(value)}>{value==='compact'?'Compact':'Comfortable'}</button>)}</div>;}
export function ControlSizeSettings(){return <section className="panel appearance-settings"><h2>Control size</h2><p>Compact buttons leave more room for reading. Comfortable gives controls larger targets. Text size stays the same.</p><ControlSizeToggle/></section>;}
