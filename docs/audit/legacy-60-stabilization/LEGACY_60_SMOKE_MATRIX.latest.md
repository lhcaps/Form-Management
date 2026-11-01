# Legacy 60 Smoke Matrix (BM-171 Vertical Slice context)

> Generated: 2026-07-05T15:39:11.499Z
> Scope: **smoke classification only**. No deep fix. No mass rollout. No locked contract mutation.
> Total forms: 60

## Summary

| Status | Count |
|---|---:|
| READY | 27 |
| NEEDS_FIX | 33 |
| BLOCKED | 0 |
| NOT_RUN | 0 |

## Smoke checks applied per form

- `componentFileExists` — `apps/web/src/components/documents/bm-NNN-form-inputs.tsx` present
- `primaryExportPresent` — `export function BmNNNFormInputsPanel(...)` found
- `registryEntryPresent` — entry in `bm-panel-registry.generated.ts`
- `demoFixtureHasBareUndefined` — fixture contains literal `undefined`
- `demoFixtureHasBareInvalidDate` — fixture contains literal `Invalid Date`
- `saveHandlerPresent` — `saveDocumentFormInputs` (or equivalent) called
- `renderHandlerPresent` — render/preview plumbing present (workspace-level also valid)

## Per-form classification

| BM | Status | Reasons |
|---|---|---|
| BM-001 | READY | — |
| BM-002 | NEEDS_FIX | demo fixture contains bare 'undefined' string; no saveDocumentFormInputs call present |
| BM-003 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-005 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-006 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-007 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-008 | NEEDS_FIX | demo fixture contains bare 'undefined' string; no saveDocumentFormInputs call present |
| BM-009 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-010 | NEEDS_FIX | demo fixture contains bare 'undefined' string; no saveDocumentFormInputs call present |
| BM-011 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-012 | NEEDS_FIX | demo fixture contains bare 'undefined' string; no saveDocumentFormInputs call present |
| BM-014 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-015 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-016 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-017 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-018 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-023 | READY | — |
| BM-030 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-031 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-033 | READY | — |
| BM-037 | READY | — |
| BM-038 | READY | — |
| BM-039 | READY | — |
| BM-040 | READY | — |
| BM-042 | READY | — |
| BM-043 | READY | — |
| BM-044 | READY | — |
| BM-045 | READY | — |
| BM-046 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-047 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-053 | READY | — |
| BM-054 | READY | — |
| BM-055 | READY | — |
| BM-056 | READY | — |
| BM-057 | READY | — |
| BM-058 | READY | — |
| BM-059 | READY | — |
| BM-070 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-071 | NEEDS_FIX | demo fixture contains bare 'undefined' string; no saveDocumentFormInputs call present |
| BM-085 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-086 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-090 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-097 | READY | — |
| BM-103 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-104 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-141 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-144 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-145 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-146 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-148 | READY | — |
| BM-150 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-156 | NEEDS_FIX | no saveDocumentFormInputs call present |
| BM-159 | READY | — |
| BM-166 | READY | — |
| BM-168 | READY | — |
| BM-169 | READY | — |
| BM-170 | READY | — |
| BM-171 | READY | — |
| BM-172 | NEEDS_FIX | demo fixture contains bare 'undefined' string; BM-172 known adapter problem (export name & props mismatch) |
| BM-173 | READY | — |

## Known blockers called out by the task

- BM-172 documented adapter problem: workspace wraps it via `_Bm172FormInputsPanelAdapter` because `bm-172-form-inputs.tsx` exports `Bm172FormInputs` (not `Bm172FormInputsPanel`) with `Bm172FormInputsProps` that does not match the registry's `{documentId, onSaved}` contract.

## Forbidden scope check

- No commit. No push. No PR.
- No PR7B started. No PR7C started. No mass rollout of 213 forms.
- No deep fix performed on any of the 60 forms.
- No canonicalization of 55 non-canonical forms.
- No mutation of locked contracts or normalized DOCX.
- No auth/RBAC rewrite. No monolithic backend renderer copy.
- No further work on `/templates/BM-171` generic UX.

## Recommendation

- This matrix is the classification input for any future per-BM rollout. Do not deep-fix from this matrix in a single pass.

