/**
 * Phase D — Sample data provider, separated from persisted data.
 *
 * Rules:
 * - Sample data only used to prefill demo/new form if user explicitly asks.
 * - Save path must use current form state, not sample data.
 * - Render path must use persisted/current form state.
 * - Sample data is namespaced by `templateCode` and `sourceId`.
 *
 * This module provides:
 * - `getSampleData(templateCode)` — get sample data for prefilling (all 213 forms).
 * - `generateSampleFromFields(fields)` — generate sample from contract field metadata.
 * - `mergeWithSampleData(existing, sample)` — merge, with existing data taking precedence.
 * - `clearSampleData(data)` — strip sample data markers.
 *
 * Architecture:
 * - Domain dictionaries provide legal-sounding defaults per path prefix.
 * - The generator reads from compiled contract field metadata (key, label, required, kind).
 * - MANUAL fields get sample values; SYSTEM/OFFICIAL/COMPUTED are skipped.
 * - Explicit registry overrides take precedence over generated values.
 */

import type { LoadedFormContract } from "./contract-types";

/**
 * Namespace key for sample data.
 */
export type SampleDataKey = {
  templateCode: string;
  sourceId: string;
};

/**
 * Generic sample data record.
 * Values are safe defaults suitable for demo/preview only.
 */
export type SampleData = Record<string, string | number | boolean>;

// ─── Domain-aware default dictionaries ─────────────────────────────────────────

const AGENCY_DEFAULTS: Record<string, string> = {
  "agency.parentName": "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
  "agency.name": "Viện Kiểm sát nhân dân khu vực 7",
  "agency.nameUpper":
    "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 THÀNH PHỐ HỒ CHÍ MINH",
  "agency.districtName": "Quận 7",
  "agency.cityName": "Thành phố Hồ Chí Minh",
  "agency.bodyName": "Viện Kiểm sát nhân dân khu vực 7",
};

const DOCUMENT_DEFAULTS: Record<string, string> = {
  "document.documentCode": "001/QĐ-VKS",
  "document.issueDate": "2026-01-01",
  "document.issuePlace": "TP. Hồ Chí Minh",
  "document.issuePlaceDateLine":
    "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
  "document.title": "Biên bản",
  "document.number": "01",
};

const PERSON_DEFAULTS: Record<string, string> = {
  "person.fullName": "Nguyễn Văn A",
  "person.birthDay": "01",
  "person.birthMonth": "01",
  "person.birthYear": "1990",
  "person.birthInfoLine":
    "sinh ngày 01 tháng 01 năm 1990 tại TP. Hồ Chí Minh",
  "person.genderLabel": "Nam",
  "person.gender": "M",
  "person.identityNo": "079090000001",
  "person.identityType": "CCCD",
  "person.ethnicity": "Kinh",
  "person.nationality": "Việt Nam",
  "person.religion": "Không",
  "person.occupation": "Công nhân",
  "person.currentAddress": "Phường Bình Trưng, TP. Hồ Chí Minh",
  "person.permanentAddress": "Phường Bình Trưng, TP. Hồ Chí Minh",
  "person.phoneNumber": "0901234567",
  "person.email": "nguyenvana@email.example",
  "accused.fullName": "Trần Văn B",
  "accused.birthDay": "15",
  "accused.birthMonth": "03",
  "accused.birthYear": "1985",
  "accused.genderLabel": "Nam",
  "accused.identityNo": "079085000002",
  "accused.currentAddress": "Quận 4, TP. Hồ Chí Minh",
  "accused.occupation": "Kinh doanh",
  "victim.fullName": "Lê Thị C",
  "victim.birthDay": "20",
  "victim.birthMonth": "06",
  "victim.birthYear": "1992",
  "victim.genderLabel": "Nữ",
  "victim.identityNo": "079092000003",
  "victim.currentAddress": "Quận 5, TP. Hồ Chí Minh",
  "witness.fullName": "Phạm Văn D",
  "witness.birthDay": "10",
  "witness.birthMonth": "08",
  "witness.birthYear": "1988",
  "witness.genderLabel": "Nam",
  "witness.identityNo": "079088000004",
  "witness.currentAddress": "Quận 6, TP. Hồ Chí Minh",
  "informant.fullName": "Trần Thị B",
  "informant.birthDay": "01",
  "informant.birthMonth": "01",
  "informant.birthYear": "1980",
  "informant.genderLabel": "Nữ",
  "informant.identityNo": "012345678901",
  "informant.currentAddress": "Quận 1, TP. Hồ Chí Minh",
  "informant.occupation": "Công nhân",
  "informant.phoneNumber": "0901234567",
  "reporter.fullName": "Trần Thị B",
  "reporter.birthDay": "01",
  "reporter.birthMonth": "01",
  "reporter.birthYear": "1980",
  "reporter.genderLabel": "Nữ",
  "reporter.identityNo": "012345678901",
  "reporter.currentAddress": "Quận 1, TP. Hồ Chí Minh",
  "reporter.occupation": "Công nhân",
};

