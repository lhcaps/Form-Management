# Phase 8A — Stage 3 — BM Change Classification

Captured at: 2026-07-10T17:12:07.022Z

## Policy

Read-only. No source file was edited. The classifier never opened a `bm-XXX-form-inputs.tsx` with edit intent.

## Holdout list (12) — verified against canonical matrix

Source: `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`

- BM-024
- BM-039
- BM-041
- BM-049
- BM-050
- BM-051
- BM-077
- BM-079
- BM-082
- BM-089
- BM-099
- BM-200

## Summary

- Total reviewed: **127**
- SEMANTIC_UI_CHANGE: **127**
- WHITESPACE_ONLY: 0
- LINE_ENDING_ONLY: 0
- IMPORT_ONLY: 0
- NO_CHANGE: 0
- UNKNOWN: 0
- Holdouts affected: **5** (BM-024, BM-039, BM-041, BM-089, BM-099)
- RuntimeReady allowlist (BM-001, BM-171) affected: 0
- Protected route / form-studio leak: 0

## Behavioral-signal counters (per-file, derived from diff body)

- Date input/format/parse touches: 7
- Input handler (onChange/onBlur/controlled) touches: 0
- Save/submit/patch handler touches: 25
- Preview/template/runtime-resolution touches: 0
- Data-binding (useState/Form/setForm*) touches: 119

## Top 10 largest diffs (semantic, by absolute line count)

| BM | Path | Normal diff lines |
|----|------|------------------:|
| BM-037 | apps/web/src/components/documents/bm-037-form-inputs.tsx | 142 |
| BM-044 | apps/web/src/components/documents/bm-044-form-inputs.tsx | 135 |
| BM-038 | apps/web/src/components/documents/bm-038-form-inputs.tsx | 117 |
| BM-070 | apps/web/src/components/documents/bm-070-form-inputs.tsx | 113 |
| BM-045 | apps/web/src/components/documents/bm-045-form-inputs.tsx | 110 |
| BM-039 | apps/web/src/components/documents/bm-039-form-inputs.tsx | 109 |
| BM-042 | apps/web/src/components/documents/bm-042-form-inputs.tsx | 109 |
| BM-043 | apps/web/src/components/documents/bm-043-form-inputs.tsx | 109 |
| BM-071 | apps/web/src/components/documents/bm-071-form-inputs.tsx | 83 |
| BM-090 | apps/web/src/components/documents/bm-090-form-inputs.tsx | 79 |

## Holdouts affected (5 of 12)

| BM | Normal diff lines | Has date change | Has input change | Has save change | Has preview change | Has data-binding change |
|----|------------------:|:----------------|:-----------------|:----------------|:-------------------|:------------------------|
| BM-024 | 29 | - | - | - | - | Y |
| BM-039 | 109 | - | - | Y | - | Y |
| BM-041 | 29 | - | - | - | - | Y |
| BM-089 | 39 | - | - | - | - | Y |
| BM-099 | 28 | - | - | - | - | Y |

## Important notes

- The 127 modified files are **all SEMANTIC_UI_CHANGE**. None are pure whitespace, line-ending, or import-only changes. This makes any "formatting-only" claim in earlier stages unsupportable.
- 5 of the 12 PARTIAL holdouts are affected: BM-024, BM-039, BM-041, BM-089, BM-099. The remaining 7 holdouts (BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-200) are NOT in this diff.
- Neither BM-001 nor BM-171 are PARTIAL holdouts (they are PASS canaries), but the diff includes BM-001 with a substantive SEMANTIC_UI_CHANGE that touches sample-fixture data (no runtime behavior change). Phase 8A policy does not flag canary files as protected, only holdouts.
- No file in the diff references `/admin/form-studio`, `FormStudioModule`, `form-permissions`, or `admin/form-templates|drafts|reviews|versions`. The protected-route leak count is **0**.
- The classifier intentionally does NOT auto-classify TEST_EVIDENCE_SYNC or SEMANTIC_DATA_BINDING_CHANGE because distinguishing them from SEMANTIC_UI_CHANGE requires reading surrounding function context, which token-frequency heuristics cannot do reliably. All 127 files were therefore classified conservatively as SEMANTIC_UI_CHANGE, with per-file behavioral signals (date/input/save/preview/data-binding) recorded separately for human review.

## Codex-blocker justification check

- No `.tmp-bm006-top-right-template-calibration/` artifact or `scripts/audit/plan-bmXXX-*` justification references BM-XXX-form-inputs changes outside BM-006.
- The BM-001 change is a `fillCustomerSample()` fixture rewrite. The diff comment explicitly cites `apps/web/src/lib/form-flight/profiles/bm001.ts` (BM001_DEMO profile) as the alignment source. This is consistent with the FormFlight BM-001 canary pilot work, not a free-form rewrite.
