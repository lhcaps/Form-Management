# AUDIT_FORMS_ROOT_CAUSE - Form Metadata Root-Cause Audit
Generated: 2026-06-25T17:12:31.386Z

## Executive Summary

| Metric | Value |
|--------|-------|
| totalContracts | 213 |
| totalFields | 2453 |
| totalIssues | 1567 |
| **FAIL** | **603** |
| REVIEW | 964 |

### Issue Counts by Category

| Issue Code | Count |
|------------|-------|
| COMPILED_DRIFT | 765 |
| BAD_LABEL | 499 |
| RAW_PATTERN_DOMAIN_MISMATCH | 171 |
| REMEDIATION_LEAK | 73 |
| REQUIRED_SUSPICIOUS | 39 |
| SOURCE_MISMATCH | 20 |

### Top 20 BMs by Issue Count

| templateCode | title | failCount | reviewCount | totalIssues |
|--------------|-------|-----------|-------------|-------------|
| BM-096 | Yêu cầu ra QĐ khởi tố bị can | 26 | 3 | 29 |
| BM-136 | BB đối chất | 23 | 4 | 27 |
| BM-155 | QĐ phục hồi vụ án đối với bị can | 19 | 3 | 22 |
| BM-069 | BB về việc hủy bỏ biện pháp phong tỏa tài khoản | 16 | 17 | 33 |
| BM-126 | QĐ trưng cầu giám định | 14 | 5 | 19 |
| BM-117 | QĐ phục hồi điều tra bị can | 14 | 4 | 18 |
| BM-068 | QĐ huỷ bỏ biện pháp phong toả tài khoản | 13 | 17 | 30 |
| BM-118 | QĐ phục hồi điều tra VA đối với bị can | 13 | 4 | 17 |
| BM-163 | Giấy triệu tập | 11 | 15 | 26 |
| BM-134 | BB ghi lời khai | 11 | 4 | 15 |
| BM-135 | BB hỏi cung bị can | 11 | 4 | 15 |
| BM-106 | Yêu cầu truy nã bị can | 11 | 3 | 14 |
| BM-152 | QĐ đình chỉ vụ án đối với bị can | 11 | 3 | 14 |
| BM-138 | Yêu cầu cung cấp tài liệu liên quan đến hành vi, Q | 10 | 3 | 13 |
| BM-133 | QĐ giám định lại trong trường hợp đặc biệt | 9 | 5 | 14 |
| BM-127 | Yêu cầu định giá tài sản | 9 | 4 | 13 |
| BM-130 | QĐ trưng cầu giám định lại | 9 | 4 | 13 |
| BM-048 | QĐ huỷ bỏ biện pháp bảo lĩnh | 9 | 3 | 12 |
| BM-129 | QĐ trưng cầu giám định bổ sung | 9 | 3 | 12 |
| BM-161 | Phiếu yêu cầu trích xuất | 9 | 2 | 11 |

### BM-050 Findings

**QĐ không phê chuẩn QĐ về việc đặt tiền để bảo đảm**

- **BAD_LABEL** [FAIL] `agency.coQuan`
  - Label: `Ô trống` | rawPattern: `{{decision.field2}}` | source: `agencyConfig`
  - Reason: Canonical field label is "Ô trống" ("Ô trống"). This will appear in UI.
  - Suggested path: `decision.requestingAgencyName`
  - Suggested label: `Cơ quan ra quyết định đề nghị phê chuẩn`
  - Confidence: MEDIUM | requiresHumanReview: false
- **RAW_PATTERN_DOMAIN_MISMATCH** [FAIL] `agency.coQuan`
  - Label: `Ô trống` | rawPattern: `{{decision.field2}}` | source: `agencyConfig`
  - Reason: rawPattern domain "decision" does not match canonical path domain "agency". DOCX slot extracted from "decision" but mapped to "agency".
  - Suggested path: `decision.field2}}`
  - Suggested label: `Cơ quan ra quyết định đề nghị phê chuẩn`
  - Confidence: HIGH | requiresHumanReview: false
