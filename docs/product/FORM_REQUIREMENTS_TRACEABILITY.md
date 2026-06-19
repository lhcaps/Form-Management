# Form Requirements Traceability

> Tracks all product requirements from `QUANLYNOIBOVKS_REQUIREMENTS.md`
> against implementation phases and current status.

## Legend

- **Phase**: Milestone when requirement is expected to be implemented.
- **Current status**: `done` | `partial` | `pending` | `out_of_scope` | `covered-by-shadow-audit` | `guarded-in-shadow-tests` | `not_detectable`
- **Test/gate**: The verification artifact or command that confirms the requirement.
- **`covered-by-shadow-audit`**: Structural audit in place; visual fidelity requires PDF pipeline.
- **`guarded-in-shadow-tests`**: Isolation verified in shadow test fixtures; full implementation pending D.3.
- **`not_detectable`**: OOXML structure does not permit reliable verification (underline width, horizontal alignment, etc.).

---

## DOCX Format Requirements (FMT)

| Requirement ID | Area | Requirement | Phase | Current status | Test/gate |
|---|---|---|---|---|---|
| FMT-001 | DOCX | Times New Roman size 13 baseline font throughout document | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-002 | DOCX | Header: `VIỆN KIỂM SÁT NHÂN DÂN THÀNH PHỐ HỒ CHÍ MINH` | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-003 | DOCX | Header: `VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7` bold | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-004 | DOCX | Underline under `KHU VỰC 7` only (not full line) | D.2.2+ | not_detectable | docx-visual-verify | underline width requires visual/PDF pipeline |
| FMT-005 | DOCX | Legal basis line: `(Ban hành theo Thông tư số 03/2026/TT-VKSTC Ngày 09/02/2026)` size 8 | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-006 | DOCX | Quốc hiệu size 13 | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-007 | DOCX | `Độc lập - Tự do - Hạnh phúc` size 14 | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-008 | DOCX | Underline under motto matches exact line width | D.2.2+ | not_detectable | docx-visual-verify | underline width requires visual/PDF pipeline |
| FMT-009 | DOCX | Issue date: `..., ngày … tháng … năm 20…` italic size 14 | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-010 | DOCX | `Số...` line and `ngày/tháng/năm` line on same horizontal level | D.2.2+ | not_detectable | docx-visual-verify | horizontal alignment requires visual/PDF pipeline |
| FMT-011 | DOCX | Body titles / main title / subtitle bold size 14 | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-012 | DOCX | `Điều 1`, `Điều 2`, section `1.`, `2.` bold | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-013 | DOCX | Footer: `Nơi nhận:` bold italic size 12 | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-014 | DOCX | Footer: recipient lines size 11 | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-015 | DOCX | Signature title bold size 14; 2–3 lines between title and name | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render (vertical spacing not verifiable structurally) |
| FMT-016 | DOCX | Page number present for forms > 2 pages | D.2.2+ | partial | docx-format-audit | smoke:bm001-shadow-render |
| FMT-017 | DOCX | `Different First Page` section property enabled | D.2.2+ | partial | docx-format-audit |
| FMT-018 | DOCX | Document number suffix unique per form (e.g. `QĐ-VKSKV7`) | D.3+ | pending | contract-render-test |
| FMT-019 | DOCX | Form number (`Mẫu số`) differs only by BM number | D.3+ | pending | contract-render-test |

---

## API Requirements (API)

| Requirement ID | Area | Requirement | Phase | Current status | Test/gate |
|---|---|---|---|---|---|
| API-001 | API | Sample data must not overwrite persisted user data | D.3 | guarded-in-shadow-tests | shadow-fixture-isolation | test fixtures isolated under test/; shadow writes to storage/generated/shadow-renders/ |
| API-002 | API | Every form has sample data for development | D.3 | pending | sample-data-existence-test |
| API-003 | API | Render uses persisted data, not sample values | D.3 | pending | render-persistence-test |

---

## WEB Requirements (WEB)

| Requirement ID | Area | Requirement | Phase | Current status | Test/gate |
|---|---|---|---|---|---|
| WEB-001 | Web | Field logic correct per BM template | D.4+ | pending | contract-form-schema-test |
| WEB-002 | Web | Date dropdown / date picker present | D.4+ | pending | form-input-test |
| WEB-003 | Web | Input synchronizes with live preview | D.4+ | pending | live-preview-test |
| WEB-004 | Web | Form creation page has search for input data | D.4+ | pending | form-search-test |
| WEB-005 | Web | Related form suggestions available | D.4+ | pending | form-suggestion-test |
| WEB-006 | Web | Filter/select for 9 investigation stages | D.4+ | pending | stage-filter-test |

---

## Reporting Requirements (RPT)

| Requirement ID | Area | Requirement | Phase | Current status | Test/gate |
|---|---|---|---|---|---|
| RPT-001 | Reporting | Reports available weekly and monthly | D.5 | pending | reporting-frequency-test |
| RPT-002 | Reporting | Dimension `time` (week/month) | D.5 | pending | reporting-index-test |
| RPT-003 | Reporting | Dimension `ward` (administrative) | D.5 | pending | reporting-index-test |
| RPT-004 | Reporting | Dimension `offense` (legal classification) | D.5 | pending | reporting-index-test |
| RPT-005 | Reporting | Form data stored with sufficient structure for all 3 dimensions | D.5 | pending | reporting-schema-test |

---

## Implementation Phase Status Summary

| Phase | Requirements | Done | Partial | Pending | Not Detectable | Out of Scope |
|-------|-------------|------|---------|---------|----------------|--------------|
| D.2.2 | FMT-001–FMT-017 | 0 | 11 | 0 | 5 | 0 |
| D.2.2.5 (shadow audit) | FMT + shadow evidence | 0 | 11 | 0 | 5 | 0 |
| D.3 | API-001–API-003, FMT-018–FMT-019 | 0 | 1 (guarded) | 4 | 0 | 0 |
| D.4 | WEB-001–WEB-006 | 0 | 0 | 6 | 0 | 0 |
| D.5 | RPT-001–RPT-005 | 0 | 0 | 5 | 0 | 0 |
| **Total** | **27** | **0** | **12** | **15** | **5** | **0** |

> **D.2.2.5 update**: Shadow evidence phase adds 5 deterministic scenario fixtures, in-process render generation, semantic comparison with expectedText validation, and format audit with OOXML proximity checks. Visual fidelity (underline width, exact pt sizes, horizontal alignment) remains `not_detectable` until a PDF render pipeline exists.

Evidence files (D.2.2.5):
- `test/fixtures/rendering/bm001-shadow-scenarios/` — 5 scenario fixtures
- `storage/generated/shadow-renders/BM-001/` — shadow artifact output
- `docs/audit/backend/2026-06-19-bm001-shadow-evidence-summary.md` — aggregate report
- `docs/audit/backend/bm001-shadow-evidence-summary.json` — JSON evidence
- `scripts/smoke-bm001-shadow-render.mjs` — generation + smoke script
- `scripts/report-bm001-shadow-evidence.mjs` — aggregate report script
