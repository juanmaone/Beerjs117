/* Only public data crosses the sync boundary. Credentials stay in the local runner. */
(()=>{
 const config=globalThis.BEERJS_CONFIG;
 if(!config)return;
 document.title=config.title;
 document.querySelectorAll('.materials-link').forEach(e=>{e.href=config.siteUrl;e.textContent=config.siteUrl.replace(/^https:\/\//,'');});
 document.querySelectorAll('.credit').forEach(e=>e.textContent=`${config.author} · ${config.version} · Código y skill MIT · Slides y guía CC BY 4.0`);
 const params=new URLSearchParams(location.search),session=params.get('session');
 const spectator=Boolean(session)||location.protocol==='https:';
 const tools=document.createElement('div');tools.className='live-tools';document.body.append(tools);
 const status=document.createElement('span');status.className='live-status';status.setAttribute('role','status');
 function button(label,action){const b=document.createElement('button');b.textContent=label;b.onclick=action;tools.append(b);return b;}
 const local=location.protocol==='http:'&&['127.0.0.1','localhost'].includes(location.hostname)?location.origin:'http://127.0.0.1:8787';
 const post=async(path,method,body)=>{const r=await fetch(local+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(6500)});const d=await r.json();if(!r.ok)throw Error(d.error||'HTTP '+r.status);return d;};
 const truncate=text=>text.length>15900?text.slice(0,15900)+'\n[SALIDA TRUNCADA PARA TELÉFONOS]':text;
 if(!spectator){
  let state={presentationVersion:config.version,slide:current,results:{}},info=null;
  const panel=document.createElement('div');panel.className='live-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Sesión en vivo');
  const title=document.createElement('h2');title.textContent='Seguimiento desde teléfonos';panel.append(title);
  const detail=document.createElement('p'),link=document.createElement('a'),canvas=document.createElement('canvas');
  panel.append(detail,canvas,link);document.body.append(panel);
  async function refresh(){try{info=await post('/session','GET');status.textContent=info.error|| (info.session?'Sesión activa':'Sin sesión');detail.textContent=info.configured?'Sesiones de lectura · expiran a las 24 horas.':'Completar .local/sync.json según docs/PUBLICACION.md';
   canvas.hidden=link.hidden=!info.session;
   const opening=document.getElementById('openingLive');opening.replaceChildren();
   if(info.session){link.href=info.session.url;link.textContent=info.session.url;await QRCode.toCanvas(canvas,link.href,{width:240,margin:4});const c=document.createElement('canvas'),a=document.createElement('a');a.href=link.href;a.textContent=link.href;await QRCode.toCanvas(c,link.href,{width:160,margin:4});opening.append(c,a);}
  }catch(error){status.textContent=error.message;}}
  button('En vivo / QR',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)refresh();});
  for(const [label,action] of [['Crear sesión',async()=>{await post('/session','POST',state);await refresh();}],['Cerrar sesión',async()=>{await post('/session','DELETE');await refresh();}],['Ocultar',()=>{panel.hidden=true;}]]){
   const b=document.createElement('button');b.textContent=label;b.onclick=()=>Promise.resolve().then(action).catch(e=>{detail.textContent=e.message;});panel.append(b);
  }
  let queue=Promise.resolve();
  function publish(){const snapshot=structuredClone(state);queue=queue.catch(()=>{}).then(()=>post('/state','POST',snapshot)).catch(error=>{status.textContent=error.message;});}
  window.beerLive={slide(slide){state.slide=slide;publish();},terminal(key,output,execution,source){
   const cmd=document.querySelector(`#term-${key} .cmd`)?.textContent.replace(/^\$\s*/,'')||'';
   const exit=/\bexit=(-?\d+)/.exec(output.textContent);
   state.results[key]={command:cmd,text:truncate(output.textContent),status:output.classList.contains('error')?'error':execution,source,exitCode:exit?Number(exit[1]):null};publish();
  }};
  setInterval(refresh,8000);refresh();tools.append(status);return;
 }
 document.body.classList.add('spectator');modeEpoch++;mode='offline';
 document.querySelectorAll('input[type=file]').forEach(e=>e.disabled=true);
 let following=true,latest=null,closed=false,socket=null,retryTimer=null,lastMessage=Date.now();
 const follow=button('Pausar seguimiento',()=>{following=!following;follow.textContent=following?'Pausar seguimiento':'Volver al directo';if(following&&latest)apply(latest);});
 let font=16;button('Texto +',()=>{font=Math.min(30,font+2);document.body.style.setProperty('--console-size',font+'px');});button('Texto −',()=>{font=Math.max(12,font-2);document.body.style.setProperty('--console-size',font+'px');});
 tools.append(status);
 // Replace only entry points that can execute demos. Local navigation remains individual.
 window.runDemo=async()=>{};window.runAll=async()=>{};window.selectMode=async()=>{};window.loadCapture=async()=>{};
 const navigate=window.go;
 window.go=n=>{if(latest&&n!==latest.slide){following=false;follow.textContent='Volver al directo';}navigate(n);};
 function apply(state){
  navigate(state.slide);
  for(const key of [4,5,6,7,9,11].flatMap(d=>[0,1,2].map(v=>`${d}-${v}`))){
   const output=document.querySelector(`#term-${key} .output`),r=state.results[key];
   output.classList.remove('ok','error');
   if(!r){output.textContent='Aún sin ejecución compartida';continue;}
   output.textContent=`[${r.source==='backup'?'RESPALDO':r.source==='live'?'EN VIVO':'SIN EJECUCIÓN'} · ${r.status}]\n${r.text}`;
   output.classList.add(r.exitCode!==null&&r.exitCode!==0||r.status==='error'?'error':'ok');
  }
 }
 async function receive(data){
  lastMessage=Date.now();
  if(data.type==='closed'){closed=true;status.textContent='Sesión cerrada o expirada';socket?.close();return;}
  if(data.type!=='state')return;
  if(data.state){
   if(data.state.presentationVersion!==config.version){closed=true;status.textContent='Versión diferente: recargá los materiales de esta sesión';socket?.close();return;}
   if(!latest||data.state.sequence>=latest.sequence){latest=data.state;if(following)apply(latest);}
  }
  status.textContent=following?'Conectado · siguiendo':'Conectado · pausado';
 }
 function reconnect(){if(closed)return;clearTimeout(retryTimer);retryTimer=setTimeout(connect,2500);}
 async function connect(){
  if(closed)return;
  try{
   const base=config.syncUrl.replace(/\/$/,'')+'/sessions/'+session;
   const r=await fetch(base+'/state',{cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(r.status===404||r.status===410){receive({type:'closed'});return;}
   if(!r.ok)throw Error('HTTP '+r.status);
   await receive(await r.json());
   socket=new WebSocket(base.replace(/^http/,'ws')+'/ws');
   socket.onmessage=e=>{try{receive(JSON.parse(e.data));}catch{status.textContent='Mensaje inválido';}};
   socket.onerror=()=>{status.textContent='Sin conexión · reconectando…';};
   socket.onclose=()=>{if(!closed){status.textContent='Sin conexión · reconectando…';reconnect();}};
  }catch{status.textContent='Sin conexión · reconectando…';reconnect();}
 }
 if(!session){status.textContent='Materiales · abrí el QR de sesión para seguir al expositor';follow.disabled=true;return;}
 if(!/^[0-9a-f-]{36}$/.test(session)||!config.syncUrl){status.textContent='Sesión o servicio sin configurar';return;}
 connect();
 // Detect dead links even when a mobile network does not close its old socket.
 setInterval(async()=>{
  if(closed||Date.now()-lastMessage<12000)return;
  try{const r=await fetch(config.syncUrl.replace(/\/$/,'')+'/sessions/'+session+'/state',{cache:'no-store',signal:AbortSignal.timeout(5000)});if(r.status===404||r.status===410)receive({type:'closed'});else if(r.ok)receive(await r.json());else throw Error();}
  catch{status.textContent='Sin conexión · reconectando…';socket?.close();if(!socket||socket.readyState===3)reconnect();}
 },5000);
})();
