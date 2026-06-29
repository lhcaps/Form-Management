# AUDIT_FORMS_ROOT_CAUSE v2 - Form Metadata Root-Cause Audit (Repaired)
Generated: 2026-06-29T03:39:17.139Z
Audit version: v2 (rule independence: true)

## Executive Summary

| Metric | Value |
|--------|-------|
| totalContracts | 213 |
| totalFields | 2464 |
| totalIssues | 1427 |
| **FAIL** | **1141** |
| REVIEW | 286 |

### Issue Counts by Category

| Issue Code | Count |
|------------|-------|
| WEAK_EVIDENCE_AUTO_LOCKED | 422 |
| BAD_LABEL | 350 |
| GENERIC_FIELD_CANONICALIZATION | 349 |
| REQUIRED_SUSPICIOUS | 117 |
| SOURCE_MISMATCH | 115 |
| SHOULD_BE_READONLY | 42 |
| UI_VISIBLE_BAD_METADATA | 12 |
| RAW_PATTERN_DOMAIN_MISMATCH | 10 |
| REMEDIATION_LEAK | 10 |

### Top 20 BMs by Issue Count

| templateCode | title | failCount | reviewCount | totalIssues |
|--------------|-------|-----------|-------------|-------------|
| BM-096 | Yêu cầu ra QĐ khởi tố bị can | 30 | 1 | 31 |
| BM-155 | QĐ phục hồi vụ án đối với bị can | 28 | 1 | 29 |
| BM-136 | BB đối chất | 28 | 0 | 28 |
| BM-212 | Đề nghị tham gia tố tụng để hướng dẫn, hỗ trợ cho  | 23 | 2 | 25 |
| BM-117 | QĐ phục hồi điều tra bị can | 20 | 1 | 21 |
| BM-118 | QĐ phục hồi điều tra VA đối với bị can | 20 | 1 | 21 |
| BM-203 | Thông báo về hoạt động tố tụng | 19 | 2 | 21 |
| BM-211 | Thông báo về việc thụ lý vụ án | 19 | 2 | 21 |
| BM-186 | Thông báo áp dụng thủ tục xử lý chuyển hướng | 18 | 2 | 20 |
| BM-196 | Quyết định mở phiên họp xem xét, áp dụng biện pháp | 18 | 2 | 20 |
| BM-126 | QĐ trưng cầu giám định | 18 | 1 | 19 |
| BM-106 | Yêu cầu truy nã bị can | 18 | 0 | 18 |
| BM-190 | Đề nghị Tòa án xem xét, quyết định áp dụng biện ph | 17 | 2 | 19 |
| BM-199 | Kiến nghị về quyết định áp dụng BPXLCH của Tòa án  | 17 | 2 | 19 |
| BM-188 | Đề nghị Tòa án giải quyết vấn đề bồi thường thiệt  | 16 | 2 | 18 |
| BM-191 | Quyết định áp dụng biện pháp xử lý chuyển hướng tạ | 16 | 2 | 18 |
| BM-069 | BB về việc hủy bỏ biện pháp phong tỏa tài khoản | 15 | 9 | 24 |
| BM-192 | Quyết định không áp dụng biện pháp xử lý chuyển hư | 15 | 2 | 17 |
| BM-201 | Quyết định giải quyết khiếu nại, kiến nghị | 15 | 2 | 17 |
| BM-189 | Yêu cầu CQĐT đề nghị TA xem xét áp dụng biện pháp  | 15 | 1 | 16 |

### BM-050 Findings

**QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm**

Total: 4 issues (4 FAIL, 0 REVIEW)

- **BAD_LABEL** [FAIL] `agency.coQuan`
  - Label: `Ô trống` | rawPattern: `{{decision.field2}}` | rawDomain: `decision` | rawTail: `field2` | source: `agencyConfig`
  - Reason: Canonical field label is "Ô trống" ("Ô trống"). This will appear in UI.
  - Suggested path: `decision.requestingAgencyName`
  - Suggested label: `Cơ quan ra quyết định đề nghị phê chuẩn`
  - Confidence: MEDIUM | requiresHumanReview: false
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
- **GENERIC_FIELD_CANONICALIZATION** [FAIL] `agency.diaDanh`
  - Label: `Ô trống` | rawPattern: `{{document.field3}}` | rawDomain: `document` | rawTail: `field3` | source: `agencyConfig`
  - Reason: Generic raw pattern "{{document.field3}}" mapped to "agency.diaDanh" but has problems (label="Ô trống" (bad), weak_evidence=false). Generic fieldN should be replaced with correct semantic path.
  - Suggested path: `document.issuePlaceDateLine`
  - Suggested label: `Địa điểm, ngày lập văn bản`
  - Confidence: MEDIUM | requiresHumanReview: true

