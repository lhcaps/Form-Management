// Read-only HTTP smoke. No state mutation.
import fs from 'node:fs';
import { request } from 'node:http';

function fetchJson(url, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = request({ host: u.hostname, port: u.port, path: u.pathname + u.search, method: opts.method || 'GET', headers: opts.headers || {}, timeout: 8000 }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

const probes = [
  { name: 'web-catalog', url: 'http://localhost:3000/' },
  { name: 'web-templates-list', url: 'http://localhost:3000/api/v1/forms' },
  { name: 'api-forms-list', url: 'http://localhost:3001/api/v1/forms' },
  { name: 'api-health', url: 'http://localhost:3001/api/v1/health' },
];

const results = [];
for (const p of probes) {
  try {
    const r = await fetchJson(p.url);
    let bodyPreview = (r.body || '').slice(0, 240).replace(/\s+/g, ' ');
    results.push({ name: p.name, url: p.url, status: r.status, bodyPreview });
  } catch (e) {
    results.push({ name: p.name, url: p.url, error: e.message });
  }
}
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), probes: results }, null, 2));