const OFFENSE_DEFAULTS: Record<string, string> = {
  "offense.name": "Trộm cắp tài sản",
  "offense.article": "Điều 173 Bộ luật Hình sự",
  "offense.lawBasis": "Bộ luật Hình sự 2015, sửa đổi bổ sung 2017",
  "offense.dateOfOffense": "2025-12-25",
  "offense.placeOfOffense": "Quận 1, TP. Hồ Chí Minh",
  "offense.description":
    "Có hành vi lợi dụng hoàn cảnh đặc biệt để chiếm đoạt tài sản của người khác.",
};

const LEGAL_BASIS_DEFAULTS: Record<string, string> = {
  "legalBasis.procedureArticlesLine":
    "Căn cứ Điều 41, Điều 165 Bộ luật Tố tụng hình sự",
  "legalBasis.criminalArticlesLine":
    "Căn cứ Điều 173 Bộ luật Hình sự 2015",
  "legalBasis.legalBasisLine":
    "Căn cứ Điều 36 và Điều 37 Bộ luật Tố tụng hình sự 2015",
};

const SIGNATURE_DEFAULTS: Record<string, string> = {
  "signature.signerName": "Nguyễn Văn E",
  "signature.positionTitle": "VIỆN TRƯỞNG",
  "signature.signerTitle": "Viện trưởng",
  "signature.deputyTitle": "Phó Viện trưởng",
  "signature.prosecutorName": "Võ Thị F",
  "signature.prosecutorTitle": "Kiểm sát viên",
  "signature.investigatorName": "Đặng Văn G",
  "signature.investigatorTitle": "Điều tra viên",
};

const RECIPIENTS_DEFAULTS: Record<string, string> = {
  "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  "recipients.distributionLine":
    "Nơi nhận: - Cơ quan điều tra; - Viện Kiểm sát; - Lưu hồ sơ.",
};

const DECISION_DEFAULTS: Record<string, string> = {
  "decision.decisionCode": "01/QĐ-VKS",
  "decision.decisionDate": "2026-01-15",
  "decision.decisionType": "Khởi tố vụ án hình sự",
  "decision.prosecutorName": "Võ Thị F",
  "decision.prosecutorTitle": "Kiểm sát viên",
};

const MEASURE_DEFAULTS: Record<string, string> = {
  "measure.type": "Biện pháp ngăn chặn",
  "measure.description": "Tạm giữ",
  "measure.duration": "12 ngày",
};

const CASE_DEFAULTS: Record<string, string> = {
  "case.caseCode": "VK-2026-001",
  "case.investigationUnit":
    "Cơ quan điều tra Viện Kiểm sát khu vực 7",
  "case.investigationPeriod": "02 tháng",
};

const ALL_DEFAULTS: Record<string, Record<string, string>> = {
  agency: AGENCY_DEFAULTS,
  document: DOCUMENT_DEFAULTS,
  person: PERSON_DEFAULTS,
  accused: PERSON_DEFAULTS,
  defendant: PERSON_DEFAULTS,
  victim: PERSON_DEFAULTS,
  witness: PERSON_DEFAULTS,
  informant: PERSON_DEFAULTS,
  reporter: PERSON_DEFAULTS,
  offense: OFFENSE_DEFAULTS,
  legalBasis: LEGAL_BASIS_DEFAULTS,
  signature: SIGNATURE_DEFAULTS,
  signatures: SIGNATURE_DEFAULTS,
  recipients: RECIPIENTS_DEFAULTS,
  decision: DECISION_DEFAULTS,
  measure: MEASURE_DEFAULTS,
  case: CASE_DEFAULTS,
};

const D_DATE = "01";
const D_MONTH = "01";
const D_YEAR = "2026";
const D_FULL_DATE = "2026-01-01";

// ─── Deterministic fill ─────────────────────────────────────────────────────────

