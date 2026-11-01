// Slot evidence classifier — assigns one of 8 classifications to every one
// of the 2497 slots in the locked contract corpus. The classification is
// the basis for "is this slot ready to be rendered" and must NEVER be
// overridden by a slot that merely has a binding (per project rule:
// "Do not call a slot ready merely because a binding exists.").
//
// Classifications:
//   EXACT_STRUCTURAL_TARGET     location present AND blockId/tableCellId non-null
//   TOKEN_PATTERN_TARGET        no structural anchor, but rawPattern is a unique token
//   REVIEW_EVIDENCE_TARGET      only reviewEvidence present
//   LEGACY_PATTERN_TARGET       legacyRawPattern only (no current pattern)
//   RENDER_REPAIR_TARGET        added through render repair (slot has repair metadata)
//   TARGET_EVIDENCE_PARTIAL     more than one of the above but not unanimous
//   TARGET_EVIDENCE_MISSING     none of location / rawPattern / legacy / reviewEvidence
//   TARGET_EVIDENCE_CONFLICT    conflicting source contexts
//
// Required totals:
//   slotRows == 2497
//   unaccounted == 0

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedContractCorpus } from './lib/locked-contract-loader.mjs';
import { computeAllHashes } from './lib/locked-hash-model.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-slot-evidence-classification.json');

const CLASSIFICATIONS = new Set([
  'EXACT_STRUCTURAL_TARGET',
  'TOKEN_PATTERN_TARGET',
  'REVIEW_EVIDENCE_TARGET',
  'LEGACY_PATTERN_TARGET',
  'RENDER_REPAIR_TARGET',
  'TARGET_EVIDENCE_PARTIAL',
  'TARGET_EVIDENCE_MISSING',
  'TARGET_EVIDENCE_CONFLICT',
]);

function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function hasStructuralAnchor(slot) {
  const location = slot.location ?? {};
  return isNonEmpty(location.blockId) || isNonEmpty(location.tableCellId);
}

function classifySlot(slot) {
  const hasLocation = isNonEmpty(slot.location?.partName);
  const hasAnchor = hasStructuralAnchor(slot);
  const hasRawPattern = isNonEmpty(slot.evidence?.rawPattern) || isNonEmpty(slot.rawPattern);
  const hasLegacy = isNonEmpty(slot.legacyRawPattern);
  const hasReview = isNonEmpty(slot.reviewEvidence?.rawPattern) || isNonEmpty(slot.reviewEvidence?.context);
  const hasRepair = isNonEmpty(slot.repairMetadata) || isNonEmpty(slot.renderRepairEvidence);

  const evidence = { hasLocation, hasAnchor, hasRawPattern, hasLegacy, hasReview, hasRepair };
  const trueCount = Object.values(evidence).filter(Boolean).length;

  if (trueCount === 0) return { classification: 'TARGET_EVIDENCE_MISSING', evidence };
  if (hasLocation && hasAnchor) return { classification: 'EXACT_STRUCTURAL_TARGET', evidence };
  if (hasRepair) return { classification: 'RENDER_REPAIR_TARGET', evidence };
  if (hasRawPattern && !hasLocation) return { classification: 'TOKEN_PATTERN_TARGET', evidence };
  if (hasLegacy && !hasRawPattern) return { classification: 'LEGACY_PATTERN_TARGET', evidence };
  if (hasReview && !hasRawPattern && !hasLocation) return { classification: 'REVIEW_EVIDENCE_TARGET', evidence };
  if (trueCount > 1) return { classification: 'TARGET_EVIDENCE_PARTIAL', evidence };
  return { classification: 'TARGET_EVIDENCE_CONFLICT', evidence };
}

