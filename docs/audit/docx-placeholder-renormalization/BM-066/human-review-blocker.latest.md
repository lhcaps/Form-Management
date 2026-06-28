# BM-066 Human Review Blocker

**Task:** BM066_CLOSE_AS_HUMAN_REVIEW_BLOCKER
**Template:** BM-066 — Lệnh phong toả tài khoản
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW
**Lane:** LEGAL_REVIEW
**Can Apply Now:** NO
**Can Mark Done:** NO
**Generated:** 2026-06-28

---

## Render Gate

| Metric | Value |
|---|---|
| Status | FAIL |
| Binding fidelity | FAIL |
| Literal fidelity | FAIL |
| Undefined literals | 4 |
| Text fidelity | PASS |
| Structure fidelity | PASS |

---

## Blocked Placeholders

### `recipients.personLine4` — 4 occurrences

| Metric | Value |
|---|---|
| DOCX occurrences | 4 |
| Slot count | 0 |
| Binding count | 0 |
| Classification | DEFER_AMBIGUOUS_PERSON_TABLE_CELL |

**Reason:** 4 occurrences are ambiguous person/account/footer cells:

- Occurrences 0-1: blank person table cells with no visible labels.
- Occurrence 2: bank/account freeze context, not clearly a person line.
- Occurrence 3: distribution/footer administrative line with `(Ký, ghi rõ họ tên, đóng dấu)`, not proven to be a formal signer slot.

Cannot bind all 4 as one value. Human DOCX/legal review is required.

---

### `document.fullDocumentCode4` — 4 occurrences

| Metric | Value |
|---|---|
| DOCX occurrences | 4 |
| Slot count | 1 |
| Binding count | 1 |
| Classification | DEFER_AMBIGUOUS_DOCUMENT_CODE |

**Reason:** 4 occurrences are ambiguous document-code/account/procedural references. The existing slot is labeled `Số văn bản`, but occurrence evidence places these references in bank/account and body procedural contexts. They are not clearly the same formal document code.

Cannot bind all 4 as one value or reuse `document.fullDocumentCode` without human DOCX/legal review.

---

## Rejected Options

| Option | Why Rejected |
|---|---|
| Bind all `recipients.personLine4` as one value | Would render the same value into distinct person/account/footer contexts |
| Bind all `document.fullDocumentCode4` as one value | Would merge bank/account/procedural references into one formal document-code value |
| Treat footer `recipients.personLine4` as signer | Footer text is administrative boilerplate and not proven to be the formal signer slot |

---

## Required Human Review Questions

1. What does each `recipients.personLine4` occurrence represent in the official BM-066 DOCX: alias/person cell, account holder, organization, recipient, or footer signer?
2. Which `document.fullDocumentCode4` occurrences are formal document numbers, and which are procedural/account references?
3. Should BM-066 account/bank/freeze fields use distinct semantic placeholders instead of `recipients.personLine4` or `document.fullDocumentCode4`?
4. Is the final `recipients.personLine4` footer occurrence a recipient/administrative line or a formal signer field?
5. What official TT-03-2026-VKSTC labels correspond to the bank/account/person cells in this form?

---

## Evidence References

| Artifact | Path |
|---|---|
| Render diff | `docs/audit/per-form-render-accurate/BM-066/render-diff.latest.json` |
| Occurrence evidence | `docs/audit/docx-placeholder-renormalization/BM-066/evidence.latest.json` |
| Planner handoff | `docs/audit/docx-placeholder-renormalization/BM-066/planner-handoff.latest.json` |
| CodeGraph findings | `docs/audit/docx-placeholder-renormalization/BM-066/codegraph.findings.md` |
| Bugbot review | `docs/audit/docx-placeholder-renormalization/BM-066/review-bugbot.evidence-review.md` |

---

## Board Blocker Preservation

This ledger is read by:

- `scripts/audit/refresh-213-docx-fidelity-board.mjs`
- `scripts/audit/apply-human-review-blockers-to-board.mjs`

This keeps BM-066 in `LEGAL_REVIEW / BLOCKED_BY_HUMAN_DOCX_REVIEW` until a human DOCX/legal review approves a specific occurrence-level apply plan.
