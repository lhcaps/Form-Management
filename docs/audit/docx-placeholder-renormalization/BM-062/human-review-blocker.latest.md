# BM-062 Human Review Blocker Ledger

**Task:** BM062_SIGNATURE_FOOTER_PLACEHOLDER_RENORMALIZATION_APPROVED_APPLY
**Template:** BM-062
**Date:** 2026-06-28
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW

---

## Apply Outcome

| Field | Value |
|---|---|
| Approved decision | BM062-SIG-FOOTER-001 |
| Change applied | `recipients.personLine5` (occ 4) → `signature.signerName` |
| Applied at | 2026-06-28T09:20:37.405Z |
| Backup | `approved-signature/backups/2026-06-28T09-20-37-405Z/` |

---

## Deferred — 15 occurrences blocked by human DOCX/legal review

### decision.decisionLine11 — 11 occurrences

| | |
|---|---|
| Occurrences | 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| Classification | `DEFER_AMBIGUOUS_DECISION_LINE` |
| Reason | Namespace mismatch: `decision.decisionLine11` appears 11 times with only 1 slot. Semantic context varies across document sections — some may be person-table cells, some decision lines. Cannot bind as single field. |
| Visible labels | "Nơi nhận:", "Cơ quan quản lý đăng ký", "cơ quan có thẩm quyền" |
| Requires | Human DOCX/legal review to determine per-occurrence semantics |
| Can merge? | **No** — risk of incorrect binding across unrelated sections |
| Risk | Forcing merge would bind unrelated document sections to single field |

### recipients.personLine5 body — 4 occurrences

| | |
|---|---|
| Occurrences | 0, 1, 2, 3 |
| Classification | `DEFER_AMBIGUOUS_PERSON_TABLE_CELL` |
| Reason | Blank person-table cells in body rows. Each may represent different roles (người lập biên bản, người vi phạm, etc.). Cannot merge 4 distinct cells into one field. |
| Visible labels | "Họ tên", "Nghề nghiệp", "Địa điểm", "ngày lập" |
| Requires | Human DOCX/legal review to determine per-cell role and appropriate semantic field |
| Can merge? | **No** — four distinct person-table cells |
| Risk | Forcing merge would collapse 4 cells to 1 field |

---

## Render Gate Status

**FAIL** — render gate remains failing after footer apply.

Render gate still fails because:
- `recipients.personLine5` has 4 remaining occurrences (occ 0-3) without slots/bindings
- `decision.decisionLine11` namespace mismatch persists (11 occurrences, 1 slot)

Report: `docs/audit/per-form-render-accurate/BM-062/render-diff.latest.json`

---

## Applied Footer (this task)

| | |
|---|---|
| Original | `recipients.personLine5` (occ 4) |
| Final | `signature.signerName` |
| Confidence | MEDIUM |
| Visible label | "(Ký, ghi rõ họ tên, đóng dấu)" |

---

## Next Action

Human DOCX/legal review required for 15 deferred occurrences before BM-062 can be marked DONE. Select next BM from 213 board.
