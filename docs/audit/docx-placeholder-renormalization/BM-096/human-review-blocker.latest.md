# BM-096 Human Review Blocker

**Task:** BM096_REMAINING_PATH_DOMAIN_REVIEW_BLOCKER
**Template:** BM-096 — Yêu cầu ra QĐ khởi tố bị can
**Status:** BLOCKED_BY_HUMAN_DOCX_REVIEW
**Lane:** LEGAL_REVIEW
**Can Apply Now:** NO
**Can Mark Done:** NO
**Generated:** 2026-06-28

---

## Render Gate

| Metric | Value |
|---|---|
| Status | PASS |
| Binding fidelity | PASS |
| Literal fidelity | PASS |
| Undefined literals | 0 |
| Text fidelity | PASS |
| Structure fidelity | PASS |

BM-096 is blocked for remaining semantic/path-domain review, not for render execution.

---

## Remaining Blockers

### `BM-096.pathDomainGenericFields` — 15 paths

BM-096 still has 15 fields with both `BAD_LABEL` and `GENERIC_FIELD_CANONICALIZATION`. These are generic `document.fieldN` sources with weak same-BM semantic evidence. Auto-remapping them as a batch would be label-only and risks corrupt path-domain mappings.

Affected paths:

- `document.soYeu`
- `agency.diaDanh`
- `document.ngayBan`
- `agency.dongDia`
- `document.chuThe`
- `legalBasis.canCu`
- `document.tenVu`
- `person.toiDanh`
- `person.hoTen`
- `document.namSinh`
- `document.lyDo`
- `recipients.luuHo`
- `signature.cheDo`
- `signature.chucVu`
- `signature.nguoiKy`

### `person.idNumber.required` — 1 review item

The previous BM-096 single-candidate remap correctly surfaced `person.idNumber`, but the audit now flags `REQUIRED_SUSPICIOUS` because the field looks required while `required=false`. That policy should not be changed without human DOCX/legal review.

---

## Rejected Options

| Option | Why Rejected |
|---|---|
| Auto-remap all generic fields from label context | Would be label-only and mixes document, agency, person, signature, and address domains |
| Mark BM-096 DONE because render gate passes | Render pass is necessary but not enough; semantic/path-domain blockers remain |
| Set `person.idNumber.required=true` immediately | Required policy must be confirmed against the official form |

---

## Required Human Review Questions

1. For each generic BM-096 field, what is the official TT-03-2026-VKSTC semantic field and label?
2. Should address contexts currently mapped under `signature.*` be person permanent/temporary address fields, or separate authoring artifacts?
3. Which remaining `document.fieldN` raw patterns are true document metadata, person data, legal basis text, or recipient/footer data?
4. Is `person.idNumber` required for BM-096, or should it remain optional in runtime authoring?
5. Can the remaining BM-096 fields be split into safe approved sub-batches, or should the normalized DOCX be reauthored first?

---

## Evidence References

| Artifact | Path |
|---|---|
| Render diff | `docs/audit/per-form-render-accurate/BM-096/render-diff.latest.json` |
| Root-cause audit | `docs/audit/forms-root-cause/latest.json` |
| Single-candidate apply | `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/apply.latest.json` |
| Single-candidate handoff | `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/planner-handoff.after-apply.json` |
| Delta attribution | `docs/audit/path-domain-binding-batch-1-bm096-single-candidate/delta-attribution.latest.json` |

---

## Board Blocker Preservation

This ledger is read by:

- `scripts/audit/refresh-213-docx-fidelity-board.mjs`
- `scripts/audit/apply-human-review-blockers-to-board.mjs`

This keeps BM-096 out of `nextCandidates` until a human DOCX/legal review approves a specific occurrence/path-level apply plan.
