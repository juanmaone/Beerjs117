import { execFileSync } from 'node:child_process';
const out = execFileSync('/bin/echo', ['child OK']);
console.log(out.toString().trim());
