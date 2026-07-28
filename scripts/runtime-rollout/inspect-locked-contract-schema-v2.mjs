// Locked schema profiler v2 — emits counts with explicit element-units
// so we never conflate "forms that contain X" with "X-elements present
// across the corpus".
//
// elementUniverse for a property is one of:
//   - "forms"     (root-level property; 213 elements)
//   - "fields"    (canonicalFields property; 2497 elements)
//   - "slots"     (docxSlots property; 2497 elements)
//   - "bindings"  (renderBindings property; 2497 elements)
//
// For nested arrays (e.g. options) we additionally expose
//   - parentElementsContainingArray
//   - childElementCount
// so callers can do a consistent presentCount + missingCount == elementUniverse check.

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedContractCorpus } from './lib/locked-contract-loader.mjs';
import { computeAllHashes } from './lib/locked-hash-model.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_DIR = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'locked-contract-schema-profile.v2.json');
const OUTPUT_MD = path.join(OUTPUT_DIR, 'locked-contract-schema-profile.v2.md');

const VOLATILE_KEY_REGEX = /At$|Timestamp|^generatedAt$|^extractedAt$/i;

const PROPERTY_PROFILES = [
  // (path, elementUniverse, requiredForRuntime, requiredForAudit, volatileOrNoncanonical)
  { path: 'schemaVersion', universe: 'forms', runtime: true, audit: true, volatile: false },
  { path: 'status', universe: 'forms', runtime: true, audit: true, volatile: false },
  { path: 'templateCode', universe: 'forms', runtime: true, audit: true, volatile: false },
  { path: 'sourceId', universe: 'forms', runtime: true, audit: true, volatile: false },
  { path: 'templateTitle', universe: 'forms', runtime: false, audit: true, volatile: false },
  { path: 'documentKind', universe: 'forms', runtime: false, audit: true, volatile: false },
  { path: 'extractionSource', universe: 'forms', runtime: true, audit: true, volatile: false },
  { path: 'canonicalFields', universe: 'forms', runtime: true, audit: true, volatile: false },
  { path: 'docxSlots', universe: 'forms', runtime: true, audit: true, volatile: false },
  { path: 'renderBindings', universe: 'forms', runtime: true, audit: true, volatile: false },
  { path: 'productMetadata', universe: 'forms', runtime: true, audit: false, volatile: false },
  { path: 'renderFormatHints', universe: 'forms', runtime: true, audit: false, volatile: false },
  { path: 'reviewKind', universe: 'forms', runtime: false, audit: true, volatile: false },
  { path: 'reviewedBy', universe: 'forms', runtime: false, audit: true, volatile: false },
  { path: 'reviewedAt', universe: 'forms', runtime: false, audit: false, volatile: true },
  { path: 'warnings', universe: 'forms', runtime: false, audit: true, volatile: false },

  // field-level
  { path: 'canonicalFields.path', universe: 'fields', runtime: true, audit: true, volatile: false },
  { path: 'canonicalFields.type', universe: 'fields', runtime: true, audit: true, volatile: false },
  { path: 'canonicalFields.label', universe: 'fields', runtime: false, audit: true, volatile: false },
  { path: 'canonicalFields.source', universe: 'fields', runtime: true, audit: true, volatile: false },
  { path: 'canonicalFields.required', universe: 'fields', runtime: true, audit: true, volatile: false },
  { path: 'canonicalFields.uiComponent', universe: 'fields', runtime: true, audit: false, volatile: false },
  { path: 'canonicalFields.options', universe: 'fields', runtime: true, audit: false, volatile: false },
  { path: 'canonicalFields.transform', universe: 'fields', runtime: true, audit: false, volatile: false },
  { path: 'canonicalFields.section', universe: 'fields', runtime: false, audit: true, volatile: false },
  { path: 'canonicalFields.reviewRequired', universe: 'fields', runtime: false, audit: true, volatile: false },

  // slot-level
  { path: 'docxSlots.slotId', universe: 'slots', runtime: true, audit: true, volatile: false },
  { path: 'docxSlots.slotType', universe: 'slots', runtime: true, audit: true, volatile: false },
  { path: 'docxSlots.required', universe: 'slots', runtime: true, audit: true, volatile: false },
  { path: 'docxSlots.location', universe: 'slots', runtime: true, audit: true, volatile: false },
  { path: 'docxSlots.context', universe: 'slots', runtime: true, audit: true, volatile: false },
  { path: 'docxSlots.evidence', universe: 'slots', runtime: true, audit: true, volatile: false },
  { path: 'docxSlots.reviewRequired', universe: 'slots', runtime: false, audit: true, volatile: false },

  // binding-level
  { path: 'renderBindings.slotId', universe: 'bindings', runtime: true, audit: true, volatile: false },
  { path: 'renderBindings.from', universe: 'bindings', runtime: true, audit: true, volatile: false },
  { path: 'renderBindings.transform', universe: 'bindings', runtime: true, audit: false, volatile: false },
  { path: 'renderBindings.fallback', universe: 'bindings', runtime: true, audit: false, volatile: false },
  { path: 'renderBindings.reviewRequired', universe: 'bindings', runtime: false, audit: true, volatile: false },
];

