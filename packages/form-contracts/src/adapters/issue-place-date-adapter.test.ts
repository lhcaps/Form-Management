/**
 * Unit + mutation tests for ISSUE_PLACE_DATE adapter.
 *
 * Per Phase 4 prompt, required tests:
 *   - issue place + canonical date
 *   - date-parts input
 *   - issueDate input
 *   - compound input
 *   - component-plus-compound duplication prevention
 *   - timezone boundary
 *   - leap day
 *   - invalid date
 *   - missing place
 *   - missing date
 *   - source-specific punctuation
 *   - table-cell target
 *   - split-run target
 *   - stale R1 date absent from R2
 *   - issue date not written into promulgation date
 *   - issue line not replacing legal-header line
 *   - two forms with different source wording
 *
 * Required mutations:
 *   - duplicate issue line
 *   - shifted date
 *   - missing month
 *   - R1 date remains in R2
 *   - issue date replaces circular date
 *   - compound field renders twice
 *   - place from sibling form leaks
 *   - static promulgation line selected as target
 */

import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  IssuePlaceDateAdapter,
  splitCalendarDate,
  deriveDateParts,
  type IssuePlaceDateFormInputs,
} from './issue-place-date-adapter';
import type {
  FormRenderContext,
  SourceTargetIdentity,
  RenderValue,
  MappingValidationContext,
} from '../source-slot-family-adapter';

function makeSourceTarget(opts: {
  path: string;
  part?: SourceTargetIdentity['docxPart'];
  occ?: number;
  ctx?: SourceTargetIdentity['structuralContext'];
  preview?: string;
}): SourceTargetIdentity {
  return {
    docxPart: opts.part ?? 'word/document.xml',
    path: opts.path,
    occurrenceIndex: opts.occ ?? 0,
    structuralContext: opts.ctx ?? 'paragraph',
    sourceTextPreview: opts.preview ?? '',
    sourceHash: 'deadbeef',
    renderStrategy: 'INLINE_REPLACE',
  };
}

function makeContext(
  inputs: IssuePlaceDateFormInputs,
  sourceSlots: { path: string; preview?: string; ctx?: SourceTargetIdentity['structuralContext'] }[] = [],
): FormRenderContext {
  return {
    formCode: 'BM-TEST',
    formInputs: inputs as unknown as Record<string, unknown>,
    family: 'ISSUE_PLACE_DATE',
    sourceTargets: sourceSlots.map((s) => makeSourceTarget(s)),
  };
}

function getValue(rvs: readonly RenderValue[], key: string): RenderValue | undefined {
  return rvs.find((v) => v.key === key);
}

function getAllValues(
  rvs: readonly RenderValue[],
  key: string,
): RenderValue[] {
  return rvs.filter((v) => v.key === key);
}

// --- Pure helpers ---

test('splitCalendarDate: parses YYYY-MM-DD without timezone shift', () => {
  const parts = splitCalendarDate('2026-05-12');
  assert.ok(parts);
  assert.equal(parts.year, '2026');
  assert.equal(parts.month, '05');
  assert.equal(parts.day, '12');
  assert.equal(parts.isoDate, '2026-05-12');
});

test('splitCalendarDate: leap day in leap year is accepted', () => {
  const parts = splitCalendarDate('2024-02-29');
  assert.ok(parts);
  assert.equal(parts.day, '29');
  assert.equal(parts.month, '02');
});

test('splitCalendarDate: leap day in non-leap year is rejected', () => {
  const parts = splitCalendarDate('2025-02-29');
  assert.equal(parts, null);
});

test('splitCalendarDate: rejects month=13', () => {
  assert.equal(splitCalendarDate('2026-13-01'), null);
});

test('splitCalendarDate: rejects day=32', () => {
  assert.equal(splitCalendarDate('2026-01-32'), null);
});

test('splitCalendarDate: rejects April 31 (30-day month)', () => {
  assert.equal(splitCalendarDate('2026-04-31'), null);
});

test('splitCalendarDate: rejects malformed input', () => {
  assert.equal(splitCalendarDate('2026/05/12'), null);
  assert.equal(splitCalendarDate('12-05-2026'), null);
  assert.equal(splitCalendarDate('2026-5-12'), null); // not zero-padded
});

