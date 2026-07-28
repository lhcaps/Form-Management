// Locked runtime index loader — single canonical API for active consumers.
//
// Usage:
//   const index = loadLockedRuntimeIndex();
//   const form = getLockedForm(index, 'BM-001');
//   const field = getLockedField(index, 'BM-001', 'document.issuePlaceDateLine');
//   const slot = getLockedSlot(index, 'BM-001', 'document.issuePlaceDateLine');
//   const bySlot = getLockedBindingBySlot(index, 'BM-001', 'document.issuePlaceDateLine');
//   const byField = getLockedBindingByField(index, 'BM-001', 'document.issuePlaceDateLine');
//   assertCurrentCorpusParity(index);     // fail if corpus bytes drifted
//   assertCurrentNormalizedSourceParity(index, 'storage/templates/normalized-docx/BM-001/...');
//
// The loader never falls back to compiled-v2, panel state, or adapter
// resolution. If anything is stale, it throws.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { computeCorpusByteSha256 } from './locked-hash-model.mjs';
import { loadLockedContractCorpus } from './locked-contract-loader.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const DEFAULT_INDEX_PATH = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-runtime-index.v2.1.json');
const DEFAULT_LOCKED_DIR = path.join(REPO_ROOT, 'docs/audit/docx/contracts/locked');
const EXPECTED_SCHEMA = 'qllaw.213.locked_contract_runtime_index/v2.1';

let _cachedIndex = null;
let _cachedIndexPath = null;

