// Trusted lab setup: the server is outside the process whose permissions we test.
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';

const command = process.argv.slice(2);
const port = command[0]?.startsWith('--port=') ? Number(command.shift().slice(7)) : 8765;
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid lab port');
if (!command.length) throw new Error('Missing target command');
const server = createServer((_req, res) => res.end('PONG'));
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(port, '127.0.0.1', resolve);
});
const url = `http://127.0.0.1:${server.address().port}/ping`;
command.push(url);
console.log('Servidor de laboratorio: ' + url + ' (proceso separado)');
console.log('$ ' + command.join(' '));
try {
  const child = spawn(command[0], command.slice(1), {stdio: 'inherit'});
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => resolve(code ?? 1));
  });
} finally {
  await new Promise(resolve => server.close(resolve));
}
