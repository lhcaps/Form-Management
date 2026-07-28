import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { loadLockedContractCorpus } from './lib/locked-contract-loader.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_DIR = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase');

export function profileLockedContractSchema(options = {}) {
  const corpus = loadLockedContractCorpus(options);
  const observations = new Map();
  for (const contract of corpus.contracts) observe(observations, contract, contract.templateCode);
  const properties = Object.fromEntries([...observations.entries()].sort(([left], [right]) => left.localeCompare(right, 'en')).map(([key, value]) => [key, {
    propertyPath: key,
    valueTypes: [...value.types].sort(),
    presentCount: value.presentCount,
    missingCount: corpus.contracts.length - value.forms.size,
    distinctValueCount: value.values.size,
    sampleForms: [...value.forms].sort().slice(0, 5),
    semanticPurpose: purposeFor(key),
    requiredForRuntime: runtimeRequired(key),
    requiredForAudit: true,
    volatileOrNoncanonical: /generatedAt|reviewedAt|repairedAt/i.test(key),
  }]));
  return { schemaVersion: 'qllaw.213.locked_contract_schema_profile/v1', contractCount: corpus.contracts.length, canonicalHash: corpus.canonicalHash, properties };
}

export function writeLockedContractSchemaProfile(options = {}) {
  const profile = profileLockedContractSchema(options);
  const jsonPath = options.jsonPath ?? path.join(OUTPUT_DIR, 'locked-contract-schema-profile.json');
  const markdownPath = options.markdownPath ?? path.join(OUTPUT_DIR, 'locked-contract-schema-profile.md');
  mkdirSync(path.dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(profile, null, 2)}\n`, 'utf8');
  const lines = ['# Locked contract schema profile', '', `Contracts: ${profile.contractCount}`, `Canonical corpus hash: \`${profile.canonicalHash}\``, '', '| PROPERTY_PATH | VALUE_TYPES | PRESENT_COUNT | REQUIRED_FOR_RUNTIME | VOLATILE |', '| --- | --- | ---: | --- | --- |'];
  for (const property of Object.values(profile.properties)) lines.push(`| ${property.propertyPath} | ${property.valueTypes.join(', ')} | ${property.presentCount} | ${property.requiredForRuntime} | ${property.volatileOrNoncanonical} |`);
  writeFileSync(markdownPath, `${lines.join('\n')}\n`, 'utf8');
  return { profile, jsonPath, markdownPath, profileSha256: createHash('sha256').update(JSON.stringify(profile)).digest('hex') };
}

function observe(observations, value, formCode, prefix = '') {
  if (Array.isArray(value)) {
    value.forEach((item) => observe(observations, item, formCode, `${prefix}[]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) observe(observations, nested, formCode, prefix ? `${prefix}.${key}` : key);
    return;
  }
  if (!prefix) return;
  const found = observations.get(prefix) ?? { types: new Set(), values: new Set(), forms: new Set(), presentCount: 0 };
  found.types.add(value === null ? 'null' : typeof value);
  found.values.add(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : 'null');
  found.forms.add(formCode);
  found.presentCount += 1;
  observations.set(prefix, found);
}

function purposeFor(key) {
  if (/canonicalFields|renderBindings|docxSlots/.test(key)) return 'runtime contract';
  if (/extractionSource|docx\.sha256|sourceId/.test(key)) return 'provenance';
  if (/review|warning|question/i.test(key)) return 'review/audit metadata';
  return 'contract metadata';
}
function runtimeRequired(key) { return /^(canonicalFields|renderBindings|docxSlots)|^(sourceId|templateCode|status|schemaVersion|extractionSource)/.test(key); }

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = writeLockedContractSchemaProfile();
  console.log(`OK schema profile: ${result.profile.contractCount} contracts, ${Object.keys(result.profile.properties).length} properties`);
}
