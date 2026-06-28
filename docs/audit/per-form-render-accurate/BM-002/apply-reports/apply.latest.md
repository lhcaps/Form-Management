# BM-002 SAFE_LABEL_ONLY Apply Report

Generated: 2026-06-27T16:12:00.000Z
Task: APPLY_BM002_SAFE_LABEL_ONLY_APPLY_REPORT
Approval: `APPROVE_RENDER_ACCURATE_FORM BM-002 f78301178da7 SAFE_LABEL_ONLY`

---

## Apply Status: ✅ SUCCESS

---

## Dry-Run Summary

| Metric | Value |
|--------|-------|
| File | `docs/audit/docx/contracts/locked/BM-002__f78301178da7.contract.locked.json` |
| Logical label fixes | 10 |
| Physical JSON edits | 10 |
| Target array | `canonicalFields` |
| docxSlots changed | 0 |
| renderBindings changed | 0 |
| Paths changed | 0 |
| Fields added | 0 |
| Fields removed | 0 |
| DOCX touched | 0 |
| Source touched | 0 |
| Compiled edited | 0 |
| Errors | 0 |

---

## Write Summary

| Metric | Value |
|--------|-------|
| File modified | `BM-002__f78301178da7.contract.locked.json` |
| Changes | 10 label-only edits |
| Target array | `canonicalFields` |
| Backup | `docs/audit/per-form-render-accurate/BM-002/backups/2026-06-27T09-10-56/` |
| Original SHA256 | `a956610c...` |
| New SHA256 | `558e9620...` |
| Post-write verification | **PASSED** |

---

## Label Changes

| # | Path | `canonicalFields[N].label` | Before | After |
|---|------|---------|--------|-------|
| 1 | `document.issuePlaceAndDateLine` | [3] | `issuePlaceAndDateLine` | `Địa điểm, ngày tháng năm` |
| 2 | `sourceReport.receivedDateLine` | [5] | `receivedDateLine` | `Ngày tiếp nhận` |
| 3 | `reporter.genderText` | [8] | `genderText` | `Giới tính` |
| 4 | `reporter.otherName` | [9] | `otherName` | `Tên gọi khác` |
| 5 | `reporter.birthDateLine` | [10] | `birthDateLine` | `Sinh ngày` |
| 6 | `reporter.identityIssueDateLine` | [17] | `identityIssueDateLine` | `Cấp ngày` |
| 7 | `reporter.organizationRepresentative` | [23] | `organizationRepresentative` | `Người đại diện cơ quan, tổ chức` |
| 8 | `sourceReport.content` | [24] | `content` | `Nội dung` |
| 9 | `recipients.primaryLine` | [25] | `primaryLine` | `Nơi nhận` |
| 10 | `recipients.archiveLine` | [26] | `archiveLine` | `Nơi lưu` |

---

## Safety Counters

| Check | Value |
|-------|-------|
| docxSlots changed | **0** |
| renderBindings changed | **0** |
| Paths changed | **0** |
| Fields added | **0** |
| Fields removed | **0** |
| DOCX touched | **0** |
| Source touched | **0** |
| Compiled artifacts edited | **0** |

> **Note:** docxSlots label misalignment was NOT fixed in this task.
> docxSlots labels remain misaligned (swapped labels for several slots).
> This is tracked for a separate consistency cleanup task.

---

## Audit Deltas — BM-002

| Metric | Before | After | Delta | Expected |
|--------|--------|-------|-------|---------|
| `BAD_LABEL` | 10 | **0** | **-10 ✅** | -10 |
| `UI_VISIBLE_BAD_METADATA` | 9 | **0** | **-9 ✅** | -9 |
| Total issues | 51 | 42 | -9 | — |

All primary targets achieved.

---

## Validation

| Check | Result |
|-------|--------|
| Render text fidelity (BM-002) | **PASS** — textLengthRatio=0.979, 0 unreplaced placeholders, 0 missing anchors |
| Binding correctness (corpus) | **PASS** — BM-002 in 212 PASS cohort |
| `pnpm typecheck` | **exit 0** |

---

_Apply report auto-generated. Do not edit manually._
