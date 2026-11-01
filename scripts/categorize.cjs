const fs = require('fs');
const path = require('path');
const dir = 'apps/web/src/components/documents';
const reBm = /^bm-\d{3}-form-inputs\.tsx$/;
const files = fs.readdirSync(dir).filter(f => reBm.test(f));

function stripComments(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  src = src.replace(/^\s*\/\/.*$/gm, '');
  return src;
}

let totalWithRenderPayload = 0;
let usingHelper = 0;
let bm031Direct = 0;
let detailOnly = 0;
let skipped = 0;

for (const f of files) {
  const p = path.join(dir, f);
  const src = fs.readFileSync(p, 'utf8');
  const stripped = stripComments(src);
  if (!/render-payload/.test(stripped)) {
    skipped++;
    continue;
  }
  totalWithRenderPayload++;
  const bm031 = /bm031-direct-render-payload/.test(stripped);
  if (bm031) {
    bm031Direct++;
    continue;
  }
  const detail = /\/documents\/generated\/\$\{[^}]+\}`/.test(stripped) && !/\/render-payload`/.test(stripped);
  if (detail) {
    detailOnly++;
    continue;
  }
  const hasHelper = /getDocumentRenderPayload/.test(stripped);
  if (hasHelper) usingHelper++;
}

console.log('Total 3-digit BM:', files.length);
console.log('No render-payload at all:', skipped);
console.log('Has "render-payload" string:', totalWithRenderPayload);
console.log('  BM031 direct (different endpoint):', bm031Direct);
console.log('  Detail endpoint only (no /render-payload):', detailOnly);
console.log('  Using getDocumentRenderPayload helper:', usingHelper);
