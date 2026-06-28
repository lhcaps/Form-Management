# Wave 02 Inventory — Slot from Wave 02 DOCX Remediation

Generated: 2026-06-26T14:15:00.000Z
Mode: **PLANNING ONLY**

## Scope Summary

| Metric | Value |
|--------|-------|
| Total Wave 02 items | 57 |
| Affected BMs | 9 |
| Label family | Slot from Wave 02 DOCX remediation |
| Source | manual |
| Placeholders found in DOCX | 57 / 57 |
| DOCX context has static text | 0 / 57 |

## Affected BMs

| BM | Title | Items | Paths |
|----|-------|------:|-------|
| BM-068 | QĐ huỷ bỏ biện pháp phong toả tài khoản | 12 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.permanentAddress, person.permanentAddress2, person.occupation, person.idNumber, person.permanentAddress3, person.occupation2, person.idNumber2, person.temporaryAddress, person.province |
| BM-069 | BB về việc hủy bỏ biện pháp phong tỏa tài khoản | 12 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.idNumber, document.reasonLine, document.reasonLine2, person.personFullName, person.currentAddress, person.currentAddress2, decision.decisionLine, person.occupation, document.summaryLine |
| BM-073 | Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV | 4 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.idNumber |
| BM-075 | Đề nghị thay đổi người phiên dịch, người dịch thuật | 4 | document.fullDocumentCode, person.personFullName, person.dateOfBirth, person.currentAddress |
| BM-077 | Yêu cầu, đề nghị cử người bào chữa | 1 | document.fullDocumentCode |
| BM-080 | Thông báo từ chối việc đăng ký bào chữa | 7 (6 unique paths) | document.fullDocumentCode, document.issueDate, person.personFullName, person.dateOfBirth, person.currentAddress, legalBasis.legalBasisLine |
| BM-082 | Thông báo thời gian, địa điểm tiến hành tố tụng | 1 | document.fullDocumentCode |
| BM-162 | Giấy mời | 7 | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.personFullName, person.currentAddress, person.occupation, person.idNumber |
| BM-163 | Giấy triệu tập | 11 (10 unique paths) | document.fullDocumentCode, document.issueDate, person.dateOfBirth, person.personFullName, person.currentAddress, person.occupation, person.ward, person.province, person.idNumber, case.caseNumber |

## Root Cause

All 57 items have `currentLabel: "Slot from Wave 02 DOCX remediation"`. This generic label is the canonical field label stored in locked contracts. It appears verbatim in the UI. The label was generated during Wave 02 remediation because the DOCX extraction pipeline could not determine the correct field name from the placeholder content alone.

The placeholder (e.g. `{{document.field1}}`, `{{person.idNumber}}`) exists in the normalized DOCX. The DOCX context shows only font/style XML tags (`<w:rFonts w:ascii="Times New Roman"/> {{...}}`). **Zero items have static Vietnamese text that names the field** (e.g. "CMND:", "Họ tên:", "Ngày sinh:").

## Classification Summary

| Classification | Count | % |
|---------------|------:|---:|
| W2_SAFE_DOCX_RENAME | 0 | 0% |
| W2_DEFER_NO_CONTEXT | 57 | 100% |
| W2_DEFER_LEGAL_CONTEXT | 0 | 0% |
| W2_DEFER_DOCUMENT_LINE | 0 | 0% |
| W2_DO_NOT_FIX | 0 | 0% |

## Safety

| Check | Result |
|-------|--------|
| Locked contracts mutated | **false** |
| DOCX touched | **false** |
| Compiled artifacts hand-edited | **false** |
| Mode | planning-only |
