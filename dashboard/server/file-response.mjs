import {open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {pipeline} from 'node:stream/promises';
// Callers must resolve the file through their existing root/manifest checks.
// Open before sending headers: permission failures must not become broken 200s.
export async function sendFile(res,file,headers){
 const handle=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW||0));let stream;
 try{const stat=await handle.stat();if(!stat.isFile()){const error=new Error('Requested resource is not a regular file.');error.code='EINVAL';throw error;}stream=handle.createReadStream();res.writeHead(200,{'Content-Length':stat.size,'Cache-Control':'no-store',...headers});await pipeline(stream,res);}
 finally{if(stream)stream.destroy();await handle.close().catch(()=>{});}
}
export function requestFailure(error){
 if(['EPERM','EACCES'].includes(error.code))return {status:503,code:'LOCAL_FILE_ACCESS',error:'Atlas cannot access a local research file or folder. The local service needs its file access restored; your saved evidence has not been deleted.'};
 if(error.code==='ENOENT')return {status:404,code:'FILE_NOT_FOUND',error:'The requested local file is unavailable. Check its source link or restore the original file.'};
 return {status:400,error:error.message||'Request failed.'};
}
