import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

function element() {
  const classes=new Set();
  return {textContent:'',style:{},disabled:false,
    classList:{add:name=>classes.add(name),remove:(...names)=>names.forEach(name=>classes.delete(name)),
      contains:name=>classes.has(name),toggle:(name,force)=>{
        const on=force??!classes.has(name);if(on)classes.add(name);else classes.delete(name);return on;
      }}};
}
async function presentation() {
  const html=await readFile('beerjs-legado-node.html','utf8');
  const elements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>[match[1],element()]));
  const slides=[...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].map(match=>{
    const slide=element();
    slide.dataset={time:/data-time="([^"]+)"/.exec(match[1])[1]};
    const note=/<aside class="speaker-note">([\s\S]*?)<\/aside>/.exec(match[2])[1];
    slide.querySelector=()=>({textContent:note});return slide;
  });
  for(const [id,term] of elements)if(id.startsWith('term-')){
    const output=element(),button=element();
    term.querySelector=selector=>selector==='.output'?output:button;
  }
  const handlers={},alerts=[],requests=[];
  const context=vm.createContext({document:{
    querySelectorAll:()=>slides,getElementById:id=>elements.get(id)||null,
    addEventListener:(name,handler)=>handlers[name]=handler
  },window:{},history:{replaceState(){}},location:{hash:''},AbortSignal,
    alert:message=>alerts.push(message),fetch:async(url,options)=>{
      requests.push({url,options});return {ok:true,json:async()=>({ok:true})};
    }});
  for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))vm.runInContext(script[1],context);
  await vm.runInContext('checkServer()',context);
  return {context,elements,slides,handlers,alerts,requests,eval:code=>vm.runInContext(code,context)};
}
function backup() {
  const data={metadata:{schemaVersion:1,capturedAt:new Date().toISOString()},results:{}};
  for(const demo of [4,5,6,7,9,11])for(let variant=0;variant<3;variant++){
    data.results[demo+'-'+variant]={command:'TEST ONLY',stdout:'Synthetic test data',stderr:'',exitCode:0,validation:{ok:true}};
  }
  return data;
}
test('Actual inline JavaScript initializes all slides, keyboard navigation and notes',async()=>{
  const page=await presentation();
  assert.equal(page.eval('current'),0);
  assert.equal(page.slides[0].classList.contains('active'),true);
  page.handlers.keydown({target:{closest:()=>false},key:'ArrowRight',preventDefault(){}});
  assert.equal(page.eval('current'),1);
  page.handlers.keydown({target:{closest:selector=>selector==='button'},key:'ArrowRight',preventDefault(){}});
  assert.equal(page.eval('current'),2,'Arrow navigation still works after clicking a demo button');
  page.handlers.keydown({target:{closest:()=>false},key:'n'});
  assert.equal(page.elements.get('speakerPanel').classList.contains('visible'),true);
  assert.equal(page.slides.length,17);
  for(let slide=0;slide<17;slide++){
    page.eval(`go(${slide})`);
    assert.equal(page.slides.filter(item=>item.classList.contains('active')).length,1);
    assert.ok(page.elements.get('speakerPanel').textContent.length>0);
  }
});
test('Loading a complete capture switches live mode to replay and makes no requests',async()=>{
  const page=await presentation();
  assert.equal(page.eval('mode'),'live');
  page.context.captureInput={files:[{text:async()=>JSON.stringify(backup())}]};
  await page.eval('loadCapture(captureInput)');
  assert.equal(page.eval('mode'),'backup');
  const count=page.requests.length;
  await page.eval('runDemo(4,0)');
  assert.equal(page.requests.length,count);
  assert.match(page.elements.get('term-4-0').querySelector('.output').textContent,/RESPALDO/);
  await page.eval('selectMode()');
  assert.equal(page.eval('mode'),'live');
  page.context.fetch=async()=>{throw Error('Connection lost')};
  await page.eval('runDemo(4,0)');
  const output=page.elements.get('term-4-0').querySelector('.output');
  assert.match(output.textContent,/Falló la ejecución: Connection lost/);
  assert.doesNotMatch(output.textContent,/\[RESPALDO/);
  assert.equal(output.classList.contains('error'),true);
});
test('Incomplete captures are rejected and nonzero live exits remain visible',async()=>{
  const page=await presentation();
  const data=backup();delete data.results['11-2'];
  page.context.captureInput={files:[{text:async()=>JSON.stringify(data)}]};
  await page.eval('loadCapture(captureInput)');
  assert.equal(page.eval('mode'),'live');assert.equal(page.alerts.length,1);
  page.context.fetch=async()=>({ok:true,json:async()=>({command:'test',stdout:'',stderr:'TEST DENIAL',exitCode:1,validation:{ok:true}})});
  await page.eval('runDemo(4,1)');
  const output=page.elements.get('term-4-1').querySelector('.output');
  assert.match(output.textContent,/TEST DENIAL[\s\S]*exit=1/);
  assert.equal(output.classList.contains('error'),true);
});
