const fs = require('fs');
const path = require('path');
const file = path.resolve('./packages/form-contracts/src/runtime-readiness.generated.ts');
const src = fs.readFileSync(file, 'utf8');
const matches = [...src.matchAll(/formCode:\s*"([^"]+)"/g)].map(m => m[1]);
const unique = [...new Set(matches)].sort();

const smokeFile = path.resolve('./docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13b-persisted-browser/smoke-selection.json');
const smoke = JSON.parse(fs.readFileSync(smokeFile, 'utf8'));
const smokeCodes = Object.keys(smoke.coverageByForm);
console.log('Smoke selection:', smokeCodes.length);
console.log('Smoke runtime-ready overlap:', smokeCodes.filter(c => unique.includes(c)));
console.log('Smoke can-be-persisted:', smokeCodes.filter(c => !unique.includes(c)));

const queueFile = path.resolve('./docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13b-persisted-browser/browser-queue-83.json');
const queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
const queueCodes = queue.rows.map(r => r.FORM_CODE || r.formCode);
console.log('Queue total:', queueCodes.length);
console.log('Queue runtime-ready:', queueCodes.filter(c => unique.includes(c)));
console.log('Queue can-be-persisted:', queueCodes.filter(c => !unique.includes(c)).length);
