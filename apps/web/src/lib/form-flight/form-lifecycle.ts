/**
 * Form Flight — lifecycle wiring contract.
 *
 * Single source of truth for the decision "which panel should this
 * lifecycle (template-runtime / generated-document) render for this
 * templateCode?". Both lifecycles call `decideFormLifecycle(...)` so
 * the rules cannot drift between the two flows.
 *
 * Lifecycle model (do not mutate without updating the audit report):
 *
 *   1. `template-runtime` (`/templates/:templateCode`)
 *      - Runtime preview / temporary form input.
 *      - MUST NOT require a generatedDocumentId.
 *      - MUST NOT call the generated document save endpoint.
 *      - When the template has a registered runtime-ready profile, the
 *        Form Flight runtime template panel is selected.
 *      - When the profile is missing / skeleton / audit-only, the
 *        decision is "legacy / generic fallback" — the existing legacy
 *        UI path keeps serving the user.
 *
 *   2. `generated-document` (`/documents/:id`)
 *      - Generated document workspace (real DB row + audit log + file).
 *      - MUST require a real generatedDocumentId before save/read.
 *      - When the template has a registered runtime-ready profile AND a
 *        real generatedDocumentId is present, the Form Flight generated
 *        panel is selected.
 *      - When the profile is missing / skeleton / audit-only, the
 *        decision is "legacy / generic fallback" — the BM panel
 *        registry keeps serving the user.
 *
 * Skeleton / audit-only profiles are fail-closed at every level:
 *   - The shared-core `isRuntimeReadyProfile` returns false when either
 *     flag is absent or non-runtime, so a forgotten flag can never
 *     promote a skeleton.
 *   - `decideFormLifecycle` re-applies the same guard so a malformed
 *     caller cannot bypass the helper.
 *
 * The decision is a pure value — it does NOT mutate the registry, the
 * adapter instances, or any DOM. Adapters and route hosts read the
 * `panelKind` + `useFormFlight` flags and act accordingly.
 *
 * Approved runtime-ready profiles (the ONLY ones that should reach this
 * helper as "runtime-ready"): see `RUNTIME_READY_FORM_FLIGHT_PROFILES`
 * below. Adding a new entry is the one place that needs updating when
 * a form is promoted. The guard test
 * `form-lifecycle-wiring.guard.test.mjs` enforces the invariant.
 */
import { getFormFlightProfile } from "./registry";
import { isRuntimeReadyProfile } from "./profile-status";
import type { FormFlightProfile } from "./types";

/**
 * Allowed lifecycles. Mirrors `FormFlightMode` but kept here as a
 * narrow union so this module stays free of adapter imports.
 */
export type FormLifecycleKind = "template-runtime" | "generated-document";

/**
 * Canonical status the profile is read as at decision time.
 *
 * - "runtime-ready": `isRuntimeReadyProfile` accepted the profile.
 * - "skeleton":      profile exists but fails the readiness guard
 *                    (forgot runtimeReady / profileStatus flag).
 * - "missing":       no profile is registered for this templateCode.
 * - "invalid":       profile is present but malformed; treated as
 *                    missing for safety.
 */
export type FormLifecycleProfileStatus =
  | "runtime-ready"
  | "skeleton"
  | "missing"
  | "invalid";

/**
 * The panel kind the host should render.
 *
 * - "form-flight-runtime":  Form Flight runtime template panel
 *                           (`template-runtime` lifecycle only).
 * - "form-flight-generated": Form Flight generated document panel
 *                           (`generated-document` lifecycle only).
 * - "legacy":               Existing BM-specific panel (e.g.
 *                           `bm-001-form-inputs.tsx`) or the generic
 *                           fallback.
 * - "generic":              The generic template form inputs panel
 *                           (no per-BM UI override exists).
 */
export type FormLifecyclePanelKind =
  | "form-flight-runtime"
  | "form-flight-generated"
  | "legacy"
  | "generic";

