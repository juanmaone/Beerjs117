import {validateState,readJson} from './protocol.mjs';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('');
async function authorized(request,expected){
 if(!expected)return false;
 return await digest(request.headers.get('Authorization')||'')===await digest('Bearer '+expected);
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin');
  if(origin&&origin!==env.ALLOWED_ORIGIN)return json({error:'Origen no autorizado'},403);
  const cors=response=>{
   if(response.status===101)return response;
   const headers=new Headers(response.headers);
   if(origin)headers.set('Access-Control-Allow-Origin',env.ALLOWED_ORIGIN);
   headers.set('Vary','Origin');
   headers.set('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
   headers.set('Access-Control-Allow-Headers','Authorization,Content-Type');
   return new Response(response.body,{status:response.status,headers});
  };
  if(request.method==='OPTIONS')return cors(new Response(null,{status:204}));
  try{
   const path=new URL(request.url).pathname;
   if(path==='/sessions'&&request.method==='POST'){
    if(!await authorized(request,env.CREATE_TOKEN))return cors(json({error:'No autorizado'},401));
    const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
    const stub=env.SESSIONS.get(env.SESSIONS.idFromName(id));
    const created=await stub.fetch(new Request('https://internal/create',{method:'POST',body:JSON.stringify({token})}));
    if(!created.ok)throw Error('No se pudo crear la sesión');
    return cors(json({id,publishToken:token,expiresAt:Date.now()+86400000},201));
   }
   const match=/^\/sessions\/([0-9a-f-]{36})(?:\/(state|ws))?$/.exec(path);
   if(!match)return cors(json({error:'Ruta inexistente'},404));
   return cors(await env.SESSIONS.get(env.SESSIONS.idFromName(match[1])).fetch(request));
  }catch{return cors(json({error:'Solicitud inválida o servicio no disponible'},400));}
 }
};
// SQLite backend selected by new_sqlite_classes in wrangler.jsonc.
// The Hibernation API keeps sockets alive without a timer per viewer.
export class Session {
 constructor(ctx,env){this.ctx=ctx;this.env=env;}
 async fetch(request){
  const path=new URL(request.url).pathname;
  if(path==='/create'){
   const {token}=await readJson(request);
   await this.ctx.storage.put('session',{tokenHash:await digest(token),expiresAt:Date.now()+86400000,sequence:0,state:null});
   await this.ctx.storage.setAlarm(Date.now()+86400000);
   return json({ok:true});
  }
  const session=await this.ctx.storage.get('session');
  if(!session)return json({error:'Sesión cerrada o inexistente'},404);
  if(session.expiresAt<=Date.now()){await this.alarm();return json({error:'Sesión expirada'},410);}
  const publisher=async()=>{
   const header=request.headers.get('Authorization')||'';
   return header.startsWith('Bearer ')&&await digest(header.slice(7))===session.tokenHash;
  };
  const snapshot=()=>({type:'state',state:session.state,expiresAt:session.expiresAt});
  if(path.endsWith('/ws')&&request.method==='GET'){
   if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return json({error:'Requiere WebSocket'},426);
   if(this.ctx.getWebSockets().length>=150)return json({error:'Capacidad de sesión alcanzada'},429);
   const [client,server]=Object.values(new WebSocketPair());
   this.ctx.acceptWebSocket(server);server.send(JSON.stringify(snapshot()));
   return new Response(null,{status:101,webSocket:client});
  }
  if(path.endsWith('/state')&&request.method==='GET')return json(snapshot());
  if(path.endsWith('/state')&&request.method==='PUT'){
   if(!await publisher())return json({error:'No autorizado'},401);
   let state;try{state=await readJson(request);}catch{return json({error:'JSON inválido o demasiado grande'},400);}
   if(!validateState(state))return json({error:'Estado inválido'},400);
   session.state={...state,sequence:++session.sequence,updatedAt:new Date().toISOString()};
   await this.ctx.storage.put('session',session);
   this.broadcast(snapshot());return json({ok:true,sequence:session.sequence});
  }
  if(/\/sessions\/[0-9a-f-]{36}$/.test(path)&&request.method==='DELETE'){
   if(!await publisher())return json({error:'No autorizado'},401);
   await this.alarm();return json({ok:true});
  }
  return json({error:'Ruta inexistente'},404);
 }
 broadcast(data){for(const socket of this.ctx.getWebSockets()){try{socket.send(JSON.stringify(data));}catch{socket.close(1011,'Error de conexión');}}}
 async alarm(){
  this.broadcast({type:'closed'});
  for(const socket of this.ctx.getWebSockets())socket.close(1000,'Sesión cerrada o expirada');
  await this.ctx.storage.deleteAll();await this.ctx.storage.deleteAlarm();
 }
 // Spectator frames never publish state or trigger any operation.
 webSocketMessage(socket){socket.close(1008,'Solo lectura');}
 webSocketClose(socket,code){socket.close(code===1005?1000:code);}
 webSocketError(socket){socket.close(1011,'Error de conexión');}
}
