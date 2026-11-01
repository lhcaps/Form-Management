/**
 * Phase 6 — Select 12-form stratified smoke.
 *
 * Selects 12 forms from the eligible queue (84 forms) covering all
 * Phase 12 structural strata. Each selected form must be
 * FRESH_CURRENT_AUTHORITY and ELIGIBLE_FOR_WORD_AND_LIBREOFFICE.
 */

import { readFile, writeFile } from 'node:fs/promises';
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
const PHASE12_DIR = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'phase12-visual');

const RECON = path.join(PHASE12_DIR, 'visual-input-reconciliation-213.json');
const FRESHNESS = path.join(PHASE12_DIR, 'docx-freshness-213.json');

const OUTPUT = path.join(PHASE12_DIR, 'smoke-selection.json');
const OUTPUT_EXCL = path.join(PHASE12_DIR, 'smoke-exclusions.json');

async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf8'));
}

async function main() {
  const recon = await readJson(RECON);
  const fresh = await readJson(FRESHNESS);

  const reconByForm = new Map();
  for (const r of recon.formRows) reconByForm.set(r.FORM_CODE, r);
  const freshByForm = new Map();
  for (const r of fresh.formRows) freshByForm.set(r.FORM_CODE, r);

  function isEligible(code) {
    const r = reconByForm.get(code);
    const f = freshByForm.get(code);
    if (!r || !f) return false;
    if (r.VISUAL_ELIGIBILITY !== 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE') return false;
    if (f.VERDICT !== 'FRESH_CURRENT_AUTHORITY') return false;
    return true;
  }

  const excluded = [];
  const selected = [];
  const usedCodes = new Set();

  function tryPick(code, stratum) {
    if (usedCodes.has(code)) {
      excluded.push({ code, stratum, reason: 'ALREADY_SELECTED' });
      return false;
    }
    if (!isEligible(code)) {
      excluded.push({
        code,
        stratum,
        reason: `NOT_ELIGIBLE: recon=${reconByForm.get(code)?.VISUAL_ELIGIBILITY} fresh=${freshByForm.get(code)?.VERDICT}`,
      });
      return false;
    }
    const r = reconByForm.get(code);
    const f = freshByForm.get(code);
    selected.push({
      code,
      stratum,
      reconVerdict: r.LOCKED_AUTHORITY_PRIMARY_VERDICT,
      r1Sha: f.R1_DOCX_SHA256,
      r2Sha: f.R2_DOCX_SHA256,
      r1AgainSha: f.R1_AGAIN_DOCX_SHA256,
      determinismOk: f.DETERMINISM_OK,
      r1R2Different: f.R1_R2_DIFFERENT,
      lockedFields: r.LOCKED_FIELDS,
      lockedSlots: r.LOCKED_SLOTS,
      lockedBindings: r.LOCKED_BINDINGS,
    });
    usedCodes.add(code);
    return true;
  }

  // Get all eligible forms sorted by field count desc to favor coverage
  const eligibleList = [...reconByForm.values()]
    .filter((r) => r.VISUAL_ELIGIBILITY === 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE')
    .sort((a, b) => b.LOCKED_FIELDS - a.LOCKED_FIELDS);

  // Stratum candidates. We try preferred first; if blocked, fall back to eligible.
  const stratums = [
    // simple paragraph scalar (low field count)
    { code: 'BM-027', stratum: 'simple paragraph scalar', fallback: () => eligibleList.find((r) => r.LOCKED_FIELDS <= 5) },
    // table-heavy form (high field count)
    { code: 'BM-058', stratum: 'table-heavy form (36 fields)', fallback: () => eligibleList.find((r) => r.LOCKED_FIELDS >= 20) },
    // issue-place/date transform
    { code: 'BM-068', stratum: 'issue-place/date transform (14 fields)', fallback: () => eligibleList.find((r) => r.LOCKED_FIELDS >= 10 && r.LOCKED_FIELDS <= 20) },
    // signature block
    { code: 'BM-213', stratum: 'signature block + recipient block (already verified)', fallback: null },
    // recipient/footer block
    { code: 'BM-082', stratum: 'recipient/footer block', fallback: null },
    // legal header (sample eligible form)
    { code: 'BM-162', stratum: 'legal header eligible form', fallback: null },
    // multiline textarea
    { code: 'BM-052', stratum: 'multiline textarea (9 fields)', fallback: () => eligibleList.find((r) => r.LOCKED_FIELDS >= 8) },
    // date-part fields
    { code: 'BM-205', stratum: 'date-part fields', fallback: null },
    // split-run target — must be a form with TARGET_EVIDENCE_MISSING that we closed in Phase 4
    //   BM-031, BM-044, BM-056, BM-059 are BLOCKED_TARGET_EVIDENCE; none are eligible.
    //   Use BM-090 (18 fields) — Phase 4 closed-context sibling.
    { code: 'BM-090', stratum: 'split-run target sibling (Phase 4 closed context)', fallback: null },
    // multi-page output
    { code: 'BM-192', stratum: 'multi-page output eligible form', fallback: null },
    // form with official-config values
    { code: 'BM-051', stratum: 'official-config values', fallback: null },
    // form with prior render-repair evidence
    { code: 'BM-069', stratum: 'numeric stale-value regression control (BM-069 fix)', fallback: null },
  ];

  for (const s of stratums) {
    let ok = tryPick(s.code, s.stratum);
    if (!ok && s.fallback) {
      const fb = s.fallback();
      if (fb) ok = tryPick(fb.FORM_CODE, `${s.stratum} (fallback ${fb.FORM_CODE})`);
    }
  }

  const sel = {
    schema: 'qllaw.phase12_visual.smoke_selection/v1',
    generatedAt: new Date().toISOString(),
    totalSelected: selected.length,
    selectedForms: selected,
    excludedCandidates: excluded,
    notes: [
      `Selected ${selected.length} forms from the eligible queue (84 total).`,
      'Each selected form is FRESH_CURRENT_AUTHORITY and ELIGIBLE_FOR_WORD_AND_LIBREOFFICE.',
      'Strata coverage map is in selectedForms[].stratum.',
      'BM-001, BM-136, BM-171 are blocked (BM-001 = TYPE_DRIFT, BM-136 = SEMANTIC canary, BM-171 = TRANSFORM_UNIMPLEMENTED). Per Phase 12 spec, blocked forms are not forced into the smoke set.',
      'BM-069 is included as the numeric stale-value regression control (BM-069 inspection fix).',
    ],
  };

  await writeFile(OUTPUT, JSON.stringify(sel, null, 2));
  await writeFile(OUTPUT_EXCL, JSON.stringify({
    schema: 'qllaw.phase12_visual.smoke_exclusions/v1',
    generatedAt: new Date().toISOString(),
    totalExclusions: excluded.length,
    exclusions: excluded,
  }, null, 2));

  console.log(`Selected ${selected.length} smoke forms`);
  for (const s of selected) {
    console.log(`  ${s.code} :: ${s.stratum}`);
  }
  if (selected.length !== 12) {
    console.warn(`WARNING: expected 12 smoke forms, got ${selected.length}`);
  }
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});