/**
 * Resolves local form editor access without changing runtime promotion policy.
 */

import { STANDALONE_RUNTIME_TEMPLATE_CODES } from "@qllaw/form-contracts/browser";
import {
  hasRegisteredBmPanel,
  REGISTERED_BM_PANEL_CODES,
} from "@/lib/generated/bm-panel-codes.generated";

export const LOCAL_ALL_FORMS_UNLOCK_FLAG =
  "NEXT_PUBLIC_QLLAW_LOCAL_UNLOCK_ALL_FORMS" as const;

export const LOCAL_ALL_FORMS_WARNING =
  "Local development only. This flag exposes skeleton forms for testing.\n" +
  "It does not promote them to runtime-ready or customer-ready status.";

export type FormAccessTier =
  | "RUNTIME_READY"
  | "LOCAL_SKELETON"
  | "REGISTERED_RESTRICTED"
  | "UNREGISTERED";

export type FormAccessDecision = {
  readonly templateCode: string;
  readonly registered: boolean;
  readonly tier: FormAccessTier;
  readonly canOpenEditor: boolean;
  readonly canUseRuntimeDocx: boolean;
  readonly canUsePreviewSession: boolean;
  readonly canSaveLocalDraft: boolean;
  readonly canUsePersistedDraftBridge: boolean;
  readonly reason: string;
};

export type LocalUnlockEnvironment = {
  readonly nodeEnv?: string;
  readonly flagValue?: string;
  readonly isCi?: boolean;
};

/**
 * Enables the unlock only for an explicit true flag in non-CI development.
 *
 * @example
 * resolveLocalAllFormsUnlock({ nodeEnv: "development", flagValue: "true" });
 */
export function resolveLocalAllFormsUnlock(
  environment: LocalUnlockEnvironment,
): boolean {
  return (
    environment.nodeEnv === "development" &&
    environment.flagValue === "true" &&
    environment.isCi !== true
  );
}

/** Returns all BM codes whose generated editor panel is registered. */
export function listRegisteredFormCodes(): readonly string[] {
  return REGISTERED_BM_PANEL_CODES;
}

/**
 * Returns editor and output capabilities for one form code.
 *
 * @example
 * resolveFormAccess({ formCode: "BM-002", localUnlockAllForms: true });
 */
export function resolveFormAccess(input: {
  readonly formCode: string;
  readonly localUnlockAllForms: boolean;
}): FormAccessDecision {
  const templateCode = input.formCode.trim().toUpperCase();

  if (!hasRegisteredBmPanel(templateCode)) {
    return {
      templateCode,
      registered: false,
      tier: "UNREGISTERED",
      canOpenEditor: false,
      canUseRuntimeDocx: false,
      canUsePreviewSession: false,
      canSaveLocalDraft: false,
      canUsePersistedDraftBridge: false,
      reason: "UNREGISTERED_FORM",
    };
  }

  if (
    (STANDALONE_RUNTIME_TEMPLATE_CODES as readonly string[]).includes(
      templateCode,
    )
  ) {
    return {
      templateCode,
      registered: true,
      tier: "RUNTIME_READY",
      canOpenEditor: true,
      canUseRuntimeDocx: true,
      canUsePreviewSession: true,
      canSaveLocalDraft: true,
      canUsePersistedDraftBridge: false,
      reason: "REGISTERED_RUNTIME_READY",
    };
  }

  if (input.localUnlockAllForms) {
    return {
      templateCode,
      registered: true,
      tier: "LOCAL_SKELETON",
      canOpenEditor: true,
      canUseRuntimeDocx: false,
      canUsePreviewSession: false,
      canSaveLocalDraft: true,
      canUsePersistedDraftBridge: false,
      reason: "REGISTERED_LOCAL_SKELETON",
    };
  }

  return {
    templateCode,
    registered: true,
    tier: "REGISTERED_RESTRICTED",
    canOpenEditor: false,
    canUseRuntimeDocx: false,
    canUsePreviewSession: false,
    canSaveLocalDraft: false,
    canUsePersistedDraftBridge: true,
    reason: "LOCAL_UNLOCK_DISABLED",
  };
}
