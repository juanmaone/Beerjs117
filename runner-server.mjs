// Local-only runner. Every execution gets its own disposable, offline container.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';
import {images, specs, validateResult} from './demo-specs.mjs';
import {readFile} from 'node:fs/promises';
import {loadSyncConfig} from './sync-client.mjs';
import {validateState, readJson} from './sync/protocol.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const cwd = join(root, 'demos');
const TIMEOUT = 60000;
const OUTPUT_LIMIT = 64000;
function docker(args, timeout = TIMEOUT, onTimeout) {
  return new Promise(resolve => {
    let stdout = '', stderr = '', timedOut = false;
    const child = spawn('docker', args, {shell: false});
    const timer = setTimeout(() => {
      timedOut = true;
      // Killing only the Docker CLI can leave the container alive.
      if (onTimeout) onTimeout();
      child.kill('SIGKILL');
    }, timeout);
    child.stdout.on('data', data => { stdout = (stdout + data).slice(0, OUTPUT_LIMIT); });
    child.stderr.on('data', data => { stderr = (stderr + data).slice(0, OUTPUT_LIMIT); });
    child.once('error', error => {
      clearTimeout(timer);
      resolve({stdout, stderr, exitCode: 127, error: String(error)});
    });
    child.once('close', code => {
      clearTimeout(timer);
      const exitCode = timedOut ? 124 : (code ?? 1);
      resolve({stdout, stderr, exitCode, timedOut,
        ...([124,125,126,127].includes(exitCode) ? {error: timedOut ? 'La demo superó 60 segundos' : `Docker/comando falló: exit=${exitCode}`} : {})});
    });
  });
}

async function health() {
  const daemon = await docker(['info', '--format', '{{.ServerVersion}}'], 5000);
  if (daemon.exitCode !== 0) return {ok: false, error: 'Motor Docker no disponible', details: daemon.stderr};
  const inspected = await docker(['image', 'inspect', ...Object.values(images), '--format', '{{.Id}}'], 5000);
  if (inspected.exitCode !== 0) return {ok: false, error: 'Faltan imágenes locales. Ejecutá los tres docker build del README.', details: inspected.stderr};
  return {ok: true, dockerVersion: daemon.stdout.trim()};
}

export async function run(demo, variant, execute = docker) {
  const [key, ...command] = specs[demo][variant];
  const name = 'beerjs-demo-' + randomUUID();
  const versions = key === 'deno' ? 'deno --version' : 'node --version && npm --version';
  // Explicit entrypoint also works with images that already have a deno entrypoint.
  const args = ['run', '--rm', '--pull=never', '--name', name,
    '--network', 'none', '--memory', '512m', '--cpus', '1', '--pids-limit', '64',
    '--security-opt', 'no-new-privileges', '-e', 'DEMO_SECRET=DEMO_TOKEN_123',
    '-e', `DEMO_EXPECT_SCRIPTS=${key === 'node24' ? 'run' : 'block'}`,
    '-v', `${cwd}:/demo:ro`, '-w', '/demo', '--entrypoint', 'sh', images[key],
    '-c', `${versions} && exec "$@"`, 'beerjs', ...command];
  let cleanup;
  const result = await execute(args, TIMEOUT, () => {
    cleanup = execute(['rm', '--force', name], 5000);
  });
  if (cleanup) {
    const removed = await cleanup;
    if (removed.exitCode !== 0) result.stderr += '\nNo se pudo confirmar la limpieza del contenedor: ' + removed.stderr;
  }
  result.command = command.join(' ');
  result.image = images[key];
  result.validation = validateResult(demo, variant, result);
  return result;
}

