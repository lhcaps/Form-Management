/**
 * Centralized authenticated API helpers for document form operations.
 *
 * All calls route through api-client's token bridge, which attaches
 * the Clerk Bearer token via the auth token provider.
 *
 * This replaces raw fetch() with credentials: "include" in form components.
 */
import { readApi } from "./api-client";

/**
 * GET /documents/generated/:id/render-payload
 * Loads the document's render context (case data, template info, etc).
 */
export async function getDocumentRenderPayload<T = Record<string, unknown>>(
  documentId: string | number,
): Promise<T> {
  return readApi<T>(
    `/documents/generated/${documentId}/render-payload`,
    { method: "GET", noStore: true },
  );
}

/**
 * POST /documents/generated/:id/form-inputs
 * Saves form input data to the document.
 */
export async function saveDocumentFormInputs<T = Record<string, unknown>>(
  documentId: string | number,
  payload: T,
): Promise<Record<string, unknown>> {
  return readApi<Record<string, unknown>>(
    `/documents/generated/${documentId}/form-inputs`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * PUT /documents/generated/:id/contract-form-inputs
 * Saves published contract form inputs.
 */
export async function savePublishedContractFormInputs<T = unknown>(
  documentId: string | number,
  payload: T,
): Promise<{ message?: string; data?: unknown }> {
  return readApi<{ message?: string; data?: unknown }>(
    `/documents/generated/${documentId}/contract-form-inputs`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * POST /documents/generated/:id/bm031-direct-form-inputs
 * Saves BM031 direct form inputs (specialized endpoint).
 */
export async function saveBm031DirectFormInputs(
  documentId: string | number,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  return readApi<Record<string, unknown>>(
    `/documents/generated/${documentId}/bm031-direct-form-inputs`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
