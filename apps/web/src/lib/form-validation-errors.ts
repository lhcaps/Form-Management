/**
 * Client-side parser for the structured FormValidationError payload
 * introduced by PLAN.md v2.3 §A2.
 *
 * The backend (apps/api) now surfaces ApplicationError.cause as a top-level
 * `details` field on the 422 response body. Generic-template-form-inputs
 * (and any other form-input UI) can call extractStructuredValidationErrors
 * with whatever shape the fetch layer threw or passed in, get back a
 * defensive list of typed errors, and render a field-specific list. If the
 * response does not carry the structured payload, the helper returns []
 * so the caller can fall back to the legacy single-string message.
 *
 * Constraints:
 *  - Pure, no I/O, no thrown exceptions.
 *  - Accepts Axios-like (`error.response.data.details`), fetch-parsed body
 *    (`body.details`), the already-unwraped details object, or the
 *    errors[] itself. Caller does not need to pre-unbox.
 *  - Returns only entries that look like the locked shape; unknown keys
 *    are dropped silently rather than rejected wholesale so that a
 *    forward-compatible backend can add fields without breaking the UI.
 */

export type FormValidationCode =
  | "REQUIRED"
  | "INVALID_TYPE"
  | "INVALID_DATE"
  | "UNKNOWN_FIELD"
  | "CONTRACT_DRIFT";

export type FormValidationError = {
  path: string;
  label: string;
  section: string;
  sectionTitle: string;
  required: boolean;
  code: FormValidationCode;
  message: string;
};

const VALID_CODES: ReadonlySet<FormValidationCode> = new Set([
  "REQUIRED",
  "INVALID_TYPE",
  "INVALID_DATE",
  "UNKNOWN_FIELD",
  "CONTRACT_DRIFT",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  return typeof value === "boolean" ? value : false;
}

function readCode(record: Record<string, unknown>, key: string): FormValidationCode | null {
  const value = record[key];
  return typeof value === "string" && VALID_CODES.has(value as FormValidationCode)
    ? (value as FormValidationCode)
    : null;
}

/**
 * Drill through the layered error shapes the web app might receive.
 *
 * Order:
 *  1. Axios-like:  error.response.data
 *  2. Already-unwrapped: data field on the top-level object
 *  3. Bare body:   the object itself
 *
 * Each layer is read defensively; if anything is missing we keep looking
 * at the next layer rather than throwing.
 */
function unboxDetails(input: unknown): Record<string, unknown> | null {
  if (!isRecord(input)) return null;

  const responseLayer = isRecord(input.response) ? input.response : null;
  const responseData = responseLayer && isRecord(responseLayer.data)
    ? responseLayer.data
    : null;
  if (responseData && isRecord(responseData.details)) {
    return responseData.details;
  }

  if (isRecord(input.data) && isRecord(input.data.details)) {
    return input.data.details;
  }

  if (isRecord(input.details)) {
    return input.details;
  }

  return null;
}

function normalizeError(
  candidate: unknown,
): FormValidationError | null {
  if (!isRecord(candidate)) return null;
  const code = readCode(candidate, "code");
  if (!code) return null;
  const path = readString(candidate, "path");
  if (!path) return null;

  return {
    path,
    label: readString(candidate, "label") || path.split(".").pop() || path,
    section: readString(candidate, "section") || path.split(".")[0] || path,
    sectionTitle:
      readString(candidate, "sectionTitle") ||
      readString(candidate, "section") ||
      path.split(".")[0] ||
      path,
    required: readBoolean(candidate, "required"),
    code,
    message: readString(candidate, "message"),
  };
}

/**
 * Best-effort extraction. Always returns a (possibly empty) array and
 * never throws. Accepts:
 *  - Axios-style errors:   { response: { data: { details: { errors } } } }
 *  - Wrapped fetch body:  { data: { details: { errors } } }
 *  - Bare details:        { details: { errors } }
 *  - Bare errors[]:       [ { path, code, message, ... } ]
 *
 * Malformed entries are silently dropped — a single bad entry must not
 * hide the rest.
 */
export function extractStructuredValidationErrors(
  error: unknown,
): FormValidationError[] {
  const details = unboxDetails(error);
  if (details) {
    const errors = details.errors;
    if (Array.isArray(errors)) {
      const out: FormValidationError[] = [];
      for (const entry of errors) {
        const normalized = normalizeError(entry);
        if (normalized) out.push(normalized);
      }
      return out;
    }
    return [];
  }

  if (Array.isArray(error)) {
    const out: FormValidationError[] = [];
    for (const entry of error) {
      const normalized = normalizeError(entry);
      if (normalized) out.push(normalized);
    }
    return out;
  }

  return [];
}