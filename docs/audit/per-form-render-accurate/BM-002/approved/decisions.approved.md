# Per-Form Render Accurate — BM-002 Approved Decision

Generated: 2026-06-27T16:10:00.000Z
Task: PER_FORM_RENDER_ACCURATE_BM002_APPROVED_DECISION

---

## Approval

| Field | Value |
|-------|-------|
| Command | `APPROVE_RENDER_ACCURATE_FORM BM-002 f78301178da7 SAFE_LABEL_ONLY` |
| Status | **APPROVED_FOR_APPLY** |
| Template Code | BM-002 |
| Source ID | f78301178da7 |
| Patch Type | SAFE_LABEL_ONLY |
| Patch Plan | `docs/audit/per-form-render-accurate/BM-002/patch-plan.latest.json` |

---

## Scope Constraints

> **docxSlots labels are NOT modified in this task.**
> docxSlots label misalignment is tracked for separate consistency cleanup.
> docxSlots labels do NOT trigger any audit issues — the audit reads `canonicalFields[].label` only.

---

## Changes

| Metric | Value |
|--------|-------|
| Logical fixes | 10 |
| Physical JSON edits | 10 |
| Target array | `canonicalFields` |
| Target field | `canonicalFields[N].label` |
| docxSlots changed | **0** |
| renderBindings changed | **0** |
| Paths changed | **0** |
| Fields added | **0** |
| Fields removed | **0** |
| DOCX mutated | **0** |
| Source mutated | **0** |
| Compiled artifacts edited | **0** |

---

## Exact Label Changes

| # | Path | Old Label | **New Label** | Index |
|---|------|-----------|--------------|-------|
| 1 | `document.issuePlaceAndDateLine` | issuePlaceAndDateLine | **Địa điểm, ngày tháng năm** | 3 |
| 2 | `sourceReport.receivedDateLine` | receivedDateLine | **Ngày tiếp nhận** | 5 |
| 3 | `reporter.genderText` | genderText | **Giới tính** | 8 |
| 4 | `reporter.otherName` | otherName | **Tên gọi khác** | 9 |
| 5 | `reporter.birthDateLine` | birthDateLine | **Sinh ngày** | 10 |
| 6 | `reporter.identityIssueDateLine` | identityIssueDateLine | **Cấp ngày** | 17 |
| 7 | `reporter.organizationRepresentative` | organizationRepresentative | **Người đại diện cơ quan, tổ chức** | 23 |
| 8 | `sourceReport.content` | content | **Nội dung** | 24 |
| 9 | `recipients.primaryLine` | primaryLine | **Nơi nhận** | 25 |
| 10 | `recipients.archiveLine` | archiveLine | **Nơi lưu** | 26 |

---

## Expected Audit Delta

| Metric | Delta |
|--------|-------|
| BAD_LABEL | **-10** |
| UI_VISIBLE_BAD_METADATA | **-9** |
| Render output changed | **false** |

---

## Rollback

Restore locked contract from backup directory.

---

_Decision auto-generated from approved patch plan. Do not edit manually._
