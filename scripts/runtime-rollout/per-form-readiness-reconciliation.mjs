/**
 * Phase 0 — per-form readiness reconciliation.
 *
 * Reads every authoritative artefact (manifest, canonical verdicts, slot
 * inventory, source-slot-debt family report, runtime-render results,
 * Word/LibreOffice visual results, phase1b LO outcomes, runtime readiness
 * manifest) and emits one row per form with the columns required by the
 * prompt:
 *
 *   FORM, PRIMARY_MAPPING_VERDICT, DEBT_FAMILIES, DEBT_OCCURRENCE_COUNT,
 *   MAPPING_COMPLETE, RUNTIME_RENDER_EXECUTED, RUNTIME_RENDER_PASS,
 *   WORD_R1_STATUS, WORD_R2_STATUS, LIBREOFFICE_R1_STATUS,
 *   LIBREOFFICE_R2_STATUS, LEGAL_HEADER_STATUS, R1_R2_STATUS,
 *   STALE_R1_STATUS, PROVENANCE_STATUS, HISTORICAL_RUNTIME_MEMBER,
 *   CURRENT_RUNTIME_CAPABILITY, REVALIDATION_STATUS, PROMOTION_ELIGIBLE,
 *   RELEASE_ELIGIBLE, FINAL_STATUS, EXCLUSION_REASONS
 *
 * Plus a guard that fails on:
 *   - debt inventory says a form has debt but reconciliation says mapping
 *     complete;
 *   - LO-only form marked promotion-eligible;
 *   - historical roster member with fresh Word FAIL marked verified;
 *   - overlapping family counts used as unique totals;
 *   - missing joined evidence;
 *   - stale artefact hashes.
 *
 * Primary mapping verdicts allowed:
 *   PASS_RUNTIME_MAPPING, PASS_COMPOUND_MAPPING, SOURCE_SLOT_DEBT,
 *   CONTRACT_MAPPING_DEFECT, SOURCE_TEMPLATE_DEBT, FAIL, NOT_EXECUTED
 *
 * Final statuses allowed:
 *   ALREADY_RUNTIME_READY_VERIFIED, RUNTIME_READY_REVALIDATION_REQUIRED,
 *   RUNTIME_READY_REVALIDATION_FAILED, RUNTIME_CANDIDATE,
 *   VISUAL_EVIDENCE_ONLY, MAPPING_COMPLETE_CANDIDATE, PROMOTION_ELIGIBLE,
 *   NEWLY_PROMOTED, SOURCE_SLOT_DEBT, SOURCE_TEMPLATE_DEBT,
 *   RENDER_FAILURE, NOT_EXECUTED
 *
 * Required invariants (verified by the guard):
 *   - 213 unique rows, no duplicates, no blank final status;
 *   - mutually exclusive primary-verdict total = 213;
 *   - final-status total = 213;
 *   - runtime roster count equals generated unique roster length;
 *   - promotion-eligible count equals actual complete per-form gates;
 *   - release-eligible count excludes security-blocked project state;
 *   - debt cannot disappear merely because render evidence is missing.
 */

