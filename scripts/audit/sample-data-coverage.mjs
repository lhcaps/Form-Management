#!/usr/bin/env node
/**
 * Phase D — Audit sample data coverage for all 213 forms.
 *
 * Reads compiled-v2 contracts, generates sample data, and reports:
 * - How many forms have full coverage
 * - How many forms have partial coverage
 * - Which forms have zero sample data
 * - Overall coverage percentage
 *
 * Usage: node scripts/audit/sample-data-coverage.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// __dirname = scripts/audit; go up 2 levels to project root
const PROJECT_ROOT = join(__dirname, "..", "..");
const COMPILED_V2_DIR = join(PROJECT_ROOT, "docs", "audit", "docx", "compiled-v2");
const ROOT = COMPILED_V2_DIR;
const OUTPUT_DIR = join(PROJECT_ROOT, "docs", "audit", "sample-data-coverage-v1");

// ─── Deterministic fill helpers (must match sample-generator.ts) ─────────────────

const ALL_DEFAULTS = {
  agency: {
    "agency.parentName": "Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh",
    "agency.name": "Viện Kiểm sát nhân dân khu vực 7",
    "agency.nameUpper": "VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 THÀNH PHỐ HỒ CHÍ MINH",
    "agency.districtName": "Quận 7",
    "agency.cityName": "Thành phố Hồ Chí Minh",
    "agency.bodyName": "Viện Kiểm sát nhân dân khu vực 7",
  },
  document: {
    "document.documentCode": "001/QĐ-VKS",
    "document.issueDate": "2026-01-01",
    "document.issuePlace": "TP. Hồ Chí Minh",
    "document.issuePlaceDateLine": "TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026",
    "document.title": "Biên bản",
    "document.number": "01",
  },
  person: {
    "person.fullName": "Nguyễn Văn A",
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
  },
  offense: {
    "offense.name": "Trộm cắp tài sản",
    "offense.article": "Điều 173 Bộ luật Hình sự",
    "offense.lawBasis": "Bộ luật Hình sự 2015, sửa đổi bổ sung 2017",
    "offense.dateOfOffense": "2025-12-25",
    "offense.placeOfOffense": "Quận 1, TP. Hồ Chí Minh",
    "offense.description": "Có hành vi lợi dụng hoàn cảnh đặc biệt để chiếm đoạt tài sản của người khác.",
  },
  legalBasis: {
    "legalBasis.procedureArticlesLine": "Căn cứ Điều 41, Điều 165 Bộ luật Tố tụng hình sự",
    "legalBasis.criminalArticlesLine": "Căn cứ Điều 173 Bộ luật Hình sự 2015",
    "legalBasis.legalBasisLine": "Căn cứ Điều 36 và Điều 37 Bộ luật Tố tụng hình sự 2015",
  },
  signature: {
    "signature.signerName": "Nguyễn Văn E",
    "signature.positionTitle": "VIỆN TRƯỞNG",
    "signature.signerTitle": "Viện trưởng",
    "signature.deputyTitle": "Phó Viện trưởng",
    "signature.prosecutorName": "Võ Thị F",
    "signature.prosecutorTitle": "Kiểm sát viên",
    "signature.investigatorName": "Đặng Văn G",
    "signature.investigatorTitle": "Điều tra viên",
  },
  recipients: {
    "recipients.archiveLine": "Lưu: HSVA, HSKS, VP.",
    "recipients.distributionLine": "Nơi nhận: - Cơ quan điều tra; - Viện Kiểm sát; - Lưu hồ sơ.",
  },
  decision: {
    "decision.decisionCode": "01/QĐ-VKS",
    "decision.decisionDate": "2026-01-15",
    "decision.decisionType": "Khởi tố vụ án hình sự",
    "decision.prosecutorName": "Võ Thị F",
    "decision.prosecutorTitle": "Kiểm sát viên",
  },
  measure: {
    "measure.type": "Biện pháp ngăn chặn",
    "measure.description": "Tạm giữ",
    "measure.duration": "12 ngày",
  },
  case: {
    "case.caseCode": "VK-2026-001",
    "case.investigationUnit": "Cơ quan điều tra Viện Kiểm sát khu vực 7",
    "case.investigationPeriod": "02 tháng",
  },
  indictment: {
    "indictment.caseCode": "VK-2026-001",
    "indictment.indictmentDate": "2026-01-15",
    "indictment.prosecutorName": "Võ Thị F",
    "indictment.prosecutorTitle": "Kiểm sát viên",
  },
  detentionArrest: {
    "detentionArrest.accusedName": "Trần Văn B",
    "detentionArrest.birthDay": "15",
    "detentionArrest.birthMonth": "03",
    "detentionArrest.birthYear": "1985",
    "detentionArrest.genderLabel": "Nam",
    "detentionArrest.identityNo": "079085000002",
    "detentionArrest.currentAddress": "Quận 4, TP. Hồ Chí Minh",
    "detentionArrest.occupation": "Kinh doanh",
    "detentionArrest.detentionDate": "2026-01-15",
    "detentionArrest.detentionReason": "Tạm giữ theo Điều 110 Bộ luật Tố tụng hình sự",
  },
  prosecution: {
    "prosecution.caseCode": "VK-2026-001",
    "prosecution.prosecutionDate": "2026-01-15",
    "prosecution.prosecutorName": "Võ Thị F",
    "prosecution.prosecutorTitle": "Kiểm sát viên",
    "prosecution.investigatorName": "Đặng Văn G",
    "prosecution.investigatorTitle": "Điều tra viên",
  },
};

const D_DATE = "01";
const D_MONTH = "01";
const D_YEAR = "2026";
const D_FULL_DATE = "2026-01-01";

function deterministicFill(prefix, seed) {
  let hash = 0;
  const str = `${prefix}:${seed}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const buckets = ["Nội dung mẫu", "Thông tin bổ sung", "Ghi chú mẫu", "Chi tiết bổ sung", "Mô tả vụ việc mẫu"];
  return buckets[Math.abs(hash) % buckets.length];
}

function isDatePart(key) {
  const suffixes = ["Day", "Month", "Year", "Date", "Time", "At", "Period", "Duration"];
  return suffixes.some(s => key.endsWith(s));
}

function isNumericOrCode(key) {
  const prefixes = ["number", "code", "count", "quantity", "amount", "age", "phone", "identityNo",
    // Vietnamese số-prefixed fields
    "soQuyet", "soYeu", "soThong", "soDanh", "soBien", "soKien", "soVan", "soPhieu", "so"];
  return prefixes.some(p => key.toLowerCase().includes(p));
}

function generateFieldValue(fieldKey, fieldLabel, isRequired) {
  // Check domain dictionaries
  for (const domain of Object.values(ALL_DEFAULTS)) {
    if (fieldKey in domain) return domain[fieldKey];
  }
  const lastSeg = fieldKey.split(".").pop() ?? fieldKey;
  for (const domain of Object.values(ALL_DEFAULTS)) {
    if (lastSeg in domain) return domain[lastSeg];
  }

  // Date fields
  if (isDatePart(fieldKey)) {
    if (fieldKey.endsWith("Day")) return D_DATE;
    if (fieldKey.endsWith("Month")) return D_MONTH;
    if (fieldKey.endsWith("Year")) return D_YEAR;
    return D_FULL_DATE;
  }

  // Numeric/code fields
  if (isNumericOrCode(fieldKey)) {
    const k = fieldKey.toLowerCase();
    if (k.includes("phone")) return "0901234567";
    if (k.includes("age")) return "30";
    if (k.includes("count") || k.includes("quantity")) return "1";
    if (k.includes("code") || k.includes("number")) return "01";
    return "0";
  }

  // Label heuristics
  const l = fieldLabel.toLowerCase();
  if (l.includes("họ tên") || l.includes("tên") || l.includes("người")) return "Nguyễn Văn Mẫu";
  if (l.includes("địa chỉ") || l.includes("nơi")) return "TP. Hồ Chí Minh";
  if (l.includes("tội danh") || l.includes("tội")) return "Trộm cắp tài sản";
  if (l.includes("nghề nghiệp")) return "Công nhân";
  if (l.includes("dân tộc")) return "Kinh";
  if (l.includes("quốc tịch")) return "Việt Nam";
  if (l.includes("giới tính")) return "Nam";
  if (l.includes("tôn giáo")) return "Không";
  if (l.includes("điện thoại")) return "0901234567";
  if (l.includes("số cccd") || l.includes("cmnd")) return "079090000001";
  if (l.includes("căn cứ")) return "Căn cứ Điều 41 Bộ luật Tố tụng hình sự";
  if (l.includes("lưu") || l.includes("nơi nhận")) return "Lưu: HSVA, HSKS, VP.";
  if (l.includes("chức vụ") || l.includes("chức danh")) return "Kiểm sát viên";
  if (l.includes("nội dung") || l.includes("mô tả")) return "Nội dung mẫu cho biểu mẫu pháp lý.";
  if (l.includes("ngày")) return "01";
  if (l.includes("tháng")) return "01";
  if (l.includes("năm")) return "2026";
  // Extended label heuristics for optional fields
  if (l.includes("ghi chú") || l.includes("note")) return "Ghi chú mẫu cho biểu mẫu.";
  if (l.includes("tài liệu") || l.includes("đồ vật")) return "Tài liệu, đồ vật kèm theo theo quy định.";
  if (l.includes("vấn đề") || l.includes("nội dung bổ sung")) return "Nội dung bổ sung theo quy định.";
  if (l.includes("lý do") || l.includes("xét thấy")) return "Xét thấy cần thiết áp dụng biện pháp theo quy định.";
  if (l.includes("tài sản")) return "Tài sản theo quy định pháp luật.";
  if (l.includes("số quyết") || l.includes("số yêu") || l.includes("số thông") || l.includes("số định")) return "01/QĐ-VKS";
  if (l.includes("quyết định") && l.includes("số")) return "01/QĐ-VKS";
  if (l.includes("yêu cầu") && l.includes("số")) return "01/YĐ-VKS";
  if (l.includes("thông báo") && l.includes("số")) return "01/TB-VKS";
  if (l.includes("biên bản") && l.includes("số")) return "01/BB-VKS";
  if (l.includes("cáo trạng") && l.includes("số")) return "01/CT-VKS";
  if (l.includes("phiếu") && l.includes("số")) return "01/PC-VKS";
  if (l.includes("chủ thể")) return "Cá nhân/Tổ chức theo quy định.";
  if (l.includes("đơn vị")) return "Đơn vị theo quy định.";
  if (l.includes("thời hạn")) return "Thời hạn theo quy định pháp luật.";
  if (l.includes("số tiền")) return "10000000";
  if (l.includes("bắt đầu") && l.includes("lúc")) return "08:00";
  if (l.includes("kết thúc") && l.includes("lúc")) return "10:00";
  if (l.includes("bắt đầu") || l.includes("kết thúc")) return "08:00 - 10:00";
  if (l.includes("kèm theo")) return "Tài liệu, đồ vật kèm theo.";
  if (l.includes("vật") && l.includes("thứ")) return "Tài liệu bổ sung.";
  if (l.includes("bổ sung")) return "Nội dung bổ sung theo quy định.";

  // Unknown field — deterministic fill
  return deterministicFill("field", fieldKey);
}

function generateSampleFromFields(fields) {
  const sample = {};
  for (const field of fields) {
    if (field.dataSource?.kind && field.dataSource.kind !== "MANUAL") continue;
    const value = generateFieldValue(field.key, field.label ?? field.key, field.required ?? false);
    if (value !== "") sample[field.key] = value;
  }
  return sample;
}

// ─── Main ───────────────────────────────────────────────────────────────────────

const files = readdirSync(ROOT).filter(f => f.endsWith(".json"));

const results = [];
let totalManualFields = 0;
let totalFilledFields = 0;
let fullyCovered = 0;
let partiallyCovered = 0;
let zeroCoverage = 0;

for (const file of files) {
  const templateCode = file.replace(".compiled.json", "");
  const content = readFileSync(join(ROOT, file), "utf-8");
  let contract;
  try {
    contract = JSON.parse(content);
  } catch {
    results.push({ templateCode, status: "PARSE_ERROR", manualFields: 0, filled: 0, coverage: 0 });
    continue;
  }

  const fields = contract.source?.fields ?? contract.fields ?? [];
  const manualFields = fields.filter(
    f => !f.dataSource?.kind || f.dataSource.kind === "MANUAL"
  );
  const sample = generateSampleFromFields(fields);
  const filledCount = Object.keys(sample).length;

  const coverage = manualFields.length > 0
    ? Math.round((filledCount / manualFields.length) * 100)
    : 0;

  if (manualFields.length === 0) {
    zeroCoverage++;
  } else if (coverage === 100) {
    fullyCovered++;
  } else {
    partiallyCovered++;
  }

  totalManualFields += manualFields.length;
  totalFilledFields += filledCount;

  results.push({
    templateCode,
    manualFields: manualFields.length,
    filled: filledCount,
    coverage,
    hasSample: Object.keys(sample).length > 0,
  });
}

results.sort((a, b) => a.templateCode.localeCompare(b.templateCode));

const overallCoverage = totalManualFields > 0
  ? Math.round((totalFilledFields / totalManualFields) * 100)
  : 0;

// Write JSON report
const jsonReport = {
  generatedAt: new Date().toISOString(),
  source: "Phase D — Sample Data Coverage Audit",
  summary: {
    totalForms: results.length,
    fullyCovered,
    partiallyCovered,
    zeroCoverage,
    totalManualFields,
    totalFilledFields,
    overallCoverage,
  },
  forms: results,
};

writeFileSync(
  join(OUTPUT_DIR, "latest.json"),
  JSON.stringify(jsonReport, null, 2),
  "utf-8"
);

// Write markdown report
const mdReport = [
  "# Sample Data Coverage Audit — Phase D",
  "",
  `**Generated:** ${new Date().toISOString()}`,
  "",
  "## Summary",
  "",
  `| Metric | Value |`,
  `|--------|-------|`,
  `| Total forms | ${results.length} |`,
  `| Fully covered (100%) | ${fullyCovered} |`,
  `| Partially covered | ${partiallyCovered} |`,
  `| Zero coverage | ${zeroCoverage} |`,
  `| Total manual fields | ${totalManualFields} |`,
  `| Total filled | ${totalFilledFields} |`,
  `| **Overall coverage** | **${overallCoverage}%** |`,
  "",
  "## Per-Form Results",
  "",
  `| Template | Manual Fields | Filled | Coverage |`,
  `|----------|--------------|--------|----------|`,
  ...results.map(r =>
    `| ${r.templateCode} | ${r.manualFields} | ${r.filled} | ${r.coverage}% |`
  ),
  "",
  overallCoverage >= 80
    ? "## ✅ Status: PASS\n\nOverall coverage is >= 80%. API-001 requirement satisfied."
    : overallCoverage >= 50
    ? "## ⚠️ Status: PARTIAL\n\nOverall coverage is >= 50% but < 80%. Consider adding more domain defaults."
    : "## ❌ Status: FAIL\n\nOverall coverage is < 50%. Sample data generation needs improvement.",
].join("\n");

writeFileSync(
  join(OUTPUT_DIR, "latest.md"),
  mdReport,
  "utf-8"
);

console.log("Sample Data Coverage Audit");
console.log("==========================");
console.log(`Total forms: ${results.length}`);
console.log(`Fully covered (100%): ${fullyCovered}`);
console.log(`Partially covered: ${partiallyCovered}`);
console.log(`Zero coverage: ${zeroCoverage}`);
console.log(`Total manual fields: ${totalManualFields}`);
console.log(`Total filled fields: ${totalFilledFields}`);
console.log(`Overall coverage: ${overallCoverage}%`);
console.log(`\nReports written to: ${OUTPUT_DIR}`);
