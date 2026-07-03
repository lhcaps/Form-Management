/**
 * Smart Generic Prefill — Runtime generic field prefill for standalone templates.
 *
 * Architecture: Option B — separate layer from demo sample data.
 * Policy: explicit click only, never auto-apply, never overwrite existing values.
 *
 * This module does NOT touch:
 * - generated_documents or generated_document_files
 * - case-bound document creation
 * - locked DOCX contracts/templates
 */

import type { CompiledFormContract } from "@qllaw/form-contracts";

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_RUNTIME_TEMPLATE_PLACE = "TP. Hồ Chí Minh" as const;
export const DEFAULT_RUNTIME_TEMPLATE_TIMEZONE = "Asia/Ho_Chi_Minh" as const;

// ─── Types ────────────────────────────────────────────────────────────────────

export type SmartPrefillClassification =
  | "SAFE_RUNTIME_DEFAULT"
  | "SAFE_GENERIC_PREFILL"
  | "REVIEW_REQUIRED"
  | "NEVER_AUTO";

export type SmartPrefillKind =
  | "DOCUMENT_PLACE_DATE"
  | "DOCUMENT_DATE_TEXT"
  | "DOCUMENT_DATE_ISO"
  | "DOCUMENT_DATE_DAY"
  | "DOCUMENT_DATE_MONTH"
  | "DOCUMENT_DATE_YEAR"
  | "GENERIC_TEXT"
  | "NONE";

export interface SmartPrefillContext {
  now: Date;
  timezone?: typeof DEFAULT_RUNTIME_TEMPLATE_TIMEZONE;
  defaultPlace?: string;
}

export interface SmartPrefillSkippedField {
  key: string;
  label?: string | null;
  classification: SmartPrefillClassification;
  reason: string;
}

export interface SmartPrefillResult {
  values: Record<string, unknown>;
  appliedKeys: string[];
  skipped: SmartPrefillSkippedField[];
  summary: {
    safeRuntimeDefault: number;
    safeGenericPrefill: number;
    reviewRequired: number;
    neverAuto: number;
  };
}

export interface MergeResult {
  data: Record<string, unknown>;
  appliedKeys: string[];
  preservedKeys: string[];
}

export interface PrefillField {
  key: string;
  label?: string | null;
  dataSource?: { kind?: string; value?: unknown } | null;
  control?: string | null;
}

// ─── Classification engine ─────────────────────────────────────────────────────

const SAFE_PLACE_DATE_LABEL_PATTERNS: RegExp[] = [
  /^địa điểm,?\s*ngày/i,
  /^địa danh,?\s*ngày/i,
  /^ngày\s+ban\s+hành$/i,
  /^ngày\s+lập(\s+văn\s+bản)?$/i,
  /^nơi\s+ban\s+hành$/i,
];

const SAFE_PLACE_DATE_PATH_PREFIXES = [
  "document.issuePlaceDateLine",
  "document.issuePlaceAndDateLine",
  "document.ngayBan",
  "document.issueDay",
];

const SAFE_DATE_PATH_PREFIXES = [
  "document.issueDate",
  "document.issuePlace",
  "document.issueMonth",
  "document.issueYear",
];

const SAFE_GENERIC_PATH_PREFIXES: string[] = [
  // Only fill recipients.archiveLine with known safe boilerplate
  "recipients.archiveLine",
  "recipients.distributionLine",
];

const PERSON_PATH_PREFIXES = [
  "informant.",
  "receiver.",
  "accused.",
  "defendant.",
  "victim.",
  "witness.",
  "reporter.",
  "offender.",
  "person.",
  "assetOwner.",
  "propertyRecipient.",
];

const NEVER_AUTO_PATH_PREFIXES = [
  "accused.",
  "defendant.",
  "victim.",
  "witness.",
  "offense.",
  "case.",
  "measure.",
  "decision.",
  "detentionArrest.",
  "prosecution.",
  "indictment.",
  "person.birth",
  "person.dateOfBirth",
  "person.identityIssue",
  "person.dateOfDeath",
  "investigation.",
  "arrest.",
  "detention.",
  "offender.",
  "assetOwner.",
  "propertyRecipient.",
];

