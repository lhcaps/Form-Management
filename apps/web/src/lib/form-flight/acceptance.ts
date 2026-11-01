/**
 * Form Flight acceptance scanner — verifies the rendered DOCX/PDF text
 * contains the required anchors and never leaks forbidden garbage.
 *
 * The runtime and generated-document flows both render the same DOCX,
 * so the same acceptance scan applies to both. Future templates plug
 * in their own `acceptance.requiredText` / `acceptance.forbiddenText`
 * lists in their profile module.
 *
 * Pure functions. No React, no DOM, no fetch.
 */

import type { FormFlightProfile } from "./types";

export type FormFlightAcceptanceResult = {
  passed: boolean;
  missingRequired: string[];
  foundForbidden: string[];
};

/**
 * Scan rendered text against the profile's acceptance contract.
 *
 * - `requiredText`: each entry MUST appear in `text` (substring match,
 *   case-insensitive, trimmed). Missing entries are reported in
 *   `missingRequired`.
 * - `forbiddenText`: each entry MUST NOT appear in `text` (substring
 *   match, case-insensitive, trimmed). Found entries are reported in
 *   `foundForbidden`.
 *
 * Empty text always fails any non-empty requiredText contract.
 */
export function scanFormFlightAcceptance(
  text: string,
  profile: FormFlightProfile,
): FormFlightAcceptanceResult {
  const normalized = text.trim().toLowerCase();

  const missingRequired: string[] = [];
  for (const anchor of profile.acceptance.requiredText) {
    const needle = anchor.trim().toLowerCase();
    if (needle.length === 0) continue;
    if (!normalized.includes(needle)) missingRequired.push(anchor);
  }

  const foundForbidden: string[] = [];
  for (const anchor of profile.acceptance.forbiddenText) {
    const needle = anchor.trim().toLowerCase();
    if (needle.length === 0) continue;
    if (normalized.includes(needle)) foundForbidden.push(anchor);
  }

  return {
    passed: missingRequired.length === 0 && foundForbidden.length === 0,
    missingRequired,
    foundForbidden,
  };
}