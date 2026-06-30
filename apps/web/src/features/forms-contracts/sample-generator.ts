/**
 * Phase D — Sample data generator for all 213 forms.
 *
 * Approach: read from compiled-v2 JSON files (already in the repo),
 * extract field metadata (key, label, required, kind),
 * generate deterministic Vietnamese legal defaults per domain path prefix.
 *
 * Rules:
 * - Only MANUAL fields get sample values (SYSTEM/OFFICIAL/COMPUTED are skipped).
 * - Required fields get full legal-sounding values.
 * - Optional fields get partial values or empty strings.
 * - User data always overrides sample data (enforced in mergeWithSampleData).
 * - This module is NOT called during save/render — only for demo/preview.
 *
 * The `SAMPLE_REGISTRY` holds overrides for special-case forms.
 * All other forms are auto-generated from compiled contract metadata.
 */

import type { SampleData } from "./sample-data";

export type { SampleData };

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
  "document.issuePlaceDateLine": "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
  "document.title": "Biên bản",
  "document.number": "01",
};

const PERSON_DEFAULTS: Record<string, string> = {
  "person.fullName": "Nguyễn Văn Mẫu",
  "person.birthDay": "01",
  "person.birthMonth": "01",
  "person.birthYear": "1990",
  "person.birthInfoLine": "sinh ngày 01 tháng 01 năm 1990 tại TP. Hồ Chí Minh",
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
  // accused / defendant
  "accused.fullName": "Trần Văn B",
  "accused.birthDay": "15",
  "accused.birthMonth": "03",
  "accused.birthYear": "1985",
  "accused.genderLabel": "Nam",
  "accused.identityNo": "079085000002",
  "accused.currentAddress": "Quận 4, TP. Hồ Chí Minh",
  "accused.occupation": "Kinh doanh",
  // victim
  "victim.fullName": "Lê Thị C",
  "victim.birthDay": "20",
  "victim.birthMonth": "06",
  "victim.birthYear": "1992",
  "victim.genderLabel": "Nữ",
  "victim.identityNo": "079092000003",
  "victim.currentAddress": "Quận 5, TP. Hồ Chí Minh",
  // witness
  "witness.fullName": "Phạm Văn D",
  "witness.birthDay": "10",
  "witness.birthMonth": "08",
  "witness.birthYear": "1988",
  "witness.genderLabel": "Nam",
  "witness.identityNo": "079088000004",
  "witness.currentAddress": "Quận 6, TP. Hồ Chí Minh",
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
  "recipients.distributionLine": "Nơi nhận: - Cơ quan điều tra; - Viện Kiểm sát; - Lưu hồ sơ.",
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
  "case.investigationUnit": "Cơ quan điều tra Viện Kiểm sát khu vực 7",
  "case.investigationPeriod": "02 tháng",
};

const DETERMINISTIC_DATE = "2026-01-01";
const DETERMINISTIC_YEAR = "2026";
const DETERMINISTIC_MONTH = "01";
const DETERMINISTIC_DAY = "01";

// ─── Path → default value lookup ───────────────────────────────────────────────

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

// ─── Deterministic hash-based filler for unknown paths ────────────────────────

