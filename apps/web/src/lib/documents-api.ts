/**
 * API client for document batch creation and related endpoints.
 *
 * Uses readApi from api-client — credentials: "include" is automatic.
 */

import { readApi } from "./api-client";

export type DbTemplate = {
  id: string;
  templateCode: string;
  templateNo: string | null;
  templateName: string;
  renderScope: string;
  outputStrategy: string;
  stageCode: string | null;
  requiresReview: boolean;
  group: {
    id: string;
    groupCode: string;
    groupName: string;
    groupOrder: number;
  } | null;
};

export type GeneratedDocumentSummary = {
  id: string;
  templateCode: string | null;
  templateNo: string | null;
  templateName: string | null;
  documentCode: string | null;
  documentTitle: string;
  targetScope: string;
  targetPersonId: string | null;
  reviewStatus: string;
};

export type BatchCreateResult = {
  id: string;
  batchCode: string;
  totalDocuments: number;
  successDocuments: number;
  failedDocuments: number;
  documents: GeneratedDocumentSummary[];
};

/**
 * Fetch all DB templates (used by template selector).
 */
export async function fetchDbTemplates(): Promise<DbTemplate[]> {
  return readApi<DbTemplate[]>("/templates", { noStore: true });
}

/**
 * Create a single-document batch for a case.
 */
export async function createDocumentBatch(
  caseId: string,
  templateId: string,
  options?: {
    targetPersonIds?: string[];
    formats?: Array<"DOCX" | "PDF">;
    note?: string;
  },
): Promise<BatchCreateResult> {
  return readApi<BatchCreateResult>(
    `/documents/cases/${caseId}/batches`,
    {
      method: "POST",
      body: JSON.stringify({
        templateIds: templateId ? [templateId] : [],
        targetPersonIds: options?.targetPersonIds ?? [],
        formats: options?.formats ?? ["DOCX", "PDF"],
        note: options?.note ?? "",
      }),
    },
  );
}
