import {readFile,writeFile,mkdir,copyFile,readdir,rm} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {zipSync,unzipSync,strToU8} from 'fflate';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {PNG} from 'pngjs';
import {build} from 'esbuild';
import {specs,validateResult} from '../demo-specs.mjs';
import './guide.mjs';
import './build-sync.mjs';
const c=JSON.parse(await readFile('project.config.json','utf8'));
if(c.version!==JSON.parse(await readFile('package.json','utf8')).version)throw Error('Versiones inconsistentes');
if(!/^https:\/\//.test(c.siteUrl)||!c.siteUrl.endsWith('/'))throw Error('siteUrl debe ser HTTPS y terminar en /');
if(c.syncUrl&&!/^https:\/\//.test(c.syncUrl))throw Error('syncUrl pública debe ser HTTPS');
const report=await readFile('node-security-audit/references/report.md','utf8');
for(const value of [c.author,c.title,c.skill,c.skillVersion,c.repository])if(!report.includes(value))throw Error('Atribución de skill inconsistente: '+value);
const output=resolve('dist');
if(output!==fileURLToPath(new URL('../dist',import.meta.url)))throw Error('Ejecutar build desde la raíz del proyecto');
await rm(output,{recursive:true,force:true});
await mkdir('assets',{recursive:true});await mkdir('dist/assets',{recursive:true});await mkdir('dist/downloads',{recursive:true});
await writeFile('assets/config.js','globalThis.BEERJS_CONFIG='+JSON.stringify(c)+';\n');
const require=createRequire(import.meta.url);
// Resolve using Node APIs: esbuild's Windows filesystem traversal may lack
// access to ancestor directories even when the project itself is readable.
await build({entryPoints:[resolve('node_modules/qrcode/lib/browser.js')],bundle:true,platform:'browser',format:'iife',globalName:'QRCode',outfile:'assets/qrcode.js',minify:true,legalComments:'eof',tsconfigRaw:{},plugins:[{
 name:'project-files',setup(build){
  build.onResolve({filter:/.*/},args=>({path:require.resolve(args.path.startsWith('.')?resolve(args.resolveDir,args.path):args.path,{paths:[args.resolveDir||process.cwd()]}),namespace:'readable'}));
  build.onLoad({filter:/.*/,namespace:'readable'},async args=>({contents:await readFile(args.path,'utf8'),loader:extname(args.path)==='.json'?'json':'js',resolveDir:dirname(args.path)}));
 }
}]});
await copyFile('node_modules/qrcode/license','assets/qrcode-LICENSE');
await copyFile('node_modules/dijkstrajs/LICENSE.md','assets/dijkstrajs-LICENSE');
await QRCode.toFile('assets/materiales-qr.png',c.siteUrl,{width:480,margin:4,errorCorrectionLevel:'M'});
const png=PNG.sync.read(await readFile('assets/materiales-qr.png'));
if(jsQR(new Uint8ClampedArray(png.data),png.width,png.height)?.data!==c.siteUrl)throw Error('QR de materiales no decodifica al sitio');
for(const [name,url] of [['linkedin',c.linkedinUrl],['skill',c.skillUrl]]){
 await QRCode.toFile(`assets/${name}-qr.png`,url,{width:600,margin:4,errorCorrectionLevel:'M'});
 const qr=PNG.sync.read(await readFile(`assets/${name}-qr.png`));
 if(jsQR(new Uint8ClampedArray(qr.data),qr.width,qr.height)?.data!==url)throw Error('QR inválido: '+name);
}
const content=['beerjs-legado-node.html','project.config.json','README.md','guion-25-30-minutos.md','preguntas.md','LICENSE','LICENSE-CONTENT.md','THIRD-PARTY.md','VALIDACION.md','runner-server.mjs','sync-client.mjs','demo-specs.mjs','capture-backup.mjs','abrir-presentacion.bat','iniciar-demos.bat','Dockerfile.node24','Dockerfile.node26','Dockerfile.deno','package.json','package-lock.json'];
async function files(dir){let out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('No empaquetar enlaces simbólicos');const path=join(dir,e.name).replaceAll('\\','/');if(e.isDirectory())out.push(...await files(path));else out.push(path);}return out;}
const assets=['assets/config.js','assets/qrcode.js','assets/qrcode-LICENSE','assets/dijkstrajs-LICENSE','assets/materiales-qr.png','assets/linkedin-qr.png','assets/skill-qr.png','assets/live.js','assets/live.css'];
const talkFiles=[...content,...assets,
 ...['read-secret.mjs','env-secret.mjs','outbound.mjs','network-demo.mjs','spawn.mjs','install-demo.mjs','typecheck.ts','secret.txt','demo-hook/package.json','demo-hook/preinstall.cjs','demo-hook/postinstall.cjs'].map(f=>'demos/'+f),
 ...['guide.mjs','build.mjs','build-sync.mjs','browser.mjs','browser-check.mjs','sync-check.mjs','package-check.mjs','prepare-git.ps1','render-guide.ps1','render-guide.mjs'].map(f=>'scripts/'+f),
 ...['worker.mjs','protocol.mjs','wrangler.jsonc','dev.jsonc','package.json','generated-worker.mjs'].map(f=>'sync/'+f),
 'docs/PUBLICACION.md','docs/SKILL-VALIDACION.md','.github/workflows/verify-pages.yml','.github/workflows/release.yml',
 ...['demos.test.mjs','presentation.test.mjs','runner.test.mjs','skill.test.mjs','sync.test.mjs','fixtures/audit-risk/package.json','fixtures/audit-risk/app.cjs','fixtures/audit-controls/package.json','fixtures/audit-controls/ci.yml','fixtures/audit-incomplete/package.json'].map(f=>'test/'+f),
 ...['SKILL.md','LICENSE','scripts/inspect.mjs','references/checklist.md','references/report.md'].map(f=>'node-security-audit/'+f)];
const archive={};for(const file of talkFiles)archive[file]=new Uint8Array(await readFile(file));
archive['guia-demos.docx']=new Uint8Array(await readFile('artifacts/guia-demos.docx'));
// Backups are optional and included only after independent evidence checks.
try{
 const raw=await readFile('backup-real.json','utf8'),data=JSON.parse(raw);
 if(data.metadata?.schemaVersion!==1||!Number.isFinite(Date.parse(data.metadata.capturedAt)))throw Error('Metadatos inválidos');
 for(const [demo,variants] of Object.entries(specs))for(let i=0;i<variants.length;i++)if(!validateResult(Number(demo),i,data.results?.[demo+'-'+i]||{}).ok)throw Error('Respaldo no verificado');
 archive['backup-real.json']=strToU8(raw);
}catch(error){if(error.code!=='ENOENT')throw error;}
const skill={};for(const file of await files('node-security-audit'))skill[file]=new Uint8Array(await readFile(file));
skill['node-security-audit/LICENSE']=new Uint8Array(await readFile('LICENSE'));
const talkName=`charla-${c.version}.zip`,skillName=`node-security-audit-${c.skillVersion}.zip`;
for(const [name,data] of [[talkName,archive],[skillName,skill]]){
 const zipped=zipSync(data,{level:6}),unzipped=unzipSync(zipped);
 if(Object.keys(unzipped).length!==Object.keys(data).length)throw Error('ZIP inválido');
 await writeFile('dist/downloads/'+name,zipped);await writeFile('artifacts/'+name,zipped);
}
for(const file of ['beerjs-legado-node.html',...assets])await copyFile(file,'dist/'+file);
await copyFile('artifacts/guia-demos.docx','dist/downloads/guia-demos.docx');
await copyFile('LICENSE-CONTENT.md','dist/LICENSE-CONTENT.md');
await writeFile('dist/.nojekyll','');
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
await writeFile('dist/index.html',`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(c.title)}</title><style>body{font:18px/1.6 system-ui;background:#0e1116;color:#f2f4f7;max-width:850px;margin:auto;padding:7vh 24px}h1{font-size:clamp(36px,6vw,64px);line-height:1.1}a{color:#ffb224}li{margin:15px 0}.muted{color:#aab7c8}img{background:white;width:180px;border:8px solid white}code{overflow-wrap:anywhere}</style><p class="muted">BEERJS CÓRDOBA · ${escape(c.author)} · v${escape(c.version)}</p><h1>El legado de Ryan Dahl</h1><p>Node, dependencias y las capacidades que autorizamos. Charla de ${escape(c.duration)} con seis demos.</p><p><a href="beerjs-legado-node.html">Abrir la presentación →</a></p><ul><li><a href="downloads/${talkName}">Descargar charla y demos (ZIP)</a></li><li><a href="downloads/guia-demos.docx">Descargar guía de demos (Word)</a></li><li><a href="downloads/${skillName}">Descargar node-security-audit (ZIP)</a></li></ul><p>Para ejecutar demos: extraer el ZIP, leer README, instalar Node 24 y Docker, construir las imágenes e iniciar el runner local. Flechas para navegar; N abre las notas. El ZIP incluye la guía y las instrucciones de preparación.</p><p>Para usar la skill: extraer node-security-audit en la carpeta de skills de tu agente y pedir una auditoría de lectura del proyecto. La auditoría predeterminada no instala ni ejecuta su código.</p><p>Durante la charla, escaneá el QR temporal del expositor para seguir las diapositivas y consolas desde tu teléfono. Podés pausar, ampliar texto y volver al directo. Este QR permanente es para materiales.</p><img src="assets/materiales-qr.png" alt="QR de materiales"><p><a href="${escape(c.siteUrl)}">${escape(c.siteUrl)}</a></p><p>Código y skill MIT · Slides y guía <a href="LICENSE-CONTENT.md">CC BY 4.0</a></p><p><a href="${escape(c.repository)}">Código fuente y créditos</a></p></html>`);
console.log(`Build listo: dist/; QR decodificado; ZIP charla ${Object.keys(archive).length} archivos, skill ${Object.keys(skill).length}.`);
