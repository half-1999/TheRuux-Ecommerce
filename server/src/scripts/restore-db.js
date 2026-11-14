import { spawn } from 'node:child_process';
import path from 'node:path';
import { env } from '../config/env.js';

const dumpPath = process.argv[2];
const target = process.env.RESTORE_URI || '';

if (process.env.CONFIRM_RESTORE !== 'yes' || !dumpPath || !target) {
  console.error('Refusing to restore.');
  console.error('Usage: CONFIRM_RESTORE=yes RESTORE_URI=<throwaway-uri> node src/scripts/restore-db.js <dump-folder>');
  console.error('Point RESTORE_URI at an empty database. This script will not restore onto the live URI.');
  process.exit(1);
}

if (target === env.mongoUri) {
  console.error('RESTORE_URI matches the live database. Restore into a separate database, then inspect it.');
  process.exit(1);
}

const child = spawn(
  'mongorestore',
  ['--uri', target, '--drop', '--dir', path.resolve(dumpPath)],
  { stdio: ['ignore', 'inherit', 'inherit'] },
);

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('mongorestore is not installed. Install MongoDB Database Tools.');
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

child.on('exit', (code) => process.exit(code ?? 1));
