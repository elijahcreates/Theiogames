// Local test server that emulates Netlify for the analytics system:
//  - GET /            -> runs the real edge logger (netlify/lib/edge-core.mjs) in front of index.html
//  - POST/GET /.netlify/functions/<name> -> runs the real functions in netlify/functions/
//  - everything else  -> static files
// Usage:  TG_LOCAL_STORE=/tmp/tg-store TIOG_ADMIN_KEY=testkey node tools/analytics-dev.mjs [port]
// Send the header  x-test-ip: 1.2.3.4  to pretend requests come from different networks.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { logPageRequest } from '../netlify/lib/edge-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +process.argv[2] || 8787;
process.env.TG_LOCAL_STORE = process.env.TG_LOCAL_STORE || path.join(root, '.netlify', 'tg-store');
const fns = {};
const fn = async name => (fns[name] = fns[name] || (await import(pathToFileURL(path.join(root, 'netlify/functions', name + '.mjs')))).default);
const types = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.txt': 'text/plain', '.js': 'text/javascript', '.json': 'application/json' };

function toRequest(req, body) {
  const headers = new Headers(); for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  return new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body });
}
async function send(res, r) {
  const headers = {}; r.headers.forEach((v, k) => { headers[k] = headers[k] ? [].concat(headers[k], v) : v; });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; if (sc.length) headers['set-cookie'] = sc;
  res.writeHead(r.status, headers); res.end(Buffer.from(await r.arrayBuffer()));
}

http.createServer(async (req, res) => {
  try {
    const chunks = []; for await (const c of req) chunks.push(c); const body = Buffer.concat(chunks);
    const ip = req.headers['x-test-ip'] || req.socket.remoteAddress;
    const url = new URL(req.url, 'http://x');
    const context = { ip, geo: { country: { code: req.headers['x-test-cc'] || 'US' } }, waitUntil: p => p };
    if (url.pathname.startsWith('/.netlify/functions/')) return send(res, await (await fn(url.pathname.split('/')[3]))(toRequest(req, body), context));
    let file = url.pathname === '/' ? 'index.html' : url.pathname === '/admin' ? 'admin.html' : url.pathname.slice(1);
    if (!/^[\w.-]+$/.test(file)) file = 'index.html';
    let data; try { data = await fs.readFile(path.join(root, file)); } catch (e) { file = 'index.html'; data = await fs.readFile(path.join(root, file)); }
    const page = () => new Response(data, { headers: { 'content-type': types[path.extname(file)] || 'application/octet-stream' } });
    if (file === 'index.html') return send(res, await logPageRequest({ request: toRequest(req, body), ip, country: context.geo.country.code, next: async () => page(), waitUntil: null, secret: process.env.TIOG_ADMIN_KEY, tz: process.env.TIOG_TZ }));
    return send(res, page());
  } catch (e) { console.error(e); res.writeHead(500); res.end('error'); }
}).listen(port, () => console.log(`analytics dev server on http://localhost:${port}  (store: ${process.env.TG_LOCAL_STORE})`));
