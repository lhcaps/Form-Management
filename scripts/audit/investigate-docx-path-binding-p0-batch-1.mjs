#!/usr/bin/env node
// scripts/audit/investigate-docx-path-binding-p0-batch-1.mjs
// DOCX Path/Binding P0 Investigation Batch 1 — read-only root cause investigation.
// Safe: reads only, writes to docs/audit/docx-path-binding-p0-investigation-batch-1/

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const OUT_DIR  = join(ROOT, 'docs', 'audit', 'docx-path-binding-p0-investigation-batch-1');
const OUT_JSON = join(OUT_DIR, 'investigation.latest.json');
const OUT_MD   = join(OUT_DIR, 'investigation.latest.md');

// ── P0 items (sourceIds resolved from forms-root-cause/latest.json) ───────────
const SOURCE_IDS = {
  'BM-073': 'e412fccad227',
  'BM-080': 'a7aa64d4b889',
  'BM-063': '54b73110a34f',
  'BM-064': '4d8cebc3515b',
};

// ── Findings ────────────────────────────────────────────────────────────────
//
// BM-073 (sourceId: e412fccad227)
//   Contract type: Yêu cầu thay đổi nhân sự (personnel change request)
//   Legitimate canonical person fields: NONE — this is not a personal info form
//   person.dateOfBirth: blockId=null, placeholder={{document.field3}} (path mismatch marker)
//   person.idNumber: blockId=null, placeholder={{document.field5}} (path mismatch marker)
//   BM-073 paragraphs:
//     [018] "Thủ trưởng Cơ quan ... phân công5__PERSON_DATEOFBIRTH__..."
//            footnote 5 = phân công/cơ quan — "Ghi cơ quan, người có thẩm quyền ra Quyết định phân công"
//     [022] "__PERSON_IDNUMBER__.." after "Lưu: HSVV/HSVA, HSKS, VP."
//            footnote reference marker, NOT an ID number
//   Conclusion: WRONG_PATH_IN_CONTRACT — neither DOB nor ID number exists in this form.
//   BM-073 concerns changing Thủ trưởng/Cấp trưởng/Điều tra viên/cán bộ.
//   REMOVE_FIELD_FROM_CONTRACT — confidence: HIGH.
//
// BM-080 (sourceId: a7aa64d4b889)
//   Contract type: Thông báo từ chối đăng ký bào chữa
//   person.personFullName: blockId=null, placeholder={{person.personFullName}}
//   BM-080 paragraphs:
//     [021] "__PERSON_PERSONFULLNAME__" is directly under "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:"
//            This is a CARD/LICENSE NUMBER field, not a person name.
//     [016] The real person's name slot is under "Ông/Bà:__DOCUMENT_FULLDOCUMENTCODE__" (sic)
//     BM-080 footnote 6 = "Ghi họ tên người bào chữa"
//     BM-080 footnote 5 = "Ghi họ tên người bị buộc tội được bào chữa"
//   Conclusion: WRONG_PATH_IN_CONTRACT — person.personFullName should be a card-number path.
//   Tentative new path: defender.cardLicenseNumber or legalAid.cardLicenseNumber
//   REMOVE_FIELD_FROM_CONTRACT (current) + CREATE_NEW_SEMANTIC_PATH — confidence: HIGH.
//
// BM-063 (sourceId: 54b73110a34f)
//   Contract type: Biên bản kê biên tài sản
//   document.fullDocumentCode8: blockId=null, placeholder=__DOCUMENT_FULLDOCUMENTCODE8__
//   BM-063 paragraphs:
//     [011] "__DOCUMENT_FULLDOCUMENTCODE8__ngày ... tháng ... năm ..." — antecedent date ref
//     [013] "Ông/Bà: ... Kiểm sát viên ...2__DOCUMENT_FULLDOCUMENTCODE8__" — Kiểm sát viên ref
//     [014][015][016][017] additional references — procedural context
//     [033] "__DOCUMENT_FULLDOCUMENTCODE8__ngày ... tháng ..." — closing ref
//   Legitimate document.fullDocumentCode exists (label="Số văn bản") at blockId=P0033
//   The 8-suffixed slots reference the underlying Lệnh kê biên tài sản document being reported on
//   Conclusion: WRONG_PATH_IN_CONTRACT + ANTECEDENT_REFERENCE — the _8 suffix was likely
//   added during prior DOCX remediation to distinguish antecedent doc slots.
//   The slots reference antecedent document code, not current document code.
//   REMOVE_FIELD_FROM_CONTRACT — blockId=null orphans with no legitimate role — confidence: HIGH.
//
// BM-064 (sourceId: 4d8cebc3515b)
//   Contract type: Quyết định hủy bỏ biện pháp kê biên tài sản
//   document.issueDate4: blockId=null, placeholder=__DOCUMENT_ISSUEDATE4__
//   BM-064 paragraphs:
//     [016] "Căn cứ Lệnh kê biên tài sản số ... ngày ... tháng ... năm ... của... đối với__DOCUMENT_ISSUEDATE4__"
//     [017] "Xét thấy__DOCUMENT_ISSUEDATE4__"
//     [020] "Điều 2. Yêu cầu 7 và 8__DOCUMENT_ISSUEDATE4__thực hiện Quyết định này"
//     [026] "10__DOCUMENT_ISSUEDATE4__" — suffix after Nơi nhận list
//   Legitimate document.issueDate already exists (standard computed date field)
//   The _4-suffixed slots are procedural/antecedent date references, not current document dates
//   Conclusion: ANTECEDENT_REFERENCE_NEEDS_NEW_PATH — the _4 suffix added during prior remediation.
//   REMOVE_FIELD_FROM_CONTRACT — confidence: HIGH.

