/**
 * BM-171 runtime preview payload — sanitization between user draft, demo
 * fixture, and known stale fallback garbage.
 *
 * Three modes:
 *  - `demo-reset`: the user clicked the demo/sample button. Reset every
 *    profile path to the demo value. Intentionally overwrites any user
 *    value at those paths. Required-field placeholder values in `demo`
 *    are forbidden — `BM171_DEMO` MUST contain real synthetic names
 *    (real synthetic names, not placeholder labels like "(mẫu)").
 *  - `preview` / `export`: the user clicked Xem trước bản in / Tải DOCX.
 *    Preserve every valid user-typed value. Treat the path as missing
 *    (clear it, emit warning) when:
 *      (a) the path is empty (do NOT auto-fill silently — required
 *          validation will fire and the gate will block render), or
 *      (b) the value is a known stale fallback (placeholder labels like
 *          "Người nhận (mẫu)" / "Người ký (mẫu)" or legacy auto-generated
 *          strings like "Căn cứ Điều 41 Bộ luật Tố tụng hình sự") — the
 *          path is cleared and the field counts as missing required.
 *
 *    BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX: a
 *    required field is missing if the value is empty after trim, OR the
 *    value exactly matches a known stale fallback. We never auto-replace
 *    stale user input with the demo value — the user must type a real
 *    value or click the demo-reset button to opt in to demo data.
 *
 * Pure functions. No DOM, no React, no fetches. Safe to import from tests.
 */

import type { RuntimeUxProfile } from "./runtime-ux-profile";
import { isKnownStaleFallback, listKnownStaleFallbacks } from "./placeholder-blocklist";

export { isKnownStaleFallback, listKnownStaleFallbacks };

export type RuntimePreviewPayloadMode =
  | "demo-reset"
  | "preview"
  | "export";

export interface BuildPayloadInput {
  draft: Record<string, unknown>;
  profile: RuntimeUxProfile | null;
  mode: RuntimePreviewPayloadMode;
}

export interface BuildPayloadWarning {
  path: string;
  code:
    | "STALE_FALLBACK_CLEARED"
    | "STALE_FALLBACK_DEMO_MISSING"
    | "DEMO_VALUE_IS_STALE"
    | "DEMO_VALUE_IS_PLACEHOLDER";
  message: string;
  originalValue: string;
  replacedWith: string;
}

export interface BuildPayloadResult {
  payload: Record<string, unknown>;
  sanitizedPaths: string[];
  warnings: BuildPayloadWarning[];
}

/**
 * Set a value at a dot-path inside a nested record. Returns a fresh object.
 * Mirrors the private `setNestedPath` previously inlined in
 * `template-preview-workspace.tsx`.
 */
export function setNestedPath(
  data: Record<string, unknown>,
  path: string,
  value: string | undefined,
): Record<string, unknown> {
  const next: Record<string, unknown> =
    typeof structuredClone === "function"
      ? structuredClone(data)
      : JSON.parse(JSON.stringify(data));
  if (!path.includes(".")) {
    if (value === undefined) {
      delete next[path];
    } else {
      next[path] = value;
    }
    return next;
  }
  const segments = path.split(".");
  let cursor: Record<string, unknown> = next;
  for (const segment of segments.slice(0, -1)) {
    const existing = cursor[segment];
    const child: Record<string, unknown> =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};
    cursor[segment] = child;
    cursor = child;
  }
  const leaf = segments[segments.length - 1];
  if (value === undefined) {
    delete cursor[leaf];
  } else {
    cursor[leaf] = value;
  }
  return next;
}

