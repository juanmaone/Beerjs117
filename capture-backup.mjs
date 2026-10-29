// Capture actual outputs from the local Docker-backed runner. Never fabricate results.
import {writeFile, rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {specs, validateResult} from './demo-specs.mjs';
const health = await fetch('http://127.0.0.1:8787/health', {signal: AbortSignal.timeout(15000)});
if (!health.ok) throw Error(`Runner no preparado: ${await health.text()}`);
const results={};
for(const demo of Object.keys(specs).map(Number)) for(const variant of [0,1,2]){
 const r=await fetch('http://127.0.0.1:8787/run',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({demo,variant}),signal:AbortSignal.timeout(75000)});
 if(!r.ok) throw Error(`Error running ${demo}/${variant}: ${await r.text()}`);
 const d=await r.json();
 const validation = validateResult(demo, variant, d);
 if (!validation.ok) throw Error(`Demo ${demo}/${variant} no validada: ${validation.reason}\n${JSON.stringify(d)}`);
 d.validation = validation;
 results[`${demo}-${variant}`]=d;console.log(`Captured ${demo}-${variant}: exit ${d.exitCode}`);
}
const target = fileURLToPath(new URL('./backup-real.json', import.meta.url));
await writeFile(target + '.tmp',JSON.stringify({metadata:{schemaVersion:1,capturedAt:new Date().toISOString(),description:'Real outputs captured and checked against each demo expectation'},results},null,2));
await rename(target + '.tmp', target);
console.log('Saved backup-real.json');
