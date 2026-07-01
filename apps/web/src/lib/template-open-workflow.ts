const TEMPLATE_CODE_PATTERN = /^BM-\d{3}$/;

export type PrimaryTemplateOpenTarget =
  | {
      kind: "template-preview";
      href: string;
    }
  | {
      kind: "unavailable";
      message: string;
    };

export type CaseBoundTemplateOpenTarget =
  | {
      kind: "case-picker";
    }
  | {
      kind: "case-document";
      caseId: string;
      dbTemplateId: string;
    }
  | {
      kind: "unavailable";
      message: string;
    };

export function normalizeTemplateCode(templateCode: string): string {
  const normalized = String(templateCode ?? "").trim().toUpperCase();
  if (!TEMPLATE_CODE_PATTERN.test(normalized)) {
    throw new Error(`Invalid template code: ${templateCode}`);
  }
  return normalized;
}

export function buildTemplateOpenPath(templateCode: string): string {
  return `/templates/${encodeURIComponent(normalizeTemplateCode(templateCode))}`;
}

export function isTemplateOpenable(input: {
  dbTemplateId: string | null | undefined;
  hasRuntimeContract: boolean;
  directDocumentId: string | null | undefined;
}): boolean {
  return Boolean(input.dbTemplateId || input.hasRuntimeContract || input.directDocumentId);
}

export function getPrimaryTemplateOpenTarget(input: {
  templateCode: string;
  dbTemplateId: string | null | undefined;
  hasRuntimeContract: boolean;
  directDocumentId: string | null | undefined;
}): PrimaryTemplateOpenTarget {
  const templateCode = normalizeTemplateCode(input.templateCode);

  if (!isTemplateOpenable(input)) {
    return {
      kind: "unavailable",
      message: `${templateCode} chưa có runtime contract hoặc DB template để mở.`,
    };
  }

  return {
    kind: "template-preview",
    href: buildTemplateOpenPath(templateCode),
  };
}

export function getCaseBoundTemplateOpenTarget(input: {
  templateCode: string;
  dbTemplateId: string | null | undefined;
  currentCaseId: string | null | undefined;
}): CaseBoundTemplateOpenTarget {
  const templateCode = normalizeTemplateCode(input.templateCode);

  if (!input.dbTemplateId) {
    return {
      kind: "unavailable",
      message: `${templateCode} chưa có DB template để tạo document theo hồ sơ.`,
    };
  }

  if (!input.currentCaseId) {
    return { kind: "case-picker" };
  }

  return {
    kind: "case-document",
    caseId: input.currentCaseId,
    dbTemplateId: input.dbTemplateId,
  };
}
