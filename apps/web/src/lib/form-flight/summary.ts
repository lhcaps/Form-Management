/**
 * Form Flight summary resolver — produces the "quick-check" view that
 * mirrors the key lines of the synthesized DOCX. Same semantics as
 * the runtime `summaryLines` in `RuntimeUxProfile` (data-driven
 * functions, fall back to "—" on empty).
 *
 * Pure functions. No React, no DOM, no fetch.
 */

import type { FormFlightProfile } from "./types";

const EMPTY_PLACEHOLDER = "—";

/**
 * Resolve one summary line against a draft.
 */
export function resolveFormFlightLine(
  data: Record<string, unknown>,
  line: FormFlightProfile["summaryLines"] extends ReadonlyArray<infer L>
    ? L
    : never,
): string {
  if (typeof line.value === "function") {
    const resolved = line.value(data);
    return resolved.length > 0 ? resolved : EMPTY_PLACEHOLDER;
  }
  return line.value.length > 0 ? line.value : EMPTY_PLACEHOLDER;
}

/**
 * Resolve every summary line for a profile.
 */
export function resolveFormFlightSummary(
  data: Record<string, unknown>,
  profile: FormFlightProfile,
): Array<{ label: string; value: string }> {
  if (!profile.summaryLines) return [];
  return profile.summaryLines.map((line) => ({
    label: line.label,
    value: resolveFormFlightLine(data, line),
  }));
}