const NEVER_AUTO_LABEL_PATTERNS: RegExp[] = [
  /^ngày\s+sinh$/i,
  /^tháng\s+sinh$/i,
  /^năm\s+sinh$/i,
  /^ngày\s+bắt$/i,
  /^ngày\s+tạm\s+giữ$/i,
  /^ngày\s+tạm\s+giam$/i,
  /^ngày\s+phạm\s+tội$/i,
  /^ngày\s+khởi\s+tố$/i,
  /^ngày\s+ra\s+quyết\s+định$/i,
  /^ngày\s+nhận$/i,
  /^ngày\s+giao$/i,
  /^ngày\s+tiếp\s+nhận$/i,
  /^ngày\s+quyết\s+định\s+tạm\s+đình\s+chỉ$/i,
  /^sinh\s+ngày,?\s*tháng,?\s*năm,?\s*nơi\s+sinh$/i,
  /^ngày\s+cấp(?!p)/i,
  /^tội\s+danh$/i,
  /^điều\s+luật$/i,
  /^số\s+vụ\s+án$/i,
  /^số\s+quyết\s+định$/i,
  /^nội\s+dung\s+hành\s+vi$/i,
  /^kết\s+luận\s+pháp\s+lý$/i,
  /^số\s+tiền$/i,
  /^từ\s+ngày$/i,
  /^đến\s+ngày$/i,
  /^ngày\s+quyết\s+định\s+khởi\s+tố\s+ban\s+đầu$/i,
  /^thời\s+hạn\s+đến\s+ngày$/i,
];

const REVIEW_REQUIRED_LABEL_PATTERNS: RegExp[] = [
  /^ngày\s+quyết\s+định$/i,
  /^ngày\s+lập(?!(\s+văn\s+bản))($|\s)/i,
  /^ngày\s+nhận$/i,
  /^ngày\s+giao$/i,
  /^ngày\s+tiếp\s+nhận$/i,
  /^ngày\s+phê\s+duyệt$/i,
  /^ngày\s+duyệt$/i,
  /^ngày\s+ban\s+hành\s+quyết\s+định$/i,
  /^thời\s+hạn$/i,
];

const REVIEW_REQUIRED_PATH_PREFIXES = [
  "sourceSuspension.",
  "sourceRecovery.",
  "sourceReport.",
  "initiationRequest.",
  "investigationExtension.",
];

// Agency/official/signature fields — v1 does NOT fill these without real profile source
const V1_NO_FILL_PREFIXES = [
  "agency.",
  "official.",
  "signature.",
  "signatures.",
];

/**
 * Get the safety classification for a single field.
 * This is the conservative v1 classification — we err on the side of NOT filling.
 */
export function getSmartPrefillClassification(field: PrefillField): SmartPrefillClassification {
  const { key, label, dataSource } = field;
  const lowerLabel = (label || "").toLowerCase();
  const kind = dataSource?.kind ?? "MANUAL";

  // 1. NEVER_AUTO wins first — these must never be auto-filled
  if (NEVER_AUTO_PATH_PREFIXES.some((p) => key.startsWith(p))) {
    return "NEVER_AUTO";
  }
  if (NEVER_AUTO_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
    return "NEVER_AUTO";
  }
  // SYSTEM CURRENT_DATE fields with NEVER_AUTO labels → NEVER_AUTO
  if (kind === "SYSTEM" && NEVER_AUTO_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
    return "NEVER_AUTO";
  }
  // Person-type fields need real context
  if (PERSON_PATH_PREFIXES.some((p) => key.startsWith(p))) {
    return "NEVER_AUTO";
  }
  // Agency/official/signature — v1: no real profile source exists
  if (V1_NO_FILL_PREFIXES.some((p) => key.startsWith(p))) {
    return "NEVER_AUTO";
  }

  // 2. SAFE_RUNTIME_DEFAULT — SYSTEM CURRENT_DATE with safe place/date patterns
  if (kind === "SYSTEM" && dataSource?.value === "CURRENT_DATE") {
    if (SAFE_PLACE_DATE_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
      return "SAFE_RUNTIME_DEFAULT";
    }
    if (SAFE_PLACE_DATE_PATH_PREFIXES.some((p) => key.startsWith(p))) {
      return "SAFE_RUNTIME_DEFAULT";
    }
    if (SAFE_DATE_PATH_PREFIXES.some((p) => key.startsWith(p))) {
      return "SAFE_RUNTIME_DEFAULT";
    }
    // SYSTEM CURRENT_DATE with "ngày" but not safe → REVIEW_REQUIRED
    if (lowerLabel.includes("ngày")) {
      return "REVIEW_REQUIRED";
    }
  }

  // 3. SAFE_GENERIC_PREFILL — truly generic boilerplate with known value providers
  if (kind === "MANUAL" || kind === "CONSTANT") {
    if (SAFE_GENERIC_PATH_PREFIXES.some((p) => key.startsWith(p))) {
      return "SAFE_GENERIC_PREFILL";
    }
    // Explicit safe labels
    if (lowerLabel.includes("nơi lưu") || lowerLabel.includes("nơi nhận")) {
      return "SAFE_GENERIC_PREFILL";
    }
    if (lowerLabel.includes("căn cứ")) {
      return "SAFE_GENERIC_PREFILL";
    }
  }

  // 4. REVIEW_REQUIRED checks
  if (REVIEW_REQUIRED_PATH_PREFIXES.some((p) => key.startsWith(p))) {
    return "REVIEW_REQUIRED";
  }
  if (REVIEW_REQUIRED_LABEL_PATTERNS.some((r) => r.test(lowerLabel))) {
    return "REVIEW_REQUIRED";
  }
  // Ambiguous date fields (has "ngày" but not clear safe/never)
  if (
    lowerLabel.includes("ngày") &&
    !lowerLabel.includes("sinh") &&
    !lowerLabel.includes("bắt") &&
    !lowerLabel.includes("tạm")
  ) {
    return "REVIEW_REQUIRED";
  }

  // 5. Conservative default
  return "NEVER_AUTO";
}

