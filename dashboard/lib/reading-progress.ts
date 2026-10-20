import type {Row,SlrState} from './synthesis.ts';
export function deferReadingPage(state:SlrState,rows:Row[],nextId=''):SlrState{
 const notes={...state.notes};
 for(const row of rows)if(notes['reading-bank:'+row.statement_id]!=='selected')notes['reading-decision:'+row.statement_id]='not-selected';
 if(nextId)notes['reading-position:all']=nextId;
 return {...state,notes};
}
export function readingGroups(rows:Row[],state:SlrState,moving:string[]=[]){
 const collected=rows.filter(s=>state.notes['reading-bank:'+s.statement_id]==='selected'&&!moving.includes(s.statement_id));
 const deferred=rows.filter(s=>state.notes['reading-bank:'+s.statement_id]!=='selected'&&state.notes['reading-decision:'+s.statement_id]==='not-selected');
 const remaining=rows.filter(s=>moving.includes(s.statement_id)||(state.notes['reading-bank:'+s.statement_id]!=='selected'&&state.notes['reading-decision:'+s.statement_id]!=='not-selected'));
 return {collected,deferred,remaining};
}
