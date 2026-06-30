# Wave 02 Manual Review — Decisions Template

Generated: 2026-06-26T14:58:00.000Z
Mode: **PENDING_REVIEW**
Purpose: Human reviewer fills in the `decision` and `approvedLabel` fields, then saves as `decisions.approved.json`.

---

## Decision Options

| Decision | Meaning | Apply? |
|----------|---------|--------|
| `PENDING_REVIEW` | Not yet reviewed | No |
| `APPROVED_LABEL` | Confirmed label is correct | **Yes** |
| `DEFER` | Cannot determine from DOCX alone | No |
| `LEGAL_REVIEW` | Legal/procedural implications | No |
| `DOCX_REAUTHOR_REQUIRED` | DOCX must be edited | No |

---

## Priority Items (path/placeholder mismatch — 7 items)

These have `pathPlaceholderMismatch: true`. The placeholder does not match the semantic path.
Original DOCX likely has meaningful text that was lost during extraction.

| # | ID | BM | Path | Placeholder | Suggested Label | Review Instruction |
|---|-----|-----|------|-------------|-----------------|-------------------|
| 1 | W2R-003 | BM-068 | person.dateOfBirth | `{{document.field3}}` | Ngày sinh | Open DOC 68. Search `{{document.field3}}`. Confirm is date of birth. |
| 2 | W2R-015 | BM-069 | person.dateOfBirth | `{{document.field3}}` | Ngày sinh | Open DOC 69. Search `{{document.field3}}`. Confirm is date of birth. |
| 3 | W2R-016 | BM-069 | person.idNumber | `{{document.field5}}` | Số CCCD/CMND | Open DOC 69. Search `{{document.field5}}`. Confirm is ID number. |
| 4 | W2R-022 | BM-069 | decision.decisionLine | `{{document.field8}}` | Số QĐ | Open DOC 69. Search `{{document.field8}}`. Confirm decision line. |
| 5 | W2R-023 | BM-069 | person.occupation | `{{document.field10}}` | Nghề nghiệp | Open DOC 69. Search `{{document.field10}}`. Confirm is occupation. |
| 6 | W2R-027 | BM-073 | person.dateOfBirth | `{{document.field3}}` | Ngày sinh | Open DOC 73. Search `{{document.field3}}`. Confirm is date of birth. |
| 7 | W2R-028 | BM-073 | person.idNumber | `{{document.field5}}` | Số CCCD/CMND | Open DOC 73. Search `{{document.field5}}`. Confirm is ID number. |

---

## All 56 Items

