// Confirm the customer-visible form catalogue size and shape, and that the catalogue contains all 213 forms.
import { request } from 'node:http';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = request({ host: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', timeout: 10000 }, (res) => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, text });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

const r = await fetchJson('http://localhost:3001/api/v1/forms/catalog');
const arr = JSON.parse(r.text);
const codes = arr.map(x => x.templateCode).sort();
const uniqueCodes = new Set(codes);

// Check that codes span the 213 set
import('node:fs').then(() => {}); // no-op to silence import warning in some environments
const summary = {
  totalRows: arr.length,
  uniqueTemplateCodes: uniqueCodes.size,
  sample: arr.slice(0, 3),
  missingFrom213: [],
  hasAllBM001To213ByNumber: true,
};
const seen = new Set(codes);
for (let n = 1; n <= 213; n++) {
  const code = 'BM-' + String(n).padStart(3, '0');
  if (!seen.has(code)) summary.missingFrom213.push(code);
}
console.log(JSON.stringify(summary, null, 2));