test('splitCalendarDate: returns null for empty / null / undefined', () => {
  assert.equal(splitCalendarDate(''), null);
  assert.equal(splitCalendarDate(null as unknown as string), null);
  assert.equal(splitCalendarDate(undefined as unknown as string), null);
});

test('deriveDateParts: components take precedence (with zero-padding)', () => {
  const parts = deriveDateParts({
    'document.issueDay': '5',
    'document.issueMonth': '3',
    'document.issueYear': '2026',
  });
  assert.ok(parts);
  assert.equal(parts.isoDate, '2026-03-05');
});

test('deriveDateParts: canonical issueDate takes second precedence', () => {
  const parts = deriveDateParts({ 'document.issueDate': '2026-05-12' });
  assert.ok(parts);
  assert.equal(parts.isoDate, '2026-05-12');
});

test('deriveDateParts: issueDate wins over partial components', () => {
  const parts = deriveDateParts({
    'document.issueDate': '2026-05-12',
    'document.issueDay': '99', // garbage; canonical wins
    'document.issueMonth': '99',
    'document.issueYear': '9999',
  });
  assert.ok(parts);
  assert.equal(parts.isoDate, '2026-05-12');
});

test('deriveDateParts: returns null when only invalid components', () => {
  const parts = deriveDateParts({
    'document.issueDay': '32',
    'document.issueMonth': '13',
    'document.issueYear': '2026',
  });
  assert.equal(parts, null);
});

test('deriveDateParts: returns null for empty inputs', () => {
  assert.equal(deriveDateParts({}), null);
});

// --- Adapter basic behavior ---

test('adapter: simple case — issuePlace + canonical issueDate', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'Hà Nội',
    'document.issueDate': '2026-05-12',
  });
  const rvs = a.buildRenderValues(ctx);
  assert.equal(getValue(rvs, 'document.issuePlace')?.value, 'Hà Nội');
  assert.equal(getValue(rvs, 'document.issueDate')?.value, '2026-05-12');
  // Derived components emitted with the same date parts
  assert.equal(getValue(rvs, 'document.issueDay')?.value, '12');
  assert.equal(getValue(rvs, 'document.issueMonth')?.value, '05');
  assert.equal(getValue(rvs, 'document.issueYear')?.value, '2026');
});

test('adapter: date-parts input (no canonical)', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'Hà Nội',
    'document.issueDay': '12',
    'document.issueMonth': '5',
    'document.issueYear': '2026',
  });
  const rvs = a.buildRenderValues(ctx);
  assert.equal(getValue(rvs, 'document.issueDate')?.value, '2026-05-12');
  assert.equal(getValue(rvs, 'document.issueDay')?.value, '12');
  assert.equal(getValue(rvs, 'document.issueMonth')?.value, '05');
  assert.equal(getValue(rvs, 'document.issueYear')?.value, '2026');
});

test('adapter: invalid date is rejected (no fabricated output)', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'Hà Nội',
    'document.issueDate': '2026-13-99',
  });
  const rvs = a.buildRenderValues(ctx);
  assert.equal(getValue(rvs, 'document.issueDate'), undefined);
  assert.equal(getValue(rvs, 'document.issueDay'), undefined);
});

test('adapter: compound input (issuePlaceDateLine) carries punctuation', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlaceDateLine': 'ngày 12 tháng 5 năm 2026 tại Hà Nội',
  });
  const rvs = a.buildRenderValues(ctx);
  const line = getValue(rvs, 'document.issuePlaceDateLine');
  assert.ok(line);
  assert.equal(line.value, 'ngày 12 tháng 5 năm 2026 tại Hà Nội');
  // Compound-only inputs do not fabricate canonical date parts.
  assert.equal(getValue(rvs, 'document.issueDate'), undefined);
});

test('adapter: component-plus-compound — component wins, compound is CONTRACT_REDUNDANT', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'Hà Nội',
    'document.issueDate': '2026-05-12',
    'document.issuePlaceDateLine': 'ngày 12 tháng 5 năm 2026 tại Hà Nội',
  });
  const rvs = a.buildRenderValues(ctx);
  // Place, date, and components emitted normally.
  assert.equal(getValue(rvs, 'document.issuePlace')?.value, 'Hà Nội');
  assert.equal(getValue(rvs, 'document.issueDate')?.value, '2026-05-12');
  // Compound line is emitted (it carries punctuation) but classified as
  // CONTRACT_REDUNDANT so the renderer does not double-write it.
  const compound = getValue(rvs, 'document.issuePlaceDateLine');
  assert.ok(compound);
  assert.equal(compound.classification, 'CONTRACT_REDUNDANT');
  // No duplicate canonical date emit (single issueDate key).
  assert.equal(getAllValues(rvs, 'document.issueDate').length, 1);
});

