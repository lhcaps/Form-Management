import { absoluteApiUrl, readApi } from "./api-client";

export type GeneratedDocumentFile = {
  id: string;
  storedFileId?: string | null;
  fileFormat: "DOCX" | "PDF" | string;
  fileName: string;
  filePath?: string | null;
  fileSizeBytes: string | number;
  checksum?: string | null;
  isFinal?: boolean;
  createdAt?: string | null;
};

export type GeneratedDocumentDetail = {
  id: string;
  documentTitle: string;
  documentCode?: string | null;
  reviewStatus: string;
  files: GeneratedDocumentFile[];
  [key: string]: unknown;
};

export type GeneratedDocumentPreExportPageSetup = {
  enabled: boolean;
  topCm: number;
  bottomCm: number;
  leftCm: number;
  rightCm: number;
  gutterCm: number;
  gutterPosition: "left" | "top";
  orientation: "portrait" | "landscape";
  paperSize: "A4";
};

export type GeneratedDocumentPreExportStyle = {
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  alignment: "left" | "center" | "right" | "justify" | null;
};

export type GeneratedDocumentPreExportStyleRule = {
  id: string;
  enabled: boolean;
  targetText: string;
  applyToAll: boolean;
  style: GeneratedDocumentPreExportStyle;
};

export type GeneratedDocumentPreExportManualBlankField = {
  id: string;
  enabled: boolean;
  label: string;
  value: string;
  contextBefore: string;
  contextAfter: string;
  occurrenceKey: string;
};

export type GeneratedDocumentPreExportConfig = {
  version: 1;
  pageSetup: GeneratedDocumentPreExportPageSetup;
  styleRules: GeneratedDocumentPreExportStyleRule[];
  manualBlankFields: GeneratedDocumentPreExportManualBlankField[];
};

export type GeneratedDocumentPreExportConfigResponse = {
  documentId: string;
  hasSavedConfig: boolean;
  config: GeneratedDocumentPreExportConfig;
  warnings: string[];
};

export type GeneratedDocumentPreExportBlankCandidate = {
  id: string;
  label: string;
  contextBefore: string;
  contextAfter: string;
  occurrenceKey: string;
  isDateLike: boolean;
  defaultEnabled: boolean;
};

export type ScanGeneratedDocumentPreExportBlankCandidatesResponse = {
  documentId: string;
  scannedAt: string;
  candidateCount: number;
  candidates: GeneratedDocumentPreExportBlankCandidate[];
  warnings: string[];
};

export type GeneratedDocumentExportResponse = {
  skipped: boolean;
  documentId?: string | null;
  templateCode?: string | null;
  documentTitle?: string | null;
  payload?: unknown;
  warnings?: string[];
  sourceDocxFile?: {
    id: string | null;
    fileName?: string | null;
    filePath?: string | null;
  } | null;
  file?: {
    id: string | null;
    storedFileId?: string | null;
    fileFormat?: string | null;
    fileName?: string | null;
    filePath?: string | null;
    fileSizeBytes?: string | number | null;
    checksum?: string | null;
    isFinal?: boolean | null;
  } | null;
};

type CleanupGeneratedFilesResult = {
  deletedCount: number;
  keptCount: number;
  keptFiles: GeneratedDocumentFile[];
  deletedFiles: unknown[];
};

export async function getGeneratedDocument(
  documentId: string | number,
): Promise<GeneratedDocumentDetail> {
  return readApi<GeneratedDocumentDetail>(
    `/documents/generated/${documentId}`,
  );
}

export async function getGeneratedDocumentPreExportConfig(
  documentId: string | number,
): Promise<GeneratedDocumentPreExportConfigResponse> {
  return readApi<GeneratedDocumentPreExportConfigResponse>(
    `/documents/generated/${documentId}/pre-export-config`,
  );
}

export async function saveGeneratedDocumentPreExportConfig(
  documentId: string | number,
  config: GeneratedDocumentPreExportConfig,
): Promise<GeneratedDocumentPreExportConfigResponse> {
  return readApi<GeneratedDocumentPreExportConfigResponse>(
    `/documents/generated/${documentId}/pre-export-config`,
    {
      method: "PUT",
      body: JSON.stringify(config),
    },
  );
}

