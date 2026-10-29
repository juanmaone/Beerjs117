import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
const pdf=await getDocument({data:new Uint8Array(await readFile('artifacts/guia-demos.pdf'))}).promise;
await mkdir('artifacts/guide-pages',{recursive:true});
const pages=[];
for(let i=1;i<=pdf.numPages;i++){
 const page=await pdf.getPage(i),viewport=page.getViewport({scale:1.6});
 const canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
 await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
 await writeFile(`artifacts/guide-pages/page-${i}.png`,canvas.toBuffer('image/png'));
 pages.push({page:i,text:(await page.getTextContent()).items.map(x=>x.str).join(' ')});
}
await writeFile('artifacts/guide-pages/text.json',JSON.stringify(pages,null,2));
console.log(`PDF.js: ${pdf.numPages} páginas renderizadas para revisión.`);
