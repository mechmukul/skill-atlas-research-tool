import type {ReactNode} from 'react';
export function ResearchChip({children,tone='neutral'}:{children:ReactNode;tone?:'neutral'|'success'|'warning'|'accent'}){return <span className={'research-chip chip-'+tone}>{children}</span>;}
export function ResearchCount({count,label}:{count:number;label:string}){return count>0?<span className="research-count" aria-label={`${count} ${label}`}>{count}</span>:null;}
