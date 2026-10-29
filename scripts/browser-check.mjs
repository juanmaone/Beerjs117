import {browser} from './browser.mjs';
import {createRunner} from '../runner-server.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=createRunner({checkHealth:async()=>({ok:false,error:'TEST: Docker no ejecutado'})});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let b;
try{
 b=await browser();await mkdir('artifacts/slides',{recursive:true});
 const report=[];
 for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['phone',{width:390,height:844}]]){
  const page=await b.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`+(name==='phone'?'?session=00000000-0000-0000-0000-000000000000':''));
  assert.equal(await page.locator('.slide').count(),17);
  for(let i=0;i<17;i++){
   await page.evaluate(i=>go(i),i);
   await page.screenshot({path:`artifacts/slides/${name}-${String(i+1).padStart(2,'0')}.png`});
   assert.equal(await page.locator('.slide.active').count(),1);
   const layout=await page.locator('.slide.active').evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+1,height:el.scrollHeight,viewport:el.clientHeight,note:el.querySelector('.speaker-note').textContent}));
   assert.equal(layout.overflow,false,`${name} slide ${i+1}: horizontal overflow`);
   assert.ok(layout.note.length>0);report.push({name,slide:i+1,scrollable:layout.height>layout.viewport});
  }
  await page.keyboard.press('Home');assert.equal(await page.locator('#counter').textContent(),'1 / 17');
  await page.keyboard.press('n');
  if(name==='desktop')assert.ok(await page.locator('#speakerPanel').isVisible());
  else{assert.equal(await page.locator('#speakerPanel').isVisible(),false);assert.equal(await page.locator('.runbtn:visible').count(),0);}
  assert.deepEqual(errors,[]);await page.close();
 }
 await writeFile('artifacts/browser-check.json',JSON.stringify({syntheticHealth:true,report},null,2));
 console.log('17 slides: escritorio y teléfono, navegación, notas y sin desbordamiento horizontal. 34 capturas generadas.');
}finally{await b?.close();await new Promise(r=>server.close(r));}
