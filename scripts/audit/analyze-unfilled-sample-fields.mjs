/**
 * Phase D — Audit: Identify which fields return empty string from generateFieldValue()
 *
 * This script:
 * 1. Loads compiled contracts from docs/audit/docx/compiled-v2/BM-*.json
 * 2. For each partially-covered or zero-coverage form, extracts MANUAL fields
 * 3. Runs each field through generateFieldValue() (inlined from sample-data.ts)
 * 4. Reports which fields get empty string (unfilled) vs non-empty
 * 5. Outputs JSON report to docs/audit/ready-absolute-blocker-burn-down-v3/unfilled-fields.latest.json
 *
 * Run with: node scripts/audit/analyze-unfilled-sample-fields.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..', '..');

// ─── Domain dictionaries (copied from sample-data.ts) ──────────────────────────

const AGENCY_DEFAULTS = {
  'agency.parentName': 'Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh',
  'agency.name': 'Viện Kiểm sát nhân dân khu vực 7',
  'agency.nameUpper': 'VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7 THÀNH PHỐ HỒ CHÍ MINH',
  'agency.districtName': 'Quận 7',
  'agency.cityName': 'Thành phố Hồ Chí Minh',
  'agency.bodyName': 'Viện Kiểm sát nhân dân khu vực 7',
};

const DOCUMENT_DEFAULTS = {
  'document.documentCode': '001/QĐ-VKS',
  'document.issueDate': '2026-01-01',
  'document.issuePlace': 'TP. Hồ Chí Minh',
  'document.issuePlaceDateLine': 'TP. Hồ Chí Minh, ngày 01 tháng 01 năm 2026',
  'document.title': 'Biên bản',
  'document.number': '01',
};

const PERSON_DEFAULTS = {
  'person.fullName': 'Nguyễn Văn A',
  'person.birthDay': '01',
  'person.birthMonth': '01',
  'person.birthYear': '1990',
  'person.birthInfoLine': 'sinh ngày 01 tháng 01 năm 1990 tại TP. Hồ Chí Minh',
  'person.genderLabel': 'Nam',
  'person.gender': 'M',
  'person.identityNo': '079090000001',
  'person.identityType': 'CCCD',
  'person.ethnicity': 'Kinh',
  'person.nationality': 'Việt Nam',
  'person.religion': 'Không',
  'person.occupation': 'Công nhân',
  'person.currentAddress': 'Phường Bình Trưng, TP. Hồ Chí Minh',
  'person.permanentAddress': 'Phường Bình Trưng, TP. Hồ Chí Minh',
  'person.phoneNumber': '0901234567',
  'person.email': 'nguyenvana@email.example',
  'accused.fullName': 'Trần Văn B',
  'accused.birthDay': '15',
  'accused.birthMonth': '03',
  'accused.birthYear': '1985',
  'accused.genderLabel': 'Nam',
  'accused.identityNo': '079085000002',
  'accused.currentAddress': 'Quận 4, TP. Hồ Chí Minh',
  'accused.occupation': 'Kinh doanh',
  'victim.fullName': 'Lê Thị C',
  'victim.birthDay': '20',
  'victim.birthMonth': '06',
  'victim.birthYear': '1992',
  'victim.genderLabel': 'Nữ',
  'victim.identityNo': '079092000003',
  'victim.currentAddress': 'Quận 5, TP. Hồ Chí Minh',
  'witness.fullName': 'Phạm Văn D',
  'witness.birthDay': '10',
  'witness.birthMonth': '08',
  'witness.birthYear': '1988',
  'witness.genderLabel': 'Nam',
  'witness.identityNo': '079088000004',
  'witness.currentAddress': 'Quận 6, TP. Hồ Chí Minh',
  'informant.fullName': 'Trần Thị B',
  'informant.birthDay': '01',
  'informant.birthMonth': '01',
  'informant.birthYear': '1980',
  'informant.genderLabel': 'Nữ',
  'informant.identityNo': '012345678901',
  'informant.currentAddress': 'Quận 1, TP. Hồ Chí Minh',
  'informant.occupation': 'Công nhân',
  'informant.phoneNumber': '0901234567',
  'reporter.fullName': 'Trần Thị B',
  'reporter.birthDay': '01',
  'reporter.birthMonth': '01',
  'reporter.birthYear': '1980',
  'reporter.genderLabel': 'Nữ',
  'reporter.identityNo': '012345678901',
  'reporter.currentAddress': 'Quận 1, TP. Hồ Chí Minh',
  'reporter.occupation': 'Công nhân',
};

const OFFENSE_DEFAULTS = {
  'offense.name': 'Trộm cắp tài sản',
  'offense.article': 'Điều 173 Bộ luật Hình sự',
  'offense.lawBasis': 'Bộ luật Hình sự 2015, sửa đổi bổ sung 2017',
  'offense.dateOfOffense': '2025-12-25',
  'offense.placeOfOffense': 'Quận 1, TP. Hồ Chí Minh',
  'offense.description': 'Có hành vi lợi dụng hoàn cảnh đặc biệt để chiếm đoạt tài sản của người khác.',
};

const LEGAL_BASIS_DEFAULTS = {
  'legalBasis.procedureArticlesLine': 'Căn cứ Điều 41, Điều 165 Bộ luật Tố tụng hình sự',
  'legalBasis.criminalArticlesLine': 'Căn cứ Điều 173 Bộ luật Hình sự 2015',
  'legalBasis.legalBasisLine': 'Căn cứ Điều 36 và Điều 37 Bộ luật Tố tụng hình sự 2015',
};

const SIGNATURE_DEFAULTS = {
  'signature.signerName': 'Nguyễn Văn E',
  'signature.positionTitle': 'VIỆN TRƯỞNG',
  'signature.signerTitle': 'Viện trưởng',
  'signature.deputyTitle': 'Phó Viện trưởng',
  'signature.prosecutorName': 'Võ Thị F',
  'signature.prosecutorTitle': 'Kiểm sát viên',
  'signature.investigatorName': 'Đặng Văn G',
  'signature.investigatorTitle': 'Điều tra viên',
};

const RECIPIENTS_DEFAULTS = {
  'recipients.archiveLine': 'Lưu: HSVA, HSKS, VP.',
  'recipients.distributionLine': 'Nơi nhận: - Cơ quan điều tra; - Viện Kiểm sát; - Lưu hồ sơ.',
};

const DECISION_DEFAULTS = {
  'decision.decisionCode': '01/QĐ-VKS',
  'decision.decisionDate': '2026-01-15',
  'decision.decisionType': 'Khởi tố vụ án hình sự',
  'decision.prosecutorName': 'Võ Thị F',
  'decision.prosecutorTitle': 'Kiểm sát viên',
};

const MEASURE_DEFAULTS = {
  'measure.type': 'Biện pháp ngăn chặn',
  'measure.description': 'Tạm giữ',
  'measure.duration': '12 ngày',
};

const CASE_DEFAULTS = {
  'case.caseCode': 'VK-2026-001',
  'case.investigationUnit': 'Cơ quan điều tra Viện Kiểm sát khu vực 7',
  'case.investigationPeriod': '02 tháng',
};

const INDICTMENT_DEFAULTS = {
  'indictment.caseCode': 'VK-2026-001',
  'indictment.indictmentDate': '2026-01-15',
  'indictment.prosecutorName': 'Võ Thị F',
  'indictment.prosecutorTitle': 'Kiểm sát viên',
};

const DETENTION_DEFAULTS = {
  'detentionArrest.accusedName': 'Trần Văn B',
  'detentionArrest.birthDay': '15',
  'detentionArrest.birthMonth': '03',
  'detentionArrest.birthYear': '1985',
  'detentionArrest.genderLabel': 'Nam',
  'detentionArrest.identityNo': '079085000002',
  'detentionArrest.currentAddress': 'Quận 4, TP. Hồ Chí Minh',
  'detentionArrest.occupation': 'Kinh doanh',
  'detentionArrest.detentionDate': '2026-01-15',
  'detentionArrest.detentionReason': 'Tạm giữ theo Điều 110 Bộ luật Tố tụng hình sự',
};

const PROSECUTION_DEFAULTS = {
  'prosecution.caseCode': 'VK-2026-001',
  'prosecution.prosecutionDate': '2026-01-15',
  'prosecution.prosecutorName': 'Võ Thị F',
  'prosecution.prosecutorTitle': 'Kiểm sát viên',
  'prosecution.investigatorName': 'Đặng Văn G',
  'prosecution.investigatorTitle': 'Điều tra viên',
};

const ALL_DEFAULTS = {
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
  indictment: INDICTMENT_DEFAULTS,
  detentionArrest: DETENTION_DEFAULTS,
  prosecution: PROSECUTION_DEFAULTS,
};

const D_DATE = '01';
const D_MONTH = '01';
const D_YEAR = '2026';
const D_FULL_DATE = '2026-01-01';

// ─── generateFieldValue (copied from sample-data.ts) ──────────────────────────

function deterministicFill(prefix, seed) {
  let hash = 0;
  const str = `${prefix}:${seed}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const buckets = [
    'Nội dung mẫu',
    'Thông tin bổ sung',
    'Ghi chú mẫu',
    'Chi tiết bổ sung',
    'Mô tả vụ việc mẫu',
  ];
  return buckets[Math.abs(hash) % buckets.length];
}

function isDatePart(key) {
  const suffixes = ['Day', 'Month', 'Year', 'Date', 'Time', 'At', 'Period', 'Duration'];
  return suffixes.some((s) => key.endsWith(s));
}

function isNumericOrCode(key) {
  const prefixes = ['number', 'code', 'count', 'quantity', 'amount', 'age', 'phone', 'identityNo',
    'soQuyet', 'soYeu', 'soThong', 'soDanh', 'soBien', 'soKien', 'soVan', 'soPhieu', 'so'];
  return prefixes.some((p) => key.toLowerCase().includes(p));
}

function generateFieldValue(fieldKey, fieldLabel, isRequired) {
  // 1. Exact domain dictionary match
  for (const domain of Object.values(ALL_DEFAULTS)) {
    if (fieldKey in domain) return domain[fieldKey];
  }
  // 2. Last-segment match
  const lastSeg = fieldKey.split('.').pop() ?? fieldKey;
  for (const domain of Object.values(ALL_DEFAULTS)) {
    if (lastSeg in domain) return domain[lastSeg];
  }
  // 3. Date fields
  if (isDatePart(fieldKey)) {
    if (fieldKey.endsWith('Day')) return D_DATE;
    if (fieldKey.endsWith('Month')) return D_MONTH;
    if (fieldKey.endsWith('Year')) return D_YEAR;
    return D_FULL_DATE;
  }
  // 4. Numeric/code fields
  if (isNumericOrCode(fieldKey)) {
    const k = fieldKey.toLowerCase();
    if (k.includes('phone')) return '0901234567';
    if (k.includes('age')) return '30';
    if (k.includes('count') || k.includes('quantity')) return '1';
    if (k.includes('code') || k.includes('number')) return '01';
    return '0';
  }
  // 5. Label heuristics
  const l = fieldLabel.toLowerCase();
  if (l.includes('họ tên') || l.includes('tên') || l.includes('người')) return 'Nguyễn Văn Mẫu';
  if (l.includes('địa chỉ') || l.includes('nơi')) return 'TP. Hồ Chí Minh';
  if (l.includes('tội danh') || l.includes('tội')) return 'Trộm cắp tài sản';
  if (l.includes('nghề nghiệp')) return 'Công nhân';
  if (l.includes('dân tộc')) return 'Kinh';
  if (l.includes('quốc tịch')) return 'Việt Nam';
  if (l.includes('giới tính')) return 'Nam';
  if (l.includes('tôn giáo')) return 'Không';
  if (l.includes('điện thoại')) return '0901234567';
  if (l.includes('số cccd') || l.includes('cmnd')) return '079090000001';
  if (l.includes('căn cứ')) return 'Căn cứ Điều 41 Bộ luật Tố tụng hình sự';
  if (l.includes('lưu') || l.includes('nơi nhận')) return 'Lưu: HSVA, HSKS, VP.';
  if (l.includes('chức vụ') || l.includes('chức danh')) return 'Kiểm sát viên';
  if (l.includes('nội dung') || l.includes('mô tả')) return 'Nội dung mẫu cho biểu mẫu pháp lý.';
  if (l.includes('ngày')) return '01';
  if (l.includes('tháng')) return '01';
  if (l.includes('năm')) return '2026';
  // Extended label heuristics for optional fields
  if (l.includes('ghi chú') || l.includes('note')) return 'Ghi chú mẫu cho biểu mẫu.';
  if (l.includes('tài liệu') || l.includes('đồ vật')) return 'Tài liệu, đồ vật kèm theo theo quy định.';
  if (l.includes('vấn đề') || l.includes('nội dung bổ sung')) return 'Nội dung bổ sung theo quy định.';
  if (l.includes('lý do') || l.includes('xét thấy')) return 'Xét thấy cần thiết áp dụng biện pháp theo quy định.';
  if (l.includes('tài sản')) return 'Tài sản theo quy định pháp luật.';
  if (l.includes('số quyết') || l.includes('số yêu') || l.includes('số thông') || l.includes('số định')) return '01/QĐ-VKS';
  if (l.includes('quyết định') && l.includes('số')) return '01/QĐ-VKS';
  if (l.includes('yêu cầu') && l.includes('số')) return '01/YĐ-VKS';
  if (l.includes('thông báo') && l.includes('số')) return '01/TB-VKS';
  if (l.includes('biên bản') && l.includes('số')) return '01/BB-VKS';
  if (l.includes('cáo trạng') && l.includes('số')) return '01/CT-VKS';
  if (l.includes('phiếu') && l.includes('số')) return '01/PC-VKS';
  if (l.includes('chủ thể')) return 'Cá nhân/Tổ chức theo quy định.';
  if (l.includes('đơn vị')) return 'Đơn vị theo quy định.';
  if (l.includes('thời hạn')) return 'Thời hạn theo quy định pháp luật.';
  if (l.includes('số tiền')) return '10000000';
  if (l.includes('bắt đầu') && l.includes('lúc')) return '08:00';
  if (l.includes('kết thúc') && l.includes('lúc')) return '10:00';
  if (l.includes('bắt đầu') || l.includes('kết thúc')) return '08:00 - 10:00';
  if (l.includes('kèm theo')) return 'Tài liệu, đồ vật kèm theo.';
  if (l.includes('vật') && l.includes('thứ')) return 'Tài liệu bổ sung.';
  if (l.includes('bổ sung')) return 'Nội dung bổ sung theo quy định.';
  // Unknown field — deterministic fill
  return deterministicFill('field', fieldKey);
}

// ─── Forms to analyze ──────────────────────────────────────────────────────────

// Partially-covered forms (from the user's request)
const PARTIAL_COVERAGE_FORMS = [
  'BM-001', 'BM-002', 'BM-005', 'BM-007', 'BM-013', 'BM-014', 'BM-015', 'BM-016',
  'BM-027', 'BM-028', 'BM-048', 'BM-053', 'BM-062', 'BM-063', 'BM-066', 'BM-068',
  'BM-069', 'BM-071', 'BM-072', 'BM-074', 'BM-076', 'BM-078', 'BM-083', 'BM-087',
  'BM-088', 'BM-091', 'BM-092', 'BM-093', 'BM-094', 'BM-095', 'BM-096', 'BM-097',
  'BM-098', 'BM-099', 'BM-100', 'BM-101', 'BM-102', 'BM-105', 'BM-106', 'BM-114',
  'BM-115', 'BM-117', 'BM-118', 'BM-126', 'BM-127', 'BM-128', 'BM-129', 'BM-130',
  'BM-131', 'BM-134', 'BM-135', 'BM-136', 'BM-137', 'BM-138', 'BM-139', 'BM-140',
  'BM-142', 'BM-149', 'BM-152', 'BM-153', 'BM-154', 'BM-155', 'BM-156', 'BM-161',
  'BM-163', 'BM-174', 'BM-176', 'BM-179', 'BM-180', 'BM-183', 'BM-184', 'BM-199',
  'BM-202', 'BM-213'
];

// Zero-coverage forms
const ZERO_COVERAGE_FORMS = [
  'BM-024', 'BM-025', 'BM-049', 'BM-050', 'BM-079', 'BM-089', 'BM-107', 'BM-121',
  'BM-122', 'BM-123', 'BM-132', 'BM-143', 'BM-151', 'BM-157', 'BM-158', 'BM-160', 'BM-165'
];

const ALL_FORMS_TO_ANALYZE = [...new Set([...PARTIAL_COVERAGE_FORMS, ...ZERO_COVERAGE_FORMS])];

// ─── Main analysis ─────────────────────────────────────────────────────────────

const COMPILED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'compiled-v2');
const OUTPUT_DIR = join(ROOT, 'docs', 'audit', 'ready-absolute-blocker-burn-down-v3');

console.log('Loading compiled contracts from:', COMPILED_DIR);
console.log('Forms to analyze:', ALL_FORMS_TO_ANALYZE.length);
console.log('');

// Results storage
const unfilledFields = [];
const filledFields = [];
const pathPatternCounts = {};
let totalManualFields = 0;
let totalFilled = 0;
let totalUnfilled = 0;

const formsAnalyzed = [];
const formsNotFound = [];

for (const templateCode of ALL_FORMS_TO_ANALYZE) {
  const filePath = join(COMPILED_DIR, `${templateCode}.compiled.json`);

  let contract;
  try {
    const content = readFileSync(filePath, 'utf-8');
    contract = JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      formsNotFound.push(templateCode);
      console.log(`  [SKIP] ${templateCode}: file not found`);
      continue;
    }
    throw err;
  }

  // Extract MANUAL fields from the contract
  // The fields are in contract.source.fields or we can use the jsonSchema properties
  const fields = contract.source?.fields || [];
  const manualFields = fields.filter(f => f.dataSource?.kind === 'MANUAL');

  formsAnalyzed.push(templateCode);
  let formFilled = 0;
  let formUnfilled = 0;

  for (const field of manualFields) {
    totalManualFields++;
    const { key, label, required } = field;
    const value = generateFieldValue(key, label, required ?? false);
    const isFilled = value !== '';

    if (isFilled) {
      formFilled++;
      totalFilled++;
      filledFields.push({ templateCode, fieldKey: key, fieldLabel: label, value });
    } else {
      formUnfilled++;
      totalUnfilled++;
      const reason = classifyEmptyReason(key, label, required ?? false);
      unfilledFields.push({ templateCode, fieldKey: key, fieldLabel: label, required: required ?? false, reason });

      // Count path patterns
      const pathPrefix = key.split('.')[0];
      pathPatternCounts[pathPrefix] = (pathPatternCounts[pathPrefix] || 0) + 1;
    }
  }

  console.log(`  ${templateCode}: ${formFilled}/${manualFields.length} filled, ${formUnfilled} unfilled`);
}

// ─── Aggregate patterns ────────────────────────────────────────────────────────

// Sort path patterns by count
const unfilledPatterns = Object.entries(pathPatternCounts)
  .map(([pathPrefix, count]) => ({ pathPrefix, count }))
  .sort((a, b) => b.count - a.count);

// Top 20 most common unfilled path patterns
const fieldPathFrequency = unfilledPatterns.slice(0, 20);

// ─── Build report ─────────────────────────────────────────────────────────────

const report = {
  generatedAt: new Date().toISOString(),
  totalUnfilledFields: totalUnfilled,
  totalFilledFields: totalFilled,
  totalManualFields: totalManualFields,
  coverage: totalManualFields > 0 ? Math.round((totalFilled / totalManualFields) * 100) : 0,
  unfilledByPath: unfilledFields,
  unfilledPatterns: unfilledPatterns,
  fieldPathFrequency: fieldPathFrequency,
  formsAnalyzed: formsAnalyzed,
  formsNotFound: formsNotFound,
  summary: {
    formsAnalyzedCount: formsAnalyzed.length,
    formsNotFoundCount: formsNotFound.length,
    topUnfilledPatterns: fieldPathFrequency,
  },
};

// ─── Write output ─────────────────────────────────────────────────────────────

const outputPath = join(OUTPUT_DIR, 'unfilled-fields.latest.json');
writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');

console.log('');
console.log('═'.repeat(60));
console.log('ANALYSIS COMPLETE');
console.log('═'.repeat(60));
console.log(`Total MANUAL fields analyzed: ${totalManualFields}`);
console.log(`Fields filled: ${totalFilled} (${totalManualFields > 0 ? Math.round((totalFilled / totalManualFields) * 100) : 0}%)`);
console.log(`Fields unfilled: ${totalUnfilled}`);
console.log(`Forms analyzed: ${formsAnalyzed.length}`);
console.log(`Forms not found: ${formsNotFound.length}`);
console.log('');
console.log('Top 10 unfilled path patterns:');
for (const { pathPrefix, count } of fieldPathFrequency.slice(0, 10)) {
  console.log(`  ${pathPrefix}: ${count} unfilled fields`);
}
console.log('');
console.log(`Report written to: ${outputPath}`);

// ─── Helper: classify why a field returns empty ────────────────────────────────

function classifyEmptyReason(fieldKey, fieldLabel, isRequired) {
  const keyLower = fieldKey.toLowerCase();
  const labelLower = fieldLabel.toLowerCase();

  // Required field but no heuristics matched
  if (isRequired) {
    // Check if it's a known prefix that just doesn't have this specific field
    const prefix = fieldKey.split('.')[0];
    const hasPrefixDefaults = ALL_DEFAULTS[prefix] !== undefined;
    if (hasPrefixDefaults) {
      return `REQUIRED_BUT_NO_EXACT_MATCH: prefix '${prefix}' has defaults but key '${fieldKey}' not covered`;
    }
    return `REQUIRED_BUT_NO_HEURISTIC: required field with no matching pattern for '${fieldKey}'`;
  }

  // Optional field - empty is acceptable
  return `OPTIONAL_EMPTY: optional field not matched by any heuristic`;
}
