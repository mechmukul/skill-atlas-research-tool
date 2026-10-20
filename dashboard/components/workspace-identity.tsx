"use client";
import {useTopics} from './topic-provider';
import {motion,useReducedMotion} from 'motion/react';
import {IconUserBolt} from '@tabler/icons-react';
export function WorkspaceIdentity(){const reduced=useReducedMotion();const profile=useTopics()?.registry.profile;return <motion.div className="workspace-owner" initial={reduced?false:{opacity:0}} animate={{opacity:1}}><span aria-hidden="true"><IconUserBolt size={20}/></span><div><strong>{profile?.name||'Researcher'}</strong><small>{profile?.title||'Research workspace'}</small></div></motion.div>;}
