/**
 * Unit tests for AdapterRegistry.
 *
 * Covers the Phase 2 requirements:
 *   - deterministic adapter ordering
 *   - explicit precedence (first registered wins)
 *   - collision detection at registration
 *   - duplicate target detection at discover-time
 *   - compound-field composition (multiple adapters, same context)
 *   - no adapter silently claims unsupported fields
 *   - verdict composition (FAIL > PASS_COMPOUND > PASS)
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  AdapterRegistry,
  type AdapterResolution,
} from './adapter-registry';
import {
  SignatureSectionAdapter,
} from './signature-section-adapter';
import type {
  SourceSlotFamilyAdapter,
  FormRenderContext,
  SourceTargetIdentity,
  RenderValue,
  FieldClassification,
  MappingValidationContext,
  MappingVerdict,
  SourceSlotFamily,
} from '../source-slot-family-adapter';

function makeSourceTarget(opts: {
  part?: SourceTargetIdentity['docxPart'];
  path: string;
  occ?: number;
  preview?: string;
}): SourceTargetIdentity {
  return {
    docxPart: opts.part ?? 'word/document.xml',
    path: opts.path,
    occurrenceIndex: opts.occ ?? 0,
    structuralContext: 'paragraph',
    sourceTextPreview: opts.preview ?? '',
    sourceHash: 'deadbeef',
    renderStrategy: 'INLINE_REPLACE',
  };
}

/** Stub adapter for testing (no shared dependencies on real signatures). */
class StubAdapter implements SourceSlotFamilyAdapter {
  readonly family: SourceSlotFamily;
  readonly id: string;
  supportsReturn = true;
  targets: SourceTargetIdentity[] = [];
  fields: { key: string; classification: FieldClassification }[] = [];
  renderValues: RenderValue[] = [];
  verdict: MappingVerdict = { kind: 'PASS', reason: 'STUB_PASS' };
  constructor(family: SourceSlotFamily, id: string) {
    this.family = family;
    this.id = id;
  }
  supports(_context: FormRenderContext): boolean {
    return this.supportsReturn;
  }
  discoverSourceTargets(_context: FormRenderContext): readonly SourceTargetIdentity[] {
    return this.targets;
  }
  classifyContractFields(_context: FormRenderContext) {
    return this.fields;
  }
  buildRenderValues(_context: FormRenderContext): readonly RenderValue[] {
    return this.renderValues;
  }
  validateMapping(_context: MappingValidationContext): MappingVerdict {
    return this.verdict;
  }
}

test('registry: registers adapter, lists it', () => {
  const r = new AdapterRegistry();
  const sig = new SignatureSectionAdapter();
  r.register(sig);
  assert.equal(r.has('SIGNATURE_SECTION'), true);
  assert.equal(r.list().length, 1);
});

test('registry: rejects duplicate family registration (collision detection)', () => {
  const r = new AdapterRegistry();
  r.register(new SignatureSectionAdapter());
  assert.throws(
    () => r.register(new SignatureSectionAdapter()),
    /already registered/,
  );
});

test('registry: deterministic ordering by registration', () => {
  const r = new AdapterRegistry();
  const a1 = new StubAdapter('ISSUE_PLACE_DATE', 'A1');
  const a2 = new StubAdapter('RECIPIENT_COPY', 'A2');
  r.register(a1);
  r.register(a2);
  assert.deepEqual(
    r.list().map((a) => a.family),
    ['ISSUE_PLACE_DATE', 'RECIPIENT_COPY'],
  );
});

test('registry: resolveForForm returns only supporting adapters', () => {
  const r = new AdapterRegistry();
  const issue = new StubAdapter('ISSUE_PLACE_DATE', 'I');
  const recip = new StubAdapter('RECIPIENT_COPY', 'R');
  recip.supportsReturn = false;
  r.register(issue);
  r.register(recip);
  const ctx: FormRenderContext = {
    formCode: 'BM-001',
    formInputs: {},
    sourceTargets: [],
    family: 'ISSUE_PLACE_DATE',
  };
  const matched = r.resolveForForm(ctx);
  assert.equal(matched.length, 1);
  assert.equal(matched[0]?.family, 'ISSUE_PLACE_DATE');
});

