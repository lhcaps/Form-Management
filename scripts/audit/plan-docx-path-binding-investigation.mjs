#!/usr/bin/env node
// scripts/audit/plan-docx-path-binding-investigation.mjs
// Planning script for DOCX path/binding/slot-placement investigation.
// Safe: reads only, writes to docs/audit/docx-path-binding-investigation-plan/

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const W2_CLOSURE    = join(ROOT, 'docs', 'audit', 'docx-wave-02-closure', 'closure.latest.json');
const PRIOR_CLOSURE = join(ROOT, 'docs', 'audit', 'prior-docx-remediation-generic-slot-closure', 'closure.latest.json');
const OUT_DIR       = join(ROOT, 'docs', 'audit', 'docx-path-binding-investigation-plan');
const OUT_JSON      = join(OUT_DIR, 'plan.latest.json');
const OUT_MD        = join(OUT_DIR, 'plan.latest.md');

// ── Root cause taxonomy ────────────────────────────────────────────────────────
const ROOT_CAUSE = {
  FALSE_HEADER_SLOT:              'Slot path looks like header metadata but slot is in body/procedural/signature context. Legitimate canonical field already exists in same contract. Label-only fix would misrepresent the field.',
  BODY_PROCEDURAL_REFERENCE:      'Slot appears in procedural/decision/body text (Xét thấy, Yêu cầu, Căn cứ). Not a document metadata field. References antecedent documents, not current document.',
  RECIPIENT_FILLER_NO_CONTEXT:    'Slot is blank body filler or footer/Nơi nhận suffix. No visible Vietnamese label. Multiple instances without semantic distinction. Cannot approve any UI label safely.',
  PERSON_FIELD_PATH_MISMATCH:     'Slot path (e.g. person.dateOfBirth) does not match rendered content (e.g. phân công/cơ quan reference, card number). Path was set incorrectly during prior remediation.',
  SEMANTICALLY_WRONG_PATH:        'Path name is semantically wrong for the rendered slot context. Remapping path or removing slot is the only safe fix.',
  LEGAL_DECISION_PARKED:         'decision.* / legalBasis.* field. Parked for explicit legal reviewer. Do not approve without legal sign-off.',
  MULTI_COLUMN_LAYOUT_AMBIGUITY:  'Multi-column table layout makes paragraph extraction noisy. Slot position ambiguous. Needs layout-aware XML extraction to determine correct context.',
};

// ── Registry ──────────────────────────────────────────────────────────────────
// Built from both closed lanes. Each entry:
//   investigationId, sourceLane, templateCode, sourceId, path, placeholder,
//   priorCategory, rootCauseHypothesis, nextAction, risk, priority, evidenceSummary

const w2   = JSON.parse(readFileSync(W2_CLOSURE,    'utf8'));
const prior = JSON.parse(readFileSync(PRIOR_CLOSURE, 'utf8'));

// Helper: short evidence summary
const es = (...paragraphs) => `Paragraphs ${paragraphs.join(', ')}. ${ROOT_CAUSE[null] || ''}`;

