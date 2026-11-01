// Discover the exact verdict shape and counts.
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve('.');
const vp = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual/visual-final-verdicts-213.json'), 'utf8'));
const rows = vp.rows || vp.verdicts || [];
const sample = rows.slice(0, 3);
const tally = {};
for (const r of rows) {
  const key = JSON.stringify(Object.keys(r).sort());
  tally[key] = (tally[key] || 0) + 1;
}
console.log(JSON.stringify({ shapeKeys: Object.keys(vp).slice(0,15), rowCount: rows.length, keyShapes: tally, sample }, null, 2));
