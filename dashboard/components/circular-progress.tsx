"use client";
import {useId} from 'react';

export function CircularProgress({value,label,description}:{value:number;label:string;description?:string}){
 const id=useId();const percent=Number.isFinite(value)?Math.min(100,Math.max(0,value)):0;
 return <div className={'atlas-circular-progress'+(percent===100?' is-complete':'')}><div className="circular-meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-labelledby={id} aria-valuetext={description||`${Math.round(percent)}%`}><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="circular-track" cx="50" cy="50" r="45" fill="none" strokeWidth="8"/><circle className="circular-value" cx="50" cy="50" r="45" fill="none" strokeWidth="8" pathLength="100" strokeDasharray={`${percent} 100`} strokeLinecap={percent===0?'butt':'round'} transform="rotate(-90 50 50)"/></svg><span>{Math.round(percent)}%</span></div><p id={id}>{label}</p></div>;
}
