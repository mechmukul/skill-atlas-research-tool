export function uniqueVisualPapers<T extends {id:string;sha256?:string;duplicateOf?:string;visualRunId?:string}>(papers:T[]):T[]{
 const seen=new Set<string>();
 return [...papers].sort((a,b)=>Number(!!b.visualRunId)-Number(!!a.visualRunId)||Number(!!a.duplicateOf)-Number(!!b.duplicateOf)).filter(p=>{const key=p.sha256||p.duplicateOf||p.id;if(seen.has(key))return false;seen.add(key);return true;});
}
