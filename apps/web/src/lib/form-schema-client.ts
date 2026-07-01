/**
 * Client for the B3 GET /documents/generated/:id/form-schema endpoint.
 *
 * The response shape mirrors what the locked backend contract returns,
 * so this client just unwraps it defensively and exposes small pure
 * helpers (getValueByPath, setValueByPath, partitionSchemaFields) the
 * GenericTemplateFormInputsPanel uses to drive its dynamic rendering
 * while preserving the existing 6-section fallback.
 */
import type { FormInputSchema } from "@qllaw/form-contracts";

import { readApi } from "./api-client";

export type FormSchemaResponse = {
  generatedDocumentId: string;
  templateCode: string;
  sourceId: string | null;
  contractVersionHash: string | null;
  schema: FormInputSchema;
  values: Record<string, unknown>;
  resolvedValues: Record<string, unknown>;
  validation: {
    missingRequiredFields: Array<{
      path: string;
      label: string;
      section: string;
      sectionTitle: string;
      required: boolean;
      code: "REQUIRED" | "INVALID_TYPE" | "INVALID_DATE" | "UNKNOWN_FIELD" | "CONTRACT_DRIFT";
      message: string;
    }>;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFormSchemaResponse(value: unknown): value is FormSchemaResponse {
  if (!isRecord(value)) return false;
  if (typeof value.generatedDocumentId !== "string") return false;
  if (typeof value.templateCode !== "string") return false;
  if (!isRecord(value.schema)) return false;
  if (!isRecord(value.values)) return false;
  if (!isRecord(value.resolvedValues)) return false;
  if (!isRecord(value.validation)) return false;
  return Array.isArray(
    (value.validation as Record<string, unknown>)["missingRequiredFields"],
  );
}

export async function fetchFormSchema(
  documentId: string | number,
  options: { signal?: AbortSignal } = {},
): Promise<FormSchemaResponse> {
  const response = await readApi<FormSchemaResponse>(
    `/documents/generated/${documentId}/form-schema`,
    {
      noStore: true,
      ...(options.signal ? { signal: options.signal } : {}),
    },
  );

  if (!isFormSchemaResponse(response)) {
    throw new Error("Phản hồi form-schema không đúng định dạng.");
  }

  return response;
}

/**
 * Walk a dot-separated path on a nested object.
 *
 * Defensive: returns `undefined` for any segment that is missing or
 * that crosses through a non-object. Used by both the editable and
 * readonly previews so the dynamic path matches the same access
 * pattern the legacy hard-coded 6-section panel uses.
 */
export function getValueByPath(
  data: Record<string, unknown>,
  path: string,
): unknown {
  if (!path) return undefined;
  const segments = path.split(".");
  let cursor: unknown = data;
  for (const segment of segments) {
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

/**
 * Pure update: produce a new object with `path` set to `value`. Does
 * not mutate the input. Missing segments are created as nested
 * objects. Returns the original reference if `path` is empty.
 */
export function setValueByPath(
  data: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  if (!path) return data;
  const segments = path.split(".");
  const root: Record<string, unknown> = { ...data };
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i]!;
    const existing = cursor[segment];
    const next: Record<string, unknown> = isRecord(existing)
      ? { ...existing }
      : {};
    cursor[segment] = next;
    cursor = next;
  }
  const tail = segments[segments.length - 1]!;
  cursor[tail] = value;
  return root;
}

export type EditableField = FormInputSchema["sections"][number]["fields"][number] & {
  editable: true;
  visible: true;
};

export type ReadonlyField = FormInputSchema["sections"][number]["fields"][number] & {
  editable: false;
  visible: true;
};

/**
 * Split a schema's visible fields into editable vs readonly buckets
 * in original schema order. Hidden fields (visible === false) are
 * dropped, matching the B3 brief: render only fields where
 * `visible === true`. The order is preserved so the FE can render
 * sections/fields in the contract's natural order without a re-sort
 * that would shuffle canonical fields.
 */
export function partitionSchemaFields(
  schema: FormInputSchema,
): { editable: EditableField[]; readonly: ReadonlyField[] } {
  const editable: EditableField[] = [];
  const readonly: ReadonlyField[] = [];
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!field.visible) continue;
      if (field.editable) editable.push(field as EditableField);
      else readonly.push(field as ReadonlyField);
    }
  }
  return { editable, readonly };
}
