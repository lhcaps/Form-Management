/**
 * Cross-surface policy for the persisted generated-document bridge.
 * It contains route eligibility only, so API and web use the same safe rule.
 *
 * `STANDALONE_RUNTIME_TEMPLATE_CODES` is the form-flight standalone-template
 * runtime-ready allowlist. This is the small (11-form) baseline of forms
 * with REAL_UI form-flight profiles. It is intentionally distinct from
 * `RUNTIME_READY_FORM_CODES` (the form-contracts generated-document bridge
 * roster of 25 forms with REAL_UI / PHASE14_BROWSER_PROMOTED evidence).
 *
 * The two surfaces serve different lifecycles:
 * - STANDALONE_RUNTIME_TEMPLATE_CODES → `/templates/:code` runtime route.
 * - RUNTIME_READY_FORM_CODES          → `/documents/:id` generated-document
 *                                        bridge / persistence path.
 *
 * Both are read-only at runtime; do not edit the literal array below.
 */

import { RUNTIME_READY_FORM_CODES } from "./runtime-readiness.generated";

/** Synthetic value used only to verify unknown-form failures remain fail-closed. */
export const UNREGISTERED_FORM_CANARY = '__UNREGISTERED_FORM_CANARY__' as const;

/**
 * Canonical list of Form Flight codes that are considered `runtimeReady`
 * for the standalone template route. These are the 11 baseline forms
 * with hand-authored form-flight profiles. BM-200 is a real, non-promoted
 * form and must not be used as a failure canary.
 *
 * Aliased to the generated roster — see ./runtime-readiness.generated.ts.
 */
export const STANDALONE_RUNTIME_TEMPLATE_CODES = [
  "BM-001",
  "BM-136",
  "BM-148",
  "BM-156",
  "BM-157",
  "BM-168",
  "BM-171",
  "BM-174",
  "BM-181",
  "BM-206",
  "BM-213",
] as const;

/** Re-export the generated-document bridge roster for cross-surface use. */
export { RUNTIME_READY_FORM_CODES };

export const PERSISTED_DRAFT_BRIDGE_RENDER_SCOPES = [
  'CASE_LEVEL',
  'PERSON_LEVEL',
  'SELECTED_PERSONS',
] as const;

export function isStandaloneRuntimeTemplateCode(value: string): boolean {
  return (STANDALONE_RUNTIME_TEMPLATE_CODES as readonly string[]).includes(value);
}

export function isPersistedDraftBridgeRenderScope(
  value: string | null | undefined,
): value is (typeof PERSISTED_DRAFT_BRIDGE_RENDER_SCOPES)[number] {
  return (PERSISTED_DRAFT_BRIDGE_RENDER_SCOPES as readonly string[]).includes(
    value ?? '',
  );
}

export function getPersistedDraftBridgeIneligibilityReason(input: {
  templateCode: string;
  renderScope: string | null | undefined;
}): string | null {
  if (input.templateCode === UNREGISTERED_FORM_CANARY) {
    return 'UNREGISTERED_FORM';
  }
  if (isStandaloneRuntimeTemplateCode(input.templateCode)) {
    return 'STANDALONE_RUNTIME_TEMPLATE';
  }
  if (!isPersistedDraftBridgeRenderScope(input.renderScope)) {
    return 'UNSUPPORTED_RENDER_SCOPE';
  }
  return null;
}
