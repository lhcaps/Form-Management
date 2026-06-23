# Wave 04E-2 Apply Approved Decisions

**Wave:** 04E-2
**Authored by:** Le Huy
**Reviewed at:** 2026-06-23T10:30:00.000+07:00
**Branch:** `remediation/wave-04e-2-apply-approved-decisions`
**Generated:** 2026-06-23

## Baseline

| Metric | Value |
|---|---|
| Blocking | 0 |
| Remediation checks | 31 |
| Warning | 58 |
| Runtime readiness | 213 locked / 0 draft |
| Smoke | PASS |
| Stable hash tests | PASS |

## Reviewer Decisions Applied

| BM | Field | Decision | Action | Reason |
|---|---|---|---|---|
| BM-021 | `agency.nameUpper` | `APPROVE_ADD` | ADD_PLACEHOLDER | Top-left second agency line [2] under parent VKS |
| BM-031 | `agency.bodyName` | `METADATA_ONLY_ALIAS` | METADATA_ONLY | No third agency-body blank in official form |
| BM-036 | `agency.parentNameUpper` | `APPROVE_ADD` | ADD_PLACEHOLDER | Top-left first agency line [1] VIỆN KIỂM SÁT |
| BM-036 | `document.issueDate` | `METADATA_ONLY` | METADATA_ONLY | Covered by `document.issuePlaceAndDateLine` |
| BM-044 | `agency.parentNameUpper` | `APPROVE_ADD` | FIX_MALFORMED | DOCX had malformed `{{agency.parentNameUpper}` — fixed to `{{agency.parentNameUpper}}` |
| BM-052 | `document.fullDocumentCode` | `METADATA_ONLY_ALIAS` | METADATA_ONLY | `decision.decisionLine2` already renders cited deposit decision |
| BM-052 | `document.fullDocumentCode2` | `REMOVE_OR_METADATA_ONLY` | METADATA_ONLY | Official form has one cited decision, not two |
| BM-056 | `person.religion` | `APPROVE_ADD_SENSITIVE` | FIX_MALFORMED | DOCX had malformed `{{person.religion}` — fixed to `{{person.religion}}` |
| BM-059 | `recipients.personLine` | `APPROVE_ADD` | ADD_PLACEHOLDER | Nơi nhận block bullet - 8… |
| BM-060 | `document.fullDocumentCode` | `APPROVE_ADD_PREFER_SEMANTIC_RENAME` | ADD_PLACEHOLDER | Missing cited prosecution/bị can decision basis line |
| BM-061 | `document.fullDocumentCode` | `APPROVE_ADD_PREFER_SEMANTIC_RENAME` | ADD_PLACEHOLDER | Legal basis cited case decision line |
| BM-063 | `document.fullDocumentCode` | `ALIAS_CANONICALIZE` | METADATA_ONLY | lệnh kê biên reference already via `document.fullDocumentCode8` |
| BM-064 | `document.fullDocumentCode` | `APPROVE_ADD` | ADD_PLACEHOLDER | Cited seizure order reference in legal basis |
| BM-065 | `decision.decisionLine` | `METADATA_ONLY_DO_NOT_RENDER` | METADATA_ONLY | Static phrase, not a visible numbered blank |
| BM-065 | `document.fullDocumentCode` | `ALIAS_CANONICALIZE` | METADATA_ONLY | `document.fullDocumentCode8` already covers lệnh kê biên reference |
| BM-066 | `decision.decisionLine` | `APPROVE_ADD` | ADD_PLACEHOLDER | First dynamic cited-decision basis line |
| BM-066 | `document.fullDocumentCode` | `APPROVE_ADD_OR_ALIAS` | ADD_PLACEHOLDER | Not covered by `document.fullDocumentCode4`; added canonical |
| BM-067 | `document.fullDocumentCode` | `ALIAS_CANONICALIZE` | METADATA_ONLY | `document.fullDocumentCode6` already renders lệnh phong tỏa reference |
| BM-067 | `document.fullDocumentCode2` | `REMOVE_OR_REPEAT_CANONICAL` | METADATA_ONLY | Same lệnh repeated; reuse `document.fullDocumentCode` |

## DOCX Changes

