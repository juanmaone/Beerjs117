import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir, mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {existsSync} from 'node:fs';
import {installDemo} from '../demos/install-demo.mjs';

test('Network setup serves PONG to the separate restricted Node 24 process', async () => {
  const child=spawn(process.execPath,['network-demo.mjs','--port=0',process.execPath,'--permission','--allow-fs-read=./outbound.mjs','outbound.mjs'],{cwd:resolve('demos')});
  let output='';
  child.stdout.on('data',data=>output+=data);
  child.stderr.on('data',data=>output+=data);
  const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
  assert.equal(code,0,output);
  assert.match(output,/OUTBOUND RESULT: PONG/);
});

test('Installer preserves a failure even when both lifecycle markers are absent', async () => {
  await mkdir('.checks',{recursive:true});
  const work=await mkdtemp(resolve('.checks/install-failure-'));
  const tarballPath=join(work,'test-fixture.tgz');
  await writeFile(tarballPath,'Test only, no installer will read this fake archive');
  const exit=await installDemo({manager:'npm',work,tarballPath,expectedScripts:'block',registryPort:0,
    executeCommand:async args=>args.includes('--version')?0:42});
  assert.equal(exit,42);
});

test('Installer detects a successful install that contradicts the script policy', async () => {
  const work=await mkdtemp(resolve('.checks/install-mismatch-'));
  const tarballPath=join(work,'test-fixture.tgz');
  await writeFile(tarballPath,'Test-only archive placeholder');
  const exit=await installDemo({manager:'npm',work,tarballPath,expectedScripts:'run',registryPort:0,executeCommand:async()=>0});
  assert.equal(exit,1);
});

test('Real npm installs the packed fixture from the loopback registry without Internet', async t => {
  const candidates=[join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js')];
  if(process.env.APPDATA)candidates.push(join(process.env.APPDATA,'npm/node_modules/npm/bin/npm-cli.js'));
  const installed=[...new Set(candidates)].filter(existsSync);
  if(!installed.length){t.skip('No local npm CLI found');return;}
  for(const cli of installed){
    await t.test(cli,async()=>{
      const metadata=JSON.parse(await readFile(resolve(dirname(cli),'../package.json'),'utf8'));
      const major=Number(metadata.version.split('.')[0]);
      await mkdir('.checks',{recursive:true});
      const folder=await mkdtemp(resolve('.checks/real-npm-'));
      const execute=(args,options={})=>new Promise((resolve,reject)=>{
        const child=spawn(process.execPath,[cli,...args.slice(1)],{
          ...options,stdio:'pipe',env:{...process.env,...options.env,npm_config_cache:join(folder,'cache')}
        });
        let output='';
        child.stdout.on('data',data=>output+=data);child.stderr.on('data',data=>output+=data);
        child.once('error',reject);child.once('close',code=>{if(code!==0)console.error(output);resolve(code);});
      });
      assert.equal(await execute(['npm','pack','--offline','--ignore-scripts','--pack-destination',folder],{cwd:resolve('demos/demo-hook')}),0);
      const code=await installDemo({manager:'npm',work:join(folder,'work'),
        tarballPath:join(folder,'demo-hook-1.0.0.tgz'),registryPort:0,
        expectedScripts:major>=12?'block':'run',executeCommand:execute});
      assert.equal(code,0,'npm '+metadata.version+' should match its lifecycle policy');
    });
  }
});

test('Presentation panels exist before initialization, and all 18 terminals have handlers', async () => {
  const html=await readFile('beerjs-legado-node.html','utf8');
  assert.ok(html.indexOf('id="speakerPanel"')<html.indexOf("const slides="));
  assert.ok(html.indexOf('id="slideTime"')<html.indexOf("const slides="));
  assert.equal([...html.matchAll(/<section\b[^>]*class="slide\b/g)].length,17);
  for(const demo of [4,5,6,7,9,11])for(let variant=0;variant<3;variant++){
    assert.ok(html.includes(`id="term-${demo}-${variant}"`));
    assert.ok(html.includes(`runDemo(${demo},${variant})`));
  }
});
