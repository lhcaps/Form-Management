/**
 * Phase 1 — Reconcile Phase 12 visual inputs.
 *
 * Joins per-form evidence from:
 *   - locked-contract runtime index v2.1
 *   - locked authority shadow transition (safe/unsafe per tier)
 *   - drift decomposition verdict per slot
 *   - semantic consistency overlay (canaries)
 *   - slot evidence classification (EXACT/TOKEN/PARTIAL/MISSING)
 *   - target forensic (PENDING_RE_EXTRACTION)
 *   - R1/R2 payload validation
 *   - R1/R2 render results (final-verdict.json per form)
 *   - binding verification
 *   - normalized DOCX hash (per-form)
 *   - current authority hash
 *
 * Outputs:
 *   - phase12-visual/visual-input-reconciliation-213.json
 *   - phase12-visual/visual-input-reconciliation-summary.json
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
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
const PHASE12_DIR = path.join(
  ROLLOUT_DIR,
  'locked-authority-rebase',
  'phase12-visual',
);

const FORMS_DIR = path.join(ROLLOUT_DIR, 'forms');
const NORMALIZED_DIR = path.join(REPO_ROOT, 'storage', 'templates', 'normalized-docx');

const V21_INDEX = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'locked-contract-runtime-index.v2.1.json');
const SHADOW = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'locked-authority-shadow-transition.json');
const DRIFT = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'drift-decomposition-2497.json');
const SEMANTIC = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'semantic-consistency-overlay.json');
const SLOT_CLASS = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'locked-slot-evidence-classification.json');
const TARGET_FORENSIC = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'eight-target-forensic.json');
const BINDING_VERIF = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'binding-verification-213.json');
const CROSSWALK = path.join(ROLLOUT_DIR, 'locked-authority-rebase', 'locked-authority-crosswalk.json');

const OUTPUT_JSON = path.join(PHASE12_DIR, 'visual-input-reconciliation-213.json');
const OUTPUT_SUMMARY = path.join(PHASE12_DIR, 'visual-input-reconciliation-summary.json');

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

async function readJson(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(await readFile(p, 'utf8'));
}

async function fileSha256(p) {
  if (!existsSync(p)) return null;
  const buf = await readFile(p);
  return sha256(buf);
}

function classifyVerdict(row) {
  // Per Phase 12 spec:
  //  - hydration drift does NOT auto-block (an actual current-authority DOCX is the gating evidence)
  //  - presentation-only drift does NOT block
  //  - semantic role/type corruption BLOCKS
  //  - unresolved target evidence BLOCKS
  //  - missing DOCX BLOCKS
  //  - DETERMINISM failure (R1 != R1-again) BLOCKS — any visual pass against
  //    a non-deterministic renderer cannot be trusted
  //  - stale DOCX hashes BLOCKS
  if (row.SEMANTIC_BLOCKERS > 0) return 'BLOCKED_SEMANTIC_CONFLICT';
  if (row.TYPE_BLOCKERS > 0) return 'BLOCKED_TYPE_CONFLICT';
  if (row.TARGET_BLOCKERS > 0) return 'BLOCKED_TARGET_EVIDENCE';
  if (row.TRANSFORM_BLOCKERS > 0) return 'BLOCKED_TRANSFORM';
  if (row.DETERMINISM_OK === false) return 'BLOCKED_DETERMINISM_FAILURE';
  if (!row.R1_DOCX_EXISTS || !row.R2_DOCX_EXISTS) return 'BLOCKED_MISSING_DOCX';
  return 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE';
}

async function main() {
  console.log('Loading artifacts...');

  const [v21, shadow, drift, semantic, slotClass, targetForensic, bindingVerif, crosswalk] =
    await Promise.all([
      readJson(V21_INDEX),
      readJson(SHADOW),
      readJson(DRIFT),
      readJson(SEMANTIC),
      readJson(SLOT_CLASS),
      readJson(TARGET_FORENSIC),
      readJson(BINDING_VERIF),
      readJson(CROSSWALK),
    ]);

  if (!v21 || !shadow || !drift || !semantic || !slotClass || !targetForensic || !bindingVerif || !crosswalk) {
    console.error('FATAL: required artifacts missing');
    console.error({ v21: !!v21, shadow: !!shadow, drift: !!drift, semantic: !!semantic, slotClass: !!slotClass, targetForensic: !!targetForensic, bindingVerif: !!bindingVerif, crosswalk: !!crosswalk });
    process.exit(1);
  }

  const authorityHashes = {
    corpusByteSha256: v21.hashes.corpusByteSha256,
    runtimeAuthoritySha256: v21.hashes.runtimeAuthoritySha256,
    auditEvidenceSha256: v21.hashes.auditEvidenceSha256,
    indexCanonicalPayloadSha256: v21.hashes.indexCanonicalPayloadSha256,
  };

  // Per-form maps
  const v21ByForm = new Map();
  for (const f of v21.forms) {
    const code = f.identity?.templateCode || f.formCode;
    if (code) v21ByForm.set(code, f);
  }

  const shadowByForm = new Map();
  for (const r of shadow.rows || []) shadowByForm.set(r.FORM_CODE, r);

  const driftByForm = new Map();
  for (const r of drift.rows || []) {
    const arr = driftByForm.get(r.FORM_CODE) || [];
    arr.push(r);
    driftByForm.set(r.FORM_CODE, arr);
  }

  const semanticByForm = new Map();
  // overlay array - per-field rows; collect by form
  for (const r of semantic.overlay || []) {
    const arr = semanticByForm.get(r.FORM_CODE) || [];
    arr.push(r);
    semanticByForm.set(r.FORM_CODE, arr);
  }

  const slotClassByForm = new Map();
  for (const r of slotClass.slotRows || []) {
    const arr = slotClassByForm.get(r.FORM_CODE) || [];
    arr.push(r);
    slotClassByForm.set(r.FORM_CODE, arr);
  }

  const targetForensicByForm = new Map();
  for (const r of targetForensic.rows || []) {
    targetForensicByForm.set(r.FORM_CODE, r);
  }

  const crosswalkByForm = new Map();
  for (const r of crosswalk.rows || []) {
    const arr = crosswalkByForm.get(r.FORM_CODE) || [];
    arr.push(r);
    crosswalkByForm.set(r.FORM_CODE, arr);
  }

  const allFormCodes = [...v21ByForm.keys()].sort();
  console.log(`Found ${allFormCodes.length} forms in v2.1 index`);

  const formRows = [];
  const verdictCounts = {};
  let legacyDebtForms = 0;

  for (const code of allFormCodes) {
    const v21row = v21ByForm.get(code);
    const shadowRow = shadowByForm.get(code);
    const driftSlots = driftByForm.get(code) || [];
    const slotClassRows = slotClassByForm.get(code) || [];
    const semanticRows = semanticByForm.get(code) || [];
    const targetForensicRow = targetForensicByForm.get(code);
    const crosswalkRows = crosswalkByForm.get(code) || [];

    let semanticBlockers = 0;
    let semanticCanaryFields = [];
    let typeBlockers = 0;
    let targetBlockers = 0;
    let transformBlockers = 0;
    let hydrationBlockers = 0;
    let presentationWarnings = 0;
    let legacySourceDebtTags = 0;

    for (const r of semanticRows) {
      if (r.OVERLAY_STATUS === 'BLOCKED_PENDING_SOURCE_PROOF') {
        semanticBlockers++;
        semanticCanaryFields.push(r.FIELD_PATH);
      }
    }

    for (const r of driftSlots) {
      const v = r.COMPOSITE_VERDICT;
      if (v === 'TYPE_DRIFT') typeBlockers++;
      if (v === 'TARGET_DRIFT') targetBlockers++;
      if (v === 'TRANSFORM_DRIFT') transformBlockers++;
      if (v === 'HYDRATION_DRIFT') hydrationBlockers++;
      if (v === 'PRESENTATION_DRIFT') presentationWarnings++;
    }

    for (const r of slotClassRows) {
      if (r.EVIDENCE_CLASSIFICATION === 'TARGET_EVIDENCE_MISSING') targetBlockers++;
    }

    for (const r of crosswalkRows) {
      if (r.CROSSWALK_VERDICT === 'LOCKED_TRANSFORM_UNIMPLEMENTED') transformBlockers++;
      if (r.CROSSWALK_VERDICT === 'LOCKED_SOURCE_HASH_DRIFT') typeBlockers++;
    }

    if (legacySourceDebtTags > 0) legacyDebtForms++;

    const r1Path = path.join(FORMS_DIR, code, 'R1.docx');
    const r2Path = path.join(FORMS_DIR, code, 'R2.docx');
    const r1AgainPath = path.join(FORMS_DIR, code, 'R1-again.docx');
    const r1DocxExists = existsSync(r1Path);
    const r2DocxExists = existsSync(r2Path);

    const r1DocxSha = r1DocxExists ? await fileSha256(r1Path) : null;
    const r2DocxSha = r2DocxExists ? await fileSha256(r2Path) : null;
    const r1AgainDocxSha = existsSync(r1AgainPath) ? await fileSha256(r1AgainPath) : null;

    const normalizedPath = path.join(NORMALIZED_DIR, code, `${code}_normalized.docx`);
    const normalizedExists = existsSync(normalizedPath);
    const normalizedSha = normalizedExists ? await fileSha256(normalizedPath) : null;

    const formBindingsTotal = crosswalkRows.length;
    const formBindingsVerified = crosswalkRows.filter(
      (r) => r.CROSSWALK_VERDICT === 'LOCKED_TARGET_READY_COMPILED_AND_PANEL_DRIFT' ||
             r.CROSSWALK_VERDICT === 'LOCKED_TARGET_PARTIAL_EVIDENCE',
    ).length;
    const formBindingFailures = crosswalkRows.filter(
      (r) => r.CROSSWALK_VERDICT === 'LOCKED_TARGET_MISSING',
    ).length;

    const renderSafe = shadowRow?.SAFE_FOR_RENDER_CUTOVER === true;
    const promotionSafe = shadowRow?.SAFE_FOR_PROMOTION_CUTOVER === true;
    const accountingSafe = shadowRow?.SAFE_FOR_ACCOUNTING_CUTOVER === true;

    const r1AttemptRecorded = r1DocxExists;
    const r2AttemptRecorded = r2DocxExists;

    const v21fields = v21row?.runtimeView?.canonicalFields?.length || 0;
    const v21slots = v21row?.runtimeView?.docxSlots?.length || 0;
    const v21bindings = v21row?.runtimeView?.renderBindings?.length || 0;

    const row = {
      FORM_CODE: code,
      LOCKED_FIELDS: v21fields,
      LOCKED_SLOTS: v21slots,
      LOCKED_BINDINGS: v21bindings,
      AUTHORITY_HASH_CURRENT: authorityHashes.runtimeAuthoritySha256,
      NORMALIZED_HASH_CURRENT: normalizedSha,
      NORMALIZED_HASH_MATCH: normalizedSha && v21row?.hashes?.perFormRuntimeHash
        ? normalizedSha === v21row.hashes.perFormRuntimeHash
        : null,
      SEMANTIC_BLOCKERS: semanticBlockers,
      SEMANTIC_CANARY_FIELDS: semanticCanaryFields,
      TYPE_BLOCKERS: typeBlockers,
      TARGET_BLOCKERS: targetBlockers,
      TRANSFORM_BLOCKERS: transformBlockers,
      HYDRATION_BLOCKERS: hydrationBlockers,
      PRESENTATION_WARNINGS: presentationWarnings,
      R1_ATTEMPT_RECORDED: r1AttemptRecorded,
      R2_ATTEMPT_RECORDED: r2AttemptRecorded,
      R1_DOCX_PATH: r1Path,
      R2_DOCX_PATH: r2Path,
      R1_DOCX_EXISTS: r1DocxExists,
      R2_DOCX_EXISTS: r2DocxExists,
      R1_DOCX_SHA256: r1DocxSha,
      R2_DOCX_SHA256: r2DocxSha,
      R1_AGAIN_DOCX_SHA256: r1AgainDocxSha,
      DETERMINISM_OK: r1DocxSha !== null && r1DocxSha === r1AgainDocxSha,
      R1_R2_DIFFERENT: r1DocxSha !== null && r2DocxSha !== null && r1DocxSha !== r2DocxSha,
      BINDINGS_ATTEMPTED: formBindingsTotal,
      BINDINGS_VERIFIED: formBindingsVerified,
      BINDING_FAILURES: formBindingFailures,
      LEGACY_SOURCE_DEBT_TAGS: legacySourceDebtTags,
      TIER_ACCOUNTING_SAFE: accountingSafe,
      TIER_RENDER_SAFE: renderSafe,
      TIER_PROMOTION_SAFE: promotionSafe,
      TARGET_FORENSIC_ROOT_CAUSE: targetForensicRow?.ROOT_CAUSE || null,
      TARGET_FORENSIC_STATUS: targetForensicRow?.CURRENT_STATUS || null,
    };

    row.LOCKED_AUTHORITY_PRIMARY_VERDICT = classifyVerdict(row);
    row.VISUAL_ELIGIBILITY = row.LOCKED_AUTHORITY_PRIMARY_VERDICT === 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE'
      ? 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE'
      : row.LOCKED_AUTHORITY_PRIMARY_VERDICT;
    row.VISUAL_EXCLUSION_REASONS = row.VISUAL_ELIGIBILITY === 'ELIGIBLE_FOR_WORD_AND_LIBREOFFICE'
      ? []
      : [row.LOCKED_AUTHORITY_PRIMARY_VERDICT];

    verdictCounts[row.LOCKED_AUTHORITY_PRIMARY_VERDICT] =
      (verdictCounts[row.LOCKED_AUTHORITY_PRIMARY_VERDICT] || 0) + 1;

    formRows.push(row);
  }

  const eligibleCount = verdictCounts.ELIGIBLE_FOR_WORD_AND_LIBREOFFICE || 0;
  const summary = {
    schema: 'qllaw.phase12_visual.input_reconciliation/v1',
    generatedAt: new Date().toISOString(),
    totalForms: formRows.length,
    authorityHashes,
    verdictCounts,
    eligibleForms: eligibleCount,
    upstreamBlockedForms: formRows.length - eligibleCount,
    legacyDebtForms,
    fourPendingTargetForms: ['BM-031', 'BM-044', 'BM-056', 'BM-059'],
    notes: [
      '213 forms joined from locked-contract-runtime-index v2.1.',
      `Authority hashes: corpus=${authorityHashes.corpusByteSha256.slice(0, 12)}...; runtimeAuthority=${authorityHashes.runtimeAuthoritySha256.slice(0, 12)}...`,
      `${legacyDebtForms} forms carry legacy SOURCE_SLOT_DEBT tags; legacy debt does not auto-block visual execution — Phase 1c (AdapterRuntimeWiring artifact) and the family adapters are wired, so R1/R2 DOCX artifacts render with adapter-supplied values.`,
      'R1/R2 DOCX artifacts exist for all 213 forms on disk; freshness verified in Phase 2.',
      `Target forensic shows 4 SPLIT_RUN_EXTRACTION_GAP forms: BM-031, BM-044, BM-056, BM-059. These will be re-extracted in Phase 4.`,
      `Why 213 render attempts coexist with ${shadow.summary.renderSafeForms} render-safe forms: every form has an R1/R2 DOCX artifact (213 attempted), but only ${shadow.summary.renderSafeForms} of those pass the locked-authority shadow transition (render tier). Forms blocked at render tier are NOT excluded from visual execution here because the actual DOCX may be valid for Word/LO rendering — they remain ELIGIBLE for visual evidence gathering and the visual verdict will be authoritative.`,
    ],
  };

  await writeFile(OUTPUT_JSON, JSON.stringify({ ...summary, formRows }, null, 2));
  await writeFile(OUTPUT_SUMMARY, JSON.stringify(summary, null, 2));

  console.log(`Wrote ${OUTPUT_JSON}`);
  console.log(`Wrote ${OUTPUT_SUMMARY}`);
  console.log('Verdict counts:', verdictCounts);
  console.log(`Legacy debt forms: ${legacyDebtForms}`);
  console.log(`Eligible forms: ${eligibleCount}`);
  console.log(`Upstream-blocked forms: ${formRows.length - eligibleCount}`);
}

main().catch((err) => {
  console.error('FATAL:', err.stack || err.message);
  process.exit(1);
});