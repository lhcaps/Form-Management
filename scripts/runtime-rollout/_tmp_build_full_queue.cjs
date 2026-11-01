const fs = require('fs');
const path = require('path');
const queue = JSON.parse(fs.readFileSync(path.resolve('./docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13b-persisted-browser/browser-queue-83.json'), 'utf8'));
const runtimeReady = new Set(['BM-001','BM-002','BM-008','BM-010','BM-012','BM-136','BM-148','BM-156','BM-157','BM-168','BM-171','BM-174','BM-181','BM-206','BM-213']);
const eligible = queue.rows
  .map(r => r.FORM_CODE)
  .filter(c => !runtimeReady.has(c));
console.log('Total queue:', queue.rows.length);
console.log('Eligible (not runtime-ready):', eligible.length);
fs.writeFileSync(path.resolve('./scripts/runtime-rollout/_tmp_full_queue.txt'), eligible.join('\n'));
console.log('Written: scripts/runtime-rollout/_tmp_full_queue.txt');
