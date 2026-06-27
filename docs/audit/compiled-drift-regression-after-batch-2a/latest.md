# COMPILED_DRIFT Regression Analysis - After Batch 2A

Generated: 2026-06-27T18:35:35.559Z

## Summary

| Metric | Value |
|--------|-------|
| Total COMPILED_DRIFT | 37 |
| Baseline | 37 |
| Regression Was Transient | YES |

## Drift Type Breakdown

| Type | Count |
|------|-------|
| LABEL_DRIFT | 37 |

## Transient Explanation

The +20 COMPILED_DRIFT increase observed immediately after Batch 2A apply was **transient**.

**Root cause**: Audit ran before official compile - compiled artifacts had old hashes.

**Resolution**: After `pnpm --filter @qllaw/form-contracts contract:compile`, COMPILED_DRIFT returned to baseline 37.

## Recommendation

- COMPILED_DRIFT back to baseline: **no fix needed**
- Batch 2B can proceed: **YES**

## All Drift Items

| BM | Path | Drift Type | Locked Label | Compiled Label | Locked Source | Compiled Source |
|---|------|-----------|--------------|---------------|--------------|----------------|
| BM-021 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-021 | document.issueDate | LABEL_DRIFT | Ngày ban hành | N/A | computed | N/A |
| BM-021 | agency.issuePlace | LABEL_DRIFT | Ô trống | N/A | computed | N/A |
| BM-021 | decision.summaryLine | LABEL_DRIFT | Ô trống | N/A | computed | N/A |
| BM-022 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-024 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-024 | agency.issuePlace | LABEL_DRIFT | Viện kiểm sát ban hành | N/A | computed | N/A |
| BM-025 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-025 | agency.issuePlace | LABEL_DRIFT | Ô trống | N/A | computed | N/A |
| BM-026 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-032 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-032 | agency.issuePlace | LABEL_DRIFT | Ô trống | N/A | computed | N/A |
| BM-033 | agency.parentNameUpper | LABEL_DRIFT | Cơ quan cấp trên | N/A | computed | N/A |
| BM-034 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-034 | agency.issuePlace | LABEL_DRIFT | Nội dung quyết định (${"không phê chuẩn Quyết định gia hạn tạm giữ"}) | N/A | computed | N/A |
| BM-035 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-036 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-036 | document.issueDate | LABEL_DRIFT | Ngày ban hành | N/A | computed | N/A |
| BM-036 | decision.summaryLine | LABEL_DRIFT | Cơ quan cấp trên | N/A | computed | N/A |
| BM-038 | agency.parentNameUpper | LABEL_DRIFT | Cơ quan cấp trên (viết hoa) | N/A | computed | N/A |
| BM-039 | agency.parentNameUpper | LABEL_DRIFT | Cơ quan cấp trên (IN HOA) | N/A | computed | N/A |
| BM-041 | agency.parentNameUpper | LABEL_DRIFT | Tên cơ quan | N/A | computed | N/A |
| BM-041 | agency.issuePlace | LABEL_DRIFT | Số quyết định | N/A | computed | N/A |
| BM-044 | agency.parentNameUpper | LABEL_DRIFT | Cơ quan cấp trên (viết hoa) | N/A | computed | N/A |
| BM-045 | agency.parentNameUpper | LABEL_DRIFT | Cơ quan cấp trên (viết hoa) | N/A | computed | N/A |
| BM-058 | document.issuePlaceAndDateLine | LABEL_DRIFT | Địa danh, ngày ban hành | N/A | computed | N/A |
| BM-058 | person.dateOfBirthText | LABEL_DRIFT | Ngày sinh | N/A | computed | N/A |
| BM-058 | measure.detentionFromDateText | LABEL_DRIFT | Tạm giam từ ngày | N/A | computed | N/A |
| BM-058 | measure.detentionToDateText | LABEL_DRIFT | Tạm giam đến ngày | N/A | computed | N/A |
| BM-062 | decision.decisionLine | LABEL_DRIFT | Ô trống | N/A | computed | N/A |
| BM-063 | document.issuePlaceAndDateLine | LABEL_DRIFT | Ô trống | N/A | computed | N/A |
| BM-065 | decision.decisionLine | LABEL_DRIFT | Ô trống | N/A | computed | N/A |
| BM-066 | decision.decisionLine | LABEL_DRIFT | Ô trống | N/A | computed | N/A |
| BM-126 | decision.summaryLine | LABEL_DRIFT | Tóm tắt hồ sơ | N/A | computed | N/A |
| BM-213 | document.issuePlaceAndDateLine | LABEL_DRIFT | Địa danh, ngày ban hành | N/A | computed | N/A |
| BM-213 | person.dateOfBirthText | LABEL_DRIFT | Ngày sinh | N/A | computed | N/A |
| BM-213 | person.identityIssueLine | LABEL_DRIFT | Ngày cấp và nơi cấp giấy tờ | N/A | computed | N/A |