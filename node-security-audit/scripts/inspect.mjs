// Read-only triage. Never imports project code, follows symlinks or invokes commands.
import {readFile,lstat,readdir} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
export async function inspect(directory){
 const root=resolve(directory),findings=[],controls=[],files=[];
 async function walk(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
   if(['node_modules','.git','.checks','.local','dist'].includes(entry.name))continue;
   const path=join(dir,entry.name);
   if(entry.isSymbolicLink())continue;
   if(entry.isDirectory())await walk(path);
   else if(/(?:\.(?:[cm]?js|ts|json|ya?ml)|Dockerfile|\.npmrc|\.nvmrc|\.node-version)$/.test(entry.name)){
    if((await lstat(path)).size<=1024*1024)files.push({path:relative(root,path),text:await readFile(path,'utf8')});
   }
  }
 }
 await walk(root);
 for(const file of files){
  const lines=file.text.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
   const line=lines[i],location=file.path+':'+(i+1);
   if(/(?:exec|execSync)\s*\(/.test(line))findings.push({kind:'shell',classification:'indicio',location,risk:'Posible ejecución mediante shell; trazar entradas y validación.'});
   if(/(?:token|password|api_key|secret)\s*[=:]\s*["'][^"']{8,}/i.test(line))findings.push({kind:'secret-pattern',classification:'indicio',location,risk:'Posible secreto; valor omitido. Verificar si es ficticio.'});
   if(/(?:preinstall|postinstall)\s*["']?\s*:/.test(line))findings.push({kind:'install-script',classification:'comprobada',location,risk:'Script declarado; ejecución y contenido requieren revisión.'});
   if(/\bnpm ci\b/.test(line))controls.push({kind:'npm-ci',location,limit:'No prueba bloqueo de scripts.'});
   if(/tsc --noEmit/.test(line))controls.push({kind:'typecheck',location});
  }
 }
 const attribution=(await readFile(new URL('../references/report.md',import.meta.url),'utf8')).split('## Atribución de la skill')[1].trim();
 return {files:files.map(f=>f.path),findings,controls,limitations:['Inventario preliminar, no auditoría completa.','Versiones efectivas, vulnerabilidades transitivas y producción requieren validación.','La falta de coincidencias no demuestra ausencia de riesgos.'],attribution};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!process.argv[2])throw Error('Uso: node inspect.mjs RUTA');
 console.log(JSON.stringify(await inspect(process.argv[2]),null,2));
}
