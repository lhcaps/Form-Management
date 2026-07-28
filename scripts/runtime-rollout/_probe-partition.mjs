// Read-only partitioning + smoke.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const REPO = path.resolve('.');

// 1. Registered 213
const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/audit/final-213-customer-ready/runtime-rollout/authoritative-213-manifest.json'), 'utf8'));
const registered = new Set(manifest.entries.map(e => e.FORM_CODE).filter(Boolean));

// 2. Locked contracts corpus
const corpus = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/audit/docx/reports/form-corpus-reconciliation.json'), 'utf8'));
const locked = new Set(Object.keys(corpus.lockedContracts || {}));

// 3. Phase 12 verdicts
const vp = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual/visual-final-verdicts-213.json'), 'utf8'));
const visualPass = new Set();
const visualBlocked = new Set();
for (const r of vp.rows) {
  if (r.VISUAL_FINAL_VERDICT === 'WORD_AND_LIBREOFFICE_PASS') visualPass.add(r.FORM_CODE);
  else if (r.VISUAL_FINAL_VERDICT === 'UPSTREAM_RENDER_BLOCKED') visualBlocked.add(r.FORM_CODE);
}

// 4. Live roster (read from both TS + JSON, find common)
const tsText = fs.readFileSync(path.join(REPO, 'packages/form-contracts/src/runtime-readiness.generated.ts'), 'utf8');
const liveTs = new Set();
for (const m of tsText.matchAll(/formCode:\s*"([^"]+)"/g)) liveTs.add(m[1]);
const liveJson = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/audit/final-213-customer-ready/runtime-rollout/runtime-readiness.generated.json'), 'utf8'));
const liveJr = new Set(liveJson.runtimeReadyFormCodes || []);

// 5. Phase 14 evidence-safe roster (read-only)
const eSafe = JSON.parse(fs.readFileSync(path.join(REPO, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/turn4-adversarial-audit/evidence-safe-roster.json'), 'utf8'));
const evidenceSafeSet = new Set(eSafe.eligible || []);

// 6. Semantic UI corpus (213 runtime-ux-profile files on disk)
const appsRuntimeUx = fs.readdirSync(path.join(REPO, 'apps/web/src/lib/runtime-ux')).filter(f => /^bm\d{3}-runtime-ux-profile\.ts$/.test(f));
const semanticSet = new Set(appsRuntimeUx.map(f => 'BM-' + f.match(/^bm(\d{3})/)[1]));

function inter(a, b) { const out = new Set(); for (const x of a) if (b.has(x)) out.add(x); return out; }
function diff(a, b) { const out = new Set(); for (const x of a) if (!b.has(x)) out.add(x); return out; }

const liveRoster = liveTs.size === liveJr.size && [...liveTs].every(x => liveJr.has(x)) ? liveTs : new Set([...liveTs, ...liveJr]);
const skeleton = diff(registered, liveRoster);

const out = {
  registered: registered.size,
  lockedContracts: locked.size,
  semanticUI: semanticSet.size,
  phase12VisualPass: visualPass.size,
  phase12UpstreamBlocked: visualBlocked.size,
  liveRosterTs: liveTs.size,
  liveRosterJson: liveJr.size,
  liveRosterCommon: liveTs.size === liveJr.size && [...liveTs].every(x => liveJr.has(x)) ? 'TS == JSON' : 'TS != JSON',
  liveRosterUnionCount: new Set([...liveTs, ...liveJr]).size,
  skeletonCount: skeleton.size,
  evidenceSafeRosterCount: evidenceSafeSet.size,
  partition: {
    registeredMinusLive: registered.size - liveRoster.size,
    livePlusSkeleton: liveRoster.size + skeleton.size,
    appRosterAndUpstreamBlocked: [...inter(liveRoster, visualBlocked)].sort(),
    appRosterAndVisualPass: [...inter(liveRoster, visualPass)].sort().length,
    semanticUIAndRegistered: [...inter(semanticSet, registered)].length,
    evidenceSafeAndVisualPass: [...inter(evidenceSafeSet, visualPass)].length,
    evidenceSafeAndUpstreamBlocked: [...inter(evidenceSafeSet, visualBlocked)],
    formsMissingFromSemanticUI: [...diff(registered, semanticSet)].sort(),
    formsMissingFromLockedContracts: [...diff(registered, locked)].sort(),
  },
  servicesProbed: 'see web/api smoke section in report',
  activeRosterSha256: {
    ts: crypto.createHash('sha256').update(tsText).digest('hex'),
    json: crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, 'docs/audit/final-213-customer-ready/runtime-rollout/runtime-readiness.generated.json'))).digest('hex'),
  },
};
console.log(JSON.stringify(out, null, 2));
