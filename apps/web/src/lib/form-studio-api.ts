import type {
  CompiledFormContract,
  ContractIssue,
  ContractStatus,
  FormContractV2,
} from "@qllaw/form-contracts";
import { absoluteApiUrl, readApi } from "./api-client";

export type FormStudioVersionSummary = {
  id: string;
  agencyId: string | null;
  version: number;
  revision: number;
  status: ContractStatus;
  contractHash: string | null;
  updatedAt: string;
};

export type FormStudioTemplateSummary = {
  id: string;
  templateCode: string;
  title: string;
  description: string | null;
  originalExt: string | null;
  isActive: boolean;
  versions: FormStudioVersionSummary[];
};

export type FormDraftRecord = {
  id: string;
  templateId: string;
  agencyId: string | null;
  version: number;
  status: ContractStatus;
  revision: number;
  contract: FormContractV2;
  compiledContract: CompiledFormContract | null;
  createdByOfficialId: string;
  approvedByOfficialId: string | null;
  publishedByOfficialId: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DraftOperation =
  | { type: "ADD_SECTION"; section: FormContractV2["sections"][number] }
  | {
      type: "UPDATE_SECTION";
      sectionId: string;
      patch: Partial<FormContractV2["sections"][number]>;
    }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | { type: "ADD_FIELD"; field: FormContractV2["fields"][number] }
  | {
      type: "UPDATE_FIELD";
      fieldId: string;
      patch: Partial<FormContractV2["fields"][number]>;
    }
  | { type: "REMOVE_FIELD"; fieldId: string }
  | {
      type: "MOVE_FIELD";
      fieldId: string;
      sectionId: string;
      order: number;
    }
  | {
      type: "ADD_REPEATER";
      repeater: FormContractV2["repeatableGroups"][number];
    }
  | { type: "REMOVE_REPEATER"; repeaterId: string }
  | { type: "ADD_TABLE"; table: FormContractV2["tables"][number] }
  | { type: "REMOVE_TABLE"; tableId: string }
  | { type: "REPLACE_CONTRACT"; contract: FormContractV2 };

export function listFormStudioTemplates(q?: string) {
  const query = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return readApi<FormStudioTemplateSummary[]>(
    `/admin/form-templates${query}`,
    { cache: "no-store" },
  );
}

export function createBlankFormTemplate(input: {
  title: string;
  description?: string;
}) {
  return readApi<FormDraftRecord>("/admin/form-templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function cloneFormTemplate(templateId: string) {
  return readApi<FormDraftRecord>(
    `/admin/form-templates/${templateId}/clone`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function importFormTemplate(input: {
  title: string;
  description?: string;
  file: File;
}): Promise<{ draft: FormDraftRecord; conversionStatus: string }> {
  const body = new FormData();
  body.set("title", input.title);
  if (input.description) body.set("description", input.description);
  body.set("file", input.file);
  const response = await fetch(absoluteApiUrl("/admin/form-templates/import"), {
    method: "POST",
    credentials: "include",
    body,
  });
  const json = (await response.json()) as
    | { draft: FormDraftRecord; conversionStatus: string }
    | { message?: string };
  if (!response.ok) {
    throw new Error(
      "message" in json && json.message
        ? json.message
        : "Không import được biểu mẫu.",
    );
  }
  return json as { draft: FormDraftRecord; conversionStatus: string };
}

export function getFormDraft(draftId: string) {
  return readApi<FormDraftRecord>(`/admin/form-drafts/${draftId}`, {
    cache: "no-store",
  });
}

export function patchFormDraft(
  draftId: string,
  expectedRevision: number,
  operations: DraftOperation[],
) {
  return readApi<FormDraftRecord>(`/admin/form-drafts/${draftId}`, {
    method: "PATCH",
    body: JSON.stringify({ expectedRevision, operations }),
  });
}

export function validateFormDraft(draftId: string) {
  return readApi<{ valid: boolean; issues: ContractIssue[] }>(
    `/admin/form-drafts/${draftId}/validate`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function previewFormDraft(
  draftId: string,
  sampleData: Record<string, unknown>,
) {
  return readApi<{
    id: string;
    status: string;
    artifactPath: string | null;
    errorCode: string | null;
    error: unknown;
  }>(`/admin/form-drafts/${draftId}/preview`, {
    method: "POST",
    body: JSON.stringify({ sampleData }),
  });
}

export function previewArtifactUrl(jobId: string) {
  return absoluteApiUrl(`/admin/form-preview-jobs/${jobId}/file`);
}

export function submitFormDraft(draftId: string) {
  return readApi<FormDraftRecord>(
    `/admin/form-drafts/${draftId}/submit-review`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function requestFormChanges(draftId: string, comment: string) {
  return readApi<FormDraftRecord>(
    `/admin/form-reviews/${draftId}/request-changes`,
    { method: "POST", body: JSON.stringify({ comment }) },
  );
}

export function approveFormDraft(draftId: string, comment?: string) {
  return readApi<FormDraftRecord>(
    `/admin/form-reviews/${draftId}/approve`,
    { method: "POST", body: JSON.stringify({ comment }) },
  );
}

export function publishFormVersion(id: string) {
  return readApi<FormDraftRecord>(`/admin/form-versions/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function archiveFormVersion(id: string) {
  return readApi<FormDraftRecord>(`/admin/form-versions/${id}/archive`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export type FormReviewDetail = {
  versionId: string;
  revision: number;
  status: string;
  previousVersionId: string | null;
  previousVersion: number | null;
  diff: Array<{
    kind: "ADDED" | "REMOVED" | "CHANGED";
    area: "SECTION" | "FIELD" | "BINDING" | "RULE";
    key: string;
    before?: unknown;
    after?: unknown;
  }>;
  comments: Array<{
    id: string;
    action: string;
    comment: string | null;
    revision: number;
    actorId: string;
    actorName: string;
    createdAt: string;
  }>;
};

export function getFormReview(id: string) {
  return readApi<FormReviewDetail>(`/admin/form-reviews/${id}`, {
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
    compiledContract: CompiledFormContract;
  }>(`/forms/runtime/${encodeURIComponent(templateCode)}${query}`, {
    cache: "no-store",
  });
}

export type FormPermissionGrant = {
  id: string;
  officialId: string;
  officialName: string;
  positionTitle: string | null;
  agencyId: string | null;
  permission: string;
  createdAt: string;
};

export function listFormPermissions() {
  return readApi<FormPermissionGrant[]>("/admin/form-permissions", {
    cache: "no-store",
  });
}

export function grantFormPermission(input: {
  officialId: string;
  permission: string;
  agencyId?: string;
}) {
  return readApi<{ id: string; permission: string }>(
    "/admin/form-permissions",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function revokeFormPermission(id: string) {
  return readApi<{ ok: true }>(`/admin/form-permissions/${id}`, {
    method: "DELETE",
  });
}
