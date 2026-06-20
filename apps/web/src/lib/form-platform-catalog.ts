export type FormLifecycleStatus =
  | "NOT_INITIALIZED"
  | "DRAFT"
  | "CHANGES_REQUESTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";

export type FormRuntimeSource =
  | "AGENCY_PUBLISHED"
  | "GLOBAL_PUBLISHED"
  | "LOCKED_FILE"
  | "LEGACY_BESPOKE"
  | "GENERIC_FALLBACK"
  | "UNAVAILABLE";

const LIFECYCLE_LABELS: Record<FormLifecycleStatus, string> = {
  NOT_INITIALIZED: "Chưa khởi tạo",
  DRAFT: "Đang biên tập",
  CHANGES_REQUESTED: "Cần chỉnh sửa",
  IN_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
};

const STUDIO_ACTIONS: Record<
  FormLifecycleStatus,
  { label: string; opensExistingVersion: boolean }
> = {
  NOT_INITIALIZED: {
    label: "Mở thiết kế",
    opensExistingVersion: false,
  },
  DRAFT: {
    label: "Tiếp tục chỉnh sửa",
    opensExistingVersion: true,
  },
  CHANGES_REQUESTED: {
    label: "Tiếp tục chỉnh sửa",
    opensExistingVersion: true,
  },
  IN_REVIEW: {
    label: "Xem bản chờ duyệt",
    opensExistingVersion: true,
  },
  APPROVED: {
    label: "Xem và xuất bản",
    opensExistingVersion: true,
  },
  PUBLISHED: {
    label: "Tạo phiên bản mới",
    opensExistingVersion: false,
  },
  ARCHIVED: {
    label: "Xem lịch sử",
    opensExistingVersion: true,
  },
};

export function lifecycleLabel(status: FormLifecycleStatus): string {
  return LIFECYCLE_LABELS[status];
}

export function studioPrimaryAction(status: FormLifecycleStatus) {
  return STUDIO_ACTIONS[status];
}

export function runtimeBadge(
  source: FormRuntimeSource,
  available: boolean,
): {
  label: string;
  tone: "success" | "info" | "warning" | "legacy" | "neutral" | "danger";
} {
  if (!available || source === "UNAVAILABLE") {
    return { label: "Chưa sẵn sàng", tone: "danger" };
  }

  switch (source) {
    case "AGENCY_PUBLISHED":
      return { label: "Published contract", tone: "success" };
    case "GLOBAL_PUBLISHED":
      return { label: "Published contract", tone: "info" };
    case "LOCKED_FILE":
      return { label: "Locked verified", tone: "warning" };
    case "LEGACY_BESPOKE":
      return { label: "Legacy bespoke", tone: "legacy" };
    case "GENERIC_FALLBACK":
      return { label: "Generic fallback", tone: "neutral" };
  }
}

export function mergeCanonicalFormCatalog<
  TLegal extends { code: string },
  TPlatform extends { templateCode: string },
>(
  legalItems: readonly TLegal[],
  platformItems: readonly TPlatform[],
): Array<TLegal & { platform: TPlatform | null }> {
  const platformByCode = new Map(
    platformItems.map((item) => [item.templateCode, item]),
  );
  const seen = new Set<string>();
  const result: Array<TLegal & { platform: TPlatform | null }> = [];

  for (const item of legalItems) {
    if (seen.has(item.code)) continue;
    seen.add(item.code);
    result.push({
      ...item,
      platform: platformByCode.get(item.code) ?? null,
    });
  }

  return result;
}

export function collectDocxSlotOptions(contract: {
  renderBindings: Array<{
    target:
      | { kind: "SLOT"; slotId: string }
      | { kind: "TABLE"; tableKey: string };
  }>;
}): string[] {
  return [
    ...new Set(
      contract.renderBindings
        .filter(
          (
            binding,
          ): binding is {
            target: { kind: "SLOT"; slotId: string };
          } => binding.target.kind === "SLOT",
        )
        .map((binding) => binding.target.slotId),
    ),
  ].sort();
}