export function classifyLockedSlotEvidence(options = {}) {
  const corpus = loadLockedContractCorpus(options);
  const slotRows = [];
  let conflictEvidence = 0;

  for (const contract of corpus.contracts) {
    for (const slot of contract.docxSlots ?? []) {
      const { classification, evidence } = classifySlot(slot);
      const partName = slot.location?.partName ?? null;
      const blockId = slot.location?.blockId ?? null;
      const tableCellId = slot.location?.tableCellId ?? null;

      // TARGET_EVIDENCE_CONFLICT additionally requires actually conflicting source contexts.
      let blockingReason = null;
      if (classification === 'TARGET_EVIDENCE_CONFLICT') {
        const sourceContexts = (contract.sourceContexts ?? []).filter((ctx) => ctx?.slotId === slot.slotId);
        if (sourceContexts.length < 2) {
          blockingReason = 'classification set without source context conflict';
        } else {
          conflictEvidence += 1;
        }
      }
      if (classification === 'TARGET_EVIDENCE_MISSING') {
        blockingReason = 'no location, no rawPattern, no legacyRawPattern, no reviewEvidence';
      }
      if (classification === 'TARGET_EVIDENCE_PARTIAL') {
        blockingReason = 'multiple weak evidence sources, none strong';
      }

      slotRows.push({
        FORM_CODE: contract.templateCode,
        SLOT_ID: slot.slotId,
        PART_NAME: partName,
        BLOCK_ID: blockId,
        TABLE_CELL_ID: tableCellId,
        CONTEXT: slot.context ?? null,
        RAW_PATTERN: slot.evidence?.rawPattern ?? slot.rawPattern ?? null,
        LEGACY_RAW_PATTERN: slot.legacyRawPattern ?? null,
        TEXT_BEFORE: slot.evidence?.textBefore ?? null,
        TEXT_AFTER: slot.evidence?.textAfter ?? null,
        REVIEW_CONTEXT: slot.reviewEvidence?.context ?? null,
        DOCX_ANCHOR: blockId ?? tableCellId ?? null,
        EVIDENCE_CLASSIFICATION: classification,
        CURRENT_NORMALIZED_TARGET_FOUND: null,
        CURRENT_TARGET_OCCURRENCES: null,
        CURRENT_TARGET_IDENTITY: null,
        TARGET_HASH: null,
        BLOCKING_REASON: blockingReason,
      });
    }
  }

  // Aggregate counts
  const counts = Object.fromEntries([...CLASSIFICATIONS].map((c) => [c, 0]));
  for (const row of slotRows) counts[row.EVIDENCE_CLASSIFICATION] += 1;

  const hashes = computeAllHashes(
    options.contractsDir ?? path.join(REPO_ROOT, 'docs/audit/docx/contracts/locked'),
    corpus.contracts,
    null,
  );

  return {
    schema: 'qllaw.213.locked_slot_evidence_classification/v1',
    generatedAt: new Date().toISOString(),
    corpusByteSha256: hashes.corpusByteSha256,
    runtimeAuthoritySha256: hashes.runtimeAuthoritySha256,
    auditEvidenceSha256: hashes.auditEvidenceSha256,
    slotRowsCount: slotRows.length,
    unaccounted: corpus.totals.slots - slotRows.length,
    classificationCounts: counts,
    conflictEvidenceCount: conflictEvidence,
    slotRows,
  };
}

export function writeSlotEvidenceClassification(options = {}) {
  const result = classifyLockedSlotEvidence(options);
  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return { outputPath: OUTPUT_PATH, result };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { result, outputPath } = writeSlotEvidenceClassification();
  console.log(`OK slot evidence: ${result.slotRowsCount} rows; unaccounted=${result.unaccounted}; conflicts=${result.conflictEvidenceCount}`);
  console.log(`     counts:`, result.classificationCounts);
  console.log(`     artifact: ${path.relative(REPO_ROOT, outputPath)}`);
  if (result.slotRowsCount !== 2497) {
    console.error(`FAIL slotRows ${result.slotRowsCount} != 2497`);
    process.exit(1);
  }
  if (result.unaccounted !== 0) {
    console.error(`FAIL unaccounted ${result.unaccounted} != 0`);
    process.exit(1);
  }
}
