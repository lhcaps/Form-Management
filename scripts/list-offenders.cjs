const fs = require('fs');
const { readFileSync } = require('fs');
const path = require('path');
const dir = 'apps/web/src/components/documents';
const reBm = /^bm-\d{3}-form-inputs\.tsx$/;
const allFiles = fs.readdirSync(dir);
const files = allFiles.filter(f => reBm.test(f));
console.log('Matching 3-digit BM files:', files.length);

// Strip C-style /* ... */ and // comments.
function stripComments(src) {
  // Block comments
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  // Line comments
  src = src.replace(/^\s*\/\/.*$/gm, '');
  return src;
}

const offenders = [];
for (const f of files) {
  const p = path.join(dir, f);
  const src = readFileSync(p, 'utf8');
  if (!src.includes('render-payload')) continue;
  const stripped = stripComments(src);
  // Only flag if real fetch line exists.
  const re = /fetch\s*\(\s*`\$\{(?:API_BASE_URL|apiBase)\}\/documents\/generated\/\$\{[^}]+\}\/render-payload`/;
  if (re.test(stripped)) offenders.push(p);
}
console.log('REAL OFFENDERS:', offenders.length);
for (const o of offenders) console.log(' ', o);
