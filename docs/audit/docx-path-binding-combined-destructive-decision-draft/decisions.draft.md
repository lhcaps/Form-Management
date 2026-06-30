# DOCX Path/Binding Combined Destructive Decision Draft

Generated: 2026-06-26T21:38:26.048Z
Mode: **DRAFT_REVIEW_REQUIRED**
Apply Allowed: **NO**

---

## Executive Summary

**Current audit state:**
| Metric | Value |
|--------|-------|
| totalIssues | 3395 |
| BAD_LABEL | 399 |
| UI_VISIBLE_BAD_METADATA | 44 |

| Metric | Value |
|--------|-------|
| Total proposed removals | 10 |
| Domain-model review notes | 3 |
| Keep-deferred tracked | 8 |
| Approved for apply (live) | 10 |
| Pending approval (live) | 0 |
| Approval required | YES |
| Apply allowed | NO |

---

## Source Breakdown

| Batch | Decisions | Decision IDs |
|-------|-----------|-------------|
| P0 | 5 removals | DOCX-REMOVE-001 ... 005 |
| P1 Batch 1 | 2 removals | DOCX-REMOVE-006 ... 007 |
| P1 Batch 2 | 3 removals | DOCX-REMOVE-008 ... 010 |

---

## Decision Table

| Decision ID | Batch | Investigation ID | BM | sourceId | Path | Proposed Action | Confidence | Approval Status | Domain Model Note |
|------------|-------|----------------|----|---------|------|----------------|-----------|----------------|------------------|
| DOCX-REMOVE-001 | P0 | W2R-027 | BM-073 | e412fccad227 | person.dateOfBirth | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | No |
| DOCX-REMOVE-002 | P0 | W2R-028 | BM-073 | e412fccad227 | person.idNumber | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | No |
| DOCX-REMOVE-003 | P0 | W2R-036 | BM-080 | a7aa64d4b889 | person.personFullName | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | Yes - defender.cardLicenseNumber |
| DOCX-REMOVE-004 | P0 | PRIOR-DXR-001 | BM-063 | 54b73110a34f | document.fullDocumentCode8 | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | Yes - antecedentDocument.fullDocumentCode |
| DOCX-REMOVE-005 | P0 | PRIOR-DXR-002 | BM-064 | 4d8cebc3515b | document.issueDate4 | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | Yes - antecedentDocument.issueDate |
| DOCX-REMOVE-006 | P1_BATCH_1 | W2R-025 | BM-073 | e412fccad227 | document.fullDocumentCode | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | No |
| DOCX-REMOVE-007 | P1_BATCH_1 | W2R-026 | BM-073 | e412fccad227 | document.issueDate | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | No |
| DOCX-REMOVE-008 | P1_BATCH_2 | PRIOR-DXR-008 | BM-052 | 9919ecdb3971 | recipients.personLine6 | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | No |
| DOCX-REMOVE-009 | P1_BATCH_2 | PRIOR-DXR-010 | BM-062 | 110961a781fa | recipients.personLine5 | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | No |
| DOCX-REMOVE-010 | P1_BATCH_2 | PRIOR-DXR-011 | BM-066 | e3bc56081554 | recipients.personLine4 | REMOVE_FIELD_FROM_CONTRACT | HIGH | APPROVED_FOR_APPLY | No |

---

## Per-Item Evidence

### DOCX-REMOVE-001: P0 / W2R-027 / BM-073 / person.dateOfBirth

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** HIGH

BM-073 is a Yêu cầu thay đổi nhân sự form. It does not contain personal DOB fields. Paragraph [018] shows __PERSON_DATEOFBIRTH__ in a "phân công" (assignment/commission) sentence, preceded by footnote 5 which describes the authority/agency that issued the assignment decision. The path person.dateOfBirth was set incorrectly. blockId=null confirms orphan slot. REMOVE from contract.

---

### DOCX-REMOVE-002: P0 / W2R-028 / BM-073 / person.idNumber

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** HIGH

BM-073 does not contain CMND/CCCD/ID number fields. Paragraph [022] shows __PERSON_IDNUMBER__ as a standalone marker after the Lưu: footer. This is a footnote reference marker, not an ID number. blockId=null confirms orphan slot. REMOVE from contract.

---

### DOCX-REMOVE-003: P0 / W2R-036 / BM-080 / person.personFullName

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** HIGH

Paragraph [021]: __PERSON_PERSONFULLNAME__ is directly under "Số thẻ luật sư/thẻ trợ giúp viên pháp lý:" — this is a CARD/LICENSE NUMBER context, not a person name. The path person.personFullName was assigned incorrectly. The correct semantic is a lawyer/legal-aid card number field. Tentative path: defender.cardLicenseNumber. The slot itself should be REMOVE_FIELD_FROM_CONTRACT (current path) and a new defender.cardLicenseNumber field should be considered in a separate semantic modeling task. Confidence HIGH — card number context is unambiguous.

---

### DOCX-REMOVE-004: P0 / PRIOR-DXR-001 / BM-063 / document.fullDocumentCode8

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** HIGH

