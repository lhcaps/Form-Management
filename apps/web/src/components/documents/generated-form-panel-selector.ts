export type GeneratedFormPanelProfileStatus =
  | "runtime-ready"
  | "audit-only"
  | "skeleton"
  | "persisted-ready"
  | "generated-ready"
  | "published";

export type GeneratedFormPanelDecision =
  | "bm-panel"
  | "published-runtime"
  | "generic";

type SelectGeneratedFormPanelInput = {
  templateCode: string | null | undefined;
  bmPanel: unknown;
  publishedRuntime: unknown;
  profileStatus?: GeneratedFormPanelProfileStatus | null;
};

function canPublishedRuntimeOverrideBmPanel(
  profileStatus: GeneratedFormPanelProfileStatus | null | undefined,
): boolean {
  return (
    profileStatus === "persisted-ready" ||
    profileStatus === "generated-ready" ||
    profileStatus === "published"
  );
}

export function selectGeneratedFormPanel({
  templateCode,
  bmPanel,
  publishedRuntime,
  profileStatus,
}: SelectGeneratedFormPanelInput): GeneratedFormPanelDecision {
  const hasTemplateCode = Boolean(templateCode && templateCode.trim().length > 0);
  const hasBmPanel = Boolean(hasTemplateCode && bmPanel);
  const hasPublishedRuntime = Boolean(publishedRuntime);

  if (hasBmPanel && !canPublishedRuntimeOverrideBmPanel(profileStatus)) {
    return "bm-panel";
  }

  if (hasPublishedRuntime) {
    return "published-runtime";
  }

  if (hasBmPanel) {
    return "bm-panel";
  }

  return "generic";
}
