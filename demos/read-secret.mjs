import { readFileSync } from 'node:fs';
console.log(readFileSync('./secret.txt', 'utf8'));
