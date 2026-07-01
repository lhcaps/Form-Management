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
 * PATCH /documents/generated/:id/form-inputs
 * Partially updates form input data.
 */
export async function patchDocumentFormInputs<T = Record<string, unknown>>(
  documentId: string | number,
  payload: T,
): Promise<Record<string, unknown>> {
  return readApi<Record<string, unknown>>(
    `/documents/generated/${documentId}/form-inputs`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

/**
 * PUT /documents/generated/:id/form-inputs
 * Full replacement of form input data.
 */
export async function replaceDocumentFormInputs<T = Record<string, unknown>>(
  documentId: string | number,
  payload: T,
): Promise<Record<string, unknown>> {
  return readApi<Record<string, unknown>>(
    `/documents/generated/${documentId}/form-inputs`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