document.fullDocumentCode8 appears 7 times in BM-063 body/signature context: antecedent date reference [011], Kiểm sát viên reference [013], UBND cấp xã reference [014]-[017], closing reference [033]. All reference the underlying Lệnh kê biên tài sản document (antecedent). The legitimate document.fullDocumentCode (Số văn bản, blockId=P0033) already exists for the current biên bản. The _8 suffix was added during prior DOCX remediation to mark antecedent slots, but blockId=null makes them orphan orphans. The correct remediation is REMOVE these orphan antecedent slots — they are not part of the current document metadata. The antecedentDocument path is a domain-model design question, not a contract fix question at this stage.

---

### DOCX-REMOVE-005: P0 / PRIOR-DXR-002 / BM-064 / document.issueDate4

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** HIGH

document.issueDate4 appears 4 times: [016] inside "Căn cứ Lệnh kê biên tài sản số…" (antecedent procedural citation), [017] in "Xét thấy" body clause, [020] in "Điều 2. Yêu cầu" procedural text, [026] in Nơi nhận suffix. None of these are issuance date positions. The _4 suffix was added during prior remediation. blockId=null confirms orphan slots. REMOVE from contract — this is not a date field, it is a procedural/antecedent date reference filler.

### DOCX-REMOVE-006: P1_BATCH_1 / W2R-025 / BM-073 / document.fullDocumentCode

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** HIGH

BM-073 has a LEGITIMATE document.fullDocumentCode at blockId=P0033 (label="Số văn bản"). The __DOCUMENT_FULLDOCUMENTCODE__ slot at [012] "Thay đổi__DOCUMENT_FULLDOCUMENTCODE__" is in the body title for "Thay đổi" (change) procedural context, NOT in the header. This is identical to the W2R-027/028 pattern: path was set incorrectly, orphan slot. HIGH confidence REMOVE candidate. Same BM-073 family as P0 items.

---

### DOCX-REMOVE-007: P1_BATCH_1 / W2R-026 / BM-073 / document.issueDate

**Proposed Action:** REMOVE_FIELD_FROM_CONTRACT | **Confidence:** HIGH

BM-073 has NO legitimate document.issueDate canonical field. The __DOCUMENT_ISSUEDATE__ slot at [016] "Xét thấy__DOCUMENT_ISSUEDATE__" is in the body reasoning clause, NOT at the date header position. This is a procedural date filler slot, not an issuance date. The path name "issueDate" is semantically wrong for a "Xét thấy" clause. Same BM-073 family as P0 items W2R-027/028. HIGH confidence REMOVE candidate. Confidence note: removing this would leave BM-073 with no date field, but the path is wrong regardless — the slot should not exist at all in this form as document.issueDate.

### DOCX-REMOVE-008: P1_BATCH_2 / PRIOR-DXR-008 / BM-052 / recipients.personLine6

Proposed Action: REMOVE_FIELD_FROM_CONTRACT | Confidence: HIGH

BM-052 recipients.personLine6 appears 6 times: [020][021] as body continuation, [024] between fields, [027] after "Nơi tạm trú:", and [035] as Nơi nhận suffix after "Lưu: HSVA..." with footnote marker 11. The Nơi nhận suffix [035] is a pure footer artifact — Nơi nhận already lists the main recipients (7, 10, 8) and the "11" footnote marker is a signer title placeholder. The body continuation lines [020][021][024][027] are free-text fill, but BM-052 has no legitimate repeat/array person model. HIGH confidence REMOVE — the Nơi nhận suffix is sufficient evidence on its own. The body continuation lines are secondary.

---

### DOCX-REMOVE-009: P1_BATCH_2 / PRIOR-DXR-010 / BM-062 / recipients.personLine5

Proposed Action: REMOVE_FIELD_FROM_CONTRACT | Confidence: HIGH

BM-062 recipients.personLine5 appears 4 times: [021][022][023] as body continuation (some merged with duplicate), and [037] as Nơi nhận suffix with footnote marker 16. The Nơi nhận suffix [037] is a pure footer artifact — Nơi nhận already lists main recipients (12, 13, 15). The "16" marker is a signer title placeholder. HIGH confidence REMOVE — the Nơi nhận suffix is sufficient evidence.

---

### DOCX-REMOVE-010: P1_BATCH_2 / PRIOR-DXR-011 / BM-066 / recipients.personLine4

Proposed Action: REMOVE_FIELD_FROM_CONTRACT | Confidence: HIGH

BM-066 recipients.personLine4 appears 4 times: [023][024] as body continuation between "Tên gọi khác:" and "Nghề nghiệp:", [031] as Điều 2 clause continuation, and [038] as Nơi nhận suffix with footnote marker 15. The Nơi nhận suffix [038] is a pure footer artifact — "15" is a signer title placeholder. HIGH confidence REMOVE. The Điều 2 clause [031] is also anomalous (Yêu cầu clause, not recipient continuation).

---

## Deferred Tracked Items

These items are NOT approved and must NOT be applied. They require future domain-model/path-binding review.

