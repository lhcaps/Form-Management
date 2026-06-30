# Placeholder Context Analysis — Wave 02 Slots

Generated: 2026-06-26T14:15:00.000Z
Mode: **PLANNING ONLY**

## Methodology

Extracted `docxSlots` and `canonicalFields` from each of the 9 locked contracts.
Examined `evidence.context` (raw textBefore) for static Vietnamese label text
(e.g. "CMND:", "Họ tên:", "Ngày sinh:", "Nơi ở hiện nay:").
Classification: static text found → evaluate confidence; no static text → defer.

## Key Finding

| Metric | Count |
|--------|------:|
| Total Wave 02 items | 57 |
| Static text found | **1** |
| No static text (deferred) | **56** |

The ONE item with static text is **BM-163 / person.currentAddress**: raw context
contains `"Nơi ở hiện nay: {{person.currentAddress}}"`. However, this is a **labels-only
problem**, not a DOCX structure problem. The placeholder already uses the correct
semantic name `{{person.currentAddress}}`. The bad label `"Slot from Wave 02 DOCX
remediation"` in the contract canonicalFields cannot be fixed by editing the DOCX.

## Per-BM Summary

### BM-068 — QĐ huỷ bỏ biện pháp phong toả tài khoản (12 items)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | Generic field1 |
| 2 | document.issueDate | `{{document.field2}}` | — | no_context | Generic field2 |
| 3 | person.dateOfBirth | `{{document.field3}}` | — | no_context | Mapped path but placeholder is document.field3 |
| 4 | person.permanentAddress | `{{person.permanentAddress}}` | — | no_context | Semantic name but no label |
| 5 | person.permanentAddress2 | `{{person.permanentAddress2}}` | — | no_context | |
| 6 | person.occupation | `{{person.occupation}}` | — | no_context | |
| 7 | person.idNumber | `{{person.idNumber}}` | — | no_context | |
| 8 | person.permanentAddress3 | `{{person.permanentAddress3}}` | — | no_context | |
| 9 | person.occupation2 | `{{person.occupation2}}` | — | no_context | |
| 10 | person.idNumber2 | `{{person.idNumber2}}` | — | no_context | |
| 11 | person.temporaryAddress | `{{person.temporaryAddress}}` | — | no_context | |
| 12 | person.province | `{{person.province}}` | — | no_context | |

### BM-069 — BB hủy bỏ biện pháp phong tỏa tài khoản (12 items)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | Generic field1 |
| 2 | document.issueDate | `{{document.field2}}` | — | no_context | Superscript before |
| 3 | person.dateOfBirth | `{{document.field3}}` | — | no_context | Path/placeholder mismatch |
| 4 | person.idNumber | `{{document.field5}}` | — | no_context | Path/placeholder mismatch |
| 5 | document.reasonLine | `{{document.field6}}` | — | no_context | Path/placeholder mismatch |
| 6 | document.reasonLine2 | `{{document.field7}}` | — | no_context | |
| 7 | person.personFullName | `{{person.personFullName}}` | — | no_context | |
| 8 | person.currentAddress | `{{person.currentAddress}}` | — | no_context | |
| 9 | person.currentAddress2 | `{{person.currentAddress2}}` | — | no_context | |
| 10 | decision.decisionLine | `{{document.field8}}` | — | no_context | Path/placeholder mismatch; text 'oản theo' before |
| 11 | person.occupation | `{{document.field10}}` | — | no_context | Path/placeholder mismatch |
| 12 | document.summaryLine | `{{document.field12}}` | — | no_context | |

### BM-073 — Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV (4 items)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | |
| 2 | document.issueDate | `{{document.field2}}` | — | no_context | |
| 3 | person.dateOfBirth | `{{document.field3}}` | — | no_context | Footnote '5' before |
| 4 | person.idNumber | `{{document.field5}}` | — | no_context | Footnote ref before |

