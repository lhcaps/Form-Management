# QLLAW Unified 77 — Human Visual Review Decision Template

> Generated: 2026-07-09T10:03:06.432Z
> Scope: UNIFIED_77_HUMAN_VISUAL_REVIEW — all 77 INPUT_CONNECTED_PASS forms
> Status: NEED_HUMAN_INPUT — no decisions have been made yet
> global FIDELITY_COMPLETE_EVIDENCED: **FALSE** (remains false until all 77 cleared)

## Review Rule

Human reviewer must compare **source PDF** and **generated PDF** side-by-side for each form.
Do **not** mark PASS unless the generated PDF is visually acceptable for legal demo/use.

## Decision Rules

- **PASS**: All 9 criteria must be `true`. samePageCountOrAcceptedDelta=false requires explicit notes.
- **FAIL**: Notes must explain what is unacceptable.
- **UNCERTAIN**: Notes must explain uncertainty or tooling concern.
- Reviewer must be a non-AI identifier (not 'ai', 'cursor', 'gpt', 'tool', etc.).
- reviewedAt must be ISO-8601 timestamp.

## Global Invariant

**FIDELITY_COMPLETE_EVIDENCED = false** — global flag remains false until all 77 forms are cleared.

## WARNING

> **Do NOT use machine/PDF extraction status (text sanity, image diff ratio) as human signoff.**

## Priority Forms (page-count mismatch — review first)

| Code | Group | Src Pages | Gen Pages | Risk Flags | Source PDF | Generated PDF |
|------|-------|----------|----------|------------|-----------|--------------|
| **BM-015** | existing37 | 2 | 3 | PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-015\BM-015_normalized.pdf | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-015\BM-015.pdf |
| **BM-019** | existing37 | 2 | 1 | PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-019\BM-019_normalized.pdf | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-019\BM-019.pdf |
| **BM-033** | existing37 | 1 | 2 | PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-033\BM-033_normalized.pdf | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-033\BM-033.pdf |
| **BM-040** | existing37 | 1 | 2 | PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-040\BM-040_normalized.pdf | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-040\BM-040.pdf |
| **BM-042** | existing37 | 1 | 2 | PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-042\BM-042_normalized.pdf | D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-042\BM-042.pdf |
| **BM-057** | batch3 | 1 | 2 | PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE, TEXT_EXTRACTION_UNRELIABLE | D:\Study\Project\QLLaw-main\.tmp-batch3-visual-pdf-review\BM-057\BM-057_normalized.pdf | D:\Study\Project\QLLaw-main\.tmp-batch3-visual-pdf-review\BM-057\BM-057.pdf |
| **BM-062** | batch3 | 2 | 3 | PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE, TEXT_EXTRACTION_UNRELIABLE | D:\Study\Project\QLLaw-main\.tmp-batch3-visual-pdf-review\BM-062\BM-062_normalized.pdf | D:\Study\Project\QLLaw-main\.tmp-batch3-visual-pdf-review\BM-062\BM-062.pdf |

## Decision Checklist

Fill in reviewer name, timestamp, decision (PASS/FAIL/UNCERTAIN), criteria, and notes.

### Priority Forms — Detail

#### BM-015 (existing37)
- **Source PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-015\BM-015_normalized.pdf`
- **Generated PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-015\BM-015.pdf`
- **Source pages**: 2  **Generated pages**: 3
- **Risk flags**: PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE
- **Max diff ratio**: N/A (render failed / diff unavailable)
- **Tooling notes**: none
- **Reviewer**: ___
- **Reviewed at**: ___
- **Decision**: [ ] PASS  [ ] FAIL  [ ] UNCERTAIN
- **samePageCountOrAcceptedDelta**: [ ] true  [ ] false → notes if false: ___
- **headerLooksCorrect**: [ ] true  [ ] false
- **titleLooksCorrect**: [ ] true  [ ] false
- **bodyLayoutLooksCorrect**: [ ] true  [ ] false
- **tablesLookCorrect**: [ ] true  [ ] false
- **footerSignatureLooksCorrect**: [ ] true  [ ] false
- **noMissingTextVisible**: [ ] true  [ ] false
- **noObviousOverflowOrClipping**: [ ] true  [ ] false
- **acceptableForLegalDemo**: [ ] true  [ ] false
- **Notes**: ___

#### BM-019 (existing37)
- **Source PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-019\BM-019_normalized.pdf`
- **Generated PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-019\BM-019.pdf`
- **Source pages**: 2  **Generated pages**: 1
- **Risk flags**: PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE
- **Max diff ratio**: N/A (render failed / diff unavailable)
- **Tooling notes**: none
- **Reviewer**: ___
- **Reviewed at**: ___
- **Decision**: [ ] PASS  [ ] FAIL  [ ] UNCERTAIN
- **samePageCountOrAcceptedDelta**: [ ] true  [ ] false → notes if false: ___
- **headerLooksCorrect**: [ ] true  [ ] false
- **titleLooksCorrect**: [ ] true  [ ] false
- **bodyLayoutLooksCorrect**: [ ] true  [ ] false
- **tablesLookCorrect**: [ ] true  [ ] false
- **footerSignatureLooksCorrect**: [ ] true  [ ] false
- **noMissingTextVisible**: [ ] true  [ ] false
- **noObviousOverflowOrClipping**: [ ] true  [ ] false
- **acceptableForLegalDemo**: [ ] true  [ ] false
- **Notes**: ___