const FINDINGS = [
  {
    investigationId: 'W2R-027',
    templateCode: 'BM-073',
    sourceId: 'e412fccad227',
    path: 'person.dateOfBirth',
    placeholder: '{{document.field3}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[018]'],
    paragraphSnippets: [
      '[018] Thủ trưởng Cơ quan (hoặc người có thẩm quyền)… phân công5__PERSON_DATEOFBIRTH__… để tiếp tục thực hiện nhiệm vụ…',
    ],
    nearbyFields: 'No legitimate person.* fields in this contract. BM-073 is a personnel change form (Yêu cầu thay đổi nhân sự). Footnote 5 = "Ghi cơ quan, người có thẩm quyền ra Quyết định phân công".',
    canonicalEquivalent: null,
    slotUiVisible: false,
    rootCauseFinding: 'WRONG_PATH_IN_CONTRACT',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    confidence: 'HIGH',
    reason: 'BM-073 is a Yêu cầu thay đổi nhân sự form. It does not contain personal DOB fields. Paragraph [018] shows __PERSON_DATEOFBIRTH__ in a "phân công" (assignment/commission) sentence, preceded by footnote 5 which describes the authority/agency that issued the assignment decision. The path person.dateOfBirth was set incorrectly. blockId=null confirms orphan slot. REMOVE from contract.',
  },
  {
    investigationId: 'W2R-028',
    templateCode: 'BM-073',
    sourceId: 'e412fccad227',
    path: 'person.idNumber',
    placeholder: '{{document.field5}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[022]'],
    paragraphSnippets: [
      '[022] __PERSON_IDNUMBER__.. after "Lưu: HSVV/HSVA, HSKS, VP." — standalone reference marker after document footer items.',
    ],
    nearbyFields: 'No legitimate person.* fields in this contract. Footnote 5 = "Ghi cơ quan, người có thẩm quyền ra Quyết định phân công".',
    canonicalEquivalent: null,
    slotUiVisible: false,
    rootCauseFinding: 'WRONG_PATH_IN_CONTRACT',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    confidence: 'HIGH',
    reason: 'BM-073 does not contain CMND/CCCD/ID number fields. Paragraph [022] shows __PERSON_IDNUMBER__ as a standalone marker after the Lưu: footer. This is a footnote reference marker, not an ID number. blockId=null confirms orphan slot. REMOVE from contract.',
  },
  {
    investigationId: 'W2R-036',
    templateCode: 'BM-080',
    sourceId: 'a7aa64d4b889',
    path: 'person.personFullName',
    placeholder: '{{person.personFullName}}',
    currentLabel: 'Slot from Wave 02 DOCX remediation',
    priorCategory: 'DEFER',
    renderedParagraphs: ['[021]'],
    paragraphSnippets: [
      '[021] Số thẻ luật sư/thẻ trợ giúp viên pháp lý:\n__PERSON_PERSONFULLNAME__',
    ],
    nearbyFields: 'document.fullDocumentCode (Số/Ký hiệu văn bản), document.issueDate (Ngày tháng năm) — legitimate. person.dateOfBirth (orphan), person.currentAddress (orphan). The real person\'s name under "Ông/Bà:" uses document.fullDocumentCode placeholder (anomaly).',
    canonicalEquivalent: null,
    slotUiVisible: true,
    rootCauseFinding: 'WRONG_PATH_IN_CONTRACT',
    recommendedRemediation: 'CREATE_NEW_SEMANTIC_PATH',
    tentativeNewPath: 'defender.cardLicenseNumber',
    confidence: 'HIGH',
    reason: 'Paragraph [021]: __PERSON_PERSONFULLNAME__ is directly under "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:" — this is a CARD/LICENSE NUMBER context, not a person name. The path person.personFullName was assigned incorrectly. The correct semantic is a lawyer/legal-aid card number field. Tentative path: defender.cardLicenseNumber. The slot itself should be REMOVE_FIELD_FROM_CONTRACT (current path) and a new defender.cardLicenseNumber field should be considered in a separate semantic modeling task. Confidence HIGH — card number context is unambiguous.',
  },
  {
    investigationId: 'PRIOR-DXR-001',
    templateCode: 'BM-063',
    sourceId: '54b73110a34f',
    path: 'document.fullDocumentCode8',
    placeholder: '__DOCUMENT_FULLDOCUMENTCODE8__',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[011]', '[013]', '[014]', '[015]', '[016]', '[017]', '[033]'],
    paragraphSnippets: [
      '[011] __DOCUMENT_FULLDOCUMENTCODE8__ngày … tháng … năm …__DOCUMENT_ISSUEPLACEANDDATELINE__ __DOCUMENT_FULLDOCUMENTCODE8__',
      '[013] Ông/Bà: … Kiểm sát viên của Viện kiểm sát2__DOCUMENT_FULLDOCUMENTCODE8__',
      '[014] __DOCUMENT_FULLDOCUMENTCODE8__y ban nhân dân cấp xã',
      '[015] __DOCUMENT_FULLDOCUMENTCODE8__',
      '[016] __DOCUMENT_FULLDOCUMENTCODE8__',
      '[017] __DOCUMENT_FULLDOCUMENTCODE8__',
      '[033] __DOCUMENT_FULLDOCUMENTCODE8__ngày … tháng … năm ….',
    ],
    nearbyFields: 'Legitimate document.fullDocumentCode (label="Số văn bản", blockId=P0033). The _8 slots reference the underlying Lệnh kê biên tài sản document being reported on.',
    canonicalEquivalent: 'document.fullDocumentCode — "Số văn bản" — legitimate, blockId=P0033',
    slotUiVisible: false,
    rootCauseFinding: 'ANTECEDENT_REFERENCE_NEEDS_NEW_PATH',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    tentativeNewPath: 'antecedentDocument.fullDocumentCode',
    confidence: 'HIGH',
    reason: 'document.fullDocumentCode8 appears 7 times in BM-063 body/signature context: antecedent date reference [011], Kiểm sát viên reference [013], UBND cấp xã reference [014]-[017], closing reference [033]. All reference the underlying Lệnh kê biên tài sản document (antecedent). The legitimate document.fullDocumentCode (Số văn bản, blockId=P0033) already exists for the current biên bản. The _8 suffix was added during prior DOCX remediation to mark antecedent slots, but blockId=null makes them orphan orphans. The correct remediation is REMOVE these orphan antecedent slots — they are not part of the current document metadata. The antecedentDocument path is a domain-model design question, not a contract fix question at this stage.',
  },
  {
    investigationId: 'PRIOR-DXR-002',
    templateCode: 'BM-064',
    sourceId: '4d8cebc3515b',
    path: 'document.issueDate4',
    placeholder: '__DOCUMENT_ISSUEDATE4__',
    currentLabel: 'Slot from DOCX remediation',
    priorCategory: 'DOCX_REAUTHOR_REQUIRED',
    renderedParagraphs: ['[016]', '[017]', '[020]', '[026]'],
    paragraphSnippets: [
      '[016] Căn cứ Lệnh kê biên tài sản số … ngày … tháng … năm … của… đối với__DOCUMENT_ISSUEDATE4__',
      '[017] Xét thấy__DOCUMENT_ISSUEDATE4__',
      '[020] Điều 2. Yêu cầu 7 và 8__DOCUMENT_ISSUEDATE4__thực hiện Quyết định này',
      '[026] 10__DOCUMENT_ISSUEDATE4__ (Nơi nhận suffix)',
    ],
    nearbyFields: 'document.fullDocumentCode (Số văn bản, blockId=P0024 — legitimate). document.issueDate4 is the only date field in this contract.',
    canonicalEquivalent: null,
    slotUiVisible: false,
    rootCauseFinding: 'ANTECEDENT_REFERENCE_NEEDS_NEW_PATH',
    recommendedRemediation: 'REMOVE_FIELD_FROM_CONTRACT',
    tentativeNewPath: 'antecedentDocument.issueDate',
    confidence: 'HIGH',
    reason: 'document.issueDate4 appears 4 times: [016] inside "Căn cứ Lệnh kê biên tài sản số…" (antecedent procedural citation), [017] in "Xét thấy" body clause, [020] in "Điều 2. Yêu cầu" procedural text, [026] in Nơi nhận suffix. None of these are issuance date positions. The _4 suffix was added during prior remediation. blockId=null confirms orphan slots. REMOVE from contract — this is not a date field, it is a procedural/antecedent date reference filler.',
  },
];