export function createRunner({runDemo = run, checkHealth = health, sync = null, version = '1.0.0'} = {}) {
  let active = 0;
  let state={presentationVersion:version,slide:0,results:{}};
  const retry=setInterval(()=>{sync?.retry().catch(()=>{});},10000);retry.unref();
  const publish=()=>{if(sync)sync.publish(structuredClone(state)).catch(()=>{});};
  return http.createServer(async (req, res) => {
    const allowedOrigins=['null',`http://127.0.0.1:${req.socket.localPort}`,`http://localhost:${req.socket.localPort}`];
    if(req.headers.origin&&!allowedOrigins.includes(req.headers.origin)){res.writeHead(403).end();return;}
    if(req.headers.host&&!/^(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(req.headers.host)){res.writeHead(403).end();return;}
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin||'http://127.0.0.1:8787');
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const send = (code, data) => { res.writeHead(code); res.end(JSON.stringify(data)); };
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    if(req.method==='GET'&&(pathname==='/'||pathname==='/beerjs-legado-node.html'||/^\/assets\/[a-zA-Z0-9_.-]+$/.test(pathname))){
      const name=pathname==='/'?'beerjs-legado-node.html':pathname.slice(1);
      try{
        const bytes=await readFile(join(root,name));
        const ext=name.split('.').pop();
        res.setHeader('Content-Type',({html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css',png:'image/png'})[ext]||'text/plain');res.end(bytes);
      }catch{send(404,{error:'Archivo no generado; ejecutar npm run build'});}return;
    }
    if(req.url==='/session'){
      if(req.method==='GET'){send(200,sync?sync.publicInfo():{configured:false,session:null});return;}
      if(!sync){send(503,{error:'Configurar .local/sync.json según docs/PUBLICACION.md'});return;}
      try{
        if(req.method==='POST'){
          const initial=await readJson(req);
          if(!validateState(initial)||initial.presentationVersion!==version){send(400,{error:'Estado inválido'});return;}
          state=initial;send(201,await sync.create(state));
        }else if(req.method==='DELETE'){await sync.close();send(200,{ok:true});}
        else send(405,{error:'Método inválido'});
      }catch(error){send(503,{error:error.message});}return;
    }
    if(req.url==='/state'&&req.method==='POST'){
      try{
        const incoming=await readJson(req);
        if(!validateState(incoming)||incoming.presentationVersion!==version){send(400,{error:'Estado inválido'});return;}
        state=incoming;publish();send(202,{ok:true});
      }catch{send(400,{error:'Estado inválido'});}return;
    }
    if (req.url === '/health' && req.method === 'GET') {
      const status = await checkHealth(); send(status.ok ? 200 : 503, status); return;
    }
    if (req.url !== '/run' || req.method !== 'POST') { send(404, {}); return; }
    if (active >= 3) { send(429, {error: 'Ya hay tres demos en ejecución. Esperá a que terminen.'}); return; }
    let body = '';
    try {
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1000) { send(413, {error: 'Solicitud demasiado grande'}); return; }
      }
      const {demo, variant} = JSON.parse(body);
      if (!Number.isInteger(demo) || !Number.isInteger(variant) || variant < 0 || variant > 2 || !specs[demo]) {
        send(400, {error: 'Demo o variante inválida'}); return;
      }
      // Recheck after reading the body, before reserving a slot.
      if (active >= 3) { send(429, {error: 'Ya hay tres demos en ejecución'}); return; }
      active++;
      try {
        const key=demo+'-'+variant,command=specs[demo][variant].slice(1).join(' ');
        state.results[key]={command,text:'▶ Ejecutando…',status:'running',source:'live',exitCode:null};publish();
        let result;
        try{result=await runDemo(demo, variant);}catch(error){result={command,stdout:'',stderr:error.message,exitCode:127,error:'Error del runner'};}
        const text='$ '+(result.command||command)+'\n'+(result.stdout||'')+'\n[stderr]\n'+(result.stderr||'')+'\nexit='+result.exitCode+(result.error?'\nERROR: '+result.error:'');
        state.results[key]={command,text:text.length>15900?text.slice(0,15900)+'\n[SALIDA TRUNCADA PARA TELÉFONOS]':text,status:result.error?'error':'finished',source:'live',exitCode:result.exitCode};publish();
        send(200,result);
      } finally { active--; }
    } catch (error) { if (!res.headersSent) send(400, {error: String(error)}); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const config=JSON.parse(await readFile(join(root,'project.config.json'),'utf8'));
  const server = createRunner({sync:await loadSyncConfig(),version:config.version});
  server.on('error', error => { console.error('No se pudo iniciar el runner:', error.message); process.exitCode = 1; });
  server.listen(8787, '127.0.0.1', () => console.log('BeerJS runner: http://127.0.0.1:8787'));
}
