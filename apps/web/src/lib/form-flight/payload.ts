/**
 * Form Flight payload adapter — wraps the existing runtime-ux payload
 * builder so the generated-document adapter can use the exact same
 * sanitization semantics as `/templates/:code`.
 *
 * Pure functions. No React, no DOM, no fetch.
 *
 * Re-exported from `apps/web/src/lib/runtime-ux/runtime-preview-payload.ts`
 * with one addition: `buildFormFlightPayload` accepts the canonical
 * `FormFlightProfile` (not the UI-only `RuntimeUxProfile`) and routes
 * to the same underlying builder.
 */

import {
  buildRuntimePreviewPayloadFromDraft,
  setNestedPath,
  type BuildPayloadResult,
  type RuntimePreviewPayloadMode,
} from "../runtime-ux/runtime-preview-payload";
import type { FormFlightPayloadMode, FormFlightProfile } from "./types";

/**
 * Map the cross-flow `FormFlightPayloadMode` to the runtime payload
 * mode the existing builder understands. `save` is treated like
 * `export` — same payload, same sanitization, but the adapter
 * additionally persists the result.
 */
function toRuntimeMode(
  mode: FormFlightPayloadMode,
): RuntimePreviewPayloadMode {
  switch (mode) {
    case "demo-reset":
      return "demo-reset";
    case "preview":
    case "export":
    case "save":
      return mode === "save" ? "export" : mode;
  }
}

/**
 * Build a payload from a draft using the canonical FormFlight profile.
 *
 * `requiredFieldPaths` and `fieldPaths` from the profile are not used
 * directly here — the existing runtime builder only consults
 * `profile.demo` for sanitization. Required-field gating is owned by
 * `validation.ts` (called separately, before this function).
 */
export function buildFormFlightPayload(input: {
  draft: Record<string, unknown>;
  profile: FormFlightProfile | null;
  mode: FormFlightPayloadMode;
}): BuildPayloadResult {
  if (!input.profile) {
    return { payload: input.draft, sanitizedPaths: [], warnings: [] };
  }
  return buildRuntimePreviewPayloadFromDraft({
    draft: input.draft,
    profile: profileToUxProfile(input.profile),
    mode: toRuntimeMode(input.mode),
  });
}

/**
 * Set a value at a dot-path inside a nested record. Returns a fresh
 * object. Pure helper shared by both adapters.
 */
export const setFormFlightPath = setNestedPath;

/**
 * Read a trimmed string at a dot-path. Returns `undefined` for
 * missing / non-string / empty values. Pure helper shared by both
 * adapters (summary lines, validation, acceptance).
 */
export function readFormFlightPath(
  data: Record<string, unknown>,
  path: string,
): string | undefined {
  const segments = path.split(".");
  let cursor: unknown = data;
  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  if (typeof cursor !== "string") return undefined;
  const trimmed = cursor.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Adapter-only: convert the canonical `FormFlightProfile` to the
 * `RuntimeUxProfile` shape the existing builder expects. Both
 * adapters must call through this function — there must be no second
 * hand-written mapping anywhere.
 *
 * The conversion is intentionally narrow: it preserves the
 * fields/sections/demo summary that affect payload construction and
 * drops UI-only metadata (`sections`, `field control` overrides) that
 * only the renderer consumes.
 */
function profileToUxProfile(
  profile: FormFlightProfile,
): import("@/lib/runtime-ux/runtime-ux-profile").RuntimeUxProfile {
  return {
    templateCode: profile.templateCode,
    versionLabel: "form-flight/v1",
    sections: [],
    fields: {},
    demo: profile.demo,
    summaryLines: profile.summaryLines,
  };
}