const fs = require('fs');
const re = new RegExp("API_BASE_URL.*render-payload", "s");
for (const f of ['test-bm002', 'test-bm039', 'test-bm111', 'test-bm085']) {
  const path = '/tmp/' + f + '.tsx';
  const src = fs.readFileSync(path, 'utf8');
  console.log(f, ':', src.match(re) ? 'STILL HAS OFFENDER' : 'clean');
}