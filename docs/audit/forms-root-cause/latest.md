# AUDIT_FORMS_ROOT_CAUSE v2 - Form Metadata Root-Cause Audit (Repaired)
Generated: 2026-06-25T17:27:04.928Z
Audit version: v2 (rule independence: true)

## Executive Summary

| Metric | Value |
|--------|-------|
| totalContracts | 213 |
| totalFields | 2453 |
| totalIssues | 3480 |
| **FAIL** | **1886** |
| REVIEW | 1594 |

### Issue Counts by Category

| Issue Code | Count |
|------------|-------|
| COMPILED_DRIFT | 765 |
| BAD_LABEL | 499 |
| SHOULD_BE_READONLY | 461 |
| WEAK_EVIDENCE_AUTO_LOCKED | 422 |
| GENERIC_FIELD_CANONICALIZATION | 388 |
| SOURCE_MISMATCH | 339 |
| RAW_PATTERN_DOMAIN_MISMATCH | 323 |
| REQUIRED_SUSPICIOUS | 114 |
| UI_VISIBLE_BAD_METADATA | 96 |
| REMEDIATION_LEAK | 73 |

### Top 20 BMs by Issue Count

| templateCode | title | failCount | reviewCount | totalIssues |
|--------------|-------|-----------|-------------|-------------|
| BM-096 | Yêu cầu ra QĐ khởi tố bị can | 46 | 3 | 49 |
| BM-136 | BB đối chất | 41 | 4 | 45 |
| BM-069 | BB về việc hủy bỏ biện pháp phong tỏa tài khoản | 39 | 19 | 58 |
| BM-155 | QĐ phục hồi vụ án đối với bị can | 37 | 3 | 40 |
| BM-068 | QĐ huỷ bỏ biện pháp phong toả tài khoản | 30 | 19 | 49 |
| BM-117 | QĐ phục hồi điều tra bị can | 28 | 4 | 32 |
| BM-126 | QĐ trưng cầu giám định | 27 | 5 | 32 |
| BM-118 | QĐ phục hồi điều tra VA đối với bị can | 27 | 4 | 31 |
| BM-163 | Giấy triệu tập | 26 | 17 | 43 |
| BM-212 | Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho  | 25 | 6 | 31 |
| BM-106 | Yêu cầu truy nã bị can | 24 | 3 | 27 |
| BM-134 | BB ghi lời khai | 22 | 4 | 26 |
| BM-135 | BB hỏi cung bị can | 22 | 4 | 26 |
| BM-152 | QĐ đình chỉ vụ án đối với bị can | 22 | 3 | 25 |
| BM-203 | Thông báo về hoạt động tố tụng | 21 | 6 | 27 |
| BM-211 | Thông báo về việc thụ lý vụ án | 21 | 6 | 27 |
| BM-162 | Giấy mời | 20 | 14 | 34 |
| BM-186 | Thông báo áp dụng thủ tục xử lý chuyển hướng | 20 | 6 | 26 |
| BM-196 | Quyết định mở phiên họp xem xét, áp dụng biện pháp | 20 | 6 | 26 |
| BM-127 | Yêu cầu định giá tài sản | 20 | 4 | 24 |

### BM-050 Findings

**QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm**

Total: 13 issues (10 FAIL, 3 REVIEW)

- **RAW_PATTERN_DOMAIN_MISMATCH** [FAIL] `agency.tenVien`
  - Label: `Tên cơ quan` | rawPattern: `{{document.field1}}` | rawDomain: `document` | rawTail: `field1` | source: `agencyConfig`
  - Reason: rawPattern domain "document" ({{document.field1}}) does not match canonical path domain "agency". Context: "VIỆN KIỂM SÁT … {{document.field1}}"
  - Suggested path: `document.field1`
  - Suggested label: `Tên cơ quan`
  - Confidence: HIGH | requiresHumanReview: false
- **SOURCE_MISMATCH** [FAIL] `agency.tenVien`
  - Label: `Tên cơ quan` | rawPattern: `{{document.field1}}` | rawDomain: `document` | rawTail: `field1` | source: `agencyConfig`
  - Reason: source="agencyConfig" but rawPattern "{{document.field1}}" is from "document" domain. agencyConfig cannot provide decision/document/person data.
  - Suggested path: `agency.name`
  - Suggested label: `Tên cơ quan`
  - Suggested source: `manual`
  - Confidence: HIGH | requiresHumanReview: false
- **BAD_LABEL** [FAIL] `agency.coQuan`
  - Label: `Ô trống` | rawPattern: `{{decision.field2}}` | rawDomain: `decision` | rawTail: `field2` | source: `agencyConfig`
  - Reason: Canonical field label is "Ô trống" ("Ô trống"). This will appear in UI.
  - Suggested path: `decision.requestingAgencyName`
  - Suggested label: `Cơ quan ra quyết định đề nghị phê chuẩn`
  - Confidence: MEDIUM | requiresHumanReview: false
- **RAW_PATTERN_DOMAIN_MISMATCH** [FAIL] `agency.coQuan`
  - Label: `Ô trống` | rawPattern: `{{decision.field2}}` | rawDomain: `decision` | rawTail: `field2` | source: `agencyConfig`
  - Reason: rawPattern domain "decision" ({{decision.field2}}) does not match canonical path domain "agency". Context: "Xét hồ sơ đề nghị phê chuẩn Quyết định về việc đặt tiền để bảo đảm số … ngày … t"
  - Suggested path: `decision.field2`
  - Suggested label: `Cơ quan ra quyết định đề nghị phê chuẩn`
  - Confidence: HIGH | requiresHumanReview: false
- **SOURCE_MISMATCH** [FAIL] `agency.coQuan`
  - Label: `Ô trống` | rawPattern: `{{decision.field2}}` | rawDomain: `decision` | rawTail: `field2` | source: `agencyConfig`
  - Reason: source="agencyConfig" but rawPattern "{{decision.field2}}" is from "decision" domain. agencyConfig cannot provide decision/document/person data.
  - Suggested path: `decision.requestingAgencyName`
  - Suggested label: `Cơ quan ra quyết định đề nghị phê chuẩn`
  - Suggested source: `casePayload`
  - Confidence: HIGH | requiresHumanReview: false
- **GENERIC_FIELD_CANONICALIZATION** [FAIL] `agency.coQuan`
  - Label: `Ô trống` | rawPattern: `{{decision.field2}}` | rawDomain: `decision` | rawTail: `field2` | source: `agencyConfig`
  - Reason: Generic raw pattern "{{decision.field2}}" mapped to "agency.coQuan" but has problems (label="Ô trống" (bad), weak_evidence=false). Generic fieldN should be replaced with correct semantic path.
  - Suggested path: `decision.requestingAgencyName`
  - Suggested label: `Cơ quan ra quyết định đề nghị phê chuẩn`
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [FAIL] `agency.diaDanh`
  - Label: `Ô trống` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `agencyConfig`
  - Reason: Canonical field label is "Ô trống" ("Ô trống"). This will appear in UI.
  - Suggested path: `document.issuePlaceDateLine`
  - Suggested label: `Địa điểm, ngày lập văn bản`
  - Confidence: MEDIUM | requiresHumanReview: false
- **RAW_PATTERN_DOMAIN_MISMATCH** [FAIL] `agency.diaDanh`
  - Label: `Ô trống` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `agencyConfig`
  - Reason: rawPattern domain "document" ({{document.field3}}) does not match canonical path domain "agency". Context: "11{{document.field3}}"
  - Suggested path: `document.field3`
  - Suggested label: `Địa điểm, ngày lập văn bản`
  - Confidence: HIGH | requiresHumanReview: false
- **SOURCE_MISMATCH** [FAIL] `agency.diaDanh`
  - Label: `Ô trống` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `agencyConfig`
  - Reason: source="agencyConfig" but rawPattern "{{document.field3}}" is from "document" domain. agencyConfig cannot provide decision/document/person data.
  - Suggested path: `document.issuePlaceDateLine`
  - Suggested label: `Địa điểm, ngày lập văn bản`
  - Suggested source: `manual`
  - Confidence: HIGH | requiresHumanReview: false
- **GENERIC_FIELD_CANONICALIZATION** [FAIL] `agency.diaDanh`
  - Label: `Ô trống` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `agencyConfig`
  - Reason: Generic raw pattern "{{document.field3}}" mapped to "agency.diaDanh" but has problems (label="Ô trống" (bad), weak_evidence=false). Generic fieldN should be replaced with correct semantic path.
  - Suggested path: `document.issuePlaceDateLine`
  - Suggested label: `Địa điểm, ngày lập văn bản`
  - Confidence: MEDIUM | requiresHumanReview: true
- **COMPILED_DRIFT** [REVIEW] `agency.tenVien`
  - Label: `Tên cơ quan` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `agencyConfig`
  - Reason: dataSource drift: locked="agencyConfig" vs compiled="AGENCY".
  - Suggested path: `agency.name`
  - Suggested label: `Tên cơ quan`
  - Confidence: MEDIUM | requiresHumanReview: true
- **COMPILED_DRIFT** [REVIEW] `agency.coQuan`
  - Label: `Ô trống` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `agencyConfig`
  - Reason: dataSource drift: locked="agencyConfig" vs compiled="AGENCY".
  - Suggested path: `decision.requestingAgencyName`
  - Suggested label: `Cơ quan ra quyết định đề nghị phê chuẩn`
  - Confidence: MEDIUM | requiresHumanReview: true
- **COMPILED_DRIFT** [REVIEW] `agency.diaDanh`
  - Label: `Ô trống` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `agencyConfig`
  - Reason: dataSource drift: locked="agencyConfig" vs compiled="AGENCY".
  - Suggested path: `document.issuePlaceDateLine`
  - Suggested label: `Địa điểm, ngày lập văn bản`
  - Confidence: MEDIUM | requiresHumanReview: true

### BM-068 Findings

**QĐ huỷ bỏ biện pháp phong toả tài khoản**

Total: 49 issues (30 FAIL, 19 REVIEW)

- **RAW_PATTERN_DOMAIN_MISMATCH** [FAIL] `agency.name`
  - Label: `Tên cơ quan` | rawPattern: `{{document.field1}}` | rawDomain: `document` | rawTail: `field1` | source: `agencyConfig`
  - Reason: rawPattern domain "document" ({{document.field1}}) does not match canonical path domain "agency". Context: "VIỆN KIỂM SÁT … {{document.field1}}"
  - Suggested path: `document.field1`
  - Confidence: HIGH | requiresHumanReview: false
- **SOURCE_MISMATCH** [FAIL] `agency.name`
  - Label: `Tên cơ quan` | rawPattern: `{{document.field1}}` | rawDomain: `document` | rawTail: `field1` | source: `agencyConfig`
  - Reason: source="agencyConfig" but rawPattern "{{document.field1}}" is from "document" domain. agencyConfig cannot provide decision/document/person data.
  - Suggested source: `manual`
  - Confidence: HIGH | requiresHumanReview: false
