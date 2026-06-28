# BM-062 Approved Decision — Signature Footer

**Task:** BM062_SIGNATURE_FOOTER_PLACEHOLDER_RENORMALIZATION_APPROVED_APPLY
**Generated:** 2026-06-28T09:08:00.000Z
**Decision count:** 1 (footer only)

---

## Decision BM062-SIG-FOOTER-001

| Field | Value |
|---|---|
| Original placeholder | `recipients.personLine5` |
| Occurrence index | 4 |
| Final placeholder | `signature.signerName` |
| Semantic path | `signature.signerName` |
| Mutation type | `DOCX_OCCURRENCE_RENAME_AND_BINDING_AWARE_CONTRACT_REPAIR` |
| Confidence | MEDIUM |
| Approved by | ChatGPT planner |

### Visible DOCX Label

`(Ký, ghi rõ họ tên, đóng dấu)`

### Required Context Anchors

- `{{recipients.personLine5}}`
- `( Ký, ghi rõ họ tên, đóng dấu )`
- `Lưu:`
- `16`

### Scope

**APPROVED:** Footer occurrence only (occ 4)

**DEFERRED — DO NOT TOUCH:**
- `recipients.personLine5` occ 0, 1, 2, 3 (person-table blank cells)
- All 11 `decision.decisionLine11` occurrences

### Rationale

Footer signature occurrence has a visible label `(Ký, ghi rõ họ tên, đóng dấu)` confirming signer name. Matches BM-052 footer pattern. Body person-table cells (occ 0-3) deferred — cannot merge 4 cells into one field.

### Field Policy

| Field | Value |
|---|---|
| source | officialConfig |
| required | true |
| reviewRequired | false |
| uiComponent | text |
| section | Chữ ký |
