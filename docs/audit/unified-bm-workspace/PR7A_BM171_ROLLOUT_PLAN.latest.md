# PR7A — BM-171 Single Rollout: Future Implementation Plan

> **Audience:** the Planner who will open the next PR
> (`feat/pr7a-bm171-rollout`). This document is the implementation
> plan ONLY. Code, profile files, spec files, audit runs, and visual
> sign-off are all future PR work; this intake PR produces no
> executable code on those paths.
>
> **Status:** pre-flight. Read together with
> `PR7A_BM171_INTAKE.latest.md` (slots / mapping / footnotes /
> style / rendered evidence) before opening the implementation PR.

## 0. Why this plan is split into 4 sub-PRs

The future PR7A work is **non-trivial**, so it mirrors the BM-001
release cadence:

| sub-PR | scope | PR-diff footprint |
|---|---|---|
| PR7A.1 | final audit + form-inputs panel + adapter | form-inputs files + per-BM adapter |
| PR7A.2 | BM-171 style profile + rendered-DOCX parity spec | one profile file + two test files + 5-line registry tweak |
| PR7A.3 | final audit re-run + rollout readiness gate + visual sign-off packet | artefacts only (no source code) |
| PR7A.4 | strict-rules checklist + Planner sign-off | commit-only; no diff to runtime |

Single-PR alternative: combine all four into one. The Planner-
verified PR6G.* precedent shows smaller PRs surface the engine
correctness and mapping correctness separately. Recommend keeping
the split.

## 1. PR7A.1 — final audit + form-inputs panel + adapter

**Branch:** `feat/pr7a1-bm171-form-inputs`

### Files to add

| path | purpose |
|---|---|
| `apps/web/src/components/documents/bm-171-form-inputs.tsx` (NEW or REPLACES existing) | the BM-171 form-inputs panel; mirrors `bm-001-form-inputs.tsx` post-PR6G.* shape |
| `apps/web/src/lib/bm171-form-inputs-api.ts` (NEW) | the BM-001 analogue at `bm001-form-inputs-api.ts` (types + API helper + section merge + date normalisation) |
| `apps/web/src/components/documents/bm-form/derived/bm-171-derived.ts` (NEW) | the BM-171 shared mapping derived-field logic, calling `@qllaw/form-contracts` helpers |
| `apps/web/src/components/documents/bm-form/requirements/bm-171.requirements.ts` (NEW) | the BM-171 requirements declarations (5 sections, 34 canonical fields) |
| `apps/web/src/components/documents/bm-form/requirements/bm-171.requirements.test.ts` (NEW) | unit tests for the requirements declarations (renders without throwing, section count, field count match §4) |
| `apps/api/src/modules/documents/rendering/infrastructure/bm171-form-inputs-adapter.ts` (NEW) | the per-BM narrow adapter. Imports from `@qllaw/form-contracts`; emits aligned companion fields like `bm171DocumentIssuePlaceDateLineAligned`. |

### Files to modify

| path | change |
|---|---|
| `apps/api/src/modules/documents/document-renderer.service.ts` | narrow BM-171 dispatch: when `templateCode === 'BM-171'`, route the payload through the BM-171 adapter and consume the aligned companion fields. NO other branches should reference `BM-171`. |

### Files NOT to touch (strict)

| path | why |
|---|---|
| `apps/web/src/components/documents/bm-001-form-inputs.tsx` | BM-001 unchanged. |
| `apps/api/src/.../style-profile/*` | profile is out of scope for PR7A.1. |
| `apps/web/src/lib/bm-001-form-inputs-api.ts` | BM-001 unchanged. |
| `packages/form-contracts/**` (shared toolkit) | the toolkit is the source of truth for BM-001 + future BMs; we only CONSUME it, we do NOT mutate it for a per-BM PR. |
| `docs/audit/docx/contracts/locked/BM-171*` | locked contract is immutable. |

### Audit runs in this PR

```
pnpm audit:bm-final -- BM-171
```

This produces:

- `docs/audit/bm-final/BM-171/final.latest.json`
- `docs/audit/bm-final/BM-171/final.latest.md`
- `docs/audit/unified-bm-workspace/BM171_FIELD_COVERAGE.latest.json` (one-shot artefact written alongside the BM-001 analogue, committed in this PR).

Expected status after PR7A.1:

