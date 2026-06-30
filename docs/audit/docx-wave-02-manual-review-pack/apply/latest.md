# Wave 02 Manual Review Apply Report
Generated: 2026-06-26T17:26:56.044Z
Mode: **dry-run**

## Summary

| Metric | Value |
|--------|-------|
| Planned | 0 |
| Applied | 0 |
| Skipped (idempotent) | 32 |
| Skipped (decision) | 0 |
| Failed | 0 |
| Changed contracts | 0 |

## Skipped (Idempotent)

- W2R-003 BM-068::person.dateOfBirth: SKIPPED_IDEMPOTENT: label already "Ngày sinh"
- W2R-015 BM-069::person.dateOfBirth: SKIPPED_IDEMPOTENT: label already "Ngày sinh"
- W2R-016 BM-069::person.idNumber: SKIPPED_IDEMPOTENT: label already "Số CCCD/CMND"
- W2R-023 BM-069::person.occupation: SKIPPED_IDEMPOTENT: label already "Nghề nghiệp"
- W2R-001 BM-068::document.fullDocumentCode: SKIPPED_IDEMPOTENT: label already "Số/Ký hiệu văn bản"
- W2R-002 BM-068::document.issueDate: SKIPPED_IDEMPOTENT: label already "Ngày ban hành"
- W2R-004 BM-068::person.permanentAddress: SKIPPED_IDEMPOTENT: label already "Nơi thường trú"
- W2R-005 BM-068::person.permanentAddress2: SKIPPED_IDEMPOTENT: label already "Nơi thường trú"
- W2R-006 BM-068::person.occupation: SKIPPED_IDEMPOTENT: label already "Nghề nghiệp"
- W2R-007 BM-068::person.idNumber: SKIPPED_IDEMPOTENT: label already "Số CCCD/CMND"
- W2R-008 BM-068::person.permanentAddress3: SKIPPED_IDEMPOTENT: label already "Nơi thường trú"
- W2R-009 BM-068::person.occupation2: SKIPPED_IDEMPOTENT: label already "Nghề nghiệp"
- W2R-010 BM-068::person.idNumber2: SKIPPED_IDEMPOTENT: label already "Số CCCD/CMND"
- W2R-011 BM-068::person.temporaryAddress: SKIPPED_IDEMPOTENT: label already "Nơi tạm trú"
- W2R-012 BM-068::person.province: SKIPPED_IDEMPOTENT: label already "Tỉnh/Thành phố"
- W2R-014 BM-069::document.issueDate: SKIPPED_IDEMPOTENT: label already "Ngày lập biên bản"
- W2R-019 BM-069::person.personFullName: SKIPPED_IDEMPOTENT: label already "Họ tên"
- W2R-020 BM-069::person.currentAddress: SKIPPED_IDEMPOTENT: label already "Nơi ở hiện tại"
- W2R-021 BM-069::person.currentAddress2: SKIPPED_IDEMPOTENT: label already "Nơi ở hiện tại"
- W2R-041 BM-162::document.fullDocumentCode: SKIPPED_IDEMPOTENT: label already "Số/Ký hiệu văn bản"
- W2R-042 BM-162::document.issueDate: SKIPPED_IDEMPOTENT: label already "Ngày tháng năm"
- W2R-044 BM-162::person.personFullName: SKIPPED_IDEMPOTENT: label already "Họ tên"
- W2R-045 BM-162::person.currentAddress: SKIPPED_IDEMPOTENT: label already "Nơi ở hiện nay"
- W2R-046 BM-162::person.occupation: SKIPPED_IDEMPOTENT: label already "Nghề nghiệp"
- W2R-047 BM-162::person.idNumber: SKIPPED_IDEMPOTENT: label already "Số CCCD/CMND"
- W2R-048 BM-163::document.fullDocumentCode: SKIPPED_IDEMPOTENT: label already "Số/Ký hiệu văn bản"
- W2R-049 BM-163::document.issueDate: SKIPPED_IDEMPOTENT: label already "Ngày tháng năm"
- W2R-051 BM-163::person.personFullName: SKIPPED_IDEMPOTENT: label already "Họ tên"
- W2R-055 BM-163::person.idNumber: SKIPPED_IDEMPOTENT: label already "Số CCCD/CMND"
- W2R-030 BM-075::person.personFullName: SKIPPED_IDEMPOTENT: label already "Họ tên"
- W2R-034 BM-080::document.fullDocumentCode: SKIPPED_IDEMPOTENT: label already "Số/Ký hiệu văn bản"
- W2R-035 BM-080::document.issueDate: SKIPPED_IDEMPOTENT: label already "Ngày tháng năm"

## Validation Commands

After write mode, run:

```bash
pnpm audit:forms-root-cause
pnpm typecheck
```