/**
 * Determine the prefill kind for a classified field.
 * Returns NONE if no trusted value provider exists.
 */
export function getSmartPrefillKind(
  field: PrefillField,
  classification: SmartPrefillClassification,
): SmartPrefillKind {
  const { key, label, control } = field;
  const lowerLabel = (label || "").toLowerCase();
  const controlUpper = (control || "").toUpperCase();

  if (classification === "NEVER_AUTO" || classification === "REVIEW_REQUIRED") {
    return "NONE";
  }

  if (classification === "SAFE_RUNTIME_DEFAULT") {
    // Full place-date line
    if (
      key === "document.issuePlaceDateLine" ||
      key === "document.issuePlaceAndDateLine"
    ) {
      return "DOCUMENT_PLACE_DATE";
    }
    // ISO date for DATE controls
    if (key === "document.issueDate" && controlUpper === "DATE") {
      return "DOCUMENT_DATE_ISO";
    }
    // Text date for non-DATE controls
    if (key === "document.issueDate") {
      return "DOCUMENT_DATE_TEXT";
    }
    // Date parts
    if (key === "document.ngayBan" || key === "document.issueDay") {
      return "DOCUMENT_DATE_DAY";
    }
    if (key === "document.issueMonth") {
      return "DOCUMENT_DATE_MONTH";
    }
    if (key === "document.issueYear") {
      return "DOCUMENT_DATE_YEAR";
    }
    // Default for other SYSTEM fields with safe labels
    return "DOCUMENT_DATE_TEXT";
  }

  if (classification === "SAFE_GENERIC_PREFILL") {
    if (key === "recipients.archiveLine") {
      return "GENERIC_TEXT";
    }
    if (key === "recipients.distributionLine") {
      return "GENERIC_TEXT";
    }
    // legalBasis and other generic fields — only fill if we have a known safe value
    // For v1, we only fill recipients.archiveLine
    return "NONE";
  }

  return "NONE";
}

// ─── Date formatters ──────────────────────────────────────────────────────────

/**
 * Format a date as Vietnamese legal date text.
 * Uses injected `date` for testability.
 *
 * Input: date object representing 2026-07-03
 * Output: "ngày 03 tháng 07 năm 2026"
 */
export function formatVietnameseLegalDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `ngày ${day} tháng ${month} năm ${year}`;
}

/**
 * Format a date with place prefix as Vietnamese legal place-date text.
 *
 * Input: date object representing 2026-07-03, place "TP. Hồ Chí Minh"
 * Output: "TP. Hồ Chí Minh, ngày 03 tháng 07 năm 2026"
 */
export function formatVietnamesePlaceDate(date: Date, place?: string): string {
  const dateText = formatVietnameseLegalDate(date);
  if (place) {
    return `${place}, ${dateText}`;
  }
  return dateText;
}

// ─── Value providers ───────────────────────────────────────────────────────────

const GENERIC_RECIPIENTS_ARCHIVE_LINE = "Lưu: HSVA, HSKS, VP.";

/**
 * Get the prefill value for a single field, given its kind and context.
 * Returns undefined if no trusted value exists.
 */