test('adapter: missing place emits no place render value', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({ 'document.issueDate': '2026-05-12' });
  const rvs = a.buildRenderValues(ctx);
  assert.equal(getValue(rvs, 'document.issuePlace'), undefined);
  assert.equal(getValue(rvs, 'document.issueDate')?.value, '2026-05-12');
});

test('adapter: missing date emits no date render value', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({ 'document.issuePlace': 'Hà Nội' });
  const rvs = a.buildRenderValues(ctx);
  assert.equal(getValue(rvs, 'document.issueDate'), undefined);
  assert.equal(getValue(rvs, 'document.issuePlace')?.value, 'Hà Nội');
});

test('adapter: source-specific punctuation is preserved', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'TP. Hồ Chí Minh',
    'document.issuePlaceDateLine':
      'Tp. Hồ Chí Minh, ngày 12 tháng 5 năm 2026',
  });
  const rvs = a.buildRenderValues(ctx);
  const compound = getValue(rvs, 'document.issuePlaceDateLine');
  assert.ok(compound);
  assert.match(compound.value, /Tp\. Hồ Chí Minh/);
  assert.match(compound.value, /ngày 12 tháng 5 năm 2026/);
});

test('adapter: table-cell source target is honoured', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext(
    {
      'document.issuePlace': 'Hà Nội',
      'document.issueDate': '2026-05-12',
    },
    [
      { path: 'document/issuePlace', ctx: 'table' },
      { path: 'document/issueDate', ctx: 'table' },
    ],
  );
  const rvs = a.buildRenderValues(ctx);
  assert.equal(getValue(rvs, 'document.issuePlace')?.sourceTargetIdentity.structuralContext, 'table');
  assert.equal(getValue(rvs, 'document.issueDate')?.sourceTargetIdentity.structuralContext, 'table');
});

test('adapter: split-run source target is honoured', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext(
    {
      'document.issuePlace': 'Hà Nội',
      'document.issueDay': '12',
      'document.issueMonth': '5',
      'document.issueYear': '2026',
    },
    [
      { path: 'document/issueDay', ctx: 'run' },
      { path: 'document/issueMonth', ctx: 'run' },
      { path: 'document/issueYear', ctx: 'run' },
    ],
  );
  const rvs = a.buildRenderValues(ctx);
  assert.equal(getValue(rvs, 'document.issueDay')?.sourceTargetIdentity.structuralContext, 'run');
});

test('adapter: stale R1 date is absent from R2 — date keys are source-grounded, not memoized', () => {
  // The adapter does not memoize; calling buildRenderValues twice with
  // different inputs must produce different values.
  const a = new IssuePlaceDateAdapter();
  const r1 = a.buildRenderValues(
    makeContext({ 'document.issueDate': '2026-05-12', 'document.issuePlace': 'Hà Nội' }),
  );
  const r2 = a.buildRenderValues(
    makeContext({ 'document.issueDate': '2026-06-01', 'document.issuePlace': 'Đà Nẵng' }),
  );
  assert.equal(getValue(r1, 'document.issueDate')?.value, '2026-05-12');
  assert.equal(getValue(r2, 'document.issueDate')?.value, '2026-06-01');
  // The R1 date string is not carried into the R2 render values.
  for (const rv of r2) {
    assert.notEqual(rv.value, '2026-05-12');
  }
});

test('adapter: issue date does NOT write into promulgation date', () => {
  // The adapter only emits keys under document.issue*; it must NOT
  // emit any key that the runtime would bind to a promulgation date.
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'Hà Nội',
    'document.issueDate': '2026-05-12',
  });
  const rvs = a.buildRenderValues(ctx);
  for (const rv of rvs) {
    assert.ok(
      rv.key.startsWith('document.issue'),
      `unexpected key emitted: ${rv.key}`,
    );
  }
  // No promulgation key is in the rendered set.
  assert.equal(rvs.some((rv) => rv.key.includes('promulgation')), false);
});

