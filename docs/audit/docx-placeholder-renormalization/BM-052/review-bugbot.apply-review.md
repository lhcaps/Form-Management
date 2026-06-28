# BM-052 Apply Review

Requested external tool: `review-bugbot`

Availability: not callable in this Codex environment after tool discovery. This file records the equivalent pre-write review checklist performed before write mode.

Status: `PASS_WITH_NOTES`

## Reviewed Inputs

- `docs/audit/docx-placeholder-renormalization/BM-052/approved/decisions.approved.json`
- `scripts/audit/apply-bm052-docx-placeholder-renormalization-approved.mjs`
- `test/bm052-docx-placeholder-renormalization-approved-apply.test.mjs`
- Dry-run report: `docs/audit/docx-placeholder-renormalization/BM-052/apply.latest.json`

## Findings

| Check | Result | Evidence |
|---|---|---|
| Exactly four approved decisions | PASS | `decisions.approved.json` contains four entries. |
| Corrected semantic names | PASS | Uses `person.fullName`, `person.idNumber`, `person.temporaryAddress`. |
| Rejected suffix names absent from approved decisions | PASS | `rg` over `BM-052/approved` returned no rejected suffix-name hits. |
| Deferred occurrences excluded | PASS | `recipients.personLine6` occurrences 0, 1, 2, and 5 are listed only under deferred occurrences. |
| No global replacement | PASS | Runner uses occurrence counters per original placeholder and validates exact replacement counts. |
| Dry-run does not mutate DOCX/contract/compiled-v2 | PASS | Fixture test covers dry-run immutability; live dry-run produced report only. |
| Backup before write | PASS | Write mode creates timestamped backup of DOCX, contract, and approved decisions before mutation. |
| compiled-v2 manual edit blocked | PASS | Runner does not write `docs/audit/docx/compiled-v2`; compile remains a separate official step. |
| source/required/reviewRequired policy | PASS_WITH_NOTE | `person.fullName` reuses existing `decision.decisionLine2` policy; new ID/address fields are conservative `reviewRequired=true`. |
| Worktree hygiene | PASS_WITH_NOTE | Worktree is mixed, so no commit should be made automatically. |

## Notes

The existing deep extraction artifact still contains stale rejected proposal names as historical evidence. The approved decision payload and apply output do not use those names.
