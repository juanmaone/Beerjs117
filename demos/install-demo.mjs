// Trusted setup, not a dependency: a tiny offline registry for this one fixture.
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {readFile, mkdir, writeFile, access} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';

export async function installDemo({manager, work = '/tmp/beerjs-install', tarballPath = '/opt/beerjs/demo-hook-1.0.0.tgz', expectedScripts = process.env.DEMO_EXPECT_SCRIPTS, registryPort = 4873, executeCommand} = {}) {
  if (!['npm', 'deno'].includes(manager)) throw new Error('Expected npm or deno');
  const markers = join(work, 'markers');
  await mkdir(markers, {recursive: true});
  const tarball = await readFile(tarballPath);
  let registry = 'http://127.0.0.1:4873';
  const manifest = {
    name: 'demo-hook', version: '1.0.0',
    scripts: {preinstall: 'node preinstall.cjs', postinstall: 'node postinstall.cjs'},
    dist: {
      tarball: `${registry}/demo-hook/-/demo-hook-1.0.0.tgz`,
      shasum: createHash('sha1').update(tarball).digest('hex'),
      integrity: 'sha512-' + createHash('sha512').update(tarball).digest('base64')
    }
  };
  const server = createServer((req, res) => {
    const path = new URL(req.url, registry).pathname;
    if (path === '/demo-hook/-/demo-hook-1.0.0.tgz') {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.end(tarball);
    } else if (path === '/demo-hook' || path === '/demo-hook/1.0.0') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(path.endsWith('/1.0.0') ? manifest : {
        name: 'demo-hook', 'dist-tags': {latest: '1.0.0'},
        versions: {'1.0.0': manifest}, time: {'1.0.0': '2026-01-01T00:00:00.000Z'}
      }));
    } else {
      res.writeHead(404, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({error: 'Only demo-hook exists in the lab registry'}));
    }
  });
  await writeFile(join(work, 'package.json'), JSON.stringify({
    name: 'beerjs-lab', private: true, dependencies: {'demo-hook': '1.0.0'}
  }));
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(registryPort, '127.0.0.1', resolve);
  });
  function execute(args) {
    console.log('$ ' + args.join(' '));
    const options = {cwd: work, stdio: 'inherit', env: {...process.env, DEMO_MARKER_DIR: markers, DENO_NO_PROMPT: '1'}};
    if (executeCommand) return executeCommand(args, options);
    return new Promise((resolve, reject) => {
      const child = spawn(args[0], args.slice(1), options);
      child.once('error', reject);
      child.once('close', code => resolve(code ?? 1));
    });
  }
  try {
    registry = `http://127.0.0.1:${server.address().port}`;
    manifest.dist.tarball = `${registry}/demo-hook/-/demo-hook-1.0.0.tgz`;
    await writeFile(join(work, '.npmrc'), `registry=${registry}\naudit=false\nfund=false\n`);
    const versionExit = await execute([manager, '--version']);
    if (versionExit !== 0) throw new Error(`Version check failed: exit=${versionExit}`);
    const args = manager === 'npm'
      ? ['npm', 'install', '--no-audit', '--no-fund', '--foreground-scripts']
      : ['deno', 'install', '--node-modules-dir=auto'];
    const installExit = await execute(args);
    console.log(`INSTALL_EXIT=${installExit}`);
    let ran = 0;
    for (const name of ['PREINSTALL', 'POSTINSTALL']) {
      let exists = true;
      try { await access(join(markers, `${name}-RAN.txt`)); }
      catch (error) { if (error.code === 'ENOENT') exists = false; else throw error; }
      if (exists) ran++;
      console.log(`${name}=${exists ? 'executed' : 'not executed'}`);
    }
    // A failed install keeps its exit code. Absence of markers alone proves nothing.
    let exitCode = installExit;
    if (installExit === 0) {
      const expected = expectedScripts === 'run' ? 2 : 0;
      if (ran !== expected) {
        console.error(`DEMO_MISMATCH: expected ${expected} lifecycle markers, found ${ran}`);
        exitCode = 1;
      }
    }
    return exitCode;
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await installDemo({manager: process.argv[2]});
}