function readJsonSafe(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex');
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function failClosed(message) {
  throw new Error(`[locked-runtime-index] FAIL_CLOSED: ${message}`);
}

export function loadLockedRuntimeIndex(options = {}) {
  const indexPath = options.indexPath ?? DEFAULT_INDEX_PATH;
  if (!existsSync(indexPath)) failClosed(`index not found at ${indexPath}`);
  const index = readJsonSafe(indexPath);
  if (index.schema !== EXPECTED_SCHEMA) failClosed(`schema mismatch: got ${index.schema}, expected ${EXPECTED_SCHEMA}`);
  if (index.contractCount !== 213) failClosed(`contractCount ${index.contractCount} != 213`);
  if ((index.missingFormCodes ?? []).length > 0) failClosed(`missing form codes: ${index.missingFormCodes.join(',')}`);
  if ((index.extraFormCodes ?? []).length > 0) failClosed(`extra form codes: ${index.extraFormCodes.join(',')}`);
  if ((index.duplicateFormCodes ?? []).length > 0) failClosed(`duplicate form codes: ${index.duplicateFormCodes.join(',')}`);
  if (!index.hashes?.corpusByteSha256) failClosed('index is missing corpusByteSha256');
  if (!index.hashes?.runtimeAuthoritySha256) failClosed('index is missing runtimeAuthoritySha256');
  if (!index.hashes?.auditEvidenceSha256) failClosed('index is missing auditEvidenceSha256');
  // Build a lookup map for fast access.
  index.__byTemplateCode = new Map(index.forms.map((form) => [form.identity.templateCode, form]));
  _cachedIndex = Object.freeze(index);
  _cachedIndexPath = indexPath;
  return _cachedIndex;
}

export function getCachedIndex() {
  if (_cachedIndex) return _cachedIndex;
  return loadLockedRuntimeIndex();
}

export function clearCachedIndex() {
  _cachedIndex = null;
  _cachedIndexPath = null;
}

export function getLockedForm(index, formCode) {
  if (typeof formCode !== 'string' || !/^BM-\d{3}$/.test(formCode)) failClosed(`invalid form code: ${formCode}`);
  const form = (index.__byTemplateCode ?? new Map(index.forms.map((f) => [f.identity.templateCode, f]))).get(formCode);
  if (!form) failClosed(`form not found: ${formCode}`);
  return form;
}

export function getLockedField(index, formCode, fieldPath) {
  const form = getLockedForm(index, formCode);
  const field = form.runtimeView.canonicalFields.find((f) => f.path === fieldPath);
  if (!field) failClosed(`field not found: ${formCode}.${fieldPath}`);
  return field;
}

export function getLockedSlot(index, formCode, slotId) {
  const form = getLockedForm(index, formCode);
  const slot = form.runtimeView.docxSlots.find((s) => s.slotId === slotId);
  if (!slot) failClosed(`slot not found: ${formCode}.${slotId}`);
  return slot;
}

export function getLockedBindingBySlot(index, formCode, slotId) {
  const form = getLockedForm(index, formCode);
  const binding = form.runtimeView.renderBindings.find((b) => b.slotId === slotId);
  if (!binding) failClosed(`binding not found for slot: ${formCode}.${slotId}`);
  return binding;
}

export function getLockedBindingByField(index, formCode, fieldPath) {
  const form = getLockedForm(index, formCode);
  const binding = form.runtimeView.renderBindings.find((b) => b.from === fieldPath);
  if (!binding) failClosed(`binding not found for field: ${formCode}.${fieldPath}`);
  return binding;
}

/** Re-compute corpusByteSha256 from disk and compare against the index. */
export function assertCurrentCorpusParity(index, options = {}) {
  const lockedDir = options.contractsDir ?? DEFAULT_LOCKED_DIR;
  const actual = computeCorpusByteSha256(lockedDir);
  const expected = index.hashes.corpusByteSha256;
  if (actual !== expected) failClosed(`corpus byte hash drift: actual=${actual} expected=${expected}`);
  return { actual, expected, ok: true };
}

/** Verify a normalized DOCX still matches the extractionSource.sha256 recorded in the form. */
export function assertCurrentNormalizedSourceParity(index, formCode, filePath) {
  const form = getLockedForm(index, formCode);
  const expected = form.auditView.extractionSource?.sha256;
  if (!expected) failClosed(`form ${formCode} has no extractionSource.sha256`);
  if (!filePath || !existsSync(filePath)) failClosed(`normalized source not on disk: ${filePath}`);
  const actual = sha256File(filePath);
  if (actual !== expected) failClosed(`normalized source hash drift for ${formCode}: actual=${actual} expected=${expected}`);
  return { actual, expected, ok: true };
}

/** Top-level validator: loads, checks schema, form set, and (optionally) corpus parity. */
export function validateLockedRuntimeIndex(options = {}) {
  const index = loadLockedRuntimeIndex(options);
  // Re-derive a small sample of the hashes to confirm they still match a fresh
  // read of the corpus.
  assertCurrentCorpusParity(index, options);
  return { ok: true, index, hashes: index.hashes };
}

/** Throws if `selection` includes a key that is a deprecated alias. */
export function assertNoDeprecatedAliasUse(selection) {
  const deprecated = new Set(['fields', 'slots', 'bindings', 'docxSlots', 'canonicalFields', 'renderBindings']);
  // This function only inspects the literal key names — not the values. It is
  // meant to be called with the parsed keys of an import statement or
  // destructured assignment. Example:
  //   assertNoDeprecatedAliasUse(Object.keys(importedModule));
  for (const key of selection) {
    if (deprecated.has(key)) {
      failClosed(`deprecated alias used: ${key}`);
    }
  }
}

/** Helper: list all 2497 field paths, all 2497 slot IDs, all 2497 binding keys. */
export function enumerateLockedIndex(index) {
  const fields = [];
  const slots = [];
  const bindings = [];
  for (const form of index.forms) {
    for (const field of form.runtimeView.canonicalFields) fields.push({ formCode: form.identity.templateCode, fieldPath: field.path });
    for (const slot of form.runtimeView.docxSlots) slots.push({ formCode: form.identity.templateCode, slotId: slot.slotId });
    for (const binding of form.runtimeView.renderBindings) bindings.push({ formCode: form.identity.templateCode, slotId: binding.slotId, from: binding.from });
  }
  return { fields, slots, bindings };
}
