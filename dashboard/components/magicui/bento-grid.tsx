import type {ComponentPropsWithoutRef,ReactNode,ComponentType} from 'react';
import {ArrowRight} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
export function BentoGrid({className,...props}:ComponentPropsWithoutRef<'div'>){return <div className={cn('atlas-bento-grid',className)} {...props}/>;}
export function BentoPanel({className,...props}:ComponentPropsWithoutRef<'article'>){return <article className={cn('atlas-bento-card',className)} {...props}/>;}
type BentoCardProps=Omit<ComponentPropsWithoutRef<'article'>,'children'> & {name:string;background?:ReactNode;Icon:ComponentType<{size?:number;'aria-hidden'?:boolean|'true'|'false'}>;description:string;href:string;cta:string};
export function BentoCard({name,background,Icon,description,href,cta,className,...props}:BentoCardProps){return <BentoPanel className={cn('atlas-bento-navigation',className)} {...props}>{background&&<div className="bento-background" aria-hidden="true">{background}</div>}<div className="bento-content"><Icon size={28} aria-hidden="true"/><h2>{name}</h2><p>{description}</p><Button variant="link" asChild><a href={href}>{cta}<ArrowRight size={16}/></a></Button></div></BentoPanel>;}
