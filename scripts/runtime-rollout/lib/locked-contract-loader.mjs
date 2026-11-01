import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DEFAULT_CONTRACTS_DIR = path.join(REPO_ROOT, 'docs/audit/docx/contracts/locked');
const SUPPORTED_SCHEMA_VERSIONS = new Set(['1.0']);
const FORM_CODE = /^BM-\d{3}$/;
const LOCKED_FILENAME = /^(BM-\d{3})__[^/\\]+\.contract\.locked\.json$/;

export function loadLockedContractCorpus(options = {}) {
  const contractsDir = options.contractsDir ?? DEFAULT_CONTRACTS_DIR;
  const files = readdirSync(contractsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.contract.locked.json'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, 'en'));

  const contracts = files.map((fileName) => {
    const contract = JSON.parse(readFileSync(path.join(contractsDir, fileName), 'utf8'));
    validateLockedContract(contract, { fileName });
    return contract;
  }).sort((left, right) => left.templateCode.localeCompare(right.templateCode, 'en'));

  const seen = new Set();
  for (const contract of contracts) {
    if (seen.has(contract.templateCode)) {
      throw new Error(`Duplicate locked contract templateCode: ${contract.templateCode}`);
    }
    seen.add(contract.templateCode);
  }

  return Object.freeze({
    contracts: Object.freeze(contracts),
    totals: Object.freeze(totalsFor(contracts)),
    canonicalHash: computeLockedContractCanonicalHash(contracts),
    contractsDir,
  });
}

export function loadLockedContractForForm(formCode, options = {}) {
  if (!FORM_CODE.test(formCode)) throw new Error(`Invalid locked contract form code: ${formCode}`);
  const match = loadLockedContractCorpus(options).contracts.find((contract) => contract.templateCode === formCode);
  if (!match) throw new Error(`Locked contract not found for ${formCode}`);
  return match;
}

export function validateLockedContract(contract, options = {}) {
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) throw new Error('Locked contract must be an object');
  if (!SUPPORTED_SCHEMA_VERSIONS.has(contract.schemaVersion)) throw new Error(`Unsupported locked contract schemaVersion: ${contract.schemaVersion}`);
  if (!FORM_CODE.test(contract.templateCode ?? '')) throw new Error(`Invalid locked contract templateCode: ${contract.templateCode}`);
  if (contract.status !== 'locked') throw new Error(`Locked contract ${contract.templateCode} must have status locked`);
  if (!contract.sourceId || !contract.templateTitle || !contract.extractionSource?.sha256) throw new Error(`Locked contract ${contract.templateCode} is missing canonical identity metadata`);
  for (const key of ['docxSlots', 'canonicalFields', 'renderBindings']) {
    if (!Array.isArray(contract[key]) || contract[key].length === 0) throw new Error(`Locked contract ${contract.templateCode} has no ${key}`);
  }
  if (contract.docxSlots.length !== contract.canonicalFields.length || contract.docxSlots.length !== contract.renderBindings.length) {
    throw new Error(`Locked contract ${contract.templateCode} has non-parallel slots, fields, and bindings`);
  }
  const slotIds = new Set();
  const fieldPaths = new Set();
  const bindingSlots = new Set();
  for (const slot of contract.docxSlots) {
    if (!slot?.slotId || slotIds.has(slot.slotId)) throw new Error(`Locked contract ${contract.templateCode} has invalid or duplicate slotId`);
    slotIds.add(slot.slotId);
  }
  for (const field of contract.canonicalFields) {
    if (!field?.path || fieldPaths.has(field.path) || !field.label || !field.uiComponent) throw new Error(`Locked contract ${contract.templateCode} has invalid canonical field`);
    fieldPaths.add(field.path);
  }
  for (const binding of contract.renderBindings) {
    if (!binding?.slotId || !binding?.from || bindingSlots.has(binding.slotId)) throw new Error(`Locked contract ${contract.templateCode} has invalid or duplicate render binding`);
    if (!slotIds.has(binding.slotId) || !fieldPaths.has(binding.from)) throw new Error(`Locked contract ${contract.templateCode} binding is outside canonical contract`);
    bindingSlots.add(binding.slotId);
  }
  if (options.fileName) {
    const match = LOCKED_FILENAME.exec(options.fileName);
    if (!match || match[1] !== contract.templateCode) throw new Error(`Locked contract filename does not match templateCode: ${options.fileName}`);
  }
  return contract;
}

export function buildLockedContractCanonicalView(contract) {
  validateLockedContract(contract);
  return {
    schemaVersion: contract.schemaVersion,
    sourceId: contract.sourceId,
    templateCode: contract.templateCode,
    templateTitle: contract.templateTitle,
    documentKind: contract.documentKind,
    status: contract.status,
    extractionSource: contract.extractionSource,
    docxSlots: contract.docxSlots.map((slot) => ({ slotId: slot.slotId, required: Boolean(slot.required), reviewRequired: Boolean(slot.reviewRequired) })),
    canonicalFields: contract.canonicalFields.map((field) => ({ path: field.path, type: field.type, label: field.label, source: field.source, required: Boolean(field.required), uiComponent: field.uiComponent, section: field.section, reviewRequired: Boolean(field.reviewRequired), transform: field.transform })),
    renderBindings: contract.renderBindings.map((binding) => ({ slotId: binding.slotId, from: binding.from, transform: binding.transform, fallback: binding.fallback, reviewRequired: Boolean(binding.reviewRequired) })),
  };
}

export function computeLockedContractCanonicalHash(contractOrContracts) {
  const view = Array.isArray(contractOrContracts)
    ? contractOrContracts.map(buildLockedContractCanonicalView).sort((left, right) => left.templateCode.localeCompare(right.templateCode, 'en'))
    : buildLockedContractCanonicalView(contractOrContracts);
  return createHash('sha256').update(JSON.stringify(view)).digest('hex');
}

function totalsFor(contracts) {
  return contracts.reduce((totals, contract) => ({
    slots: totals.slots + contract.docxSlots.length,
    fields: totals.fields + contract.canonicalFields.length,
    bindings: totals.bindings + contract.renderBindings.length,
  }), { slots: 0, fields: 0, bindings: 0 });
}
