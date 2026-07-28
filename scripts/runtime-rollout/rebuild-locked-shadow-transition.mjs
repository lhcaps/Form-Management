// Phase 5 — Rebuild shadow transition with precise per-form blockers and
// three-tier safe counts.
//
// Reads:
//   - locked-drift-decomposition-2497.json   (Phase 1)
//   - semantic-consistency-overlay.json      (Phase 2)
//   - transform-inventory.json               (Phase 3)
//   - eight-target-forensic.json             (Phase 4)
//   - canonical-verdicts.json                (legacy primary verdict surface)
//
// Builds per-form output:
//   FORM_CODE
//   LEGACY_VERDICT
//   LOCKED_VERDICT
//   BINDING_BLOCKERS
//   SEMANTIC_BLOCKERS
//   PERSISTENCE_BLOCKERS
//   PRESENTATION_WARNINGS
//   TRANSFORM_BLOCKERS
//   TARGET_BLOCKERS
//   SAFE_FOR_ACCOUNTING_CUTOVER
//   SAFE_FOR_RENDER_CUTOVER
//   SAFE_FOR_PROMOTION_CUTOVER
//
// Each tier surfaces its blockers separately so that accounting cutover can
// proceed even when render-target gaps remain.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DRIFT_SUMMARY = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/drift-decomposition-summary.json');
const SEMANTIC_OVERLAY = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/semantic-consistency-overlay.json');
const TRANSFORM_INVENTORY = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/transform-inventory.json');
const FORENSIC = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/eight-target-forensic.json');
const LEGACY_VERDICTS = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/canonical-verdicts.json');

const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-shadow-transition.json');