function getPrefillValue(
  field: PrefillField,
  kind: SmartPrefillKind,
  context: SmartPrefillContext,
): unknown {
  if (kind === "NONE") return undefined;

  const { key, control } = field;
  const controlUpper = (control || "").toUpperCase();
  const date = context.now;
  const place = context.defaultPlace ?? DEFAULT_RUNTIME_TEMPLATE_PLACE;

  switch (kind) {
    case "DOCUMENT_PLACE_DATE":
      return formatVietnamesePlaceDate(date, place);

    case "DOCUMENT_DATE_TEXT":
      return formatVietnameseLegalDate(date);

    case "DOCUMENT_DATE_ISO": {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    case "DOCUMENT_DATE_DAY":
      return String(date.getDate()).padStart(2, "0");

    case "DOCUMENT_DATE_MONTH":
      return String(date.getMonth() + 1).padStart(2, "0");

    case "DOCUMENT_DATE_YEAR":
      return String(date.getFullYear());

    case "GENERIC_TEXT":
      if (key === "recipients.archiveLine") {
        return GENERIC_RECIPIENTS_ARCHIVE_LINE;
      }
      if (key === "recipients.distributionLine") {
        // Do not fill distributionLine in v1 — no trusted generic value exists
        return undefined;
      }
      return undefined;

    default:
      return undefined;
  }
}

// ─── Core APIs ────────────────────────────────────────────────────────────────

/**
 * Generate smart generic prefill data for a template's fields.
 *
 * Only fills fields that are:
 * - SAFE_RUNTIME_DEFAULT with a trusted runtime value provider
 * - SAFE_GENERIC_PREFILL with a known generic value
 *
 * Returns applied keys, skipped keys with reasons, and a summary.
 */
export function getSmartGenericPrefillData(
  _templateCode: string,
  fields: PrefillField[],
  context?: Partial<SmartPrefillContext>,
): SmartPrefillResult {
  const effectiveContext: SmartPrefillContext = {
    now: context?.now ?? new Date(),
    timezone: context?.timezone ?? DEFAULT_RUNTIME_TEMPLATE_TIMEZONE,
    defaultPlace: context?.defaultPlace ?? DEFAULT_RUNTIME_TEMPLATE_PLACE,
  };

  const values: Record<string, unknown> = {};
  const appliedKeys: string[] = [];
  const skipped: SmartPrefillSkippedField[] = [];

  const summary = {
    safeRuntimeDefault: 0,
    safeGenericPrefill: 0,
    reviewRequired: 0,
    neverAuto: 0,
  };

  for (const field of fields) {
    const classification = getSmartPrefillClassification(field);
    const kind = getSmartPrefillKind(field, classification);

    switch (classification) {
      case "SAFE_RUNTIME_DEFAULT":
        summary.safeRuntimeDefault++;
        break;
      case "SAFE_GENERIC_PREFILL":
        summary.safeGenericPrefill++;
        break;
      case "REVIEW_REQUIRED":
        summary.reviewRequired++;
        break;
      case "NEVER_AUTO":
        summary.neverAuto++;
        break;
    }

    if (kind === "NONE") {
      skipped.push({
        key: field.key,
        label: field.label ?? undefined,
        classification,
        reason: `No trusted value provider for "${field.key}" (kind: ${kind}).`,
      });
      continue;
    }

    const value = getPrefillValue(field, kind, effectiveContext);
    if (value !== undefined) {
      values[field.key] = value;
      appliedKeys.push(field.key);
    } else {
      skipped.push({
        key: field.key,
        label: field.label ?? undefined,
        classification,
        reason: `Value provider returned undefined for "${field.key}".`,
      });
    }
  }

  return { values, appliedKeys, skipped, summary };
}

/**
 * Merge prefill data into existing form data.
 * Only fills empty fields (undefined, null, or empty string).
 * Never overwrites existing non-empty values.
 * Does NOT mutate the input objects.
 */
export function mergeWithSmartPrefill(
  current: Record<string, unknown>,
  prefill: Record<string, unknown>,
): MergeResult {
  const data: Record<string, unknown> = { ...current };
  const appliedKeys: string[] = [];
  const preservedKeys: string[] = [];

  for (const [key, value] of Object.entries(prefill)) {
    const currentValue = readValueByPath(data, key);
    if (isEmpty(currentValue)) {
      data[key] = value;
      appliedKeys.push(key);
    } else {
      preservedKeys.push(key);
    }
  }

  return { data, appliedKeys, preservedKeys };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim().length === 0) return true;
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readValueByPath(data: Record<string, unknown>, path: string): unknown {
  // Check top-level key first (form data uses flat keys like "document.issuePlaceDateLine")
  if (path in data) return data[path];
  // Then try dot-path navigation for nested objects
  if (!path.includes(".")) return data[path];
  const segments = path.split(".");
  let cursor: unknown = data;
  for (const segment of segments) {
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}