#### BM-033 (existing37)
- **Source PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-033\BM-033_normalized.pdf`
- **Generated PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-033\BM-033.pdf`
- **Source pages**: 1  **Generated pages**: 2
- **Risk flags**: PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE
- **Max diff ratio**: N/A (render failed / diff unavailable)
- **Tooling notes**: none
- **Reviewer**: ___
- **Reviewed at**: ___
- **Decision**: [ ] PASS  [ ] FAIL  [ ] UNCERTAIN
- **samePageCountOrAcceptedDelta**: [ ] true  [ ] false → notes if false: ___
- **headerLooksCorrect**: [ ] true  [ ] false
- **titleLooksCorrect**: [ ] true  [ ] false
- **bodyLayoutLooksCorrect**: [ ] true  [ ] false
- **tablesLookCorrect**: [ ] true  [ ] false
- **footerSignatureLooksCorrect**: [ ] true  [ ] false
- **noMissingTextVisible**: [ ] true  [ ] false
- **noObviousOverflowOrClipping**: [ ] true  [ ] false
- **acceptableForLegalDemo**: [ ] true  [ ] false
- **Notes**: ___

#### BM-040 (existing37)
- **Source PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-040\BM-040_normalized.pdf`
- **Generated PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-040\BM-040.pdf`
- **Source pages**: 1  **Generated pages**: 2
- **Risk flags**: PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE
- **Max diff ratio**: N/A (render failed / diff unavailable)
- **Tooling notes**: none
- **Reviewer**: ___
- **Reviewed at**: ___
- **Decision**: [ ] PASS  [ ] FAIL  [ ] UNCERTAIN
- **samePageCountOrAcceptedDelta**: [ ] true  [ ] false → notes if false: ___
- **headerLooksCorrect**: [ ] true  [ ] false
- **titleLooksCorrect**: [ ] true  [ ] false
- **bodyLayoutLooksCorrect**: [ ] true  [ ] false
- **tablesLookCorrect**: [ ] true  [ ] false
- **footerSignatureLooksCorrect**: [ ] true  [ ] false
- **noMissingTextVisible**: [ ] true  [ ] false
- **noObviousOverflowOrClipping**: [ ] true  [ ] false
- **acceptableForLegalDemo**: [ ] true  [ ] false
- **Notes**: ___

