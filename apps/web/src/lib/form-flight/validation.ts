/**
 * Form Flight validation — required-field gate shared by both flows.
 *
 * The runtime `/templates/:code` flow short-circuits `preview` and
 * `export` when required fields are missing. The generated-document
 * `/documents/:id` flow must apply the same gate on `save` and
 * `render` to keep behaviour identical.
 *
 * Both flows call `collectFormFlightMissingRequired(data, profile)`.
 *
 * BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX — a
 * required field is missing when ANY of the following hold:
 *
 *   - path missing or non-object → undefined → MISSING
 *   - string empty after trim     → EMPTY
 *   - string exactly matches a known stale fallback / placeholder label
 *     (e.g. "Người nhận (mẫu)", "Người ký (mẫu)",
 *           "Cá nhân/Tổ chức theo quy định.",
 *           "Tài sản theo quy định pháp luật",
 *           "Mô tả vụ việc mẫu",
 *           "Nội dung mẫu cho biểu mẫu pháp lý",
 *           "Căn cứ Điều 41 Bộ luật Tố tụng hình sự") → STALE_FALLBACK
 *   - other primitives → considered present (legacy)
 *
 * Pure functions. No React, no DOM, no fetch.
 */

import { readFormFlightPath } from "./payload";
import { isKnownStaleFallback } from "../runtime-ux/placeholder-blocklist";
import type { FormFlightProfile } from "./types";

export type FormFlightMissingField = {
  path: string;
  reason: "EMPTY" | "MISSING" | "NON_STRING" | "STALE_FALLBACK";
};

/**
 * Return the list of required paths whose value is missing, empty, or
 * matches a known stale fallback. Order matches `profile.requiredFieldPaths`.
 * Each entry explains the specific reason so adapters can produce
 * better error messages.
 */
export function collectFormFlightMissingRequired(
  data: Record<string, unknown>,
  profile: FormFlightProfile,
): FormFlightMissingField[] {
  const out: FormFlightMissingField[] = [];
  for (const path of profile.requiredFieldPaths) {
    const segments = path.split(".");
    let cursor: unknown = data;
    let isMissing = false;
    for (const segment of segments) {
      if (!cursor || typeof cursor !== "object") {
        isMissing = true;
        break;
      }
      cursor = (cursor as Record<string, unknown>)[segment];
    }
    if (isMissing) {
      out.push({ path, reason: "MISSING" });
      continue;
    }
    if (typeof cursor === "string") {
      const trimmed = cursor.trim();
      if (trimmed.length === 0) {
        out.push({ path, reason: "EMPTY" });
        continue;
      }
      if (isKnownStaleFallback(trimmed)) {
        out.push({ path, reason: "STALE_FALLBACK" });
        continue;
      }
      continue;
    }
    if (cursor === undefined || cursor === null) {
      out.push({ path, reason: "MISSING" });
      continue;
    }
    if (typeof cursor !== "string") {
      // Non-string primitives are treated as present (legacy parity
      // with the runtime workspace collectMissingRequired helper).
      continue;
    }
  }
  return out;
}

/**
 * Convenience: just the list of missing path strings (no reason).
 * Used by adapters that only need to render a missing-field list.
 */
export function listFormFlightMissingPaths(
  data: Record<string, unknown>,
  profile: FormFlightProfile,
): string[] {
  return collectFormFlightMissingRequired(data, profile).map((m) => m.path);
}

/**
 * Read every canonical `fieldPath` and return a flat dictionary of
 * non-empty values. Used by generated-document adapters that need to
 * snapshot the user-visible field set without walking the raw draft.
 */
export function snapshotFormFlightFields(
  data: Record<string, unknown>,
  profile: FormFlightProfile,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const path of profile.fieldPaths) {
    const value = readFormFlightPath(data, path);
    if (value !== undefined) out[path] = value;
  }
  return out;
}