// Mutation tests for scripts/runtime-rollout/lib/locked-hash-model.mjs.
// Verifies the seven invariants the activation requires:
//   1. changing a location changes runtimeAuthoritySha256
//   2. changing rawPattern changes runtimeAuthoritySha256
//   3. changing field requiredness changes runtimeAuthoritySha256
//   4. changing a volatile reviewedAt does NOT change runtimeAuthoritySha256
//   5. changing rationale changes auditEvidenceSha256 (and not runtimeAuthoritySha256)
//   6. changing raw locked bytes changes corpusByteSha256
//   7. same input -> same hash (determinism)

import { deepEqual } from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { test } from 'node:test';

import {
  auditEvidencePayload,
  computeAuditEvidenceSha256,
  computeCorpusByteSha256,
  computeIndexCanonicalPayloadSha256,
  computeRuntimeAuthoritySha256,
  runtimeAuthorityPayload,
  sha256Hex,
  stableStringify,
} from './locked-hash-model.mjs';

function clampFixture() {
  return {
    schemaVersion: '1.0',
    status: 'locked',
    templateCode: 'BM-001',
    sourceId: 'BM-001__test',
    reviewedAt: '2026-01-01T00:00:00.000Z',
    reviewedBy: 'Tester',
    reviewKind: 'manual',
    dispositions: ['approve'],
    rationales: ['looks fine'],
    sourceContexts: [{ kind: 'docx', path: 'x.docx' }],
    extractionSource: {
      kind: 'normalized-docx',
      path: 'storage/templates/normalized-docx/BM-001/BM-001_normalized.docx',
      sha256: 'a'.repeat(64),
      format: 'docx',
    },
    canonicalFields: [
      {
        path: 'person.fullName',
        type: 'string',
        label: 'Họ tên',
        source: 'manual',
        required: true,
        uiComponent: 'input',
        section: 'person',
        options: null,
        transform: 'identity',
      },
    ],
    docxSlots: [
      {
        slotId: 'person.fullName',
        slotType: 'text',
        required: true,
        location: { partName: 'word/document.xml', blockId: 'P0001', tableCellId: null },
        context: '{{person.fullName}}',
        evidence: { textBefore: '', textAfter: '', rawPattern: '{{person.fullName}}' },
        reviewRequired: false,
      },
    ],
    renderBindings: [
      {
        slotId: 'person.fullName',
        from: 'person.fullName',
        fieldPath: 'person.fullName',
        transform: 'identity',
        fallback: '',
        targetEvidence: null,
      },
    ],
  };
}

test('determinism: same input -> same hash', () => {
  const fixture = clampFixture();
  const a = computeRuntimeAuthoritySha256([fixture]);
  const b = computeRuntimeAuthoritySha256([fixture]);
  deepEqual(a, b);
});

test('runtimeAuthority hash changes when slot location changes', () => {
  const baseline = clampFixture();
  const mutated = clampFixture();
  mutated.docxSlots[0].location.blockId = 'P9999';
  const before = computeRuntimeAuthoritySha256([baseline]);
  const after = computeRuntimeAuthoritySha256([mutated]);
  deepEqual(before !== after, true, 'runtimeAuthoritySha256 must change when location.blockId changes');
});

test('runtimeAuthority hash changes when rawPattern changes', () => {
  const baseline = clampFixture();
  const mutated = clampFixture();
  mutated.docxSlots[0].evidence.rawPattern = '{{person.fullName}}_DIFFERENT';
  const before = computeRuntimeAuthoritySha256([baseline]);
  const after = computeRuntimeAuthoritySha256([mutated]);
  deepEqual(before !== after, true, 'runtimeAuthoritySha256 must change when rawPattern changes');
});

test('runtimeAuthority hash changes when field requiredness changes', () => {
  const baseline = clampFixture();
  const mutated = clampFixture();
  mutated.canonicalFields[0].required = false;
  const before = computeRuntimeAuthoritySha256([baseline]);
  const after = computeRuntimeAuthoritySha256([mutated]);
  deepEqual(before !== after, true, 'runtimeAuthoritySha256 must change when field.required changes');
});

