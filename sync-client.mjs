import {readFile} from 'node:fs/promises';
import {validateState} from './sync/protocol.mjs';
export class SyncClient {
 constructor(config){
  this.config=config;this.session=null;this.error='';this.queue=Promise.resolve();this.latest=null;this.revision=0;this.sent=0;
  const url=new URL(config.syncUrl);
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('syncUrl requiere HTTPS');
 }
 async request(path,method,token,body){
  const response=await fetch(this.config.syncUrl.replace(/\/$/,'')+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw Error(`Sincronización: HTTP ${response.status}`);
  return response.json();
 }
 async create(state){
  if(this.session)throw Error('Cerrar la sesión actual antes de crear otra');
  this.session=await this.request('/sessions','POST',this.config.createToken);
  this.latest=state;await this.publish(state);return this.publicInfo();
 }
 publicInfo(){return {configured:true,session:this.session?{id:this.session.id,expiresAt:this.session.expiresAt,url:this.config.siteUrl+'beerjs-legado-node.html?session='+this.session.id}:null,error:this.error};}
 publish(state){
  if(!validateState(state))throw Error('Estado local inválido');
  const snapshot=structuredClone(state),revision=++this.revision;
  this.latest=snapshot;
  const session=this.session;if(!session)return Promise.resolve();
  // Serialize full snapshots so slow responses cannot roll back later results.
  this.queue=this.queue.catch(()=>{}).then(async()=>{
   if(this.session!==session||revision<=this.sent)return;
   // After a failed connection, recover the newest snapshot and skip stale work.
   const selected=this.error?this.latest:snapshot,selectedRevision=this.error?this.revision:revision;
   try{await this.request(`/sessions/${session.id}/state`,'PUT',session.publishToken,selected);this.sent=selectedRevision;this.error='';}
   catch(error){this.error=error.message;}
  });
  return this.queue;
 }
 async close(){
  const session=this.session;if(!session)return;
  await this.queue;
  await this.request('/sessions/'+session.id,'DELETE',session.publishToken);
  this.session=null;this.error='';
 }
 async retry(){if(this.error&&this.latest&&this.session)await this.publish(this.latest);}
}
export async function loadSyncConfig(){
 try{
  const publicConfig=JSON.parse(await readFile(new URL('./project.config.json',import.meta.url),'utf8'));
  const local=JSON.parse(await readFile(new URL('./.local/sync.json',import.meta.url),'utf8'));
  return new SyncClient({...local,siteUrl:local.siteUrl||publicConfig.siteUrl,syncUrl:local.syncUrl||publicConfig.syncUrl});
 }catch(error){if(error.code==='ENOENT')return null;throw error;}
}
