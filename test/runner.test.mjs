import test from 'node:test';
import assert from 'node:assert/strict';
import {run, createRunner} from '../runner-server.mjs';
import {validateResult} from '../demo-specs.mjs';

test('Docker failures and incorrect evidence never validate as a demo', () => {
  for (const exitCode of [124,125,126,127]) {
    assert.equal(validateResult(4,1,{exitCode,stdout:'',stderr:'Docker failed'}).ok,false);
  }
  assert.equal(validateResult(4,1,{exitCode:1,stderr:'ERR_ACCESS_DENIED FileSystemRead outbound.mjs'}).ok,false);
  assert.equal(validateResult(4,1,{exitCode:1,stderr:'ERR_ACCESS_DENIED FileSystemRead secret.txt'}).ok,true);
  assert.equal(validateResult(9,1,{exitCode:1,stdout:'INSTALL_EXIT=1\nPREINSTALL=not executed\nPOSTINSTALL=not executed'}).ok,false);
  assert.equal(validateResult(9,1,{exitCode:0,stdout:'INSTALL_EXIT=0\nPREINSTALL=not executed\nPOSTINSTALL=not executed'}).ok,true);
  assert.equal(validateResult(11,0,{exitCode:1,stderr:'TypeError: s.toUpperCase is not a function'}).ok,true);
});

test('Containers do not pull images or expose a network; entrypoint is explicit', async () => {
  let args;
  const result=await run(6,1,async supplied=>{
    args=supplied;
    return {exitCode:1,stdout:'',stderr:'ERR_ACCESS_DENIED Network'};
  });
  assert.equal(args[args.indexOf('--network')+1],'none');
  assert.ok(args.includes('--pull=never'));
  assert.equal(args[args.indexOf('--entrypoint')+1],'sh');
  assert.ok(args.includes('network-demo.mjs'));
  assert.ok(args.includes('--allow-fs-read=./outbound.mjs'));
  assert.equal(result.validation.ok,true);
  assert.equal(result.exitCode,1);
});

test('Timeout removes the named container and remains an error', async () => {
  const calls=[];
  const result=await run(4,0,async (args,_timeout,onTimeout)=>{
    calls.push(args);
    if(onTimeout){onTimeout();return {exitCode:124,timedOut:true,stdout:'',stderr:''};}
    return {exitCode:0,stdout:'removed',stderr:''};
  });
  assert.deepEqual(calls[1],['rm','--force',calls[0][calls[0].indexOf('--name')+1]]);
  assert.equal(result.validation.ok,false);
});

test('HTTP rejects invalid demos and reports Docker unavailability', async t => {
  let invoked=0;
  const server=createRunner({checkHealth:async()=>({ok:false,error:'Docker unavailable'}),runDemo:async()=>{invoked++;return {};}});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base='http://127.0.0.1:'+server.address().port;
  assert.equal((await fetch(base+'/health')).status,503);
  for (const body of ['{',JSON.stringify({demo:999,variant:0}),JSON.stringify({demo:4,variant:3})]) {
    assert.equal((await fetch(base+'/run',{method:'POST',body})).status,400);
  }
  assert.equal(invoked,0);
});
