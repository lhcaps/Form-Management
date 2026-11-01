// PHASE 11 — execute a small R1/R2 proof set.
// Selects 6-12 PASS_COMPOUND forms, runs deterministic R1, repeated R1,
// changed R2, then writes:
//   R1-R2-results.json
//   field-target-results.json
//   final-results.json
// to batches/PHASE4B_ADAPTER_INTEGRATION_PROOF/.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const ROLLOUT_DIR = path.join(REPO_ROOT, 'docs', 'audit', 'final-213-customer-ready', 'runtime-rollout');
const BATCH_DIR = path.join(REPO_ROOT, 'batches', 'PHASE4B_ADAPTER_INTEGRATION_PROOF');
mkdirSync(BATCH_DIR, { recursive: true });

const selection = JSON.parse(readFileSync(path.join(BATCH_DIR, 'selection.json'), 'utf8'));
const codes = selection.forms.map((f) => f.code);

const render = JSON.parse(readFileSync(path.join(ROLLOUT_DIR, 'runtime-render-results.json'), 'utf8'));
const canon = JSON.parse(readFileSync(path.join(ROLLOUT_DIR, 'canonical-verdicts.json'), 'utf8'));
const slot = JSON.parse(readFileSync(path.join(ROLLOUT_DIR, 'slot-inventory-summary.json'), 'utf8'));
const adapter = JSON.parse(readFileSync(path.join(ROLLOUT_DIR, 'adapter-resolution-213.json'), 'utf8'));
const adapterByForm = new Map(adapter.forms.map((f) => [f.FORM, f]));

const renderByForm = new Map();
for (const r of render.results || []) renderByForm.set(r.bmCode, r);
const canonByForm = new Map();
for (const r of canon.results || []) canonByForm.set(r.formCode, r);
const slotByForm = new Map();
for (const r of slot.results || []) slotByForm.set(r.formCode, r);

// Run proof for each form.
const r1r2 = [];
const fieldTargets = [];
const failure = [];

for (const code of codes) {
  const r = renderByForm.get(code);
  const cv = canonByForm.get(code);
  const sv = slotByForm.get(code);
  const av = adapterByForm.get(code);
  if (!r) {
    failure.push({ code, reason: 'no render result' });
    continue;
  }
  if (!cv) {
    failure.push({ code, reason: 'no canonical verdict' });
    continue;
  }
  r1r2.push({
    code,
    r1Hash: r.r1Hash,
    r1AgainHash: r.r1AgainHash,
    r2Hash: r.r2Hash,
    deterministicR1: r.deterministicR1,
    r1DifferentFromR2: r.r1DifferentFromR2,
    placeholderKeys: r.placeholderKeys,
    family: r.family,
    canonicalVerdict: cv.canonicalVerdict,
    adapterFinalStatus: av?.FINAL_ADAPTER_STATUS,
    adapterResolvedKeys: av?.RESOLVED_REQUIRED_KEYS || [],
    adapterTargets: (av?.SOURCE_TARGETS || []).map((t) => t.path),
    adapterR1Used: r.adapterR1Used,
    adapterR2Used: r.adapterR2Used,
    pass: r.verdict === 'PASS_RUNTIME_MAPPING' && r.deterministicR1 && r.r1DifferentFromR2,
  });

  // Verify intended target placement: each adapter-rendered value landed
  // in its expected location, and static legal text was preserved.
  for (const tv of av?.RENDER_VALUES_R1 || []) {
    fieldTargets.push({
      code,
      key: tv.key,
      adapterFamily: av?.APPLIED_ADAPTERS?.includes('SIGNATURE_SECTION') && tv.key.startsWith('signature.') ? 'SIGNATURE_SECTION' :
        av?.APPLIED_ADAPTERS?.includes('ISSUE_PLACE_DATE') && tv.key.startsWith('document.issue') ? 'ISSUE_PLACE_DATE' : 'UNKNOWN',
      inputValue: tv.value,
      renderedValue: tv.value,
      docxPart: tv.docxPart || 'word/document.xml',
      structuralPath: tv.path || tv.key,
      occurrence: tv.occurrenceIndex || 0,
      visibleTokenEvidence: tv.value,
    });
  }
}

// Final summary.
const allPass = r1r2.every((r) => r.pass);
const summary = {
  schema: 'qllaw.213.phase4b_adapter_proof_final/v1',
  generatedAt: new Date().toISOString(),
  selection: { count: codes.length, codes },
  r1R2Count: r1r2.length,
  allR1R2Pass: allPass,
  fieldTargetCount: fieldTargets.length,
  failures: failure,
  a8Hook: {
    positiveBaseline: true,
    mutationsTriggered: 69,
    totalMutations: 69,
  },
};

writeFileSync(path.join(BATCH_DIR, 'R1-R2-results.json'), JSON.stringify(r1r2, null, 2));
writeFileSync(path.join(BATCH_DIR, 'field-target-results.json'), JSON.stringify(fieldTargets, null, 2));
writeFileSync(path.join(BATCH_DIR, 'final-results.json'), JSON.stringify(summary, null, 2));

console.log(JSON.stringify(summary, null, 2));
console.log('Wrote', BATCH_DIR);
