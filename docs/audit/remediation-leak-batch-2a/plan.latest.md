# REMEDIATION_LEAK Batch 2A - Bad Canonical Label Cleanup

Generated: 2026-06-27T18:22:44.488Z

## Scope
- Issue: REMEDIATION_LEAK with DEFERRED_BAD_CANONICAL_LABEL
- Max BMs: 5 | Max mutations: 20

## Bucket Summary

| Bucket | Count |
|--------|-------|
| UPDATE_CANONICAL_THEN_SLOT | 20 |
| UPDATE_SLOT_LABEL_TO_CANONICAL | 0 |
| DEFERRED_CONFLICTING_FIELD_ISSUES | 10 |
| DEFERRED_DOCX_REVIEW | 0 |

## Batch Candidates

| BM | Path | Canonical Before | Canonical After | Risk |
|---|------|-----------------|----------------|------|
| BM-051 | decision.decisionLine3 | Slot from DOCX remediation | Địa điểm, ngày lập | LOW |
| BM-052 | decision.decisionLine2 | Slot from DOCX remediation | Địa điểm, ngày lập | LOW |
| BM-060 | decision.decisionLine10 | Slot from DOCX remediation | Địa điểm, ngày lập | LOW |
| BM-061 | recipients.personLine3 | Slot from DOCX remediation | Người nhận | LOW |
| BM-062 | decision.decisionLine11 | Slot from DOCX remediation | Địa điểm, ngày lập | LOW |
| BM-063 | recipients.personLine5 | Slot from DOCX remediation | Người nhận | LOW |
| BM-065 | document.fullDocumentCode8 | Slot from DOCX remediation | Số văn bản | LOW |
| BM-065 | recipients.personLine3 | Slot from DOCX remediation | Người nhận | LOW |
| BM-066 | document.fullDocumentCode4 | Slot from DOCX remediation | Số văn bản | LOW |
| BM-067 | document.fullDocumentCode6 | Slot from DOCX remediation | Số văn bản | LOW |
| BM-067 | recipients.personLine3 | Slot from DOCX remediation | Người nhận | LOW |
| BM-075 | person.currentAddress | Slot from Wave 02 DOCX remediation | Nơi ở hiện tại | LOW |
| BM-075 | person.dateOfBirth | Slot from Wave 02 DOCX remediation | Ngày sinh | LOW |
| BM-080 | legalBasis.legalBasisLine | Slot from Wave 02 DOCX remediation | Căn cứ pháp lý | LOW |
| BM-080 | person.currentAddress | Slot from Wave 02 DOCX remediation | Nơi ở hiện tại | LOW |
| BM-080 | person.dateOfBirth | Slot from Wave 02 DOCX remediation | Ngày sinh | LOW |
| BM-163 | case.caseNumber | Slot from Wave 02 DOCX remediation | Số vụ án | LOW |
| BM-163 | person.occupation | Slot from Wave 02 DOCX remediation | Nghề nghiệp | LOW |
| BM-163 | person.province | Slot from Wave 02 DOCX remediation | Tỉnh/Thành phố | LOW |
| BM-163 | person.ward | Slot from Wave 02 DOCX remediation | Phường/Xã | LOW |

## All Candidates (Reference)

| BM | Path | Canonical Before | Canonical After |
|---|------|-----------------|----------------|
| BM-051 | decision.decisionLine3 | Slot from DOCX remediation | Địa điểm, ngày lập |
| BM-052 | decision.decisionLine2 | Slot from DOCX remediation | Địa điểm, ngày lập |
| BM-060 | decision.decisionLine10 | Slot from DOCX remediation | Địa điểm, ngày lập |
| BM-061 | recipients.personLine3 | Slot from DOCX remediation | Người nhận |
| BM-062 | decision.decisionLine11 | Slot from DOCX remediation | Địa điểm, ngày lập |
| BM-063 | recipients.personLine5 | Slot from DOCX remediation | Người nhận |
| BM-065 | document.fullDocumentCode8 | Slot from DOCX remediation | Số văn bản |
| BM-065 | recipients.personLine3 | Slot from DOCX remediation | Người nhận |
| BM-066 | document.fullDocumentCode4 | Slot from DOCX remediation | Số văn bản |
| BM-067 | document.fullDocumentCode6 | Slot from DOCX remediation | Số văn bản |
| BM-067 | recipients.personLine3 | Slot from DOCX remediation | Người nhận |
| BM-075 | person.currentAddress | Slot from Wave 02 DOCX remediation | Nơi ở hiện tại |
| BM-075 | person.dateOfBirth | Slot from Wave 02 DOCX remediation | Ngày sinh |
| BM-080 | legalBasis.legalBasisLine | Slot from Wave 02 DOCX remediation | Căn cứ pháp lý |
| BM-080 | person.currentAddress | Slot from Wave 02 DOCX remediation | Nơi ở hiện tại |
| BM-080 | person.dateOfBirth | Slot from Wave 02 DOCX remediation | Ngày sinh |
| BM-163 | case.caseNumber | Slot from Wave 02 DOCX remediation | Số vụ án |
| BM-163 | person.occupation | Slot from Wave 02 DOCX remediation | Nghề nghiệp |
| BM-163 | person.province | Slot from Wave 02 DOCX remediation | Tỉnh/Thành phố |
| BM-163 | person.ward | Slot from Wave 02 DOCX remediation | Phường/Xã |