test('registry: discoverTargets detects duplicate targets', () => {
  const r = new AdapterRegistry();
  const stub = new StubAdapter('ISSUE_PLACE_DATE', 'DUP');
  stub.targets = [
    makeSourceTarget({ path: 'document/issueDate', occ: 0 }),
    makeSourceTarget({ path: 'document/issueDate', occ: 0 }),
  ];
  r.register(stub);
  const result = r.discoverTargets({
    formCode: 'BM-001',
    formInputs: {},
    sourceTargets: [],
    family: 'ISSUE_PLACE_DATE',
  });
  assert.equal(result.targets.length, 1);
  assert.equal(result.duplicates.length, 1);
  const dupFinding = result.duplicates[0];
  assert.ok(dupFinding !== undefined);
  assert.match(dupFinding, /duplicate target/);
});

test('registry: classifyFields detects field collisions', () => {
  const r = new AdapterRegistry();
  const a = new StubAdapter('SIGNATURE_SECTION', 'A');
  a.fields = [{ key: 'signature.signerName', classification: 'REQUIRED_SOURCE_SLOT' }];
  const b = new StubAdapter('OTHER', 'B');
  b.fields = [{ key: 'signature.signerName', classification: 'STATIC_SOURCE_TEXT' }];
  r.register(a);
  r.register(b);
  const out = r.classifyFields({
    formCode: 'BM-001',
    formInputs: {},
    sourceTargets: [],
    family: 'SIGNATURE_SECTION',
  });
  assert.equal(out.classifications.length, 1);
  assert.equal(out.collisionFindings.length, 1);
  const finding = out.collisionFindings[0];
  assert.ok(finding !== undefined);
  assert.match(finding, /claimed by both/);
});

test('registry: buildRenderValues surfaces duplicate-key collisions', () => {
  const r = new AdapterRegistry();
  const a = new StubAdapter('SIGNATURE_SECTION', 'A');
  const b = new StubAdapter('OTHER', 'B');
  const makeRV = (key: string, family: string): RenderValue => ({
    key,
    value: 'X',
    sourceTargetIdentity: makeSourceTarget({ path: 'foo' }),
    classification: 'REQUIRED_SOURCE_SLOT',
    confidence: 1,
  });
  a.renderValues = [makeRV('signature.signerName', 'A')];
  b.renderValues = [makeRV('signature.signerName', 'B')];
  r.register(a);
  r.register(b);
  const out = r.buildRenderValues({
    formCode: 'BM-001',
    formInputs: {},
    sourceTargets: [],
    family: 'SIGNATURE_SECTION',
  });
  assert.equal(out.renderValues.length, 1);
  assert.equal(out.collisionFindings.length, 1);
});

test('registry: validate composes FAIL > PASS_COMPOUND > PASS', () => {
  const r = new AdapterRegistry();
  const a = new StubAdapter('SIGNATURE_SECTION', 'A');
  a.verdict = { kind: 'PASS_COMPOUND', reason: 'A_PASS_COMPOUND', compoundCoverage: ['signature.signerName'] };
  const b = new StubAdapter('OTHER', 'B');
  b.verdict = { kind: 'FAIL', reason: 'B_FAIL', missingRequired: ['signature.positionTitle'], staleR1Sources: [] };
  r.register(a);
  r.register(b);
  const resolution: AdapterResolution = r.validate({
    formCode: 'BM-001',
    contractFields: [{ key: 'signature.signerName', required: true }],
    sourceTargets: [],
    renderValues: [],
  });
  assert.equal(resolution.verdict.kind, 'FAIL');
});

test('registry: signature adapter is supported by default registration', () => {
  const r = new AdapterRegistry();
  const sig = new SignatureSectionAdapter();
  r.register(sig);
  const ctx: FormRenderContext = {
    formCode: 'BM-002',
    formInputs: { 'signature.signerName': 'Nguyễn Văn A' },
    sourceTargets: [
      makeSourceTarget({ path: 'signature/signerName', preview: 'source' }),
      makeSourceTarget({ path: 'signature/positionTitle', preview: 'VKS' }),
    ],
    family: 'SIGNATURE_SECTION',
  };
  const resolved = r.resolveForForm(ctx);
  assert.equal(resolved.length, 1);
  const adapter = resolved[0];
  assert.ok(adapter !== undefined);
  const rvs = adapter.buildRenderValues(ctx);
  assert.ok(rvs.find((v) => v.key === 'signature.signerName'));
  assert.ok(rvs.find((v) => v.key === 'signature.positionTitle'));
});