function readJsonSafe(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function buildShadowTransition() {
  const index = loadLockedRuntimeIndex();
  const driftSummary = existsSync(DRIFT_SUMMARY) ? readJsonSafe(DRIFT_SUMMARY) : { totalRows: 0, byCompositeVerdict: {}, formTotals: [] };
  const semanticOverlay = existsSync(SEMANTIC_OVERLAY) ? readJsonSafe(SEMANTIC_OVERLAY) : { overlay: [], corruptionCanaries: [] };
  const transformInv = existsSync(TRANSFORM_INVENTORY) ? readJsonSafe(TRANSFORM_INVENTORY) : { rows: [] };
  const forensic = existsSync(FORENSIC) ? readJsonSafe(FORENSIC) : { rows: [] };
  const legacy = existsSync(LEGACY_VERDICTS) ? readJsonSafe(LEGACY_VERDICTS) : { results: [] };
  const legacyByFormCode = new Map();
  for (const r of legacy.results ?? []) legacyByFormCode.set(r.formCode, r);

  // Per-form drift totals lookup
  const driftByForm = new Map();
  for (const ft of driftSummary.formTotals ?? []) driftByForm.set(ft.formCode, ft);

  // Per-form transform implementation: look up transform-binding list.
  const unimplementedFormSet = new Map();
  for (const form of index.forms) {
    let unimplemented = 0;
    for (const b of form.runtimeView.renderBindings ?? []) {
      const t = b.transform ?? 'identity';
      if (t !== 'identity' && t !== 'date.issuePlaceDateLine') unimplemented += 1;
    }
    if (unimplemented > 0) unimplementedFormSet.set(form.identity.templateCode, unimplemented);
  }
  void transformInv; void unimplementedFormSet;

  // Per-form forensic lookup
  const forensicByForm = new Map();
  for (const row of forensic.rows ?? []) {
    if (!forensicByForm.has(row.FORM_CODE)) forensicByForm.set(row.FORM_CODE, []);
    forensicByForm.get(row.FORM_CODE).push(row);
  }

  // Per-form semantic lookup
  const semanticByForm = new Map();
  for (const row of semanticOverlay.overlay ?? []) {
    if (!semanticByForm.has(row.FORM_CODE)) semanticByForm.set(row.FORM_CODE, []);
    semanticByForm.get(row.FORM_CODE).push(row);
  }

  const rows = [];
  for (const form of index.forms) {
    const code = form.identity.templateCode;
    const driftTotals = driftByForm.get(code) ?? null;
    const semanticRows = semanticByForm.get(code) ?? [];
    const forensicRows = forensicByForm.get(code) ?? [];
    const legacyRow = legacyByFormCode.get(code);

    // Binding blockers: from drift — type/role/target/transform/save/hydration.
    const bindingBlockers = [];
    const presentationWarnings = [];
    if (driftTotals) {
      const v = driftByForm.get(code);
      const blockList = v.blockingVerdicts ?? [];
      for (const b of blockList) {
        if (b === 'PRESENTATION_DRIFT' || b === 'INPUT_VALIDATION_DRIFT' || b === 'COMPATIBLE_VARIATION' || b === 'NOT_APPLICABLE' || b === 'EXACT') continue;
        bindingBlockers.push(b);
      }
      if ((v.compatibilityWarnings ?? 0) > 0) presentationWarnings.push(`presentation-warnings=${v.compatibilityWarnings}`);
    }

    // Semantic blockers: from overlay
    const semanticBlockers = semanticRows
      .filter((r) => r.OVERLAY_STATUS === 'BLOCKED_PENDING_SOURCE_PROOF')
      .map((r) => `SEMANTIC_${r.CONFLICT}=${r.FIELD_PATH}`);

    // Persistence blockers: hydration drift is persistence-side; save payload
    // drift is too. These flow from drift-blocker list.
    const persistenceBlockers = bindingBlockers.filter((b) => b === 'HYDRATION_DRIFT' || b === 'SAVE_PAYLOAD_DRIFT' || b === 'CONTROL_DRIFT');

    // Transform blockers: only if a non-implemented transform appears.
    const transformBlockers = [];
    if (unimplementedFormSet.has(code)) {
      transformBlockers.push(`unimplemented-transforms=${unimplementedFormSet.get(code)}`);
    }

    // Target blockers: forensic MISSING/PARTIAL rows.
    const targetBlockers = forensicRows
      .filter((r) => ['SOURCE_TARGET_GENUINELY_ABSENT', 'PENDING_RE_EXTRACTION'].includes(r.CURRENT_STATUS))
      .map((r) => `${r.SLOT_ID}=${r.ROOT_CAUSE}`);

    const legacyVerdict = legacyRow?.canonicalVerdict ?? 'NOT_EXECUTED';
    const lockedVerdict = (bindingBlockers.length === 0 && semanticBlockers.length === 0 && transformBlockers.length === 0 && targetBlockers.length === 0)
      ? 'LOCKED_ALL_CLEAR'
      : 'LOCKED_EVIDENCE_BLOCKED';

    // Accounting cutover requires only the locked INDEX integrity and counts.
    // It may proceed even with hydration/target/semantic drift, because the
    // whole point of accounting is to expose them. Semantic canaries are
    // recorded but do not block accounting.
    const safeAccounting = (driftTotals ? driftTotals.safeForAccountingCutover : false);

    const safeRender = safeAccounting
      && (driftTotals ? driftTotals.safeForRenderCutover : false)
      && transformBlockers.length === 0
      && targetBlockers.length === 0;

    const safePromotion = safeRender
      && (driftTotals ? driftTotals.safeForPromotionCutover : false)
      && semanticBlockers.length === 0;

    rows.push({
      FORM_CODE: code,
      LEGACY_VERDICT: legacyVerdict,
      LOCKED_VERDICT: lockedVerdict,
      BINDING_BLOCKERS: bindingBlockers,
      SEMANTIC_BLOCKERS: semanticBlockers,
      PERSISTENCE_BLOCKERS: persistenceBlockers,
      PRESENTATION_WARNINGS: presentationWarnings,
      TRANSFORM_BLOCKERS: transformBlockers,
      TARGET_BLOCKERS: targetBlockers,
      SAFE_FOR_ACCOUNTING_CUTOVER: safeAccounting,
      SAFE_FOR_RENDER_CUTOVER: safeRender,
      SAFE_FOR_PROMOTION_CUTOVER: safePromotion,
    });
  }

  const summary = {
    schema: 'qllaw.213.locked_shadow_transition_v2/v1',
    generatedAt: new Date().toISOString(),
    indexSchema: index.schema,
    totalRows: rows.length,
    accountingSafeForms: rows.filter((r) => r.SAFE_FOR_ACCOUNTING_CUTOVER).length,
    renderSafeForms: rows.filter((r) => r.SAFE_FOR_RENDER_CUTOVER).length,
    promotionSafeForms: rows.filter((r) => r.SAFE_FOR_PROMOTION_CUTOVER).length,
    transformBlockerForms: rows.filter((r) => r.TRANSFORM_BLOCKERS.length > 0).length,
    targetBlockerForms: rows.filter((r) => r.TARGET_BLOCKERS.length > 0).length,
    semanticBlockerForms: rows.filter((r) => r.SEMANTIC_BLOCKERS.length > 0).length,
    persistenceBlockerForms: rows.filter((r) => r.PERSISTENCE_BLOCKERS.length > 0).length,
    presentationWarningForms: rows.filter((r) => r.PRESENTATION_WARNINGS.length > 0).length,
  };

  return { rows, summary };
}

export function writeShadowTransition() {
  const { rows, summary } = buildShadowTransition();
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const output = {
    schema: summary.schema,
    generatedAt: summary.generatedAt,
    indexSchema: summary.indexSchema,
    summary,
    rows,
  };
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, summary };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { summary, outputPath } = writeShadowTransition();
  console.log(`OK shadow transition v2: accountingSafe=${summary.accountingSafeForms} renderSafe=${summary.renderSafeForms} promotionSafe=${summary.promotionSafeForms}`);
  console.log(`     transformBlockerForms=${summary.transformBlockerForms}; targetBlockerForms=${summary.targetBlockerForms}; semanticBlockerForms=${summary.semanticBlockerForms}`);
  console.log(`     persistenceBlockerForms=${summary.persistenceBlockerForms}; presentationWarningForms=${summary.presentationWarningForms}`);
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
}