// ── P0: P0 priority items ────────────────────────────────────────────────────
const P0 = [
  {
    investigationId: 'W2R-027',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-073',
    sourceId: 'BM-073__???', // will be filled from docx-wave-02 master
    path: 'person.dateOfBirth',
    placeholder: '{{document.field3}}',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    rootCauseHypothesis: 'PERSON_FIELD_PATH_MISMATCH',
    nextAction: 'DOCX_REAUTHOR_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P0',
    evidenceSummary: '[018] phân công5__PERSON_DATEOFBIRTH__... để tiếp tục thực hiện nhiệm vụ... — phân công/cơ quan reference, không phải ngày sinh. Footnote 5 mô tả chức danh thay đổi (Thủ trưởng/Cấp trưởng/Phó Thủ trưởng/Điều tra viên). DOCX slot bị gán sai path. Xóa hoặc remap path, không đổi label.',
  },
  {
    investigationId: 'W2R-028',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-073',
    sourceId: 'BM-073__???',
    path: 'person.idNumber',
    placeholder: '{{document.field5}}',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    rootCauseHypothesis: 'PERSON_FIELD_PATH_MISMATCH',
    nextAction: 'DOCX_REAUTHOR_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P0',
    evidenceSummary: '[022] __PERSON_IDNUMBER__.. sau Lưu: HSVV/HSVA... — footnote reference marker, không phải số ID. Footnote 5 mô tả loại chức danh. Path sai. Xóa hoặc remap, không đổi label.',
  },
  {
    investigationId: 'W2R-036',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-080',
    sourceId: 'BM-080__a7aa64d4b889',
    path: 'person.personFullName',
    placeholder: '{{person.personFullName}}',
    priorCategory: 'DEFER',
    rootCauseHypothesis: 'PERSON_FIELD_PATH_MISMATCH',
    nextAction: 'DOCX_REAUTHOR_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P0',
    evidenceSummary: '[021] __PERSON_PERSONFULLNAME__ nằm dưới "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:" — card/license number field, không phải person name. Tên thật của người được bào chữa ở [016] "Ông/Bà:__DOCUMENT_FULLDOCUMENTCODE__". Path bị swapped. Investigate: DOCX slot placement error vs binding error.',
  },
  {
    investigationId: 'PRIOR-DXR-001',
    sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT',
    templateCode: 'BM-063',
    sourceId: 'BM-063__54b73110a34f',
    path: 'document.fullDocumentCode8',
    placeholder: '__DOCUMENT_FULLDOCUMENTCODE8__',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'DOCX_REAUTHOR_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P0',
    evidenceSummary: '[011]-[017] slots ở body procedural context (ngày tháng năm, Kiểm sát viên superscript, UBND cấp xã). Legitimate document.fullDocumentCode (label: Số văn bản) đã tồn tại. Slot là procedural reference tới Lệnh kê biên tài sản gốc. Label-only fix sai. Cần remap hoặc xóa DOCX slot.',
  },
  {
    investigationId: 'PRIOR-DXR-002',
    sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT',
    templateCode: 'BM-064',
    sourceId: 'BM-064__4d8cebc3515b',
    path: 'document.issueDate4',
    placeholder: '__DOCUMENT_ISSUEDATE4__',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    rootCauseHypothesis: 'BODY_PROCEDURAL_REFERENCE',
    nextAction: 'DOCX_REAUTHOR_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P0',
    evidenceSummary: '[016]-[017] slot nằm trong "Xét thấy..." và citation block procedural. [020] trong "Điều 2. Yêu cầu...". [026] suffix Nơi nhận. Đây không phải date placeholder — là procedural text filler. Legitimate document.issueDate đã tồn tại. Path name sai. Investigate: DOCX slot bị gán nhầm hay rendering extraction đọc sai?',
  },
];

// ── P1: false-header + recipients filler ─────────────────────────────────────
const P1_FALSE_HEADER = [
  {
    investigationId: 'W2R-013',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-069',
    sourceId: 'BM-069__3a67d1a2e298',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    priorCategory: 'DEFER',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'PATH_BINDING_INVESTIGATE',
    risk: 'MEDIUM',
    priority: 'P1',
    evidenceSummary: 'BM-069 là biên bản. Header Số: tồn tại nhưng không có slot. DOCX slot ở body biên bản procedural context. False-header pattern: slot không nằm ở header dù path là document.fullDocumentCode.',
  },
  {
    investigationId: 'W2R-029',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-075',
    sourceId: 'BM-075__dc493cfb5fd3',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    priorCategory: 'DEFER',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'PATH_BINDING_INVESTIGATE',
    risk: 'MEDIUM',
    priority: 'P1',
    evidenceSummary: '[007] header "Số: …/CV-VKS…" không có slot. Slot __DOCUMENT_FULLDOCUMENTCODE__ ở [007] "Xét thấy __DOCUMENT_FULLDOCUMENTCODE__ ĐỀ NGHỊ:" — body procedural context. False-header.',
  },
  {
    investigationId: 'W2R-033',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-077',
    sourceId: 'BM-077__???',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    priorCategory: 'DEFER',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'PATH_BINDING_INVESTIGATE',
    risk: 'MEDIUM',
    priority: 'P1',
    evidenceSummary: '[007] header "Số: …/YC/ĐN-VKS…" không có slot. Slot __DOCUMENT_FULLDOCUMENTCODE__ ở "Nơi nhận: - 10 __DOCUMENT_FULLDOCUMENTCODE__ - Lưu:" — Nơi nhận footer, không phải document header. False-header + Nơi nhận slot.',
  },
  {
    investigationId: 'W2R-040',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-082',
    sourceId: 'BM-082__???',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    priorCategory: 'DEFER',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'PATH_BINDING_INVESTIGATE',
    risk: 'MEDIUM',
    priority: 'P1',
    evidenceSummary: '[007] header "Số: …/TB-VKS…" không có slot. Slot __DOCUMENT_FULLDOCUMENTCODE__ ở body procedural context: "...đối với __DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát...". Procedural reference, không phải document code. False-header.',
  },
  {
    investigationId: 'W2R-025',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-073',
    sourceId: 'BM-073__???',
    path: 'document.fullDocumentCode',
    placeholder: '{{document.field1}}',
    priorCategory: 'DEFER',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'PATH_BINDING_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P1',
    evidenceSummary: '[009] visible "Số: …/YC-VKS…" header không có slot. Slot __DOCUMENT_FULLDOCUMENTCODE__ ở [012] "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__" — body title. False-header body-slot pattern.',
  },
  {
    investigationId: 'W2R-026',
    sourceLane: 'WAVE_02',
    templateCode: 'BM-073',
    sourceId: 'BM-073__???',
    path: 'document.issueDate',
    placeholder: '{{document.field2}}',
    priorCategory: 'DEFER',
    rootCauseHypothesis: 'BODY_PROCEDURAL_REFERENCE',
    nextAction: 'PATH_BINDING_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P1',
    evidenceSummary: '[010] visible date header không có slot. Slot __DOCUMENT_ISSUEDATE__ ở [016] "Xét thấy__DOCUMENT_ISSUEDATE__" — body reasoning clause. Không phải issuance date.',
  },
  {
    investigationId: 'PRIOR-DXR-003',
    sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT',
    templateCode: 'BM-065',
    sourceId: 'BM-065__4a64c8d7e96c',
    path: 'document.fullDocumentCode8',
    placeholder: '__DOCUMENT_FULLDOCUMENTCODE8__',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'DOCX_REAUTHOR_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P1',
    evidenceSummary: '[011]-[017][029]-[030] slots ở body procedural context (Kiểm sát viên superscript, UBND cấp xã, "Ngay sau khi nhận được"). Legitimate document.fullDocumentCode đã tồn tại. Procedural reference tới antecedent Lệnh/Quyết định.',
  },
  {
    investigationId: 'PRIOR-DXR-004',
    sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT',
    templateCode: 'BM-066',
    sourceId: 'BM-066__e3bc56081554',
    path: 'document.fullDocumentCode4',
    placeholder: '__DOCUMENT_FULLDOCUMENTCODE4__',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'DOCX_REAUTHOR_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P1',
    evidenceSummary: '[010] slot ở TRÊN title "LỆNH / PHONG TỎA TÀI KHOẢN" (vị trí cấu trúc bất thường). [018][030] procedural. [026] inside "Số CMND/..." line. Legitimate document.fullDocumentCode đã tồn tại. Investigate: slot bị gán nhầm chỗ nào trong DOCX XML binding?',
  },
  {
    investigationId: 'PRIOR-DXR-005',
    sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT',
    templateCode: 'BM-067',
    sourceId: 'BM-067__0f7607122f29',
    path: 'document.fullDocumentCode6',
    placeholder: '__DOCUMENT_FULLDOCUMENTCODE6__',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    rootCauseHypothesis: 'FALSE_HEADER_SLOT',
    nextAction: 'DOCX_REAUTHOR_INVESTIGATE',
    risk: 'HIGH',
    priority: 'P1',
    evidenceSummary: '[011] slot ở TRÊN title "BIÊN BẢN / Phong tỏa tài khoản". [013]-[016] adjacent to Kiểm sát viên / Đại diện Tổ chức tín dụng signature lines. Legitimate document.fullDocumentCode đã tồn tại. Structural/biên bản body slot.',
  },
];