| section | status | rationale |
|---|---|---|
| `sourceDocx` | PASS | normalized DOCX exists. |
| `fieldCoverage` | PASS | 34/34 slots covered (per §9 of intake report). |
| `renderedContent` | PASS after PR7A.2 parity spec runs; until then, `NOT_RUN` is acceptable. | the parity spec proves zero leaked placeholders + zero drift tokens. |
| `docxParts` | PASS | matches the BM-001 shape (no headers/footers, no real footnotes). |
| `style` | `MANUAL_REQUIRED` until Planner eyeball on the rendered DOCX. | the PR6G.5 gate 15 enforces this. |
| `safety` | PASS | no fake `generatedDocumentId`, no `/templates` DB write. |
| `sourceGuardFindings` | 22 (matches the BM-001 baseline). | no source-guard regression. |

### Tests to add (jest)

| path | purpose |
|---|---|
| `apps/web/src/components/documents/bm-171-form-inputs.test.tsx` | renders the new panel against a mocked `getDocumentRenderPayload`; asserts the 5 sections, all required fields, all `include*DecisionLine` toggles work, save flow succeeds. |
| `apps/api/src/modules/documents/rendering/infrastructure/bm171-form-inputs-adapter.spec.ts` | unit tests for the narrow adapter: empty inputs do NOT fabricate, identity-input passthrough, formatted-date companion fields use leading zeros, `archiveLine` uses `'Lưu: HSVA, HSKS, VP.'` (not the BM-001 legacy `'Lưu: HSVV, VP.'`). |

### Validation commands (Planner must run before merge)

```
pnpm --filter web exec tsc --noEmit
pnpm --filter api exec tsc --noEmit
pnpm --filter web lint
pnpm --filter api lint
pnpm --filter web exec jest --testPathPatterns "bm-171-form-inputs|bm-171.requirements"
pnpm --filter api exec jest --testPathPatterns "bm171-form-inputs-adapter"
pnpm audit:bm-final -- BM-171
```

`pnpm audit:bm-final -- BM-171` MUST exit 0 with `status: PASS` (or
`MANUAL_REQUIRED` if no rendered DOCX has been eyeballed yet).

## 2. PR7A.2 — BM-171 style profile + rendered-DOCX parity spec

**Branch:** `feat/pr7a2-bm171-style-profile`

### Files to add

| path | purpose |
|---|---|
| `apps/api/src/modules/documents/rendering/infrastructure/style-profile/bm171-style-profile.ts` (NEW) | exports `BM171_STYLE_PROFILE` (7 rules from `PR7A_BM171_STYLE_PROFILE_REQUIREMENTS.latest.md` §6). |
| `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts` (NEW) | analogue of the BM-001 parity spec; uses the canonical fixture from `PR7A_BM171_RENDERED_TEXT_EVIDENCE.latest.md` §5. |
| `apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-bm171-style-profile.spec.ts` (NEW) | analogue of the BM-001 style integration spec; asserts no-op for non-BM-171 templates, auto-application for BM-171, non-regression of mapping. |

### Files to modify

| path | change |
|---|---|
| `apps/api/src/.../style-profile/index.ts` | import `BM171_STYLE_PROFILE`; append to `BUILTIN_PROFILES`. |

### Files NOT to touch

| path | why |
|---|---|
| `apps/api/src/.../style-profile/docx-style-rule-engine.ts` | engine is generic. |
| `apps/api/src/.../style-profile/docx-style-profile.types.ts` | types are generic. |
| `apps/api/src/.../style-profile/template-style-profile.registry.ts` | registry is generic. |
| `apps/api/src/.../style-profile/bm001-style-profile.ts` | BM-001 unchanged. |

### Style profile rule-set summary

7 rules, all `match.type: 'contains'`, all `part: 'document'`:

| rule id | matcher | style |
|---|---|---|
| `bm171.place_date_line` | `TP. Hồ Chí Minh,` | italic + 14pt |
| `bm171.body_title` | `QUYẾT ĐỊNH` | bold + 14pt |
| `bm171.subtitle` | `TRẢ LẠI TÀI SẢN` | bold + 14pt |
| `bm171.article_1` | `Điều 1.` | bold + 14pt |
| `bm171.article_2` | `Điều 2.` | bold + 14pt |
| `bm171.noi_nhan` | `Nơi nhận:` | bold + 14pt |
| `bm171.archive_line` | `Lưu: HSVA, HSKS, VP.` | 11pt |

See `PR7A_BM171_STYLE_PROFILE_REQUIREMENTS.latest.md` §6 for the
full file body.

