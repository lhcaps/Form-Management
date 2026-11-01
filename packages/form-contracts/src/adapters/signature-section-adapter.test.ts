/**
 * Unit tests for SIGNATURE_SECTION adapter.
 *
 * Covers all the required test fixtures from the prompt:
 *  - simple signer block
 *  - signer name below title
 *  - signer name inside table
 *  - agency plus signer
 *  - deputy/on-behalf variant
 *  - blank manual-signature block
 *  - electronic-signature mode
 *  - absent signer
 *  - wrong-role mutation
 *  - signer name mapped into static title mutation
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { SignatureSectionAdapter, type SignatureFormInputs } from './signature-section-adapter';
import type { FormRenderContext, SourceTargetIdentity, RenderValue } from '../source-slot-family-adapter';

function makeSourceTarget(slot: string): SourceTargetIdentity {
  return {
    docxPart: 'word/document.xml',
    path: `signature/${slot}`,
    occurrenceIndex: 0,
    structuralContext: 'paragraph',
    sourceTextPreview: `source preview for ${slot}`,
    sourceHash: 'deadbeef',
    renderStrategy: 'INLINE_REPLACE',
  };
}

function makeContext(inputs: Record<string, unknown>, sourceSlots: string[] = []): FormRenderContext {
  return {
    formCode: 'BM-TEST',
    formInputs: inputs,
    family: 'SIGNATURE_SECTION',
    sourceTargets: sourceSlots.map((s) => makeSourceTarget(s)),
  };
}

function getValue(rvs: readonly RenderValue[], key: string): RenderValue | undefined {
  return rvs.find((v) => v.key === key);
}

test('simple signer block: signer name + role caption both present', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Nguyễn Văn A',
      'signature.positionTitle': 'KIỂM SÁT VIÊN',
    },
    ['signerName', 'positionTitle'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const signer = getValue(rvs, 'signature.signerName');
  const title = getValue(rvs, 'signature.positionTitle');
  assert.equal(signer?.value, 'Nguyễn Văn A');
  assert.equal(signer?.classification, 'REQUIRED_SOURCE_SLOT');
  assert.equal(title?.value, 'KIỂM SÁT VIÊN');
  assert.equal(title?.classification, 'STATIC_SOURCE_TEXT');
});

test('signer name below title: distinct keys, no replacement', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Trần Thị B',
      'signature.positionTitle': 'PHÓ VIỆN TRƯỞNG',
    },
    ['signerName', 'positionTitle'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  assert.notEqual(getValue(rvs, 'signature.signerName')?.value, getValue(rvs, 'signature.positionTitle')?.value);
});

test('signer name inside table: same path semantics, table context', () => {
  const adapter = new SignatureSectionAdapter();
  const tgt = { ...makeSourceTarget('signerName'), structuralContext: 'table' as const };
  const ctx: FormRenderContext = {
    formCode: 'BM-TEST',
    formInputs: { 'signature.signerName': 'Lê Văn C' },
    family: 'SIGNATURE_SECTION',
    sourceTargets: [tgt],
  };
  const rvs = adapter.buildRenderValues(ctx);
  const signer = getValue(rvs, 'signature.signerName');
  assert.equal(signer?.value, 'Lê Văn C');
  assert.equal(signer?.sourceTargetIdentity.structuralContext, 'table');
});

test('agency plus signer: only signer name + position title mapped when no signMode input', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Phạm Văn D',
      'signature.positionTitle': 'VIỆN TRƯỞNG',
    },
    ['signerName', 'positionTitle'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const keys = rvs.map((v) => v.key).sort();
  // signMode is metadata and is only emitted when an allowed value is
  // explicitly provided.
  assert.deepEqual(keys, ['signature.positionTitle', 'signature.signerName']);
});

test('deputy/on-behalf variant: signMode = DEPUTY', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Hoàng Văn E',
      'signature.positionTitle': 'PHÓ VIỆN TRƯỞNG',
      'signature.signMode': 'DEPUTY',
    },
    ['signerName', 'positionTitle', 'signMode'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const mode = getValue(rvs, 'signature.signMode');
  assert.equal(mode?.value, 'DEPUTY');
  assert.equal(mode?.classification, 'DISPLAY_ONLY');
});

test('blank manual-signature block: signerName empty → GENUINE_SOURCE_ABSENT', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    { 'signature.positionTitle': 'KIỂM SÁT VIÊN' },
    ['signerName', 'positionTitle'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const signer = getValue(rvs, 'signature.signerName');
  assert.equal(signer?.value, '');
  assert.equal(signer?.classification, 'GENUINE_SOURCE_ABSENT');
});

test('electronic-signature mode: signMode = ELECTRONIC_SIGNED', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Vũ Văn F',
      'signature.positionTitle': 'KIỂM SÁT VIÊN',
      'signature.signMode': 'ELECTRONIC_SIGNED',
    },
    ['signerName', 'positionTitle', 'signMode'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const mode = getValue(rvs, 'signature.signMode');
  assert.equal(mode?.value, 'ELECTRONIC_SIGNED');
});

test('absent signer: signerName missing + positionTitle missing', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext({}, []);
  const rvs = adapter.buildRenderValues(ctx);
  const signer = getValue(rvs, 'signature.signerName');
  const title = getValue(rvs, 'signature.positionTitle');
  assert.equal(signer?.classification, 'GENUINE_SOURCE_ABSENT');
  assert.equal(title?.classification, 'STATIC_SOURCE_TEXT');
});

test('mutation: wrong role (signer name in positionTitle slot)', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Đặng Văn G',
      // Wrong: the position title slot has a name, not a role caption.
      'signature.positionTitle': 'Đặng Văn G',
    },
    ['signerName', 'positionTitle'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const title = getValue(rvs, 'signature.positionTitle');
  // The adapter must NOT collapse the two values into one. It treats the
  // input as a non-static role caption and emits REQUIRED_SOURCE_SLOT.
  assert.equal(title?.classification, 'REQUIRED_SOURCE_SLOT');
  assert.equal(title?.value, 'Đặng Văn G');
});

test('mutation: demo name "Giá trị R1" must never enter final output', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Giá trị R1',
      'signature.positionTitle': 'KIỂM SÁT VIÊN',
    },
    ['signerName', 'positionTitle'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const signer = getValue(rvs, 'signature.signerName');
  assert.equal(signer?.value, '');
  assert.equal(signer?.classification, 'GENUINE_SOURCE_ABSENT');
});

test('mutation: signMode value outside the allowed enum set is dropped', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Bùi Văn H',
      'signature.positionTitle': 'KIỂM SÁT VIÊN',
      'signature.signMode': 'INVALID_MODE',
    },
    ['signerName', 'positionTitle', 'signMode'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const mode = getValue(rvs, 'signature.signMode');
  assert.equal(mode, undefined);
});

test('validateMapping: PASS_COMPOUND when all three keys are source-grounded', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    {
      'signature.signerName': 'Ngô Văn I',
      // Non-static position title (a person-specific or case-specific role,
      // e.g. signed by multiple officials, or role is per-case) so the
      // adapter emits REQUIRED_SOURCE_SLOT for it.
      'signature.positionTitle': 'KSV soạn thảo - ca trực số 3',
      'signature.signMode': 'BLANK_MANUAL',
    },
    ['signerName', 'positionTitle', 'signMode'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const verdict = adapter.validateMapping({
    formCode: 'BM-TEST',
    contractFields: [
      { key: 'signature.signerName', required: true },
      { key: 'signature.positionTitle', required: true },
      { key: 'signature.signMode', required: false },
    ],
    sourceTargets: ctx.sourceTargets,
    renderValues: rvs,
  });
  assert.equal(verdict.kind, 'PASS_COMPOUND');
});

test('validateMapping: FAIL when required signer is GENUINE_SOURCE_ABSENT', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext({ 'signature.positionTitle': 'KIỂM SÁT VIÊN' }, ['positionTitle']);
  const rvs = adapter.buildRenderValues(ctx);
  const verdict = adapter.validateMapping({
    formCode: 'BM-TEST',
    contractFields: [
      { key: 'signature.signerName', required: true },
      { key: 'signature.positionTitle', required: true },
    ],
    sourceTargets: ctx.sourceTargets,
    renderValues: rvs,
  });
  assert.equal(verdict.kind, 'FAIL');
  if (verdict.kind === 'FAIL') {
    assert.ok(verdict.missingRequired.includes('signature.signerName'));
  }
});

test('adapter does not treat an input demo name as a real signer name', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext(
    { 'signature.signerName': 'Demo User' },
    ['signerName'],
  );
  const rvs = adapter.buildRenderValues(ctx);
  const signer = getValue(rvs, 'signature.signerName');
  assert.equal(signer?.value, '');
});

test('classifyContractFields reports GENUINE_SOURCE_ABSENT for missing source', () => {
  const adapter = new SignatureSectionAdapter();
  const ctx = makeContext({}, []);
  const cls = adapter.classifyContractFields(ctx);
  const signerCls = cls.find((c) => c.key === 'signature.signerName');
  assert.equal(signerCls?.classification, 'GENUINE_SOURCE_ABSENT');
  const titleCls = cls.find((c) => c.key === 'signature.positionTitle');
  assert.equal(titleCls?.classification, 'STATIC_SOURCE_TEXT');
});
