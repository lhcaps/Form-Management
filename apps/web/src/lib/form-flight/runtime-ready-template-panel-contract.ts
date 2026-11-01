/**
 * Maps the canonical lifecycle decision to the template-route panel. This
 * module must not repeat profile or allowlist eligibility logic.
 */

import type { FormLifecycleDecision } from "./form-lifecycle";

export type RuntimeReadyTemplatePanelKind =
  | "runtime-ready-template-panel"
  | "persisted-draft-bridge-panel"
  | "legacy-template-panel"
  | "unavailable-template-panel"
  | "generic-template-panel";

export type SelectRuntimeReadyTemplatePanelInput = {
  templateCode: string | null | undefined;
  lifecycleDecision: FormLifecycleDecision;
  diagnosticsEnabled?: boolean;
};

export type RuntimeReadyTemplatePanelDecision = {
  readonly templateCode: string;
  readonly kind: RuntimeReadyTemplatePanelKind;
  readonly reason: string;
};

export function selectRuntimeReadyTemplatePanel(
  input: SelectRuntimeReadyTemplatePanelInput,
): RuntimeReadyTemplatePanelDecision {
  const code = (input.templateCode ?? "").trim();
  if (code.length === 0) {
    return {
      templateCode: code,
      kind: "unavailable-template-panel",
      reason: "empty templateCode → unavailable template panel",
    };
  }

  if (input.lifecycleDecision.lifecycle !== "template-runtime") {
    return {
      templateCode: code,
      kind: "legacy-template-panel",
      reason: `lifecycle=${input.lifecycleDecision.lifecycle} → selector does not apply`,
    };
  }

  switch (input.lifecycleDecision.panelKind) {
    case "form-flight-runtime":
      return { templateCode: code, kind: "runtime-ready-template-panel", reason: "lifecycle panelKind=form-flight-runtime" };
    case "persisted-draft-bridge":
      return { templateCode: code, kind: "persisted-draft-bridge-panel", reason: "lifecycle panelKind=persisted-draft-bridge" };
    case "legacy":
    case "form-flight-generated":
      return { templateCode: code, kind: "legacy-template-panel", reason: `lifecycle panelKind=${input.lifecycleDecision.panelKind}` };
    case "unavailable":
      return { templateCode: code, kind: "unavailable-template-panel", reason: "lifecycle panelKind=unavailable" };
    case "generic":
      return {
        templateCode: code,
        kind: input.diagnosticsEnabled ? "generic-template-panel" : "unavailable-template-panel",
        reason: input.diagnosticsEnabled ? "lifecycle panelKind=generic with diagnostics enabled" : "lifecycle panelKind=generic fail-closed",
      };
  }
}
