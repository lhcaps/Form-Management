/**
 * API client for document review queue (/document-review-queue).
 *
 * Uses readApi from api-client — credentials: "include" is automatic.
 */

import { absoluteApiUrl, readApi } from "./api-client";

export type ReviewStatus =
  | "DRAFT"
  | "GENERATED"
  | "WAITING_REVIEW"
  | "APPROVED"
  | "NEEDS_REVISION"
  | "FINAL_EXPORTED"
  | "CANCELLED";

export type ReviewQueueFile = {
  id: string;
  fileFormat: "DOCX" | "PDF";
  fileName: string;
  fileSizeBytes: string;
  isFinal: boolean;
  createdAt: string | null;
};

export type ReviewQueueItem = {
  id: string;
  caseCode: string;
  caseTitle: string;
  templateCode: string;
  templateName: string;
  documentCode: string;
  documentTitle: string;
  targetScope: string;
  targetPersonName: string;
  reviewStatus: ReviewStatus;
  reviewStatusLabel: string;
  generatedByName: string;
  approvedByName: string;
  generatedAt: string | null;
  approvedAt: string | null;
  note: string;
  latestDocxFile: ReviewQueueFile | null;
  latestPdfFile: ReviewQueueFile | null;
  hasDocx: boolean;
  hasPdf: boolean;
  lastReview: {
    action: string;
    reviewerName: string;
    reviewNote: string;
    reviewedAt: string | null;
  } | null;
};

export type ReviewQueueResponse = {
  items: ReviewQueueItem[];
  summary: Record<string, number>;
};

export type ReviewQueueSummary = ReviewQueueResponse["summary"];

/**
 * Fetch the review queue (all items + summary).
 */
export async function fetchReviewQueue(): Promise<ReviewQueueResponse> {
  return readApi<ReviewQueueResponse>("/document-review-queue", {
    noStore: true,
  });
}

/**
 * Update the review status of a document.
 */
export async function updateReviewStatus(
  documentId: string,
  nextStatus: ReviewStatus,
  reviewNote: string,
): Promise<void> {
  await readApi<void>(`/document-review-queue/${documentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ nextStatus, reviewNote }),
  });
}

/**
 * Build an absolute download URL for a document file.
 * File downloads bypass readApi because they return binary data.
 */
export function buildDocumentDownloadUrl(
  documentId: string,
  fileId: string,
): string {
  return absoluteApiUrl(`/documents/generated/${documentId}/files/${fileId}/download`);
}