- **BAD_LABEL** [FAIL] `agency.diaDanh`
  - Label: `Ô trống` | rawPattern: `{{document.field3}}` | source: `agencyConfig`
  - Reason: Canonical field label is "Ô trống" ("Ô trống"). This will appear in UI.
  - Suggested path: `document.issuePlaceDateLine`
  - Suggested label: `Địa điểm, ngày lập văn bản`
  - Confidence: MEDIUM | requiresHumanReview: false
- **RAW_PATTERN_DOMAIN_MISMATCH** [FAIL] `agency.diaDanh`
  - Label: `Ô trống` | rawPattern: `{{document.field3}}` | source: `agencyConfig`
  - Reason: rawPattern domain "document" does not match canonical path domain "agency". DOCX slot extracted from "document" but mapped to "agency".
  - Suggested path: `document.field3}}`
  - Suggested label: `Địa điểm, ngày lập văn bản`
  - Confidence: HIGH | requiresHumanReview: false
- **COMPILED_DRIFT** [REVIEW] `agency.tenVien`
  - Label: `Tên cơ quan` | rawPattern: `-` | source: `agencyConfig`
  - Reason: dataSource drift: locked="agencyConfig" vs compiled="AGENCY".
  - Suggested path: `agency.name`
  - Suggested label: `Tên cơ quan`
  - Confidence: MEDIUM | requiresHumanReview: true
  ... and 2 more issues

### BM-068 Findings

**QĐ huỷ bỏ biện pháp phong toả tài khoản**

- **BAD_LABEL** [REVIEW] `document.fullDocumentCode`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field1}}` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `document.fullDocumentCode`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | source: `manual`
  - Reason: Field looks required (identity/key field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `document.issueDate`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field2}}` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
- **REQUIRED_SUSPICIOUS** [REVIEW] `document.issueDate`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `-` | source: `manual`
  - Reason: Field looks required (date field likely required) but required=false.
  - Confidence: MEDIUM | requiresHumanReview: true
- **BAD_LABEL** [REVIEW] `person.dateOfBirth`
  - Label: `Slot from Wave 02 DOCX remediation` | rawPattern: `{{document.field3}}` | source: `manual`
  - Reason: Canonical field label is "Slot from Wave 02 DOCX remediation" (starts with "Slot from"). This will appear in UI.
  - Confidence: MEDIUM | requiresHumanReview: true
  ... and 25 more issues

### BAD_LABEL (499)

