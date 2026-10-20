"use client";
import {useId} from 'react';
import {Search} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Textarea} from '@/components/ui/textarea';
// Adapted from the user-supplied Uiverse.io design by ToraScriptCopy.
function SearchShell({children,multiline=false}:{children:React.ReactNode;multiline?:boolean}){const id='atlas-goo-'+useId().replace(/:/g,'');return <span className={'atlas-search-orb'+(multiline?' is-multiline':'')}><span className="orb-background" style={{filter:`url(#${id})`}} aria-hidden="true"><span className="orb-blob orb-one"/><span className="orb-blob orb-two"/><span className="orb-blob orb-three"/><span className="orb-bridge"/></span><span className="orb-overlay"><Search size={18} aria-hidden="true"/>{children}<span className="orb-focus" aria-hidden="true"/></span><svg className="orb-filter" aria-hidden="true"><defs><filter id={id}><feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo"/><feComposite in="SourceGraphic" in2="goo" operator="atop"/></filter></defs></svg></span>;}
export function AtlasSearch(props:React.ComponentProps<typeof Input>){return <SearchShell><Input {...props} aria-label={props['aria-label']||props.placeholder||'Search'}/></SearchShell>;}
export function AtlasSearchArea(props:React.ComponentProps<typeof Textarea>){return <SearchShell multiline><Textarea {...props}/></SearchShell>;}
