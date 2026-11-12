// Sirve el frontend local y reenvía las solicitudes API a producción.
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HOST = process.env.FRONT_HOST || '127.0.0.1';
const PORT = Number(process.env.FRONT_PORT || 5500);
const API_TARGET = (process.env.API_TARGET || 'https://api.cracotech.com').replace(/\/+$/, '');
const PROD_ORIGIN = process.env.PROD_ORIGIN || 'https://cracotech.com';
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.md': 'text/plain; charset=utf-8'
};

async function proxy(req, res) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = { ...req.headers, origin: PROD_ORIGIN, referer: PROD_ORIGIN + '/' };
  delete headers.host;
  delete headers['content-length'];
  delete headers['accept-encoding'];
  delete headers.connection;

  try {
    const response = await fetch(API_TARGET + req.url, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
      redirect: 'manual'
    });
    const responseHeaders = {};
    response.headers.forEach((value, name) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(name)) {
        responseHeaders[name] = value;
      }
    });
    res.writeHead(response.status, responseHeaders);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'No se pudo contactar a la API de producción: ' + error.message }));
  }
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/') || req.url === '/api') return proxy(req, res);

  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }

  let file = path.join(ROOT, rel);
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(301, { Location: rel + '/' }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    if (rel.endsWith('/js/api-config.js')) {
      data = Buffer.from(data.toString('utf8').replace(/const API_BASE_URL = [^;]+;/, "const API_BASE_URL = window.location.origin;"));
    } else if (rel.endsWith('/js/herramientas-api-config.js')) {
      data = Buffer.from("window.HERRAMIENTAS_API_BASE_URL = window.location.origin + '/api/herramientas';\n" + data.toString('utf8'));
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(PORT, HOST, () => console.log(`Frontend + APIs de producción en http://${HOST}:${PORT}`));