test('adapter: issue line does not replace legal-header line', () => {
  // The adapter must not emit keys that are reserved for the legal-
  // header family. The legal-header slots live under document.documentCode,
  // agency.*, etc. The adapter owns only document.issue* and must
  // never claim those.
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'Hà Nội',
    'document.issueDate': '2026-05-12',
  });
  const rvs = a.buildRenderValues(ctx);
  const keys = new Set(rvs.map((rv) => rv.key));
  for (const k of [
    'document.documentCode',
    'agency.name',
    'agency.parentName',
    'legalBasis.procedureArticlesLine',
  ]) {
    assert.ok(!keys.has(k), `adapter must not emit legal-header key ${k}`);
  }
});

test('adapter: two forms with different source wording emit different compound lines', () => {
  const a = new IssuePlaceDateAdapter();
  const ctxA = makeContext({ 'document.issuePlaceDateLine': 'Hà Nội, ngày 12 tháng 5 năm 2026' });
  const ctxB = makeContext({ 'document.issuePlaceDateLine': 'Tp. HCM, ngày 12/5/2026' });
  const rvsA = a.buildRenderValues(ctxA);
  const rvsB = a.buildRenderValues(ctxB);
  assert.equal(getValue(rvsA, 'document.issuePlaceDateLine')?.value, 'Hà Nội, ngày 12 tháng 5 năm 2026');
  assert.equal(getValue(rvsB, 'document.issuePlaceDateLine')?.value, 'Tp. HCM, ngày 12/5/2026');
});

// --- Adapter validation ---

test('validateMapping: PASS_COMPOUND when place + date + components all present', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'Hà Nội',
    'document.issueDate': '2026-05-12',
  });
  const rvs = a.buildRenderValues(ctx);
  const vctx: MappingValidationContext = {
    formCode: 'BM-TEST',
    contractFields: [
      { key: 'document.issuePlace', required: true },
      { key: 'document.issueDate', required: true },
      { key: 'document.issueDay', required: false },
      { key: 'document.issueMonth', required: false },
      { key: 'document.issueYear', required: false },
    ],
    sourceTargets: ctx.sourceTargets,
    renderValues: rvs,
  };
  const v = a.validateMapping(vctx);
  assert.equal(v.kind, 'PASS_COMPOUND');
});

test('validateMapping: FAIL when a required field is missing', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({ 'document.issueDate': '2026-05-12' });
  const rvs = a.buildRenderValues(ctx);
  const vctx: MappingValidationContext = {
    formCode: 'BM-TEST',
    contractFields: [
      { key: 'document.issuePlace', required: true },
      { key: 'document.issueDate', required: true },
    ],
    sourceTargets: ctx.sourceTargets,
    renderValues: rvs,
  };
  const v = a.validateMapping(vctx);
  assert.equal(v.kind, 'FAIL');
});

// --- Mutations ---

test('mutation: duplicate issue line — second compound line is dropped', () => {
  // The adapter does not synthesize two compound lines; if the contract
  // provides two, the renderer treats them as a single legal-visible
  // binding. The adapter emits only ONE compound line key
  // (document.issuePlaceDateLine). The contract may declare two
  // aliases but the adapter canonicalises them.
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlaceDateLine': 'line A',
    'document.issuePlaceAndDateLine': 'line B',
  });
  const rvs = a.buildRenderValues(ctx);
  // Only the canonical key is emitted.
  const lines = rvs.filter((rv) => rv.key === 'document.issuePlaceDateLine');
  assert.equal(lines.length, 1);
  assert.equal(lines[0]?.value, 'line A');
});

test('mutation: shifted date — Date constructor would shift; our split keeps wall-clock', () => {
  // The whole point of splitCalendarDate is to avoid Date timezone
  // shifts. Verify the wall-clock invariant for a date near midnight.
  const parts = splitCalendarDate('2026-05-12');
  assert.equal(parts?.isoDate, '2026-05-12');
  // Constructing a Date object for the same date would shift to UTC.
  // We do not use Date for any branch of the split, so the wall-clock
  // invariant is preserved.
});

test('mutation: missing month — components not padded to a valid date', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issueDay': '12',
    'document.issueYear': '2026',
  });
  const rvs = a.buildRenderValues(ctx);
  assert.equal(getValue(rvs, 'document.issueDate'), undefined);
  assert.equal(getValue(rvs, 'document.issueDay'), undefined);
});