/**
 * Pure decision object. Routes and adapters read this and route
 * accordingly. No side effects, no React, no fetch.
 */
export type FormLifecycleDecision = {
  readonly templateCode: string;
  readonly lifecycle: FormLifecycleKind;
  readonly profileStatus: FormLifecycleProfileStatus;
  readonly useFormFlight: boolean;
  readonly panelKind: FormLifecyclePanelKind;
  readonly hasRealGeneratedDocumentId: boolean;
  readonly reason: string;
};

/**
 * Approved runtime-ready profiles. Adding a new form means appending
 * an `import "@/lib/form-flight/profiles/bmXXX"` here AND registering
 * `BMXXX_FORM_FLIGHT_PROFILE` with `runtimeReady: true` in that file.
 *
 * The list is intentionally explicit (no auto-discovery from the
 * `profiles/` folder). Skeletons must NOT appear here.
 */
export const RUNTIME_READY_FORM_FLIGHT_PROFILES = [
  "BM-001",
  "BM-171",
] as const;

export type RuntimeReadyFormFlightCode =
  (typeof RUNTIME_READY_FORM_FLIGHT_PROFILES)[number];

/**
 * Side-effect registration helper. Imported from
 * `template-preview-workspace.tsx` and from the generated document
 * adapter tests so the registry is consistently seeded for the
 * approved set.
 *
 * Adding a new approved profile = (a) appending the code to
 * `RUNTIME_READY_FORM_FLIGHT_PROFILES` and (b) adding the import here.
 *
 * Adding the import here is a TS-level action; the side-effect
 * registration happens in the imported profile module itself
 * (`registerFormFlightProfile(BMxxx_FORM_FLIGHT_PROFILE)` at the
 * bottom of each profile file).
 */
export function registerRuntimeReadyFormFlightProfiles(): void {
  void _runtimeReadyImports;
}

// `void` keeps this as a side-effect import set without exporting
// anything. Each import below triggers the profile module's
// `registerFormFlightProfile(...)` call.
import * as _runtimeReadyImports from "./profiles/bm001";
import * as _runtimeReadyImportsBm171 from "./profiles/bm171";

/**
 * Pure decision function. Both lifecycles (`/templates/:code` and
 * `/documents/:id`) call this so the rules live in one place.
 *
 * Inputs:
 *   - lifecycle:                 which flow is calling the helper.
 *   - templateCode:              which template this is for.
 *   - hasRealGeneratedDocumentId: required when lifecycle is
 *                                 `generated-document`; ignored when
 *                                 lifecycle is `template-runtime`.
 *
 * Output:
 *   - A `FormLifecycleDecision` value with `useFormFlight` and
 *     `panelKind` flags the host can branch on.
 *
 * Invariants enforced:
 *   - `template-runtime` NEVER sets `useFormFlight=true` when the
 *     profile is missing / skeleton / invalid.
 *   - `template-runtime` NEVER reports `hasRealGeneratedDocumentId=true`
 *     — that flag belongs only to the generated-document flow.
 *   - `generated-document` NEVER sets `useFormFlight=true` unless the
 *     profile is runtime-ready AND a real `generatedDocumentId` is
 *     present. (The caller is responsible for passing the real id —
 *     the helper treats anything non-empty as "present".)
 */