| Investigation ID | BM | sourceId | Path | Next Action |
|-----------------|----|---------|------|-----------|
| W2R-013 | BM-069 | 3a67d1a2e298 | document.fullDocumentCode | KEEP_DEFERRED |
| W2R-029 | BM-075 | dc493cfb5fd3 | document.fullDocumentCode | KEEP_DEFERRED |
| W2R-033 | BM-077 | 99d7843f9f9e | document.fullDocumentCode | KEEP_DEFERRED |
| W2R-040 | BM-082 | 44cc2b043383 | document.fullDocumentCode | KEEP_DEFERRED |
| PRIOR-DXR-006 | BM-063 | 54b73110a34f | recipients.personLine5 | KEEP_DEFERRED |
| PRIOR-DXR-007 | BM-065 | 4a64c8d7e96c | recipients.personLine3 | KEEP_DEFERRED |
| PRIOR-DXR-009 | BM-061 | ec44550246e9 | recipients.personLine3 | KEEP_DEFERRED |
| PRIOR-DXR-012 | BM-067 | 0f7607122f29 | recipients.personLine3 | KEEP_DEFERRED |

### P1 Batch 1 - False-header/orphan without replacement (4 items)

- **W2R-013 / BM-069:** BM-069 has no legitimate document.fullDocumentCode canonical field (blockId=null for both fullDocumentCode and all other...
- **W2R-029 / BM-075:** BM-075 has NO legitimate document.fullDocumentCode canonical field (blockId=null). The visible "Số:" header exists but t...
- **W2R-033 / BM-077:** BM-077 has NO legitimate document.fullDocumentCode canonical field. The visible "Số:" header exists but the slot is in t...
- **W2R-040 / BM-082:** BM-082 has NO legitimate document.fullDocumentCode canonical field. The visible "Số:" header exists but the slot is in a...

### P1 Batch 2 - Body continuation/free-text capacity (4 items)

- **PRIOR-DXR-006 / BM-063:** BM-063 recipients.personLine5 appears 5 times: as body continuation between "Tên gọi khác:" and "Số CMND" AND inside Điề...
- **PRIOR-DXR-007 / BM-065:** BM-065 recipients.personLine3 appears 3 times: body continuation between "Tên gọi khác:" and "Số CMND". Pure free-text c...
- **PRIOR-DXR-009 / BM-061:** BM-061 recipients.personLine3 appears 3 times: body continuation between "Tên gọi khác:" and "Số CMND". Pure free-text c...
- **PRIOR-DXR-012 / BM-067:** BM-067 recipients.personLine3 appears 3 times: body continuation between "Tên gọi khác:" and "Số CMND". Pure free-text c...

---

## Domain-Model Review Section

Three tentative paths were identified. These are domain-model proposals only.

| BM | Current Wrong Path | Tentative New Path | Status |
|----|-------------------|-------------------|--------|
| BM-080 | person.personFullName | defender.cardLicenseNumber | DOMAIN_MODEL_REVIEW required |
| BM-063 | document.fullDocumentCode8 | antecedentDocument.fullDocumentCode | DOMAIN_MODEL_REVIEW required |
| BM-064 | document.issueDate4 | antecedentDocument.issueDate | DOMAIN_MODEL_REVIEW required |

Note: DOMAIN_MODEL_REVIEW approval is separate from DESTRUCTIVE_REMOVE approval.
The wrong path must still be removed regardless of whether the new path is approved.

---

## Approval Gate

This draft requires explicit approval before any destructive apply can occur.
Apply remains blocked until all required commands are given.

### Required approval commands - DESTRUCTIVE_REMOVE:

```
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-001 BM-073 e412fccad227 person.dateOfBirth
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-002 BM-073 e412fccad227 person.idNumber
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-003 BM-080 a7aa64d4b889 person.personFullName
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-004 BM-063 54b73110a34f document.fullDocumentCode8
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-005 BM-064 4d8cebc3515b document.issueDate4
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-006 BM-073 e412fccad227 document.fullDocumentCode
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-007 BM-073 e412fccad227 document.issueDate
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-008 BM-052 9919ecdb3971 recipients.personLine6
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-009 BM-062 110961a781fa recipients.personLine5
APPROVE_DESTRUCTIVE_REMOVE DOCX-REMOVE-010 BM-066 e3bc56081554 recipients.personLine4
```

### Optional approval commands - DOMAIN_MODEL_REVIEW (separate track):

```
APPROVE_DOMAIN_MODEL_REVIEW BM-080 defender.cardLicenseNumber
APPROVE_DOMAIN_MODEL_REVIEW BM-063 antecedentDocument.fullDocumentCode
APPROVE_DOMAIN_MODEL_REVIEW BM-064 antecedentDocument.issueDate
```

---

## Safety

- Locked contracts mutated: **0**
- DOCX touched: **0**
- Source/path/binding touched: **0**
- Compiled artifacts hand-edited: **0**
- Apply write triggered: **0**
- Apply script created: **NO**
- Apply write: **NO**

---

_Lane closure auto-generated. Do not edit manually._