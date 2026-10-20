import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export class Topics {
 constructor(root){this.root=root;this.file=path.join(root,'topics.json');fs.mkdirSync(root,{recursive:true});if(!fs.existsSync(this.file))this.write({profile:{name:'',title:'',institution:''},topics:[{id:'main',name:fs.existsSync(path.join(root,'research.sqlite'))?'My existing research':'My research',question:'',template:fs.existsSync(path.join(root,'synthesis/dataset.json'))?'legacy':'general'}],onboarded:false});}
 read(){return JSON.parse(fs.readFileSync(this.file,'utf8'));}
 write(value){const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify(value,null,2),{mode:0o600});fs.renameSync(temp,this.file);return value;}
 update(input){const state=this.read();const text=(v,max=300)=>{if(typeof v!=='string'||v.length>max)throw Error('Invalid or oversized profile field');return v.trim();};
 if(input.action==='profile'){state.profile={name:text(input.name),title:text(input.title),institution:text(input.institution)};if(!state.profile.name)throw Error('Enter your name');state.onboarded=true;}
 else if(input.action==='create'){if(state.topics.length>=5)throw Error('You can have a maximum of five research topics');const name=text(input.name);if(!name)throw Error('Enter a topic title');state.topics.push({id:randomUUID(),name,question:text(input.question,3000),template:'general'});}
 else if(input.action==='edit'){const topic=state.topics.find(t=>t.id===input.id);if(!topic)throw Error('Unknown topic');const name=text(input.name);if(!name)throw Error('Enter a topic title');topic.name=name;topic.question=text(input.question,3000);}
 else throw Error('Unknown topic action');return this.write(state);}
 get(id){const topic=this.read().topics.find(t=>t.id===id);if(!topic)throw Error('Unknown research topic');return topic;}
 paths(id){this.get(id);return id==='main'?{local:this.root,research:null}:{local:path.join(this.root,'topics',id),research:path.join(this.root,'topics',id,'research')};}
}