export function decideFormLifecycle(input: {
  lifecycle: FormLifecycleKind;
  templateCode: string;
  hasRealGeneratedDocumentId?: boolean;
}): FormLifecycleDecision {
  const { lifecycle, templateCode } = input;
  const hasRealGeneratedDocumentId =
    lifecycle === "generated-document"
      ? Boolean(input.hasRealGeneratedDocumentId)
      : false;

  const profile = getFormFlightProfile(templateCode);
  const profileStatus = classifyProfileStatus(profile);

  if (lifecycle === "template-runtime") {
    if (profileStatus === "runtime-ready") {
      return {
        templateCode,
        lifecycle,
        profileStatus,
        useFormFlight: true,
        panelKind: "form-flight-runtime",
        hasRealGeneratedDocumentId: false,
        reason: "template-runtime + runtime-ready profile → Form Flight runtime panel",
      };
    }
    return {
      templateCode,
      lifecycle,
      profileStatus,
      useFormFlight: false,
      panelKind: pickLegacyPanelKind(templateCode),
      hasRealGeneratedDocumentId: false,
      reason:
        profileStatus === "missing"
          ? "template-runtime + no profile → legacy / generic fallback"
          : `template-runtime + ${profileStatus} profile → legacy / generic fallback (fail-closed)`,
    };
  }

  // generated-document
  if (profileStatus === "runtime-ready" && hasRealGeneratedDocumentId) {
    return {
      templateCode,
      lifecycle,
      profileStatus,
      useFormFlight: true,
      panelKind: "form-flight-generated",
      hasRealGeneratedDocumentId: true,
      reason:
        "generated-document + runtime-ready profile + real generatedDocumentId → Form Flight generated panel",
    };
  }
  return {
    templateCode,
    lifecycle,
    profileStatus,
    useFormFlight: false,
    panelKind: pickLegacyPanelKind(templateCode),
    hasRealGeneratedDocumentId,
    reason: !hasRealGeneratedDocumentId
      ? "generated-document + no real generatedDocumentId → legacy / generic fallback (fail-closed)"
      : `generated-document + ${profileStatus} profile → legacy / generic fallback (fail-closed)`,
  };
}

/**
 * Coarse panel selection for the legacy / generic fallback path. Today
 * the legacy UI is just "use the BM panel if registered, else the
 * generic panel"; this helper centralises that rule so we don't have
 * to repeat it in every call site.
 */
function pickLegacyPanelKind(templateCode: string): FormLifecyclePanelKind {
  // We deliberately do NOT import the BM panel registry here. The
  // legacy decision is "use what the host already has wired". The
  // generated-document-workspace already maps `BM_PANEL_BY_CODE`;
  // the template-preview-workspace uses `getRuntimeUxProfile(...)`.
  // If the code has a registered runtime-ux profile, the legacy
  // fallback is still acceptable — that is exactly the BM-171 path
  // today.
  if (RUNTIME_READY_FORM_FLIGHT_PROFILES.includes(
    templateCode as RuntimeReadyFormFlightCode,
  )) {
    return "legacy";
  }
  return "generic";
}

/**
 * Classify the registered profile. Returns "missing" when no profile
 * is registered, "skeleton" when the registered profile fails the
 * runtime-readiness guard, and "invalid" when the profile object is
 * malformed (defensive — should never happen with hand-authored
 * profiles).
 */
function classifyProfileStatus(
  profile: FormFlightProfile | null,
): FormLifecycleProfileStatus {
  if (!profile) return "missing";
  if (!profile.templateCode || typeof profile.templateCode !== "string") {
    return "invalid";
  }
  if (isRuntimeReadyProfile(profile)) return "runtime-ready";
  return "skeleton";
}

/**
 * Diagnostics helper. Returns the list of approved runtime-ready
 * profile codes. Source of truth is `RUNTIME_READY_FORM_FLIGHT_PROFILES`
 * above — used by the guard test and by the wiring matrix artifacts.
 */
export function listApprovedRuntimeReadyCodes(): readonly RuntimeReadyFormFlightCode[] {
  return RUNTIME_READY_FORM_FLIGHT_PROFILES;
}

/**
 * Returns the runtime-readiness verdict for a given templateCode
 * against the approved list + registered profile. Pure.
 */
export function isApprovedRuntimeReadyCode(
  templateCode: string,
): templateCode is RuntimeReadyFormFlightCode {
  return (RUNTIME_READY_FORM_FLIGHT_PROFILES as readonly string[]).includes(
    templateCode,
  );
}