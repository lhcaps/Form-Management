export function buildRuntimeTemplateDraftKey(
  templateCode: string,
  contractHash: string,
): string {
  return `qllaw:runtime-template-draft:${templateCode.trim().toUpperCase()}:${contractHash}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function loadRuntimeTemplateDraft(
  storage: Pick<Storage, "getItem">,
  templateCode: string,
  contractHash: string,
): Record<string, unknown> | null {
  const raw = storage.getItem(
    buildRuntimeTemplateDraftKey(templateCode, contractHash),
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveRuntimeTemplateDraft(
  storage: Pick<Storage, "setItem">,
  templateCode: string,
  contractHash: string,
  data: Record<string, unknown>,
): void {
  storage.setItem(
    buildRuntimeTemplateDraftKey(templateCode, contractHash),
    JSON.stringify(data),
  );
}

export function removeRuntimeTemplateDraft(
  storage: Pick<Storage, "removeItem">,
  templateCode: string,
  contractHash: string,
): void {
  storage.removeItem(
    buildRuntimeTemplateDraftKey(templateCode, contractHash),
  );
}
