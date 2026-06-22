/**
 * Stable semantic contract hashing for DOCX contract publish pipeline.
 *
 * Produces a deterministic SHA256 hash from the semantic content of a
 * contract, stripping volatile metadata that changes on every pipeline run
 * (timestamps, generatedAt, etc.) while preserving everything that affects
 * runtime rendering.
 *
 * Hash mode: stable-semantic-v1
 */

import { createHash } from "node:crypto";

// Fields that change on every pipeline regeneration but carry no semantic
// meaning for publish/idempotency decisions.
const VOLATILE_FIELDS = new Set([
  "generatedAt",
  "updatedAt",
  "createdAt",
  "reportGeneratedAt",
  "lockedAt",
  "publishedAt",
  // Audit metadata — extraction context, not semantic content.
  // Excluding these from the hash ensures that fixing stale rawPattern values
  // (e.g., correcting {{document.field1}} -> {{agency.name}} in evidence) does
  // not change the contract hash, preserving publish idempotency.
  "evidence",
  "reviewEvidence",
]);

// Top-level fields that carry semantic meaning for hashing.
const SEMANTIC_TOP_KEYS = new Set([
  "schemaVersion",
  "sourceId",
  "templateCode",
  "templateTitle",
  "documentKind",
  "duplicateIndex",
  "duplicateCount",
  "isDuplicateCode",
  "status",
  "extractionSource",
  "docxSlots",
  "canonicalFields",
  "renderBindings",
  "formInputHints",
  "renderFormatHints",
  "reportingHints",
  "productMetadata",
  "warnings",
  "unresolvedQuestions",
]);

// Keys inside extractionSource that are semantic.
const EXTRACTION_SOURCE_KEYS = new Set(["relativePath", "sha256", "kind", "format"]);

// Keys inside productMetadata that are semantic.
const PRODUCT_METADATA_KEYS = new Set([
  "stage",
  "formNumber",
  "legalBasisLine",
  "documentNumberSuffix",
  "reviewRequired",
  "reviewKind",
  "reviewedBy",
  "reviewedAt",
]);

/**
 * Deep-clone a plain value (handles objects, arrays, primitives).
 * @param {unknown} value
 * @returns {unknown}
 */
function deepClone(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(deepClone);
  /** @type {Record<string,unknown>} */
  const obj = /** @type {Record<string,unknown>} */ (value);
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, deepClone(v)]));
}

/**
 * Recursively sanitize a value for deterministic hashing.
 * - Removes volatile fields at every level.
 * - At top level, drops any field not in SEMANTIC_TOP_KEYS.
 * - extractionSource: keeps only semantic sub-fields.
 * - productMetadata: keeps only semantic sub-fields.
 * - Nested objects: recursively sanitizes all values.
 * - Arrays: recursively sanitizes each element, preserves order.
 * - Result object keys are sorted for determinism.
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function sanitizeForHash(value) {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeForHash);
  }

  /** @type {Record<string,unknown>} */
  const obj = /** @type {Record<string,unknown>} */ (value);

  // Determine whether this is the top-level contract object.
  const isTopLevel =
    "schemaVersion" in obj ||
    "templateCode" in obj ||
    "docxSlots" in obj;

  /** @type {Record<string,unknown>} */
  const result = {};

  for (const [k, v] of Object.entries(obj)) {
    if (VOLATILE_FIELDS.has(k)) continue;

    // At top-level, skip unknown keys.
    if (isTopLevel && !SEMANTIC_TOP_KEYS.has(k)) continue;

    // extractionSource: keep only known-semantic sub-fields.
    if (k === "extractionSource" && typeof v === "object" && v !== null) {
      /** @type {Record<string,unknown>} */
      const src = /** @type {Record<string,unknown>} */ (v);
      for (const [sk, sv] of Object.entries(src)) {
        if (EXTRACTION_SOURCE_KEYS.has(sk)) {
          result[sk] = sv;
        }
      }
      continue;
    }

    // productMetadata: keep only known-semantic sub-fields.
    if (k === "productMetadata" && typeof v === "object" && v !== null) {
      /** @type {Record<string,unknown>} */
      const meta = /** @type {Record<string,unknown>} */ (v);
      for (const [sk, sv] of Object.entries(meta)) {
        if (PRODUCT_METADATA_KEYS.has(sk)) {
          result[sk] = sanitizeForHash(sv);
        }
      }
      continue;
    }

    result[k] = sanitizeForHash(v);
  }

  // Sort keys for deterministic output.
  return Object.keys(result)
    .sort()
    .reduce((acc, key) => {
      acc[key] = result[key];
      return acc;
    }, /** @type {Record<string,unknown>} */ ({}));
}

/**
 * Deterministic JSON serializer: sorts object keys recursively so the
 * same logical object always produces the same string regardless of
 * key insertion order. Array order is preserved (semantic for slots/fields).
 *
 * @param {unknown} value
 * @returns {string}
 */
export function stableStringify(value) {
  return JSON.stringify(sanitizeForHash(value));
}

/**
 * Strip volatile metadata and normalize a contract for stable hashing.
 *
 * Removes: generatedAt, updatedAt, createdAt, reportGeneratedAt, lockedAt,
 * publishedAt.
 *
 * Retains: schemaVersion, sourceId, templateCode, templateTitle,
 * documentKind, status, docxSlots, canonicalFields, renderBindings,
 * formInputHints, renderFormatHints, reportingHints, productMetadata
 * (semantic sub-fields), extractionSource (relativePath + sha256),
 * unresolvedQuestions, warnings.
 *
 * @param {Record<string, unknown>} contract
 * @returns {Record<string, unknown>}
 */
export function canonicalizeContractForHash(contract) {
  return /** @type {Record<string, unknown>} */ (deepClone(sanitizeForHash(contract)));
}

/**
 * Compute the stable semantic SHA256 hex hash of a contract.
 *
 * @param {Record<string, unknown>} contract
 * @returns {string}
 */
export function stableContractHash(contract) {
  return createHash("sha256")
    .update(stableStringify(contract), "utf8")
    .digest("hex");
}
