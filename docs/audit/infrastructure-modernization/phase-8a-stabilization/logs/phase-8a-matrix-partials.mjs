import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const matrixPath = join(
  ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json',
);
const raw = readFileSync(matrixPath, 'utf8');
const matrix = JSON.parse(raw);
const rows = matrix.rows ?? [];
const partials = [];
const passes = [];
const pending = [];
for (const r of rows) {
  const c = r.templateCode;
  if (typeof c !== 'string') continue;
  if (r.status === 'INPUT_CONNECTED_PARTIAL') partials.push(c);
  else if (r.status === 'INPUT_CONNECTED_PASS') passes.push(c);
  else if (r.status === 'FIDELITY_PENDING' || r.status === 'ROUTE_BLOCKED' || r.status === 'CONTRACT_BLOCKED' || r.status === 'PREVIEW_BLOCKED') pending.push(c);
}
partials.sort();
passes.sort();
const summary = {
  totalFormsInMatrix: rows.length,
  passCountLatestSnapshot: matrix.counts?.INPUT_CONNECTED_PASS ?? null,
  partialCountLatestSnapshot: matrix.counts?.INPUT_CONNECTED_PARTIAL ?? null,
  fidelityPendingLatest: matrix.counts?.FIDELITY_PENDING ?? null,
  observedPassCount: passes.length,
  observedPartialCount: partials.length,
  observedPendingCodes: pending,
  partialsSorted: partials,
  passesSorted: passes,
  runtimeReadyAllowlistSample: passes.filter((c) => c === 'BM-001' || c === 'BM-171'),
};
writeFileSync(join(ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs/phase-8a-matrix-partials.json'), JSON.stringify(summary, null, 2));
process.stdout.write(JSON.stringify({
  total: rows.length,
  latestCounts: matrix.counts,
  observed: { pass: passes.length, partial: partials.length },
  partialsSorted: partials,
}, null, 2));