const P1_RECIPIENTS = [
  { investigationId: 'PRIOR-DXR-006', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-063', sourceId: 'BM-063__54b73110a34f', path: 'recipients.personLine5',    placeholder: '__RECIPIENTS_PERSONLINE5__', priorCategory: 'DEFER_NO_CONTEXT', rootCauseHypothesis: 'RECIPIENT_FILLER_NO_CONTEXT', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P1', evidenceSummary: '[021][022][025][030][031] blank filler interleaved with recipient fields. No visible label.' },
  { investigationId: 'PRIOR-DXR-007', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-065', sourceId: 'BM-065__4a64c8d7e96c', path: 'recipients.personLine3',    placeholder: '__RECIPIENTS_PERSONLINE3__', priorCategory: 'DEFER_NO_CONTEXT', rootCauseHypothesis: 'RECIPIENT_FILLER_NO_CONTEXT', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P1', evidenceSummary: '[021][022][025] blank filler between Tên gọi khác and Nghề nghiệp. No visible label.' },
  { investigationId: 'PRIOR-DXR-008', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-052', sourceId: 'BM-052__9919ecdb3971', path: 'recipients.personLine6',    placeholder: '__RECIPIENTS_PERSONLINE6__', priorCategory: 'DEFER_NO_CONTEXT', rootCauseHypothesis: 'RECIPIENT_FILLER_NO_CONTEXT', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P1', evidenceSummary: '[019]-[021][024][027] blank filler + [035] footer suffix after Nơi nhận. No visible label.' },
  { investigationId: 'PRIOR-DXR-009', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-061', sourceId: 'BM-061__ec44550246e9', path: 'recipients.personLine3',    placeholder: '__RECIPIENTS_PERSONLINE3__', priorCategory: 'DEFER_NO_CONTEXT', rootCauseHypothesis: 'RECIPIENT_FILLER_NO_CONTEXT', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P1', evidenceSummary: '[022][023][026] blank filler. No visible label.' },
  { investigationId: 'PRIOR-DXR-010', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-062', sourceId: 'BM-062__110961a781fa', path: 'recipients.personLine5',    placeholder: '__RECIPIENTS_PERSONLINE5__', priorCategory: 'DEFER_NO_CONTEXT', rootCauseHypothesis: 'RECIPIENT_FILLER_NO_CONTEXT', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P1', evidenceSummary: '[021]-[023] blank filler + [037] footer suffix after Nơi nhận. No visible label.' },
  { investigationId: 'PRIOR-DXR-011', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-066', sourceId: 'BM-066__e3bc56081554', path: 'recipients.personLine4',    placeholder: '__RECIPIENTS_PERSONLINE4__', priorCategory: 'DEFER_NO_CONTEXT', rootCauseHypothesis: 'RECIPIENT_FILLER_NO_CONTEXT', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P1', evidenceSummary: '[023][024] blank filler + [031] footer suffix after Nơi nhận. No visible label.' },
  { investigationId: 'PRIOR-DXR-012', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-067', sourceId: 'BM-067__0f7607122f29', path: 'recipients.personLine3',    placeholder: '__RECIPIENTS_PERSONLINE3__', priorCategory: 'DEFER_NO_CONTEXT', rootCauseHypothesis: 'RECIPIENT_FILLER_NO_CONTEXT', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P1', evidenceSummary: '[021][022][025] blank filler. No visible label.' },
];

