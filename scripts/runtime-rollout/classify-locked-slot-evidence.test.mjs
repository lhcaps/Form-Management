import { deepEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';

import { classifyLockedSlotEvidence } from './classify-locked-slot-evidence.mjs';

test('classifies exactly 2497 slots and 0 unaccounted', () => {
  const result = classifyLockedSlotEvidence();
  deepEqual(result.slotRowsCount, 2497, 'slotRows must equal 2497');
  deepEqual(result.unaccounted, 0);
});

test('every slot row has the required fields', () => {
  const result = classifyLockedSlotEvidence();
  const required = ['FORM_CODE', 'SLOT_ID', 'PART_NAME', 'BLOCK_ID', 'TABLE_CELL_ID', 'CONTEXT', 'RAW_PATTERN', 'LEGACY_RAW_PATTERN', 'TEXT_BEFORE', 'TEXT_AFTER', 'REVIEW_CONTEXT', 'DOCX_ANCHOR', 'EVIDENCE_CLASSIFICATION', 'CURRENT_NORMALIZED_TARGET_FOUND', 'CURRENT_TARGET_OCCURRENCES', 'CURRENT_TARGET_IDENTITY', 'TARGET_HASH', 'BLOCKING_REASON'];
  for (const row of result.slotRows) {
    for (const field of required) {
      ok(field in row, `slot row missing ${field}`);
    }
    ok(typeof row.FORM_CODE === 'string' && row.FORM_CODE.startsWith('BM-'));
    ok(['EXACT_STRUCTURAL_TARGET', 'TOKEN_PATTERN_TARGET', 'REVIEW_EVIDENCE_TARGET', 'LEGACY_PATTERN_TARGET', 'RENDER_REPAIR_TARGET', 'TARGET_EVIDENCE_PARTIAL', 'TARGET_EVIDENCE_MISSING', 'TARGET_EVIDENCE_CONFLICT'].includes(row.EVIDENCE_CLASSIFICATION));
  }
});

test('classification counts sum to slotRowsCount', () => {
  const result = classifyLockedSlotEvidence();
  const total = Object.values(result.classificationCounts).reduce((acc, n) => acc + n, 0);
  deepEqual(total, result.slotRowsCount, 'classification counts must sum to slotRowsCount');
});

test('TARGET_EVIDENCE_MISSING slots have a blocking reason', () => {
  const result = classifyLockedSlotEvidence();
  for (const row of result.slotRows) {
    if (row.EVIDENCE_CLASSIFICATION === 'TARGET_EVIDENCE_MISSING' || row.EVIDENCE_CLASSIFICATION === 'TARGET_EVIDENCE_PARTIAL' || row.EVIDENCE_CLASSIFICATION === 'TARGET_EVIDENCE_CONFLICT') {
      ok(row.BLOCKING_REASON, `blocking reason must be present for ${row.EVIDENCE_CLASSIFICATION}`);
    }
  }
});

test('hashes are stable across calls (determinism)', () => {
  const a = classifyLockedSlotEvidence();
  const b = classifyLockedSlotEvidence();
  deepEqual(a.runtimeAuthoritySha256, b.runtimeAuthoritySha256);
  deepEqual(a.auditEvidenceSha256, b.auditEvidenceSha256);
  deepEqual(a.corpusByteSha256, b.corpusByteSha256);
});