export async function scanGeneratedDocumentPreExportBlankCandidates(
  documentId: string | number,
  options?: {
    includeDateLike?: boolean;
  },
): Promise<ScanGeneratedDocumentPreExportBlankCandidatesResponse> {
  return readApi<ScanGeneratedDocumentPreExportBlankCandidatesResponse>(
    `/documents/generated/${documentId}/pre-export-config/scan-blanks`,
    {
      method: "POST",
      body: JSON.stringify({
        includeDateLike: options?.includeDateLike ?? false,
      }),
    },
  );
}

export async function renderGeneratedDocumentDocx(
  documentId: string | number,
): Promise<GeneratedDocumentExportResponse> {
  return readApi<GeneratedDocumentExportResponse>(
    `/documents/generated/${documentId}/render-docx`,
    {
      method: "POST",
      body: JSON.stringify({ force: true }),
    },
  );
}

export async function convertGeneratedDocumentPdf(
  documentId: string | number,
): Promise<GeneratedDocumentExportResponse> {
  return readApi<GeneratedDocumentExportResponse>(
    `/documents/generated/${documentId}/convert-pdf`,
    {
      method: "POST",
      body: JSON.stringify({ force: true }),
    },
  );
}

export function getGeneratedDocumentDownloadUrl(
  documentId: string | number,
  fileId: string | number,
): string {
  return absoluteApiUrl(
    `/documents/generated/${documentId}/files/${fileId}/download`,
  );
}

export async function deleteGeneratedDocumentFile(
  documentId: string | number,
  fileId: string | number,
): Promise<unknown> {
  return readApi(`/documents/generated/${documentId}/files/${fileId}`, {
    method: "DELETE",
  });
}

export async function bulkDeleteGeneratedDocumentFiles(
  documentId: string | number,
  fileIds: Array<string | number>,
): Promise<unknown> {
  return readApi(`/documents/generated/${documentId}/files/bulk-delete`, {
    method: "POST",
    body: JSON.stringify({
      fileIds: fileIds.map(String),
      deletePhysical: true,
    }),
  });
}

export async function cleanupGeneratedDocumentFiles(
  documentId: string | number,
): Promise<CleanupGeneratedFilesResult> {
  return readApi<CleanupGeneratedFilesResult>(
    `/documents/generated/${documentId}/files/cleanup`,
    {
      method: "POST",
      body: JSON.stringify({
        keepLatestDocx: true,
        keepLatestPdf: true,
        deletePhysical: true,
      }),
    },
  );
}

export type DocumentHistoryEvent = {
  type: "CREATED" | "REVIEW" | "FILE" | "AUDIT";
  title: string;
  description: string;
  actor: string | null;
  timestamp: string | null;
};

export type DocumentHistoryResponse = {
  documentId: string;
  documentTitle: string;
  documentCode: string | null;
  reviewStatus: string;
  templateCode: string | null;
  templateName: string | null;
  generatedByName: string | null;
  generatedAt: string | null;
  events: DocumentHistoryEvent[];
};

export async function getDocumentHistory(
  documentId: string | number,
): Promise<DocumentHistoryResponse> {
  return readApi<DocumentHistoryResponse>(
    `/documents/generated/${documentId}/history`,
  );
}

// ─── Audit Log types and API ─────────────────────────────────────────────────

export type GeneratedDocumentAuditEntry = {
  id: string;
  action: string;
  result: string;
  actorOfficialId: string | null;
  actorRole: string | null;
  actorName: string | null;
  agencyId: string | null;
  caseId: string | null;
  generatedDocumentId: string | null;
  generatedDocumentFileId: string | null;
  templateCode: string | null;
  templateTitle: string | null;
  fileName: string | null;
  fileMimeType: string | null;
  fileSizeBytes: string | null;
  reason: string | null;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestPath: string | null;
};

export type GeneratedDocumentAuditResponse = {
  entries: GeneratedDocumentAuditEntry[];
  total: number;
};

export async function getGeneratedDocumentAudit(
  documentId: string | number,
  options?: { limit?: number; offset?: number },
): Promise<GeneratedDocumentAuditResponse> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  if (options?.offset !== undefined) params.set('offset', String(options.offset));
  const qs = params.toString();
  return readApi<GeneratedDocumentAuditResponse>(
    `/documents/generated/${documentId}/audit${qs ? `?${qs}` : ''}`,
  );
}
