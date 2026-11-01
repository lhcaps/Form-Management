/**
 * Phase 1 invariant guard. Fails closed if the authoritative manifest drifts
 * away from the canonical 213-form registry.
 */

import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);

const BM_PANEL_CODES_FILE = path.join(
  REPO_ROOT,
  'apps',
  'web',
  'src',
  'lib',
  'generated',
  'bm-panel-codes.generated.ts',
);

const BRIDGE_ELIGIBILITY_PATH = path.join(
  REPO_ROOT,
  'packages',
  'form-contracts',
  'src',
  'bridge-eligibility.ts',
);

async function readPanelCodeList() {
  const buf = await readFile(BM_PANEL_CODES_FILE, 'utf8');
  const regex = /"BM-\d{3}"/g;
  const codes = [];
  const seen = new Set();
  let m;
  while ((m = regex.exec(buf)) !== null) {
    const code = m[0].replace(/"/g, '');
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  return codes;
}

async function readStandaloneRuntimeCodes() {
  const buf = await readFile(BRIDGE_ELIGIBILITY_PATH, 'utf8');
  const arrayMatch = buf.match(/STANDALONE_RUNTIME_TEMPLATE_CODES\s*=\s*\[([^\]]+)\]/);
  const inner = arrayMatch && arrayMatch[1];
  const codes = inner ? (inner.match(/'BM-\d{3}'/g) || []).map((s) => s.replace(/'/g, '')) : [];
  return new Set(codes);
}

async function loadJson(rel) {
  return JSON.parse(await readFile(path.join(ROLLOUT_DIR, rel), 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    console.error(`ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function main() {
  const expectedCodes = await readPanelCodeList();
  const expectedRuntimeReady = await readStandaloneRuntimeCodes();

  const manifest = await loadJson('authoritative-213-manifest.json');
  const readiness = await loadJson('render-readiness-213-matrix.json');
  const legalHeader = await loadJson('legal-header-213-matrix.json');
  const clusters = await loadJson('technical-family-clusters.json');
  const commandLog = await loadJson('command-log.json');

  assert(expectedCodes.length === 213, `expected 213 panel codes; got ${expectedCodes.length}`);
  assert(manifest.entries.length === 213, `manifest entries != 213 (got ${manifest.entries.length})`);
  assert(readiness.rows.length === 213, `readiness rows != 213`);
  assert(legalHeader.rows.length === 213, `legal-header rows != 213`);

  const manifestSet = new Set(manifest.entries.map((e) => e.FORM_CODE));
  let missing = 0;
  for (const code of expectedCodes) {
    if (!manifestSet.has(code)) missing++;
  }
  assert(missing === 0, `${missing} expected BM codes missing from manifest`);

  const seen = new Set();
  let dup = 0;
  for (const e of manifest.entries) {
    if (seen.has(e.FORM_CODE)) dup++;
    seen.add(e.FORM_CODE);
  }
  assert(dup === 0, `${dup} duplicate FORM_CODE in manifest`);

  // Runtime ready roster must equal canonical STANDALONE_RUNTIME_TEMPLATE_CODES
  const expectedReady = [...expectedRuntimeReady].sort().join(',');
  const observedReady = [...manifest.runtimeReadyForms].sort().join(',');
  assert(expectedReady === observedReady, `runtimeReadyForms drifted. expected=${expectedReady} observed=${observedReady}`);

  // Counts must be consistent
  const readyInEntries = manifest.entries.filter((e) => e.CURRENT_RUNTIME_STATUS === 'RUNTIME_READY').length;
  assert(manifest.runtimeReadyCount === readyInEntries, 'runtimeReadyCount inconsistent');
  const candidatesInEntries = manifest.entries.filter((e) => e.CURRENT_RUNTIME_STATUS === 'RUNTIME_CANDIDATE').length;
  assert(manifest.runtimeCandidateCount === candidatesInEntries, 'runtimeCandidateCount inconsistent');

  // Cluster sum must equal total
  const clusterSum = clusters.clusters.reduce((acc, c) => acc + c.count, 0);
  assert(clusterSum === 213, `cluster total = ${clusterSum} != 213`);

  // Command log invariants must agree
  assert(commandLog.invariants.registeredFormCount === 213, 'command-log registeredFormCount drift');
  assert(commandLog.invariants.duplicateFormCodeCount === 0, 'command-log duplicate drift');
  assert(commandLog.invariants.missingFormCodeCount === 0, 'command-log missing drift');

  console.log('PHASE1_INVARIANTS:OK');
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});
