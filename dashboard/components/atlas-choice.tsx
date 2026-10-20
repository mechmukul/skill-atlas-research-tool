"use client";
import {useId} from 'react';
import {ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Popover,PopoverTrigger,PopoverContent} from '@/components/ui/popover';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
// Compact adaptation of the supplied Uiverse.io radio design by pharmacist-sabot.
export function AtlasChoice({label,value,onChange,options,disabled=false}:{label:string;value:string;onChange:(value:string)=>void;options:{value:string;label:string}[];disabled?:boolean}){
 const id=useId();
 return <Popover><PopoverTrigger asChild><Button type="button" variant="outline" className="atlas-choice-trigger" disabled={disabled} aria-label={label+': '+(options.find(o=>o.value===value)?.label||'Choose')}><span className="choice-led" aria-hidden="true"/><span>{options.find(o=>o.value===value)?.label||'Choose'}</span><ChevronDown size={16}/></Button></PopoverTrigger><PopoverContent className="atlas-choice-popup" align="start"><p className="choice-heading">{label}</p><RadioGroup value={value} onValueChange={onChange} aria-label={label} className="atlas-choice-list">{options.map((o,i)=><label className="atlas-choice-row" key={o.value} htmlFor={id+'-'+i}><RadioGroupItem id={id+'-'+i} value={o.value}/><span>{o.label}</span></label>)}</RadioGroup></PopoverContent></Popover>;
}