| templateCode | path | label | rawPattern | source | severity | confidence |
|--------------|------|-------|------------|--------|----------|------------|
| BM-001 | `document.issuePlaceDateLine` | `issuePlaceDateLine` | `{{document.issuePlaceDate` | systemDate | REVIEW | MEDIUM |
| BM-001 | `receiver.fullName` | `fullName` | `{{receiver.fullName}}` | manual | REVIEW | MEDIUM |
| BM-001 | `receiver.positionTitle` | `positionTitle` | `{{receiver.positionTitle}` | officialConfig | REVIEW | MEDIUM |
| BM-001 | `receiver.departmentName` | `departmentName` | `{{receiver.departmentName` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.fullName` | `fullName` | `{{informant.fullName}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.genderLabel` | `genderLabel` | `{{informant.genderLabel}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.otherName` | `otherName` | `{{informant.otherName}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.birthDay` | `birthDay` | `{{informant.birthDay}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.birthMonth` | `birthMonth` | `{{informant.birthMonth}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.birthYear` | `birthYear` | `{{informant.birthYear}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.placeOfBirth` | `placeOfBirth` | `{{informant.placeOfBirth}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.nationality` | `nationality` | `{{informant.nationality}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.ethnicity` | `ethnicity` | `{{informant.ethnicity}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.religion` | `religion` | `{{informant.religion}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.occupation` | `occupation` | `{{informant.occupation}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityNo` | `identityNo` | `{{informant.identityNo}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityIssuedDay` | `identityIssuedDay` | `{{informant.identityIssue` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityIssuedMonth` | `identityIssuedMonth` | `{{informant.identityIssue` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityIssuedYear` | `identityIssuedYear` | `{{informant.identityIssue` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.identityIssuedPlace` | `identityIssuedPlace` | `{{informant.identityIssue` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.permanentAddress` | `permanentAddress` | `{{informant.permanentAddr` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.temporaryAddress` | `temporaryAddress` | `{{informant.temporaryAddr` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.currentAddress` | `currentAddress` | `{{informant.currentAddres` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.phone` | `phone` | `{{informant.phone}}` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.representedOrganization` | `representedOrganization` | `{{informant.representedOr` | manual | REVIEW | MEDIUM |
| BM-001 | `informant.signerName` | `signerName` | `{{informant.signerName}}` | officialConfig | REVIEW | MEDIUM |
| BM-001 | `receiver.signerName` | `signerName` | `{{receiver.signerName}}` | officialConfig | REVIEW | MEDIUM |
| BM-001 | `recipients.archiveLine` | `archiveLine` | `{{recipients.archiveLine}` | manual | REVIEW | MEDIUM |
| BM-002 | `agency.parentName` | `parentName` | `{{agency.parentName}}` | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `agency.name` | `name` | `{{agency.name}}` | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `document.documentCode` | `documentCode` | `{{document.documentCode}}` | manual | REVIEW | MEDIUM |
| BM-002 | `document.issuePlaceAndDateLine` | `issuePlaceAndDateLine` | `{{document.issuePlaceAndD` | systemDate | REVIEW | MEDIUM |
| BM-002 | `receiver.name` | `name` | `{{receiver.name}}` | manual | REVIEW | MEDIUM |
| BM-002 | `sourceReport.receivedDateLine` | `receivedDateLine` | `{{sourceReport.receivedDa` | systemDate | REVIEW | MEDIUM |
| BM-002 | `agency.bodyName` | `bodyName` | `{{agency.bodyName}}` | agencyConfig | REVIEW | MEDIUM |
| BM-002 | `reporter.fullName` | `fullName` | `{{reporter.fullName}}` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.genderText` | `genderText` | `{{reporter.genderText}}` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.otherName` | `otherName` | `{{reporter.otherName}}` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.birthDateLine` | `birthDateLine` | `{{reporter.birthDateLine}` | systemDate | REVIEW | MEDIUM |
| BM-002 | `reporter.birthPlace` | `birthPlace` | `{{reporter.birthPlace}}` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.nationality` | `nationality` | `{{reporter.nationality}}` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.ethnicity` | `ethnicity` | `{{reporter.ethnicity}}` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.religion` | `religion` | `{{reporter.religion}}` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.occupation` | `occupation` | `{{reporter.occupation}}` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.identityNumber` | `identityNumber` | `{{reporter.identityNumber` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.identityIssueDateLine` | `identityIssueDateLine` | `{{reporter.identityIssueD` | systemDate | REVIEW | MEDIUM |
| BM-002 | `reporter.identityIssuePlace` | `identityIssuePlace` | `{{reporter.identityIssueP` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.permanentResidence` | `permanentResidence` | `{{reporter.permanentResid` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.temporaryResidence` | `temporaryResidence` | `{{reporter.temporaryResid` | manual | REVIEW | MEDIUM |
| BM-002 | `reporter.currentResidence` | `currentResidence` | `{{reporter.currentResiden` | manual | REVIEW | MEDIUM |
| ... | | | | | | 449 more |

### RAW_PATTERN_DOMAIN_MISMATCH (171)

| templateCode | path | label | rawPattern | source | severity | confidence |
|--------------|------|-------|------------|--------|----------|------------|
| BM-004 | `agency.diaDanh` | `Ô trống` | `{{document.field9}}` | agencyConfig | FAIL | HIGH |
| BM-013 | `agency.tenCo` | `Ô trống` | `{{document.field3}}` | agencyConfig | FAIL | HIGH |
| BM-013 | `agency.diaDanh` | `Ô trống` | `{{document.field5}}` | agencyConfig | FAIL | HIGH |
| BM-021 | `agency.issuePlace` | `Ô trống` | `{{document.field3}}` | computed | FAIL | HIGH |
| BM-021 | `decision.summaryLine` | `Ô trống` | `{{document.field9}}` | computed | FAIL | HIGH |
| BM-021 | `decision.decisionLine` | `Ô trống` | `{{document.field10}}` | manual | FAIL | HIGH |
| BM-022 | `person.fullName` | `Ô trống` | `{{document.field7}}` | manual | FAIL | HIGH |
| BM-025 | `agency.issuePlace` | `Ô trống` | `{{document.field3}}` | computed | FAIL | HIGH |
| BM-027 | `agency.coQuan` | `Ô trống` | `{{document.field2}}` | agencyConfig | FAIL | HIGH |
| BM-028 | `agency.coQuan` | `Ô trống` | `{{document.field2}}` | agencyConfig | FAIL | HIGH |
| BM-032 | `agency.issuePlace` | `Ô trống` | `{{document.field3}}` | computed | FAIL | HIGH |
| BM-036 | `legalBasis.procedureArticlesLine` | `Ô trống` | `{{document.field8}}` | officialConfig | FAIL | HIGH |
| BM-036 | `recipients.personLine` | `Ô trống` | `{{document.field12}}` | manual | FAIL | HIGH |
| BM-036 | `recipients.archiveLine` | `Ô trống` | `{{document.field13}}` | manual | FAIL | HIGH |
| BM-048 | `agency.coQuan` | `Ô trống` | `{{document.field2}}` | agencyConfig | FAIL | HIGH |
| BM-048 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| BM-048 | `legalBasis.canCu` | `Ô trống` | `{{person.field7}}` | manual | FAIL | HIGH |
| BM-049 | `agency.coQuan` | `Ô trống` | `{{document.field2}}` | agencyConfig | FAIL | HIGH |
| BM-050 | `agency.coQuan` | `Ô trống` | `{{decision.field2}}` | agencyConfig | FAIL | HIGH |
| BM-050 | `agency.diaDanh` | `Ô trống` | `{{document.field3}}` | agencyConfig | FAIL | HIGH |
| BM-052 | `document.fullDocumentCode` | `Ô trống` | `{{decision.field2}}` | manual | FAIL | HIGH |
| BM-062 | `decision.decisionLine` | `Ô trống` | `{{document.field3}}` | computed | FAIL | HIGH |
| BM-065 | `decision.decisionLine` | `Ô trống` | `{{document.field2}}` | computed | FAIL | HIGH |
| BM-066 | `decision.decisionLine` | `Ô trống` | `{{document.field2}}` | computed | FAIL | HIGH |
| BM-068 | `person.dateOfBirth` | `Slot from Wave 02 DOCX remedia` | `{{document.field3}}` | manual | FAIL | HIGH |
| BM-069 | `person.dateOfBirth` | `Slot from Wave 02 DOCX remedia` | `{{document.field3}}` | manual | FAIL | HIGH |
| BM-069 | `person.idNumber` | `Slot from Wave 02 DOCX remedia` | `{{document.field5}}` | manual | FAIL | HIGH |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX remedia` | `{{document.field8}}` | manual | FAIL | HIGH |
| BM-069 | `person.occupation` | `Slot from Wave 02 DOCX remedia` | `{{document.field10}}` | manual | FAIL | HIGH |
| BM-073 | `person.dateOfBirth` | `Slot from Wave 02 DOCX remedia` | `{{document.field3}}` | manual | FAIL | HIGH |
| BM-073 | `person.idNumber` | `Slot from Wave 02 DOCX remedia` | `{{document.field5}}` | manual | FAIL | HIGH |
| BM-074 | `agency.diaDanh` | `Ô trống` | `{{document.field3}}` | agencyConfig | FAIL | HIGH |
| BM-074 | `document.dienThoai` | `Ô trống` | `{{agency.field4}}` | manual | FAIL | HIGH |
| BM-074 | `document.soYeu` | `Ô trống` | `{{agency.field5}}` | manual | FAIL | HIGH |
| BM-076 | `agency.diaDanh` | `Ô trống` | `{{document.field3}}` | agencyConfig | FAIL | HIGH |
| BM-078 | `agency.diaDanh` | `Ô trống` | `{{document.field3}}` | agencyConfig | FAIL | HIGH |
| BM-078 | `document.soThong` | `Ô trống` | `{{agency.field5}}` | manual | FAIL | HIGH |
| BM-081 | `agency.diaDanh` | `Ô trống` | `{{document.field3}}` | agencyConfig | FAIL | HIGH |
| BM-083 | `agency.diaDanh` | `Ô trống` | `{{document.field3}}` | agencyConfig | FAIL | HIGH |
| BM-084 | `agency.diaDanh` | `Ô trống` | `{{document.field3}}` | agencyConfig | FAIL | HIGH |
| BM-087 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| BM-087 | `legalBasis.canCu` | `Ô trống` | `{{document.field7}}` | manual | FAIL | HIGH |
| BM-088 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| BM-091 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| BM-092 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| BM-093 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| BM-094 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| BM-094 | `agency.dongDia` | `Ô trống` | `{{document.field6}}` | agencyConfig | FAIL | HIGH |
| BM-095 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| BM-096 | `agency.diaDanh` | `Ô trống` | `{{document.field4}}` | agencyConfig | FAIL | HIGH |
| ... | | | | | | 121 more |

### SOURCE_MISMATCH (20)

| templateCode | path | label | rawPattern | source | severity | confidence |
|--------------|------|-------|------------|--------|----------|------------|
| BM-013 | `document.ngayBan` | `Ô trống` | `{{case.field6}}` | manual | REVIEW | MEDIUM |
| BM-028 | `legalBasis.canCu` | `Ô trống` | `{{case.field6}}` | manual | REVIEW | MEDIUM |
| BM-028 | `document.soQd` | `Ô trống` | `{{case.field7}}` | manual | REVIEW | MEDIUM |
| BM-028 | `document.ngayQd` | `Ô trống` | `{{case.field8}}` | manual | REVIEW | MEDIUM |
| BM-051 | `document.fullDocumentCode` | `Ô trống` | `{{document.field2}}` | manual | REVIEW | MEDIUM |
| BM-052 | `document.fullDocumentCode` | `Ô trống` | `{{decision.field2}}` | manual | REVIEW | MEDIUM |
| BM-064 | `document.fullDocumentCode` | `Ô trống` | `{{document.field3}}` | manual | REVIEW | MEDIUM |
| BM-076 | `document.dienThoai` | `Ô trống` | `{{case.field4}}` | manual | REVIEW | MEDIUM |
| BM-095 | `document.soQuyet` | `Ô trống` | `{{document.field3}}` | manual | REVIEW | MEDIUM |
| BM-117 | `document.soQuyet` | `Ô trống` | `{{legalBasis.field3}}` | manual | REVIEW | MEDIUM |
| BM-118 | `document.soQuyet` | `Ô trống` | `{{case.field3}}` | manual | REVIEW | MEDIUM |
| BM-126 | `document.ngayBan` | `Ô trống` | `{{document.field5}}` | manual | REVIEW | MEDIUM |
| BM-128 | `document.soQuyet` | `Ô trống` | `{{document.field3}}` | manual | REVIEW | MEDIUM |
| BM-130 | `document.ngayBan` | `Ô trống` | `{{decision.field5}}` | manual | REVIEW | MEDIUM |
| BM-132 | `document.soQuyet` | `Ô trống` | `{{decision.field3}}` | manual | REVIEW | MEDIUM |
| BM-133 | `document.soQuyet` | `Ô trống` | `{{decision.field3}}` | manual | REVIEW | MEDIUM |
| BM-133 | `document.ngayBan` | `Ô trống` | `{{agency.field5}}` | manual | REVIEW | MEDIUM |
| BM-153 | `document.ngayBan` | `Ô trống` | `{{case.field5}}` | manual | REVIEW | MEDIUM |
| BM-154 | `document.ngayBan` | `Ô trống` | `{{document.field5}}` | manual | REVIEW | MEDIUM |
| BM-155 | `document.dieu1` | `Ô trống` | `{{document.field15}}` | manual | REVIEW | MEDIUM |

### REMEDIATION_LEAK (73)

| templateCode | path | label | rawPattern | source | severity | confidence |
|--------------|------|-------|------------|--------|----------|------------|
| BM-051 | `decision.decisionLine3` | `Slot from DOCX remediation` | `{{decision.decisionLine3}` | manual | FAIL | HIGH |
| BM-052 | `decision.decisionLine2` | `Slot from DOCX remediation` | `{{decision.decisionLine2}` | manual | FAIL | HIGH |
| BM-052 | `recipients.personLine6` | `Slot from DOCX remediation` | `{{recipients.personLine6}` | manual | FAIL | HIGH |
| BM-060 | `decision.decisionLine10` | `Slot from DOCX remediation` | `{{decision.decisionLine10` | manual | FAIL | HIGH |
| BM-061 | `recipients.personLine3` | `Slot from DOCX remediation` | `{{recipients.personLine3}` | manual | FAIL | HIGH |
| BM-062 | `decision.decisionLine11` | `Slot from DOCX remediation` | `{{decision.decisionLine11` | manual | FAIL | HIGH |
| BM-062 | `recipients.personLine5` | `Slot from DOCX remediation` | `{{recipients.personLine5}` | manual | FAIL | HIGH |
| BM-063 | `document.fullDocumentCode8` | `Slot from DOCX remediation` | `{{document.fullDocumentCo` | manual | FAIL | HIGH |
| BM-063 | `recipients.personLine5` | `Slot from DOCX remediation` | `{{recipients.personLine5}` | manual | FAIL | HIGH |
| BM-064 | `document.issueDate4` | `Slot from DOCX remediation` | `{{document.issueDate4}}` | manual | FAIL | HIGH |
| BM-065 | `document.fullDocumentCode8` | `Slot from DOCX remediation` | `{{document.fullDocumentCo` | manual | FAIL | HIGH |
| BM-065 | `recipients.personLine3` | `Slot from DOCX remediation` | `{{recipients.personLine3}` | manual | FAIL | HIGH |
| BM-066 | `document.fullDocumentCode4` | `Slot from DOCX remediation` | `{{document.fullDocumentCo` | manual | FAIL | HIGH |
| BM-066 | `recipients.personLine4` | `Slot from DOCX remediation` | `{{recipients.personLine4}` | manual | FAIL | HIGH |
| BM-067 | `document.fullDocumentCode6` | `Slot from DOCX remediation` | `{{document.fullDocumentCo` | manual | FAIL | HIGH |
| BM-067 | `recipients.personLine3` | `Slot from DOCX remediation` | `{{recipients.personLine3}` | manual | FAIL | HIGH |
| BM-068 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX remedia` | `{{document.field1}}` | manual | FAIL | HIGH |
| BM-068 | `document.issueDate` | `Slot from Wave 02 DOCX remedia` | `{{document.field2}}` | manual | FAIL | HIGH |
| BM-068 | `person.dateOfBirth` | `Slot from Wave 02 DOCX remedia` | `{{document.field3}}` | manual | FAIL | HIGH |
| BM-068 | `person.permanentAddress` | `Slot from Wave 02 DOCX remedia` | `{{person.permanentAddress` | manual | FAIL | HIGH |
| BM-068 | `person.permanentAddress2` | `Slot from Wave 02 DOCX remedia` | `{{person.permanentAddress` | manual | FAIL | HIGH |
| BM-068 | `person.occupation` | `Slot from Wave 02 DOCX remedia` | `{{person.occupation}}` | manual | FAIL | HIGH |
| BM-068 | `person.idNumber` | `Slot from Wave 02 DOCX remedia` | `{{person.idNumber}}` | manual | FAIL | HIGH |
| BM-068 | `person.permanentAddress3` | `Slot from Wave 02 DOCX remedia` | `{{person.permanentAddress` | manual | FAIL | HIGH |
| BM-068 | `person.occupation2` | `Slot from Wave 02 DOCX remedia` | `{{person.occupation2}}` | manual | FAIL | HIGH |
| BM-068 | `person.idNumber2` | `Slot from Wave 02 DOCX remedia` | `{{person.idNumber2}}` | manual | FAIL | HIGH |
| BM-068 | `person.temporaryAddress` | `Slot from Wave 02 DOCX remedia` | `{{person.temporaryAddress` | manual | FAIL | HIGH |
| BM-068 | `person.province` | `Slot from Wave 02 DOCX remedia` | `{{person.province}}` | manual | FAIL | HIGH |
| BM-069 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX remedia` | `{{document.field1}}` | manual | FAIL | HIGH |
| BM-069 | `document.issueDate` | `Slot from Wave 02 DOCX remedia` | `{{document.field2}}` | manual | FAIL | HIGH |
| BM-069 | `person.dateOfBirth` | `Slot from Wave 02 DOCX remedia` | `{{document.field3}}` | manual | FAIL | HIGH |
| BM-069 | `person.idNumber` | `Slot from Wave 02 DOCX remedia` | `{{document.field5}}` | manual | FAIL | HIGH |
| BM-069 | `document.reasonLine` | `Slot from Wave 02 DOCX remedia` | `{{document.field6}}` | manual | FAIL | HIGH |
| BM-069 | `document.reasonLine2` | `Slot from Wave 02 DOCX remedia` | `{{document.field7}}` | manual | FAIL | HIGH |
| BM-069 | `person.personFullName` | `Slot from Wave 02 DOCX remedia` | `{{person.personFullName}}` | manual | FAIL | HIGH |
| BM-069 | `person.currentAddress` | `Slot from Wave 02 DOCX remedia` | `{{person.currentAddress}}` | manual | FAIL | HIGH |
| BM-069 | `person.currentAddress2` | `Slot from Wave 02 DOCX remedia` | `{{person.currentAddress2}` | manual | FAIL | HIGH |
| BM-069 | `decision.decisionLine` | `Slot from Wave 02 DOCX remedia` | `{{document.field8}}` | manual | FAIL | HIGH |
| BM-069 | `person.occupation` | `Slot from Wave 02 DOCX remedia` | `{{document.field10}}` | manual | FAIL | HIGH |
| BM-069 | `document.summaryLine` | `Slot from Wave 02 DOCX remedia` | `{{document.field12}}` | manual | FAIL | HIGH |
| BM-073 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX remedia` | `{{document.field1}}` | manual | FAIL | HIGH |
| BM-073 | `document.issueDate` | `Slot from Wave 02 DOCX remedia` | `{{document.field2}}` | manual | FAIL | HIGH |
| BM-073 | `person.dateOfBirth` | `Slot from Wave 02 DOCX remedia` | `{{document.field3}}` | manual | FAIL | HIGH |
| BM-073 | `person.idNumber` | `Slot from Wave 02 DOCX remedia` | `{{document.field5}}` | manual | FAIL | HIGH |
| BM-075 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX remedia` | `{{document.field1}}` | manual | FAIL | HIGH |
| BM-075 | `person.personFullName` | `Slot from Wave 02 DOCX remedia` | `{{person.personFullName}}` | manual | FAIL | HIGH |
| BM-075 | `person.dateOfBirth` | `Slot from Wave 02 DOCX remedia` | `{{person.dateOfBirth}}` | manual | FAIL | HIGH |
| BM-075 | `person.currentAddress` | `Slot from Wave 02 DOCX remedia` | `{{person.currentAddress}}` | manual | FAIL | HIGH |
| BM-077 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX remedia` | `{{document.field1}}` | manual | FAIL | HIGH |
| BM-080 | `document.fullDocumentCode` | `Slot from Wave 02 DOCX remedia` | `{{document.field1}}` | manual | FAIL | HIGH |
| ... | | | | | | 23 more |

## Proposed Fix Plan

- **HIGH confidence auto-fix candidates**: 244
- **MEDIUM confidence / requires review (FAIL)**: 359
- **REVIEW only (not auto-fix)**: 964

### Auto-fix Candidates (HIGH confidence, no human review needed)

| templateCode | path | suggestedPath | suggestedLabel | reason |
|--------------|------|---------------|---------------|--------|
| BM-004 | `agency.diaDanh` | `document.field9}}` | `Địa điểm, ngày lập văn bản` | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-013 | `agency.tenCo` | `document.field3}}` | - | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-013 | `agency.diaDanh` | `document.field5}}` | `Địa điểm, ngày lập văn bản` | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-021 | `agency.issuePlace` | `document.field3}}` | - | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-021 | `decision.summaryLine` | `document.field9}}` | - | rawPattern domain "document" does not match canonical path domain "decision". DO |
| BM-021 | `decision.decisionLine` | `document.field10}}` | - | rawPattern domain "document" does not match canonical path domain "decision". DO |
| BM-022 | `person.fullName` | `document.field7}}` | - | rawPattern domain "document" does not match canonical path domain "person". DOCX |
| BM-025 | `agency.issuePlace` | `document.field3}}` | - | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-027 | `agency.coQuan` | `document.field2}}` | `Cơ quan ra quyết định đề nghị phê chuẩn` | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-028 | `agency.coQuan` | `document.field2}}` | `Cơ quan ra quyết định đề nghị phê chuẩn` | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-032 | `agency.issuePlace` | `document.field3}}` | - | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-036 | `legalBasis.procedureArticlesLine` | `document.field8}}` | - | rawPattern domain "document" does not match canonical path domain "legalBasis".  |
| BM-036 | `recipients.personLine` | `document.field12}}` | - | rawPattern domain "document" does not match canonical path domain "recipients".  |
| BM-036 | `recipients.archiveLine` | `document.field13}}` | - | rawPattern domain "document" does not match canonical path domain "recipients".  |
| BM-048 | `agency.coQuan` | `document.field2}}` | `Cơ quan ra quyết định đề nghị phê chuẩn` | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-048 | `agency.diaDanh` | `document.field4}}` | `Địa điểm, ngày lập văn bản` | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-048 | `legalBasis.canCu` | `person.field7}}` | - | rawPattern domain "person" does not match canonical path domain "legalBasis". DO |
| BM-049 | `agency.coQuan` | `document.field2}}` | `Cơ quan ra quyết định đề nghị phê chuẩn` | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-050 | `agency.coQuan` | `decision.field2}}` | `Cơ quan ra quyết định đề nghị phê chuẩn` | rawPattern domain "decision" does not match canonical path domain "agency". DOCX |
| BM-050 | `agency.diaDanh` | `document.field3}}` | `Địa điểm, ngày lập văn bản` | rawPattern domain "document" does not match canonical path domain "agency". DOCX |
| BM-051 | `decision.decisionLine3` | - | - | Slot label "Slot from DOCX remediation" contains remediation metadata. This leak |
| BM-052 | `document.fullDocumentCode` | `decision.field2}}` | - | rawPattern domain "decision" does not match canonical path domain "document". DO |
| BM-052 | `decision.decisionLine2` | - | - | Slot label "Slot from DOCX remediation" contains remediation metadata. This leak |
| BM-052 | `recipients.personLine6` | - | - | Slot label "Slot from DOCX remediation" contains remediation metadata. This leak |
| BM-060 | `decision.decisionLine10` | - | - | Slot label "Slot from DOCX remediation" contains remediation metadata. This leak |
| BM-061 | `recipients.personLine3` | - | - | Slot label "Slot from DOCX remediation" contains remediation metadata. This leak |
| BM-062 | `decision.decisionLine` | `document.field3}}` | - | rawPattern domain "document" does not match canonical path domain "decision". DO |
| BM-062 | `decision.decisionLine11` | - | - | Slot label "Slot from DOCX remediation" contains remediation metadata. This leak |
| BM-062 | `recipients.personLine5` | - | - | Slot label "Slot from DOCX remediation" contains remediation metadata. This leak |
| BM-063 | `document.fullDocumentCode8` | - | - | Slot label "Slot from DOCX remediation" contains remediation metadata. This leak |
| ... | | | | 214 more |

### Manual Review Required

| templateCode | path | issueCode | reason |
|--------------|------|----------|--------|
| BM-001 | `document.issuePlaceDateLine` | BAD_LABEL | Canonical field label is "issuePlaceDateLine" (raw camelCase no Vietnamese). Thi |
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
| BM-001 | `receiver.positionTitle` | COMPILED_DRIFT | dataSource drift: locked="officialConfig" vs compiled="OFFICIAL". |
| ... | | | 934 more |

