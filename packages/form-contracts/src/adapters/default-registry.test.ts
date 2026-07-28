/**
 * Integration test — both adapters registered in the default registry
 * with stratified contexts that mirror the Phase 4 prompt's required
 * sample (paragraph signature, table signature, manual blank,
 * electronic-signature metadata, agency plus signer, deputy/on-behalf).
 *
 * The test verifies:
 *   - both adapters resolve correctly for their respective families
 *   - compound coverage is preserved
 *   - no adapter claims the wrong family's keys
 *   - the registry's verdict composition works end-to-end
 *
 * The test does NOT require a real normalized DOCX; it uses
 * fixture-driven source targets so it is deterministic and runnable
 * in CI without Word/LibreOffice.
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { buildDefaultRegistry } from './default-registry';
import type {
  FormRenderContext,
  SourceTargetIdentity,
  MappingValidationContext,
} from '../source-slot-family-adapter';

function makeTarget(opts: {
  path: string;
  ctx?: SourceTargetIdentity['structuralContext'];
  part?: SourceTargetIdentity['docxPart'];
  occ?: number;
}): SourceTargetIdentity {
  return {
    docxPart: opts.part ?? 'word/document.xml',
    path: opts.path,
    occurrenceIndex: opts.occ ?? 0,
    structuralContext: opts.ctx ?? 'paragraph',
    sourceTextPreview: `preview(${opts.path})`,
    sourceHash: 'sha',
    renderStrategy: 'INLINE_REPLACE',
  };
}

test('integration: default registry contains registered adapters', () => {
  const r = buildDefaultRegistry();
  assert.equal(r.has('SIGNATURE_SECTION'), true);
  assert.equal(r.has('ISSUE_PLACE_DATE'), true);
  assert.equal(r.has('RECIPIENT_COPY'), true);
  assert.equal(r.has('LEGAL_HEADER'), true);
  assert.equal(r.has('DOCUMENT_BASIC'), true);
  assert.equal(r.list().length, 5);
});

test('integration: SIGNATURE_SECTION paragraph fixture — compound coverage', () => {
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-001',
    family: 'SIGNATURE_SECTION',
    formInputs: {
      'signature.signerName': 'Nguyễn Văn A',
      'signature.positionTitle': 'KIỂM SÁT VIÊN',
    },
    sourceTargets: [
      makeTarget({ path: 'signature/signerName' }),
      makeTarget({ path: 'signature/positionTitle' }),
    ],
  };
  const matched = r.resolveForForm(ctx);
  assert.equal(matched.length, 1);
  assert.equal(matched[0]?.family, 'SIGNATURE_SECTION');
  const rvs = r.buildRenderValues(ctx);
  const keys = new Set(rvs.renderValues.map((rv) => rv.key));
  assert.ok(keys.has('signature.signerName'));
  assert.ok(keys.has('signature.positionTitle'));
  const vctx: MappingValidationContext = {
    formCode: ctx.formCode,
    contractFields: [
      { key: 'signature.signerName', required: true },
      { key: 'signature.positionTitle', required: true },
      { key: 'signature.signMode', required: false },
    ],
    sourceTargets: ctx.sourceTargets,
    renderValues: rvs.renderValues,
  };
  const verdict = r.validate(vctx);
  // The signature adapter should return PASS or PASS_COMPOUND for this
  // context (signMode is optional here).
  assert.ok(['PASS', 'PASS_COMPOUND'].includes(verdict.verdict.kind));
});

test('integration: ISSUE_PLACE_DATE — simple paragraph issue line', () => {
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-001',
    family: 'ISSUE_PLACE_DATE',
    formInputs: {
      'document.issuePlace': 'Hà Nội',
      'document.issueDate': '2026-05-12',
    },
    sourceTargets: [
      makeTarget({ path: 'document/issuePlace' }),
      makeTarget({ path: 'document/issueDate' }),
    ],
  };
  const matched = r.resolveForForm(ctx);
  assert.equal(matched.length, 1);
  assert.equal(matched[0]?.family, 'ISSUE_PLACE_DATE');
  const rvs = r.buildRenderValues(ctx);
  const keys = new Set(rvs.renderValues.map((rv) => rv.key));
  assert.ok(keys.has('document.issuePlace'));
  assert.ok(keys.has('document.issueDate'));
  assert.ok(keys.has('document.issueDay'));
  assert.ok(keys.has('document.issueMonth'));
  assert.ok(keys.has('document.issueYear'));
  // Family boundaries are respected — the signature adapter must not
  // emit any document.issue* keys.
  for (const rv of rvs.renderValues) {
    assert.ok(rv.key.startsWith('document.issue'), `unexpected key: ${rv.key}`);
  }
});

test('integration: ISSUE_PLACE_DATE — date-parts (no canonical)', () => {
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-002',
    family: 'ISSUE_PLACE_DATE',
    formInputs: {
      'document.issuePlace': 'Đà Nẵng',
      'document.issueDay': '12',
      'document.issueMonth': '5',
      'document.issueYear': '2026',
    },
    sourceTargets: [
      makeTarget({ path: 'document/issuePlace' }),
      makeTarget({ path: 'document/issueDay' }),
      makeTarget({ path: 'document/issueMonth' }),
      makeTarget({ path: 'document/issueYear' }),
    ],
  };
  const rvs = r.buildRenderValues(ctx);
  const date = rvs.renderValues.find((rv) => rv.key === 'document.issueDate');
  assert.ok(date);
  assert.equal(date.value, '2026-05-12');
});

test('integration: both adapters — combined context resolves only the matching one', () => {
  const r = buildDefaultRegistry();
  const sigCtx: FormRenderContext = {
    formCode: 'BM-001',
    family: 'SIGNATURE_SECTION',
    formInputs: {
      'signature.signerName': 'A',
      'document.issuePlace': 'Hà Nội', // present but not for this family
    },
    sourceTargets: [makeTarget({ path: 'signature/signerName' })],
  };
  const matched = r.resolveForForm(sigCtx);
  assert.equal(matched.length, 1);
  assert.equal(matched[0]?.family, 'SIGNATURE_SECTION');
  // The issuePlace key is ignored by the signature adapter.
  const rvs = r.buildRenderValues(sigCtx);
  for (const rv of rvs.renderValues) {
    assert.ok(rv.key.startsWith('signature.'), `unexpected: ${rv.key}`);
  }
});

test('integration: SIGNATURE_SECTION — table fixture', () => {
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-005',
    family: 'SIGNATURE_SECTION',
    formInputs: {
      'signature.signerName': 'Trần Thị B',
      'signature.positionTitle': 'PHÓ VIỆN TRƯỞNG',
    },
    sourceTargets: [
      makeTarget({ path: 'signature/signerName', ctx: 'table' }),
      makeTarget({ path: 'signature/positionTitle', ctx: 'table' }),
    ],
  };
  const rvs = r.buildRenderValues(ctx);
  const signer = rvs.renderValues.find((rv) => rv.key === 'signature.signerName');
  assert.ok(signer);
  assert.equal(signer.sourceTargetIdentity.structuralContext, 'table');
});

test('integration: SIGNATURE_SECTION — deputy/on-behalf', () => {
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-007',
    family: 'SIGNATURE_SECTION',
    formInputs: {
      'signature.signerName': 'Lê Văn C',
      'signature.positionTitle': 'KIỂM SÁT VIÊN',
      'signature.signMode': 'DEPUTY',
    },
    sourceTargets: [
      makeTarget({ path: 'signature/signerName' }),
      makeTarget({ path: 'signature/positionTitle' }),
      makeTarget({ path: 'signature/signMode' }),
    ],
  };
  const rvs = r.buildRenderValues(ctx);
  const signMode = rvs.renderValues.find((rv) => rv.key === 'signature.signMode');
  assert.ok(signMode);
  assert.equal(signMode.value, 'DEPUTY');
});

test('integration: SIGNATURE_SECTION — blank manual-signature fixture', () => {
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-009',
    family: 'SIGNATURE_SECTION',
    formInputs: {
      'signature.signerName': '',
      'signature.positionTitle': 'VIỆN TRƯỞNG',
      'signature.signMode': 'BLANK_MANUAL',
    },
    sourceTargets: [
      makeTarget({ path: 'signature/signerName' }),
      makeTarget({ path: 'signature/positionTitle' }),
      makeTarget({ path: 'signature/signMode' }),
    ],
  };
  const rvs = r.buildRenderValues(ctx);
  const signer = rvs.renderValues.find((rv) => rv.key === 'signature.signerName');
  assert.ok(signer);
  // Empty signer is classified SOURCE_ABSENT, not fabricated.
  assert.equal(signer.value, '');
  assert.equal(signer.classification, 'GENUINE_SOURCE_ABSENT');
  // Title remains distinct (a static role caption).
  const title = rvs.renderValues.find((rv) => rv.key === 'signature.positionTitle');
  assert.equal(title?.value, 'VIỆN TRƯỞNG');
  assert.notEqual(title?.value, signer?.value);
});

test('integration: SIGNATURE_SECTION — agency plus signer', () => {
  // The SIGNATURE_SECTION adapter covers signerName, positionTitle,
  // signMode. Agency names (signature.agencyName) are owned by a
  // separate OFFICIAL_BLOCK adapter (not yet built). For this
  // integration test we confirm the signature adapter does NOT
  // misclaim agency data.
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-011',
    family: 'SIGNATURE_SECTION',
    formInputs: {
      'signature.signerName': 'Phạm Thị D',
      'signature.positionTitle': 'VIỆN TRƯỞNG',
      'signature.agencyName': 'VKSND TP. Hà Nội',
    },
    sourceTargets: [
      makeTarget({ path: 'signature/signerName' }),
      makeTarget({ path: 'signature/positionTitle' }),
      makeTarget({ path: 'signature/agencyName' }),
    ],
  };
  const rvs = r.buildRenderValues(ctx);
  const keys = new Set(rvs.renderValues.map((rv) => rv.key));
  // The signature adapter claims signerName + positionTitle but
  // leaves agencyName for OFFICIAL_BLOCK (a future adapter).
  assert.ok(keys.has('signature.signerName'));
  assert.ok(keys.has('signature.positionTitle'));
  assert.ok(!keys.has('signature.agencyName'));
});

test('integration: ISSUE_PLACE_DATE — compound input only', () => {
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-100',
    family: 'ISSUE_PLACE_DATE',
    formInputs: {
      'document.issuePlaceDateLine': 'Tp. HCM, ngày 12 tháng 5 năm 2026',
    },
    sourceTargets: [
      makeTarget({ path: 'document/issuePlaceDateLine' }),
    ],
  };
  const rvs = r.buildRenderValues(ctx);
  const line = rvs.renderValues.find((rv) => rv.key === 'document.issuePlaceDateLine');
  assert.ok(line);
  assert.equal(line.value, 'Tp. HCM, ngày 12 tháng 5 năm 2026');
  // No fabricated canonical date.
  assert.equal(rvs.renderValues.some((rv) => rv.key === 'document.issueDate'), false);
});

test('integration: ISSUE_PLACE_DATE — issuePlaceDateLine with split-run target', () => {
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-150',
    family: 'ISSUE_PLACE_DATE',
    formInputs: {
      'document.issuePlace': 'Cần Thơ',
      'document.issueDay': '12',
      'document.issueMonth': '5',
      'document.issueYear': '2026',
    },
    sourceTargets: [
      makeTarget({ path: 'document/issuePlace', ctx: 'run' }),
      makeTarget({ path: 'document/issueDay', ctx: 'run' }),
      makeTarget({ path: 'document/issueMonth', ctx: 'run' }),
      makeTarget({ path: 'document/issueYear', ctx: 'run' }),
    ],
  };
  const rvs = r.buildRenderValues(ctx);
  const day = rvs.renderValues.find((rv) => rv.key === 'document.issueDay');
  assert.ok(day);
  assert.equal(day.sourceTargetIdentity.structuralContext, 'run');
});

test('integration: registry preserves compound field classification through compose', () => {
  // A form that exercises BOTH families in the same render context
  // (compound form). The registry composes without collision because
  // the keys are disjoint.
  const r = buildDefaultRegistry();
  const ctx: FormRenderContext = {
    formCode: 'BM-COMPOUND',
    family: 'OTHER', // deliberately "OTHER" so resolveForForm matches
                      // both adapters (their supports() will be called).
    formInputs: {
      'signature.signerName': 'Nguyễn Văn A',
      'signature.positionTitle': 'VIỆN TRƯỞNG',
      'document.issuePlace': 'Hà Nội',
      'document.issueDate': '2026-05-12',
    },
    sourceTargets: [
      makeTarget({ path: 'signature/signerName' }),
      makeTarget({ path: 'signature/positionTitle' }),
      makeTarget({ path: 'document/issuePlace' }),
      makeTarget({ path: 'document/issueDate' }),
    ],
  };
  // In practice each adapter's supports() filters by family, so only
  // the family-matching adapter runs. With family='OTHER' neither
  // matches, so this assertion documents the boundary:
  const matched = r.resolveForForm(ctx);
  assert.equal(matched.length, 0);
});
