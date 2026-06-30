# DOCX Path/Binding — Layer A Approved Decisions

Generated: 2026-06-27T03:52:00.000Z

---

## Approval

| Field | Value |
|---|---|
| Task | DOCX_PATH_BINDING_LAYER_A_APPROVED |
| Layer | A |
| Approval command | `APPROVE_DESTRUCTIVE_LAYER A BM-073 e412fccad227 DOCX-REMOVE-001 DOCX-REMOVE-002 DOCX-REMOVE-006 DOCX-REMOVE-007` |
| Status | APPROVED_FOR_APPLY |
| Apply allowed | YES |

---

## Target Contract

| Field | Value |
|---|---|
| Template code | BM-073 |
| Source ID | e412fccad227 |
| Risk | LOWEST |
| Contracts | 1 |
| Items | 4 |
| Domain model notes | 0 |

---

## Approved Items

### 1. DOCX-REMOVE-001

| Field | Value |
|---|---|
| Decision ID | DOCX-REMOVE-001 |
| Investigation ID | W2R-027 |
| Path | `person.dateOfBirth` |
| Confidence | HIGH |
| Source batch | P0 |
| Placeholder | `{{document.field3}}` |
| Current label | Slot from Wave 02 DOCX remediation |
| blockId | null |

**Evidence:** `[018] Thủ trưởng Cơ quan (hoặc người có thẩm quyền)… phân công5__PERSON_DATEOFBIRTH__… để tiếp tục thực hiện nhiệm vụ…`

**Reason:** BM-073 is a Yêu cầu thay đổi nhân sự form. It does not contain personal DOB fields. Paragraph [018] shows `__PERSON_DATEOFBIRTH__` in a phân công sentence, preceded by footnote 5. blockId=null confirms orphan slot. REMOVE from contract.

---

### 2. DOCX-REMOVE-002

| Field | Value |
|---|---|
| Decision ID | DOCX-REMOVE-002 |
| Investigation ID | W2R-028 |
| Path | `person.idNumber` |
| Confidence | HIGH |
| Source batch | P0 |
| Placeholder | `{{document.field5}}` |
| Current label | Slot from Wave 02 DOCX remediation |
| blockId | null |

**Evidence:** `[022] __PERSON_IDNUMBER__.. after "Lưu: HSVV/HSVA, HSKS, VP." — standalone reference marker after document footer items.`

**Reason:** BM-073 does not contain CMND/CCCD/ID number fields. Paragraph [022] shows `__PERSON_IDNUMBER__` as a standalone marker after the Lưu: footer. blockId=null confirms orphan slot. REMOVE from contract.

---

### 3. DOCX-REMOVE-006

| Field | Value |
|---|---|
| Decision ID | DOCX-REMOVE-006 |
| Investigation ID | W2R-025 |
| Path | `document.fullDocumentCode` |
| Confidence | HIGH |
| Source batch | P1_BATCH_1 |
| Placeholder | `{{document.field1}}` |
| Current label | Slot from Wave 02 DOCX remediation |
| blockId | null |

**Evidence:** `[012] Thay đổi__DOCUMENT_FULLDOCUMENTCODE__ (body title — slot in procedural title context)`

**Reason:** BM-073 has a LEGITIMATE `document.fullDocumentCode` at blockId=P0033 (label="Số văn bản"). The `__DOCUMENT_FULLDOCUMENTCODE__` slot at [012] is in the body title for Thay đổi procedural context, NOT in the header. blockId=null confirms orphan slot. REMOVE from contract.

---

### 4. DOCX-REMOVE-007

| Field | Value |
|---|---|
| Decision ID | DOCX-REMOVE-007 |
| Investigation ID | W2R-026 |
| Path | `document.issueDate` |
| Confidence | HIGH |
| Source batch | P1_BATCH_1 |
| Placeholder | `{{document.field2}}` |
| Current label | Slot from Wave 02 DOCX remediation |
| blockId | null |

**Evidence:** `[016] Xét thấy__DOCUMENT_ISSUEDATE__ (body reasoning clause — procedural, NOT issuance date)`

**Reason:** BM-073 has NO legitimate `document.issueDate` canonical field. The `__DOCUMENT_ISSUEDATE__` slot at [016] is in the body reasoning clause, NOT at the date header position. blockId=null confirms orphan slot. REMOVE from contract.

---

## Scope Constraints

- Layer A applies ONLY to BM-073/e412fccad227.
- Layer B (BM-080, BM-063, BM-064): untouched.
- Layer C (BM-052, BM-062, BM-066): untouched.
- Domain-model tentative paths: NOT implemented.
- DOCX files: NOT touched.
- Source/path/binding: NOT directly modified.