### BM-068 — QĐ huỷ bỏ biện pháp phong toả tài khoản (12 items)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-001 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |
| W2R-002 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | | |
| W2R-003 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | | |
| W2R-004 | person.permanentAddress | `{{person.permanentAddress}}` | Slot from Wave 02 DOCX remediation | Địa chỉ thường trú | | |
| W2R-005 | person.permanentAddress2 | `{{person.permanentAddress2}}` | Slot from Wave 02 DOCX remediation | Địa chỉ thường trú (dòng 2) | | |
| W2R-006 | person.occupation | `{{person.occupation}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp | | |
| W2R-007 | person.idNumber | `{{person.idNumber}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | | |
| W2R-008 | person.permanentAddress3 | `{{person.permanentAddress3}}` | Slot from Wave 02 DOCX remediation | Địa chỉ thường trú (dòng 3) | | |
| W2R-009 | person.occupation2 | `{{person.occupation2}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp (dòng 2) | | |
| W2R-010 | person.idNumber2 | `{{person.idNumber2}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND (dòng 2) | | |
| W2R-011 | person.temporaryAddress | `{{person.temporaryAddress}}` | Slot from Wave 02 DOCX remediation | Địa chỉ tạm trú | | |
| W2R-012 | person.province | `{{person.province}}` | Slot from Wave 02 DOCX remediation | Tỉnh/Thành phố | | |

### BM-069 — BB về việc hủy bỏ biện pháp phong tỏa tài khoản (12 items)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-013 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |
| W2R-014 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | | |
| W2R-015 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | | |
| W2R-016 | person.idNumber | `{{document.field5}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | | |
| W2R-017 | document.reasonLine | `{{document.field6}}` | Slot from Wave 02 DOCX remediation | Lý do | | |
| W2R-018 | document.reasonLine2 | `{{document.field7}}` | Slot from Wave 02 DOCX remediation | Lý do (dòng 2) | | |
| W2R-019 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên | | |
| W2R-020 | person.currentAddress | `{{person.currentAddress}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay | | |
| W2R-021 | person.currentAddress2 | `{{person.currentAddress2}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay (dòng 2) | | |
| W2R-022 | decision.decisionLine | `{{document.field8}}` | Slot from Wave 02 DOCX remediation | Số QĐ | | |
| W2R-023 | person.occupation | `{{document.field10}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp | | |
| W2R-024 | document.summaryLine | `{{document.field12}}` | Slot from Wave 02 DOCX remediation | Tóm tắt nội dung | | |

### BM-073 — Yêu cầu thay đổi Thủ trưởng, PTT, ĐTV cơ quan có thẩm quyền điều tra (4 items)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-025 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |
| W2R-026 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | | |
| W2R-027 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | | |
| W2R-028 | person.idNumber | `{{document.field5}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | | |

### BM-075 — Đề nghị thay đổi người phiên dịch, người dịch thuật (4 items)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-029 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |
| W2R-030 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên người phiên dịch/dịch thuật | | |
| W2R-031 | person.dateOfBirth | `{{person.dateOfBirth}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | | |
| W2R-032 | person.currentAddress | `{{person.currentAddress}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay | | |

### BM-077 — Yêu cầu, đề nghị cử người bào chữa (1 item)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-033 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |

### BM-080 — Thông báo từ chối việc đăng ký bào chữa (6 items)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-034 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |
| W2R-035 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | | |
| W2R-036 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên | | |
| W2R-037 | person.dateOfBirth | `{{person.dateOfBirth}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | | |
| W2R-038 | person.currentAddress | `{{person.currentAddress}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay | | |
| W2R-039 | legalBasis.legalBasisLine | `{{legalBasis.legalBasisLine}}` | Slot from Wave 02 DOCX remediation | Căn cứ pháp luật | | |

### BM-082 — Thông báo về thời gian, địa điểm tiến hành tố tụng cho người bào chữa (1 item)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-040 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |

### BM-162 — Giấy mời (7 items)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-041 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |
| W2R-042 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | | |
| W2R-043 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | | |
| W2R-044 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên | | |
| W2R-045 | person.currentAddress | `{{person.currentAddress}}` | Slot from Wave 02 DOCX remediation | Nơi ở hiện nay | | |
| W2R-046 | person.occupation | `{{person.occupation}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp | | |
| W2R-047 | person.idNumber | `{{person.idNumber}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | | |

### BM-163 — Giấy triệu tập (9 items)

| ID | Path | Placeholder | Current Label | Suggested | Decision | Approved Label |
|----|------|-------------|--------------|----------|----------|----------------|
| W2R-048 | document.fullDocumentCode | `{{document.field1}}` | Slot from Wave 02 DOCX remediation | Số/Ký hiệu văn bản | | |
| W2R-049 | document.issueDate | `{{document.field2}}` | Slot from Wave 02 DOCX remediation | Ngày ban hành | | |
| W2R-050 | person.dateOfBirth | `{{document.field3}}` | Slot from Wave 02 DOCX remediation | Ngày sinh | | |
| W2R-051 | person.personFullName | `{{person.personFullName}}` | Slot from Wave 02 DOCX remediation | Họ tên | | |
| W2R-052 | person.occupation | `{{person.occupation}}` | Slot from Wave 02 DOCX remediation | Nghề nghiệp | | |
| W2R-053 | person.ward | `{{person.ward}}` | Slot from Wave 02 DOCX remediation | Phường/Xã | | |
| W2R-054 | person.province | `{{person.province}}` | Slot from Wave 02 DOCX remediation | Tỉnh/Thành phố | | |
| W2R-055 | person.idNumber | `{{person.idNumber}}` | Slot from Wave 02 DOCX remediation | Số CCCD/CMND | | |
| W2R-056 | case.caseNumber | `{{case.caseNumber}}` | Slot from Wave 02 DOCX remediation | Số hồ sơ vụ án | | |

---

## How to Use

1. Copy this file to `decisions.approved.json`.
2. Fill in `decision` and `approvedLabel` for each item.
3. Run: `node scripts/audit/apply-docx-wave-02-manual-review-approved.mjs` (dry-run)
4. Run: `node scripts/audit/apply-docx-wave-02-manual-review-approved.mjs --write` (apply)
