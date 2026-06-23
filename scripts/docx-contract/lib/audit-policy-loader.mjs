/**
 * audit-policy-loader.mjs
 *
 * Read-only loader for Phase F audit policies. Reads the active policy JSON
 * files from docs/audit/docx/policies/ and provides query functions.
 *
 * The loader is intentionally stateless and does not modify any contract
 * data, DOCX files, or runtime state.
 *
 * Usage:
 *   import { loadAuditPolicies, getAliasForField, ... } from "./lib/audit-policy-loader.mjs";
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_POLICY_DIR = "docs/audit/docx/policies";

function safeLoadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Load all three audit policy files from the given root directory.
 * Tolerates missing files — returns empty policy objects instead of throwing.
 *
 * @param {string} [rootDir=process.cwd()]
 * @returns {{ aliasPolicy: object, metadataOnlyPolicy: object, removeRequests: object }}
 */
export function loadAuditPolicies(rootDir = process.cwd()) {
  const policyDir = path.resolve(rootDir, DEFAULT_POLICY_DIR);

  const rawAlias = safeLoadJson(path.join(policyDir, "field-alias-policy.json"));
  const rawMeta = safeLoadJson(path.join(policyDir, "metadata-only-policy.json"));
  const rawRemove = safeLoadJson(path.join(policyDir, "remove-approval-requests.json"));

  return Object.freeze({
    aliasPolicy: Object.freeze(rawAlias ?? { aliases: [], policy: {} }),
    metadataOnlyPolicy: Object.freeze(rawMeta ?? { fields: [], policy: {} }),
    removeRequests: Object.freeze(rawRemove ?? { removalRequests: [], policy: {} }),
  });
}

// ── Alias queries ──────────────────────────────────────────────────────────────

/**
 * Get the alias entry for a given template + canonical field.
 * @returns {object|null}
 */
export function getAliasForField(policies, templateCode, fieldPath) {
  const list = policies.aliasPolicy?.aliases;
  if (!Array.isArray(list)) return null;
  return list.find(
    (a) => a.templateCode === templateCode && a.canonicalField === fieldPath,
  ) ?? null;
}

/**
 * Get all aliases for a template.
 * @returns {object[]}
 */
export function getAliasesForTemplate(policies, templateCode) {
  return (policies.aliasPolicy?.aliases ?? []).filter(
    (a) => a.templateCode === templateCode,
  );
}

/**
 * Returns true when the alias for (templateCode, canonicalField) is active:
 * direction is "canonical_aliases_to_suffixed_slot" and neither the canonical
 * field nor the alias target is in the remove-pending set.
 */
export function isAliasActive(policies, templateCode, canonicalField) {
  const alias = getAliasForField(policies, templateCode, canonicalField);
  if (!alias) return false;
  if (alias.direction !== "canonical_aliases_to_suffixed_slot") return false;
  const { isRemovePending } = policies;
  if (isRemovePending && isRemovePending(templateCode, canonicalField)) return false;
  if (alias.suffixedSlotId && isRemovePending && isRemovePending(templateCode, alias.suffixedSlotId)) {
    return false;
  }
  return true;
}

/**
 * Returns true when the canonical field is satisfied by an active alias whose
 * suffix slot is rendered in the DOCX (present in renderedFields).
 * @param {string[]} renderedFields - slot IDs verified present in the DOCX template
 */
export function isAliasSatisfied(policies, templateCode, canonicalField, renderedFields = []) {
  if (!isAliasActive(policies, templateCode, canonicalField)) return false;
  const alias = getAliasForField(policies, templateCode, canonicalField);
  if (!alias?.suffixedSlotId) return false;
  return renderedFields.includes(alias.suffixedSlotId);
}

// ── Metadata-only queries ─────────────────────────────────────────────────────

/**
 * Returns the metadata-only entry for (templateCode, fieldPath).
 * @returns {object|null}
 */
export function isMetadataOnlyField(policies, templateCode, fieldPath) {
  const list = policies.metadataOnlyPolicy?.fields;
  if (!Array.isArray(list)) return null;
  return list.find(
    (f) => f.templateCode === templateCode && f.field === fieldPath,
  ) ?? null;
}

/**
 * Returns all metadata-only entries for a template.
 * @returns {object[]}
 */
export function getMetadataOnlyFieldsForTemplate(policies, templateCode) {
  return (policies.metadataOnlyPolicy?.fields ?? []).filter(
    (f) => f.templateCode === templateCode,
  );
}

// ── Remove-pending queries ─────────────────────────────────────────────────────

/**
 * Returns the remove-pending entry for (templateCode, fieldPath).
 * @returns {object|null}
 */
export function isRemovePending(policies, templateCode, fieldPath) {
  const list = policies.removeRequests?.removalRequests;
  if (!Array.isArray(list)) return null;
  return list.find(
    (r) => r.templateCode === templateCode && r.field === fieldPath,
  ) ?? null;
}

/**
 * Returns all remove-pending entries for a template.
 * @returns {object[]}
 */
export function getRemovePendingForTemplate(policies, templateCode) {
  return (policies.removeRequests?.removalRequests ?? []).filter(
    (r) => r.templateCode === templateCode,
  );
}

/**
 * Returns true when the alias entry direction is "conflict_pending_remove_decision".
 * @param {object|null} alias
 */
export function isConflictPending(alias) {
  return alias?.direction === "conflict_pending_remove_decision";
}

// ── Policy loader helpers ─────────────────────────────────────────────────────

/**
 * Builds a self-contained policies object from loadAuditPolicies() result
 * that exposes all query functions as bound methods.
 *
 * @param {string} [rootDir]
 * @returns {object} - policies object with query methods attached
 */
export function createPolicyContext(rootDir) {
  const base = loadAuditPolicies(rootDir);
  return {
    ...base,
    getAliasForField: (templateCode, fieldPath) =>
      getAliasForField(base, templateCode, fieldPath),
    getAliasesForTemplate: (templateCode) =>
      getAliasesForTemplate(base, templateCode),
    isAliasActive: (templateCode, canonicalField) =>
      isAliasActive(base, templateCode, canonicalField),
    isAliasSatisfied: (templateCode, canonicalField, renderedFields) =>
      isAliasSatisfied(base, templateCode, canonicalField, renderedFields),
    isMetadataOnlyField: (templateCode, fieldPath) =>
      isMetadataOnlyField(base, templateCode, fieldPath),
    getMetadataOnlyFieldsForTemplate: (templateCode) =>
      getMetadataOnlyFieldsForTemplate(base, templateCode),
    isRemovePending: (templateCode, fieldPath) =>
      isRemovePending(base, templateCode, fieldPath),
    getRemovePendingForTemplate: (templateCode) =>
      getRemovePendingForTemplate(base, templateCode),
    isConflictPending: (alias) => isConflictPending(alias),
  };
}
