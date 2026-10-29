import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {unzipSync} from 'fflate';
import {PNG} from 'pngjs';
import jsQR from 'jsqr';
import assert from 'node:assert/strict';
import {specs,validateResult} from '../demo-specs.mjs';
const c=JSON.parse(await readFile('project.config.json','utf8'));
const pages=await readFile('dist/index.html','utf8');
const downloads=[...pages.matchAll(/href="(downloads\/[^"]+)"/g)].map(m=>m[1]);assert.equal(downloads.length,3);
const allowed=new Set(['index.html','beerjs-legado-node.html','LICENSE-CONTENT.md','.nojekyll','assets','downloads']);
for(const name of await readdir('dist'))assert.ok(allowed.has(name),'Archivo público inesperado: '+name);
const server=createServer(async(req,res)=>{if(!downloads.includes(req.url.slice(1))){res.writeHead(404).end();return;}res.end(await readFile('dist/'+req.url));});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
try{
 const report=[];
 for(const link of downloads){
  const response=await fetch(`http://127.0.0.1:${server.address().port}/`+link);assert.equal(response.status,200);
  const bytes=new Uint8Array(await response.arrayBuffer()),files=unzipSync(bytes);
  for(const path of Object.keys(files))assert.ok(!/(?:^|\/)(?:\.local|\.checks|\.env|\.dev.vars|\.wrangler|node_modules|\.git)(?:\/|$)/.test(path),path);
  if(link.endsWith('.docx'))assert.ok(files['word/document.xml']);
  else if(link.includes('charla-')){
   assert.ok(files['guia-demos.docx']);assert.ok(files['demo-specs.mjs']);
   if(files['backup-real.json']){
    const backup=JSON.parse(new TextDecoder().decode(files['backup-real.json']));
    for(const [demo,variants] of Object.entries(specs))for(let i=0;i<variants.length;i++)assert.ok(validateResult(Number(demo),i,backup.results?.[demo+'-'+i]||{}).ok);
   }
  }
  else assert.ok(files['node-security-audit/references/report.md']);
  report.push({link,status:response.status,bytes:bytes.length,entries:Object.keys(files).length});
 }
 const png=PNG.sync.read(await readFile('dist/assets/materiales-qr.png'));
 assert.equal(jsQR(new Uint8ClampedArray(png.data),png.width,png.height)?.data,c.siteUrl);
 await mkdir('artifacts',{recursive:true});await writeFile('artifacts/package-check.json',JSON.stringify({downloads:report,materialsQr:c.siteUrl,scope:'HTTP local; disponibilidad del destino público pendiente'},null,2));
 console.log('Tres descargas HTTP locales y archivos ZIP/Word verificados. QR de materiales correcto.');
}finally{await new Promise(r=>server.close(r));}
