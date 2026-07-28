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
 * below. Promote a form through the shared bridge-eligibility policy, then
 * add its side-effect registration import below. The guard test
 * `form-lifecycle-wiring.guard.test.mjs` enforces the invariant.
 */
import { hasRegisteredBmPanel } from "@/lib/generated/bm-panel-codes.generated";
import { STANDALONE_RUNTIME_TEMPLATE_CODES } from "@qllaw/form-contracts/browser";
import {
  resolveFormAccess,
  type FormAccessDecision,
} from "./local-form-access-policy";
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
 * - "persisted-draft-bridge": Skeleton form with registered legacy panel;
 *                           create/reuse draft then redirect to /documents/:id.
 * - "generic":              The generic template form inputs panel
 *                           (no per-BM UI override exists).
 * - "unavailable":          The code is not registered at all.
 */
export type FormLifecyclePanelKind =
  | "form-flight-runtime"
  | "form-flight-generated"
  | "legacy"
  | "persisted-draft-bridge"
  | "generic"
  | "unavailable";

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
  readonly access: FormAccessDecision;
  readonly hasRealGeneratedDocumentId: boolean;
  readonly reason: string;
};

/**
 * Approved runtime-ready profiles. Their codes come from the shared
 * bridge-eligibility policy. Adding a promoted form means adding its
 * side-effect `import "@/lib/form-flight/profiles/bmXXX"` here AND
 * registering `BMXXX_FORM_FLIGHT_PROFILE` with `runtimeReady: true` in
 * that file.
 *
 * The list is intentionally explicit (no auto-discovery from the
 * `profiles/` folder). Skeletons must NOT appear here.
 */
export const RUNTIME_READY_FORM_FLIGHT_PROFILES =
  STANDALONE_RUNTIME_TEMPLATE_CODES;

export type RuntimeReadyFormFlightCode =
  (typeof RUNTIME_READY_FORM_FLIGHT_PROFILES)[number];

/**
 * Side-effect registration helper. Imported from
 * `template-preview-workspace.tsx` and from the generated document
 * adapter tests so the registry is consistently seeded for the
 * approved set.
 *
 * Adding a new approved profile = (a) promoting it in the shared policy and
 * (b) adding the import here.
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
// `registerFormFlightProfile(...)` call. The order mirrors
// `STANDALONE_RUNTIME_TEMPLATE_CODES` (canonical sorted order from
// the shared bridge-eligibility policy).
import * as _runtimeReadyImports from "./profiles/bm001";
import * as _runtimeReadyImportsBm171 from "./profiles/bm171";
import * as _runtimeReadyImportsBm136 from "./profiles/bm136";
import * as _runtimeReadyImportsBm148 from "./profiles/bm148";
import * as _runtimeReadyImportsBm156 from "./profiles/bm156";
import * as _runtimeReadyImportsBm157 from "./profiles/bm157";
import * as _runtimeReadyImportsBm168 from "./profiles/bm168";
import * as _runtimeReadyImportsBm174 from "./profiles/bm174";
import * as _runtimeReadyImportsBm181 from "./profiles/bm181";
import * as _runtimeReadyImportsBm206 from "./profiles/bm206";
import * as _runtimeReadyImportsBm213 from "./profiles/bm213";

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
  localUnlockAllForms?: boolean;
}): FormLifecycleDecision {
  const { lifecycle, templateCode } = input;
  const access = resolveFormAccess({
    formCode: templateCode,
    localUnlockAllForms: input.localUnlockAllForms === true,
  });
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
        access,
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
      access,
      profileStatus,
      useFormFlight: false,
      panelKind: access.tier === "LOCAL_SKELETON"
        ? "generic"
        : pickTemplateRuntimeFallbackPanel(templateCode),
      hasRealGeneratedDocumentId: false,
      reason:
        access.tier === "LOCAL_SKELETON"
          ? "template-runtime + explicit local unlock → local skeleton editor"
          : profileStatus === "missing"
            ? "template-runtime + no profile → persisted-draft-bridge or unavailable"
            : `template-runtime + ${profileStatus} profile → persisted-draft-bridge or unavailable (fail-closed)`,
    };
  }

  // generated-document
  if (profileStatus === "runtime-ready" && hasRealGeneratedDocumentId) {
    return {
      templateCode,
      lifecycle,
      access,
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
    access,
    profileStatus,
    useFormFlight: false,
    panelKind: pickGeneratedDocumentFallbackPanel(templateCode),
    hasRealGeneratedDocumentId,
    reason: !hasRealGeneratedDocumentId
      ? "generated-document + no real generatedDocumentId → legacy / generic fallback (fail-closed)"
      : `generated-document + ${profileStatus} profile → legacy / generic fallback (fail-closed)`,
  };
}

/**
 * Panel selection for template-runtime lifecycle fallback.
 * When profile is skeleton, check if a legacy panel exists to enable bridge.
 *
 * CRITICAL: This is ONLY for /templates/:code route.
 * Do NOT use this for generated-document lifecycle.
 */
function pickTemplateRuntimeFallbackPanel(
  templateCode: string,
): FormLifecyclePanelKind {
  const hasBmPanel = checkBmPanelExists(templateCode);
  if (hasBmPanel) {
    return "persisted-draft-bridge";
  }

  return "unavailable";
}

/**
 * Panel selection for generated-document lifecycle fallback.
 * When profile is skeleton or missing real ID, use existing legacy panel.
 *
 * CRITICAL: This is ONLY for /documents/:id route.
 * NEVER return "persisted-draft-bridge" here - the document already exists!
 */
function pickGeneratedDocumentFallbackPanel(
  templateCode: string,
): FormLifecyclePanelKind {
  const hasBmPanel = checkBmPanelExists(templateCode);
  if (hasBmPanel) {
    return "legacy";
  }

  return "generic";
}

/**
 * Check if a BM panel exists for the given template code.
 * Uses metadata-only module to avoid importing 213 React components.
 */
function checkBmPanelExists(templateCode: string): boolean {
  return hasRegisteredBmPanel(templateCode);
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