#### BM-042 (existing37)
- **Source PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-042\BM-042_normalized.pdf`
- **Generated PDF**: `D:\Study\Project\QLLaw-main\.tmp-visual-pdf-fidelity\BM-042\BM-042.pdf`
- **Source pages**: 1  **Generated pages**: 2
- **Risk flags**: PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE
- **Max diff ratio**: N/A (render failed / diff unavailable)
- **Tooling notes**: none
- **Reviewer**: ___
- **Reviewed at**: ___
- **Decision**: [ ] PASS  [ ] FAIL  [ ] UNCERTAIN
- **samePageCountOrAcceptedDelta**: [ ] true  [ ] false → notes if false: ___
- **headerLooksCorrect**: [ ] true  [ ] false
- **titleLooksCorrect**: [ ] true  [ ] false
- **bodyLayoutLooksCorrect**: [ ] true  [ ] false
- **tablesLookCorrect**: [ ] true  [ ] false
- **footerSignatureLooksCorrect**: [ ] true  [ ] false
- **noMissingTextVisible**: [ ] true  [ ] false
- **noObviousOverflowOrClipping**: [ ] true  [ ] false
- **acceptableForLegalDemo**: [ ] true  [ ] false
- **Notes**: ___

#### BM-057 (batch3)
- **Source PDF**: `D:\Study\Project\QLLaw-main\.tmp-batch3-visual-pdf-review\BM-057\BM-057_normalized.pdf`
- **Generated PDF**: `D:\Study\Project\QLLaw-main\.tmp-batch3-visual-pdf-review\BM-057\BM-057.pdf`
- **Source pages**: 1  **Generated pages**: 2
- **Risk flags**: PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE, TEXT_EXTRACTION_UNRELIABLE
- **Max diff ratio**: N/A (render failed / diff unavailable)
- **Tooling notes**: Text extraction may be limited by pdfplumber CJK font handling — DOCX XML text sanity was validated by the machine-fidelity artifact. Image diff unavailable (likely CJK font rendering); page count and text sanity still apply. Batch 3 machine-checkable fidelity (golden/layout) PASS — see QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json.
- **Reviewer**: ___
- **Reviewed at**: ___
- **Decision**: [ ] PASS  [ ] FAIL  [ ] UNCERTAIN
- **samePageCountOrAcceptedDelta**: [ ] true  [ ] false → notes if false: ___
- **headerLooksCorrect**: [ ] true  [ ] false
- **titleLooksCorrect**: [ ] true  [ ] false
- **bodyLayoutLooksCorrect**: [ ] true  [ ] false
- **tablesLookCorrect**: [ ] true  [ ] false
- **footerSignatureLooksCorrect**: [ ] true  [ ] false
- **noMissingTextVisible**: [ ] true  [ ] false
- **noObviousOverflowOrClipping**: [ ] true  [ ] false
- **acceptableForLegalDemo**: [ ] true  [ ] false
- **Notes**: ___

#### BM-062 (batch3)
- **Source PDF**: `D:\Study\Project\QLLaw-main\.tmp-batch3-visual-pdf-review\BM-062\BM-062_normalized.pdf`
- **Generated PDF**: `D:\Study\Project\QLLaw-main\.tmp-batch3-visual-pdf-review\BM-062\BM-062.pdf`
- **Source pages**: 2  **Generated pages**: 3
- **Risk flags**: PAGE_COUNT_MISMATCH, VISUAL_DIFF_UNAVAILABLE, TEXT_EXTRACTION_UNRELIABLE
- **Max diff ratio**: N/A (render failed / diff unavailable)
- **Tooling notes**: Text extraction may be limited by pdfplumber CJK font handling — DOCX XML text sanity was validated by the machine-fidelity artifact. Image diff unavailable (likely CJK font rendering); page count and text sanity still apply. Batch 3 machine-checkable fidelity (golden/layout) PASS — see QLLAW_BATCH3_GOLDEN_LAYOUT_FIDELITY.latest.json.
- **Reviewer**: ___
- **Reviewed at**: ___
- **Decision**: [ ] PASS  [ ] FAIL  [ ] UNCERTAIN
- **samePageCountOrAcceptedDelta**: [ ] true  [ ] false → notes if false: ___
- **headerLooksCorrect**: [ ] true  [ ] false
- **titleLooksCorrect**: [ ] true  [ ] false
- **bodyLayoutLooksCorrect**: [ ] true  [ ] false
- **tablesLookCorrect**: [ ] true  [ ] false
- **footerSignatureLooksCorrect**: [ ] true  [ ] false
- **noMissingTextVisible**: [ ] true  [ ] false
- **noObviousOverflowOrClipping**: [ ] true  [ ] false
- **acceptableForLegalDemo**: [ ] true  [ ] false
- **Notes**: ___

### Remaining Forms (all groups)

#### Existing Curated 37
| Code | Src Pages | Gen Pages | Risk | Max Diff | Reviewer | Decision | Notes |
|------|-----------|-----------|------|----------|----------|----------|-------|
| BM-001 | 2 | 2 | — | 0.0667 | ___ | ___ | ___ |
| BM-005 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-006 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-007 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-008 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-009 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-010 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-011 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-012 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-014 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-017 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-018 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-020 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-022 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-023 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-030 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-031 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-035 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-036 | 2 | 2 | — | N/A | ___ | ___ | ___ |
| BM-037 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-038 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-043 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-044 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-045 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-046 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-047 | 2 | 2 | — | N/A | ___ | ___ | ___ |
| BM-048 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-052 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-053 | 2 | 2 | — | N/A | ___ | ___ | ___ |
| BM-054 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-070 | 1 | 1 | — | N/A | ___ | ___ | ___ |
| BM-171 | 2 | 2 | — | N/A | ___ | ___ | ___ |

#### Batch 3 (20 forms)
| Code | Src Pages | Gen Pages | Risk | Max Diff | Reviewer | Decision | Notes |
|------|-----------|-----------|------|----------|----------|----------|-------|
| BM-055 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-056 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-058 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-059 | 3 | 3 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-060 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-061 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-063 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-064 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-065 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-066 | 3 | 3 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-067 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-068 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-069 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-071 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-072 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-073 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-074 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-075 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |

#### Batch 4 (20 forms)
| Code | Src Pages | Gen Pages | Risk | Max Diff | Reviewer | Decision | Notes |
|------|-----------|-----------|------|----------|----------|----------|-------|
| BM-076 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-078 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-080 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-081 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-083 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-084 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-085 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-086 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-087 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-088 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-090 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-091 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-092 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-093 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-094 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-095 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-096 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-097 | 2 | 2 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-098 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |
| BM-100 | 1 | 1 | TEXT_EXTRACTION_UNRELIABLE | N/A | ___ | ___ | ___ |

## How to Submit Decisions

1. Copy `QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.template.json` to `QLLAW_UNIFIED_77_HUMAN_REVIEW_DECISIONS.input.json`.
2. Fill in reviewer, reviewedAt, decision, criteria, and notes for each of the 77 forms.
3. Save the file.
4. Run the validator: `node scripts/audit/validate-unified-77-human-review-decisions.mjs`
5. If validation passes, a follow-up apply script will be available to apply decisions.

## Invariants (do not violate)

- Do not set fidelityComplete=true without explicit human PASS.
- Do not set FIDELITY_COMPLETE_EVIDENCED=true in the input JSON.
- Do not declare generatedDocumentId or workspace fields.
- Do not use AI/tool as reviewer identifier.