test('runtimeAuthority hash IGNORE volatile reviewedAt timestamp', () => {
  const baseline = clampFixture();
  const mutated = clampFixture();
  mutated.reviewedAt = '2030-12-31T23:59:59.000Z';
  const before = computeRuntimeAuthoritySha256([baseline]);
  const after = computeRuntimeAuthoritySha256([mutated]);
  deepEqual(before, after, 'runtimeAuthoritySha256 must NOT change when only reviewedAt changes');
});

test('auditEvidence hash changes when rationale changes', () => {
  const baseline = clampFixture();
  const mutated = clampFixture();
  mutated.rationales = ['different rationale entirely'];
  const before = computeAuditEvidenceSha256([baseline]);
  const after = computeAuditEvidenceSha256([mutated]);
  deepEqual(before !== after, true, 'auditEvidenceSha256 must change when rationale changes');
});

test('runtimeAuthority hash ignores rationale change (rationale is audit-only)', () => {
  const baseline = clampFixture();
  const mutated = clampFixture();
  mutated.rationales = ['different rationale entirely'];
  const before = computeRuntimeAuthoritySha256([baseline]);
  const after = computeRuntimeAuthoritySha256([mutated]);
  deepEqual(before, after, 'runtimeAuthoritySha256 must NOT change when only rationale changes');
});

test('corpusByte hash detects byte-level changes', () => {
  // Simulate by reading two synthetic directories we write into a temp area.
  // Filenames must match the *.contract.locked.json filter used in production.
  const tmpDir = mkdtempSync(`${tmpdir()}/qllaw-hash-`);
  try {
    const contract = { templateCode: 'BM-001', status: 'locked', schemaVersion: '1.0', sourceId: 'x', canonicalFields: [], docxSlots: [], renderBindings: [] };
    writeFileSync(`${tmpDir}/BM-001__test.contract.locked.json`, JSON.stringify(contract));
    const before = computeCorpusByteSha256(tmpDir);
    contract.templateCode = 'BM-001-tampered';
    writeFileSync(`${tmpDir}/BM-001__test.contract.locked.json`, JSON.stringify(contract));
    const after = computeCorpusByteSha256(tmpDir);
    deepEqual(before !== after, true, 'corpusByteSha256 must change when a contract byte changes');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('indexCanonicalPayload hash is deterministic and order-stable', () => {
  const fixture = {
    z: 1,
    a: 2,
    nested: { y: 1, x: 2 },
    list: [{ b: 1, a: 2 }, { d: 4, c: 3 }],
  };
  const hash1 = computeIndexCanonicalPayloadSha256(fixture);
  const hash2 = computeIndexCanonicalPayloadSha256({ ...fixture, nested: { x: 2, y: 1 } });
  deepEqual(hash1, hash2, 'order of keys must not affect hash');
});

test('runtimeAuthority payload stably excludes volatile timestamps', () => {
  const contract = clampFixture();
  const payload = runtimeAuthorityPayload(contract);
  const serialized = stableStringify(payload);
  deepEqual(serialized.includes('reviewedAt'), false);
  deepEqual(serialized.includes('extractedAt'), false);
});

test('auditEvidence payload includes rationales but excludes volatile At-style fields', () => {
  const contract = clampFixture();
  contract.repairMetadata = { wasRepaired: true, repairedAt: '2026-01-01T00:00:00.000Z' };
  const payload = auditEvidencePayload(contract);
  const serialized = stableStringify(payload);
  deepEqual(serialized.includes('repairedAt'), false, 'audit payload must strip *At timestamps');
  deepEqual(serialized.includes('rationales'), true);
});

test('sha256Hex is stable for identical inputs', () => {
  const a = sha256Hex('hello');
  const b = sha256Hex('hello');
  const c = sha256Hex('hello!');
  deepEqual(a, b);
  deepEqual(a !== c, true);
});