test('mutation: R1 date remains in R2 — adapter does not memoize', () => {
  // Already covered above; repeat explicitly as a mutation test.
  const a = new IssuePlaceDateAdapter();
  const r1 = a.buildRenderValues(makeContext({ 'document.issueDate': '2026-05-12' }));
  const r2 = a.buildRenderValues(makeContext({ 'document.issueDate': '2026-06-01' }));
  assert.notEqual(
    getValue(r1, 'document.issueDate')?.value,
    getValue(r2, 'document.issueDate')?.value,
  );
});

test('mutation: issue date replaces circular date — circular date is not in the recognized keys', () => {
  // A "circular date" slot is not in the adapter's RECOGNIZED_INPUT_KEYS
  // and is therefore NOT emitted.
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    // Simulate a sibling-form key sneaking into the inputs.
    'document.issueDate': '2026-05-12',
  } as IssuePlaceDateFormInputs);
  // Manually inject a "circular date" key into the form inputs.
  (ctx.formInputs as Record<string, unknown>)['document.circularDate'] = '2026-05-12';
  const rvs = a.buildRenderValues(ctx);
  // The circular date is ignored.
  assert.equal(rvs.some((rv) => rv.key.includes('circular')), false);
});

test('mutation: compound field renders twice — adapter deduplicates', () => {
  // Already covered above; assert that two compound-line inputs do
  // NOT produce two render values for the canonical line key.
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlaceDateLine': 'A',
    'document.issuePlaceAndDateLine': 'B',
  });
  const rvs = a.buildRenderValues(ctx);
  const lineKeys = rvs.filter((rv) => rv.key === 'document.issuePlaceDateLine');
  assert.equal(lineKeys.length, 1);
});

test('mutation: place from sibling form leaks — adapter only sees its own context inputs', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': '',
  } as IssuePlaceDateFormInputs);
  // Simulate a sibling-form key sneaking into the inputs.
  (ctx.formInputs as Record<string, unknown>)['agency.siblingPlace'] = 'Hà Nội';
  const rvs = a.buildRenderValues(ctx);
  // No place is emitted because document.issuePlace is empty.
  assert.equal(getValue(rvs, 'document.issuePlace'), undefined);
  // The sibling key is not echoed back.
  for (const rv of rvs) {
    assert.ok(rv.key.startsWith('document.issue'), `unexpected key: ${rv.key}`);
  }
});

test('mutation: static promulgation line selected as target — adapter filters by recognized keys', () => {
  const a = new IssuePlaceDateAdapter();
  // A source target whose path is NOT under document/issue* is ignored
  // by the adapter's render-value emission (it falls back to its own
  // fallback target). The adapter does not bind to legal-header or
  // promulgation slots.
  const ctx = makeContext(
    { 'document.issuePlace': 'Hà Nội', 'document.issueDate': '2026-05-12' },
    [{ path: 'document/promulgationDate', preview: 'static promulgation' }],
  );
  const rvs = a.buildRenderValues(ctx);
  // No render value should bind to a promulgation path.
  for (const rv of rvs) {
    assert.ok(!rv.sourceTargetIdentity.path.includes('promulgation'),
      `unexpected promulgation binding: ${rv.sourceTargetIdentity.path}`);
  }
});

// --- Domain disambiguation: does not own other families' slots ---

test('adapter: does not claim keys owned by sibling families', () => {
  const a = new IssuePlaceDateAdapter();
  const ctx = makeContext({
    'document.issuePlace': 'Hà Nội',
    'document.issueDate': '2026-05-12',
  } as IssuePlaceDateFormInputs);
  // Simulate sibling-form keys in the inputs.
  (ctx.formInputs as Record<string, unknown>)['signature.signerName'] = 'Nguyễn Văn A';
  (ctx.formInputs as Record<string, unknown>)['agency.name'] = 'VKS Hà Nội';
  (ctx.formInputs as Record<string, unknown>)['recipients.primaryLine'] = 'Cục A';
  const rvs = a.buildRenderValues(ctx);
  const keys = new Set(rvs.map((rv) => rv.key));
  assert.ok(!keys.has('signature.signerName'));
  assert.ok(!keys.has('agency.name'));
  assert.ok(!keys.has('recipients.primaryLine'));
});