# PATH_DOMAIN_BINDING Batch 1 - BM-096 Analysis

**Generated:** 2026-06-27T19:11:06.853Z
**Mode:** Evidence-only (NO mutations)

## Summary

| Metric | Value |
|--------|-------|
| Total Paths with Issues | 16 |
| **SAFE_LABEL_CLEANUP** | **2** |
| **SAFE_PATH_REMAP** | **1** |
| **DEFERRED** | **13** |

## Evidence Analysis

| Path | Current Label | textBefore | Extracted Label | Proposed | Confidence | Classification |
|------|--------------|-----------|----------------|---------|------------|----------------|
| document.soYeu | Ô trống | Xét thấy8 | Xét thấy | Xét thấy | LOW | DEFER_REQUIRES_MANUAL_REVIEW |
| agency.diaDanh | Ô trống | Xét thấy8{{document.field3}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| document.ngayBan | Ô trống | Xét thấy8{{document.field3}}{{ | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| agency.dongDia | Ô trống |  | NONE | TBD | NONE | DEFER_REQUIRES_MANUAL_REVIEW |
| document.chuThe | Ô trống | {{document.field7}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| legalBasis.canCu | Ô trống |  | NONE | TBD | NONE | DEFER_REQUIRES_MANUAL_REVIEW |
| document.tenVu | Ô trống | {{document.field9}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| person.toiDanh | Ô trống |  | NONE | TBD | NONE | DEFER_REQUIRES_MANUAL_REVIEW |
| person.hoTen | Ô trống | {{document.field11}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| document.namSinh | Ô trống | Nghề nghiệp: | Nghề nghiệp: | Nghề nghiệp: | LOW | DEFER_REQUIRES_MANUAL_REVIEW |
| document.diaChi | Ô trống | Số CMND/Thẻ CCCD/Thẻ CC/Hộ chi | Số CMND/Thẻ CCCD/Thẻ CC/Hộ chiếu: | Số CCCD/CMND | MEDIUM | SAFE_PATH_REMAP |
| document.lyDo | Ô trống | C | C | TBD | NONE | DEFER_REQUIRES_MANUAL_REVIEW |
| recipients.luuHo | Ô trống | C{{document.field15}} | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| signature.cheDo | Ô trống | Nơi thường trú: | Nơi thường trú: | Nơi thường trú: | MEDIUM | SAFE_LABEL_CLEANUP |
| signature.chucVu | Ô trống | Nơi thường trú: {{document.fie | NONE | TBD | NONE | DEFER_NO_VISIBLE_LABEL |
| signature.nguoiKy | Ô trống | Nơi tạm trú: | Nơi tạm trú: | Nơi tạm trú: | MEDIUM | SAFE_LABEL_CLEANUP |

## Safe Label Cleanup Candidates (2)

| Path | Current Label | Proposed Label | Rationale |
|------|--------------|----------------|------------|
| signature.cheDo | Ô trống | Nơi thường trú: | Clear address label found. |
| signature.nguoiKy | Ô trống | Nơi tạm trú: | Clear address label found. |

## Safe Path Remap Candidates (1)

| Path | Current Label | Proposed Path | Proposed Label | Rationale |
|------|--------------|----------------|----------------|------------|
| document.diaChi | Ô trống | person.idNumber | Số CCCD/CMND | Clear ID number label. Path should be person.idNumber. |

## Deferred Candidates (13)

| Path | Current Label | Classification | Rationale |
|------|--------------|----------------|------------|
| document.soYeu | Ô trống | DEFER_REQUIRES_MANUAL_REVIEW | Label "Xét thấy" found but not in approved semantic list. Need domain review. |
| agency.diaDanh | Ô trống | DEFER_NO_VISIBLE_LABEL | textBefore only contains field codes. No visible label found. |
| document.ngayBan | Ô trống | DEFER_NO_VISIBLE_LABEL | textBefore only contains field codes. No visible label found. |
| agency.dongDia | Ô trống | DEFER_REQUIRES_MANUAL_REVIEW | No clear evidence for semantic determination. |
| document.chuThe | Ô trống | DEFER_NO_VISIBLE_LABEL | textBefore only contains field codes. No visible label found. |
| legalBasis.canCu | Ô trống | DEFER_REQUIRES_MANUAL_REVIEW | No clear evidence for semantic determination. |
| document.tenVu | Ô trống | DEFER_NO_VISIBLE_LABEL | textBefore only contains field codes. No visible label found. |
| person.toiDanh | Ô trống | DEFER_REQUIRES_MANUAL_REVIEW | No clear evidence for semantic determination. |
| person.hoTen | Ô trống | DEFER_NO_VISIBLE_LABEL | textBefore only contains field codes. No visible label found. |
| document.namSinh | Ô trống | DEFER_REQUIRES_MANUAL_REVIEW | Label suggests occupation but path "document.namSinh" may not match. Need domain expert review. |
| document.lyDo | Ô trống | DEFER_REQUIRES_MANUAL_REVIEW | No clear evidence for semantic determination. |
| recipients.luuHo | Ô trống | DEFER_NO_VISIBLE_LABEL | textBefore only contains field codes. No visible label found. |
| signature.chucVu | Ô trống | DEFER_NO_VISIBLE_LABEL | textBefore only contains field codes. No visible label found. |

## Batch 1 Status

**Candidates for Batch 1:** 3

---
*Evidence-only analysis. No mutations applied.*