import { cp, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

await rm('dist', { recursive: true, force: true });
await mkdir('dist/data', { recursive: true });

const result = spawnSync('tsc', ['-p', 'tsconfig.json'], { stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);

await cp('index.html', 'dist/index.html');
await cp('src/styles.css', 'dist/styles.css');
await cp('src/data/colorFormulas.json', 'dist/data/colorFormulas.json');
console.log('Built dist/');