| BM | Placeholder | Anchor | Sensitive | Result |
|---|---|---|---|---|
| BM-021 | `{{agency.nameUpper}}` | `Viện kiểm sát</w:t></w:r><w:r><w:rPr><w:vertAlign w:val="superscript"/>` | No | ADD_PLACEHOLDER |
| BM-036 | `{{agency.parentNameUpper}}` | `VIỆN KIỂM SÁT` | No | ADD_PLACEHOLDER |
| BM-044 | `{{agency.parentNameUpper}}` | malformed | No | FIX_MALFORMED |
| BM-056 | `{{person.religion}}` | malformed | **Yes** | FIX_MALFORMED |
| BM-059 | `{{recipients.personLine}}` | `Nơi nhận:` | No | ADD_PLACEHOLDER |
| BM-060 | `{{document.fullDocumentCode}}` | `Quyết định khởi tố vụ án hình sự` | No | ADD_PLACEHOLDER |
| BM-061 | `{{document.fullDocumentCode}}` | `Quyết định khởi tố vụ án hình sự` | No | ADD_PLACEHOLDER |
| BM-064 | `{{document.fullDocumentCode}}` | `Lệnh kê biên tài sản số` | No | ADD_PLACEHOLDER |
| BM-066 | `{{decision.decisionLine}}` | `Quyết định khởi tố vụ án hình sự` | No | ADD_PLACEHOLDER |
| BM-066 | `{{document.fullDocumentCode}}` | `Quyết định khởi tố vụ án hình sự` | No | ADD_PLACEHOLDER |

## Skipped / Deferred

| BM | Field | Decision | Reason | Next |
|---|---|---|---|---|
| BM-031 | `agency.bodyName` | `METADATA_ONLY_ALIAS` | No third agency-body blank in official form | Pending contract alias implementation |
| BM-036 | `document.issueDate` | `METADATA_ONLY` | Already covered by compound `issuePlaceAndDateLine` | No action needed |
| BM-052 | `document.fullDocumentCode` | `METADATA_ONLY_ALIAS` | Already rendered by `decision.decisionLine2` | No action needed |
| BM-052 | `document.fullDocumentCode2` | `REMOVE_OR_METADATA_ONLY` | Official form has one cited decision | No DOCX removal in this wave |
| BM-063 | `document.fullDocumentCode` | `ALIAS_CANONICALIZE` | Already rendered via `document.fullDocumentCode8` | Pending canonical alias implementation |
| BM-065 | `decision.decisionLine` | `METADATA_ONLY_DO_NOT_RENDER` | Static phrase, not a numbered blank | No action needed |
| BM-065 | `document.fullDocumentCode` | `ALIAS_CANONICALIZE` | Already rendered via `document.fullDocumentCode8` | Pending canonical alias implementation |
| BM-067 | `document.fullDocumentCode` | `ALIAS_CANONICALIZE` | Already rendered via `document.fullDocumentCode6` | Pending canonical alias implementation |
| BM-067 | `document.fullDocumentCode2` | `REMOVE_OR_REPEAT_CANONICAL` | Same lệnh repeated; reuse canonical | No DOCX removal in this wave |

## Sensitive Data Handling

- **BM-056 `person.religion`:**
  - Added to DOCX: Yes (FIX_MALFORMED — malformed `{{person.religion}` corrected to `{{person.religion}}`)
  - Policy guard: `sensitive: true`, `category: privacy`, `requiresLegalBasis: true`
  - Legal approval evidence: Reviewer decision by Le Huy, 2026-06-23
  - Render approval metadata recorded in `wave-04e-2-applied-actions.json`

## After

| Metric | Value | Delta |
|---|---|---|
| Blocking | 0 | — |
| Remediation checks | 15 | -16 (from 31) |
| Warning | 58 | — |
| Runtime readiness | 213 locked / 0 draft | — |
| Smoke | PASS | — |
| Stable hash tests | PASS | — |

## DB Publish

- **Created:** 9 (BM-021, BM-036, BM-044, BM-056, BM-059, BM-060, BM-061, BM-064, BM-066)
- **Skipped:** 204 (already published, hash unchanged)
- **Failed:** 0
- **Stable hash vs DB:** 9 new versions created (v4 for BM-021/036/044/056/059, v5 for BM-060/061/064/066); 204 unchanged forms verified idempotent

## Remaining Work

- **Remaining remediation checks:** 15 field-level items in `REMAINING-REMEDIATION-INVENTORY.md`
- **Remaining legal/human decisions:**
  - `person.religion` — sensitive field policy guard must be enforced at render time (legal basis required)
  - Contract alias implementation for `ALIAS_CANONICALIZE` decisions (BM-063, BM-065, BM-067)
  - Semantic rename for `APPROVE_ADD_PREFER_SEMANTIC_RENAME` decisions (BM-060, BM-061)
  - BM-052 `document.fullDocumentCode2` / BM-067 `document.fullDocumentCode2` — no DOCX removal in this wave
- **Accepted/no-action:** BM-001, BM-002, BM-003 orphaned mustaches remain no-action

## Decisions Summary

| Action | Count |
|---|---|
| ADD_PLACEHOLDER | 8 |
| FIX_MALFORMED | 2 |
| METADATA_ONLY | 9 |
| **Total** | **19** |
