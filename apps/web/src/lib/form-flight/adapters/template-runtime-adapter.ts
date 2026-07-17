/**
 * Form Flight — Template Runtime Adapter.
 *
 * Owns the `/templates/:code` flow. Wraps the existing
 * `template-preview-workspace.tsx` data path:
 *
 *   draft (localStorage)
 *     → buildFormFlightPayload({mode:"preview"|"export"})
 *     → POST /api/v1/forms/runtime/[code]/preview-session
 *     → DOCX download URL
 *
 * Persistence: NEVER writes generated_document DB rows. NEVER creates
 * `generatedDocumentId` values. localStorage draft only.
 *
 * Pure functions where possible. The fetch wrapper around
 * `createRuntimePreviewSession` is the only side effect.
 */

import {
  buildFormFlightPayload,
  readFormFlightPath,
} from "../payload";
import {
  collectFormFlightMissingRequired,
  listFormFlightMissingPaths,
} from "../validation";
import { resolveFormFlightSummary } from "../summary";
import { scanFormFlightAcceptance } from "../acceptance";
import { getFormFlightProfile } from "../registry";
import { isRuntimeReadyProfile } from "../profile-status";
import type {
  FormFlightAdapter,
  FormFlightPayloadMode,
  FormFlightProfile,
} from "../types";

export type TemplateRuntimeLoadDraft = () => Record<string, unknown>;
export type TemplateRuntimeSaveDraft = (
  draft: Record<string, unknown>,
) => void;
export type TemplateRuntimeCreateSession = (
  templateCode: string,
  payload: Record<string, unknown>,
) => Promise<unknown>;

export type TemplateRuntimeAdapterInput = {
  templateCode: string;
  loadDraft: TemplateRuntimeLoadDraft;
  saveDraft: TemplateRuntimeSaveDraft;
  createSession: TemplateRuntimeCreateSession;
};

/**
 * Resolve the registered Form Flight profile, but only when the profile
 * is runtime-authoritative. Audit-only / skeleton / missing profiles
 * are treated as "no profile" — the shared-core payload builder then
 * becomes a pass-through and the gates collapse to the no-profile
 * default.
 *
 * PR-A invariant repair (RESTORE_BM001_PRE_PR7B_RUNTIME_UI_AND_BLOCK_SKELETON_TAKEOVER):
 * a skeleton / audit-only profile must never become runtime-authoritative.
 */
function resolveAuthoritativeProfile(
  templateCode: string,
): FormFlightProfile | null {
  const profile = getFormFlightProfile(templateCode);
  if (!isRuntimeReadyProfile(profile)) return null;
  return profile;
}

/**
 * Build a runtime adapter for `/templates/:code`. The host (workspace
 * shell) wires `loadDraft` / `saveDraft` to localStorage and
 * `createSession` to the existing `createRuntimePreviewSession`.
 */
export function createTemplateRuntimeAdapter(
  input: TemplateRuntimeAdapterInput,
): FormFlightAdapter {
  const profile = (): FormFlightProfile | null =>
    resolveAuthoritativeProfile(input.templateCode);

  return {
    mode: "template-runtime",

    async loadDraft() {
      return input.loadDraft();
    },

    async saveDraft(draft) {
      input.saveDraft(draft);
    },

    async preview(payload) {
      const result = buildFormFlightPayload({
        draft: payload,
        profile: profile(),
        mode: "preview",
      });
      return input.createSession(input.templateCode, result.payload);
    },

    async exportDocx(payload) {
      const result = buildFormFlightPayload({
        draft: payload,
        profile: profile(),
        mode: "export",
      });
      // The runtime flow does not write DB; it sends the sanitized
      // payload to the preview-session endpoint and the host downloads
      // the DOCX from the returned URL. The "export" call returns the
      // same session shape the host already expects.
      return input.createSession(input.templateCode, result.payload);
    },
  };
}

/**
 * Convenience: validate that a draft has every required field filled
 * for the given template. Returns the list of missing paths.
 *
 * Used by the runtime workspace as the gate before `preview` /
 * `export`. Same code path as the generated-document flow.
 */
export function gateRuntimePreview(
  draft: Record<string, unknown>,
  templateCode: string,
): { ok: true } | { ok: false; missing: string[] } {
  const profile = resolveAuthoritativeProfile(templateCode);
  if (!profile) return { ok: true };
  const missing = listFormFlightMissingPaths(draft, profile);
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}

/**
 * Convenience: build the sanitized preview payload for a template.
 * Runtime host uses this to drive `createRuntimePreviewSession`.
 */
export function buildRuntimePreviewPayload(
  draft: Record<string, unknown>,
  templateCode: string,
  mode: Extract<FormFlightPayloadMode, "preview" | "export" | "demo-reset">,
) {
  return buildFormFlightPayload({
    draft,
    profile: resolveAuthoritativeProfile(templateCode),
    mode,
  });
}

/**
 * Convenience: resolve the canonical summary for the template.
 * Used by the runtime workspace summary card. Returns `null` when the
 * template has no registered profile (legacy templates still work).
 */
export function resolveRuntimeSummary(
  draft: Record<string, unknown>,
  templateCode: string,
) {
  const profile = resolveAuthoritativeProfile(templateCode);
  if (!profile) return null;
  return resolveFormFlightSummary(draft, profile);
}

/**
 * Convenience: scan the rendered DOCX text against the acceptance
 * contract. Runtime uses this to assert the post-render text passed
 * the required/forbidden check before showing "Đã tạo bản xem trước".
 */
export function acceptRuntimeRenderedText(
  renderedText: string,
  templateCode: string,
) {
  const profile = resolveAuthoritativeProfile(templateCode);
  if (!profile) return { passed: true, missingRequired: [], foundForbidden: [] };
  return scanFormFlightAcceptance(renderedText, profile);
}

/**
 * Convenience: collect the structured missing-field list (with
 * reasons) for the runtime workspace.
 */
export function listRuntimeMissingFields(
  draft: Record<string, unknown>,
  templateCode: string,
) {
  const profile = resolveAuthoritativeProfile(templateCode);
  if (!profile) return [];
  return collectFormFlightMissingRequired(draft, profile);
}

/**
 * Re-export a couple of core helpers so adapters and tests share
 * the same import surface.
 */
export { readFormFlightPath };