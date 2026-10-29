import {transform} from 'esbuild';
import {readFile,writeFile} from 'node:fs/promises';
// These two modules have no runtime dependencies. Inline their single import
// without filesystem traversal by esbuild (restricted Windows environments).
const protocol=(await readFile('sync/protocol.mjs','utf8')).replace(/^export /gm,'');
const worker=await readFile('sync/worker.mjs','utf8');
const source=worker.replace("import {validateState,readJson} from './protocol.mjs';",protocol);
if(source===worker||/^import /m.test(source))throw Error('Actualizar el empaquetador ante nuevos imports del Worker');
const result=await transform(source,{format:'esm',target:'es2022',sourcefile:'worker.mjs'});
await writeFile('sync/generated-worker.mjs',result.code);
