import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number.parseInt(process.env.SUBQG_VIEWER_PORT ?? '4173', 10);
const host = process.env.SUBQG_VIEWER_HOST ?? '127.0.0.1';
const allowedRoots = [resolve(repositoryRoot, 'viewer'), resolve(repositoryRoot, 'src')];
const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml']
]);

function isAllowed(filePath) {
  return allowedRoots.some(root => filePath === root || filePath.startsWith(`${root}${sep}`));
}

const server = createServer((request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? host}`);
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') {
      response.writeHead(302, { Location: '/viewer/subqg_universe_explorer.html' });
      response.end();
      return;
    }

    const filePath = resolve(repositoryRoot, `.${pathname}`);
    if (!isAllowed(filePath)) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Forbidden');
      return;
    }
    const info = statSync(filePath);
    if (!info.isFile()) throw new Error('Not a file');
    response.writeHead(200, {
      'Content-Type': mimeTypes.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Cross-Origin-Opener-Policy': 'same-origin'
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`SubQG Universe Explorer: http://${host}:${port}/viewer/subqg_universe_explorer.html`);
  console.log('Press Ctrl+C to stop.');
});
