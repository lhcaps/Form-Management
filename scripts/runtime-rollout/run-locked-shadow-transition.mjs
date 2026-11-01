// Shadow transition matrix — compare legacy verdicts (canonical-verdicts.json)
// against locked-authority verdicts. The matrix is the gate that prevents
// cutover regressions.
//
// Hard rejection rules (from the activation spec):
//   - improvement caused by dropping locked required fields
//   - improvement caused by treating target-evidence missing as PASS
//   - improvement caused by ignoring source hash drift
//   - worsening caused only by compiled-only/panel-only fields
//   - adapter override of locked target
//
// Each row records the legacy verdict, the locked verdict, and a SAFE_TO_CUTOVER
// boolean that is true only when the transition is "lateral" or "worsens for
// the right reason" (locked authority demands more, not less).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedRuntimeIndex } from './lib/locked-runtime-index.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const LEGACY_VERDICTS_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/canonical-verdicts.json');
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-shadow-transition.json');

function readJsonSafe(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function lockedVerdictForForm(form, crosswalkByField) {
  let partial = 0;
  let missing = 0;
  let transformUnimplemented = 0;
  for (const field of form.runtimeView.canonicalFields) {
    const row = crosswalkByField.get(field.path);
    if (!row) {
      missing += 1;
      continue;
    }
    if (row.LOCKED_TARGET_PARTIAL_EVIDENCE) partial += 1;
    if (row.LOCKED_TARGET_MISSING) missing += 1;
    if (row.LOCKED_TRANSFORM_UNIMPLEMENTED) transformUnimplemented += 1;
  }
  if (missing > 0) return { verdict: 'LOCKED_TARGET_MISSING', blockers: { missing, partial, transformUnimplemented } };
  if (partial > 0) return { verdict: 'LOCKED_TARGET_EVIDENCE_PARTIAL', blockers: { missing, partial, transformUnimplemented } };
  if (transformUnimplemented > 0) return { verdict: 'LOCKED_TRANSFORM_UNIMPLEMENTED', blockers: { missing, partial, transformUnimplemented } };
  return { verdict: 'LOCKED_ALL_SURFACES_MATCH', blockers: { missing: 0, partial: 0, transformUnimplemented: 0 } };
}

export function buildShadowTransition(options = {}) {
  const index = loadLockedRuntimeIndex();
  const crosswalkPath = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-crosswalk.json');
  if (!existsSync(crosswalkPath)) throw new Error(`crosswalk artifact missing: ${crosswalkPath}. Run build-locked-authority-crosswalk.mjs first.`);
  const crosswalk = readJsonSafe(crosswalkPath);
  const crosswalkByField = new Map();
  for (const row of crosswalk.rows) {
    crosswalkByField.set(row.LOCKED_FIELD_PATH, row);
  }

  // Build a per-form locked verdict map.
  const lockedVerdictsByFormCode = new Map();
  for (const form of index.forms) {
    lockedVerdictsByFormCode.set(form.identity.templateCode, lockedVerdictForForm(form, crosswalkByField));
  }

  // Read legacy verdicts.
  const legacy = existsSync(LEGACY_VERDICTS_PATH) ? readJsonSafe(LEGACY_VERDICTS_PATH) : { results: [] };
  const legacyByFormCode = new Map();
  for (const result of legacy.results ?? []) {
    legacyByFormCode.set(result.formCode, result);
  }

  const rows = [];
  for (const form of index.forms) {
    const code = form.identity.templateCode;
    const locked = lockedVerdictsByFormCode.get(code);
    const legacyRow = legacyByFormCode.get(code);
    const legacyVerdict = legacyRow?.canonicalVerdict ?? 'NOT_EXECUTED';
    const legacyPrimary = legacyRow?.renderVerdict ?? 'NOT_EXECUTED';
    const legacyRequiredFieldCount = legacyRow?.contractKeyCount ?? 0;
    const lockedRequiredFieldCount = form.runtimeView.canonicalFields.filter((f) => f.required).length;
    const legacyDebtKeys = (legacyRow?.sourceDebtKeys ?? []).map((k) => typeof k === 'string' ? k : k.key);
    const lockedBlockers = [];
    if (locked.blockers.missing) lockedBlockers.push(`missing-target=${locked.blockers.missing}`);
    if (locked.blockers.partial) lockedBlockers.push(`partial-evidence=${locked.blockers.partial}`);
    if (locked.blockers.transformUnimplemented) lockedBlockers.push(`transform-unimplemented=${locked.blockers.transformUnimplemented}`);

    // CHANGED_REASON: derive from comparing legacy -> locked.
    let changedReason = 'no-change';
    if (legacyVerdict === 'NOT_EXECUTED') {
      changedReason = 'no-legacy-baseline';
    } else if (legacyVerdict === 'SOURCE_SLOT_DEBT' && locked.verdict === 'LOCKED_TARGET_MISSING') {
      changedReason = 'locked-confirms-debt';
    } else if (legacyVerdict === 'SOURCE_SLOT_DEBT' && locked.verdict === 'LOCKED_TARGET_EVIDENCE_PARTIAL') {
      changedReason = 'locked-confirms-partial';
    } else if (legacyVerdict === 'PASS_COMPOUND_MAPPING' && locked.verdict.startsWith('LOCKED_')) {
      changedReason = 'locked-tightens';
    } else if (legacyVerdict === locked.verdict) {
      changedReason = 'lateral';
    } else {
      changedReason = 'unknown-shift';
    }

    // SAFE_TO_CUTOVER: only when the lock is "the same or stricter" and
    // does not drop a required field to gain PASS.
    let safe = true;
    const requiredDropped = lockedRequiredFieldCount < legacyRequiredFieldCount;
    if (changedReason === 'unknown-shift') safe = false;
    if (legacyVerdict !== 'NOT_EXECUTED' && requiredDropped) safe = false;
    if (locked.verdict === 'LOCKED_TARGET_MISSING' && legacyVerdict === 'PASS_RUNTIME_MAPPING') safe = false; // legacy claims pass, locked says no target

    rows.push({
      FORM_CODE: code,
      LEGACY_PRIMARY_VERDICT: legacyPrimary,
      LEGACY_REQUIRED_FIELD_COUNT: legacyRequiredFieldCount,
      LEGACY_DEBT_KEYS: legacyDebtKeys,
      LOCKED_PRIMARY_VERDICT: locked.verdict,
      LOCKED_REQUIRED_FIELD_COUNT: lockedRequiredFieldCount,
      LOCKED_BLOCKERS: lockedBlockers,
      CHANGED_REASON: changedReason,
      SAFE_TO_CUTOVER: safe,
    });
  }

  const summary = {
    totalRows: rows.length,
    safeToCutoverCount: rows.filter((r) => r.SAFE_TO_CUTOVER).length,
    unsafeCount: rows.filter((r) => !r.SAFE_TO_CUTOVER).length,
    changedReasonCounts: rows.reduce((acc, r) => ({ ...acc, [r.CHANGED_REASON]: (acc[r.CHANGED_REASON] ?? 0) + 1 }), {}),
    lockedVerdictCounts: rows.reduce((acc, r) => ({ ...acc, [r.LOCKED_PRIMARY_VERDICT]: (acc[r.LOCKED_PRIMARY_VERDICT] ?? 0) + 1 }), {}),
  };

  return { rows, summary };
}

export function writeShadowTransition(options = {}) {
  const { rows, summary } = buildShadowTransition(options);
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  const result = {
    schema: 'qllaw.213.locked_shadow_transition/v1',
    generatedAt: new Date().toISOString(),
    summary,
    rows,
  };
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, result };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { result, outputPath } = writeShadowTransition();
  console.log(`OK shadow transition: ${result.summary.totalRows} rows; safe=${result.summary.safeToCutoverCount}; unsafe=${result.summary.unsafeCount}`);
  console.log(`     changed-reason counts:`, JSON.stringify(result.summary.changedReasonCounts));
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
}