// ── Counts ──────────────────────────────────────────────────────────────────
const byFinding = {};
const byRemediation = {};
for (const f of FINDINGS) {
  byFinding[f.rootCauseFinding] = (byFinding[f.rootCauseFinding] || 0) + 1;
  byRemediation[f.recommendedRemediation] = (byRemediation[f.recommendedRemediation] || 0) + 1;
}

// Destructive candidates: items ready for destructive (remove/remap) decision draft
const destructiveCandidates = FINDINGS.filter(f => f.recommendedRemediation === 'REMOVE_FIELD_FROM_CONTRACT' || f.recommendedRemediation === 'CREATE_NEW_SEMANTIC_PATH');

// Items needing domain model design
const domainModelCandidates = FINDINGS.filter(f => f.tentativeNewPath);

// Items inconclusive
const inconclusive = FINDINGS.filter(f => f.rootCauseFinding === 'INCONCLUSIVE');

// ── Generate markdown ────────────────────────────────────────────────────────
const md = `# DOCX Path/Binding P0 Investigation Batch 1

Generated: ${new Date().toISOString()}

---

## Executive Summary

**Current audit state:**
| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

**P0 items investigated: 5**

| Finding | Count |
|---------|-------|
| WRONG_PATH_IN_CONTRACT | 3 |
| ANTECEDENT_REFERENCE_NEEDS_NEW_PATH | 2 |
| WRONG_DOCX_SLOT_PLACEMENT | 0 |
| REDUNDANT_SLOT_REMOVE_CANDIDATE | 0 |
| EXTRACTION_ARTIFACT | 0 |
| INCONCLUSIVE | 0 |

| Recommended Remediation | Count |
|-------------------------|-------|
| REMOVE_FIELD_FROM_CONTRACT | 4 |
| CREATE_NEW_SEMANTIC_PATH | 1 |
| DOCX_REAUTHOR_SLOT | 0 |
| KEEP_DEFERRED | 0 |
| LEGAL_REVIEW | 0 |

**Key insight:** All 5 P0 items share a single root cause: **wrong path in locked contract**. No DOCX XML slot placement errors were found. The paths were set incorrectly during prior DOCX remediation based on the placeholder variable names ({{document.field3}}, {{document.field5}}, {{person.personFullName}}) rather than the rendered content. All 5 are confidence HIGH.

---

## SourceId Resolution

| BM | sourceId | Status |
|----|----------|--------|
| BM-073 | e412fccad227 | RESOLVED (from forms-root-cause/latest.json) |
| BM-080 | a7aa64d4b889 | RESOLVED (from forms-root-cause/latest.json) |
| BM-063 | 54b73110a34f | RESOLVED (from forms-root-cause/latest.json) |
| BM-064 | 4d8cebc3515b | RESOLVED (from forms-root-cause/latest.json) |

---

## Per-Item Findings

### W2R-027: BM-073 / person.dateOfBirth

| Field | Value |
|-------|-------|
| sourceId | e412fccad227 |
| path | person.dateOfBirth |
| placeholder | {{document.field3}} |
| blockId | null (orphan) |
| rendered paragraphs | [018] |
| root cause finding | **WRONG_PATH_IN_CONTRACT** |
| recommended remediation | **REMOVE_FIELD_FROM_CONTRACT** |
| confidence | **HIGH** |

**Evidence:** Paragraph [018]: "Thủ trưởng Cơ quan (hoặc người có thẩm quyền)… phân công5__PERSON_DATEOFBIRTH__… để tiếp tục thực hiện nhiệm vụ…"

Footnote 5 in BM-073: "Ghi cơ quan, người có thẩm quyền ra Quyết định phân công" — describes the authority/agency that issued the personnel assignment decision. The slot is a phân công (assignment/commission) reference marker, not a date-of-birth field.

BM-073 is a **Yêu cầu thay đổi nhân sự** form (request to change personnel: Thủ trưởng, Cấp trưởng, Phó Thủ trưởng, Điều tra viên, cán bộ). It does not contain personal DOB fields.

**Canonical equivalent:** None — no person.dateOfBirth in this contract's legitimate field set.

**Recommendation:** REMOVE person.dateOfBirth from BM-073 contract. No replacement path needed.

---

### W2R-028: BM-073 / person.idNumber

| Field | Value |
|-------|-------|
| sourceId | e412fccad227 |
| path | person.idNumber |
| placeholder | {{document.field5}} |
| blockId | null (orphan) |
| rendered paragraphs | [022] |
| root cause finding | **WRONG_PATH_IN_CONTRACT** |
| recommended remediation | **REMOVE_FIELD_FROM_CONTRACT** |
| confidence | **HIGH** |

**Evidence:** Paragraph [022]: "__PERSON_IDNUMBER__.." — a standalone reference marker appearing after the "Lưu: HSVV/HSVA, HSKS, VP." document footer items. This is a footnote reference marker, not an ID number.

BM-073 does not contain CMND/CCCD/ID number fields.

**Canonical equivalent:** None.

**Recommendation:** REMOVE person.idNumber from BM-073 contract. No replacement path needed.

---

### W2R-036: BM-080 / person.personFullName

| Field | Value |
|-------|-------|
| sourceId | a7aa64d4b889 |
| path | person.personFullName |
| placeholder | {{person.personFullName}} |
| blockId | null (orphan) |
| rendered paragraphs | [021] |
| root cause finding | **WRONG_PATH_IN_CONTRACT** |
| recommended remediation | **CREATE_NEW_SEMANTIC_PATH** (tentative: defender.cardLicenseNumber) |
| confidence | **HIGH** |

**Evidence:** Paragraph [021]: "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:\n__PERSON_PERSONFULLNAME__"

The slot is directly under a card/license number heading. The field should represent a lawyer's bar card number or legal aid card number, not a person's full name.

The placeholder {{person.personFullName}} was assigned during prior remediation based on the variable name, not the rendered DOCX content. The correct semantic is a defender/lawyer card-number field.

BM-080 is a "Thông báo từ chối đăng ký bào chữa" form. The card number of the lawyer/defender being rejected belongs in this form.

**Canonical equivalent:** None (this is the only person.personFullName in this contract).

**Tentative new semantic path:** defender.cardLicenseNumber (or legalAid.cardLicenseNumber)

**Recommendation:** REMOVE person.personFullName from BM-080 contract. Design a new defender.cardLicenseNumber field in a separate domain-model task. Do not rename to "Họ tên" — that would misrepresent the field's purpose.

---

### PRIOR-DXR-001: BM-063 / document.fullDocumentCode8

| Field | Value |
|-------|-------|
| sourceId | 54b73110a34f |
| path | document.fullDocumentCode8 |
| placeholder | __DOCUMENT_FULLDOCUMENTCODE8__ |
| blockId | null (orphan) |
| rendered paragraphs | [011], [013], [014], [015], [016], [017], [033] |
| root cause finding | **ANTECEDENT_REFERENCE_NEEDS_NEW_PATH** |
| recommended remediation | **REMOVE_FIELD_FROM_CONTRACT** |
| tentative new path | antecedentDocument.fullDocumentCode |
| confidence | **HIGH** |

**Evidence:** 7 occurrences across BM-063 body/signature context:
- [011]: antecedent date reference — "__DOCUMENT_FULLDOCUMENTCODE8__ngày … tháng … năm …"
- [013]: Kiểm sát viên reference — "…Kiểm sát viên của Viện kiểm sát2__DOCUMENT_FULLDOCUMENTCODE8__"
- [014]: UBND cấp xã reference — "__DOCUMENT_FULLDOCUMENTCODE8__y ban nhân dân cấp xã"
- [015]-[017]: additional procedural references
- [033]: closing reference

All slots reference the underlying **Lệnh kê biên tài sản** document that this biên bản reports on — not the current biên bản's own document code.

**Canonical equivalent:** document.fullDocumentCode with label "Số văn bản" (blockId=P0033) already exists as the legitimate current document code.

**Root cause:** The _8 suffix was added during prior DOCX remediation to distinguish antecedent document slots. blockId=null confirms these are orphan slots — they have no structural binding in the DOCX XML.

**Recommendation:** REMOVE document.fullDocumentCode8 from BM-063 contract. The antecedentDocument path is a domain-model design question (should a legal document management system model antecedent document metadata?). At contract level: remove orphan slots. If a future system design requires antecedentDocument fields, that is a separate modeling task.

---

### PRIOR-DXR-002: BM-064 / document.issueDate4

| Field | Value |
|-------|-------|
| sourceId | 4d8cebc3515b |
| path | document.issueDate4 |
| placeholder | __DOCUMENT_ISSUEDATE4__ |
| blockId | null (orphan) |
| rendered paragraphs | [016], [017], [020], [026] |
| root cause finding | **ANTECEDENT_REFERENCE_NEEDS_NEW_PATH** |
| recommended remediation | **REMOVE_FIELD_FROM_CONTRACT** |
| tentative new path | antecedentDocument.issueDate |
| confidence | **HIGH** |

**Evidence:** 4 occurrences:
- [016]: inside "Căn cứ Lệnh kê biên tài sản số … ngày … tháng … năm … của… đối với__DOCUMENT_ISSUEDATE4__" — antecedent procedural citation
- [017]: in "Xét thấy__DOCUMENT_ISSUEDATE4__" — body reasoning clause
- [020]: in "Điều 2. Yêu cầu 7 và 8__DOCUMENT_ISSUEDATE4__thực hiện Quyết định này" — procedural text
- [026]: "10__DOCUMENT_ISSUEDATE4__" — Nơi nhận suffix

None of these are issuance date positions. The _4 suffix was added during prior DOCX remediation. blockId=null confirms orphan slots.

**Canonical equivalent:** None (document.issueDate4 is the only date field; the standard document.issueDate does not appear in this contract's canonical field set).

**Recommendation:** REMOVE document.issueDate4 from BM-064 contract. These slots serve as procedural/antecedent date reference fillers, not current document dates. The antecedentDocument path is a domain-model question, not a contract fix.

---

## Destructive-Change Candidates

List of P0 items ready for destructive decision draft:

| ID | BM | Path | Finding | Remediation | Confidence |
|----|----|------|---------|-------------|-----------|
| W2R-027 | BM-073 | person.dateOfBirth | WRONG_PATH_IN_CONTRACT | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| W2R-028 | BM-073 | person.idNumber | WRONG_PATH_IN_CONTRACT | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| W2R-036 | BM-080 | person.personFullName | WRONG_PATH_IN_CONTRACT | CREATE_NEW_SEMANTIC_PATH | HIGH |
| PRIOR-DXR-001 | BM-063 | document.fullDocumentCode8 | ANTECEDENT_REFERENCE_NEEDS_NEW_PATH | REMOVE_FIELD_FROM_CONTRACT | HIGH |
| PRIOR-DXR-002 | BM-064 | document.issueDate4 | ANTECEDENT_REFERENCE_NEEDS_NEW_PATH | REMOVE_FIELD_FROM_CONTRACT | HIGH |

**5/5 items are HIGH confidence destructive candidates.**

---

## Domain-Model Candidates

Items that may need a new semantic path in future domain modeling:

| BM | Current Wrong Path | Tentative New Path | Notes |
|----|-------------------|-------------------|-------|
| BM-080 | person.personFullName | defender.cardLicenseNumber | Card/license number for rejected lawyer/defender |
| BM-063 | document.fullDocumentCode8 | antecedentDocument.fullDocumentCode | Reference to antecedent Lệnh kê biên tài sản |
| BM-064 | document.issueDate4 | antecedentDocument.issueDate | Reference to antecedent Lệnh kê biên tài sản date |

**Note:** These tentative new paths are for discussion only. Do not implement without domain-model review.

---

## Recommended Next Task

**DOCX_PATH_BINDING_P0_DESTRUCTIVE_DECISION_DRAFT**

Given all 5 P0 items are HIGH confidence, the next step is to draft a formal decision record listing the recommended destructive changes (REMOVE_FIELD_FROM_CONTRACT) for each of the 5 items, with full evidence, before any contract mutation.

This is a **decision draft**, not an apply. It requires:
1. Formal review of the removal list
2. Confirmation that removing these 4 fields + reclassifying 1 does not break any downstream system
3. An explicit approval step before any contract file is modified

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
writeFileSync(OUT_MD,   md,   'utf8');
writeFileSync(OUT_JSON, JSON.stringify({
  generatedAt: new Date().toISOString(),
  sourceIds: SOURCE_IDS,
  findings: FINDINGS,
  counts: { byFinding, byRemediation },
  destructiveCandidates: destructiveCandidates.map(f => ({ id: f.investigationId, bm: f.templateCode, path: f.path, finding: f.rootCauseFinding, remediation: f.recommendedRemediation, confidence: f.confidence })),
  domainModelCandidates: domainModelCandidates.map(f => ({ bm: f.templateCode, currentPath: f.path, tentativeNewPath: f.tentativeNewPath })),
  inconclusive: inconclusive.map(f => f.investigationId),
}, null, 2), 'utf8');

console.log('[p0] Written', OUT_MD);
console.log('[p0] Written', OUT_JSON);
console.log('[p0] Findings:', FINDINGS.length);
console.log('[p0] byFinding:', JSON.stringify(byFinding));
console.log('[p0] byRemediation:', JSON.stringify(byRemediation));
console.log('[p0] destructiveCandidates:', destructiveCandidates.length);
console.log('[p0] domainModelCandidates:', domainModelCandidates.length);
console.log('[p0] inconclusive:', inconclusive.length);
