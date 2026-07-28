import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyV2Row, validateCandidate } from './build-legal-semantic-mapping-v2.mjs';

test('treats absent contract metadata as an evidence gap without semantic confidence', () => {
  const row = classifyV2Row({ metadata: null, source: { SOURCE_DISCOVERY_STATUS: 'FOUND_IMMUTABLE_SOURCE' } });
  assert.equal(row.PRIMARY_CLASSIFICATION, 'CONTRACT_METADATA_GAP');
  assert.equal(row.CONFIDENCE, null);
  assert.equal(row.DECISION_STATUS, 'EVIDENCE_PIPELINE_GAP');
});

test('treats a missing authoritative source path as an evidence gap rather than template debt', () => {
  const row = classifyV2Row({ metadata: { RENDER_EXPECTATION: 'DIRECT_VISIBLE_VALUE' }, source: { SOURCE_DISCOVERY_STATUS: 'SOURCE_PATH_GAP' } });
  assert.equal(row.PRIMARY_CLASSIFICATION, 'SOURCE_DISCOVERY_GAP');
  assert.equal(row.DECISION_STATUS, 'EVIDENCE_PIPELINE_GAP');
});

test('rejects the v1 canary issue-place/date target inside a consideration region', () => {
  const result = validateCandidate({ valueType: 'DATE', renderExpectation: 'COMPOUND_COMPONENT' }, { targetKey: 'document.vietTat', structuralRegion: 'CONSIDERATION', roleHint: null });
  assert.equal(result.valid, false);
  assert.match(result.reasons.join(' '), /DATE_REGION_MISMATCH/);
});

test('rejects a case field targeting archive recipients', () => {
  const result = validateCandidate({ valueType: 'TEXT', renderExpectation: 'DIRECT_VISIBLE_VALUE', namespace: 'caseInfo' }, { targetKey: 'recipients.archiveLine', structuralRegion: 'RECIPIENT_BLOCK', roleHint: 'RECIPIENT' });
  assert.equal(result.valid, false);
  assert.match(result.reasons.join(' '), /NAMESPACE_REGION_MISMATCH/);
});
