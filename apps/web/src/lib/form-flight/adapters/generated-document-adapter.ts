/**
 * Form Flight — Generated Document Adapter.
 *
 * Owns the `/documents/:id` flow. Wraps the existing
 * `bm-NNN-form-inputs.tsx` + `getDocumentRenderPayload` /
 * `saveDocumentFormInputs` / `cleanupGeneratedDocumentFiles` /
 * `getDocumentHistory` call surface.
 *
 *   draft (DB render-payload)
 *     → buildFormFlightPayload({mode:"demo-reset"|"save"})
 *     → POST /api/v1/documents/generated/[id]/form-inputs
 *     → DB write + audit log + file write via existing endpoints
 *
 * Persistence: writes `generated_documents`, `generated_document_files`,
 * `generated_document_audit_logs` through the existing backend.
 * MUST NOT be reachable from `/templates/:code`.
 *
 * Pure functions where possible. The fetch wrappers are the only
 * side effects; they delegate to existing helpers in
 * `apps/web/src/lib/document-form-api.ts` and `generated-documents-api.ts`.
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

export type GeneratedDocumentLoadDraft = () => Promise<
  Record<string, unknown>
>;
export type GeneratedDocumentSaveDraft = (
  draft: Record<string, unknown>,
) => Promise<unknown>;

export type GeneratedDocumentAdapterInput = {
  documentId: string | number;
  templateCode: string;
  loadDraft: GeneratedDocumentLoadDraft;
  saveDraft: GeneratedDocumentSaveDraft;
};

/**
 * Resolve the registered Form Flight profile, but only when the profile
 * is runtime-authoritative. Audit-only / skeleton / missing profiles
 * are treated as "no profile" — the shared-core payload builder then
 * becomes a pass-through and the gates collapse to the no-profile
 * default.
 *
 * PR-A invariant repair (RESTORE_BM001_PRE_PR7B_RUNTIME_UI_AND_BLOCK_SKELETON_TAKEOVER):
 * a skeleton / audit-only profile must never become runtime-authoritative,
 * even for the generated-document flow. The BM panel / legacy render path
 * remains in charge of the document until a `runtime-ready` profile exists.
 */
function resolveAuthoritativeProfile(
  templateCode: string,
): FormFlightProfile | null {
  const profile = getFormFlightProfile(templateCode);
  if (!isRuntimeReadyProfile(profile)) return null;
  return profile;
}

/**
 * Build a generated-document adapter for `/documents/:id`. The host
 * (per-BM panel like `bm-171-form-inputs.tsx`) wires `loadDraft` /
 * `saveDraft` to the existing `getDocumentRenderPayload` /
 * `saveDocumentFormInputs` calls.
 */
export function createGeneratedDocumentAdapter(
  input: GeneratedDocumentAdapterInput,
): FormFlightAdapter {
  const profile = (): FormFlightProfile | null =>
    resolveAuthoritativeProfile(input.templateCode);

  return {
    mode: "generated-document",

    async loadDraft() {
      return input.loadDraft();
    },

    async saveDraft(draft) {
      // `save` uses `export` payload semantics — preserve user values,
      // sanitize stale fallbacks, do NOT overwrite with demo data.
      const built = buildFormFlightPayload({
        draft,
        profile: profile(),
        mode: "save",
      });
      await input.saveDraft(built.payload);
    },

    async preview(payload) {
      // Generated-document flow does not own a separate preview
      // endpoint. The same render-payload is what the renderer
      // consumes. Adapters that need a preview should use the runtime
      // adapter for the preview session; here we just return the
      // sanitized payload so the host can pass it to the renderer.
      const built = buildFormFlightPayload({
        draft: payload,
        profile: profile(),
        mode: "preview",
      });
      return built.payload;
    },

    async exportDocx(payload) {
      // Same as `preview` — generated-document flow renders from the
      // render-payload; the host panel triggers DOCX/PDF download
      // through the existing `GeneratedDocumentActionPanel`.
      const built = buildFormFlightPayload({
        draft: payload,
        profile: profile(),
        mode: "export",
      });
      return built.payload;
    },
  };
}

/**
 * Convenience: gate a save action against the canonical required-field
 * set. Returns the list of missing paths; an empty list means the
 * panel may persist.
 */
export function gateGeneratedDocumentSave(
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
 * Convenience: build the sanitized payload for a save action.
 * Equivalent to the runtime `save` adapter path — preserves user
 * values, sanitizes stale fallbacks, never overwrites with demo.
 */
export function buildGeneratedDocumentSavePayload(
  draft: Record<string, unknown>,
  templateCode: string,
) {
  return buildFormFlightPayload({
    draft,
    profile: resolveAuthoritativeProfile(templateCode),
    mode: "save",
  });
}

/**
 * Convenience: build the demo-reset payload for a generated-document
 * panel. The host panel wraps this in its own `fillSample` button.
 */
export function buildGeneratedDocumentDemoPayload(
  draft: Record<string, unknown>,
  templateCode: string,
) {
  return buildFormFlightPayload({
    draft,
    profile: resolveAuthoritativeProfile(templateCode),
    mode: "demo-reset",
  });
}

/**
 * Convenience: resolve the canonical summary for the template. Used
 * by generated-document panels that want to mirror the runtime
 * summary card without re-deriving the field set.
 */
export function resolveGeneratedDocumentSummary(
  draft: Record<string, unknown>,
  templateCode: string,
) {
  const profile = resolveAuthoritativeProfile(templateCode);
  if (!profile) return null;
  return resolveFormFlightSummary(draft, profile);
}

/**
 * Convenience: scan rendered text against the acceptance contract.
 * Used by generated-document test scripts (and any future test-report
 * surface inside `/documents/:id`).
 */
export function acceptGeneratedDocumentRenderedText(
  renderedText: string,
  templateCode: string,
) {
  const profile = resolveAuthoritativeProfile(templateCode);
  if (!profile) return { passed: true, missingRequired: [], foundForbidden: [] };
  return scanFormFlightAcceptance(renderedText, profile);
}

/**
 * Convenience: collect the structured missing-field list (with
 * reasons) for the generated-document panel.
 */
export function listGeneratedDocumentMissingFields(
  draft: Record<string, unknown>,
  templateCode: string,
) {
  const profile = resolveAuthoritativeProfile(templateCode);
  if (!profile) return [];
  return collectFormFlightMissingRequired(draft, profile);
}

/**
 * Convenience: assert that the registered profile's
 * `requiredFieldPaths` is a subset of `fieldPaths`. Returns an error
 * string when the invariant is broken (empty string when it holds).
 *
 * Used by the BM-171 shared-core tests and by future profile
 * generators.
 */
export function assertProfileInvariant(
  profile: FormFlightProfile,
): string {
  const set = new Set(profile.fieldPaths);
  for (const path of profile.requiredFieldPaths) {
    if (!set.has(path)) {
      return `Required field path "${path}" is not in fieldPaths.`;
    }
  }
  return "";
}

export { readFormFlightPath };