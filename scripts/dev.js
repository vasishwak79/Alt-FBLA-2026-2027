/**
 * Development helper: runs the API server (restarting it when server files
 * change) and the Vite dev server together, so one command starts everything.
 */

import { spawn } from 'node:child_process';

const processes = [
  {
    name: 'api',
    command: 'node',
    args: ['--disable-warning=ExperimentalWarning', '--watch-path=server', '--watch-path=shared', 'server/index.js'],
  },
  { name: 'web', command: 'npx', args: ['vite', '--host'] },
];

const children = processes.map(({ name, command, args }) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
});

function stopAll() {
  for (const child of children) child.kill();
  process.exit(0);
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