/** Read the trimmed string at a dot-path inside a nested record. */
function readAtPath(
  data: Record<string, unknown>,
  path: string,
): string | null {
  const segments = path.split(".");
  let cursor: unknown = data;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") return null;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (typeof cursor !== "string") return null;
  const trimmed = cursor.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Build the payload to send to the runtime preview / export backend.
 *
 * mode:
 *  - "demo-reset": every profile.demo path is forced to its demo value.
 *    User edits at those paths are intentionally overwritten — this is
 *    what the "Dữ liệu demo" button should do. If the demo value itself
 *    is empty or a known stale fallback, the demo-reset surface emits
 *    `DEMO_VALUE_IS_PLACEHOLDER` / `DEMO_VALUE_IS_STALE` warnings so
 *    profile authors see the leak instead of silently filling the
 *    payload with garbage.
 *  - "preview" | "export": preserve valid user-typed values, only sanitize:
 *      • empty → leave empty (do not auto-fill silently — required
 *        validation will fire server-side and missingRequired will
 *        surface to the user).
 *      • matches a known stale fallback → CLEAR the path (the value is
 *        treated as missing required; the gate will block render). Never
 *        preserve the stale value, never auto-replace with the demo.
 *      • otherwise → preserve unchanged.
 *
 * The function never mutates `draft`. `profile.demo` is read-only here.
 *
 * Returned `warnings` is non-empty in cases where sanitization had to
 * clear a stale value or where the demo value itself looks like a
 * placeholder/stale fallback. Both are surfaced to the UI so the
 * operator knows which fields are blocking render.
 */
export function buildRuntimePreviewPayloadFromDraft(
  input: BuildPayloadInput,
): BuildPayloadResult {
  const { draft, profile, mode } = input;

  if (!profile) {
    // Without a profile, the payload is the draft as-is. No sanitization.
    return { payload: draft, sanitizedPaths: [], warnings: [] };
  }

  if (mode === "demo-reset") {
    let next = draft;
    const sanitizedPaths: string[] = [];
    const warnings: BuildPayloadWarning[] = [];
    for (const [path, value] of Object.entries(profile.demo)) {
      const cleaned = (value ?? "").trim();
      if (cleaned.length === 0) {
        next = setNestedPath(next, path, undefined);
        sanitizedPaths.push(path);
        warnings.push({
          path,
          code: "DEMO_VALUE_IS_PLACEHOLDER",
          message: `Demo value for '${path}' is empty. Field will be left blank.`,
          originalValue: "",
          replacedWith: "",
        });
        continue;
      }
      if (isKnownStaleFallback(cleaned)) {
        // Demo value itself is a placeholder/stale fallback. Clear the
        // path rather than overwriting valid user data with garbage.
        next = setNestedPath(next, path, undefined);
        sanitizedPaths.push(path);
        warnings.push({
          path,
          code: "DEMO_VALUE_IS_STALE",
          message: `Demo value for '${path}' is itself a stale fallback ('${cleaned}'). Field will be left blank so the operator is forced to type a real value.`,
          originalValue: cleaned,
          replacedWith: "",
        });
        continue;
      }
      next = setNestedPath(next, path, value);
      sanitizedPaths.push(path);
    }
    return {
      payload: next,
      sanitizedPaths,
      warnings,
    };
  }

  // mode === 'preview' | 'export'
  let next = draft;
  const sanitizedPaths: string[] = [];
  const warnings: BuildPayloadWarning[] = [];

  for (const [path] of Object.entries(profile.demo)) {
    const current = readAtPath(draft, path);
    if (current === null) {
      // Path is empty/missing. Keep empty. Required validation runs
      // server-side and surfaces in previewSession.missingRequired.
      continue;
    }
    if (isKnownStaleFallback(current)) {
      // Required-field placeholder / stale value: clear the path. The
      // missing-required gate will block render. NEVER preserve the
      // stale value, NEVER auto-replace with the demo.
      next = setNestedPath(next, path, undefined);
      sanitizedPaths.push(path);
      warnings.push({
        path,
        code: "STALE_FALLBACK_CLEARED",
        message: `Stale fallback at '${path}' was treated as missing required (placeholder value '${current}' cleared). Field will block render until a real value is provided.`,
        originalValue: current,
        replacedWith: "",
      });
      continue;
    }
    // else: valid user-typed value — keep unchanged.
  }

  return { payload: next, sanitizedPaths, warnings };
}
