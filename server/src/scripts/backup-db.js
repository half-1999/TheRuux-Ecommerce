import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';

console.log('Atlas free clusters are not a reliable backup. This export is the copy you can restore.');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = path.join(root, 'backups', stamp);

const child = spawn('mongodump', ['--uri', env.mongoUri, '--out', out], {
  stdio: ['ignore', 'inherit', 'inherit'],
});

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('mongodump is not installed. Install MongoDB Database Tools, then run: npm run backup');
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

child.on('exit', (code) => {
  if (code === 0) console.log(`Backup written to ${out}`);
  process.exit(code ?? 1);
});
