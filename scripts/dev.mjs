import { createReadStream, existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { spawnSync } from 'node:child_process';

const build = spawnSync('node', ['scripts/build.mjs'], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);

const root = 'dist';
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const cleanPath = normalize(decodeURIComponent(url.pathname)).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = join(root, cleanPath === '/' ? 'index.html' : cleanPath);
  const target = existsSync(filePath) ? filePath : join(root, 'index.html');
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error('Not a file');
    res.setHeader('Content-Type', types.get(extname(target)) ?? 'application/octet-stream');
    createReadStream(target).pipe(res);
  } catch {
    res.statusCode = 404;
    res.end('Not found');
  }
});

const port = Number(process.env.PORT) || 5173;
server.listen(port, '0.0.0.0', () => console.log(`染发配方工具已启动：http://0.0.0.0:${port}（本机可用 http://localhost:${port}）`));