- **SHOULD_BE_READONLY** [REVIEW] `agency.name`
  - Label: `Tên cơ quan` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `agencyConfig`
  - Reason: Field appears to be a computed/agency/official field (agency name field). source="agencyConfig" is likely wrong.
  - Suggested source: `agencyConfig`
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `document.fullDocumentCode`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field1}}` | rawDomain: `document` | rawTail: `field1` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **GENERIC_FIELD_CANONICALIZATION** [FAIL] `document.fullDocumentCode`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field1}}` | rawDomain: `document` | rawTail: `field1` | source: `manual`
  - Reason: Generic raw pattern "{{document.field1}}" mapped to "document.fullDocumentCode" but has problems (label="Slot from Wave 02 DOCX remediation" (bad), weak_evidence=false). Generic fieldN should be replaced with correct semantic path.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `document.fullDocumentCode`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field looks required (identity/key field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **SHOULD_BE_READONLY** [REVIEW] `document.fullDocumentCode`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field appears to be a computed/agency/official field (fixed/generated administrative field). source="manual" is likely wrong.
  - Suggested source: `agencyConfig`
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `document.issueDate`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field2}}` | rawDomain: `document` | rawTail: `field2` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **GENERIC_FIELD_CANONICALIZATION** [FAIL] `document.issueDate`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field2}}` | rawDomain: `document` | rawTail: `field2` | source: `manual`
  - Reason: Generic raw pattern "{{document.field2}}" mapped to "document.issueDate" but has problems (label="Slot from Wave 02 DOCX remediation" (bad), weak_evidence=false). Generic fieldN should be replaced with correct semantic path.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `document.issueDate`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field looks required (date field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.dateOfBirth`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **RAW_PATTERN_DOMAIN_MISMATCH** [FAIL] `person.dateOfBirth`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `manual`
  - Reason: rawPattern domain "document" ({{document.field3}}) does not match canonical path domain "person". Context: "imes New Roman" w:hAnsi="Times New Roman"/> {{document.field3}} <w:rFonts w:asci"
  - Suggested path: `document.field3`
  - Confidence: HIGH | requiresHumanReview: false
- **GENERIC_FIELD_CANONICALIZATION** [FAIL] `person.dateOfBirth`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `manual`
  - Reason: Generic raw pattern "{{document.field3}}" mapped to "person.dateOfBirth" but has problems (label="Slot from Wave 02 DOCX remediation" (bad), weak_evidence=false). Generic fieldN should be replaced with correct semantic path.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.permanentAddress`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.permanentAddress}}` | rawDomain: `person` | rawTail: `permanentAddress` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.permanentAddress2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.permanentAddress2}}` | rawDomain: `person` | rawTail: `permanentAddress2` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.occupation`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.occupation}}` | rawDomain: `person` | rawTail: `occupation` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `person.occupation`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field looks required (person info field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.idNumber`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.idNumber}}` | rawDomain: `person` | rawTail: `idNumber` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `person.idNumber`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field looks required (ID field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.permanentAddress3`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.permanentAddress3}}` | rawDomain: `person` | rawTail: `permanentAddress3` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.occupation2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.occupation2}}` | rawDomain: `person` | rawTail: `occupation2` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.idNumber2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.idNumber2}}` | rawDomain: `person` | rawTail: `idNumber2` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.temporaryAddress`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.temporaryAddress}}` | rawDomain: `person` | rawTail: `temporaryAddress` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.province`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.province}}` | rawDomain: `person` | rawTail: `province` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REMEDIATION_LEAK** [FAIL] `document.fullDocumentCode`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field1}}` | rawDomain: `document` | rawTail: `field1` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `document.issueDate`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field2}}` | rawDomain: `document` | rawTail: `field2` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.dateOfBirth`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.permanentAddress`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.permanentAddress}}` | rawDomain: `person` | rawTail: `permanentAddress` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.permanentAddress2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.permanentAddress2}}` | rawDomain: `person` | rawTail: `permanentAddress2` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.occupation`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.occupation}}` | rawDomain: `person` | rawTail: `occupation` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.idNumber`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.idNumber}}` | rawDomain: `person` | rawTail: `idNumber` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.permanentAddress3`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.permanentAddress3}}` | rawDomain: `person` | rawTail: `permanentAddress3` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.occupation2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.occupation2}}` | rawDomain: `person` | rawTail: `occupation2` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.idNumber2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.idNumber2}}` | rawDomain: `person` | rawTail: `idNumber2` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.temporaryAddress`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.temporaryAddress}}` | rawDomain: `person` | rawTail: `temporaryAddress` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **REMEDIATION_LEAK** [FAIL] `person.province`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{person.province}}` | rawDomain: `person` | rawTail: `province` | source: `manual`
  - Reason: Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. This leaks internal process language into user-facing UI.
  - Confidence: HIGH | requiresHumanReview: false
- **COMPILED_DRIFT** [REVIEW] `agency.name`
  - Label: `Tên cơ quan` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `agencyConfig`
  - Reason: dataSource drift: locked="agencyConfig" vs compiled="AGENCY".
  - Confidence: MEDIUM | requiresHumanReview: true
- **UI_VISIBLE_BAD_METADATA** [FAIL] `document.fullDocumentCode`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `document.issueDate`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.dateOfBirth`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.permanentAddress`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.permanentAddress2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.occupation`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.idNumber`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.permanentAddress3`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.occupation2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.idNumber2`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.temporaryAddress`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false
- **UI_VISIBLE_BAD_METADATA** [FAIL] `person.province`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Visible field resolves to bad label "Slot from Wave 02 DOCX remediation" (starts with "Slot from") after full label resolution chain. This WILL appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: false

