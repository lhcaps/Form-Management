// Read-only consolidated current-state probe.
// Reads from artifacts only. Does NOT modify any file.
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve('.');
function readJson(p) {
  return JSON.parse(fs.readFileSync(path.join(REPO, p), 'utf8'));
}

const out = {};

// 1. Registered 213 manifest
const manifest = readJson('docs/audit/final-213-customer-ready/runtime-rollout/authoritative-213-manifest.json');
out.registered = {
  path: 'docs/audit/final-213-customer-ready/runtime-rollout/authoritative-213-manifest.json',
  count: (manifest.manifestEntries || manifest.entries || manifest.formCodes || []).length,
  shapeKeys: Object.keys(manifest),
};

// 2. Form-corpus reconciliation (DOCX lock + locked-contract corpus)
const corpus = readJson('docs/audit/docx/reports/form-corpus-reconciliation.json');
const lockedForms = Object.keys(corpus.lockedContracts || corpus.byForm || corpus.contracts || {});
out.lockedContract = {
  path: 'docs/audit/docx/reports/form-corpus-reconciliation.json',
  lockedContractCount: lockedForms.length,
  shapeKeys: Object.keys(corpus).slice(0, 12),
};

// 3. Phase 12 visual final verdicts
const verdicts = readJson('docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual/visual-final-verdicts-213.json');
const visualPass = (verdicts.rows || verdicts.verdicts || []).filter(r => {
  const v = (r.VERDICT || r.verdict || r.status || '').toString().toUpperCase();
  return v === 'PASS' || v === 'VISUAL_PASS' || v === 'WORD_PASS' || v === 'LIBREOFFICE_PASS';
});
out.phase12Visual = {
  path: 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual/visual-final-verdicts-213.json',
  rows: (verdicts.rows || verdicts.verdicts || []).length,
  visualPassCount: visualPass.length,
  sampleVerdicts: Array.from(new Set((verdicts.rows || verdicts.verdicts || []).map(r => (r.VERDICT || r.verdict || r.status || '').toString()))),
};

// 4. Live application roster (read directly from TS entries count)
let liveRoster = [];
try {
  const ts = fs.readFileSync(path.join(REPO, 'packages/form-contracts/src/runtime-readiness.generated.ts'), 'utf8');
  const re = /formCode:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(ts)) !== null) liveRoster.push(m[1]);
} catch (e) { liveRoster = ['ERROR: ' + e.message]; }

// 5. Live roster JSON
const liveJson = readJson('docs/audit/final-213-customer-ready/runtime-rollout/runtime-readiness.generated.json');
out.liveRoster = {
  tsPath: 'packages/form-contracts/src/runtime-readiness.generated.ts',
  tsCount: liveRoster.length,
  jsonPath: 'docs/audit/final-213-customer-ready/runtime-rollout/runtime-readiness.generated.json',
  jsonCount: (liveJson.runtimeReadyFormCodes || []).length,
  jsonRuntimeReadyUniqueCount: liveJson.runtimeReadyUniqueCount,
  jsonSkeletonCount: liveJson.skeletonCount,
  jsonManifestEntriesCount: liveJson.manifestEntriesCount,
};

// 6. Phase 14 evidence-safe roster (read-only report — does NOT modify)
let evidenceSafe = 0;
try {
  const esr = readJson('docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/turn4-adversarial-audit/evidence-safe-roster.json');
  evidenceSafe = esr.eligibleCount ?? (esr.eligible || []).length;
} catch (e) { /* not present */ }
out.evidenceSafeRosterCount = evidenceSafe;

// 7. Goal-state current state
try {
  const gs = readJson('.cursor/qllaw-goal-state.json');
  out.goalState = {
    status: gs.status,
    productionReady: gs.productionReady,
    stagedCount: gs.stagedCount,
    phase14Status: gs.phase14Status,
    runtimeRollout213: {
      registeredForms: gs.runtimeRollout213?.registeredForms,
      runtimeReadyUnique: gs.runtimeRollout213?.runtimeReadyUnique,
      skeletonCount: gs.runtimeRollout213?.skeletonCount,
      browserDocumentVerified: gs.runtimeRollout213?.browserDocumentVerified,
      securityAuditExitCode: gs.runtimeRollout213?.securityAuditExitCode,
      remainingAdvisories: gs.runtimeRollout213?.remainingAdvisories,
    },
  };
} catch (e) { out.goalState = { error: e.message }; }

// 8. Local services (read-only http probe — already executed separately)
out.localServices = {
  web: { url: 'http://localhost:3000/health', observed: '200 OK', source: 'probe' },
  api: { url: 'http://localhost:3001/api/v1/health', observed: '200 OK', source: 'probe' },
  mariadb: { url: 'tcp://localhost:3307', observed: 'DOWN (API uses another DB instance)', source: 'probe' },
};

console.log(JSON.stringify(out, null, 2));
