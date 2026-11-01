// Probe additional API endpoints to find the catalogue.
import { request } from 'node:http';

function fetchHead(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = request({ host: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', timeout: 5000 }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, bodyPreview: Buffer.concat(chunks).toString('utf8').slice(0, 240) }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

const probes = [
  '/api/v1/health/ready',
  '/api/v1/health/live',
  '/api/v1/health/full',
  '/api/v1/admin/forms',
  '/api/v1/forms/catalog',
  '/api/v1/templates',
  '/api/v1/documents',
  '/api/v1/auth/me',
];
const results = [];
for (const path of probes) {
  try { results.push({ path, ...(await fetchHead('http://localhost:3001' + path)) }); }
  catch (e) { results.push({ path, error: e.message }); }
}
console.log(JSON.stringify(results, null, 2));