/** Generate a deterministic string value based on path + key for reproducibility. */
function deterministicFill(prefix: string, seed: string): string {
  // Simple deterministic hash using char codes (no crypto needed for demo data)
  let hash = 0;
  const str = `${prefix}:${seed}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // keep as 32-bit
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

/** Determine if a field path suggests a date-related field. */
function isDatePart(key: string): boolean {
  const dateSuffixes = [
    "Day",
    "Month",
    "Year",
    "Date",
    "Time",
    "At",
    "Period",
    "Duration",
  ];
  return dateSuffixes.some((s) => key.endsWith(s));
}

/** Determine if a field path suggests a numeric or code field. */
function isNumericOrCode(key: string): boolean {
  const numericPrefixes = [
    "number",
    "code",
    "count",
    "quantity",
    "amount",
    "age",
    "phone",
    "identityNo",
  ];
  return numericPrefixes.some((p) => key.toLowerCase().includes(p));
}

/** Generate a value for a specific field key. */
function generateFieldValue(
  fieldKey: string,
  fieldLabel: string,
  isRequired: boolean,
): string {
  // 1. Check domain dictionaries
  for (const domain of Object.values(ALL_DEFAULTS)) {
    if (fieldKey in domain) {
      return domain[fieldKey];
    }
  }

  // 2. Check partial matches (e.g., "person.currentAddress" matching "currentAddress")
  const lastSegment = fieldKey.split(".").pop() ?? fieldKey;
  for (const domain of Object.values(ALL_DEFAULTS)) {
    if (lastSegment in domain) {
      return domain[lastSegment];
    }
  }

  // 3. Date fields
  if (isDatePart(fieldKey)) {
    if (fieldKey.endsWith("Day")) return DETERMINISTIC_DAY;
    if (fieldKey.endsWith("Month")) return DETERMINISTIC_MONTH;
    if (fieldKey.endsWith("Year")) return DETERMINISTIC_YEAR;
    return DETERMINISTIC_DATE;
  }

  // 4. Numeric/code fields
  if (isNumericOrCode(fieldKey)) {
    if (fieldKey.toLowerCase().includes("phone")) return "0901234567";
    if (fieldKey.toLowerCase().includes("age")) return "30";
    if (fieldKey.toLowerCase().includes("count") || fieldKey.toLowerCase().includes("quantity")) return "1";
    if (fieldKey.toLowerCase().includes("code") || fieldKey.toLowerCase().includes("number")) return "01";
    return "0";
  }

  // 5. Label-based heuristics
  const labelLower = fieldLabel.toLowerCase();

  if (
    labelLower.includes("họ tên") ||
    labelLower.includes("tên") ||
    labelLower.includes("người")
  ) {
    return "Nguyễn Văn Mẫu";
  }
  if (labelLower.includes("địa chỉ") || labelLower.includes("nơi")) {
    return "TP. Hồ Chí Minh";
  }
  if (labelLower.includes("tội danh") || labelLower.includes("tội")) {
    return "Trộm cắp tài sản";
  }
  if (labelLower.includes("nghề nghiệp")) return "Công nhân";
  if (labelLower.includes("dân tộc")) return "Kinh";
  if (labelLower.includes("quốc tịch")) return "Việt Nam";
  if (labelLower.includes("giới tính")) return "Nam";
  if (labelLower.includes("tôn giáo")) return "Không";
  if (labelLower.includes("điện thoại")) return "0901234567";
  if (labelLower.includes("số CCCD") || labelLower.includes("CMND")) return "079090000001";
  if (labelLower.includes("căn cứ")) return "Căn cứ Điều 41 Bộ luật Tố tụng hình sự";
  if (labelLower.includes("lưu") || labelLower.includes("nơi nhận")) {
    return "Lưu: HSVA, HSKS, VP.";
  }
  if (labelLower.includes("chức vụ") || labelLower.includes("chức danh")) {
    return "Kiểm sát viên";
  }
  if (labelLower.includes("nội dung") || labelLower.includes("mô tả")) {
    return "Nội dung mẫu cho biểu mẫu pháp lý.";
  }
  if (labelLower.includes("ngày")) return "01";
  if (labelLower.includes("tháng")) return "01";
  if (labelLower.includes("năm")) return "2026";

  // 6. Unknown field — deterministic placeholder
  if (isRequired) {
    return deterministicFill("required", fieldKey);
  }
  return "";
}

// ─── Type for compiled contract source fields ──────────────────────────────────

interface CompiledFieldSource {
  key: string;
  label: string;
  required: boolean;
  dataSource?: {
    kind?: string;
  };
}

// ─── Core generator ────────────────────────────────────────────────────────────

/**
 * Generate sample data from a compiled contract's source fields.
 * Only MANUAL fields get sample values.
 * Required fields get full values; optional fields get partial or empty.
 */
export function generateSampleFromFields(
  fields: CompiledFieldSource[],
): SampleData {
  const sample: SampleData = {};

  for (const field of fields) {
    // Skip non-MANUAL fields (SYSTEM, OFFICIAL, COMPUTED)
    if (field.dataSource?.kind && field.dataSource.kind !== "MANUAL") {
      continue;
    }

    const value = generateFieldValue(field.key, field.label, field.required);
    if (value !== "") {
      sample[field.key] = value;
    }
  }

  return sample;
}

// ─── Coverage audit helper ─────────────────────────────────────────────────────

/** Return a map of templateCode → field count and filled count. */
export function auditSampleCoverage(
  contracts: Array<{
    templateCode: string;
    fields: CompiledFieldSource[];
  }>,
): Record<
  string,
  {
    totalManualFields: number;
    filledFields: number;
    coverage: number;
  }
> {
  const result: Record<
    string,
    { totalManualFields: number; filledFields: number; coverage: number }
  > = {};

  for (const contract of contracts) {
    const manualFields = contract.fields.filter(
      (f) => !f.dataSource?.kind || f.dataSource.kind === "MANUAL",
    );
    const sample = generateSampleFromFields(contract.fields);
    const filledCount = Object.keys(sample).length;

    result[contract.templateCode] = {
      totalManualFields: manualFields.length,
      filledFields: filledCount,
      coverage:
        manualFields.length > 0
          ? Math.round((filledCount / manualFields.length) * 100)
          : 0,
    };
  }

  return result;
}
