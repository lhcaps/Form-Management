/**
 * Authenticated document render/convert API helpers.
 *
 * These helpers go through the api-client token bridge to attach the Clerk
 * Bearer token to all protected document render endpoints.
 *
 * PROBLEM: raw fetch() to render-docx / convert-pdf bypasses Clerk auth.
 * SOLUTION: use these helpers which call readApi() with token bridge.
 */

import { readApi } from "./api-client";

/**
 * Shape returned by render-docx and convert-pdf endpoints.
 * Backend returns the created/updated file record.
 */
export type RenderedDocumentFile = {
  id?: string | number;
  fileId?: string | number;
  storedFileId?: string | number;
  fileName?: string;
  originalName?: string;
  name?: string;
  fileSize?: number;
  fileSizeBytes?: string | number;
  mimeType?: string;
  generatedAt?: string | null;
  [key: string]: unknown;
};

export type RenderDocumentResponse = {
  file?: RenderedDocumentFile;
  fileId?: string | number;
  storedFileId?: string | number;
  data?: {
    file?: RenderedDocumentFile;
  };
  [key: string]: unknown;
};

/**
 * Trigger DOCX rendering for a generated document.
 *
 * Uses authenticated fetch via api-client token bridge.
 * Does NOT download the file — caller handles the response.
 *
 * @param documentId  The generated document ID.
 * @param options     Optional: force re-render, renderedByName.
 */
export async function renderDocumentDocx(
  documentId: string | number,
  options: {
    force?: boolean;
    renderedByName?: string;
  } = {},
): Promise<RenderDocumentResponse> {
  return readApi<RenderDocumentResponse>(
    `/documents/generated/${documentId}/render-docx`,
    {
      method: "POST",
      body: JSON.stringify({
        force: options.force ?? true,
        ...(options.renderedByName !== undefined
          ? { renderedByName: options.renderedByName }
          : {}),
      }),
    },
  );
}

/**
 * Trigger PDF conversion for a generated document.
 *
 * Uses authenticated fetch via api-client token bridge.
 * Does NOT download the file — caller handles the response.
 *
 * @param documentId  The generated document ID.
 * @param options     Optional: force re-convert, convertedByName.
 */
export async function convertDocumentPdf(
  documentId: string | number,
  options: {
    force?: boolean;
    convertedByName?: string;
  } = {},
): Promise<RenderDocumentResponse> {
  return readApi<RenderDocumentResponse>(
    `/documents/generated/${documentId}/convert-pdf`,
    {
      method: "POST",
      body: JSON.stringify({
        force: options.force ?? true,
        ...(options.convertedByName !== undefined
          ? { convertedByName: options.convertedByName }
          : {}),
      }),
    },
  );
}

/**
 * Helper to extract file ID from render response.
 * Handles various backend response shapes.
 */
export function extractFileIdFromRenderResponse(
  response: RenderDocumentResponse,
): string | number | undefined {
  return (
    response.file?.id ??
    response.file?.fileId ??
    response.file?.storedFileId ??
    response.data?.file?.id ??
    response.data?.file?.fileId ??
    response.data?.file?.storedFileId ??
    response.fileId ??
    response.storedFileId
  );
}

/**
 * Helper to extract file name from render response.
 * Handles various backend response shapes.
 */
export function extractFileNameFromRenderResponse(
  response: RenderDocumentResponse,
  fallback: string,
): string {
  return (
    response.file?.fileName ??
    response.file?.originalName ??
    response.file?.name ??
    response.data?.file?.fileName ??
    response.data?.file?.originalName ??
    response.data?.file?.name ??
    fallback
  );
}
