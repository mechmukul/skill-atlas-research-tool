function scoped(kind:'localStorage'|'sessionStorage'):Storage {const storage=()=>window[kind];const key=(k:string)=>{const id=new URLSearchParams(window.location.search).get('topic');return !id||id==='main'?k:'atlas-topic:'+id+':'+k;};return {getItem:k=>storage().getItem(key(k)),setItem:(k,v)=>storage().setItem(key(k),v),removeItem:k=>storage().removeItem(key(k)),clear:()=>{throw Error('Clear individual topic keys instead');},key:()=>null,get length(){return storage().length;}};}
export const topicLocalStorage=scoped('localStorage');
export const topicSessionStorage=scoped('sessionStorage');
