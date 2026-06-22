const fs = require('node:fs');
const path = require('node:path');

const lockedDir = 'D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked';

const files = fs.readdirSync(lockedDir).filter(f => f.endsWith('.contract.locked.json'));

let locked = 0;
let invalidJson = [];
let missingCFType = [];
let missingRBPath = [];
let missingRBFallback = [];

for (const file of files) {
  const fp = path.join(lockedDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    locked++;

    if (!data.canonicalFields || !Array.isArray(data.canonicalFields)) {
      invalidJson.push(file + ': missing canonicalFields array');
      continue;
    }
    if (!data.renderBindings || !Array.isArray(data.renderBindings)) {
      invalidJson.push(file + ': missing renderBindings array');
      continue;
    }

    for (let i = 0; i < data.canonicalFields.length; i++) {
      const cf = data.canonicalFields[i];
      if (typeof cf.type === 'undefined') {
        missingCFType.push(file + ': cf[' + i + '] ' + cf.path);
      }
    }

    for (let i = 0; i < data.renderBindings.length; i++) {
      const rb = data.renderBindings[i];
      if (typeof rb.path === 'undefined') {
        missingRBPath.push(file + ': rb[' + i + '] path=undefined');
      }
      if (typeof rb.fallback === 'undefined') {
        missingRBFallback.push(file + ': rb[' + i + '] path=' + (rb.path || 'N/A'));
      }
    }
  } catch (e) {
    invalidJson.push(file + ': ' + e.message);
  }
}

// Check code coverage
const lockedCodes = files.map(f => {
  const m = f.match(/^BM-(\d+)/);
  return m ? m[1] : null;
}).filter(Boolean);

const missingCodes = [];
for (let i = 1; i <= 213; i++) {
  const code = String(i);
  const padded = String(i).padStart(3, '0');
  if (!lockedCodes.includes(code) && !lockedCodes.includes(padded)) {
    missingCodes.push(code);
  }
}

console.log('=== CONTRACT VERIFICATION ===');
console.log('Locked contracts:', locked);
console.log('Invalid JSON:', invalidJson.length);
console.log('Missing CF.type:', missingCFType.length);
console.log('Missing RB.path:', missingRBPath.length);
console.log('Missing RB.fallback:', missingRBFallback.length);
console.log('Missing codes:', missingCodes.length, missingCodes);

if (invalidJson.length > 0) {
  console.log('\nInvalid JSON:');
  invalidJson.forEach(i => console.log(' -', i));
}
if (missingCFType.length > 0) {
  console.log('\nMissing canonicalFields.type:');
  missingCFType.slice(0, 20).forEach(m => console.log(' -', m));
  if (missingCFType.length > 20) console.log('  ... and', missingCFType.length - 20, 'more');
}
if (missingRBFallback.length > 0) {
  console.log('\nMissing RB.fallback:');
  missingRBFallback.slice(0, 20).forEach(m => console.log(' -', m));
  if (missingRBFallback.length > 20) console.log('  ... and', missingRBFallback.length - 20, 'more');
}
if (missingRBPath.length > 0) {
  console.log('\nMissing RB.path:');
  missingRBPath.slice(0, 20).forEach(m => console.log(' -', m));
  if (missingRBPath.length > 20) console.log('  ... and', missingRBPath.length - 20, 'more');
}
