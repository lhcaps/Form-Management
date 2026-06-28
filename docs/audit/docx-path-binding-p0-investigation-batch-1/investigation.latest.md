# DOCX Path/Binding P0 Investigation Batch 1

Generated: 2026-06-26T19:41:31.321Z

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

**Evidence:** Paragraph [021]: "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:
__PERSON_PERSONFULLNAME__"

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
