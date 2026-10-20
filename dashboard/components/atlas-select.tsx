"use client";
import {Children,isValidElement,type ReactNode,type ComponentProps} from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
// Dropdown presentation adapted from the supplied Uiverse.io gharsh11032000 menu.
type Props=Omit<ComponentProps<'select'>,'onChange'|'value'|'defaultValue'|'multiple'|'size'> & {value?:string|number;defaultValue?:string|number;onChange?:(event:{target:{value:string}})=>void};
function text(node:ReactNode):string{return Children.toArray(node).map(n=>isValidElement<{children?:ReactNode}>(n)?text(n.props.children):String(n)).join('');}
export function AtlasSelect({children,value,defaultValue,onChange,id,disabled,name,required,className,style,'aria-label':label,'aria-describedby':description}:Props){
 const options=Children.toArray(children).filter(isValidElement).map(n=>{const p=n.props as {value?:string|number;children?:ReactNode;disabled?:boolean};return {value:String(p.value??text(p.children)),label:text(p.children),disabled:p.disabled};});
 const encode=(v:string|number)=>'option:'+v;
 return <Select value={value===undefined?undefined:encode(value)} defaultValue={defaultValue===undefined?undefined:encode(defaultValue)} onValueChange={v=>onChange?.({target:{value:v.slice(7)}})} disabled={disabled} name={name} required={required}><SelectTrigger id={id} aria-label={label} aria-describedby={description} className={'atlas-menu-trigger '+(className||'')} style={style}><SelectValue/></SelectTrigger><SelectContent className="atlas-menu-content" position="popper">{options.map(o=><SelectItem key={o.value} value={encode(o.value)} disabled={o.disabled} className="atlas-menu-option">{o.label}</SelectItem>)}</SelectContent></Select>;
}
