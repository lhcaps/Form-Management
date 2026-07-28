const fs = require('fs');
const path = 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13c-live-browser';
const manifest213 = JSON.parse(fs.readFileSync('docs/audit/final-213-customer-ready/runtime-rollout/authoritative-213-manifest.json', 'utf8'));
const verdicts83 = JSON.parse(fs.readFileSync(path + '/browser-final-verdicts-83.json', 'utf8'));

const v83Map = new Map();
for (const f of verdicts83.forms) v83Map.set(String(f.formCode).toUpperCase(), f);

const rows = [];
for (const entry of manifest213.entries) {
  const code = String(entry.FORM_CODE).toUpperCase();
  const v83 = v83Map.get(code);
  let verdict, reason;
  if (v83) {
    if (v83.verdict === 'PERSISTED_BROWSER_PASS') {
      verdict = 'PERSISTED_BROWSER_PASS';
      reason = `Phase 12 visual PASS; Phase 13C persisted browser lifecycle PASS (R1+R2 round-trip, fresh-context reload, preview/download, no stale R1)`;
    } else if (v83.verdict === 'PERSISTED_BRIDGE_BLOCKED_BY_RUNTIME_READY') {
      verdict = 'UPSTREAM_RENDER_BLOCKED_RUNTIME_READY';
      reason = `Phase 12 visual PASS, but template is runtime-ready; persisted draft bridge architecturally blocked (per packages/form-contracts/src/bridge-eligibility.ts getPersistedDraftBridgeIneligibilityReason); standalone preview session flow required (Phase 14+)`;
    } else {
      verdict = 'PERSISTED_BROWSER_FAIL';
      reason = `Phase 12 visual PASS; Phase 13C persisted browser FAILED: ${v83.errors?.join('; ') || 'unknown'}`;
    }
  } else {
    // Not in visual-pass: remains upstream-render-blocked
    const blockers = entry.CURRENT_BLOCKERS || [];
    const blockerCodes = blockers.map(b => b.blocker).join(',');
    verdict = 'UPSTREAM_RENDER_BLOCKED';
    reason = `Phase 12 visual FAIL: ${blockerCodes || 'phase 12 visual failed'}`;
  }
  rows.push({
    formCode: code,
    title: entry.TITLE,
    runtimeStatus: entry.CURRENT_RUNTIME_STATUS,
    phase12Verdict: v83 ? 'VISUAL_PASS' : 'VISUAL_FAIL',
    phase13cVerdict: verdict,
    technicalFamily: entry.TECHNICAL_FAMILY,
    fieldCount: entry.FIELD_COUNT,
    phase13cReason: reason,
  });
}

const counts = { PASS: 0, BRIDGE_BLOCKED: 0, FAIL: 0, UPSTREAM: 0 };
for (const r of rows) {
  if (r.phase13cVerdict === 'PERSISTED_BROWSER_PASS') counts.PASS++;
  else if (r.phase13cVerdict === 'UPSTREAM_RENDER_BLOCKED_RUNTIME_READY') counts.BRIDGE_BLOCKED++;
  else if (r.phase13cVerdict === 'UPSTREAM_RENDER_BLOCKED') counts.UPSTREAM++;
  else counts.FAIL++;
}

const out = {
  schema: 'phase13c.browser-final-verdicts-213.v1',
  generatedAt: new Date().toISOString(),
  source: 'authoritative-213-manifest.json + browser-final-verdicts-83.json',
  totalForms: rows.length,
  summary: {
    total: rows.length,
    persistedBrowserPass: counts.PASS,
    runtimeReadyBridgeBlocked: counts.BRIDGE_BLOCKED,
    upstreamRenderBlocked: counts.UPSTREAM,
    persistedBrowserFail: counts.FAIL,
  },
  forms: rows,
};

fs.writeFileSync(path + '/browser-final-verdicts-213.json', JSON.stringify(out, null, 2));
console.log('Wrote', rows.length, 'verdicts. PASS:', counts.PASS, 'BRIDGE_BLOCKED:', counts.BRIDGE_BLOCKED, 'UPSTREAM:', counts.UPSTREAM, 'FAIL:', counts.FAIL);
console.log('Sum check:', counts.PASS + counts.BRIDGE_BLOCKED + counts.UPSTREAM + counts.FAIL, '== 213?', counts.PASS + counts.BRIDGE_BLOCKED + counts.UPSTREAM + counts.FAIL === 213);