### Tests (jest) — required

- The two new spec files above MUST pass.
- The existing BM-001 specs (`pr6g31-bm001-rendered-docx-parity.spec.ts`,
  `docxtemplater-contract-render-engine-style-profile.spec.ts`)
  MUST still pass — BM-171 is additive.

### Validation commands

```
pnpm --filter api exec tsc --noEmit
pnpm --filter api exec jest --testPathPatterns "style-profile|pr6g31-bm171"
pnpm --filter api exec jest --testPathPatterns "docx-inspection-rendered-preservation"
pnpm audit:bm-final -- BM-171
```

`pnpm audit:bm-final -- BM-171` MUST report `status: PASS` for the
`docxParts` + `renderedContent` sections.

## 3. PR7A.3 — final audit re-run + rollout readiness gate + visual sign-off packet

**Branch:** `feat/pr7a3-bm171-readiness-gate`

### Files to add

| path | purpose |
|---|---|
| `apps/api/scripts/build-bm171-visual-signoff-packet.mjs` (NEW) | analogue of `build-bm001-visual-signoff-packet.mjs` (e.g. `apps\api\scripts\render-bm001-canonical-signoff.mjs` per git status). Renders the BM-171 canonical fixture through `DocxtemplaterContractRenderEngine` + the BM-171 style profile, writes the rendered DOCX + extracted text + document-xml inspection JSON into `docs/audit/bm-visual-signoff/BM-171/`. |
| `docs/audit/bm-visual-signoff/BM-171/visual-signoff.latest.json` (NEW) | the structured sign-off evidence packet. |

### Generated artefacts (commit only the structural ones)

| path | generated by | committed? |
|---|---|---|
| `docs/audit/bm-visual-signoff/BM-001/*.docx` (BM-001 only) | existing tool | unchanged in this PR |
| `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx` | `build-bm171-visual-signoff-packet.mjs` | depends on .gitignore (binary) — see strict rule below |
| `docs/audit/bm-visual-signoff/BM-171/extracted-text.latest.txt` | same | YES (text) |
| `docs/audit/bm-visual-signoff/BM-001/visual-signoff.latest.json` (BM-001 only) | existing tool | unchanged in this PR |
| `docs/audit/bm-visual-signoff/BM-171/visual-signoff.latest.json` | same | YES |
| `docs/audit/bm-visual-signoff/BM-171/document-xml-inspection.latest.json` | same | YES |
| `docs/audit/bm-visual-signoff/BM-171/manual-approval.latest.md` | hand-written by Planner post-eyeball | YES |
| `docs/audit/bm-visual-signoff/BM-171/manual-approval.latest.json` | hand-written by Planner post-eyeball | YES |
| `docs/audit/bm-rollout/BM-171/readiness.latest.json` | `audit-bm-rollout-ready.mjs` | YES (this PR produces it via `node scripts/audit/audit-bm-rollout-ready.mjs BM-171`) |
| `docs/audit/bm-rollout/BM-171/readiness.latest.md` | same | YES |
| `storage/temp/pr7a-bm171-canonical-signoff/**` | temp render scratch | NO (gitignored) |

### Audit runs in this PR

```
pnpm audit:bm-final -- BM-171
node scripts/audit/audit-bm-rollout-ready.mjs BM-171
```

### Expected outcomes BEFORE Planner eyeball

```
[audit-bm-rollout-ready] BM-171: status=BLOCKED_MANUAL_REVIEW technicalReady=true manualReviewRequired=true rolloutReady=false
```

### Strict-rule checklist

- [x] No mass rollout — single explicit `--bm=BM-171`.
- [x] No mutation of `apps/api/.../style-profile/bm001-style-profile.ts` or any BM-001 file.
- [x] No new entry to `BM_CORE_REGISTRY` (none exists for any BM; we only read it).
- [x] No fake `generatedDocumentId` (gate 12 still scans runtime files).
- [x] No DB write from `/templates/...` (gate 13 still scans runtime files).
- [x] `rolloutReady: false` until Planner eyeball on `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx` flips `style.status` to PASS via `manual-approval.latest.json`.

## 4. PR7A.4 — Planner sign-off + final report

**Branch:** `feat/pr7a4-bm171-planner-signoff`

This PR is the human step. After Planner eyeballs the rendered DOCX
in `docs/audit/bm-visual-signoff/BM-171/rendered.latest.docx`:

- Planner writes `docs/audit/bm-visual-signoff/BM-171/manual-approval.latest.json`
  with `decision: 'GRANTED'`, `visualSignoffGranted: true`,
  `approver: 'Planner'`, `reviewedDocxSha256: <sha256 of rendered.latest.docx>`.
- `node scripts/audit/audit-bm-rollout-ready.mjs BM-171` re-run. Final output:
  ```
  [audit-bm-rollout-ready] BM-171: status=READY technicalReady=true manualReviewRequired=false rolloutReady=true
  ```
- `docs/audit/bm-rollout/BM-171/readiness.latest.{json,md}` re-write with
  `rolloutReady: true`.
- A final commit (sign-off only; no source diff) carries the
  manual-approval + refreshed readiness.

The future PR MAY be replaced by a Planner-triggered re-run of
`audit:bm-rollout-ready -- BM-171` instead of a code PR, as the
PR6G.5 gate is "a reader, not a decision maker" (per PR6G.5 docs).
Either path is acceptable.

## 5. Risk register (Planner-verified)

| risk | mitigation |
|---|---|
| The intake report's predicted `docxParts` block differs from what the PR6G.1 inspector actually reports for the BM-171 normalized DOCX. | §10 of the intake report accepts that the inspector is the source of truth. If the inspector finds e.g. real `<w:footnote>` entries, the future PR adjusts (and appends a failure-log entry). |
| The BM-171 source DOCX has Word-encoded separators only — confirmed by `extract` JSON, but confirmed again at audit run time. | §6 status `NOT_APPLICABLE_BY_TEMPLATE` is the correct gate shape. |
| The future PR accidentally re-uses BM-001's matcher text in `bm171-style-profile.ts`. | §3 of `PR7A_BM171_STYLE_PROFILE_REQUIREMENTS.latest.md` is explicit: matcher texts are BM-171-body-specific. |
| The future PR's diff accidentally touches a BM-001 file. | strict-rule checklist row "BM-001 unchanged" + a future PR reviewer's `git diff --name-only` step. |
| §10's predicted final audit is `PASS` for BM-171 but the inspector finds a real blocker. | the future PR's planning step runs `pnpm audit:bm-final -- BM-171` first (a dry run); if it returns `BLOCKED_TECHNICAL`, the future PR is redesigned, not silently papered over. |
| `BM171_FIELD_COVERAGE.latest.json` row count diverges from `docxSlots` array length in the locked contract (34 vs 37). | the locked contract has 37 entries; 3 are alt-name duplicates of the same canonical slot. The intake report uses 34 distinct slotIds. The future PR's coverage artefact MUST verify by canonical path, not by array index. |

## 6. Acceptance criteria (overall, post PR7A.4)

1. `pnpm audit:bm-final -- BM-171` reports `status: PASS`,
   `rolloutReady: true`, `harnessReady: true`.
2. `node scripts/audit/audit-bm-rollout-ready.mjs BM-171` reports
   `status: READY`, `rolloutReady: true`, exit 0.
3. All 14 technical gates (PR6G.5 gates 1..14) are PASS or
   NOT_APPLICABLE for BM-171.
4. Gate 15 (`visual-style-signoff`) is PASS.
5. No BM-001 file was modified.
6. No `BM-002..BM-213` artefact was generated.
7. No locked DOCX or locked contract was mutated.
8. The BM-171 form-inputs panel renders against a fresh seed and
   saves back to the API without errors.
9. The rendered DOCX contains every "must contain" string and is
   free of every "must NOT contain" string in §1/§2 of
   `PR7A_BM171_RENDERED_TEXT_EVIDENCE.latest.md`.

## 7. What this plan does NOT do

- ❌ It does NOT implement the BM-171 panel in **this intake PR**.
- ❌ It does NOT register `BM171_STYLE_PROFILE` in **this intake PR**.
- ❌ It does NOT write any code under `apps/api/src/...` in **this intake PR**.
- ❌ It does NOT modify `apps/web/src/components/documents/bm-171-form-inputs.tsx`.
- ❌ It does NOT run `audit:bm-final` or `audit:bm-rollout-ready` for
  BM-171 in **this intake PR**.
- ❌ It does NOT create `docs/audit/bm-final/BM-171/` or
  `docs/audit/bm-rollout/BM-171/` in **this intake PR**.
- ❌ It does NOT mark BM-171 `READY` until the human sign-off lands.

This plan is metadata-only. The future implementation PR is what
opens the actual code changes.
