import type { CompiledFormContract } from "@qllaw/form-contracts";
import { readApi } from "./api-client";

export type FormPlatformCatalogItem = {
  templateId: string;
  templateCode: string;
  title: string;
  stageCode: string | null;
  docx: {
    ready: boolean;
    normalizedPath: string | null;
    templateHash: string | null;
  };
  authoring: {
    status:
      | "NOT_INITIALIZED"
      | "DRAFT"
      | "CHANGES_REQUESTED"
      | "IN_REVIEW"
      | "APPROVED"
      | "PUBLISHED"
      | "ARCHIVED";
    versionId: string | null;
    canOpen: boolean;
    mode: "EDIT" | "READ_ONLY" | "CREATE_VERSION";
  };
  runtime: {
    available: boolean;
    source:
      | "AGENCY_PUBLISHED"
      | "GLOBAL_PUBLISHED"
      | "LOCKED_FILE"
      | "LEGACY_BESPOKE"
      | "GENERIC_FALLBACK"
      | "UNAVAILABLE";
    contractHash: string | null;
  };
  quality: {
    grade: "LOCKED_VERIFIED" | "EXTRACTED_NEEDS_REVIEW" | "GENERIC_FALLBACK";
    fieldCount: number;
    bindingCount: number;
    unresolvedCount: number;
  };
  renderer: {
    kind: "PUBLISHED_V2" | "BESPOKE" | "GENERIC";
    editableInStudio: boolean;
  };
};

export type FormPlatformCatalogResponse = {
  items: FormPlatformCatalogItem[];
};

export function listFormPlatformCatalog() {
  return readApi<FormPlatformCatalogItem[]>("/form-platform/catalog", {
    cache: "no-store",
  });
}

export function getRuntimeFormContract(
  templateCode: string,
  contractHash?: string,
) {
  const query = contractHash
    ? `?contractHash=${encodeURIComponent(contractHash)}`
    : "";
  return readApi<{
    source: string;
    contractVersion: string;
    contractHash: string;
    templateHash: string;
    renderScope: string | null;
    compiledContract: CompiledFormContract;
  }>(`/forms/runtime/${encodeURIComponent(templateCode)}${query}`, {
    cache: "no-store",
  });
}