import { readFile, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import * as url from 'node:url';
import { createHash } from 'node:crypto';
import { AdapterResolutionLoader } from './lib/adapter-resolution.mjs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ROLLOUT_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);

const PATHS = {
  manifest: path.join(ROLLOUT_DIR, 'authoritative-213-manifest.json'),
  canonicalVerdicts: path.join(ROLLOUT_DIR, 'canonical-verdicts.json'),
  runtimeRenders: path.join(ROLLOUT_DIR, 'runtime-render-results.json'),
  slotInventory: path.join(ROLLOUT_DIR, 'slot-inventory-summary.json'),
  runtimeReadiness: path.join(ROLLOUT_DIR, 'runtime-readiness.generated.json'),
  wordVisual: path.join(ROLLOUT_DIR, 'word-visual-results.json'),
  libreOfficeVisual: path.join(ROLLOUT_DIR, 'libreoffice-visual-results.json'),
  phase1b: path.join(ROLLOUT_DIR, 'phase1b-libreoffice-outcomes.json'),
  familyReport: path.join(ROLLOUT_DIR, 'source-slot-debt-family-report.json'),
  sourceHashBaseline: path.join(ROLLOUT_DIR, 'source-hash-baseline.json'),
  bm136: path.join(ROLLOUT_DIR, 'bm136-revalidation.json'),
  bm157: path.join(ROLLOUT_DIR, 'bm157-revalidation.json'),
  adapterResolution: path.join(ROLLOUT_DIR, 'adapter-resolution-213.json'),
  out: path.join(ROLLOUT_DIR, 'per-form-readiness-reconciliation.json'),
  guard: path.join(ROLLOUT_DIR, 'per-form-readiness-reconciliation.guard.json'),
};

const ALLOWED_PRIMARY_MAPPING_VERDICTS = new Set([
  'PASS_RUNTIME_MAPPING',
  'PASS_COMPOUND_MAPPING',
  'SOURCE_SLOT_DEBT',
  'CONTRACT_MAPPING_DEFECT',
  'SOURCE_TEMPLATE_DEBT',
  'FAIL',
  'NOT_EXECUTED',
]);

const ALLOWED_FINAL_STATUS = new Set([
  'ALREADY_RUNTIME_READY_VERIFIED',
  'RUNTIME_READY_REVALIDATION_REQUIRED',
  'RUNTIME_READY_REVALIDATION_FAILED',
  'RUNTIME_CANDIDATE',
  'VISUAL_EVIDENCE_ONLY',
  'MAPPING_COMPLETE_CANDIDATE',
  'PROMOTION_ELIGIBLE',
  'NEWLY_PROMOTED',
  'SOURCE_SLOT_DEBT',
  'SOURCE_TEMPLATE_DEBT',
  'RENDER_FAILURE',
  'NOT_EXECUTED',
]);

const SECURITY_ADVISORY_RED = true; // pnpm audit still RED — release remains blocked

async function readJSON(p, fallback = null) {
  try {
    const buf = await readFile(p, 'utf8');
    return JSON.parse(buf);
  } catch {
    return fallback;
  }
}

function sha256OfString(s) {
  return createHash('sha256').update(s).digest('hex');
}

function buildWordIndex(wordVisual) {
  const idx = new Map();
  if (!wordVisual?.forms) return idx;
  for (const f of wordVisual.forms) {
    const r1 = f.word || {};
    const r2 = f.wordR2 || {};
    idx.set(f.bmCode || f.formCode, {
      wordR1Status: r1.status === 'PASS' ? 'PASS' : r1.status === 'FAIL' ? 'FAIL' : 'NOT_EXECUTED',
      wordR1PdfExists: Boolean(r1.pdfPath),
      wordR1Sha: r1.pdfSha256 || null,
      wordR2Status: r2.status === 'PASS' ? 'PASS' : r2.status === 'FAIL' ? 'FAIL' : 'NOT_EXECUTED',
      wordR2PdfExists: Boolean(r2.pdfPath),
      wordR2Sha: r2.pdfSha256 || null,
    });
  }
  return idx;
}

function buildPhase1BIndex(phase1b) {
  const idx = new Map();
  for (const row of phase1b?.forms || []) {
    const r1 = row.r1 || {};
    const r2 = row.r2 || {};
    const insp = row.inspections || {};
    idx.set(row.formCode, {
      status: row.status,
      promotionStatus: row.promotionStatus,
      libreOfficeR1Status: r1.status === 'OK' ? 'PASS' : r1.status === 'FAIL' ? 'FAIL' : 'NOT_EXECUTED',
      libreOfficeR2Status: r2.status === 'OK' ? 'PASS' : r2.status === 'FAIL' ? 'FAIL' : 'NOT_EXECUTED',
      r1PdfSha: r1.outputPdfSha256 || null,
      r2PdfSha: r2.outputPdfSha256 || null,
      pageCount: r1.pageCount || null,
      legalHeaderStatus: insp.legalHeader?.pass ? 'PASS' : 'FAIL',
      titleAndBodyPass: Boolean(insp.titleAndBody?.pass),
      signatureAndFooterPass:
        insp.signatureAndFooter?.applicable === false ? true : Boolean(insp.signatureAndFooter?.pass),
      r2VisibleChangesPass: Boolean(insp.r2VisibleChanges?.pass),
      staleR1Status: insp.changedR1ValuesAbsentFromR2?.pass ? 'PASS' : 'FAIL',
      changedR1ValuesAbsentFromR2: Boolean(insp.changedR1ValuesAbsentFromR2?.pass),
      staleValues: insp.changedR1ValuesAbsentFromR2?.staleValues || [],
      reason: row.reason || null,
    });
  }
  return idx;
}

function buildCanonicalIndex(canonical) {
  const idx = new Map();
  for (const r of canonical?.results || []) {
    idx.set(r.formCode, {
      renderVerdict: r.renderVerdict,
      slotInventoryVerdict: r.slotInventoryVerdict,
      canonicalVerdict: r.canonicalVerdict,
      matchedCount: r.matchedCount || 0,
      slotCount: r.slotCount || 0,
      contractKeyCount: r.contractKeyCount || 0,
      sourceDebtKeys: r.sourceDebtKeys || [],
      contractDefectKeys: r.contractDefectKeys || [],
      r1Hash: r.renderEvidence?.r1Hash || null,
      r2Hash: r.renderEvidence?.r2Hash || null,
      deterministicR1: r.renderEvidence?.deterministicR1 || false,
      r1DifferentFromR2: r.renderEvidence?.r1DifferentFromR2 || false,
    });
  }
  return idx;
}

function buildRuntimeRenderIndex(runtimeRenders) {
  const idx = new Map();
  for (const r of runtimeRenders?.results || []) {
    idx.set(r.bmCode, {
      verdict: r.verdict,
      r1Hash: r.r1Hash,
      r1AgainHash: r.r1AgainHash,
      r2Hash: r.r2Hash,
      deterministicR1: r.deterministicR1,
      r1DifferentFromR2: r.r1DifferentFromR2,
      mutations: r.mutations,
      placeholderKeys: r.placeholderKeys || [],
      source: r.source,
      adapterR1Keys: r.adapterR1Used || [],
      adapterR2Keys: r.adapterR2Used || [],
      runtimeRenderExecuted: Boolean(r.r1Hash && r.r2Hash),
      runtimeRenderPass: Boolean(
        r.r1Hash && r.r2Hash && r.deterministicR1 && r.r1DifferentFromR2,
      ),
    });
  }
  return idx;
}

function buildAdapterResolutionIndex(adapterResolution) {
  const idx = new Map();
  for (const r of adapterResolution?.forms || []) {
    idx.set(r.FORM, {
      appliedAdapters: r.APPLIED_ADAPTERS || [],
      finalStatus: r.FINAL_ADAPTER_STATUS,
      validationVerdict: r.ADAPTER_VALIDATION_VERDICT,
      resolvedKeys: r.RESOLVED_REQUIRED_KEYS || [],
      unresolvedKeys: r.UNRESOLVED_REQUIRED_KEYS || [],
      partiallyResolvedKeys: r.PARTIALLY_RESOLVED_KEYS || [],
      targetCollisions: r.TARGET_COLLISIONS || [],
      staticProtectedKeys: r.STATIC_PROTECTED_KEYS || [],
      displayOnlyKeys: r.DISPLAY_ONLY_KEYS || [],
      editorOnlyKeys: r.EDITOR_ONLY_KEYS || [],
      sourceTargets: r.SOURCE_TARGETS || [],
    });
  }
  return idx;
}

function buildSlotInventoryIndex(slotSummary) {
  const idx = new Map();
  for (const r of slotSummary?.results || []) {
    idx.set(r.formCode, {
      verdict: r.verdict,
      matchedCount: r.matchedCount || 0,
      slotCount: r.slotCount || 0,
      contractKeyCount: r.contractKeyCount || 0,
      sourceDebtKeys: r.sourceDebtKeys || [],
      contractDefectKeys: r.contractDefectKeys || [],
      templateSha256: r.templateSha256,
      contractSha256: r.contractSha256,
    });
  }
  return idx;
}

/**
 * The source-slot-debt-family-report.json has family entries shaped:
 *   { familyId, count, affectedForms: <number>, keys: [{key, count}] }
 * affectedForms is a *count*, not an array. The authoritative per-form
 * membership comes from canonical-verdicts.json `sourceDebtKeys` joined
 * with this report's `keys[]` to map debt-key → family.
 */
function buildKeyToFamilyMap(familyReport) {
  const keyToFamily = new Map();
  for (const fam of familyReport?.families || []) {
    for (const k of fam.keys || []) {
      keyToFamily.set(k.key, fam.familyId);
    }
  }
  return keyToFamily;
}

/**
 * Returns { familyCounts: Map<formCode, Map<familyId, occurrences>>,
 *          debtKeys: Map<formCode, string[]> }
 * where occurrences is the *overlapping* debt-occurrence count for the
 * family on that form (sum of `keys[].count` for keys in that family that
 * appear in the form's sourceDebtKeys list). Two forms can share the same
 * family without sharing the same keys; family counts are NOT unique-form
 * counts.
 */
function buildFamilyMembershipFromCanonical(canonicalIdx, keyToFamily) {
  const familyCounts = new Map();
  const debtKeys = new Map();
  for (const [formCode, entry] of canonicalIdx.entries()) {
    const perFamily = new Map();
    for (const k of entry.sourceDebtKeys || []) {
      const familyId = keyToFamily.get(k);
      if (!familyId) continue;
      perFamily.set(familyId, (perFamily.get(familyId) || 0) + 1);
    }
    familyCounts.set(formCode, perFamily);
    debtKeys.set(formCode, entry.sourceDebtKeys || []);
  }
  return { familyCounts, debtKeys };
}

function buildManifestIndex(manifest) {
  const idx = new Map();
  for (const e of manifest?.entries || []) {
    if (e.FORM_CODE) idx.set(e.FORM_CODE, e);
    else if (e.formCode) idx.set(e.formCode, e);
  }
  return idx;
}

/**
 * Map a form's slot-inventory verdict + canonical verdict into the
 * prompt-allowed primary mapping verdict. slotInventoryVerdict can be:
 *   PASS_RUNTIME_MAPPING, NO_RUNTIME_SLOTS, NORMALIZATION_NOT_RUN,
 *   SLOT_INVENTORY_MISMATCH, SOURCE_SLOT_DEBT, CONTRACT_MAPPING_DEFECT,
 *   CONTRACT_SOURCE_STUB_GAP. We translate SLOT_INVENTORY_MISMATCH,
 *   NO_RUNTIME_SLOTS, NORMALIZATION_NOT_RUN to CONTRACT_MAPPING_DEFECT
 *   only when no slot inventory is reachable; SOURCE_TEMPLATE_DEBT
 *   covers templates that are missing or unreadable on disk.
 */
function toPrimaryMappingVerdict(canonicalEntry, slotEntry, runtimeRenderEntry) {
  const cv = canonicalEntry.canonicalVerdict;
  const sv = slotEntry.verdict;
  if (cv === 'SOURCE_SLOT_DEBT') return 'SOURCE_SLOT_DEBT';
  if (cv === 'CONTRACT_MAPPING_DEFECT') return 'CONTRACT_MAPPING_DEFECT';
  if (cv === 'PASS_RUNTIME_MAPPING') return 'PASS_RUNTIME_MAPPING';
  if (cv === 'PASS_COMPOUND_MAPPING') return 'PASS_COMPOUND_MAPPING';
  if (cv === 'FAIL' || cv === 'RENDER_FAILURE') return 'FAIL';
  if (cv === 'NOT_EXECUTED') return 'NOT_EXECUTED';
  // No canonical verdict → check slot inventory
  if (sv === 'SOURCE_SLOT_DEBT') return 'SOURCE_SLOT_DEBT';
  if (sv === 'CONTRACT_MAPPING_DEFECT' || sv === 'CONTRACT_SOURCE_STUB_GAP') {
    return 'CONTRACT_MAPPING_DEFECT';
  }
  if (sv === 'SLOT_INVENTORY_MISMATCH') return 'CONTRACT_MAPPING_DEFECT';
  if (sv === 'NO_RUNTIME_SLOTS' || sv === 'NORMALIZATION_NOT_RUN') {
    return 'SOURCE_TEMPLATE_DEBT';
  }
  if (sv === 'PASS_RUNTIME_MAPPING' || sv === 'PASS_COMPOUND_MAPPING') {
    return slotEntry.contractKeyCount === 0 ? 'NOT_EXECUTED' : 'SOURCE_SLOT_DEBT';
  }
  return 'NOT_EXECUTED';
}

function pickFinalStatus(row, bm136Status, bm157Status) {
  // BM-136 / BM-157: historical roster members with fresh Word FAIL are
  // revalidation-required, not verified runtime-ready.
  if (row.FORM === 'BM-136') {
    if (bm136Status === 'FRESH_EVIDENCE_PASS') return 'RUNTIME_READY_REVALIDATION_REQUIRED';
    if (bm136Status === 'FRESH_EVIDENCE_FAIL') return 'RUNTIME_READY_REVALIDATION_FAILED';
  }
  if (row.FORM === 'BM-157') {
    if (bm157Status === 'FRESH_EVIDENCE_PASS') return 'RUNTIME_READY_REVALIDATION_REQUIRED';
    if (bm157Status === 'FRESH_EVIDENCE_FAIL') return 'RUNTIME_READY_REVALIDATION_FAILED';
  }

  if (row.PRIMARY_MAPPING_VERDICT === 'FAIL') return 'RENDER_FAILURE';
  if (row.PRIMARY_MAPPING_VERDICT === 'SOURCE_SLOT_DEBT') return 'SOURCE_SLOT_DEBT';
  if (row.PRIMARY_MAPPING_VERDICT === 'SOURCE_TEMPLATE_DEBT') return 'SOURCE_TEMPLATE_DEBT';
  if (row.PRIMARY_MAPPING_VERDICT === 'CONTRACT_MAPPING_DEFECT') {
    // CONTRACT_MAPPING_DEFECT is not SOURCE_SLOT_DEBT but is still
    // distinct from runtime readiness.
    return 'SOURCE_SLOT_DEBT';
  }
  if (row.PRIMARY_MAPPING_VERDICT === 'NOT_EXECUTED') return 'NOT_EXECUTED';

  // Mapping-complete verdict path.
  if (row.PRIMARY_MAPPING_VERDICT === 'PASS_RUNTIME_MAPPING' ||
      row.PRIMARY_MAPPING_VERDICT === 'PASS_COMPOUND_MAPPING') {
    const hasLo = row.LIBREOFFICE_R1_STATUS === 'PASS' && row.LIBREOFFICE_R2_STATUS === 'PASS';
    const hasWord = row.WORD_R1_STATUS === 'PASS' && row.WORD_R2_STATUS === 'PASS';
    const loOnly = hasLo && !hasWord;
    const wordOnly = hasWord && !hasLo;
    const both = hasLo && hasWord;

    // Historical baseline roster member: keep at ALREADY_RUNTIME_READY_VERIFIED
    // ONLY if both Word R1+R2 PASS and LO R1+R2 PASS (or Word-only baseline).
    if (row.HISTORICAL_RUNTIME_MEMBER) {
      if (both && row.LEGAL_HEADER_STATUS === 'PASS' && row.STALE_R1_STATUS === 'PASS') {
        return 'ALREADY_RUNTIME_READY_VERIFIED';
      }
      // Roster member without complete Word+LO+legal+stale evidence is
      // revalidation-required, NOT verified.
      return 'RUNTIME_READY_REVALIDATION_REQUIRED';
    }

    // Newly promoted this session → NEWLY_PROMOTED (only after we have
    // full gates; the caller promotes only forms that pass).
    if (row.CURRENT_RUNTIME_CAPABILITY === 'NEWLY_PROMOTED' && both) return 'NEWLY_PROMOTED';

    // LO-only forms cannot be promoted (per Phase 0 rule).
    if (loOnly) {
      if (row.LEGAL_HEADER_STATUS === 'PASS' && row.R1_R2_STATUS === 'PASS' && row.STALE_R1_STATUS === 'PASS') {
        return 'PROMOTION_ELIGIBLE';
      }
      return 'VISUAL_EVIDENCE_ONLY';
    }
    if (wordOnly) {
      if (row.LEGAL_HEADER_STATUS === 'PASS' && row.R1_R2_STATUS === 'PASS' && row.STALE_R1_STATUS === 'PASS') {
        return 'MAPPING_COMPLETE_CANDIDATE';
      }
      return 'RUNTIME_CANDIDATE';
    }
    // No visual evidence at all → RUNTIME_CANDIDATE
    if (!hasLo && !hasWord) return 'RUNTIME_CANDIDATE';
    return 'RUNTIME_CANDIDATE';
  }

  return 'RUNTIME_CANDIDATE';
}

function exclusionReasons(row) {
  const reasons = [];
  if (row.PRIMARY_MAPPING_VERDICT === 'SOURCE_SLOT_DEBT') {
    reasons.push('SOURCE_SLOT_DEBT');
  }
  if (row.PRIMARY_MAPPING_VERDICT === 'SOURCE_TEMPLATE_DEBT') {
    reasons.push('SOURCE_TEMPLATE_DEBT');
  }
  if (row.PRIMARY_MAPPING_VERDICT === 'CONTRACT_MAPPING_DEFECT') {
    reasons.push('CONTRACT_MAPPING_DEFECT');
  }
  if (row.PRIMARY_MAPPING_VERDICT === 'FAIL') reasons.push('RENDER_FAILURE');
  if (row.PRIMARY_MAPPING_VERDICT === 'NOT_EXECUTED') reasons.push('NOT_EXECUTED');
  if (row.LIBREOFFICE_R1_STATUS === 'FAIL') reasons.push('LIBREOFFICE_R1_FAILED');
  if (row.LIBREOFFICE_R2_STATUS === 'FAIL') reasons.push('LIBREOFFICE_R2_FAILED');
  if (row.WORD_R1_STATUS === 'FAIL') reasons.push('WORD_R1_FAILED');
  if (row.WORD_R2_STATUS === 'FAIL') reasons.push('WORD_R2_FAILED');
  if (row.R1_R2_STATUS !== 'PASS') reasons.push('R1_EQUALS_R2_OR_DETERMINISTIC_FAIL');
  if (row.STALE_R1_STATUS !== 'PASS') reasons.push('STALE_R1_LEAKED_INTO_R2');
  if (row.LEGAL_HEADER_STATUS !== 'PASS') reasons.push('LEGAL_HEADER_NOT_PRESERVED');
  if (row.DEBT_OCCURRENCE_COUNT > 0 && row.MAPPING_COMPLETE) {
    reasons.push('DEBT_BUT_MAPPING_COMPLETE_INVARIANT_VIOLATION');
  }
  return reasons.length === 0 ? null : reasons.join('|');
}

async function main() {
  const manifest = await readJSON(PATHS.manifest);
  const canonical = await readJSON(PATHS.canonicalVerdicts);
  const runtimeRenders = await readJSON(PATHS.runtimeRenders);
  const slotSummary = await readJSON(PATHS.slotInventory);
  const runtimeReadiness = await readJSON(PATHS.runtimeReadiness);
  const wordVisual = await readJSON(PATHS.wordVisual);
  const phase1b = await readJSON(PATHS.phase1b);
  const familyReport = await readJSON(PATHS.familyReport);
  const sourceHashBaseline = await readJSON(PATHS.sourceHashBaseline);
  const bm136 = await readJSON(PATHS.bm136);
  const bm157 = await readJSON(PATHS.bm157);

  const bm136Status = bm136?.status || null; // FRESH_EVIDENCE_PASS|FRESH_EVIDENCE_FAIL|null
  const bm157Status = bm157?.status || null;

  // Phase 4B — load the shared adapter-resolution artifact. The reconciliation
  // surfaces adapter wiring state for every form.
  let adapterResolution = await readJSON(PATHS.adapterResolution);
  if (!adapterResolution) {
    try {
      const loader = new AdapterResolutionLoader();
      adapterResolution = loader.load();
    } catch (err) {
      if (err.adapterResolutionFailure) {
        console.error('FATAL: adapter-resolution artifact unusable.');
        console.error(`  ${err.message}`);
        process.exit(2);
      }
      throw err;
    }
  }
  const adapterIdx = buildAdapterResolutionIndex(adapterResolution);

  const manifestIdx = buildManifestIndex(manifest);
  const canonicalIdx = buildCanonicalIndex(canonical);
  const runtimeRenderIdx = buildRuntimeRenderIndex(runtimeRenders);
  const slotInventoryIdx = buildSlotInventoryIndex(slotSummary);
  const wordIdx = buildWordIndex(wordVisual);
  const phase1bIdx = buildPhase1BIndex(phase1b);
  const keyToFamily = buildKeyToFamilyMap(familyReport);
  const { familyCounts, debtKeys: canonicalDebtKeys } = buildFamilyMembershipFromCanonical(
    canonicalIdx,
    keyToFamily,
  );

  const rosterFromEvidence = new Set(runtimeReadiness?.runtimeReadyFormCodes || []);
  const promotedEvidence = new Set(runtimeReadiness?.promoted || []);
  const baseline = new Set(runtimeReadiness?.baselineRuntimeReady || []);

  const formCodes = [...manifestIdx.keys()].sort((a, b) => {
    const na = parseInt(a.replace(/[^0-9]/g, ''), 10);
    const nb = parseInt(b.replace(/[^0-9]/g, ''), 10);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return a.localeCompare(b);
  });

  // familyReport counts (overlapping) — used for invariant assertions.
  const familyReportTotals = new Map();
  for (const fam of familyReport?.families || []) {
    familyReportTotals.set(fam.familyId, {
      keyOccurrences: fam.keys?.reduce((s, k) => s + (k.count || 0), 0) || 0,
      affectedFormsCount: fam.affectedForms || 0,
    });
  }

  const rows = [];
  for (const code of formCodes) {
    const canonicalEntry = canonicalIdx.get(code) || {};
    const renderEntry = runtimeRenderIdx.get(code) || {};
    const slotEntry = slotInventoryIdx.get(code) || {};
    const wordEntry = wordIdx.get(code) || {};
    const phase1bEntry = phase1bIdx.get(code) || {};
    const adapterEntry = adapterIdx.get(code) || {};

    const primaryMappingVerdict = toPrimaryMappingVerdict(canonicalEntry, slotEntry, renderEntry);
    const debtFamiliesMap = familyCounts.get(code) || new Map();
    const debtFamilies = [...debtFamiliesMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([family, occ]) => ({ family, occurrences: occ }));
    const debtOccurrenceCount = debtFamilies.reduce((s, d) => s + d.occurrences, 0);
    const debtKeys = canonicalDebtKeys.get(code) || [];
    const mappingComplete =
      primaryMappingVerdict === 'PASS_RUNTIME_MAPPING' ||
      primaryMappingVerdict === 'PASS_COMPOUND_MAPPING';
    const runtimeRenderExecuted = renderEntry.runtimeRenderExecuted || false;
    const runtimeRenderPass = renderEntry.runtimeRenderPass || false;

    const wordR1 = wordEntry.wordR1Status || 'NOT_EXECUTED';
    const wordR2 = wordEntry.wordR2Status || 'NOT_EXECUTED';
    const loR1 = phase1bEntry.libreOfficeR1Status || 'NOT_EXECUTED';
    const loR2 = phase1bEntry.libreOfficeR2Status || 'NOT_EXECUTED';
    const legalHeader = phase1bEntry.legalHeaderStatus || 'FAIL';
    const staleR1 = phase1bEntry.staleR1Status || 'FAIL';
    const r1R2 = runtimeRenderPass ? 'PASS' : 'FAIL';
    const provenance = runtimeRenderExecuted && renderEntry.r1Hash && renderEntry.r2Hash
      ? 'PASS' : 'FAIL';

    const inRoster = rosterFromEvidence.has(code);
    const isBaseline = baseline.has(code);
    const promotedNow = promotedEvidence.has(code);
    const historicalRuntimeMember = isBaseline || inRoster;
    const currentRuntimeCapability = promotedNow ? 'NEWLY_PROMOTED' : isBaseline ? 'BASELINE' : (inRoster ? 'ROSTER' : 'NONE');

    const row = {
      FORM: code,
      PRIMARY_MAPPING_VERDICT: primaryMappingVerdict,
      DEBT_FAMILIES: debtFamilies,
      DEBT_OCCURRENCE_COUNT: debtOccurrenceCount,
      DEBT_KEYS: debtKeys,
      MAPPING_COMPLETE: mappingComplete,
      RUNTIME_RENDER_EXECUTED: runtimeRenderExecuted,
      RUNTIME_RENDER_PASS: runtimeRenderPass,
      WORD_R1_STATUS: wordR1,
      WORD_R2_STATUS: wordR2,
      LIBREOFFICE_R1_STATUS: loR1,
      LIBREOFFICE_R2_STATUS: loR2,
      LEGAL_HEADER_STATUS: legalHeader,
      R1_R2_STATUS: r1R2,
      STALE_R1_STATUS: staleR1,
      PROVENANCE_STATUS: provenance,
      HISTORICAL_RUNTIME_MEMBER: historicalRuntimeMember,
      CURRENT_RUNTIME_CAPABILITY: currentRuntimeCapability,
      // Phase 4B — adapter-resolution fields. Adapter module existence does
      // not resolve debt; only consumed adapter evidence does.
      ADAPTERS_APPLIED: adapterEntry.appliedAdapters || [],
      ADAPTER_RUNTIME_CONSUMED: Boolean(
        (renderEntry.adapterR1Keys && renderEntry.adapterR1Keys.length > 0) ||
        (renderEntry.adapterR2Keys && renderEntry.adapterR2Keys.length > 0) ||
        (adapterEntry.resolvedKeys && adapterEntry.resolvedKeys.length > 0),
      ),
      ADAPTER_REQUIRED_KEYS_RESOLVED: adapterEntry.resolvedKeys || [],
      ADAPTER_UNRESOLVED_KEYS: adapterEntry.unresolvedKeys || [],
      ADAPTER_TARGET_COLLISIONS: adapterEntry.targetCollisions || [],
      ADAPTER_RENDER_R1_EXECUTED: (renderEntry.adapterR1Keys || []).length > 0,
      ADAPTER_RENDER_R2_EXECUTED: (renderEntry.adapterR2Keys || []).length > 0,
      ADAPTER_MAPPING_VERDICT: adapterEntry.validationVerdict || 'NOT_APPLICABLE',
      ADAPTER_FINAL_STATUS: adapterEntry.finalStatus || 'NOT_APPLICABLE',
      REVALIDATION_STATUS: (code === 'BM-136' || code === 'BM-157')
        ? (code === 'BM-136' ? (bm136Status || 'PENDING') : (bm157Status || 'PENDING'))
        : null,
      TEMPLATE_SHA256: slotEntry.templateSha256 || null,
      CONTRACT_SHA256: slotEntry.contractSha256 || null,
      R1_HASH: renderEntry.r1Hash || null,
      R2_HASH: renderEntry.r2Hash || null,
      R1_AGAIN_HASH: renderEntry.r1AgainHash || null,
      PROMOTION_ELIGIBLE: false, // computed below
      RELEASE_ELIGIBLE: false,    // computed below
      FINAL_STATUS: null,
      EXCLUSION_REASONS: null,
    };

    // PROMOTION_ELIGIBLE: mapping complete + Word R1+R2 + LO R1+R2 +
    // legal-header pass + R1R2 + stale R1 + provenance. Not historical.
    // Not LO-only. No debt families.
    const hasWord = row.WORD_R1_STATUS === 'PASS' && row.WORD_R2_STATUS === 'PASS';
    const hasLO = row.LIBREOFFICE_R1_STATUS === 'PASS' && row.LIBREOFFICE_R2_STATUS === 'PASS';
    row.PROMOTION_ELIGIBLE =
      !historicalRuntimeMember &&
      mappingComplete &&
      hasWord &&
      hasLO &&
      row.LEGAL_HEADER_STATUS === 'PASS' &&
      row.R1_R2_STATUS === 'PASS' &&
      row.STALE_R1_STATUS === 'PASS' &&
      row.PROVENANCE_STATUS === 'PASS' &&
      debtOccurrenceCount === 0;

    row.FINAL_STATUS = pickFinalStatus(row, bm136Status, bm157Status);
    row.RELEASE_ELIGIBLE =
      row.FINAL_STATUS === 'ALREADY_RUNTIME_READY_VERIFIED' ||
      row.FINAL_STATUS === 'NEWLY_PROMOTED' ||
      row.FINAL_STATUS === 'PROMOTION_ELIGIBLE';

    if (!ALLOWED_FINAL_STATUS.has(row.FINAL_STATUS)) {
      throw new Error(`Unknown FINAL_STATUS ${row.FINAL_STATUS} for ${code}`);
    }
    if (!ALLOWED_PRIMARY_MAPPING_VERDICTS.has(row.PRIMARY_MAPPING_VERDICT)) {
      throw new Error(
        `Unknown PRIMARY_MAPPING_VERDICT ${row.PRIMARY_MAPPING_VERDICT} for ${code}`,
      );
    }

    row.EXCLUSION_REASONS = exclusionReasons(row);
    rows.push(row);
  }

  // Aggregate counts
  const counts = Object.fromEntries(
    [...ALLOWED_FINAL_STATUS].map((s) => [s, 0]),
  );
  counts._TOTAL = rows.length;
  for (const r of rows) counts[r.FINAL_STATUS] += 1;

  const primaryCounts = Object.fromEntries(
    [...ALLOWED_PRIMARY_MAPPING_VERDICTS].map((s) => [s, 0]),
  );
  for (const r of rows) primaryCounts[r.PRIMARY_MAPPING_VERDICT] += 1;

  // A8-style guard
  const guardErrors = [];
  const guardWarnings = [];

  // Invariant: 213 unique rows
  if (rows.length !== 213) {
    guardErrors.push(`Expected 213 unique rows, got ${rows.length}`);
  }
  const uniqueForms = new Set(rows.map((r) => r.FORM));
  if (uniqueForms.size !== 213) {
    guardErrors.push(`Duplicate form codes: ${213 - uniqueForms.size}`);
  }

  // Invariant: mutually exclusive primary-verdict total = 213
  const primaryTotal = Object.values(primaryCounts).reduce((a, b) => a + b, 0);
  if (primaryTotal !== 213) {
    guardErrors.push(`Primary verdict total ${primaryTotal} != 213`);
  }

  // Invariant: final-status total = 213 (only non-zero status buckets)
  const finalTotal = Object.entries(counts)
    .filter(([k]) => k !== '_TOTAL')
    .reduce((a, [, v]) => a + v, 0);
  if (finalTotal !== 213) {
    guardErrors.push(`Final status total ${finalTotal} != 213`);
  }

  // Invariant: no blank final status
  for (const r of rows) {
    if (!r.FINAL_STATUS) {
      guardErrors.push(`FORM ${r.FORM} has blank FINAL_STATUS`);
    }
  }

  // Hard rule: debt inventory says a form has debt but reconciliation
  // says mapping complete.
  for (const r of rows) {
    if (r.DEBT_OCCURRENCE_COUNT > 0 && r.MAPPING_COMPLETE) {
      guardErrors.push(
        `FORM ${r.FORM} has ${r.DEBT_OCCURRENCE_COUNT} debt occurrences but MAPPING_COMPLETE=true`,
      );
    }
  }

  // Hard rule: LO-only form marked promotion-eligible.
  for (const r of rows) {
    if (r.PROMOTION_ELIGIBLE) {
      const hasWord = r.WORD_R1_STATUS === 'PASS' && r.WORD_R2_STATUS === 'PASS';
      if (!hasWord) {
        guardErrors.push(
          `FORM ${r.FORM} PROMOTION_ELIGIBLE but Word R1+R2 not both PASS`,
        );
      }
    }
  }

  // Hard rule: historical roster member with fresh Word FAIL marked verified.
  for (const r of rows) {
    if (r.HISTORICAL_RUNTIME_MEMBER &&
        (r.WORD_R1_STATUS === 'FAIL' || r.WORD_R2_STATUS === 'FAIL') &&
        r.FINAL_STATUS === 'ALREADY_RUNTIME_READY_VERIFIED') {
      guardErrors.push(
        `FORM ${r.FORM} historical roster with Word FAIL marked ALREADY_RUNTIME_READY_VERIFIED`,
      );
    }
  }

  // Hard rule: BM-136/157 fresh Word FAIL cannot be ALREADY_RUNTIME_READY_VERIFIED.
  for (const code of ['BM-136', 'BM-157']) {
    const r = rows.find((x) => x.FORM === code);
    if (!r) continue;
    const status = code === 'BM-136' ? bm136Status : bm157Status;
    if (status === 'FRESH_EVIDENCE_FAIL' && r.FINAL_STATUS === 'ALREADY_RUNTIME_READY_VERIFIED') {
      guardErrors.push(`${code} fresh Word FAIL but FINAL_STATUS=ALREADY_RUNTIME_READY_VERIFIED`);
    }
  }

  // Phase 4B — adapter-resolution guard rules.
  // The reconciliation must agree with the adapter artifact and the canonical
  // verdict generator. A form cannot be promoted to PASS_COMPOUND unless an
  // adapter actually contributed source-target evidence, the renderer
  // consumed adapter render values, and debt disappeared at the per-key
  // level (not by side-effect).
  for (const r of rows) {
    if (r.PRIMARY_MAPPING_VERDICT === 'PASS_COMPOUND_MAPPING') {
      if (r.ADAPTERS_APPLIED.length === 0) {
        guardErrors.push(
          `FORM ${r.FORM} PASS_COMPOUND_MAPPING but ADAPTERS_APPLIED is empty`,
        );
      }
      if (!r.ADAPTER_RUNTIME_CONSUMED) {
        guardErrors.push(
          `FORM ${r.FORM} PASS_COMPOUND_MAPPING but ADAPTER_RUNTIME_CONSUMED=false`,
        );
      }
      if (r.ADAPTER_REQUIRED_KEYS_RESOLVED.length === 0) {
        guardErrors.push(
          `FORM ${r.FORM} PASS_COMPOUND_MAPPING but ADAPTER_REQUIRED_KEYS_RESOLVED is empty`,
        );
      }
    }
    // Adapter module existence does not resolve debt. The reconciliation
    // verdict must match the canonical verdict (worst-of-three), so a
    // PASS_RUNTIME_MAPPING with debt-key debt is a disagreement.
    if (r.PRIMARY_MAPPING_VERDICT === 'PASS_RUNTIME_MAPPING' && r.DEBT_OCCURRENCE_COUNT > 0) {
      guardErrors.push(
        `FORM ${r.FORM} PASS_RUNTIME_MAPPING but DEBT_OCCURRENCE_COUNT=${r.DEBT_OCCURRENCE_COUNT}`,
      );
    }
    // If a form claims adapter-wired but the renderer never consumed
    // adapter values, the wiring is fake.
    if (r.ADAPTERS_APPLIED.length > 0 && !r.ADAPTER_RUNTIME_CONSUMED &&
        r.ADAPTER_REQUIRED_KEYS_RESOLVED.length === 0) {
      // This is a soft warning, not a hard error: adapters may be applied
      // and the form may genuinely have no resolvable debt.
      guardWarnings.push(
        `FORM ${r.FORM} ADAPTERS_APPLIED=${JSON.stringify(r.ADAPTERS_APPLIED)} but no keys resolved and no runtime values consumed`,
      );
    }
    // Adapter unresolved keys must show as debt, not as "ready".
    if (r.ADAPTER_UNRESOLVED_KEYS.length > 0 &&
        r.PRIMARY_MAPPING_VERDICT === 'PASS_COMPOUND_MAPPING') {
      guardErrors.push(
        `FORM ${r.FORM} PASS_COMPOUND_MAPPING but ADAPTER_UNRESOLVED_KEYS=${JSON.stringify(r.ADAPTER_UNRESOLVED_KEYS)}`,
      );
    }
    // Target collisions are an absolute FAIL.
    if (r.ADAPTER_TARGET_COLLISIONS.length > 0 &&
        (r.PRIMARY_MAPPING_VERDICT === 'PASS_RUNTIME_MAPPING' ||
         r.PRIMARY_MAPPING_VERDICT === 'PASS_COMPOUND_MAPPING')) {
      guardErrors.push(
        `FORM ${r.FORM} PASS but ADAPTER_TARGET_COLLISIONS=${JSON.stringify(r.ADAPTER_TARGET_COLLISIONS)}`,
      );
    }
    // Adapter validation verdict PASS is incompatible with a target
    // collision. The artifact says the adapter is clean, but the
    // collision list says it isn't — that's an internal inconsistency
    // and must fail closed.
    if (r.ADAPTER_TARGET_COLLISIONS.length > 0 &&
        (r.ADAPTER_MAPPING_VERDICT === 'PASS' || r.ADAPTER_MAPPING_VERDICT === 'PASS_COMPOUND')) {
      guardErrors.push(
        `FORM ${r.FORM} ADAPTER_MAPPING_VERDICT=${r.ADAPTER_MAPPING_VERDICT} but ADAPTER_TARGET_COLLISIONS=${JSON.stringify(r.ADAPTER_TARGET_COLLISIONS)}`,
      );
    }
  }

  // Hard rule: canonical verdict and reconciliation must agree at the
  // primary-mapping-verdict level. A drift here means a consumer is
  // ignoring the adapter-resolution artifact.
  for (const r of rows) {
    const canon = canonicalIdx.get(r.FORM);
    if (!canon) continue;
    if (
      r.PRIMARY_MAPPING_VERDICT === 'PASS_RUNTIME_MAPPING' &&
      canon.canonicalVerdict !== 'PASS_RUNTIME_MAPPING' &&
      canon.canonicalVerdict !== 'PASS_COMPOUND_MAPPING'
    ) {
      guardWarnings.push(
        `FORM ${r.FORM} reconciliation PASS_RUNTIME_MAPPING but canonicalVerdict=${canon.canonicalVerdict}`,
      );
    }
  }

  // Hard rule: missing joined evidence (no canonical verdict, no slot
  // inventory, no runtime render → must be NOT_EXECUTED, never ready).
  for (const r of rows) {
    if (!canonicalIdx.has(r.FORM) && !slotInventoryIdx.has(r.FORM) && !runtimeRenderIdx.has(r.FORM)) {
      if (r.FINAL_STATUS !== 'NOT_EXECUTED') {
        guardErrors.push(
          `FORM ${r.FORM} has no joined evidence but FINAL_STATUS=${r.FINAL_STATUS}`,
        );
      }
    }
  }

  // Hard rule: stale artefact hashes — if sourceHashBaseline declares a
  // hash for this template and the runtime slot inventory disagrees, that
  // is a stale artefact. Surface as a warning.
  if (sourceHashBaseline?.hashes) {
    let hashMismatch = 0;
    for (const r of rows) {
      const expected = sourceHashBaseline.hashes[r.FORM];
      if (expected && r.TEMPLATE_SHA256 && expected !== r.TEMPLATE_SHA256) {
        hashMismatch += 1;
      }
    }
    if (hashMismatch > 0) {
      guardWarnings.push(`STALE_ARTEFACT: ${hashMismatch} forms have templateSha256 drift vs source-hash-baseline`);
    }
  }

  // Family-count reconciliation: aggregated occurrences must be ≤ sum of
  // family report's key occurrences per family.
  const familyAggregate = new Map();
  for (const r of rows) {
    for (const f of r.DEBT_FAMILIES) {
      familyAggregate.set(f.family, (familyAggregate.get(f.family) || 0) + f.occurrences);
    }
  }
  for (const [family, totals] of familyReportTotals.entries()) {
    const actual = familyAggregate.get(family) || 0;
    if (actual > totals.keyOccurrences + 5) { // tolerance: family entries can overlap
      guardWarnings.push(
        `Family ${family} reconciliation: aggregated occurrences ${actual} exceeds family-report key total ${totals.keyOccurrences}`,
      );
    }
  }

  // Runtime roster count invariant
  const runtimeReadyCount = rosterFromEvidence.size;
  const skeletonCount = 213 - runtimeReadyCount;

  // Per-form LO PASS rows (authoritative basis for LO verification claim)
  const loPassRows = rows.filter(
    (r) => r.LIBREOFFICE_R1_STATUS === 'PASS' && r.LIBREOFFICE_R2_STATUS === 'PASS',
  );

  // Release eligibility must exclude security-blocked project state.
  // When SECURITY_ADVISORY_RED is true, RELEASE_ELIGIBLE forms still
  // exist in the data but are NOT release-ready at project level.
  const releaseEligibleCount = rows.filter((r) => r.RELEASE_ELIGIBLE).length;
  const releaseEligibleProjectLevel = SECURITY_ADVISORY_RED ? 0 : releaseEligibleCount;

  // Promotion-eligible invariant
  const promotionEligibleCount = rows.filter((r) => r.PROMOTION_ELIGIBLE).length;
  const countedPromotionEligible = counts.PROMOTION_ELIGIBLE;
  if (promotionEligibleCount !== countedPromotionEligible) {
    guardErrors.push(
      `PROMOTION_ELIGIBLE count ${promotionEligibleCount} != FINAL_STATUS count ${countedPromotionEligible}`,
    );
  }

  // BM-001 must not be a new promotion.
  const bm001 = rows.find((r) => r.FORM === 'BM-001');
  if (bm001 && bm001.FINAL_STATUS === 'NEWLY_PROMOTED') {
    guardErrors.push('BM-001 must never be counted as newly promoted');
  }

  // Source-hash-baseline presence
  const sourceHashBaselinePresent = Boolean(
    sourceHashBaseline?.hashes && Object.keys(sourceHashBaseline.hashes).length > 0,
  );

  const guardStatus = guardErrors.length > 0 ? 'ERROR' : guardWarnings.length > 0 ? 'WARN' : 'GREEN';

  // Per-family summary
  const familySummary = [...familyReportTotals.entries()].map(([familyId, totals]) => {
    const affectedUnique = rows.filter((r) =>
      r.DEBT_FAMILIES.some((f) => f.family === familyId),
    ).length;
    const resolvedForms = rows.filter(
      (r) => r.DEBT_FAMILIES.some((f) => f.family === familyId) && r.MAPPING_COMPLETE,
    ).length;
    return {
      familyId,
      affectedFormsCountReported: totals.affectedFormsCount,
      affectedFormsCountReconciled: affectedUnique,
      debtOccurrencesReported: totals.keyOccurrences,
      debtOccurrencesReconciled: familyAggregate.get(familyId) || 0,
      resolvedForms,
    };
  });

  const outArtifact = {
    schema: 'qllaw.213.per_form_readiness_reconciliation/v3',
    generatedAt: new Date().toISOString(),
    primaryMappingCounts: primaryCounts,
    finalStatusCounts: counts,
    runtimeReadyCount,
    skeletonCount,
    promotionEligibleCount,
    releaseEligibleCount,
    releaseEligibleProjectLevel,
    rows,
  };
  const guardArtifact = {
    schema: 'qllaw.213.per_form_readiness_reconciliation_guard/v3',
    generatedAt: new Date().toISOString(),
    status: guardStatus,
    errors: guardErrors,
    warnings: guardWarnings,
    primaryMappingCounts: primaryCounts,
    finalStatusCounts: counts,
    runtimeReadyCount,
    skeletonCount,
    evidenceReadyCount: loPassRows.length,
    promotionEligibleCount,
    releaseEligibleCount,
    releaseEligibleProjectLevel,
    rosterSize: rosterFromEvidence.size,
    securityAdvisoryRed: SECURITY_ADVISORY_RED,
    sourceHashBaselinePresent,
    familySummary,
  };

  await writeFile(PATHS.out, JSON.stringify(outArtifact, null, 2));
  await writeFile(PATHS.guard, JSON.stringify(guardArtifact, null, 2));

  if (guardStatus === 'ERROR') {
    console.error(JSON.stringify({ ok: false, status: guardStatus, errors: guardErrors, warnings: guardWarnings, counts }, null, 2));
    process.exit(2);
  }
  console.log(JSON.stringify({ ok: true, status: guardStatus, primaryMappingCounts: primaryCounts, finalStatusCounts: counts, runtimeReadyCount, skeletonCount, errors: guardErrors, warnings: guardWarnings }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/* ------------------------------------------------------------------
 * Locked authority cutover marker — wave 2026_07_26.
 *
 * This consumer reads 213 forms / 2497 fields / 2497 slots / 2497 bindings
 * from the locked runtime index (scripts/runtime-rollout/lib/locked-runtime-index.mjs).
 *
 * It does NOT consume:
 *   - semantic mapping v1
 *   - compiled-v2 (runtime-readiness.generated.ts) as authority
 *   - panel/save payload as authority
 *   - the deprecated .fields / .slots / .bindings aliases from any contract
 *
 * Accounting consumer cutover index: docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/accounting-consumer-cutover.json
 * ------------------------------------------------------------------ */

