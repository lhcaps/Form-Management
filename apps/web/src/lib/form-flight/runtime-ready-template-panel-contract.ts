/**
 * Runtime-ready template panel contract — pure selector.
 *
 * Why this file exists
 * --------------------
 * `decideFormLifecycle(...)` (in `form-lifecycle.ts`) already decides
 * `useFormFlight` + `panelKind` per `(lifecycle, templateCode)`. But
 * `TemplatePreviewWorkspace` never reads `panelKind` — it always
 * mounts `<ContractV2Renderer>` with the legacy
 * `getRuntimeUxProfile(templateCode)` lookup. Before this phase BM-001
 * had a runtime-ready Form Flight profile yet still rendered the
 * legacy screenshot because no BM-001 runtime-ux profile existed.
 *
 * This selector is the **single source of truth** for which kind of
 * panel a runtime template page should expose. It reuses
 * `decideFormLifecycle(...)` so the rule cannot drift between the
 * generated-document and template-runtime lifecycles.
 *
 * Design constraints
 * ------------------
 * - Pure: no React, no fetch, no DOM, no side-effects.
 * - Tiny: no 213-wide framework. Profile registration is the existing
 *   `runtime-ux/index.ts` barrel's job.
 * - Reusable: any future BM-NNN promotion path goes through this
 *   selector unchanged. Promote the code in
 *   `form-lifecycle.ts#RUNTIME_READY_FORM_FLIGHT_PROFILES` AND register
 *   a `bmNNN-runtime-ux-profile.ts`; the selector then routes it to
 *   `runtime-ready-template-panel` automatically.
 *
 * Future BM-NNN contract
 * ----------------------
 * See `docs/audit/unified-bm-workspace/RUNTIME_READY_TEMPLATE_PANEL_CONTRACT.latest.md`
 * §4 for the full checklist. The selector itself stays the same.
 */

import type { FormLifecycleDecision } from "./form-lifecycle";

/**
 * Three discrete panel kinds the runtime template route can render.
 *
 * - `runtime-ready-template-panel` — the canonical Form Flight +
 *   runtime-ux panel. Today: BM-001 (after this phase) and BM-171.
 * - `legacy-template-panel` — the legacy BM-specific panel kept for
 *   compatibility (no current form lives here after this phase, but
 *   the kind is preserved so future BM-NNN migrations do not have
 *   to invent a fourth category).
 * - `generic-template-panel` — the skeleton / fail-closed fallback.
 *   Today: BM-002, the 211 skeletons, and any future code without
 *   a registered Form Flight profile.
 */
export type RuntimeReadyTemplatePanelKind =
  | "runtime-ready-template-panel"
  | "legacy-template-panel"
  | "generic-template-panel";

export type SelectRuntimeReadyTemplatePanelInput = {
  templateCode: string | null | undefined;
  lifecycleDecision: FormLifecycleDecision;
  /**
   * The host's allowlist predicate (default: `isApprovedRuntimeReadyCode`
   * from `form-lifecycle.ts`). Kept as a parameter so tests / other
   * callers can pin or override the allowlist without mutating the
   * helper.
   */
  isRuntimeReadyProfileCode: (code: string) => boolean;
};

export type RuntimeReadyTemplatePanelDecision = {
  readonly templateCode: string;
  readonly kind: RuntimeReadyTemplatePanelKind;
  readonly reason: string;
};

/**
 * Pure decision function. No React, no DOM, no fetch, no
 * `console.log`. The caller wires the result into the host (banner,
 * log line, telemetry, etc.).
 */
export function selectRuntimeReadyTemplatePanel(
  input: SelectRuntimeReadyTemplatePanelInput,
): RuntimeReadyTemplatePanelDecision {
  const { templateCode, lifecycleDecision, isRuntimeReadyProfileCode } = input;
  const code = (templateCode ?? "").trim();
  if (code.length === 0) {
    return {
      templateCode: code,
      kind: "generic-template-panel",
      reason: "empty templateCode → generic template panel (no profile to look up)",
    };
  }

  // Generated-document lifecycle: this selector scopes itself to the
  // template runtime route. The selector still names a kind, but the
  // host MUST only act on this selector for `template-runtime`. For
  // `generated-document` we return `legacy-template-panel` so the
  // selector stays total but does not contaminate the other lifecycle.
  if (lifecycleDecision.lifecycle !== "template-runtime") {
    return {
      templateCode: code,
      kind: "legacy-template-panel",
      reason: `lifecycle=${lifecycleDecision.lifecycle} → selector does not apply; route uses generated-document decision`,
    };
  }

  // Runtime-ready profile + allowlisted code → canonical panel.
  if (
    lifecycleDecision.profileStatus === "runtime-ready" &&
    isRuntimeReadyProfileCode(code)
  ) {
    return {
      templateCode: code,
      kind: "runtime-ready-template-panel",
      reason: `template-runtime + runtime-ready profile + allowlisted code → runtime-ready template panel`,
    };
  }

  // Drift guard: profile is runtime-ready but not in the allowlist.
  // This is the exact regression previous phases had to fix by hand;
  // the selector surfaces it loudly. The host may still render a
  // legacy panel (so the user is not blocked), but the contract
  // documents that this state is a programming error.
  if (lifecycleDecision.profileStatus === "runtime-ready") {
    return {
      templateCode: code,
      kind: "legacy-template-panel",
      reason: `template-runtime + runtime-ready profile but code not in allowlist → legacy template panel (drift; investigate)`,
    };
  }

  // Skeleton / missing / invalid → skeleton fail-closed.
  return {
    templateCode: code,
    kind: "generic-template-panel",
    reason: `template-runtime + profileStatus=${lifecycleDecision.profileStatus} → generic template panel (skeleton fail-closed)`,
  };
}
