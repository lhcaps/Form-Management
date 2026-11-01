// Tests for inspect-locked-contract-schema-v2.
// Verifies:
//   1. elementPresentCount + elementMissingCount == elementUniverseCount (consistency invariant)
//   2. elementUniverse is one of forms/fields/slots/bindings
//   3. corpusByteSha256 + runtimeAuthoritySha256 + auditEvidenceSha256 all populated
//   4. nested array (canonicalFields.options) reports parentElementsContainingArray + childElementCount

import { deepEqual, ok } from 'node:assert/strict';
import { test } from 'node:test';

import { buildLockedSchemaProfileV2 } from './inspect-locked-contract-schema-v2.mjs';

test('schema profile v2 covers all universes and respects invariant', () => {
  const profile = buildLockedSchemaProfileV2();
  const universeCounts = profile.universeCounts;
  deepEqual(profile.corpusSummary.contractCount, universeCounts.forms, 'corpus must have 213 forms');
  ok(profile.corpusSummary.fieldCount === universeCounts.fields, 'field count must equal elementUniverse');
  ok(profile.corpusSummary.slotCount === universeCounts.slots, 'slot count must equal elementUniverse');
  ok(profile.corpusSummary.bindingCount === universeCounts.bindings, 'binding count must equal elementUniverse');
  deepEqual(profile.invariantFailures, [], 'every property must satisfy presentCount + missingCount == elementUniverseCount');
  for (const report of profile.propertyReports) {
    ok(['forms', 'fields', 'slots', 'bindings'].includes(report.elementUniverse), `unknown universe ${report.elementUniverse}`);
  }
});

test('schema profile v2 hashes are present and non-empty', () => {
  const profile = buildLockedSchemaProfileV2();
  ok(typeof profile.corpusByteSha256 === 'string' && profile.corpusByteSha256.length === 64);
  ok(typeof profile.runtimeAuthoritySha256 === 'string' && profile.runtimeAuthoritySha256.length === 64);
  ok(typeof profile.auditEvidenceSha256 === 'string' && profile.auditEvidenceSha256.length === 64);
});

test('schema profile v2 reports nested array (options) child counts', () => {
  const profile = buildLockedSchemaProfileV2();
  const optionsReport = profile.propertyReports.find((r) => r.propertyPath === 'canonicalFields.options');
  ok(optionsReport, 'options property must be reported');
  ok(typeof optionsReport.parentElementsContainingArray === 'number');
  ok(typeof optionsReport.childElementCount === 'number');
  ok(optionsReport.parentElementsContainingArray <= optionsReport.elementPresentCount, 'parents with array must be subset of all present parents');
});

test('schema profile v2 is deterministic across calls', () => {
  const a = buildLockedSchemaProfileV2();
  const b = buildLockedSchemaProfileV2();
  deepEqual(a.runtimeAuthoritySha256, b.runtimeAuthoritySha256);
  deepEqual(a.auditEvidenceSha256, b.auditEvidenceSha256);
  deepEqual(a.corpusByteSha256, b.corpusByteSha256);
});
