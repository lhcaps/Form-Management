// Read-only probe for runtime-readiness roster size & sha256.
import fs from 'node:fs';
import crypto from 'node:crypto';

const tsPath = 'packages/form-contracts/src/runtime-readiness.generated.ts';
const jsonPath = 'docs/audit/final-213-customer-ready/runtime-rollout/runtime-readiness.generated.json';

function sha(p){ return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

const ts = fs.readFileSync(tsPath,'utf8');
const m = ts.match(/runtimeReadyFormCodes\s*=\s*\[([^\]]*)\]/s);
const arr = m ? m[1].split(',').map(s=>s.replace(/['"\s]/g,'')).filter(Boolean) : [];
const tsSha = sha(tsPath);
const jsonSha = sha(jsonPath);

console.log(JSON.stringify({
  tsPath,
  tsSha256: tsSha,
  tsCount: arr.length,
  tsFirst5: arr.slice(0,5),
  tsLast5: arr.slice(-5),
  jsonPath,
  jsonSha256: jsonSha,
  jsonSize: fs.statSync(jsonPath).size,
}, null, 2));
