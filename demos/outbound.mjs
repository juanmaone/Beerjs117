import {argv} from 'node:process';
const response = await fetch(argv[2] || 'http://127.0.0.1:8765/ping');
if (!response.ok) throw new Error(`HTTP ${response.status}`);
console.log('OUTBOUND RESULT:', await response.text());
