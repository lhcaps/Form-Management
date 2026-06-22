/**
 * Shared helpers for generic path detection.
 * Used by remediation scripts to validate proposed canonical paths
 * against the same regex used by gate-forms-213.cjs.
 *
 * The GENERIC_PATH_RE regex: /(^|\.)field(?:\d+)?(?:_|$)/iu
 * matches any dot-notation path segment containing "field" as a substring,
 * with optional trailing digits or underscore — the same pattern that
 * causes GENERIC_SLOT_PATH / GENERIC_CANONICAL_PATH blocking.
 *
 * @example
 * import { assertNotGenericPath } from './lib/generic-path.mjs';
 * assertNotGenericPath('document.fullDocumentCode', 'BM-139 agency.dongDia');
 * // throws if value matches the generic pattern
 */

/**
 * Matches generic field slots: segment contains "field" with optional suffix.
 * Same as GENERIC_RE in gate-forms-213.cjs.
 * @type {RegExp}
 */
export const GENERIC_PATH_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;

/**
 * Returns true if the given string matches the generic path pattern.
 * An empty/whitespace-only value returns false (not treated as generic).
 * @param {unknown} value
 * @returns {boolean}
 */
export function isGenericPath(value) {
  return typeof value === "string" && value.trim() !== "" && GENERIC_PATH_RE.test(value);
}

/**
 * Throws if the given path matches the generic path pattern.
 * Use this to validate any proposed canonical path before writing it.
 *
 * @param {unknown} value
 * @param {string} [context] - e.g. "BM-139 agency.dongDia"
 * @throws {Error}
 */
export function assertNotGenericPath(value, context = "path") {
  if (isGenericPath(/** @type {string} */ (value))) {
    throw new Error(
      `${context}: proposed path "${value}" matches generic path regex — ` +
        `use a semantic canonical path (no "field" substring in any segment)`,
    );
  }
}
