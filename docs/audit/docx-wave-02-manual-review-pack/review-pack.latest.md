# Wave 02 Manual Review Pack — 56 Remaining Items

Generated: 2026-06-26T14:48:00.000Z
Mode: **MANUAL REVIEW**
Purpose: Human reviewer opens original `.doc` files in Word, reads surrounding text,
determines the correct label, and fills in the decision column.

---

## How to Use This Pack

1. Open the **Original DOC** file (from `docs/Biểu mẫu/Full/...`) in Microsoft Word.
2. Find each placeholder by searching for the **placeholder text** (e.g. `{{document.field1}}`).
3. Read the **surrounding Vietnamese text** before and after the placeholder.
4. Determine the correct field label from context.
5. Fill in your decision in the decision column.

## Decision Options

| Decision | Meaning |
|----------|---------|
| `APPROVED_LABEL` | You confirmed the suggested label is correct. Ready for apply. |
| `DEFER` | Cannot determine from DOCX alone. Skip for now. |
| `LEGAL_REVIEW` | Label has legal/procedural implications. Needs legal review. |
| `DOCX_REAUTHOR_REQUIRED` | Original DOCX must be edited, not just relabeled. |

---

## Review Items

### BM-068 — QĐ huỷ bỏ biện pháp phong toả tài khoản

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/02. BIEN PHAP NGAN CHAN BIEN PHAP CUONG CHE/68-QĐ huỷ bỏ biện pháp phong toả tài khoản.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-068/BM-068_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 1 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No | high | Open original DOC. Search for `{{document.field1}}`. Read text before it. Is it a document number, code, or reference line? | |
| 2 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | No | high | Open original DOC. Search for `{{document.field2}}`. Is it a date field? | |
| 3 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | No | high | Open original DOC. Search for `{{document.field3}}`. Is it a date of birth? Note: placeholder is `document.field3` not `person.dateOfBirth`. | |
| 4 | person.permanentAddress | `{{person.permanentAddress}}` | Slot from Wave 02 DOCX remediation | Địa chỉ thường trú | No | high | Open original DOC. Search for `{{person.permanentAddress}}`. Read surrounding text. | |
| 5 | person.permanentAddress2 | `{{person.permanentAddress2}}` | Slot from Wave 02 DOCX remediation | Địa chỉ thường trú (dòng 2) | No | high | Open original DOC. Search for `{{person.permanentAddress2}}`. This is line 2 of address. | |
| 6 | person.occupation | `{{person.occupation}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp | No | high | Open original DOC. Search for `{{person.occupation}}`. | |
| 7 | person.idNumber | `{{person.idNumber}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | No | high | Open original DOC. Search for `{{person.idNumber}}`. | |
| 8 | person.permanentAddress3 | `{{person.permanentAddress3}}` | Slot from Wave 02 DOCX remediation | Địa chỉ thường trú (dòng 3) | No | high | Open original DOC. Search for `{{person.permanentAddress3}}`. Line 3 of address. | |
| 9 | person.occupation2 | `{{person.occupation2}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp (dòng 2) | No | high | Open original DOC. Search for `{{person.occupation2}}`. | |
| 10 | person.idNumber2 | `{{person.idNumber2}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND (dòng 2) | No | high | Open original DOC. Search for `{{person.idNumber2}}`. Second ID number. | |
| 11 | person.temporaryAddress | `{{person.temporaryAddress}}` | Slot from Wave 02 DOCX remediation | Địa chỉ tạm trú | No | high | Open original DOC. Search for `{{person.temporaryAddress}}`. Co-located with `{{person.province}}`. | |
| 12 | person.province | `{{person.province}}` | Slot from Wave 02 DOCX remediation | Tỉnh/Thành phố | No | high | Open original DOC. Search for `{{person.province}}`. | |

---

### BM-069 — BB về việc hủy bỏ biện pháp phong tỏa tài khoản

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/02. BIEN PHAP NGAN CHAN BIEN PHAP CUONG CHE/69-BB về việc hủy bỏ biện pháp phong tỏa tài khoản.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-069/BM-069_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 13 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No | high | Open original DOC. Search for `{{document.field1}}`. | |
| 14 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | No (superscript footnote before) | high | Open original DOC. Search for `{{document.field2}}`. Footnote superscript before placeholder. | |
| 15 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | No | high | Open original DOC. Search for `{{document.field3}}`. Path mismatch: `document.field3` mapped to `person.dateOfBirth`. | |
| 16 | person.idNumber | `{{document.field5}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | No | high | Open original DOC. Search for `{{document.field5}}`. Path mismatch: `document.field5` mapped to `person.idNumber`. | |
| 17 | document.reasonLine | `{{document.field6}}` | Slot from Wave 02 DOCX remediation | Lý do | No | high | Open original DOC. Search for `{{document.field6}}`. Path mismatch. | |
| 18 | document.reasonLine2 | `{{document.field7}}` | Slot from Wave 02 DOCX remediation | Lý do (dòng 2) | No | high | Open original DOC. Search for `{{document.field7}}`. | |
| 19 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên | No | high | Open original DOC. Search for `{{person.personFullName}}`. | |
| 20 | person.currentAddress | `{{person.currentAddress}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay | No | high | Open original DOC. Search for `{{person.currentAddress}}`. | |
| 21 | person.currentAddress2 | `{{person.currentAddress2}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay (dòng 2) | No | high | Open original DOC. Search for `{{person.currentAddress2}}`. | |
| 22 | decision.decisionLine | `{{document.field8}}` | Slot from Wave 02 DOCX remediation | Số QĐ | No (text "oản theo" before) | high | Open original DOC. Search for `{{document.field8}}`. Text fragment "oản theo" suggests "quyết định theo". Path mismatch. | |
| 23 | person.occupation | `{{document.field10}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp | No (superscript before) | high | Open original DOC. Search for `{{document.field10}}`. Path mismatch. | |
| 24 | document.summaryLine | `{{document.field12}}` | Slot from Wave 02 DOCX remediation | Tóm tắt nội dung | No | high | Open original DOC. Search for `{{document.field12}}`. | |

---

### BM-073 — Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/03. NGUOI CO THAM QUYEN NGUOI THAM GIA TO TUNG/73-Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-073/BM-073_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 25 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No | high | Open original DOC. Search for `{{document.field1}}`. | |
| 26 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | No | high | Open original DOC. Search for `{{document.field2}}`. | |
| 27 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | No (superscript '5' before) | high | Open original DOC. Search for `{{document.field3}}`. Footnote superscript '5' before. Path mismatch. | |
| 28 | person.idNumber | `{{document.field5}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | No (footnote ref before) | high | Open original DOC. Search for `{{document.field5}}`. Footnote reference before. Path mismatch. | |

---

### BM-075 — Đề nghị thay đổi người phiên dịch, người dịch thuật

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/03. NGUOI CO THAM QUYEN NGUOI THAM GIA TO TUNG/75-Đề nghị thay đổi người phiên dịch, người dịch thuật.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-075/BM-075_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 29 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No | high | Open original DOC. Search for `{{document.field1}}`. | |
| 30 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên người phiên dịch/dịch thuật | No | high | Open original DOC. Search for `{{person.personFullName}}`. | |
| 31 | person.dateOfBirth | `{{person.dateOfBirth}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | No | high | Open original DOC. Search for `{{person.dateOfBirth}}`. | |
| 32 | person.currentAddress | `{{person.currentAddress}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay | No (superscript '6' before) | high | Open original DOC. Search for `{{person.currentAddress}}`. Footnote superscript '6' before. | |

---

### BM-077 — Yêu cầu, đề nghị cử người bào chữa

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/03. NGUOI CO THAM QUYEN NGUOI THAM GIA TO TUNG/77-Yêu cầu, đề nghị cử người bào chữa.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-077/BM-077_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 33 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No (superscript '10' before) | high | Open original DOC. Search for `{{document.field1}}`. Footnote superscript '10' before. | |

---

### BM-080 — Thông báo từ chối việc đăng ký bào chữa

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/03. NGUOI CO THAM QUYEN NGUOI THAM GIA TO TUNG/80-Thông báo từ chối việc đăng ký bào chữa.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-080/BM-080_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 34 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No | high | Open original DOC. Search for `{{document.field1}}`. | |
| 35 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | No | high | Open original DOC. Search for `{{document.field2}}`. | |
| 36 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên | No | high | Open original DOC. Search for `{{person.personFullName}}`. | |
| 37 | person.dateOfBirth | `{{person.dateOfBirth}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | No (superscript '5' before) | high | Open original DOC. Search for `{{person.dateOfBirth}}`. Footnote superscript '5' before. | |
| 38 | person.currentAddress | `{{person.currentAddress}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay | Partial (text "biết./." after) | high | Open original DOC. Search for `{{person.currentAddress}}`. Text after: "biết./." (procedural closing). Label not confirmed. | |
| 39 | legalBasis.legalBasisLine | `{{legalBasis.legalBasisLine}}` | Slot from Wave 02 DOCX remediation | Căn cứ pháp luật | No (superscript '5' before) | high | Open original DOC. Search for `{{legalBasis.legalBasisLine}}`. | |

---

### BM-082 — Thông báo về thời gian, địa điểm tiến hành tố tụng cho người bào chữa

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/03. NGUOI CO THAM QUYEN NGUOI THAM GIA TO TUNG/82-Thông báo về thời gian, địa điểm tiến hành tố tụng cho người bào chữa.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-082/BM-082_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 40 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No | high | Open original DOC. Search for `{{document.field1}}`. | |

---

### BM-162 — Giấy mời

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/05. GIAI DOAN TRUY TO/162-Giấy mời.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-162/BM-162_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 41 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No | high | Open original DOC. Search for `{{document.field1}}`. | |
| 42 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | No | high | Open original DOC. Search for `{{document.field2}}`. | |
| 43 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | No | high | Open original DOC. Search for `{{document.field3}}`. Path mismatch: `document.field3` mapped to `person.dateOfBirth`. | |
| 44 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên | No | high | Open original DOC. Search for `{{person.personFullName}}`. | |
| 45 | person.currentAddress | `{{person.currentAddress}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay | No | high | Open original DOC. Search for `{{person.currentAddress}}`. | |
| 46 | person.occupation | `{{person.occupation}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp | No | high | Open original DOC. Search for `{{person.occupation}}`. | |
| 47 | person.idNumber | `{{person.idNumber}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | No | high | Open original DOC. Search for `{{person.idNumber}}`. | |

---

### BM-163 — Giấy triệu tập (9 remaining items, 1 already applied)

**Original DOC**: `docs/Biểu mẫu/Full/0-HE THONG BIEU MAU THEO TT 03-2026-VKSTC/05. GIAI DOAN TRUY TO/163-Giấy triệu tập.doc`
**Normalized DOCX**: `storage/templates/normalized-docx/BM-163/BM-163_normalized.docx`

| # | Path | Placeholder | Current Label | Suggested Label | Static Context Found | Risk | Review Instruction | Decision |
|---|------|-------------|--------------|-----------------|---------------------|------|-------------------|----------|
| 48 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | No | high | Open original DOC. Search for `{{document.field1}}`. | |
| 49 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | No | high | Open original DOC. Search for `{{document.field2}}`. | |
| 50 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | No | high | Open original DOC. Search for `{{document.field3}}`. Path mismatch: `document.field3` mapped to `person.dateOfBirth`. | |
| 51 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên | No | high | Open original DOC. Search for `{{person.personFullName}}`. | |
| 52 | person.occupation | `{{person.occupation}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp | No | high | Open original DOC. Search for `{{person.occupation}}`. | |
| 53 | person.ward | `{{person.ward}}` | Slot from Wave 02 DOCX remediation | Phường/Xã | No | high | Open original DOC. Search for `{{person.ward}}`. | |
| 54 | person.province | `{{person.province}}` | Slot from Wave 02 DOCX remediation | Tỉnh/Thành phố | No | high | Open original DOC. Search for `{{person.province}}`. | |
| 55 | person.idNumber | `{{person.idNumber}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | No | high | Open original DOC. Search for `{{person.idNumber}}`. | |
| 56 | case.caseNumber | `{{case.caseNumber}}` | Slot from Wave 02 DOCX remediation | Số hồ sơ vụ án | No | high | Open original DOC. Search for `{{case.caseNumber}}`. | |

---

## Summary

| BM | Items | Priority Items (path/placeholder mismatch) |
|----|------:|--------------------------------|
| BM-068 | 12 | person.dateOfBirth → document.field3 |
| BM-069 | 12 | person.dateOfBirth → document.field3, person.idNumber → document.field5, decision.decisionLine → document.field8, person.occupation → document.field10 |
| BM-073 | 4 | person.dateOfBirth → document.field3, person.idNumber → document.field5 |
| BM-075 | 4 | — |
| BM-077 | 1 | — |
| BM-080 | 6 | — |
| BM-082 | 1 | — |
| BM-162 | 7 | person.dateOfBirth → document.field3 |
| BM-163 | 9 | person.dateOfBirth → document.field3 |

**Total: 56 items**

**Path/placeholder mismatch items: 7** (high priority — original DOC likely has meaningful placeholder text that was lost during extraction)