// ── P2: layout + legal ──────────────────────────────────────────────────────
const P2_LEGAL = [
  { investigationId: 'W2R-039', sourceLane: 'WAVE_02', templateCode: 'BM-080', sourceId: 'BM-080__a7aa64d4b889', path: 'legalBasis.legalBasisLine', placeholder: '{{legalBasis.legalBasisLine}}', priorCategory: 'LEGAL_REVIEW', rootCauseHypothesis: 'LEGAL_DECISION_PARKED', nextAction: 'LEGAL_REVIEW', risk: 'HIGH', priority: 'P2', evidenceSummary: 'Slot trong Nơi nhận block. Actual legal basis ở preamble. Legal field.' },
  { investigationId: 'W2R-022', sourceLane: 'WAVE_02', templateCode: 'BM-069', sourceId: 'BM-069__3a67d1a2e298', path: 'decision.decisionLine',       placeholder: '{{document.field8}}',           priorCategory: 'LEGAL_REVIEW', rootCauseHypothesis: 'LEGAL_DECISION_PARKED', nextAction: 'LEGAL_REVIEW', risk: 'HIGH', priority: 'P2', evidenceSummary: 'Procedural decision/command context involving Lệnh/Quyết định phong tỏa.' },
  { investigationId: 'W2R-056', sourceLane: 'WAVE_02', templateCode: 'BM-163', sourceId: 'BM-163__61941122b9e4', path: 'case.caseNumber',             placeholder: '{{case.caseNumber}}',             priorCategory: 'DEFER',         rootCauseHypothesis: 'LEGAL_DECISION_PARKED', nextAction: 'LEGAL_REVIEW', risk: 'MEDIUM', priority: 'P2', evidenceSummary: 'case/docket number field. Legal/procedural field.' },
  { investigationId: 'PRIOR-DXR-013', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-051', sourceId: 'BM-051__???', path: 'decision.decisionLine3', placeholder: '__DECISION_DECISIONLINE3__', priorCategory: 'LEGAL_REVIEW_REQUIRED', rootCauseHypothesis: 'LEGAL_DECISION_PARKED', nextAction: 'LEGAL_REVIEW', risk: 'HIGH', priority: 'P2', evidenceSummary: 'decision.* field. Parked for legal reviewer.' },
  { investigationId: 'PRIOR-DXR-014', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-052', sourceId: 'BM-052__9919ecdb3971', path: 'decision.decisionLine2', placeholder: '__DECISION_DECISIONLINE2__', priorCategory: 'LEGAL_REVIEW_REQUIRED', rootCauseHypothesis: 'LEGAL_DECISION_PARKED', nextAction: 'LEGAL_REVIEW', risk: 'HIGH', priority: 'P2', evidenceSummary: 'decision.* field. Parked for legal reviewer.' },
  { investigationId: 'PRIOR-DXR-015', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-060', sourceId: 'BM-060__???', path: 'decision.decisionLine10', placeholder: '__DECISION_DECISIONLINE10__', priorCategory: 'LEGAL_REVIEW_REQUIRED', rootCauseHypothesis: 'LEGAL_DECISION_PARKED', nextAction: 'LEGAL_REVIEW', risk: 'HIGH', priority: 'P2', evidenceSummary: 'decision.* field. Parked for legal reviewer.' },
  { investigationId: 'PRIOR-DXR-016', sourceLane: 'PRIOR_DOCX_REMEDIATION_GENERIC_SLOT', templateCode: 'BM-062', sourceId: 'BM-062__110961a781fa', path: 'decision.decisionLine11', placeholder: '__DECISION_DECISIONLINE11__', priorCategory: 'LEGAL_REVIEW_REQUIRED', rootCauseHypothesis: 'LEGAL_DECISION_PARKED', nextAction: 'LEGAL_REVIEW', risk: 'HIGH', priority: 'P2', evidenceSummary: 'decision.* field. Parked for legal reviewer.' },
];

const P2_LAYOUT = [
  { investigationId: 'W2R-043', sourceLane: 'WAVE_02', templateCode: 'BM-162', sourceId: 'BM-162__6e7e16348066', path: 'person.dateOfBirth',   placeholder: '{{document.field3}}',         priorCategory: 'DEFER', rootCauseHypothesis: 'MULTI_COLUMN_LAYOUT_AMBIGUITY', nextAction: 'LAYOUT_AWARE_EXTRACTION', risk: 'MEDIUM', priority: 'P2', evidenceSummary: 'BM-162 multi-column table. Field codes interspersed. No clear DOB label visible.' },
  { investigationId: 'W2R-050', sourceLane: 'WAVE_02', templateCode: 'BM-163', sourceId: 'BM-163__61941122b9e4', path: 'person.dateOfBirth',   placeholder: '{{document.field3}}',         priorCategory: 'DEFER', rootCauseHypothesis: 'MULTI_COLUMN_LAYOUT_AMBIGUITY', nextAction: 'LAYOUT_AWARE_EXTRACTION', risk: 'MEDIUM', priority: 'P2', evidenceSummary: 'BM-163 multi-column table. No clear DOB label visible.' },
  { investigationId: 'W2R-052', sourceLane: 'WAVE_02', templateCode: 'BM-163', sourceId: 'BM-163__61941122b9e4', path: 'person.occupation',   placeholder: '{{person.occupation}}',       priorCategory: 'DEFER', rootCauseHypothesis: 'MULTI_COLUMN_LAYOUT_AMBIGUITY', nextAction: 'LAYOUT_AWARE_EXTRACTION', risk: 'LOW',  priority: 'P2', evidenceSummary: '"Là" token between currentAddress and occupation — not a visible label.' },
  { investigationId: 'W2R-053', sourceLane: 'WAVE_02', templateCode: 'BM-163', sourceId: 'BM-163__61941122b9e4', path: 'person.ward',         placeholder: '{{person.ward}}',             priorCategory: 'DEFER', rootCauseHypothesis: 'MULTI_COLUMN_LAYOUT_AMBIGUITY', nextAction: 'LAYOUT_AWARE_EXTRACTION', risk: 'LOW',  priority: 'P2', evidenceSummary: 'No visible Phường/Xã label.' },
  { investigationId: 'W2R-054', sourceLane: 'WAVE_02', templateCode: 'BM-163', sourceId: 'BM-163__61941122b9e4', path: 'person.province',     placeholder: '{{person.province}}',         priorCategory: 'DEFER', rootCauseHypothesis: 'MULTI_COLUMN_LAYOUT_AMBIGUITY', nextAction: 'LAYOUT_AWARE_EXTRACTION', risk: 'LOW',  priority: 'P2', evidenceSummary: 'No visible Tỉnh/Thành phố label.' },
];

const P2_BODY_MISC = [
  { investigationId: 'W2R-017', sourceLane: 'WAVE_02', templateCode: 'BM-069', sourceId: 'BM-069__3a67d1a2e298', path: 'document.reasonLine',   placeholder: '{{document.field6}}', priorCategory: 'DEFER', rootCauseHypothesis: 'BODY_PROCEDURAL_REFERENCE', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P2', evidenceSummary: '[017] body-line slot no visible label. Body procedural text.' },
  { investigationId: 'W2R-018', sourceLane: 'WAVE_02', templateCode: 'BM-069', sourceId: 'BM-069__3a67d1a2e298', path: 'document.reasonLine2', placeholder: '{{document.field7}}', priorCategory: 'DEFER', rootCauseHypothesis: 'BODY_PROCEDURAL_REFERENCE', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P2', evidenceSummary: '[018] sentence-trailing slot in thi-hành Quyết định clause.' },
  { investigationId: 'W2R-024', sourceLane: 'WAVE_02', templateCode: 'BM-069', sourceId: 'BM-069__3a67d1a2e298', path: 'document.summaryLine', placeholder: '{{document.field12}}', priorCategory: 'DEFER', rootCauseHypothesis: 'BODY_PROCEDURAL_REFERENCE', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P2', evidenceSummary: '[031] slot at end of clause 2 — account-info enumeration completion.' },
  { investigationId: 'W2R-031', sourceLane: 'WAVE_02', templateCode: 'BM-075', sourceId: 'BM-075__dc493cfb5fd3', path: 'person.dateOfBirth',   placeholder: '{{person.dateOfBirth}}', priorCategory: 'DEFER', rootCauseHypothesis: 'PERSON_FIELD_PATH_MISMATCH', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P2', evidenceSummary: '[018] slot inside translation subject sentence — not a DOB field.' },
  { investigationId: 'W2R-032', sourceLane: 'WAVE_02', templateCode: 'BM-075', sourceId: 'BM-075__dc493cfb5fd3', path: 'person.currentAddress', placeholder: '{{person.currentAddress}}', priorCategory: 'DEFER', rootCauseHypothesis: 'RECIPIENT_FILLER_NO_CONTEXT', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P2', evidenceSummary: '[027] slot in Nơi nhận block with footnote marker 6. Not a person address field.' },
  { investigationId: 'W2R-037', sourceLane: 'WAVE_02', templateCode: 'BM-080', sourceId: 'BM-080__a7aa64d4b889', path: 'person.dateOfBirth',   placeholder: '{{person.dateOfBirth}}', priorCategory: 'DEFER', rootCauseHypothesis: 'BODY_PROCEDURAL_REFERENCE', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P2', evidenceSummary: '[024] "5 __PERSON_DATEOFBIRTH__ 6" — footnote markers 5 and 6 in Xét thấy sentence.' },
  { investigationId: 'W2R-038', sourceLane: 'WAVE_02', templateCode: 'BM-080', sourceId: 'BM-080__a7aa64d4b889', path: 'person.currentAddress', placeholder: '{{person.currentAddress}}', priorCategory: 'DEFER', rootCauseHypothesis: 'BODY_PROCEDURAL_REFERENCE', nextAction: 'KEEP_DEFERRED',      risk: 'MEDIUM', priority: 'P2', evidenceSummary: '[026] "thông báo cho ông (bà) 5 __PERSON_CURRENTADDRESS__ biết" — thông báo sentence, footnote marker 5.' },
];

// ── Assemble full registry ─────────────────────────────────────────────────────
const allItems = [...P0, ...P1_FALSE_HEADER, ...P1_RECIPIENTS, ...P2_LEGAL, ...P2_LAYOUT, ...P2_BODY_MISC];

const byHypothesis = {};
const byRemediation = {};
const byPriority    = { P0: [], P1: [], P2: [] };
const byBM          = {};

for (const item of allItems) {
  const bm = item.templateCode;
  if (!byHypothesis[item.rootCauseHypothesis]) byHypothesis[item.rootCauseHypothesis] = [];
  if (!byRemediation[item.nextAction])          byRemediation[item.nextAction]         = [];
  if (!byBM[bm])                               byBM[bm]                                = [];

  byHypothesis[item.rootCauseHypothesis].push(item);
  byRemediation[item.nextAction].push(item);
  byPriority[item.priority].push(item);
  byBM[bm].push(item);
}

// ── Counts ────────────────────────────────────────────────────────────────────
const counts = {
  total: allItems.length,
  byPriority: { P0: P0.length, P1: P1_FALSE_HEADER.length + P1_RECIPIENTS.length, P2: P2_LEGAL.length + P2_LAYOUT.length + P2_BODY_MISC.length },
  byHypothesis: Object.fromEntries(Object.entries(byHypothesis).map(([k, v]) => [k, v.length])),
  byRemediation: Object.fromEntries(Object.entries(byRemediation).map(([k, v]) => [k, v.length])),
  docxReauthorCandidate: allItems.filter(i => i.nextAction === 'DOCX_REAUTHOR_INVESTIGATE').length,
  pathBindingCandidate:  allItems.filter(i => i.nextAction === 'PATH_BINDING_INVESTIGATE').length,
  legalReviewCandidate:   allItems.filter(i => i.nextAction === 'LEGAL_REVIEW').length,
  layoutCandidate:        allItems.filter(i => i.nextAction === 'LAYOUT_AWARE_EXTRACTION').length,
  keepDeferred:           allItems.filter(i => i.nextAction === 'KEEP_DEFERRED').length,
};

// ── Markdown report ────────────────────────────────────────────────────────────
const registryTable = allItems.map(i =>
  `| ${i.investigationId} | ${i.templateCode} | ${i.path} | ${i.priorCategory} | ${i.rootCauseHypothesis} | ${i.nextAction} | ${i.risk} | ${i.priority} |`
).join('\n');

const p0Table = P0.map(i =>
  `| ${i.investigationId} | ${i.templateCode} | ${i.path} | ${i.priorCategory} | ${i.rootCauseHypothesis} | ${i.nextAction} | ${i.risk} |`
).join('\n');

const p1fhTable = P1_FALSE_HEADER.map(i =>
  `| ${i.investigationId} | ${i.templateCode} | ${i.path} | ${i.priorCategory} | ${i.rootCauseHypothesis} | ${i.nextAction} | ${i.risk} |`
).join('\n');

const p1rcTable = P1_RECIPIENTS.map(i =>
  `| ${i.investigationId} | ${i.templateCode} | ${i.path} | ${i.priorCategory} | ${i.rootCauseHypothesis} | ${i.nextAction} | ${i.risk} |`
).join('\n');

const md = `# DOCX Path/Binding Investigation Plan

Generated: ${new Date().toISOString()}

---

## Executive Summary

**Current audit state:**
| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

**Why label-only remediation must pause for these patterns:**

Two independent lanes (Wave 02 + Prior DOCX Remediation Generic Slot) have demonstrated the same systemic root cause: **slot placement in DOCX XML does not match the semantic path name.** Label-only remediation cannot distinguish between:
1. A slot that genuinely belongs to a document metadata field but has a wrong label
2. A slot that is placed in body/procedural/signature/footer context with a misleading path name

Approving labels on items in category (2) would misrepresent the field to users and corrupt data entry semantics.

**Investigation registry total: ${counts.total} suspect items**

| By Priority | Count |
|-------------|-------|
| P0 (highest) | ${counts.byPriority.P0} |
| P1 | ${counts.byPriority.P1} |
| P2 | ${counts.byPriority.P2} |

| By Root Cause Hypothesis | Count |
|--------------------------|-------|
${Object.entries(counts.byHypothesis).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

| By Recommended Action | Count |
|------------------------|-------|
| DOCX_REAUTHOR_INVESTIGATE | ${counts.docxReauthorCandidate} |
| PATH_BINDING_INVESTIGATE  | ${counts.pathBindingCandidate} |
| LEGAL_REVIEW              | ${counts.legalReviewCandidate} |
| LAYOUT_AWARE_EXTRACTION   | ${counts.layoutCandidate} |
| KEEP_DEFERRED             | ${counts.keepDeferred} |

**Recommended priority order:** P0 → P1 → P2 (P2 items need P0/P1 resolved first for BM overlap)

---

## Evidence from Closed Lanes

### Wave 02 Closure Findings

Wave 02 reviewed 56 items. Key systemic patterns identified:

**False-header / body slot (document metadata path but body/procedural placement):**
- BM-069 W2R-013: biên bản body slot, no header slot
- BM-075 W2R-029: slot in "Xét thấy ĐỀ NGHỊ" procedural line, header has no slot
- BM-077 W2R-033: slot in Nơi nhận footer, not document header
- BM-082 W2R-040: slot in procedural body "đối với __DOCUMENT_FULLDOCUMENTCODE__ Viện kiểm sát"
- BM-073 W2R-025: slot in "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__" body title

**document.issueDate body reasoning-clause:**
- BM-073 W2R-026: slot in "Xét thấy__DOCUMENT_ISSUEDATE__" body reasoning clause

**Person field path mismatch (semantic wrong path):**
- BM-080 W2R-036: person.personFullName appears under "Số thẻ luật sư" — card number context
- BM-073 W2R-027: person.dateOfBirth = phân công/cơ quan reference (footnote 5)
- BM-073 W2R-028: person.idNumber = footnote reference marker

**Person fields in footnote/procedural slots:**
- BM-080 W2R-037: person.dateOfBirth in Xét thấy footnote marker sentence
- BM-080 W2R-038: person.currentAddress in thông báo sentence

**Multi-column layout ambiguity:**
- BM-162 W2R-043: person.dateOfBirth — noisy multi-column table extraction
- BM-163 W2R-050: person.dateOfBirth — noisy multi-column table extraction

**Legal/procedural fields parked:**
- W2R-022: decision.decisionLine — Lệnh/Quyết định phong tỏa context
- W2R-039: legalBasis.legalBasisLine — Nơi nhận block
- W2R-056: case.caseNumber — legal field

### Prior DOCX Remediation Generic Slot Closure Findings

Reviewed 16 items. Key patterns:

**DOCX_REAUTHOR_REQUIRED (5 items):** BM-063, BM-065 document.fullDocumentCode8; BM-064 document.issueDate4; BM-066, BM-067 document.fullDocumentCode4/6 — all appear in body/procedural/signature context, legitimate canonical document metadata already exists.

**DEFER_NO_CONTEXT (7 items):** BM-052/061/062/063/065/066/067 recipients.personLine3/4/5/6 — generic blank filler slots, footer Nơi nhận suffix, no visible Vietnamese label.

**LEGAL_REVIEW (4 items):** BM-051/052/060/062 decision.decisionLine* — parked, do not approve without legal reviewer.

---

## Root Cause Taxonomy

### FALSE_HEADER_SLOT
Slot path looks like document metadata (e.g., document.fullDocumentCode) but the DOCX slot is not in the header — it is in the body, procedural text, or footer. The legitimate canonical field already exists in the same contract with a correct label. Fixing the label would misrepresent the slot's actual purpose.

### BODY_PROCEDURAL_REFERENCE
Slot appears in procedural/decision body text (Xét thấy, Yêu cầu, Căn cứ, thông báo). The slot references an antecedent document or provides a grammatical continuation of a legal sentence. Not a document metadata field.

### RECIPIENT_FILLER_NO_CONTEXT
Slot is a blank body filler or Nơi nhận footer suffix. Multiple instances per contract without semantic distinction. No visible Vietnamese label. Cannot approve any UI label safely.

### PERSON_FIELD_PATH_MISMATCH
Slot path (e.g., \`person.dateOfBirth\`, \`person.personFullName\`) does not match the rendered DOCX content (e.g., phân công/cơ quan reference, card number, footnote marker). The path was set incorrectly during prior DOCX remediation. Remapping or removing the slot is the only safe fix.

### SEMANTICALLY_WRONG_PATH
Similar to PERSON_FIELD_PATH_MISMATCH but for any field. The path name is semantically wrong for the rendered slot context. Requires path remapping or DOCX slot removal.

### LEGAL_DECISION_PARKED
decision.* / legalBasis.* fields. Parked for explicit legal reviewer. Do not approve without legal sign-off.

### MULTI_COLUMN_LAYOUT_AMBIGUITY
Multi-column table layout makes paragraph extraction noisy. Slot position ambiguous. Needs layout-aware XML extraction (table-aware) to determine correct context.

---

## Investigation Registry

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk | Priority |
|----|----|------|----------------|-----------|-------------|------|----------|
${registryTable}

---

## P0 Candidates

**Rationale:** These items are strong evidence of wrong path or wrong DOCX placement. Fixing labels would be dangerous and could corrupt data semantics.

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
${p0Table}

---

## P1 Candidates

### False-header document metadata slots

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
${p1fhTable}

### Recipients filler no-context slots

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
${p1rcTable}

---

## P2 Candidates

### Legal/decision parked

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
${P2_LEGAL.map(i => `| ${i.investigationId} | ${i.templateCode} | ${i.path} | ${i.priorCategory} | ${i.rootCauseHypothesis} | ${i.nextAction} | ${i.risk} |`).join('\n')}

### Multi-column layout ambiguity

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
${P2_LAYOUT.map(i => `| ${i.investigationId} | ${i.templateCode} | ${i.path} | ${i.priorCategory} | ${i.rootCauseHypothesis} | ${i.nextAction} | ${i.risk} |`).join('\n')}

### Body procedural miscellaneous

| ID | BM | Path | Prior Category | Hypothesis | Next Action | Risk |
|----|----|------|----------------|-----------|-------------|------|
${P2_BODY_MISC.map(i => `| ${i.investigationId} | ${i.templateCode} | ${i.path} | ${i.priorCategory} | ${i.rootCauseHypothesis} | ${i.nextAction} | ${i.risk} |`).join('\n')}

---

## Recommended Next Task

**DOCX_PATH_BINDING_P0_INVESTIGATION_BATCH_1**

Scope (5 P0 items):
- W2R-027: BM-073 person.dateOfBirth (phân công/cơ quan reference)
- W2R-028: BM-073 person.idNumber (footnote reference)
- W2R-036: BM-080 person.personFullName (Số thẻ context)
- PRIOR-DXR-001: BM-063 document.fullDocumentCode8 (body procedural)
- PRIOR-DXR-002: BM-064 document.issueDate4 (procedural text filler)

**This task is read-only / investigation-only.** No DOCX mutation. No contract mutation. No apply.

Investigation questions per item:
1. Is the wrong path in the DOCX XML binding (slot placed in wrong position), or in the path field itself?
2. Does the DOCX slot need to be removed, remapped to a new path, or is it redundant with an existing legitimate slot?
3. Should the slot be removed entirely, or is there a legitimate semantic role it should fulfill?

---

## Safety

- Locked contracts mutated: **0**
- DOCX touched: **0**
- Source/path/binding touched: **0**
- Compiled artifacts hand-edited: **0**
- Apply write triggered: **0**

---

_Lane closure auto-generated. Do not edit manually._
`;

// ── Write outputs ─────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_MD,  md,                   'utf8');
writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), counts, items: allItems, byHypothesis: Object.fromEntries(Object.entries(byHypothesis).map(([k, v]) => [k, v.length])), byRemediation: Object.fromEntries(Object.entries(byRemediation).map(([k, v]) => [k, v.length])), byPriority, byBM }, null, 2), 'utf8');

console.log(`[plan] Written ${OUT_MD}`);
console.log(`[plan] Written ${OUT_JSON}`);
console.log(`[plan] Registry: ${counts.total} items`);
console.log(`[plan]   P0=${counts.byPriority.P0} P1=${counts.byPriority.P1} P2=${counts.byPriority.P2}`);
console.log(`[plan]   byHypothesis:`, JSON.stringify(counts.byHypothesis));
console.log(`[plan]   byRemediation:`, JSON.stringify(counts.byRemediation));
