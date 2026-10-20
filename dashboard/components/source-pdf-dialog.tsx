'use client';
import {Button} from './ui/button';import {openSourcePaper} from '@/lib/source-navigation';
export function SourcePdfDialog({paperId,title,initialPage=1,initialQuery=''}:{paperId:string;title:string;initialPage?:number;initialQuery?:string}){return <Button variant="outline" onClick={()=>openSourcePaper(paperId,{title,page:initialPage,q:initialQuery})}>Open source PDF · skim & evidence</Button>;}