### BAD_LABEL (499)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-001 | `document.issuePlaceDateLine` | `issuePlaceDateLine` | document | issuePlaceDateLine | systemDate | REVIEW | MEDIUM |
| BM-001 | `receiver.fullName` | `fullName` | receiver | fullName | manual | REVIEW | MEDIUM |
| BM-001 | `receiver.positionTitle` | `positionTitle` | receiver | positionTitle | officialConfig | REVIEW | MEDIUM |
| BM-001 | `receiver.departmentName` | `departmentName` | receiver | departmentName | manual | REVIEW | MEDIUM |
| BM-001 | `informant.fullName` | `fullName` | informant | fullName | manual | REVIEW | MEDIUM |
| BM-001 | `informant.genderLabel` | `genderLabel` | informant | genderLabel | manual | REVIEW | MEDIUM |
| BM-001 | `informant.otherName` | `otherName` | informant | otherName | manual | REVIEW | MEDIUM |
| BM-001 | `informant.birthDay` | `birthDay` | informant | birthDay | manual | REVIEW | MEDIUM |
| BM-001 | `informant.birthMonth` | `birthMonth` | informant | birthMonth | manual | REVIEW | MEDIUM |
| BM-001 | `informant.birthYear` | `birthYear` | informant | birthYear | manual | REVIEW | MEDIUM |
| BM-001 | `informant.placeOfBirth` | `placeOfBirth` | informant | placeOfBirth | manual | REVIEW | MEDIUM |
| BM-001 | `informant.nationality` | `nationality` | informant | nationality | manual | REVIEW | MEDIUM |
| BM-001 | `informant.ethnicity` | `ethnicity` | informant | ethnicity | manual | REVIEW | MEDIUM |
| BM-001 | `informant.religion` | `religion` | informant | religion | manual | REVIEW | MEDIUM |
| BM-001 | `informant.occupation` | `occupation` | informant | occupation | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityNo` | `identityNo` | informant | identityNo | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityIssuedDay` | `identityIssuedDay` | informant | identityIssuedDay | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityIssuedMonth` | `identityIssuedMonth` | informant | identityIssuedMonth | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityIssuedYear` | `identityIssuedYear` | informant | identityIssuedYear | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityIssuedPlace` | `identityIssuedPlace` | informant | identityIssuedPlace | manual | REVIEW | MEDIUM |
| BM-001 | `informant.permanentAddress` | `permanentAddress` | informant | permanentAddress | manual | REVIEW | MEDIUM |
| BM-001 | `informant.temporaryAddress` | `temporaryAddress` | informant | temporaryAddress | manual | REVIEW | MEDIUM |
| BM-001 | `informant.currentAddress` | `currentAddress` | informant | currentAddress | manual | REVIEW | MEDIUM |
| BM-001 | `informant.phone` | `phone` | informant | phone | manual | REVIEW | MEDIUM |
| BM-001 | `informant.representedOrganization` | `representedOrganization` | informant | representedOrganization | manual | REVIEW | MEDIUM |
| BM-001 | `informant.signerName` | `signerName` | informant | signerName | officialConfig | REVIEW | MEDIUM |
| BM-001 | `receiver.signerName` | `signerName` | receiver | signerName | officialConfig | REVIEW | MEDIUM |
| BM-001 | `recipients.archiveLine` | `archiveLine` | recipients | archiveLine | manual | REVIEW | MEDIUM |
| BM-002 | `agency.parentName` | `parentName` | agency | parentName | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `agency.name` | `name` | agency | name | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `document.documentCode` | `documentCode` | document | documentCode | manual | REVIEW | MEDIUM |
| BM-002 | `document.issuePlaceAndDateLine` | `issuePlaceAndDateLine` | document | issuePlaceAndDateLine | systemDate | REVIEW | MEDIUM |
| BM-002 | `receiver.name` | `name` | receiver | name | manual | REVIEW | MEDIUM |
| BM-002 | `sourceReport.receivedDateLine` | `receivedDateLine` | unknown | receivedDateLine | systemDate | REVIEW | MEDIUM |
| BM-002 | `agency.bodyName` | `bodyName` | agency | bodyName | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `reporter.fullName` | `fullName` | reporter | fullName | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.genderText` | `genderText` | reporter | genderText | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.otherName` | `otherName` | reporter | otherName | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.birthDateLine` | `birthDateLine` | reporter | birthDateLine | systemDate | REVIEW | MEDIUM |
| BM-002 | `reporter.birthPlace` | `birthPlace` | reporter | birthPlace | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.nationality` | `nationality` | reporter | nationality | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.ethnicity` | `ethnicity` | reporter | ethnicity | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.religion` | `religion` | reporter | religion | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.occupation` | `occupation` | reporter | occupation | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.identityNumber` | `identityNumber` | reporter | identityNumber | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.identityIssueDateLine` | `identityIssueDateLine` | reporter | identityIssueDateLine | systemDate | REVIEW | MEDIUM |
| BM-002 | `reporter.identityIssuePlace` | `identityIssuePlace` | reporter | identityIssuePlace | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.permanentResidence` | `permanentResidence` | reporter | permanentResidence | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.temporaryResidence` | `temporaryResidence` | reporter | temporaryResidence | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.currentResidence` | `currentResidence` | reporter | currentResidence | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.phoneNumber` | `phoneNumber` | reporter | phoneNumber | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.organizationRepresentative` | `organizationRepresentativ` | reporter | organizationRepresentative | manual | REVIEW | MEDIUM |
| BM-002 | `sourceReport.content` | `content` | unknown | content | manual | REVIEW | MEDIUM |
| BM-002 | `recipients.primaryLine` | `primaryLine` | recipients | primaryLine | manual | REVIEW | MEDIUM |
| BM-002 | `recipients.archiveLine` | `archiveLine` | recipients | archiveLine | manual | REVIEW | MEDIUM |
| BM-002 | `signature.positionTitle` | `positionTitle` | signature | positionTitle | officialConfig | REVIEW | MEDIUM |
| BM-002 | `signature.signerName` | `signerName` | signature | signerName | officialConfig | REVIEW | MEDIUM |
| BM-003 | `agency.parentName` | `parentName` | agency | parentName | agencyConfig | REVIEW | MEDIUM |
| BM-003 | `agency.name` | `name` | agency | name | agencyConfig | REVIEW | MEDIUM |
| BM-003 | `document.documentCode` | `documentCode` | document | documentCode | manual | REVIEW | MEDIUM |
| BM-003 | `document.issuePlaceAndDateLine` | `issuePlaceAndDateLine` | document | issuePlaceAndDateLine | systemDate | REVIEW | MEDIUM |
| BM-003 | `legalBasis.procedureArticlesLine` | `procedureArticlesLine` | legalBasis | procedureArticlesLine | officialConfig | REVIEW | MEDIUM |
| BM-003 | `recipients.primaryLine` | `primaryLine` | recipients | primaryLine | manual | REVIEW | MEDIUM |
| BM-003 | `recipients.archiveLine` | `archiveLine` | recipients | archiveLine | manual | REVIEW | MEDIUM |
| BM-003 | `signature.signMode` | `signMode` | signature | signMode | officialConfig | REVIEW | MEDIUM |
| BM-003 | `signature.positionTitle` | `positionTitle` | signature | positionTitle | officialConfig | REVIEW | MEDIUM |
| BM-003 | `signature.signerName` | `signerName` | signature | signerName | officialConfig | REVIEW | MEDIUM |
| BM-004 | `document.vietTat` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-004 | `agency.diaDanh` | `Ô trống` | document | field9 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `agency.tenCo` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `document.vietTat` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-013 | `agency.diaDanh` | `Ô trống` | document | field5 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `document.ngayBan` | `Ô trống` | unknown | field6 | manual | FAIL | MEDIUM |
| BM-013 | `document.soVan` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-021 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-021 | `document.documentCode` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-021 | `decision.summaryLine` | `Ô trống` | document | field9 | computed | FAIL | MEDIUM |
| BM-021 | `decision.decisionLine` | `Ô trống` | document | field10 | manual | FAIL | MEDIUM |
| BM-022 | `person.fullName` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-024 | `document.issuePlaceAndDateLine` | `Ô trống` | document | field6 | systemDate | FAIL | MEDIUM |
| BM-025 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-026 | `document.issueDate` | `Ô trống` | document | field5 | systemDate | FAIL | MEDIUM |
| BM-027 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-027 | `agency.diaDanh` | `Ô trống` | unknown | field3 | agencyConfig | FAIL | MEDIUM |
| BM-027 | `document.soThong` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-027 | `document.ngayBan` | `Ô trống` | unknown | field5 | manual | FAIL | MEDIUM |
| BM-028 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-028 | `agency.diaDanh` | `Ô trống` | unknown | field3 | agencyConfig | FAIL | MEDIUM |
| BM-028 | `document.soQuyet` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-028 | `document.ngayBan` | `Ô trống` | unknown | field5 | manual | FAIL | MEDIUM |
| BM-028 | `legalBasis.canCu` | `Ô trống` | unknown | field6 | manual | FAIL | MEDIUM |
| BM-028 | `document.soQd` | `Ô trống` | unknown | field7 | manual | FAIL | MEDIUM |
| BM-028 | `document.ngayQd` | `Ô trống` | unknown | field8 | manual | FAIL | MEDIUM |
| BM-029 | `agency.tenCo` | `Ô trống` | unknown | field3 | agencyConfig | FAIL | MEDIUM |
| BM-029 | `document.vietTat` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-032 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-032 | `document.documentCode` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-034 | `document.issueDate` | `Ô trống` | document | field5 | systemDate | FAIL | MEDIUM |
| BM-035 | `document.issueDate` | `Ô trống` | document | field5 | systemDate | FAIL | MEDIUM |
| BM-036 | `document.issueDate` | `Ô trống` | document | field5 | computed | FAIL | MEDIUM |
| ... | | | | | | | 399 more |

### RAW_PATTERN_DOMAIN_MISMATCH (323)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-004 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-004 | `agency.tenCo` | `Tên cơ quan` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-004 | `agency.diaDanh` | `Ô trống` | document | field9 | agencyConfig | FAIL | HIGH |
| BM-013 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-013 | `agency.tenCo` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-013 | `agency.diaDanh` | `Ô trống` | document | field5 | agencyConfig | FAIL | HIGH |
| BM-021 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-021 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | computed | FAIL | HIGH |
| BM-021 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | HIGH |
| BM-021 | `document.issuePlaceAndDateLine` | `Căn cứ Bộ luật Tố tụng hì` | legalBasis | procedureArticlesLine | systemDate | FAIL | HIGH |
| BM-021 | `legalBasis.procedureArticlesLine` | `Viện kiểm sát ban hành` | agency | nameUpper | officialConfig | FAIL | HIGH |
| BM-021 | `decision.summaryLine` | `Ô trống` | document | field9 | computed | FAIL | HIGH |
| BM-021 | `decision.decisionLine` | `Ô trống` | document | field10 | manual | FAIL | HIGH |
| BM-022 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-022 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-022 | `person.fullName` | `Ô trống` | document | field7 | manual | FAIL | HIGH |
| BM-024 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-025 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-025 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-025 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | HIGH |
| BM-026 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-026 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-027 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-027 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | HIGH |
| BM-028 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-028 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | HIGH |
| BM-029 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-032 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-032 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-032 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | HIGH |
| BM-034 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-034 | `agency.issuePlace` | `Nội dung quyết định (${"k` | decision | decisionLine | computed | FAIL | HIGH |
| BM-035 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-036 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-036 | `document.documentCode` | `Viện kiểm sát ban hành` | agency | nameUpper | manual | FAIL | HIGH |
| BM-036 | `document.issuePlaceAndDateLine` | `Họ tên người bị áp dụng` | person | fullName | systemDate | FAIL | HIGH |
| BM-036 | `person.fullName` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-036 | `legalBasis.procedureArticlesLine` | `Ô trống` | document | field8 | officialConfig | FAIL | HIGH |
| BM-036 | `decision.summaryLine` | `Cơ quan cấp trên` | agency | parentNameUpper | computed | FAIL | HIGH |
| BM-036 | `recipients.executionAgencyLine` | `Nội dung quyết định (${"t` | decision | decisionLine | manual | FAIL | HIGH |
| BM-036 | `recipients.personLine` | `Ô trống` | document | field12 | manual | FAIL | HIGH |
| BM-036 | `recipients.archiveLine` | `Ô trống` | document | field13 | manual | FAIL | HIGH |
| BM-041 | `agency.parentNameUpper` | `Tên cơ quan` | document | field1 | computed | FAIL | HIGH |
| BM-041 | `agency.issuePlace` | `Số quyết định` | document | documentCode | computed | FAIL | HIGH |
| BM-048 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-048 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | HIGH |
| BM-048 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | HIGH |
| BM-048 | `legalBasis.canCu` | `Ô trống` | person | field7 | manual | FAIL | HIGH |
| BM-049 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-049 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | HIGH |
| BM-050 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-050 | `agency.coQuan` | `Ô trống` | decision | field2 | agencyConfig | FAIL | HIGH |
| BM-050 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-052 | `document.fullDocumentCode` | `Ô trống` | decision | field2 | manual | FAIL | HIGH |
| BM-062 | `decision.decisionLine` | `Ô trống` | document | field3 | computed | FAIL | HIGH |
| BM-065 | `decision.decisionLine` | `Ô trống` | document | field2 | computed | FAIL | HIGH |
| BM-066 | `decision.decisionLine` | `Ô trống` | document | field2 | computed | FAIL | HIGH |
| BM-068 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-068 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-069 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-069 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-069 | `person.idNumber` | `Slot from Wave 02 DOCX re` | document | field5 | manual | FAIL | HIGH |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX re` | document | field8 | manual | FAIL | HIGH |
| BM-069 | `person.occupation` | `Slot from Wave 02 DOCX re` | document | field10 | manual | FAIL | HIGH |
| BM-072 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-072 | `agency.diaDanh` | `Tên cơ quan` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-073 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-073 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-073 | `person.idNumber` | `Slot from Wave 02 DOCX re` | document | field5 | manual | FAIL | HIGH |
| BM-074 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-074 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-074 | `document.dienThoai` | `Ô trống` | agency | field4 | manual | FAIL | HIGH |
| BM-074 | `document.soYeu` | `Ô trống` | agency | field5 | manual | FAIL | HIGH |
| BM-075 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-076 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-076 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-077 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-078 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-078 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-078 | `document.soThong` | `Ô trống` | agency | field5 | manual | FAIL | HIGH |
| BM-079 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-080 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-081 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-081 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-082 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-083 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-083 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-084 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-084 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-087 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-087 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | HIGH |
| BM-087 | `legalBasis.canCu` | `Ô trống` | document | field7 | manual | FAIL | HIGH |
| BM-088 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-088 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | HIGH |
| BM-089 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-091 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-091 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | HIGH |
| BM-092 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-092 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | HIGH |
| BM-093 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| ... | | | | | | | 223 more |

### SOURCE_MISMATCH (339)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-004 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-004 | `agency.tenCo` | `Tên cơ quan` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-004 | `agency.diaDanh` | `Ô trống` | document | field9 | agencyConfig | FAIL | HIGH |
| BM-009 | `sourceResolutionExtension.article1Line` | `Điều 1` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-009 | `sourceResolutionExtension.article2Line` | `Điều 2` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-010 | `sourceSuspension.caseSummary` | `Vụ việc` | unknown | caseSummary | manual | REVIEW | MEDIUM |
| BM-010 | `sourceSuspension.article2Line` | `Điều 2` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-010 | `sourceSuspension.article3Line` | `Điều 3` | unknown | article3Line | manual | REVIEW | MEDIUM |
| BM-011 | `sourceSuspensionCancellation.article1Line` | `Điều 1` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-011 | `sourceSuspensionCancellation.article2Line` | `Điều 2` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-013 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-013 | `agency.tenCo` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-013 | `agency.diaDanh` | `Ô trống` | document | field5 | agencyConfig | FAIL | HIGH |
| BM-013 | `document.ngayBan` | `Ô trống` | unknown | field6 | manual | REVIEW | MEDIUM |
| BM-014 | `sourceDirectInspection.article1Line` | `Điều 1 - phạm vi và thời ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-014 | `sourceDirectInspection.article3Line` | `Điều 3 - yêu cầu chuẩn bị` | unknown | article3Line | manual | REVIEW | MEDIUM |
| BM-014 | `sourceDirectInspection.article4Line` | `Điều 4 - kế hoạch kèm the` | unknown | article4Line | manual | REVIEW | MEDIUM |
| BM-020 | `initiationRequest.article1Line` | `Nội dung Điều 1` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-020 | `initiationRequest.article2Line` | `Nội dung Điều 2` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-022 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-023 | `investigation.article2Line` | `Nội dung Điều 2` | investigation | article2Line | manual | REVIEW | MEDIUM |
| BM-025 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-026 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-027 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-027 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | HIGH |
| BM-028 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-028 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | HIGH |
| BM-028 | `legalBasis.canCu` | `Ô trống` | unknown | field6 | manual | REVIEW | MEDIUM |
| BM-028 | `document.soQd` | `Ô trống` | unknown | field7 | manual | REVIEW | MEDIUM |
| BM-028 | `document.ngayQd` | `Ô trống` | unknown | field8 | manual | REVIEW | MEDIUM |
| BM-029 | `agency.vienKiem` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-031 | `measure.article1Line` | `Nội dung Điều 1` | measure | article1Line | manual | REVIEW | MEDIUM |
| BM-031 | `measure.article2Line` | `Nội dung Điều 2` | measure | article2Line | manual | REVIEW | MEDIUM |
| BM-032 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-033 | `custody.approvalArticle1Line` | `Nội dung Điều 1` | unknown | approvalArticle1Line | manual | REVIEW | MEDIUM |
| BM-033 | `custody.executionRequestLine` | `Nội dung Điều 2` | unknown | executionRequestLine | manual | REVIEW | MEDIUM |
| BM-037 | `measure.article1Line` | `Điều 1 - Nội dung quyết đ` | measure | article1Line | manual | REVIEW | MEDIUM |
| BM-037 | `measure.article2Line` | `Điều 2 - Giao hồ sơ` | measure | article2Line | manual | REVIEW | MEDIUM |
| BM-038 | `arrestNonApproval.article1Line` | `Điều 1 - Nội dung quyết đ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-038 | `arrestNonApproval.article2Line` | `Điều 2 - Yêu cầu` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-039 | `detentionArrest.detentionExecutionUnitName` | `Đơn vị thi hành` | unknown | detentionExecutionUnitName | manual | REVIEW | MEDIUM |
| BM-039 | `detentionArrest.detentionFacilityName` | `Cơ sở giam giữ` | unknown | detentionFacilityName | manual | REVIEW | MEDIUM |
| BM-040 | `measure.article1Line` | `Điều 1 - Nội dung quyết đ` | measure | article1Line | manual | REVIEW | MEDIUM |
| BM-040 | `measure.article2Line` | `Điều 2 - Giao hồ sơ` | measure | article2Line | manual | REVIEW | MEDIUM |
| BM-042 | `measure.article1Line` | `Điều 1 - Nội dung quyết đ` | measure | article1Line | manual | REVIEW | MEDIUM |
| BM-042 | `measure.article2Line` | `Điều 2 - Thời hạn` | measure | article2Line | manual | REVIEW | MEDIUM |
| BM-042 | `measure.article3Line` | `Điều 3 - Yêu cầu` | measure | article3Line | manual | REVIEW | MEDIUM |
| BM-043 | `measure.article1Line` | `Điều 1 - Nội dung quyết đ` | measure | article1Line | manual | REVIEW | MEDIUM |
| BM-043 | `measure.article2Line` | `Điều 2 - Gia hạn lại` | measure | article2Line | manual | REVIEW | MEDIUM |
| BM-043 | `measure.article3Line` | `Điều 3 - Yêu cầu` | measure | article3Line | manual | REVIEW | MEDIUM |
| BM-044 | `detentionReplacement.article1Line` | `Điều 1 - Nội dung quyết đ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-044 | `detentionReplacement.article2Line` | `Điều 2 - Yêu cầu` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-045 | `bailApproval.article1Line` | `Điều 1 - Nội dung quyết đ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-045 | `bailApproval.article2Line` | `Điều 2 - Điều kiện` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-046 | `guaranteeNonApproval.article1Line` | `Điều 1 - Nội dung quyết đ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-046 | `guaranteeNonApproval.article2Line` | `Điều 2 - Yêu cầu` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-047 | `guaranteeApproval.assignmentLine` | `Điều 1 - Nhiệm vụ của bị ` | unknown | assignmentLine | manual | REVIEW | MEDIUM |
| BM-047 | `guaranteeApproval.article2Line` | `Điều 2 - Giao nhiệm vụ gi` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-048 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-048 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | HIGH |
| BM-048 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | HIGH |
| BM-049 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-049 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | HIGH |
| BM-050 | `agency.tenVien` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-050 | `agency.coQuan` | `Ô trống` | decision | field2 | agencyConfig | FAIL | HIGH |
| BM-050 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-051 | `document.fullDocumentCode` | `Ô trống` | document | field2 | manual | REVIEW | MEDIUM |
| BM-052 | `document.fullDocumentCode` | `Ô trống` | decision | field2 | manual | REVIEW | MEDIUM |
| BM-053 | `measure.article2Line` | `Điều 2 - Nội dung quyết đ` | measure | article2Line | manual | REVIEW | MEDIUM |
| BM-053 | `monitoring.article3Line` | `Điều 3 - Yêu cầu` | monitoring | article3Line | manual | REVIEW | MEDIUM |
| BM-055 | `measure.preventiveMeasureOrderLegalBasisLine` | `Căn cứ lệnh/quyết định áp` | measure | preventiveMeasureOrderLegalBasisLine | manual | REVIEW | MEDIUM |
| BM-055 | `measure.cancellationArticle1Line` | `Điều 1 - Nội dung hủy bỏ` | measure | cancellationArticle1Line | manual | REVIEW | MEDIUM |
| BM-055 | `measure.cancellationArticle2Line` | `Điều 2 - Thông báo` | measure | cancellationArticle2Line | manual | REVIEW | MEDIUM |
| BM-056 | `measure.exitPostponementArticle2Line` | `Điều 2 - Nội dung quyết đ` | measure | exitPostponementArticle2Line | manual | REVIEW | MEDIUM |
| BM-057 | `measure.immigrationAgencyName` | `Tên cơ quan xuất nhập cản` | measure | immigrationAgencyName | manual | REVIEW | MEDIUM |
| BM-059 | `measure.detentionExtensionArticle1Line` | `Điều 1 - Gia hạn tạm giam` | measure | detentionExtensionArticle1Line | manual | REVIEW | MEDIUM |
| BM-059 | `measure.detentionExtensionArticle2Line` | `Điều 2 - Giao nhiệm vụ` | measure | detentionExtensionArticle2Line | manual | REVIEW | MEDIUM |
| BM-064 | `document.fullDocumentCode` | `Ô trống` | document | field3 | manual | REVIEW | MEDIUM |
| BM-068 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-069 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-070 | `caseDecision.caseProsecutionDecisionLine` | `Căn cứ quyết định truy tố` | unknown | caseProsecutionDecisionLine | manual | REVIEW | MEDIUM |
| BM-070 | `assignment.deputyChiefName` | `Họ tên Phó Viện trưởng đư` | unknown | deputyChiefName | manual | REVIEW | MEDIUM |
| BM-070 | `assignment.deputyChiefTitle` | `Chức vụ` | unknown | deputyChiefTitle | manual | REVIEW | MEDIUM |
| BM-070 | `assignment.deputyChiefAgencyName` | `Cơ quan của Phó Viện trưở` | unknown | deputyChiefAgencyName | manual | REVIEW | MEDIUM |
| BM-070 | `assignment.responsibilityLine` | `Nhiệm vụ được phân công` | unknown | responsibilityLine | manual | REVIEW | MEDIUM |
| BM-071 | `caseDecision.caseProsecutionDecisionLine` | `Căn cứ quyết định truy tố` | unknown | caseProsecutionDecisionLine | manual | REVIEW | MEDIUM |
| BM-071 | `assignment.assignedOfficerName` | `Họ tên Kiểm sát viên được` | unknown | assignedOfficerName | manual | REVIEW | MEDIUM |
| BM-071 | `assignment.assignedOfficerTitle` | `Chức vụ Kiểm sát viên` | unknown | assignedOfficerTitle | manual | REVIEW | MEDIUM |
| BM-071 | `assignment.assignedOfficerAgencyName` | `Đơn vị của Kiểm sát viên` | unknown | assignedOfficerAgencyName | manual | REVIEW | MEDIUM |
| BM-071 | `assignment.responsibilityLine` | `Nhiệm vụ được phân công` | unknown | responsibilityLine | manual | REVIEW | MEDIUM |
| BM-072 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-072 | `agency.diaDanh` | `Tên cơ quan` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-073 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-074 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-074 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-075 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-076 | `agency.coQuan` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| BM-076 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | HIGH |
| BM-076 | `document.dienThoai` | `Ô trống` | unknown | field4 | manual | REVIEW | MEDIUM |
| BM-077 | `agency.name` | `Tên cơ quan` | document | field1 | agencyConfig | FAIL | HIGH |
| ... | | | | | | | 239 more |

### REMEDIATION_LEAK (73)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-051 | `decision.decisionLine3` | `Slot from DOCX remediatio` | decision | decisionLine3 | manual | FAIL | HIGH |
| BM-052 | `decision.decisionLine2` | `Slot from DOCX remediatio` | decision | decisionLine2 | manual | FAIL | HIGH |
| BM-052 | `recipients.personLine6` | `Slot from DOCX remediatio` | recipients | personLine6 | manual | FAIL | HIGH |
| BM-060 | `decision.decisionLine10` | `Slot from DOCX remediatio` | decision | decisionLine10 | manual | FAIL | HIGH |
| BM-061 | `recipients.personLine3` | `Slot from DOCX remediatio` | recipients | personLine3 | manual | FAIL | HIGH |
| BM-062 | `decision.decisionLine11` | `Slot from DOCX remediatio` | decision | decisionLine11 | manual | FAIL | HIGH |
| BM-062 | `recipients.personLine5` | `Slot from DOCX remediatio` | recipients | personLine5 | manual | FAIL | HIGH |
| BM-063 | `document.fullDocumentCode8` | `Slot from DOCX remediatio` | document | fullDocumentCode8 | manual | FAIL | HIGH |
| BM-063 | `recipients.personLine5` | `Slot from DOCX remediatio` | recipients | personLine5 | manual | FAIL | HIGH |
| BM-064 | `document.issueDate4` | `Slot from DOCX remediatio` | document | issueDate4 | manual | FAIL | HIGH |
| BM-065 | `document.fullDocumentCode8` | `Slot from DOCX remediatio` | document | fullDocumentCode8 | manual | FAIL | HIGH |
| BM-065 | `recipients.personLine3` | `Slot from DOCX remediatio` | recipients | personLine3 | manual | FAIL | HIGH |
| BM-066 | `document.fullDocumentCode4` | `Slot from DOCX remediatio` | document | fullDocumentCode4 | manual | FAIL | HIGH |
| BM-066 | `recipients.personLine4` | `Slot from DOCX remediatio` | recipients | personLine4 | manual | FAIL | HIGH |
| BM-067 | `document.fullDocumentCode6` | `Slot from DOCX remediatio` | document | fullDocumentCode6 | manual | FAIL | HIGH |
| BM-067 | `recipients.personLine3` | `Slot from DOCX remediatio` | recipients | personLine3 | manual | FAIL | HIGH |
| BM-068 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-068 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | HIGH |
| BM-068 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-068 | `person.permanentAddress` | `Slot from Wave 02 DOCX re` | person | permanentAddress | manual | FAIL | HIGH |
| BM-068 | `person.permanentAddress2` | `Slot from Wave 02 DOCX re` | person | permanentAddress2 | manual | FAIL | HIGH |
| BM-068 | `person.occupation` | `Slot from Wave 02 DOCX re` | person | occupation | manual | FAIL | HIGH |
| BM-068 | `person.idNumber` | `Slot from Wave 02 DOCX re` | person | idNumber | manual | FAIL | HIGH |
| BM-068 | `person.permanentAddress3` | `Slot from Wave 02 DOCX re` | person | permanentAddress3 | manual | FAIL | HIGH |
| BM-068 | `person.occupation2` | `Slot from Wave 02 DOCX re` | person | occupation2 | manual | FAIL | HIGH |
| BM-068 | `person.idNumber2` | `Slot from Wave 02 DOCX re` | person | idNumber2 | manual | FAIL | HIGH |
| BM-068 | `person.temporaryAddress` | `Slot from Wave 02 DOCX re` | person | temporaryAddress | manual | FAIL | HIGH |
| BM-068 | `person.province` | `Slot from Wave 02 DOCX re` | person | province | manual | FAIL | HIGH |
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-069 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | HIGH |
| BM-069 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-069 | `person.idNumber` | `Slot from Wave 02 DOCX re` | document | field5 | manual | FAIL | HIGH |
| BM-069 | `document.reasonLine` | `Slot from Wave 02 DOCX re` | document | field6 | manual | FAIL | HIGH |
| BM-069 | `document.reasonLine2` | `Slot from Wave 02 DOCX re` | document | field7 | manual | FAIL | HIGH |
| BM-069 | `person.personFullName` | `Slot from Wave 02 DOCX re` | person | personFullName | manual | FAIL | HIGH |
| BM-069 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | person | currentAddress | manual | FAIL | HIGH |
| BM-069 | `person.currentAddress2` | `Slot from Wave 02 DOCX re` | person | currentAddress2 | manual | FAIL | HIGH |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX re` | document | field8 | manual | FAIL | HIGH |
| BM-069 | `person.occupation` | `Slot from Wave 02 DOCX re` | document | field10 | manual | FAIL | HIGH |
| BM-069 | `document.summaryLine` | `Slot from Wave 02 DOCX re` | document | field12 | manual | FAIL | HIGH |
| BM-073 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-073 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | HIGH |
| BM-073 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-073 | `person.idNumber` | `Slot from Wave 02 DOCX re` | document | field5 | manual | FAIL | HIGH |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-075 | `person.personFullName` | `Slot from Wave 02 DOCX re` | person | personFullName | manual | FAIL | HIGH |
| BM-075 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | person | dateOfBirth | manual | FAIL | HIGH |
| BM-075 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | person | currentAddress | manual | FAIL | HIGH |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-080 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-080 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | HIGH |
| BM-080 | `person.personFullName` | `Slot from Wave 02 DOCX re` | person | personFullName | manual | FAIL | HIGH |
| BM-080 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | person | dateOfBirth | manual | FAIL | HIGH |
| BM-080 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | person | currentAddress | manual | FAIL | HIGH |
| BM-080 | `legalBasis.legalBasisLine` | `Slot from Wave 02 DOCX re` | legalBasis | legalBasisLine | manual | FAIL | HIGH |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-162 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-162 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | HIGH |
| BM-162 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-162 | `person.personFullName` | `Slot from Wave 02 DOCX re` | person | personFullName | manual | FAIL | HIGH |
| BM-162 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | person | currentAddress | manual | FAIL | HIGH |
| BM-162 | `person.occupation` | `Slot from Wave 02 DOCX re` | person | occupation | manual | FAIL | HIGH |
| BM-162 | `person.idNumber` | `Slot from Wave 02 DOCX re` | person | idNumber | manual | FAIL | HIGH |
| BM-163 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-163 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | HIGH |
| BM-163 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-163 | `person.personFullName` | `Slot from Wave 02 DOCX re` | person | personFullName | manual | FAIL | HIGH |
| BM-163 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | person | currentAddress | manual | FAIL | HIGH |
| BM-163 | `person.occupation` | `Slot from Wave 02 DOCX re` | person | occupation | manual | FAIL | HIGH |
| BM-163 | `person.ward` | `Slot from Wave 02 DOCX re` | person | ward | manual | FAIL | HIGH |
| BM-163 | `person.province` | `Slot from Wave 02 DOCX re` | person | province | manual | FAIL | HIGH |
| BM-163 | `person.idNumber` | `Slot from Wave 02 DOCX re` | person | idNumber | manual | FAIL | HIGH |
| BM-163 | `case.caseNumber` | `Slot from Wave 02 DOCX re` | unknown | caseNumber | manual | FAIL | HIGH |

### WEAK_EVIDENCE_AUTO_LOCKED (422)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-031 | `agency.bodyName` | `Tên Viện kiểm sát trong t` | - | - | manual | FAIL | HIGH |
| BM-044 | `agency.parentNameUpper` | `Cơ quan cấp trên (viết ho` | - | - | computed | FAIL | HIGH |
| BM-056 | `person.religion` | `Tôn giáo` | - | - | manual | FAIL | HIGH |
| BM-059 | `recipients.personLine` | `Nơi nhận - Người bị tạm g` | - | - | manual | FAIL | HIGH |
| BM-139 | `recipients.localityName` | `Địa danh / Quận huyện của` | recipients | localityName | manual | FAIL | HIGH |
| BM-139 | `person.personFullName` | `Họ và tên người ký` | person | personFullName | manual | FAIL | HIGH |
| BM-139 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-164 | `recipients.personLine6` | `Người nhận (dòng 6)` | recipients | personLine6 | manual | FAIL | HIGH |
| BM-164 | `recipients.personLine5` | `Người nhận (dòng 5)` | recipients | personLine5 | manual | FAIL | HIGH |
| BM-164 | `recipients.personLine4` | `Người nhận (dòng 4)` | recipients | personLine4 | manual | FAIL | HIGH |
| BM-164 | `recipients.personLine3` | `Người nhận (dòng 3)` | recipients | personLine3 | manual | FAIL | HIGH |
| BM-164 | `recipients.personLine2` | `Người nhận (dòng 2)` | recipients | personLine2 | manual | FAIL | HIGH |
| BM-164 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-165 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-174 | `document.summaryLine` | `Tóm tắt / liệt kê (dòng)` | document | summaryLine | manual | FAIL | HIGH |
| BM-174 | `person.idNumber` | `Số CMND / CCCD` | person | idNumber | manual | FAIL | HIGH |
| BM-174 | `person.occupation` | `Nghề nghiệp` | person | occupation | manual | FAIL | HIGH |
| BM-174 | `person.currentAddress` | `Địa chỉ thường trú` | person | currentAddress | manual | FAIL | HIGH |
| BM-174 | `person.dateOfBirth` | `Ngày sinh` | person | dateOfBirth | manual | FAIL | HIGH |
| BM-174 | `person.personFullName` | `Họ và tên` | person | personFullName | manual | FAIL | HIGH |
| BM-174 | `document.contentLine` | `Nội dung (dòng)` | document | contentLine | manual | FAIL | HIGH |
| BM-174 | `document.issuePlace` | `Nơi ban hành` | document | issuePlace | manual | FAIL | HIGH |
| BM-174 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-174 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-175 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-175 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-176 | `document.summaryLine` | `Tóm tắt / liệt kê (dòng)` | document | summaryLine | manual | FAIL | HIGH |
| BM-176 | `document.reasonLine` | `Căn cứ / lý do (dòng)` | document | reasonLine | manual | FAIL | HIGH |
| BM-176 | `document.contentLine` | `Nội dung (dòng)` | document | contentLine | manual | FAIL | HIGH |
| BM-176 | `decision.decisionLine` | `Cơ quan ra quyết định (dò` | decision | decisionLine | manual | FAIL | HIGH |
| BM-176 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-176 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-177 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-178 | `document.issuePlace` | `Nơi ban hành` | document | issuePlace | manual | FAIL | HIGH |
| BM-178 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-178 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-179 | `document.summaryLine` | `Tóm tắt / liệt kê (dòng)` | document | summaryLine | manual | FAIL | HIGH |
| BM-179 | `person.dateOfBirth` | `Ngày sinh` | person | dateOfBirth | manual | FAIL | HIGH |
| BM-179 | `person.personFullName` | `Họ và tên` | person | personFullName | manual | FAIL | HIGH |
| BM-179 | `document.reasonLine` | `Căn cứ / lý do (dòng)` | document | reasonLine | manual | FAIL | HIGH |
| BM-179 | `document.contentLine` | `Nội dung (dòng)` | document | contentLine | manual | FAIL | HIGH |
| BM-179 | `document.issuePlace` | `Nơi ban hành` | document | issuePlace | manual | FAIL | HIGH |
| BM-179 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-179 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-180 | `document.summaryLine` | `Tóm tắt / liệt kê (dòng)` | document | summaryLine | manual | FAIL | HIGH |
| BM-180 | `person.personFullName` | `Họ và tên` | person | personFullName | manual | FAIL | HIGH |
| BM-180 | `document.contentLine` | `Nội dung (dòng)` | document | contentLine | manual | FAIL | HIGH |
| BM-180 | `document.reasonLine2` | `Căn cứ / lý do (dòng 2)` | document | reasonLine2 | manual | FAIL | HIGH |
| BM-180 | `document.reasonLine` | `Căn cứ / lý do (dòng)` | document | reasonLine | manual | FAIL | HIGH |
| BM-180 | `document.issuePlace` | `Nơi ban hành` | document | issuePlace | manual | FAIL | HIGH |
| BM-180 | `agency.agencyReferenceLine` | `Cơ quan (dòng tham chiếu)` | agency | field3 | agencyConfig | FAIL | HIGH |
| BM-180 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-180 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-181 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-181 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-182 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-182 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-183 | `person.dateOfBirth` | `Ngày sinh` | person | dateOfBirth | manual | FAIL | HIGH |
| BM-183 | `person.personFullName` | `Họ và tên` | person | personFullName | manual | FAIL | HIGH |
| BM-183 | `legalBasis.statuteReference` | `Điều luật tham chiếu` | legalBasis | field6 | manual | FAIL | HIGH |
| BM-183 | `document.contentLine` | `Nội dung (dòng)` | document | contentLine | manual | FAIL | HIGH |
| BM-183 | `legalBasis.legalBasisLine2` | `Căn cứ pháp luật (dòng 2)` | legalBasis | legalBasisLine2 | manual | FAIL | HIGH |
| BM-183 | `legalBasis.legalBasisLine` | `Căn cứ pháp luật (dòng)` | legalBasis | legalBasisLine | manual | FAIL | HIGH |
| BM-183 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-183 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-184 | `decision.decisionLine4` | `Cơ quan ra quyết định (dò` | decision | decisionLine4 | manual | FAIL | HIGH |
| BM-184 | `document.summaryLine` | `Tóm tắt / liệt kê (dòng)` | document | summaryLine | manual | FAIL | HIGH |
| BM-184 | `person.occupation` | `Nghề nghiệp` | person | occupation | manual | FAIL | HIGH |
| BM-184 | `decision.decisionLine3` | `Cơ quan ra quyết định (dò` | decision | decisionLine3 | manual | FAIL | HIGH |
| BM-184 | `decision.decisionLine2` | `Cơ quan ra quyết định (dò` | decision | decisionLine2 | manual | FAIL | HIGH |
| BM-184 | `person.currentAddress` | `Địa chỉ thường trú` | person | currentAddress | manual | FAIL | HIGH |
| BM-184 | `person.dateOfBirth` | `Ngày sinh` | person | dateOfBirth | manual | FAIL | HIGH |
| BM-184 | `person.personFullName` | `Họ và tên` | person | personFullName | manual | FAIL | HIGH |
| BM-184 | `document.issuePlace` | `Nơi ban hành` | document | issuePlace | manual | FAIL | HIGH |
| BM-184 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-184 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-185 | `person.currentAddress` | `Địa chỉ thường trú` | person | currentAddress | manual | FAIL | HIGH |
| BM-185 | `person.dateOfBirth` | `Ngày sinh` | person | dateOfBirth | manual | FAIL | HIGH |
| BM-185 | `person.personFullName` | `Họ và tên` | person | personFullName | manual | FAIL | HIGH |
| BM-185 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-185 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine15` | `Người nhận (dòng 15)` | recipients | personLine15 | manual | FAIL | HIGH |
| BM-186 | `document.reasonLine` | `Căn cứ / lý do (dòng)` | document | reasonLine | manual | FAIL | HIGH |
| BM-186 | `document.issuePlace` | `Nơi ban hành` | document | issuePlace | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine14` | `Người nhận (dòng 14)` | recipients | personLine14 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine13` | `Người nhận (dòng 13)` | recipients | personLine13 | manual | FAIL | HIGH |
| BM-186 | `document.issueDate` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine12` | `Người nhận (dòng 12)` | recipients | personLine12 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine11` | `Người nhận (dòng 11)` | recipients | personLine11 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine10` | `Người nhận (dòng 10)` | recipients | personLine10 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine9` | `Người nhận (dòng 9)` | recipients | personLine9 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine8` | `Người nhận (dòng 8)` | recipients | personLine8 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine7` | `Người nhận (dòng 7)` | recipients | personLine7 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine6` | `Người nhận (dòng 6)` | recipients | personLine6 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine5` | `Người nhận (dòng 5)` | recipients | personLine5 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine4` | `Người nhận (dòng 4)` | recipients | personLine4 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine3` | `Người nhận (dòng 3)` | recipients | personLine3 | manual | FAIL | HIGH |
| BM-186 | `recipients.personLine2` | `Người nhận (dòng 2)` | recipients | personLine2 | manual | FAIL | HIGH |
| BM-186 | `document.fullDocumentCode` | `Số văn bản / quyết định` | document | fullDocumentCode | manual | FAIL | HIGH |
| BM-187 | `recipients.personLine13` | `Người nhận (dòng 13)` | recipients | personLine13 | manual | FAIL | HIGH |
| ... | | | | | | | 322 more |

### GENERIC_FIELD_CANONICALIZATION (388)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-004 | `document.vietTat` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-004 | `agency.diaDanh` | `Ô trống` | document | field9 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `agency.tenCo` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `document.vietTat` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-013 | `agency.diaDanh` | `Ô trống` | document | field5 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `document.ngayBan` | `Ô trống` | unknown | field6 | manual | FAIL | MEDIUM |
| BM-013 | `document.soVan` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-021 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-021 | `document.documentCode` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-021 | `decision.summaryLine` | `Ô trống` | document | field9 | computed | FAIL | MEDIUM |
| BM-021 | `decision.decisionLine` | `Ô trống` | document | field10 | manual | FAIL | MEDIUM |
| BM-022 | `person.fullName` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-024 | `document.issuePlaceAndDateLine` | `Ô trống` | document | field6 | systemDate | FAIL | MEDIUM |
| BM-025 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-026 | `document.issueDate` | `Ô trống` | document | field5 | systemDate | FAIL | MEDIUM |
| BM-027 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-027 | `agency.diaDanh` | `Ô trống` | unknown | field3 | agencyConfig | FAIL | MEDIUM |
| BM-027 | `document.soThong` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-027 | `document.ngayBan` | `Ô trống` | unknown | field5 | manual | FAIL | MEDIUM |
| BM-028 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-028 | `agency.diaDanh` | `Ô trống` | unknown | field3 | agencyConfig | FAIL | MEDIUM |
| BM-028 | `document.soQuyet` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-028 | `document.ngayBan` | `Ô trống` | unknown | field5 | manual | FAIL | MEDIUM |
| BM-028 | `legalBasis.canCu` | `Ô trống` | unknown | field6 | manual | FAIL | MEDIUM |
| BM-028 | `document.soQd` | `Ô trống` | unknown | field7 | manual | FAIL | MEDIUM |
| BM-028 | `document.ngayQd` | `Ô trống` | unknown | field8 | manual | FAIL | MEDIUM |
| BM-029 | `agency.tenCo` | `Ô trống` | unknown | field3 | agencyConfig | FAIL | MEDIUM |
| BM-029 | `document.vietTat` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-032 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-032 | `document.documentCode` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-034 | `document.issueDate` | `Ô trống` | document | field5 | systemDate | FAIL | MEDIUM |
| BM-035 | `document.issueDate` | `Ô trống` | document | field5 | systemDate | FAIL | MEDIUM |
| BM-036 | `document.issueDate` | `Ô trống` | document | field5 | computed | FAIL | MEDIUM |
| BM-036 | `legalBasis.procedureArticlesLine` | `Ô trống` | document | field8 | officialConfig | FAIL | MEDIUM |
| BM-036 | `recipients.personLine` | `Ô trống` | document | field12 | manual | FAIL | MEDIUM |
| BM-036 | `recipients.archiveLine` | `Ô trống` | document | field13 | manual | FAIL | MEDIUM |
| BM-041 | `document.documentCode` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-048 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-048 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-048 | `document.soQuyet` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-048 | `document.ngayBan` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-048 | `legalBasis.canCu` | `Ô trống` | person | field7 | manual | FAIL | MEDIUM |
| BM-048 | `document.canCu` | `Ô trống` | document | field8 | manual | FAIL | MEDIUM |
| BM-049 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-050 | `agency.coQuan` | `Ô trống` | decision | field2 | agencyConfig | FAIL | MEDIUM |
| BM-050 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-051 | `document.fullDocumentCode` | `Ô trống` | document | field2 | manual | FAIL | MEDIUM |
| BM-052 | `document.fullDocumentCode` | `Ô trống` | decision | field2 | manual | FAIL | MEDIUM |
| BM-052 | `document.fullDocumentCode2` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-060 | `document.fullDocumentCode` | `Ô trống` | document | field2 | manual | FAIL | MEDIUM |
| BM-061 | `document.fullDocumentCode` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-062 | `decision.decisionLine` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-062 | `document.fullDocumentCode` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-063 | `document.issuePlaceAndDateLine` | `Ô trống` | document | field2 | computed | FAIL | MEDIUM |
| BM-063 | `document.fullDocumentCode` | `Ô trống` | document | field10 | manual | FAIL | MEDIUM |
| BM-064 | `document.fullDocumentCode` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-065 | `decision.decisionLine` | `Ô trống` | document | field2 | computed | FAIL | MEDIUM |
| BM-065 | `document.fullDocumentCode` | `Ô trống` | document | field9 | manual | FAIL | MEDIUM |
| BM-066 | `decision.decisionLine` | `Ô trống` | document | field2 | computed | FAIL | MEDIUM |
| BM-066 | `document.fullDocumentCode` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-067 | `document.fullDocumentCode` | `Ô trống` | document | field2 | manual | FAIL | MEDIUM |
| BM-067 | `document.fullDocumentCode2` | `Ô trống` | document | field9 | manual | FAIL | MEDIUM |
| BM-068 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-068 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | MEDIUM |
| BM-068 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | MEDIUM |
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-069 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | MEDIUM |
| BM-069 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | MEDIUM |
| BM-069 | `person.idNumber` | `Slot from Wave 02 DOCX re` | document | field5 | manual | FAIL | MEDIUM |
| BM-069 | `document.reasonLine` | `Slot from Wave 02 DOCX re` | document | field6 | manual | FAIL | MEDIUM |
| BM-069 | `document.reasonLine2` | `Slot from Wave 02 DOCX re` | document | field7 | manual | FAIL | MEDIUM |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX re` | document | field8 | manual | FAIL | MEDIUM |
| BM-069 | `person.occupation` | `Slot from Wave 02 DOCX re` | document | field10 | manual | FAIL | MEDIUM |
| BM-069 | `document.summaryLine` | `Slot from Wave 02 DOCX re` | document | field12 | manual | FAIL | MEDIUM |
| BM-072 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-072 | `document.soQuyet` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-073 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-073 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | MEDIUM |
| BM-073 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | MEDIUM |
| BM-073 | `person.idNumber` | `Slot from Wave 02 DOCX re` | document | field5 | manual | FAIL | MEDIUM |
| BM-074 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-074 | `document.dienThoai` | `Ô trống` | agency | field4 | manual | FAIL | MEDIUM |
| BM-074 | `document.soYeu` | `Ô trống` | agency | field5 | manual | FAIL | MEDIUM |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-076 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-076 | `document.dienThoai` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-076 | `document.soQuyet` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-076 | `document.ngayBan` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-078 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-078 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-078 | `document.soThong` | `Ô trống` | agency | field5 | manual | FAIL | MEDIUM |
| BM-080 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-080 | `document.issueDate` | `Slot from Wave 02 DOCX re` | document | field2 | manual | FAIL | MEDIUM |
| BM-081 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-081 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-083 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-083 | `document.dienThoai` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-083 | `document.soYeu` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| ... | | | | | | | 288 more |

### SHOULD_BE_READONLY (461)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-001 | `document.issuePlaceDateLine` | `issuePlaceDateLine` | - | - | systemDate | REVIEW | MEDIUM |
| BM-002 | `agency.parentName` | `parentName` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `agency.name` | `name` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `document.documentCode` | `documentCode` | - | - | manual | REVIEW | MEDIUM |
| BM-002 | `document.documentCode` | `documentCode` | document | documentCode | manual | REVIEW | HIGH |
| BM-003 | `agency.parentName` | `parentName` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-003 | `agency.name` | `name` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-003 | `document.documentCode` | `documentCode` | - | - | manual | REVIEW | MEDIUM |
| BM-003 | `document.documentCode` | `documentCode` | document | documentCode | manual | REVIEW | HIGH |
| BM-003 | `legalBasis.procedureArticlesLine` | `procedureArticlesLine` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-005 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-005 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-005 | `document.documentCode` | `Số yêu cầu` | - | - | manual | REVIEW | MEDIUM |
| BM-005 | `document.documentCode` | `Số yêu cầu` | document | documentCode | manual | REVIEW | HIGH |
| BM-006 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-006 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-006 | `document.documentCode` | `Số yêu cầu` | - | - | manual | REVIEW | MEDIUM |
| BM-006 | `document.documentCode` | `Số yêu cầu` | document | documentCode | manual | REVIEW | HIGH |
| BM-007 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-007 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-007 | `document.documentCode` | `Số yêu cầu` | - | - | manual | REVIEW | MEDIUM |
| BM-007 | `document.documentCode` | `Số yêu cầu` | document | documentCode | manual | REVIEW | HIGH |
| BM-007 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-008 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-008 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-008 | `document.documentCode` | `Số yêu cầu` | - | - | manual | REVIEW | MEDIUM |
| BM-008 | `document.documentCode` | `Số yêu cầu` | document | documentCode | manual | REVIEW | HIGH |
| BM-009 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-009 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-009 | `document.documentCode` | `Số quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-009 | `document.documentCode` | `Số quyết định` | document | documentCode | manual | REVIEW | HIGH |
| BM-010 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-010 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-010 | `document.documentCode` | `Số quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-010 | `document.documentCode` | `Số quyết định` | document | documentCode | manual | REVIEW | HIGH |
| BM-011 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-011 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-011 | `document.documentCode` | `Số quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-011 | `document.documentCode` | `Số quyết định` | document | documentCode | manual | REVIEW | HIGH |
| BM-011 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-012 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-012 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-012 | `document.documentCode` | `Số quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-012 | `document.documentCode` | `Số quyết định` | document | documentCode | manual | REVIEW | HIGH |
| BM-014 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-014 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-014 | `document.documentCode` | `Số quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-014 | `document.documentCode` | `Số quyết định` | document | documentCode | manual | REVIEW | HIGH |
| BM-014 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-015 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-015 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-015 | `document.documentCode` | `Số kế hoạch` | - | - | manual | REVIEW | MEDIUM |
| BM-015 | `document.documentCode` | `Số kế hoạch` | document | documentCode | manual | REVIEW | HIGH |
| BM-016 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-016 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-016 | `document.documentCode` | `Số kết luận` | - | - | manual | REVIEW | MEDIUM |
| BM-016 | `document.documentCode` | `Số kết luận` | document | documentCode | manual | REVIEW | HIGH |
| BM-016 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-017 | `agency.parentName` | `Viện kiểm sát cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-017 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-017 | `document.documentCode` | `Số yêu cầu` | - | - | manual | REVIEW | MEDIUM |
| BM-017 | `document.documentCode` | `Số yêu cầu` | document | documentCode | manual | REVIEW | HIGH |
| BM-018 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-018 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-018 | `document.documentCode` | `Số yêu cầu` | - | - | manual | REVIEW | MEDIUM |
| BM-018 | `document.documentCode` | `Số yêu cầu` | document | documentCode | manual | REVIEW | HIGH |
| BM-018 | `legalBasis.procedureArticlesLine` | `Căn cứ pháp lý` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-019 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-019 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-019 | `document.documentCode` | `Số yêu cầu` | - | - | manual | REVIEW | MEDIUM |
| BM-019 | `document.documentCode` | `Số yêu cầu` | document | documentCode | manual | REVIEW | HIGH |
| BM-020 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-020 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-020 | `document.documentCode` | `Số yêu cầu` | - | - | manual | REVIEW | MEDIUM |
| BM-020 | `document.documentCode` | `Số yêu cầu` | document | documentCode | manual | REVIEW | HIGH |
| BM-021 | `agency.parentNameUpper` | `Tên cơ quan` | - | - | computed | REVIEW | MEDIUM |
| BM-021 | `agency.nameUpper` | `Ngày ban hành` | - | - | computed | REVIEW | MEDIUM |
| BM-021 | `document.documentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-021 | `legalBasis.procedureArticlesLine` | `Viện kiểm sát ban hành` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-022 | `agency.parentNameUpper` | `Tên cơ quan` | - | - | computed | REVIEW | MEDIUM |
| BM-022 | `agency.nameUpper` | `Ngày ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-023 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-023 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-023 | `document.documentCode` | `Số quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-023 | `document.documentCode` | `Số quyết định` | document | documentCode | manual | REVIEW | HIGH |
| BM-023 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-024 | `agency.parentNameUpper` | `Tên cơ quan` | - | - | computed | REVIEW | MEDIUM |
| BM-025 | `agency.parentNameUpper` | `Tên cơ quan` | - | - | computed | REVIEW | MEDIUM |
| BM-025 | `agency.nameUpper` | `Ngày ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-026 | `agency.parentNameUpper` | `Tên cơ quan` | - | - | computed | REVIEW | MEDIUM |
| BM-026 | `agency.nameUpper` | `Ngày ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-026 | `document.documentCode` | `Số quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-026 | `document.documentCode` | `Số quyết định` | document | documentCode | manual | REVIEW | HIGH |
| BM-030 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-030 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-030 | `document.documentCode` | `Số thông báo` | - | - | manual | REVIEW | MEDIUM |
| BM-030 | `document.documentCode` | `Số thông báo` | document | documentCode | manual | REVIEW | HIGH |
| BM-030 | `legalBasis.procedureArticlesLine` | `Căn cứ pháp lý` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-031 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-031 | `agency.name` | `Viện kiểm sát tại header` | - | - | agencyConfig | REVIEW | MEDIUM |
| ... | | | | | | | 361 more |

### REQUIRED_SUSPICIOUS (114)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-022 | `person.fullName` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-024 | `document.issueDate` | `Số quyết định` | - | - | systemDate | REVIEW | MEDIUM |
| BM-026 | `document.issueDate` | `Ô trống` | - | - | systemDate | REVIEW | MEDIUM |
| BM-034 | `document.issueDate` | `Ô trống` | - | - | systemDate | REVIEW | MEDIUM |
| BM-035 | `document.issueDate` | `Ô trống` | - | - | systemDate | REVIEW | MEDIUM |
| BM-036 | `document.issueDate` | `Ô trống` | - | - | computed | REVIEW | MEDIUM |
| BM-036 | `person.fullName` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-051 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-052 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-060 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-061 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-062 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-063 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-064 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-065 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-066 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-067 | `document.fullDocumentCode` | `Ô trống` | - | - | manual | REVIEW | MEDIUM |
| BM-068 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-068 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-068 | `person.occupation` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-068 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-069 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-069 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-069 | `person.occupation` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-073 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-073 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-073 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-080 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-080 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-139 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-162 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-162 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-162 | `person.occupation` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-162 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-163 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-163 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-163 | `person.occupation` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-163 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-164 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-165 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-174 | `person.idNumber` | `Số CMND / CCCD` | - | - | manual | REVIEW | MEDIUM |
| BM-174 | `person.occupation` | `Nghề nghiệp` | - | - | manual | REVIEW | MEDIUM |
| BM-174 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-174 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-175 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-175 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-176 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-176 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-177 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-178 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-178 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-179 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-179 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-180 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-180 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-181 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-181 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-182 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-182 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-183 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-183 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-184 | `person.occupation` | `Nghề nghiệp` | - | - | manual | REVIEW | MEDIUM |
| BM-184 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-184 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-185 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-185 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-186 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-186 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-187 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-187 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-188 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-188 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-189 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-190 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-190 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-191 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-191 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-192 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-192 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-193 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-193 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-194 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-194 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-195 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-195 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-196 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-196 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-197 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-197 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-198 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-198 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-199 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-199 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-200 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-201 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-201 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| ... | | | | | | | 14 more |

### COMPILED_DRIFT (765)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-001 | `document.issuePlaceDateLine` | `issuePlaceDateLine` | - | - | systemDate | REVIEW | MEDIUM |
| BM-001 | `receiver.positionTitle` | `positionTitle` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-001 | `informant.signerName` | `signerName` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-001 | `receiver.signerName` | `signerName` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-002 | `agency.parentName` | `parentName` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `agency.name` | `name` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `document.issuePlaceAndDateLine` | `issuePlaceAndDateLine` | - | - | systemDate | REVIEW | MEDIUM |
| BM-002 | `sourceReport.receivedDateLine` | `receivedDateLine` | - | - | systemDate | REVIEW | MEDIUM |
| BM-002 | `agency.bodyName` | `bodyName` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `reporter.birthDateLine` | `birthDateLine` | - | - | systemDate | REVIEW | MEDIUM |
| BM-002 | `reporter.identityIssueDateLine` | `identityIssueDateLine` | - | - | systemDate | REVIEW | MEDIUM |
| BM-002 | `signature.positionTitle` | `positionTitle` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-002 | `signature.signerName` | `signerName` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-003 | `agency.parentName` | `parentName` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-003 | `agency.name` | `name` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-003 | `document.issuePlaceAndDateLine` | `issuePlaceAndDateLine` | - | - | systemDate | REVIEW | MEDIUM |
| BM-003 | `legalBasis.procedureArticlesLine` | `procedureArticlesLine` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-003 | `signature.signMode` | `signMode` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-003 | `signature.positionTitle` | `positionTitle` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-003 | `signature.signerName` | `signerName` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-004 | `agency.vienKiem` | `Tên cơ quan` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-004 | `agency.tenCo` | `Tên cơ quan` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-004 | `signature.positionTitle` | `Chức danh` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-004 | `agency.diaDanh` | `Ô trống` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-005 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-005 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-005 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-005 | `sourceVerification.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-005 | `signature.signerName` | `Kiểm sát viên ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-006 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-006 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-006 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-006 | `agency.bodyName` | `Tên Viện kiểm sát trong t` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-006 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-006 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-006 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-007 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-007 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-007 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-007 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-007 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-007 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-008 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-008 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-008 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-008 | `agency.bodyName` | `Tên Viện kiểm sát trong t` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-008 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-008 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-008 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-009 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-009 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-009 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-009 | `sourceResolutionExtension.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-009 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-009 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-009 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-010 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-010 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-010 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-010 | `agency.bodyName` | `Tên Viện kiểm sát trong t` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-010 | `sourceSuspension.receivedDateLine` | `Ngày tiếp nhận nguồn tin` | - | - | systemDate | REVIEW | MEDIUM |
| BM-010 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-010 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-010 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-011 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-011 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-011 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-011 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-011 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-011 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-011 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-012 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-012 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-012 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-012 | `sourceRecovery.suspensionDecisionIssueDateLine` | `Ngày quyết định tạm đình ` | - | - | systemDate | REVIEW | MEDIUM |
| BM-012 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-012 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-012 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-013 | `agency.vienKiem` | `Tên cơ quan` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-013 | `agency.tenCo` | `Ô trống` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-013 | `agency.diaDanh` | `Ô trống` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-014 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-014 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-014 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-014 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-014 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-014 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-014 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-015 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-015 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-015 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-015 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-015 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-015 | `signature.signerName` | `Người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-016 | `agency.parentName` | `Cơ quan cấp trên` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-016 | `agency.name` | `Viện kiểm sát ban hành` | - | - | agencyConfig | REVIEW | MEDIUM |
| BM-016 | `document.issuePlaceAndDateLine` | `Địa danh, ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-016 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-016 | `signature.signMode` | `Chế độ ký` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-016 | `signature.positionTitle` | `Chức danh người ký` | - | - | officialConfig | REVIEW | MEDIUM |
| ... | | | | | | | 665 more |

### UI_VISIBLE_BAD_METADATA (96)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-001 | `informant.occupation` | `occupation` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.identityNo` | `identityNo` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.identityIssuedDay` | `identityIssuedDay` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.identityIssuedMonth` | `identityIssuedMonth` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.identityIssuedYear` | `identityIssuedYear` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.identityIssuedPlace` | `identityIssuedPlace` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.permanentAddress` | `permanentAddress` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.temporaryAddress` | `temporaryAddress` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.currentAddress` | `currentAddress` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.phone` | `phone` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `informant.representedOrganization` | `representedOrganization` | - | - | manual | FAIL | MEDIUM |
| BM-001 | `recipients.archiveLine` | `archiveLine` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `agency.bodyName` | `bodyName` | - | - | agencyConfig | FAIL | MEDIUM |
| BM-002 | `document.documentCode` | `documentCode` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `document.issuePlaceAndDateLine` | `issuePlaceAndDateLine` | - | - | systemDate | FAIL | MEDIUM |
| BM-002 | `sourceReport.receivedDateLine` | `receivedDateLine` | - | - | systemDate | FAIL | MEDIUM |
| BM-002 | `sourceReport.content` | `content` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.genderText` | `genderText` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.birthDateLine` | `birthDateLine` | - | - | systemDate | FAIL | MEDIUM |
| BM-002 | `reporter.birthPlace` | `birthPlace` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.occupation` | `occupation` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.identityNumber` | `identityNumber` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.identityIssueDateLine` | `identityIssueDateLine` | - | - | systemDate | FAIL | MEDIUM |
| BM-002 | `reporter.identityIssuePlace` | `identityIssuePlace` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.permanentResidence` | `permanentResidence` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.temporaryResidence` | `temporaryResidence` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.currentResidence` | `currentResidence` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.phoneNumber` | `phoneNumber` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `reporter.organizationRepresentative` | `organizationRepresentativ` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `recipients.primaryLine` | `primaryLine` | - | - | manual | FAIL | MEDIUM |
| BM-002 | `recipients.archiveLine` | `archiveLine` | - | - | manual | FAIL | MEDIUM |
| BM-003 | `document.documentCode` | `documentCode` | - | - | manual | FAIL | MEDIUM |
| BM-003 | `document.issuePlaceAndDateLine` | `issuePlaceAndDateLine` | - | - | systemDate | FAIL | MEDIUM |
| BM-003 | `legalBasis.procedureArticlesLine` | `procedureArticlesLine` | - | - | officialConfig | FAIL | MEDIUM |
| BM-003 | `recipients.primaryLine` | `primaryLine` | - | - | manual | FAIL | MEDIUM |
| BM-003 | `recipients.archiveLine` | `archiveLine` | - | - | manual | FAIL | MEDIUM |
| BM-003 | `signature.signMode` | `signMode` | - | - | officialConfig | FAIL | MEDIUM |
| BM-068 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.permanentAddress` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.permanentAddress2` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.occupation` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.permanentAddress3` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.occupation2` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.idNumber2` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.temporaryAddress` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-068 | `person.province` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `document.reasonLine` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `document.reasonLine2` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `document.summaryLine` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `person.personFullName` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `person.currentAddress2` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `person.occupation` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-073 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-073 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-073 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-073 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-075 | `person.personFullName` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-075 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-075 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-080 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-080 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-080 | `person.personFullName` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-080 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-080 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-080 | `legalBasis.legalBasisLine` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-155 | `document.dieu1` | `Dieu1` | - | - | manual | FAIL | MEDIUM |
| BM-155 | `document.dieu2` | `Dieu2` | - | - | manual | FAIL | MEDIUM |
| BM-162 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-162 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-162 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-162 | `person.personFullName` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-162 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-162 | `person.occupation` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-162 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `document.issueDate` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `person.personFullName` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `person.currentAddress` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `person.occupation` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `person.ward` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `person.province` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `person.idNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `case.caseNumber` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |

## Proposed Fix Plan

- **HIGH confidence auto-fix candidates**: 621
- **MEDIUM confidence / requires review (FAIL)**: 1265
- **REVIEW only (not auto-fix)**: 1594

### Auto-fix Candidates (HIGH confidence, no human review needed)

| templateCode | path | suggestedPath | suggestedLabel | reason |
|--------------|------|---------------|---------------|--------|
| BM-004 | `agency.vienKiem` | `document.field1` | - | rawPattern domain "document" ({{document.field1}}) does not match canonical path |
| BM-004 | `agency.vienKiem` | - | - | source="agencyConfig" but rawPattern "{{document.field1}}" is from "document" do |
| BM-004 | `agency.tenCo` | `document.field3` | - | rawPattern domain "document" ({{document.field3}}) does not match canonical path |
| BM-004 | `agency.tenCo` | - | - | source="agencyConfig" but rawPattern "{{document.field3}}" is from "document" do |
| BM-004 | `agency.diaDanh` | `document.field9` | `Địa điểm, ngày lập văn bản` | rawPattern domain "document" ({{document.field9}}) does not match canonical path |
| BM-004 | `agency.diaDanh` | `document.issuePlaceDateLine` | `Địa điểm, ngày lập văn bản` | source="agencyConfig" but rawPattern "{{document.field9}}" is from "document" do |
| BM-013 | `agency.vienKiem` | `document.field1` | - | rawPattern domain "document" ({{document.field1}}) does not match canonical path |
| BM-013 | `agency.vienKiem` | - | - | source="agencyConfig" but rawPattern "{{document.field1}}" is from "document" do |
| BM-013 | `agency.tenCo` | `document.field3` | - | rawPattern domain "document" ({{document.field3}}) does not match canonical path |
| BM-013 | `agency.tenCo` | - | - | source="agencyConfig" but rawPattern "{{document.field3}}" is from "document" do |
| BM-013 | `agency.diaDanh` | `document.field5` | `Địa điểm, ngày lập văn bản` | rawPattern domain "document" ({{document.field5}}) does not match canonical path |
| BM-013 | `agency.diaDanh` | `document.issuePlaceDateLine` | `Địa điểm, ngày lập văn bản` | source="agencyConfig" but rawPattern "{{document.field5}}" is from "document" do |
| BM-021 | `agency.parentNameUpper` | `document.field1` | - | rawPattern domain "document" ({{document.field1}}) does not match canonical path |
| BM-021 | `agency.nameUpper` | `document.issueDate` | - | rawPattern domain "document" ({{document.issueDate}}) does not match canonical p |
| BM-021 | `agency.issuePlace` | `document.field3` | - | rawPattern domain "document" ({{document.field3}}) does not match canonical path |
| BM-021 | `document.issuePlaceAndDateLine` | `legalBasis.procedureArticlesLine` | - | rawPattern domain "legalBasis" ({{legalBasis.procedureArticlesLine}}) does not m |
| BM-021 | `legalBasis.procedureArticlesLine` | `agency.nameUpper` | - | rawPattern domain "agency" ({{agency.nameUpper}}) does not match canonical path  |
| BM-021 | `decision.summaryLine` | `document.field9` | - | rawPattern domain "document" ({{document.field9}}) does not match canonical path |
| BM-021 | `decision.decisionLine` | `document.field10` | - | rawPattern domain "document" ({{document.field10}}) does not match canonical pat |
| BM-022 | `agency.parentNameUpper` | `document.field1` | - | rawPattern domain "document" ({{document.field1}}) does not match canonical path |
| BM-022 | `agency.nameUpper` | `document.issueDate` | - | rawPattern domain "document" ({{document.issueDate}}) does not match canonical p |
| BM-022 | `agency.nameUpper` | - | - | source="agencyConfig" but rawPattern "{{document.issueDate}}" is from "document" |
| BM-022 | `person.fullName` | `document.field7` | - | rawPattern domain "document" ({{document.field7}}) does not match canonical path |
| BM-024 | `agency.parentNameUpper` | `document.field1` | - | rawPattern domain "document" ({{document.field1}}) does not match canonical path |
| BM-025 | `agency.parentNameUpper` | `document.field1` | - | rawPattern domain "document" ({{document.field1}}) does not match canonical path |
| BM-025 | `agency.nameUpper` | `document.issueDate` | - | rawPattern domain "document" ({{document.issueDate}}) does not match canonical p |
| BM-025 | `agency.nameUpper` | - | - | source="agencyConfig" but rawPattern "{{document.issueDate}}" is from "document" |
| BM-025 | `agency.issuePlace` | `document.field3` | - | rawPattern domain "document" ({{document.field3}}) does not match canonical path |
| BM-026 | `agency.parentNameUpper` | `document.field1` | - | rawPattern domain "document" ({{document.field1}}) does not match canonical path |
| BM-026 | `agency.nameUpper` | `document.issueDate` | - | rawPattern domain "document" ({{document.issueDate}}) does not match canonical p |
| ... | | | | 591 more |

### Manual Review Required

| templateCode | path | issueCode | reason |
|--------------|------|----------|--------|
| BM-001 | `document.issuePlaceDateLine` | BAD_LABEL | Canonical field label is "issuePlaceDateLine" (raw camelCase no Vietnamese). Thi |
| BM-001 | `document.issuePlaceDateLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed/generated administra |
| BM-001 | `receiver.fullName` | BAD_LABEL | Canonical field label is "fullName" (raw camelCase no Vietnamese). This will app |
| BM-001 | `receiver.positionTitle` | BAD_LABEL | Canonical field label is "positionTitle" (raw camelCase no Vietnamese). This wil |
| BM-001 | `receiver.departmentName` | BAD_LABEL | Canonical field label is "departmentName" (raw camelCase no Vietnamese). This wi |
| BM-001 | `informant.fullName` | BAD_LABEL | Canonical field label is "fullName" (raw camelCase no Vietnamese). This will app |
| BM-001 | `informant.genderLabel` | BAD_LABEL | Canonical field label is "genderLabel" (raw camelCase no Vietnamese). This will  |
| BM-001 | `informant.otherName` | BAD_LABEL | Canonical field label is "otherName" (raw camelCase no Vietnamese). This will ap |
| BM-001 | `informant.birthDay` | BAD_LABEL | Canonical field label is "birthDay" (raw camelCase no Vietnamese). This will app |
| BM-001 | `informant.birthMonth` | BAD_LABEL | Canonical field label is "birthMonth" (raw camelCase no Vietnamese). This will a |
| BM-001 | `informant.birthYear` | BAD_LABEL | Canonical field label is "birthYear" (raw camelCase no Vietnamese). This will ap |
| BM-001 | `informant.placeOfBirth` | BAD_LABEL | Canonical field label is "placeOfBirth" (raw camelCase no Vietnamese). This will |
| BM-001 | `informant.nationality` | BAD_LABEL | Canonical field label is "nationality" (raw camelCase no Vietnamese). This will  |
| BM-001 | `informant.ethnicity` | BAD_LABEL | Canonical field label is "ethnicity" (raw camelCase no Vietnamese). This will ap |
| BM-001 | `informant.religion` | BAD_LABEL | Canonical field label is "religion" (raw camelCase no Vietnamese). This will app |
| BM-001 | `informant.occupation` | BAD_LABEL | Canonical field label is "occupation" (raw camelCase no Vietnamese). This will a |
| BM-001 | `informant.identityNo` | BAD_LABEL | Canonical field label is "identityNo" (raw camelCase no Vietnamese). This will a |
| BM-001 | `informant.identityIssuedDay` | BAD_LABEL | Canonical field label is "identityIssuedDay" (raw camelCase no Vietnamese). This |
| BM-001 | `informant.identityIssuedMonth` | BAD_LABEL | Canonical field label is "identityIssuedMonth" (raw camelCase no Vietnamese). Th |
| BM-001 | `informant.identityIssuedYear` | BAD_LABEL | Canonical field label is "identityIssuedYear" (raw camelCase no Vietnamese). Thi |
| BM-001 | `informant.identityIssuedPlace` | BAD_LABEL | Canonical field label is "identityIssuedPlace" (raw camelCase no Vietnamese). Th |
| BM-001 | `informant.permanentAddress` | BAD_LABEL | Canonical field label is "permanentAddress" (raw camelCase no Vietnamese). This  |
| BM-001 | `informant.temporaryAddress` | BAD_LABEL | Canonical field label is "temporaryAddress" (raw camelCase no Vietnamese). This  |
| BM-001 | `informant.currentAddress` | BAD_LABEL | Canonical field label is "currentAddress" (raw camelCase no Vietnamese). This wi |
| BM-001 | `informant.phone` | BAD_LABEL | Canonical field label is "phone" (raw camelCase no Vietnamese). This will appear |
| BM-001 | `informant.representedOrganization` | BAD_LABEL | Canonical field label is "representedOrganization" (raw camelCase no Vietnamese) |
| BM-001 | `informant.signerName` | BAD_LABEL | Canonical field label is "signerName" (raw camelCase no Vietnamese). This will a |
| BM-001 | `receiver.signerName` | BAD_LABEL | Canonical field label is "signerName" (raw camelCase no Vietnamese). This will a |
| BM-001 | `recipients.archiveLine` | BAD_LABEL | Canonical field label is "archiveLine" (raw camelCase no Vietnamese). This will  |
| BM-001 | `document.issuePlaceDateLine` | COMPILED_DRIFT | dataSource drift: locked="systemDate" vs compiled="SYSTEM". |
| ... | | | 1564 more |

