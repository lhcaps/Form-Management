# QLLAW BM-006 — Visual / PDF Review (Phase A)

> **Generated**: 2026-07-09T21:05:23.346Z
> **STATUS**: PARTIAL_PENDING_USER_REVIEW
> **PILOT_CODE**: BM-006
> **SCOPE**: BM-006_ONLY
> **MACHINE_FIDELITY_STATUS**: PASS
> **LAYOUT_IMPROVED**: USER_DECISION_NEEDED
> **FIDELITY_COMPLETE_CLAIMED**: false
> **FIDELITY_COMPLETE_EVIDENCED**: false
> **ALLOWLIST_PROMOTED**: false

## Inputs

- Source normalized DOCX: `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-006/BM-006_normalized.docx`
  - sha256: `b83c42ad854f5cd4e08bc8f901389be0ee17c1401c4e42a309016154bd399f56`
  - size: 23140 B
- Generated runtime DOCX: `D:/Study/Project/QLLaw-main/.tmp-docx-download-smoke/BM-006.docx`
  - sha256: `f1c204e87a83f0bd6eb8cba851e56e46b8db45060d6ffbbd51ef555002d4c46b`
  - size: 101739 B

## PDFs (for human review)

- Source PDF: `D:/Study/Project/QLLaw-main/.tmp-bm006-visual-pdf-review/BM-006/BM-006_normalized.pdf` (123753 B)
- Generated PDF: `D:/Study/Project/QLLaw-main/.tmp-bm006-visual-pdf-review/BM-006/BM-006.pdf` (132081 B)

## Machine fidelity (XML-property parity)

- verdict: `EXACT_MATCH`
- blocks: `6`
- status: `OK`

## Pixel diff per page (PIL ImageChops, threshold > 5 per channel)

| Page | non-zero pixel ratio |
|---|---|
| 1 | 5.12% |

## Verdict

- layoutImproved: **USER_DECISION_NEEDED**
- bodyRegression: **NO**
- pageCountRegression: **NO**
- machineFidelityStatus: **PASS**
- visualPdfStatus: **PARTIAL_PENDING_USER_REVIEW**

## Notes

- Pixel diff produced for human review. non-zero ratio per page indicates visual deviation; final interpretation is the user's.
- BM-006 NOT promoted to FormFlight runtimeReady allowlist (BM-001+BM-171 only).
- fidelityComplete remains false; FIDELITY_COMPLETE_EVIDENCED remains false.
- Revert path is fully prepared: .tmp-bm006-top-right-template-calibration/before/BM-006_normalized.docx.

## No mutation

- sourceDocxMutated: false
- normalizedDocxMutated: false
- lockedContractsMutated: false
- compiledContractsMutated: false
- dbMutated: false
- prismaSchemaMutated: false
- migrationsCreated: false
- publicApiRoutePathsChanged: false
- commitCreated: false
- gitPushed: false
- filesStaged: false

## Downstream invariants preserved

- inputConnectedPass: 97
- inputConnectedPartial: 116
- fidelityPending: 0
- formFlightRuntimeReadyPromoted: 0
- fidelityCompleteEvidenced: false

