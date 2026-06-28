# BM-063 Human Review Blocker

**Task:** BM063_CLOSE_AS_HUMAN_REVIEW_BLOCKER
**Template:** BM-063 — Biên bản kê biên tài sản
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW
**Lane:** LEGAL_REVIEW
**Can Apply Now:** ❌ NO
**Can Mark Done:** ❌ NO
**Generated:** 2026-06-28

---

## Render Gate

| Metric | Value |
|---|---|
| Status | FAIL |
| Binding fidelity | FAIL |
| Literal fidelity | FAIL |
| Undefined literals | 8 |
| Text fidelity | PASS |
| Structure fidelity | PASS |

---

## Blocked Placeholders

### `document.fullDocumentCode8` — 8 occurrences

| Metric | Value |
|---|---|
| DOCX occurrences | 8 |
| Slot count | 0 |
| Binding count | 0 |
| Classification | DEFER_AMBIGUOUS_DOCUMENT_CODE |

**Reason:** 8 occurrences are ambiguous procedural antecedent/document-code references:
- Occurrences 0-1: Inside header table, superscript footnote numerals near "Kiểm sát viên" names (NOT the formal document code)
- Occurrences 2-7: Body references to "Lệnh kê biên tài sản" and "UBND cấp xã" procedural antecedent text

Cannot bind all 8 as one value. Cannot use `document.fullDocumentCode` (singular) for all. Human DOCX/legal review required.

---

### `recipients.personLine5` — 5 occurrences

| Metric | Value |
|---|---|
| DOCX occurrences | 5 |
| Slot count | 1 |
| Binding count | 1 |
| Classification | DEFER_AMBIGUOUS_PERSON_TABLE_CELL |

**Reason:** 5 occurrences are blank cells in asset seizure table:
- Person name alias cell
- ID document number cell
- Address cells
- Custodian assignment cell

Cannot merge 5 distinct cells into one field. Would render same value in 5 different locations. Human DOCX/legal review required.

---

## Rejected Options

| Option | Why Rejected |
|---|---|
| Bind all `document.fullDocumentCode8` as one value | Would merge distinct procedural references — superscript footnote numerals, Lệnh references, UBND references are semantically different |
| Bind all `recipients.personLine5` as one value | Would render same value in 5 distinct table cells — produces incorrect output |
| Use `document.fullDocumentCode` (singular) for all 8 | Singular slot is "Số văn bản" (formal header); occurrences are body/procedural references |

---

## Required Human Review Questions

1. Are occurrences 0-1 of `document.fullDocumentCode8` superscript footnote numerals (prosecutor index) rather than document codes?
2. Which occurrences refer to "Lệnh kê biên tài sản" vs. UBND cấp xã vs. other procedural antecedent?
3. What does each `recipients.personLine5` table cell represent — alias, ID, address, custodian, or other?
4. Should these become distinct semantic placeholders or be removed as authoring noise?
5. What official TT-03-2026-VKSTC labels correspond to these cells?

---

## Evidence References

| Artifact | Path |
|---|---|
| Render diff | `docs/audit/per-form-render-accurate/BM-063/render-diff.latest.json` |
| Occurrence evidence | `docs/audit/docx-placeholder-renormalization/BM-063/evidence.latest.json` |
| Planner handoff | `docs/audit/docx-placeholder-renormalization/BM-063/planner-handoff.latest.json` |
| CodeGraph findings | `docs/audit/docx-placeholder-renormalization/BM-063/codegraph.findings.md` |
| Bugbot review | `docs/audit/docx-placeholder-renormalization/BM-063/review-bugbot.evidence-review.md` |

---

## Board Blocker Preservation

BM-052, BM-062, and this BM-063 blocker ledgers are read by:
- `scripts/audit/refresh-213-docx-fidelity-board.mjs` (durable fix: blocker ledger scan + row patching)
- `scripts/audit/apply-human-review-blockers-to-board.mjs` (post-refresh helper)

This ensures blockers survive board refresh cycles.