const UNIVERSE_COUNTS = { forms: 213, fields: 2497, slots: 2497, bindings: 2497 };

function dig(obj, dottedPath) {
  const parts = dottedPath.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function isPresent(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function valueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

function universeCount(universe) {
  return UNIVERSE_COUNTS[universe];
}

function buildFormPropertyReport(contracts) {
  return PROPERTY_PROFILES.filter((p) => p.universe === 'forms').map((profile) => {
    let present = 0;
    let missing = 0;
    const formsContaining = [];
    const formsMissing = [];
    const distinctValueSet = new Set();
    const valueTypes = new Set();
    for (const contract of contracts) {
      const value = dig(contract, profile.path);
      if (isPresent(value)) {
        present += 1;
        formsContaining.push(contract.templateCode);
        distinctValueSet.add(JSON.stringify(value));
        valueTypes.add(valueType(value));
      } else {
        missing += 1;
        formsMissing.push(contract.templateCode);
      }
    }
    return {
      propertyPath: profile.path,
      valueTypes: Array.from(valueTypes).sort(),
      elementUniverse: 'forms',
      elementUniverseCount: universeCount('forms'),
      elementPresentCount: present,
      elementMissingCount: missing,
      formsContainingProperty: formsContaining.length,
      formsMissingProperty: formsMissing.length,
      distinctValueCount: distinctValueSet.size,
      sampleForms: formsContaining.slice(0, 5),
      sampleFormsMissing: formsMissing.slice(0, 5),
      requiredForRuntime: profile.runtime,
      requiredForAudit: profile.audit,
      volatileOrNoncanonical: profile.volatile || VOLATILE_KEY_REGEX.test(profile.path),
      consistencyInvariant: `elementPresentCount + elementMissingCount == ${universeCount('forms')}: ${present + missing === universeCount('forms')}`,
    };
  });
}

function buildElementPropertyReport(contracts, collection, universe) {
  return PROPERTY_PROFILES.filter((p) => p.universe === universe).map((profile) => {
    let present = 0;
    let missing = 0;
    const formsContaining = new Set();
    const formsMissing = new Set();
    const distinctValueSet = new Set();
    const valueTypes = new Set();
    let parentsContainingArray = 0;
    let childElementCount = 0;
    for (const contract of contracts) {
      const elements = contract[collection] ?? [];
      let formContained = false;
      for (const element of elements) {
        const value = dig(element, profile.path.split('.').slice(1).join('.'));
        if (isPresent(value)) {
          present += 1;
          formContained = true;
          distinctValueSet.add(JSON.stringify(value));
          valueTypes.add(valueType(value));
        } else {
          missing += 1;
        }
      }
      if (formContained) {
        formsContaining.add(contract.templateCode);
      } else {
        formsMissing.add(contract.templateCode);
      }
      // Nested array heuristic: any property whose path ends in a key like 'options'
      // is reported with the child-element count if it is an array.
      if (collection === 'canonicalFields' && profile.path === 'canonicalFields.options') {
        for (const element of elements) {
          if (Array.isArray(element.options)) {
            parentsContainingArray += 1;
            childElementCount += element.options.length;
          }
        }
      }
    }
    const out = {
      propertyPath: profile.path,
      valueTypes: Array.from(valueTypes).sort(),
      elementUniverse: universe,
      elementUniverseCount: universeCount(universe),
      elementPresentCount: present,
      elementMissingCount: missing,
      formsContainingProperty: formsContaining.size,
      formsMissingProperty: formsMissing.size,
      distinctValueCount: distinctValueSet.size,
      sampleForms: Array.from(formsContaining).slice(0, 5),
      sampleFormsMissing: Array.from(formsMissing).slice(0, 5),
      requiredForRuntime: profile.runtime,
      requiredForAudit: profile.audit,
      volatileOrNoncanonical: profile.volatile || VOLATILE_KEY_REGEX.test(profile.path),
      consistencyInvariant: `elementPresentCount + elementMissingCount == ${universeCount(universe)}: ${present + missing === universeCount(universe)}`,
    };
    if (collection === 'canonicalFields' && profile.path === 'canonicalFields.options') {
      out.parentElementsContainingArray = parentsContainingArray;
      out.childElementCount = childElementCount;
    }
    return out;
  });
}

export function buildLockedSchemaProfileV2(options = {}) {
  const corpus = loadLockedContractCorpus(options);
  const contracts = corpus.contracts;

  const formReport = buildFormPropertyReport(contracts);
  const fieldReport = buildElementPropertyReport(contracts, 'canonicalFields', 'fields');
  const slotReport = buildElementPropertyReport(contracts, 'docxSlots', 'slots');
  const bindingReport = buildElementPropertyReport(contracts, 'renderBindings', 'bindings');

  const allReports = [...formReport, ...fieldReport, ...slotReport, ...bindingReport];
  const invariantFailures = allReports.filter((r) => !r.consistencyInvariant.endsWith(': true')).map((r) => r.propertyPath);

  const hashes = computeAllHashes(corpus.contractsDir ?? path.join(REPO_ROOT, 'docs/audit/docx/contracts/locked'), contracts, null);

  return {
    schema: 'qllaw.213.locked_schema_profile/v2',
    generatedAt: new Date().toISOString(),
    corpusSummary: {
      contractCount: contracts.length,
      fieldCount: corpus.totals.fields,
      slotCount: corpus.totals.slots,
      bindingCount: corpus.totals.bindings,
    },
    universeCounts: UNIVERSE_COUNTS,
    corpusByteSha256: hashes.corpusByteSha256,
    runtimeAuthoritySha256: hashes.runtimeAuthoritySha256,
    auditEvidenceSha256: hashes.auditEvidenceSha256,
    propertyReports: allReports,
    invariantFailures,
    totalProperties: allReports.length,
  };
}

function renderMarkdown(profile) {
  const lines = [];
  lines.push('# Locked Contract Schema Profile v2');
  lines.push('');
  lines.push(`Generated: ${profile.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- contractCount: ${profile.corpusSummary.contractCount}`);
  lines.push(`- fieldCount: ${profile.corpusSummary.fieldCount}`);
  lines.push(`- slotCount: ${profile.corpusSummary.slotCount}`);
  lines.push(`- bindingCount: ${profile.corpusSummary.bindingCount}`);
  lines.push(`- corpusByteSha256: \`${profile.corpusByteSha256}\``);
  lines.push(`- runtimeAuthoritySha256: \`${profile.runtimeAuthoritySha256}\``);
  lines.push(`- auditEvidenceSha256: \`${profile.auditEvidenceSha256}\``);
  lines.push(`- invariantFailures: ${profile.invariantFailures.length}`);
  lines.push(`- totalProperties: ${profile.totalProperties}`);
  lines.push('');
  lines.push('## Per-property report');
  lines.push('');
  lines.push('| propertyPath | elementUniverse | present | missing | requiredForRuntime | requiredForAudit | volatile | invariant |');
  lines.push('|---|---|---:|---:|---|---|---|---:|');
  for (const r of profile.propertyReports) {
    lines.push(`| ${r.propertyPath} | ${r.elementUniverse} | ${r.elementPresentCount} | ${r.elementMissingCount} | ${r.requiredForRuntime} | ${r.requiredForAudit} | ${r.volatileOrNoncanonical} | ${r.consistencyInvariant.endsWith(': true') ? 'PASS' : 'FAIL'} |`);
  }
  return `${lines.join('\n')}\n`;
}

export function writeLockedSchemaProfileV2(options = {}) {
  const profile = buildLockedSchemaProfileV2(options);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_JSON, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  writeFileSync(OUTPUT_MD, renderMarkdown(profile), 'utf8');
  return { jsonPath: OUTPUT_JSON, mdPath: OUTPUT_MD, profile };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { profile, jsonPath, mdPath } = writeLockedSchemaProfileV2();
  console.log(`OK schema profile v2: ${profile.totalProperties} properties, ${profile.invariantFailures.length} invariant failures`);
  console.log(`     json: ${path.relative(REPO_ROOT, jsonPath)}`);
  console.log(`     md:   ${path.relative(REPO_ROOT, mdPath)}`);
  if (profile.invariantFailures.length) {
    console.error('FAIL invariant failures:', profile.invariantFailures);
    process.exit(1);
  }
}
