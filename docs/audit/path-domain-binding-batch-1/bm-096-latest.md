# PATH_DOMAIN_BINDING Batch 1 - BM-096 Analysis

**Generated:** 2026-06-28T02:15:00.000Z
**Mode:** Evidence-only (NO mutations)

## Integrity Fix Applied

**Fixed at:** 2026-06-28T02:15:00.000Z

**Issue:** `signature.cheDo` and `signature.nguoiKy` were marked as `SAFE_LABEL_CLEANUP` but are path/domain mismatches. Path is `signature.*` but label is person address (`Nơi thường trú`, `Nơi tạm trú`). This is NOT label-only cleanup.

**Fix:**
- Downgraded `signature.cheDo` from `SAFE_LABEL_CLEANUP` to `DEFER_PATH_DOMAIN_MISMATCH`
- Downgraded `signature.nguoiKy` from `SAFE_LABEL_CLEANUP` to `DEFER_PATH_DOMAIN_MISMATCH`
- Kept `document.diaChi -> person.idNumber` as `SAFE_PATH_REMAP` because `person.idNumber` does not exist in BM-096 (collision-free)

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Total Paths with Issues | 16 | 16 |
| **SAFE_LABEL_CLEANUP** | **2** | **0** |
| **SAFE_PATH_REMAP** | **1** | **1** |
| **DEFERRED** | **13** | **15** |
| **approvedForBatch1** | **3** | **1** |

## Before vs After

| Path | Before | After | Reason |
|------|--------|-------|--------|
| signature.cheDo | SAFE_LABEL_CLEANUP | DEFER_PATH_DOMAIN_MISMATCH | Path is signature.* but label is Nơi thường trú (person address) |
| signature.nguoiKy | SAFE_LABEL_CLEANUP | DEFER_PATH_DOMAIN_MISMATCH | Path is signature.* but label is Nơi tạm trú (person address) |
| document.diaChi | SAFE_PATH_REMAP | SAFE_PATH_REMAP | Kept - person.idNumber collision-free in BM-096 |

## Evidence Analysis

| Path | Current Label | textBefore | Extracted Label | Proposed | Confidence | Classification |
|------|--------------|-----------|----------------|---------|------------|----------------|
| document.soYeu | Ô trống | Xét thấy8 | Xét thấy | TBD | LOW | DEFER_REQUIRES_MANUAL_REVIEW |
| agency.diaDanh | Ô trống | Xét thấy8{{document.field3}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| document.ngayBan | Ô trống | Xét thấy8... | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| agency.dongDia | Ô trống | (empty) | NONE | TBD | NONE | DEFER_REQUIRES_MANUAL_REVIEW |
| document.chuThe | Ô trống | {{document.field7}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| legalBasis.canCu | Ô trống | (empty) | NONE | TBD | NONE | DEFER_REQUIRES_MANUAL_REVIEW |
| document.tenVu | Ô trống | {{document.field9}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| person.toiDanh | Ô trống | (empty) | NONE | TBD | NONE | DEFER_REQUIRES_MANUAL_REVIEW |
| person.hoTen | Ô trống | {{document.field11}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| document.namSinh | Ô trống | Nghề nghiệp: | Nghề nghiệp: | TBD | LOW | DEFER_REQUIRES_MANUAL_REVIEW |
| **document.diaChi** | **Ô trống** | **Số CMND/Thẻ CCCD/...** | **Số CMND/...** | **Số CCCD/CMND** | **MEDIUM** | **SAFE_PATH_REMAP** |
| document.lyDo | Ô trống | C | C | TBD | NONE | DEFER_REQUIRES_MANUAL_REVIEW |
| recipients.luuHo | Ô trống | C{{document.field15}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| signature.cheDo | Ô trống | Nơi thường trú: | Nơi thường trú: | TBD | MEDIUM | DEFER_PATH_DOMAIN_MISMATCH |
| signature.chucVu | Ô trống | Nơi thường trú: {{document.field17}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| signature.nguoiKy | Ô trống | Nơi tạm trú: | Nơi tạm trú: | TBD | MEDIUM | DEFER_PATH_DOMAIN_MISMATCH |

## Safe Path Remap Candidates (1)

| Path | Current Label | Proposed Path | Proposed Label | Rationale |
|------|--------------|---------------|---------------|----------|
| document.diaChi | Ô trống | person.idNumber | Số CCCD/CMND | Clear ID number label. person.idNumber does not exist in BM-096 (collision-free). |

## Deferred Candidates (15)

| Path | Classification | Rationale |
|------|---------------|----------|
| document.soYeu | DEFER_REQUIRES_MANUAL_REVIEW | Label 'Xét thấy' not in approved semantic list |
| agency.diaDanh | DEFER_NO_VISIBLE_LABEL | textBefore only has field codes |
| document.ngayBan | DEFER_NO_VISIBLE_LABEL | textBefore only has field codes |
| agency.dongDia | DEFER_REQUIRES_MANUAL_REVIEW | No clear evidence |
| document.chuThe | DEFER_NO_VISIBLE_LABEL | textBefore only has field codes |
| legalBasis.canCu | DEFER_REQUIRES_MANUAL_REVIEW | No clear evidence |
| document.tenVu | DEFER_NO_VISIBLE_LABEL | textBefore only has field codes |
| person.toiDanh | DEFER_REQUIRES_MANUAL_REVIEW | No clear evidence |
| person.hoTen | DEFER_NO_VISIBLE_LABEL | textBefore only has field codes |
| document.namSinh | DEFER_REQUIRES_MANUAL_REVIEW | Label 'Nghề nghiệp' but path 'document.namSinh' means birth year |
| document.lyDo | DEFER_REQUIRES_MANUAL_REVIEW | No clear evidence |
| recipients.luuHo | DEFER_NO_VISIBLE_LABEL | textBefore only has field codes |
| signature.cheDo | DEFER_PATH_DOMAIN_MISMATCH | Path is signature.* but label is Nơi thường trú (person address) |
| signature.chucVu | DEFER_NO_VISIBLE_LABEL | textBefore only has field codes |
| signature.nguoiKy | DEFER_PATH_DOMAIN_MISMATCH | Path is signature.* but label is Nơi tạm trú (person address) |

## Batch 1 Status

**Candidates for Batch 1:** 1

| Candidate | Type | Safety |
|-----------|------|--------|
| document.diaChi → person.idNumber | SAFE_PATH_REMAP | Collision-free in BM-096 |

## Guard Rules Enforced

| Rule | Description |
|------|-------------|
| SAFE_LABEL_CLEANUP_DOMAIN_CHECK | Path starting with `signature.` cannot receive labels like `Nơi thường trú`, `Nơi tạm trú`, `Số CCCD/CMND`, `Nghề nghiệp` |
| SAFE_PATH_REMAP_COLLISION_CHECK | Target path must not already exist, or merge must be explicitly safe |

---
*Evidence-only analysis. No mutations applied.*