### BM-068 Findings

**QĐ huỷ bỏ biện pháp phong toả tài khoản**

Total: 4 issues (0 FAIL, 4 REVIEW)

- **REQUIRED_SUSPICIOUS** [REVIEW] `document.fullDocumentCode`
  - Label: `Số văn bản` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field looks required (identity/key field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `document.issueDate`
  - Label: `Ngày ban hành` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field looks required (date field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `person.occupation`
  - Label: `Nghề nghiệp` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field looks required (person info field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `person.idNumber`
  - Label: `Số CCCD/CMND` | rawPattern: `-` | rawDomain: `-` | rawTail: `-` | source: `manual`
  - Reason: Field looks required (ID field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true

### BAD_LABEL (350)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-003 | `document.issuePlaceAndDateLine` | `issuePlaceAndDateLine` | document | issuePlaceAndDateLine | systemDate | REVIEW | MEDIUM |
| BM-003 | `recipients.primaryLine` | `primaryLine` | recipients | primaryLine | manual | REVIEW | MEDIUM |
| BM-003 | `recipients.archiveLine` | `archiveLine` | recipients | archiveLine | manual | REVIEW | MEDIUM |
| BM-004 | `document.vietTat` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-004 | `agency.diaDanh` | `Ô trống` | document | field9 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `agency.tenCo` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `document.vietTat` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-013 | `agency.diaDanh` | `Ô trống` | document | field5 | agencyConfig | FAIL | MEDIUM |
| BM-013 | `document.ngayBan` | `Ô trống` | unknown | field6 | manual | FAIL | MEDIUM |
| BM-013 | `document.soVan` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-021 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-021 | `decision.summaryLine` | `Ô trống` | document | field9 | computed | FAIL | MEDIUM |
| BM-021 | `decision.decisionLine` | `Ô trống` | document | field10 | manual | FAIL | MEDIUM |
| BM-024 | `document.issuePlaceAndDateLine` | `Ô trống` | document | field6 | systemDate | FAIL | MEDIUM |
| BM-025 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
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
| BM-036 | `recipients.personLine` | `Ô trống` | document | field12 | manual | FAIL | MEDIUM |
| BM-036 | `recipients.archiveLine` | `Ô trống` | document | field13 | manual | FAIL | MEDIUM |
| BM-048 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-048 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-048 | `document.soQuyet` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-048 | `document.ngayBan` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-048 | `legalBasis.canCu` | `Ô trống` | person | field7 | manual | FAIL | MEDIUM |
| BM-048 | `document.canCu` | `Ô trống` | document | field8 | manual | FAIL | MEDIUM |
| BM-049 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-050 | `agency.coQuan` | `Ô trống` | decision | field2 | agencyConfig | FAIL | MEDIUM |
| BM-050 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-052 | `document.fullDocumentCode2` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-062 | `decision.decisionLine` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-063 | `document.issuePlaceAndDateLine` | `Ô trống` | document | field2 | computed | FAIL | MEDIUM |
| BM-066 | `decision.decisionLine` | `Ô trống` | document | field2 | computed | FAIL | MEDIUM |
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | REVIEW | MEDIUM |
| BM-069 | `document.reasonLine` | `Slot from Wave 02 DOCX re` | document | field6 | manual | REVIEW | MEDIUM |
| BM-069 | `document.reasonLine2` | `Slot from Wave 02 DOCX re` | document | field7 | manual | REVIEW | MEDIUM |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX re` | document | field8 | manual | REVIEW | MEDIUM |
| BM-069 | `document.summaryLine` | `Slot from Wave 02 DOCX re` | document | field12 | manual | REVIEW | MEDIUM |
| BM-072 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-072 | `document.soQuyet` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-074 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-074 | `document.dienThoai` | `Ô trống` | agency | field4 | manual | FAIL | MEDIUM |
| BM-074 | `document.soYeu` | `Ô trống` | agency | field5 | manual | FAIL | MEDIUM |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | REVIEW | MEDIUM |
| BM-076 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-076 | `document.dienThoai` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-076 | `document.soQuyet` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-076 | `document.ngayBan` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | REVIEW | MEDIUM |
| BM-078 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-078 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-078 | `document.soThong` | `Ô trống` | agency | field5 | manual | FAIL | MEDIUM |
| BM-081 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-081 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | REVIEW | MEDIUM |
| BM-083 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-083 | `document.dienThoai` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-083 | `document.soYeu` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-084 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-084 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-087 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-087 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-087 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-087 | `document.chuThe` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-087 | `legalBasis.canCu` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-087 | `agency.coQuan` | `Ô trống` | agency | field8 | agencyConfig | FAIL | MEDIUM |
| BM-088 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-088 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-091 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-091 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-092 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-092 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-092 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-093 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-093 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-093 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-094 | `document.soQuyet` | `Ô trống` | unknown | field3 | manual | FAIL | MEDIUM |
| BM-094 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-094 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-094 | `agency.dongDia` | `Ô trống` | document | field6 | agencyConfig | FAIL | MEDIUM |
| BM-095 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-095 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-095 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-096 | `document.soYeu` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-096 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-096 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-096 | `agency.dongDia` | `Ô trống` | document | field7 | agencyConfig | FAIL | MEDIUM |
| BM-096 | `document.chuThe` | `Ô trống` | document | field8 | manual | FAIL | MEDIUM |
| BM-096 | `legalBasis.canCu` | `Ô trống` | document | field9 | manual | FAIL | MEDIUM |
| ... | | | | | | | 250 more |

### RAW_PATTERN_DOMAIN_MISMATCH (10)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-021 | `document.issuePlaceAndDateLine` | `Căn cứ Bộ luật Tố tụng hì` | legalBasis | procedureArticlesLine | systemDate | FAIL | HIGH |
| BM-021 | `legalBasis.procedureArticlesLine` | `Viện kiểm sát ban hành` | agency | nameUpper | officialConfig | FAIL | HIGH |
| BM-026 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-034 | `agency.issuePlace` | `Nội dung quyết định (${"k` | decision | decisionLine | computed | FAIL | HIGH |
| BM-036 | `document.documentCode` | `Viện kiểm sát ban hành` | agency | nameUpper | manual | FAIL | HIGH |
| BM-036 | `document.issuePlaceAndDateLine` | `Họ tên người bị áp dụng` | person | fullName | systemDate | FAIL | HIGH |
| BM-036 | `person.fullName` | `Ngày ban hành` | document | issueDate | manual | FAIL | HIGH |
| BM-036 | `decision.summaryLine` | `Cơ quan cấp trên` | agency | parentNameUpper | computed | FAIL | HIGH |
| BM-036 | `recipients.executionAgencyLine` | `Nội dung quyết định (${"t` | decision | decisionLine | manual | FAIL | HIGH |
| BM-041 | `agency.issuePlace` | `Số quyết định` | document | documentCode | computed | FAIL | HIGH |

### SOURCE_MISMATCH (115)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-009 | `sourceResolutionExtension.article1Line` | `Điều 1` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-009 | `sourceResolutionExtension.article2Line` | `Điều 2` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-010 | `sourceSuspension.caseSummary` | `Vụ việc` | unknown | caseSummary | manual | REVIEW | MEDIUM |
| BM-010 | `sourceSuspension.article2Line` | `Điều 2` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-010 | `sourceSuspension.article3Line` | `Điều 3` | unknown | article3Line | manual | REVIEW | MEDIUM |
| BM-011 | `sourceSuspensionCancellation.article1Line` | `Điều 1` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-011 | `sourceSuspensionCancellation.article2Line` | `Điều 2` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-013 | `document.ngayBan` | `Ô trống` | unknown | field6 | manual | REVIEW | MEDIUM |
| BM-014 | `sourceDirectInspection.article1Line` | `Điều 1 - phạm vi và thời ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-014 | `sourceDirectInspection.article3Line` | `Điều 3 - yêu cầu chuẩn bị` | unknown | article3Line | manual | REVIEW | MEDIUM |
| BM-014 | `sourceDirectInspection.article4Line` | `Điều 4 - kế hoạch kèm the` | unknown | article4Line | manual | REVIEW | MEDIUM |
| BM-020 | `initiationRequest.article1Line` | `Nội dung Điều 1` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-020 | `initiationRequest.article2Line` | `Nội dung Điều 2` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-023 | `investigation.article2Line` | `Nội dung Điều 2` | investigation | article2Line | manual | REVIEW | MEDIUM |
| BM-026 | `agency.nameUpper` | `Ngày ban hành` | document | issueDate | agencyConfig | FAIL | HIGH |
| BM-028 | `legalBasis.canCu` | `Ô trống` | unknown | field6 | manual | REVIEW | MEDIUM |
| BM-028 | `document.soQd` | `Ô trống` | unknown | field7 | manual | REVIEW | MEDIUM |
| BM-028 | `document.ngayQd` | `Ô trống` | unknown | field8 | manual | REVIEW | MEDIUM |
| BM-031 | `measure.article1Line` | `Nội dung Điều 1` | measure | article1Line | manual | REVIEW | MEDIUM |
| BM-031 | `measure.article2Line` | `Nội dung Điều 2` | measure | article2Line | manual | REVIEW | MEDIUM |
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
| BM-051 | `document.fullDocumentCode` | `Số văn bản` | document | field2 | manual | REVIEW | MEDIUM |
| BM-052 | `document.fullDocumentCode` | `Số văn bản` | decision | field2 | manual | REVIEW | MEDIUM |
| BM-053 | `measure.article2Line` | `Điều 2 - Nội dung quyết đ` | measure | article2Line | manual | REVIEW | MEDIUM |
| BM-053 | `monitoring.article3Line` | `Điều 3 - Yêu cầu` | monitoring | article3Line | manual | REVIEW | MEDIUM |
| BM-055 | `measure.preventiveMeasureOrderLegalBasisLine` | `Căn cứ lệnh/quyết định áp` | measure | preventiveMeasureOrderLegalBasisLine | manual | REVIEW | MEDIUM |
| BM-055 | `measure.cancellationArticle1Line` | `Điều 1 - Nội dung hủy bỏ` | measure | cancellationArticle1Line | manual | REVIEW | MEDIUM |
| BM-055 | `measure.cancellationArticle2Line` | `Điều 2 - Thông báo` | measure | cancellationArticle2Line | manual | REVIEW | MEDIUM |
| BM-056 | `measure.exitPostponementArticle2Line` | `Điều 2 - Nội dung quyết đ` | measure | exitPostponementArticle2Line | manual | REVIEW | MEDIUM |
| BM-057 | `measure.immigrationAgencyName` | `Tên cơ quan xuất nhập cản` | measure | immigrationAgencyName | manual | REVIEW | MEDIUM |
| BM-059 | `measure.detentionExtensionArticle1Line` | `Điều 1 - Gia hạn tạm giam` | measure | detentionExtensionArticle1Line | manual | REVIEW | MEDIUM |
| BM-059 | `measure.detentionExtensionArticle2Line` | `Điều 2 - Giao nhiệm vụ` | measure | detentionExtensionArticle2Line | manual | REVIEW | MEDIUM |
| BM-064 | `document.fullDocumentCode` | `Số văn bản` | document | field3 | manual | REVIEW | MEDIUM |
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
| BM-076 | `document.dienThoai` | `Ô trống` | unknown | field4 | manual | REVIEW | MEDIUM |
| BM-085 | `caseInvestigationTransfer.article1Line` | `Điều 1 - Nội dung quyết đ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-085 | `caseInvestigationTransfer.article2Line` | `Điều 2 - Thời hạn` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-090 | `accusedDecision.approvalArticle1Line` | `Điều 1 - Kết quả` | unknown | approvalArticle1Line | manual | REVIEW | MEDIUM |
| BM-090 | `accusedDecision.investigationRequestLine` | `Điều 2 - Yêu cầu` | unknown | investigationRequestLine | manual | REVIEW | MEDIUM |
| BM-095 | `document.soQuyet` | `Ô trống` | document | field3 | manual | REVIEW | MEDIUM |
| BM-097 | `accusedDecision.article1Line` | `Điều 1 - Quyết định truy ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-097 | `accusedDecision.article2Line` | `Điều 2 - Giao hồ sơ` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-104 | `investigationExtension.decisionArticle1Line` | `Điều 1 - Thu hồi điều tra` | investigationExtension | decisionArticle1Line | manual | REVIEW | MEDIUM |
| BM-104 | `investigationExtension.decisionArticle2Line` | `Điều 2 - Thời hạn` | investigationExtension | decisionArticle2Line | manual | REVIEW | MEDIUM |
| BM-117 | `document.soQuyet` | `Ô trống` | legalBasis | field3 | manual | REVIEW | MEDIUM |
| BM-118 | `document.soQuyet` | `Ô trống` | unknown | field3 | manual | REVIEW | MEDIUM |
| BM-126 | `document.ngayBan` | `Ô trống` | document | field5 | manual | REVIEW | MEDIUM |
| BM-128 | `document.soQuyet` | `Ô trống` | document | field3 | manual | REVIEW | MEDIUM |
| BM-130 | `document.ngayBan` | `Ô trống` | decision | field5 | manual | REVIEW | MEDIUM |
| BM-132 | `document.soQuyet` | `Ô trống` | decision | field3 | manual | REVIEW | MEDIUM |
| BM-133 | `document.soQuyet` | `Ô trống` | decision | field3 | manual | REVIEW | MEDIUM |
| BM-133 | `document.ngayBan` | `Ô trống` | agency | field5 | manual | REVIEW | MEDIUM |
| BM-145 | `prosecutionSupplementReturn.article1IntroLine` | `Điều 1 - Mở đầu` | unknown | article1IntroLine | manual | REVIEW | MEDIUM |
| BM-145 | `prosecutionSupplementReturn.article2Line` | `Điều 2 - Chuyển hồ sơ` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-145 | `prosecutionSupplementReturn.article3Line` | `Điều 3 - Yêu cầu` | unknown | article3Line | manual | REVIEW | MEDIUM |
| BM-146 | `prosecutionCaseSuspension.article1Line` | `Điều 1 - Nội dung quyết đ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-146 | `prosecutionCaseSuspension.article2Line` | `Điều 2 - Xử lý vật chứng` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-146 | `prosecutionCaseSuspension.article3Line` | `Điều 3 - Thông báo` | unknown | article3Line | manual | REVIEW | MEDIUM |
| BM-146 | `prosecutionCaseSuspension.article4Line` | `Điều 4 - Thẩm quyền giải ` | unknown | article4Line | manual | REVIEW | MEDIUM |
| BM-148 | `suspension.article1Line` | `Điều 1 - Nội dung quyết đ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-148 | `suspension.article2ActionLine` | `Điều 2 - Hành động` | unknown | article2ActionLine | manual | REVIEW | MEDIUM |
| BM-148 | `suspension.executionRequestLine` | `Điều 3 - Yêu cầu` | unknown | executionRequestLine | manual | REVIEW | MEDIUM |
| BM-150 | `prosecutionCaseTermination.article1Line` | `Điều 1 - Nội dung quyết đ` | unknown | article1Line | manual | REVIEW | MEDIUM |
| BM-150 | `prosecutionCaseTermination.article2Line` | `Điều 2 - Hậu quả pháp lý` | unknown | article2Line | manual | REVIEW | MEDIUM |
| BM-150 | `prosecutionCaseTermination.article3Line` | `Điều 3 - Thông báo` | unknown | article3Line | manual | REVIEW | MEDIUM |
| BM-150 | `prosecutionCaseTermination.article4Line` | `Điều 4 - Khiếu nại` | unknown | article4Line | manual | REVIEW | MEDIUM |
| BM-153 | `document.ngayBan` | `Ô trống` | unknown | field5 | manual | REVIEW | MEDIUM |
| BM-154 | `document.ngayBan` | `Ô trống` | document | field5 | manual | REVIEW | MEDIUM |
| ... | | | | | | | 15 more |

### REMEDIATION_LEAK (10)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-069 | `document.reasonLine` | `Slot from Wave 02 DOCX re` | document | field6 | manual | FAIL | HIGH |
| BM-069 | `document.reasonLine2` | `Slot from Wave 02 DOCX re` | document | field7 | manual | FAIL | HIGH |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX re` | document | field8 | manual | FAIL | HIGH |
| BM-069 | `document.summaryLine` | `Slot from Wave 02 DOCX re` | document | field12 | manual | FAIL | HIGH |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | HIGH |
| BM-162 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |
| BM-163 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | document | field3 | manual | FAIL | HIGH |

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

### GENERIC_FIELD_CANONICALIZATION (349)

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
| BM-021 | `decision.summaryLine` | `Ô trống` | document | field9 | computed | FAIL | MEDIUM |
| BM-021 | `decision.decisionLine` | `Ô trống` | document | field10 | manual | FAIL | MEDIUM |
| BM-024 | `document.issuePlaceAndDateLine` | `Ô trống` | document | field6 | systemDate | FAIL | MEDIUM |
| BM-025 | `agency.issuePlace` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
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
| BM-036 | `recipients.personLine` | `Ô trống` | document | field12 | manual | FAIL | MEDIUM |
| BM-036 | `recipients.archiveLine` | `Ô trống` | document | field13 | manual | FAIL | MEDIUM |
| BM-048 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-048 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-048 | `document.soQuyet` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-048 | `document.ngayBan` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-048 | `legalBasis.canCu` | `Ô trống` | person | field7 | manual | FAIL | MEDIUM |
| BM-048 | `document.canCu` | `Ô trống` | document | field8 | manual | FAIL | MEDIUM |
| BM-049 | `agency.coQuan` | `Ô trống` | document | field2 | agencyConfig | FAIL | MEDIUM |
| BM-050 | `agency.coQuan` | `Ô trống` | decision | field2 | agencyConfig | FAIL | MEDIUM |
| BM-050 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-052 | `document.fullDocumentCode2` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-062 | `decision.decisionLine` | `Ô trống` | document | field3 | computed | FAIL | MEDIUM |
| BM-063 | `document.issuePlaceAndDateLine` | `Ô trống` | document | field2 | computed | FAIL | MEDIUM |
| BM-066 | `decision.decisionLine` | `Ô trống` | document | field2 | computed | FAIL | MEDIUM |
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-069 | `document.reasonLine` | `Slot from Wave 02 DOCX re` | document | field6 | manual | FAIL | MEDIUM |
| BM-069 | `document.reasonLine2` | `Slot from Wave 02 DOCX re` | document | field7 | manual | FAIL | MEDIUM |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX re` | document | field8 | manual | FAIL | MEDIUM |
| BM-069 | `document.summaryLine` | `Slot from Wave 02 DOCX re` | document | field12 | manual | FAIL | MEDIUM |
| BM-072 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-072 | `document.soQuyet` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
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
| BM-081 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-081 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | document | field1 | manual | FAIL | MEDIUM |
| BM-083 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-083 | `document.dienThoai` | `Ô trống` | unknown | field4 | manual | FAIL | MEDIUM |
| BM-083 | `document.soYeu` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-084 | `agency.diaDanh` | `Ô trống` | document | field3 | agencyConfig | FAIL | MEDIUM |
| BM-084 | `document.dienThoai` | `Ô trống` | document | field4 | manual | FAIL | MEDIUM |
| BM-087 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-087 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-087 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-087 | `document.chuThe` | `Ô trống` | document | field6 | manual | FAIL | MEDIUM |
| BM-087 | `legalBasis.canCu` | `Ô trống` | document | field7 | manual | FAIL | MEDIUM |
| BM-087 | `agency.coQuan` | `Ô trống` | agency | field8 | agencyConfig | FAIL | MEDIUM |
| BM-088 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-088 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-091 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-091 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-092 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-092 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-092 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-093 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-093 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-093 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-094 | `document.soQuyet` | `Ô trống` | unknown | field3 | manual | FAIL | MEDIUM |
| BM-094 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-094 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-094 | `agency.dongDia` | `Ô trống` | document | field6 | agencyConfig | FAIL | MEDIUM |
| BM-095 | `document.soQuyet` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-095 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-095 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-096 | `document.soYeu` | `Ô trống` | document | field3 | manual | FAIL | MEDIUM |
| BM-096 | `agency.diaDanh` | `Ô trống` | document | field4 | agencyConfig | FAIL | MEDIUM |
| BM-096 | `document.ngayBan` | `Ô trống` | document | field5 | manual | FAIL | MEDIUM |
| BM-096 | `agency.dongDia` | `Ô trống` | document | field7 | agencyConfig | FAIL | MEDIUM |
| BM-096 | `document.chuThe` | `Ô trống` | document | field8 | manual | FAIL | MEDIUM |
| BM-096 | `legalBasis.canCu` | `Ô trống` | document | field9 | manual | FAIL | MEDIUM |
| BM-096 | `document.tenVu` | `Ô trống` | document | field10 | manual | FAIL | MEDIUM |
| BM-096 | `person.toiDanh` | `Ô trống` | document | field11 | manual | FAIL | MEDIUM |
| BM-096 | `person.hoTen` | `Ô trống` | document | field12 | manual | FAIL | MEDIUM |
| ... | | | | | | | 249 more |

### SHOULD_BE_READONLY (42)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-003 | `legalBasis.procedureArticlesLine` | `Căn cứ pháp lý` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-007 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-011 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-014 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-016 | `legalBasis.procedureArticlesLine` | `Căn cứ tố tụng` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-018 | `legalBasis.procedureArticlesLine` | `Căn cứ pháp lý` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-021 | `legalBasis.procedureArticlesLine` | `Viện kiểm sát ban hành` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-023 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-030 | `legalBasis.procedureArticlesLine` | `Căn cứ pháp lý` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-033 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-036 | `document.documentCode` | `Viện kiểm sát ban hành` | agency | nameUpper | manual | REVIEW | HIGH |
| BM-036 | `legalBasis.procedureArticlesLine` | `Căn cứ pháp lý` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-038 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-039 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-044 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-045 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-046 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-047 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-054 | `agency.name` | `Viện kiểm sát ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-054 | `agency.name` | `Viện kiểm sát ban hành` | agency | name | manual | REVIEW | HIGH |
| BM-058 | `agency.parentName` | `Cơ quan cấp trên` | - | - | manual | REVIEW | MEDIUM |
| BM-058 | `agency.parentName` | `Cơ quan cấp trên` | agency | parentName | manual | REVIEW | HIGH |
| BM-058 | `agency.name` | `Viện kiểm sát ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-058 | `agency.name` | `Viện kiểm sát ban hành` | agency | name | manual | REVIEW | HIGH |
| BM-058 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-059 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-086 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-090 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-097 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-103 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-104 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-148 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-156 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-159 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-166 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-169 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-170 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-171 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-172 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-173 | `legalBasis.procedureArticlesLine` | `Căn cứ Bộ luật Tố tụng hì` | - | - | officialConfig | REVIEW | MEDIUM |
| BM-213 | `agency.parentName` | `Cơ quan cấp trên` | - | - | manual | REVIEW | MEDIUM |
| BM-213 | `agency.parentName` | `Cơ quan cấp trên` | agency | parentName | manual | REVIEW | HIGH |

### REQUIRED_SUSPICIOUS (117)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-022 | `person.fullName` | `Họ tên` | - | - | manual | REVIEW | MEDIUM |
| BM-024 | `document.issueDate` | `Số quyết định` | - | - | systemDate | REVIEW | MEDIUM |
| BM-026 | `document.issueDate` | `Ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-034 | `document.issueDate` | `Ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-035 | `document.issueDate` | `Ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-036 | `person.fullName` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-051 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-052 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-052 | `person.fullName` | `Họ tên` | - | - | manual | REVIEW | MEDIUM |
| BM-052 | `person.idNumber` | `Số CMND/Thẻ CCCD/Thẻ CC/H` | - | - | manual | REVIEW | MEDIUM |
| BM-060 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-061 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-062 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-063 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-064 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-064 | `document.issueDate` | `Ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-066 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-068 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-068 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-068 | `person.occupation` | `Nghề nghiệp` | - | - | manual | REVIEW | MEDIUM |
| BM-068 | `person.idNumber` | `Số CCCD/CMND` | - | - | manual | REVIEW | MEDIUM |
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-069 | `document.issueDate` | `Ngày lập biên bản` | - | - | manual | REVIEW | MEDIUM |
| BM-069 | `person.idNumber` | `Số CCCD/CMND` | - | - | manual | REVIEW | MEDIUM |
| BM-069 | `person.occupation` | `Nghề nghiệp` | - | - | manual | REVIEW | MEDIUM |
| BM-073 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-073 | `document.issueDate` | `Ngày ban hành` | - | - | systemDate | REVIEW | MEDIUM |
| BM-073 | `person.idNumber` | `Số CMND/Thẻ CCCD/Thẻ CC/H` | - | - | manual | REVIEW | MEDIUM |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-080 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-080 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-080 | `person.fullName` | `Họ tên` | - | - | manual | REVIEW | MEDIUM |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | REVIEW | MEDIUM |
| BM-096 | `person.idNumber` | `Số CCCD/CMND` | - | - | manual | REVIEW | MEDIUM |
| BM-139 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-162 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-162 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-162 | `person.occupation` | `Nghề nghiệp` | - | - | manual | REVIEW | MEDIUM |
| BM-162 | `person.idNumber` | `Số CCCD/CMND` | - | - | manual | REVIEW | MEDIUM |
| BM-163 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
| BM-163 | `document.issueDate` | `Ngày ban hành` | - | - | manual | REVIEW | MEDIUM |
| BM-163 | `person.occupation` | `Nghề nghiệp` | - | - | manual | REVIEW | MEDIUM |
| BM-163 | `person.idNumber` | `Số CCCD/CMND` | - | - | manual | REVIEW | MEDIUM |
| BM-164 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-165 | `document.fullDocumentCode` | `Số văn bản / quyết định` | - | - | manual | REVIEW | MEDIUM |
| BM-167 | `document.fullDocumentCode` | `Số văn bản` | - | - | manual | REVIEW | MEDIUM |
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
| ... | | | | | | | 17 more |

### UI_VISIBLE_BAD_METADATA (12)

| templateCode | path | label | rawDomain | rawTail | source | severity | confidence |
|--------------|------|-------|----------|---------|--------|----------|------------|
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `document.reasonLine` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `document.reasonLine2` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `document.summaryLine` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-082 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-155 | `document.dieu1` | `Dieu1` | - | - | manual | FAIL | MEDIUM |
| BM-155 | `document.dieu2` | `Dieu2` | - | - | manual | FAIL | MEDIUM |
| BM-162 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |
| BM-163 | `person.dateOfBirth` | `Slot from Wave 02 DOCX re` | - | - | manual | FAIL | MEDIUM |

## Proposed Fix Plan

- **HIGH confidence auto-fix candidates**: 21
- **MEDIUM confidence / requires review (FAIL)**: 1120
- **REVIEW only (not auto-fix)**: 286

### Auto-fix Candidates (HIGH confidence, no human review needed)

| templateCode | path | suggestedPath | suggestedLabel | reason |
|--------------|------|---------------|---------------|--------|
| BM-021 | `document.issuePlaceAndDateLine` | `legalBasis.procedureArticlesLine` | - | rawPattern domain "legalBasis" ({{legalBasis.procedureArticlesLine}}) does not m |
| BM-021 | `legalBasis.procedureArticlesLine` | `agency.nameUpper` | - | rawPattern domain "agency" ({{agency.nameUpper}}) does not match canonical path  |
| BM-026 | `agency.nameUpper` | `document.issueDate` | - | rawPattern domain "document" ({{document.issueDate}}) does not match canonical p |
| BM-026 | `agency.nameUpper` | - | - | source="agencyConfig" but rawPattern "{{document.issueDate}}" is from "document" |
| BM-034 | `agency.issuePlace` | `decision.decisionLine` | - | rawPattern domain "decision" ({{decision.decisionLine}}) does not match canonica |
| BM-036 | `document.documentCode` | `agency.nameUpper` | - | rawPattern domain "agency" ({{agency.nameUpper}}) does not match canonical path  |
| BM-036 | `document.issuePlaceAndDateLine` | `person.fullName` | - | rawPattern domain "person" ({{person.fullName}}) does not match canonical path d |
| BM-036 | `person.fullName` | `document.issueDate` | - | rawPattern domain "document" ({{document.issueDate}}) does not match canonical p |
| BM-036 | `decision.summaryLine` | `agency.parentNameUpper` | - | rawPattern domain "agency" ({{agency.parentNameUpper}}) does not match canonical |
| BM-036 | `recipients.executionAgencyLine` | `decision.decisionLine` | - | rawPattern domain "decision" ({{decision.decisionLine}}) does not match canonica |
| BM-041 | `agency.issuePlace` | `document.documentCode` | - | rawPattern domain "document" ({{document.documentCode}}) does not match canonica |
| BM-069 | `document.fullDocumentCode` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-069 | `document.reasonLine` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-069 | `document.reasonLine2` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-069 | `decision.decisionLine` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-069 | `document.summaryLine` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-075 | `document.fullDocumentCode` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-077 | `document.fullDocumentCode` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-082 | `document.fullDocumentCode` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-162 | `person.dateOfBirth` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |
| BM-163 | `person.dateOfBirth` | - | - | Slot label "Slot from Wave 02 DOCX remediation" contains remediation metadata. T |

### Manual Review Required

| templateCode | path | issueCode | reason |
|--------------|------|----------|--------|
| BM-003 | `document.issuePlaceAndDateLine` | BAD_LABEL | Canonical field label is "issuePlaceAndDateLine" (raw camelCase no Vietnamese).  |
| BM-003 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed legal text). source= |
| BM-003 | `recipients.primaryLine` | BAD_LABEL | Canonical field label is "primaryLine" (raw camelCase no Vietnamese). This will  |
| BM-003 | `recipients.archiveLine` | BAD_LABEL | Canonical field label is "archiveLine" (raw camelCase no Vietnamese). This will  |
| BM-007 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed legal text). source= |
| BM-009 | `sourceResolutionExtension.article1Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-009 | `sourceResolutionExtension.article2Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-010 | `sourceSuspension.caseSummary` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-010 | `sourceSuspension.article2Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-010 | `sourceSuspension.article3Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-011 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed legal text). source= |
| BM-011 | `sourceSuspensionCancellation.article1Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-011 | `sourceSuspensionCancellation.article2Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-013 | `document.ngayBan` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-014 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed legal text). source= |
| BM-014 | `sourceDirectInspection.article1Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-014 | `sourceDirectInspection.article3Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-014 | `sourceDirectInspection.article4Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-016 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed legal text). source= |
| BM-018 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed legal text). source= |
| BM-020 | `initiationRequest.article1Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-020 | `initiationRequest.article2Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-021 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed legal text). source= |
| BM-022 | `person.fullName` | REQUIRED_SUSPICIOUS | Field looks required (identity/key field likely required) but required=false. |
| BM-023 | `legalBasis.procedureArticlesLine` | SHOULD_BE_READONLY | Field appears to be a computed/agency/official field (fixed legal text). source= |
| BM-023 | `investigation.article2Line` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-024 | `document.issueDate` | REQUIRED_SUSPICIOUS | Field looks required (date field likely required) but required=false. |
| BM-026 | `document.issueDate` | REQUIRED_SUSPICIOUS | Field looks required (date field likely required) but required=false. |
| BM-028 | `legalBasis.canCu` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| BM-028 | `document.soQd` | SOURCE_MISMATCH | source="manual" but context contains fixed legal text. Verify this really needs  |
| ... | | | 256 more |

