export const demoKeys=[4,5,6,7,9,11].flatMap(d=>[0,1,2].map(v=>`${d}-${v}`));
export const MAX_BODY=400000;
export function validateState(value){
 if(!value||typeof value!=='object'||typeof value.presentationVersion!=='string'||value.presentationVersion.length>40||!Number.isInteger(value.slide)||value.slide<0||value.slide>16||!value.results||typeof value.results!=='object'||Array.isArray(value.results))return false;
 if(Object.keys(value).some(k=>!['presentationVersion','slide','results'].includes(k)))return false;
 for(const [key,r] of Object.entries(value.results)){
  if(!demoKeys.includes(key)||!r||typeof r!=='object'||Object.keys(r).some(k=>!['command','text','status','source','exitCode'].includes(k)))return false;
  if(typeof r.command!=='string'||r.command.length>1000||typeof r.text!=='string'||r.text.length>16000||!['running','finished','idle','error'].includes(r.status)||!['live','backup','offline'].includes(r.source)||!(r.exitCode===null||Number.isInteger(r.exitCode)))return false;
 }
 return true;
}
export async function readJson(request){
 const stream=request.body??request;
 if(!stream[Symbol.asyncIterator])throw Error('Falta cuerpo JSON');
 let size=0;const chunks=[];
 for await(const value of stream){size+=value.byteLength;if(size>MAX_BODY)throw Error('Solicitud demasiado grande');chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