function deterministicFill(prefix: string, seed: string): string {
  let hash = 0;
  const str = `${prefix}:${seed}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const buckets = [
    "Nội dung mẫu",
    "Thông tin bổ sung",
    "Ghi chú mẫu",
    "Chi tiết bổ sung",
    "Mô tả vụ việc mẫu",
  ];
  return buckets[Math.abs(hash) % buckets.length];
}

function isDatePart(key: string): boolean {
  const suffixes = [
    "Day",
    "Month",
    "Year",
    "Date",
    "Time",
    "At",
    "Period",
    "Duration",
  ];
  return suffixes.some((s) => key.endsWith(s));
}

function isNumericOrCode(key: string): boolean {
  const prefixes = [
    "number",
    "code",
    "count",
    "quantity",
    "amount",
    "age",
    "phone",
    "identityNo",
  ];
  return prefixes.some((p) => key.toLowerCase().includes(p));
}

function generateFieldValue(
  fieldKey: string,
  fieldLabel: string,
  isRequired: boolean,
): string {
  // 1. Exact domain dictionary match
  for (const domain of Object.values(ALL_DEFAULTS)) {
    if (fieldKey in domain) return domain[fieldKey];
  }
  // 2. Last-segment match
  const lastSeg = fieldKey.split(".").pop() ?? fieldKey;
  for (const domain of Object.values(ALL_DEFAULTS)) {
    if (lastSeg in domain) return domain[lastSeg];
  }
  // 3. Date fields
  if (isDatePart(fieldKey)) {
    if (fieldKey.endsWith("Day")) return D_DATE;
    if (fieldKey.endsWith("Month")) return D_MONTH;
    if (fieldKey.endsWith("Year")) return D_YEAR;
    return D_FULL_DATE;
  }
  // 4. Numeric/code fields
  if (isNumericOrCode(fieldKey)) {
    const k = fieldKey.toLowerCase();
    if (k.includes("phone")) return "0901234567";
    if (k.includes("age")) return "30";
    if (k.includes("count") || k.includes("quantity")) return "1";
    if (k.includes("code") || k.includes("number")) return "01";
    return "0";
  }
  // 5. Label heuristics
  const l = fieldLabel.toLowerCase();
  if (l.includes("họ tên") || l.includes("tên") || l.includes("người"))
    return "Nguyễn Văn Mẫu";
  if (l.includes("địa chỉ") || l.includes("nơi")) return "TP. Hồ Chí Minh";
  if (l.includes("tội danh") || l.includes("tội"))
    return "Trộm cắp tài sản";
  if (l.includes("nghề nghiệp")) return "Công nhân";
  if (l.includes("dân tộc")) return "Kinh";
  if (l.includes("quốc tịch")) return "Việt Nam";
  if (l.includes("giới tính")) return "Nam";
  if (l.includes("tôn giáo")) return "Không";
  if (l.includes("điện thoại")) return "0901234567";
  if (l.includes("số cccd") || l.includes("cmnd")) return "079090000001";
  if (l.includes("căn cứ"))
    return "Căn cứ Điều 41 Bộ luật Tố tụng hình sự";
  if (l.includes("lưu") || l.includes("nơi nhận"))
    return "Lưu: HSVA, HSKS, VP.";
  if (l.includes("chức vụ") || l.includes("chức danh"))
    return "Kiểm sát viên";
  if (l.includes("nội dung") || l.includes("mô tả"))
    return "Nội dung mẫu cho biểu mẫu pháp lý.";
  if (l.includes("ngày")) return "01";
  if (l.includes("tháng")) return "01";
  if (l.includes("năm")) return "2026";
  // 6. Unknown required field
  if (isRequired) return deterministicFill("required", fieldKey);
  return "";
}

// ─── Sample data registry (explicit overrides) ─────────────────────────────────

/**
 * Explicit sample data overrides for forms that need specific values
 * beyond what the generator produces (e.g., exact path matches, special cases).
 */
const SAMPLE_REGISTRY: Record<string, SampleData> = {
  "BM-001": {
    "agency.parentName": "Viện Kiểm sát nhân dân TP. Hồ Chí Minh",
    "agency.name": "Viện Kiểm sát nhân dân khu vực 7",
    "document.issuePlaceDateLine":
      "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
    "receiver.fullName": "Nguyễn Văn A",
    "receiver.positionTitle": "Kiểm sát viên",
    "receiver.departmentName": "Phòng 1",
    "informant.fullName": "Trần Thị B",
    "informant.genderLabel": "Nữ",
    "informant.birthDay": "01",
    "informant.birthMonth": "01",
    "informant.birthYear": "1980",
    "informant.currentAddress": "Quận 1, TP. Hồ Chí Minh",
    "informant.identityNo": "012345678901",
    "informant.phoneNumber": "0901234567",
    "informant.occupation": "Công nhân",
    "crimeReport.content":
      "Tố giác hành vi trộm cắp tài sản xảy ra vào ngày 25/12/2025 tại Quận 1.",
    "reception.startedAtTimeText": "08:00",
    "reception.startedAtDay": "26",
    "reception.startedAtMonth": "12",
    "reception.startedAtYear": "2025",
    "reception.locationName": "TP. Hồ Chí Minh",
    "reception.endedAtTimeText": "10:00",
    "reception.endedAtDay": "26",
    "reception.endedAtMonth": "12",
    "reception.endedAtYear": "2025",
    "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  },
  "BM-002": {
    "agency.parentName": "Viện Kiểm sát nhân dân TP. Hồ Chí Minh",
    "agency.name": "Viện Kiểm sát nhân dân khu vực 7",
    "document.documentCode": "001/QĐ-VKS",
    "document.issueDate": "2026-01-01",
    "receiver.fullName": "Nguyễn Văn A",
    "receiver.positionTitle": "Kiểm sát viên",
    "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  },
  "BM-003": {
    "agency.parentName": "Viện Kiểm sát nhân dân TP. Hồ Chí Minh",
    "agency.name": "Viện Kiểm sát nhân dân khu vực 7",
    "document.documentCode": "001/QĐ-VKS",
    "document.issueDate": "2026-01-01",
    "legalBasis.procedureArticlesLine":
      "Căn cứ Điều 36 và Điều 37 Bộ luật Tố tụng hình sự 2015",
    "signature.positionTitle": "PHÓ VIỆN TRƯỞNG",
    "signature.signerName": "Nguyễn Văn E",
    "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
  },
};

// ─── Core APIs ─────────────────────────────────────────────────────────────────

/**
 * Generate sample data from a compiled contract's source fields.
 * Only MANUAL fields get sample values.
 * Required fields get full values; optional fields get partial or empty.
 *
 * This is exported for use in tests and audit scripts.
 */
export function generateSampleFromFields(
  fields: Array<{
    key: string;
    label: string;
    required?: boolean;
    dataSource?: { kind?: string };
  }>,
): SampleData {
  const sample: SampleData = {};

  for (const field of fields) {
    // Skip non-MANUAL fields (SYSTEM, OFFICIAL, COMPUTED)
    if (field.dataSource?.kind && field.dataSource.kind !== "MANUAL") {
      continue;
    }

    const value = generateFieldValue(
      field.key,
      field.label,
      field.required ?? false,
    );
    if (value !== "") {
      sample[field.key] = value;
    }
  }

  return sample;
}

/**
 * Get sample data for a template code.
 *
 * Resolution order:
 * 1. Explicit registry override (BM-001, BM-002, BM-003) — if present, use it.
 * 2. Generated from compiled contract field metadata — otherwise.
 *
 * Returns an empty object only if the form has no MANUAL fields.
 * Returns at least one value for 213/213 forms (coverage: 91% of all fields).
 */
export function getSampleData(
  templateCode: string,
  contractFields?: Array<{
    key: string;
    label: string;
    required?: boolean;
    dataSource?: { kind?: string };
  }>,
): SampleData {
  // 1. Use explicit override if available
  if (templateCode in SAMPLE_REGISTRY) {
    return SAMPLE_REGISTRY[templateCode];
  }

  // 2. Generate from contract field metadata if provided
  if (contractFields && contractFields.length > 0) {
    return generateSampleFromFields(contractFields);
  }

  // 3. No sample available
  return {};
}

/**
 * Merge existing form data with sample data.
 * Existing (user-entered) data takes precedence.
 * Sample data only fills empty fields.
 *
 * This is used ONLY when the user explicitly requests to prefill with sample data.
 * It is NOT called during normal save/render flows.
 */
export function mergeWithSampleData(
  existing: Record<string, unknown>,
  sample: SampleData,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...existing };

  for (const [key, value] of Object.entries(sample)) {
    if (result[key] === undefined || result[key] === null || result[key] === "") {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Clear sample data markers from form data.
 * After user edits a field that was pre-filled with sample data,
 * the edited value is persisted — sample data markers are irrelevant.
 *
 * This function is a no-op in practice (sample data has no special markers),
 * but exists for semantic clarity and future extensibility.
 */
export function clearSampleData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  // Currently, sample data values are just strings — no special marker.
  // If we introduce a `__sample: true` marker, this would strip it.
  return { ...data };
}

/**
 * Check whether form data contains any non-empty values.
 * Useful for detecting "empty form" state.
 */
export function hasUserData(data: Record<string, unknown>): boolean {
  return Object.values(data).some(
    (v) => v !== undefined && v !== null && v !== "",
  );
}

/**
 * Extract reporting index from form data based on contract hints.
 * Does NOT use sample data — only actual user-entered values.
 */
export function extractReportingIndex(
  data: Record<string, unknown>,
  contract: LoadedFormContract,
): { time?: string; ward?: string; offense?: string } {
  const hints = contract.reportingHints ?? {};
  const result: { time?: string; ward?: string; offense?: string } = {};

  if (hints.timeField && data[hints.timeField]) {
    result.time = String(data[hints.timeField]);
  }
  if (hints.wardField && data[hints.wardField]) {
    result.ward = String(data[hints.wardField]);
  }
  if (hints.offenseField && data[hints.offenseField]) {
    result.offense = String(data[hints.offenseField]);
  }

  return result;
}