### BM-075 — Đề nghị thay đổi người phiên dịch, dịch thuật (4 items)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | |
| 2 | person.personFullName | `{{person.personFullName}}` | — | no_context | |
| 3 | person.dateOfBirth | `{{person.dateOfBirth}}` | — | no_context | |
| 4 | person.currentAddress | `{{person.currentAddress}}` | — | no_context | Footnote '6' before |

### BM-077 — Yêu cầu, đề nghị cử người bào chữa (1 item)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | Footnote '10' before |

### BM-080 — Thông báo từ chối đăng ký bào chữa (6 items)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | |
| 2 | document.issueDate | `{{document.field2}}` | — | no_context | |
| 3 | person.personFullName | `{{person.personFullName}}` | — | no_context | |
| 4 | person.dateOfBirth | `{{person.dateOfBirth}}` | — | no_context | Footnote '5' before |
| 5 | person.currentAddress | `{{person.currentAddress}}` | — | partial | Text 'biết./.' after; procedural not a label |
| 6 | legalBasis.legalBasisLine | `{{legalBasis.legalBasisLine}}` | — | no_context | Footnote '5' before |

### BM-082 — Thông báo thời gian, địa điểm tố tụng (1 item)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | |

### BM-162 — Giấy mời (7 items)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | |
| 2 | document.issueDate | `{{document.field2}}` | — | no_context | |
| 3 | person.dateOfBirth | `{{document.field3}}` | — | no_context | Path/placeholder mismatch |
| 4 | person.personFullName | `{{person.personFullName}}` | — | no_context | |
| 5 | person.currentAddress | `{{person.currentAddress}}` | — | no_context | |
| 6 | person.occupation | `{{person.occupation}}` | — | no_context | |
| 7 | person.idNumber | `{{person.idNumber}}` | — | no_context | |

### BM-163 — Giấy triệu tập (10 items)

| # | Path | Placeholder | Static Text | Confidence | Notes |
|---|------|-------------|------------|------------|-------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | — | no_context | |
| 2 | document.issueDate | `{{document.field2}}` | — | no_context | |
| 3 | person.dateOfBirth | `{{document.field3}}` | — | no_context | Path/placeholder mismatch |
| 4 | person.personFullName | `{{person.personFullName}}` | — | no_context | |
| 5 | person.currentAddress | `{{person.currentAddress}}` | **"Nơi ở hiện nay:"** | **strong** | Only item with label text. But labels-only problem. |
| 6 | person.occupation | `{{person.occupation}}` | — | no_context | |
| 7 | person.ward | `{{person.ward}}` | — | no_context | |
| 8 | person.province | `{{person.province}}` | — | no_context | |
| 9 | person.idNumber | `{{person.idNumber}}` | — | no_context | |
| 10 | case.caseNumber | `{{case.caseNumber}}` | — | no_context | |

## Why No Safe DOCX Renames?

The Wave 02 remediation was performed on `normalized-docx/` files that were
extracted from the original `.doc` source files. During Wave 02:

1. The extraction pipeline encountered generic placeholders like `{{document.field1}}`
   instead of human-meaningful labels.
2. The remediation correctly mapped `{{document.field1}}` to `document.fullDocumentCode`
   based on path heuristics, but could not derive a Vietnamese label text.
3. It stored `"Slot from Wave 02 DOCX remediation"` as the label — a marker indicating
   "this field needs manual label review."
4. The `reviewRequired: true` flag on all these fields confirms this is intentional.

The normalized DOCX file at `storage/templates/normalized-docx/BM-XXX/BM-XXX_normalized.docx`
contains the placeholder text (e.g. `{{document.field1}}`). The extraction pipeline
uses only the `{{placeholder}}` name to guess the path, and uses `evidence.context`
(mostly font/style XML) as the context. There is no static Vietnamese text near the
placeholder to indicate the field's meaning.

To fix these labels, one must either:
- **(A)** Open the ORIGINAL `.doc` source file in Word and inspect the surrounding text,
  then update the placeholder name and re-run extraction.
- **(B)** Manually edit the locked contract canonicalFields to set a meaningful label,
  accepting that the DOCX and contract will be out of sync.

Neither option is an automatic DOCX rename.
