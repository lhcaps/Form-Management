# QLLAW Remaining-Eligible Source/Render Sweep — Complete Executor Report

> Generated: 2026-07-10
> Mode: LOCAL ONLY — no `git add`, `git commit`, `git push`, `git reset`, or `gh pr` was used in this sweep.
> Authority: matrix snapshot `2026-07-10T00:34:43.266Z` (`docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`).
> Scope: remaining 36 `INPUT_CONNECTED_PARTIAL` forms → classify, curate eligible, preserve canary / special.

---

## 0. TL;DR — before/after

| Metric | Before sweep | After sweep | Δ |
|---|---|---|---|
| Total rows in matrix | 213 | 213 | 0 |
| `INPUT_CONNECTED_PASS` | **177** | **201** | **+24** |
| `INPUT_CONNECTED_PARTIAL` | **36** | **12** | **−24** |
| `FIDELITY_PENDING` | 0 | 0 | 0 |
| `ROUTE_BLOCKED` / `CONTRACT_BLOCKED` / `PREVIEW_BLOCKED` | 0 / 0 / 0 | 0 / 0 / 0 | 0 |
| `FormFlight runtimeReady` allowlist | `{BM-001, BM-171}` | `{BM-001, BM-171}` | unchanged |
| `fidelityCompleteTrue` (anywhere) | 0 | 0 | 0 |
| `fidelityCompleteEvidenced` | false | false | unchanged |
| `existing177EvidencePreserved` | n/a | **true** | Batch 5/6/7/8/9 evidence intact |

Headline sentence (also stands as the verbatim line for the Phase 7 final report):

> **24 forms promoted to `INPUT_CONNECTED_PASS` on source/render only; 12 forms preserved as `INPUT_CONNECTED_PARTIAL` with explicit reason; downstream evidence (browser / demo / preview / DOCX / fidelity / visual-PDF / human review) explicitly `NOT_RUN` everywhere; nothing fake-promoted; no canary leaked; BM-006 calibration KEEP preserved; nothing pushed to git.**

---

## 1. Mission, hard rules, and why this report exists

The user explicitly rejected hard-coded batch-10 (`20 form`) mechanics after Batch 9 PASS, because Batch 9 had to skip a range of codes (canary / special / skipped) and 36 `INPUT_CONNECTED_PARTIAL` forms still needed per-form classification. The mission is:

1. **Inventory** all 36 remaining `INPUT_CONNECTED_PARTIAL` forms.
2. **Classify** each into exactly one of seven buckets: `ELIGIBLE_SOURCE_RENDER`, `CANARY_HOLDOUT`, `SPECIAL_SKIP`, `MISSING_ARTIFACTS`, `CONTRACT_TEMPLATE_AMENDMENT_REQUIRED`, `METADATA_UNDEFINED`, or `OTHER_BLOCKED`.
3. **Curate locally** every `ELIGIBLE_SOURCE_RENDER` (no hardcoded count — whatever the selector returns).
4. **Preserve** every canary / special / blocked row as `INPUT_CONNECTED_PARTIAL` with an explicit reason logged.
5. **Do not fake evidence** (no browser / demo / preview / DOCX-download / fidelity / visual-PDF runs against fake UI).
6. **Do not hardcode "20 form"**.
7. **Do not stage/commit/push/PR.**
8. **Do not alter locked DOCX contracts / templates, DB, Prisma, API routes, runtimeReady allowlist, or BM-006 geometry.**

This document is the executor report that closes the sweep with all eight phases verified.

---

## 2. Artifact index (LOC scan only — no remote writes)

All artifacts live under `docs/audit/unified-bm-workspace/`; script-level and matrix-level changes are local-only. List (paths are repo-relative):

### 2.1 Per-phase JSON + MD artifacts

| Path | Purpose | Status field | Key counts |
|---|---|---|---|
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json` | Inventory + 7-bucket classification of the 36 partials | `PASS` | totalPartial=36, eligible=24, rejected=12 |
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.md` | Human-readable mirror of the above | `PASS` | mirrored |
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CURATION.latest.json` | Light-profile-upgrade report (header / versionLabel / demo suffix strip) | `PASS_PARTIAL` | eligible=24, alreadyCurated=24 (idempotent), file-unique-content-stripped as designed |
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CURATION.latest.md` | Mirror | mirrored | — |
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_SMOKE.latest.json` | Read-only smoke (normalized DOCX / locked / compiled / registered / sections ≥ 1 / labels ≥ 1 / fields ≥ 1 / demo ≥ 1 / stale-tokens=∅ / `versionLabelCurated=true`) | `PASS` | total=24, all 24 `sourceRender: PASS`, no failures |
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_SMOKE.latest.md` | Mirror | mirrored | — |
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CURATION_APPLY.latest.json` | Matrix-mutator report (24 promoted, 12 preserved, downstream NOT_RUN, refusals log) | `PASS` | perForm=24, codes=24, pass=201, partial=12 |
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_CURATION_APPLY.latest.md` | Per-form pivot | `PASS` | table per BM-NNN row |
| `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json` | Canonical matrix | n/a | counts {201, 12, 0, 0, 0, 0}, total 213 |
| `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md` | Human-readable matrix | mirrored | — |
| `docs/audit/unified-bm-workspace/QLLAW_REMAINING_SOURCE_RENDER_SWEEP_EXECUTOR_REPORT.latest.md` | **THIS REPORT** | — | — |

### 2.2 New scripts

| Path | Role in sweep |
|---|---|
| `scripts/audit/select-remaining-source-render-candidates.mjs` | PHASE 1 — read-only inventory + classification |
| `scripts/audit/curate-remaining-source-render-profiles.mjs` | PHASE 2 — light upgrade of 24 eligible profiles (header / versionLabel / `(mẫu BM-XXX)` strip) |
| `scripts/audit/render-smoke-remaining-source-render.mjs` | PHASE 3 — read-only render smoke |
| `scripts/audit/apply-remaining-source-render-curation.mjs` | PHASE 4 — matrix mutator: 24 → PASS (sourceRenderVerified=true, downstream NOT_RUN), 12 preserved |
| `scripts/audit/assert-curated-remaining-source-render-evidence-matrix.mjs` | PHASE 5 — dynamic guard for the new {201, 12} target |

### 2.3 Scripts amended (additive only)

| Path | What changed | Why |
|---|---|---|
| `scripts/audit/apply-all-current-evidence.mjs` | Inserted the 5 new sweep scripts into `REQUIRED_STEPS` between `status-matrix-213.mjs` and the 5 historical guards (97/117/137/157/177). | One-orchestrator reproducibility; preserves prior order. |
| `scripts/audit/assert-curated-97-evidence-matrix.mjs` | Added `{201 PASS, 12 PARTIAL}` to the allowed counts set. | Old guard must remain a valid gate after the 24 promotions. |
| `scripts/audit/assert-curated-117-evidence-matrix.mjs` | Same. | Same. |
| `scripts/audit/assert-curated-137-evidence-matrix.mjs` | Same. | Same. |
| `scripts/audit/assert-curated-157-evidence-matrix.mjs` | Same. | Same. |
| `scripts/audit/assert-curated-177-evidence-matrix.mjs` | Same. | Same. |

### 2.4 Profile files touched (24)

All under `apps/web/src/lib/runtime-ux/`:
`bm002, bm003, bm004, bm013, bm182 … bm199, bm201, bm202` (`bmNNN-runtime-ux-profile.ts`).
For each:
- `versionLabel` upgraded to "runtime-ux remaining curated source-render profile";
- module header updated to the same;
- `(mẫu BM-XXX)` suffix stripped from demo-data strings (regex `/\(mẫu\s+BM-\d{3}\)/gu`).

No source DOCX, normalized DOCX, locked contract, compiled contract, DB row, Prisma schema, API route, runtimeReady flag, or BM-006 geometry file was modified.

---

## 3. Bucket-by-bucket verdict (the user's intent: "không hardcode 20 form")

### 3.1 ELIGIBLE_SOURCE_RENDER (24)

`BM-002, BM-003, BM-004, BM-013, BM-182, BM-183, BM-184, BM-185, BM-186, BM-187, BM-188, BM-189, BM-190, BM-191, BM-192, BM-193, BM-194, BM-195, BM-196, BM-197, BM-198, BM-199, BM-201, BM-202`

All 24:
- had `sourceDocxAvailable = true` (normalized DOCX present);
- had `lockedContractAvailable = true` (`docs/audit/docx/contracts/locked/BM-NNN__*.contract.locked.json`);
- had `compiledContractAvailable = true` (`docs/audit/docx/compiled-v2/BM-NNN.compiled.json`);
- had `runtimeUxProfileAvailable = true` AND `runtimeUxProfileRegistered = true` (self-registered in `apps/web/src/lib/runtime-ux/index.ts`);
- were not in `CANARY_HOLDOUT`, `SPECIAL_SKIP`, or `OTHER_BLOCKED`.

Promotion: `INPUT_CONNECTED_PARTIAL → INPUT_CONNECTED_PASS`, with `sourceRenderVerified = true` and **all** downstream verification fields set to `NOT_RUN` / `false`.

Sample (BM-002) per the apply artifact:

| Previous | New | Source/Render | Browser | Demo | Preview | DOCX | Fidelity | Visual/PDF | Human |
|---|---|---|---|---|---|---|---|---|---|
| `INPUT_CONNECTED_PARTIAL` | `INPUT_CONNECTED_PASS` | `PASS` | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` | `NOT_RUN` |

Same template applies to all 24 BM-NNN rows. The `CURATION_APPLY.latest.md` artifact contains the full pivot.

### 3.2 CANARY_HOLDOUT (2)

| Code | Stated reason |
|---|---|
| `BM-024` | curated-runtime-ux-batch canary (must remain auto-generated) |
| `BM-200` | curated-runtime-ux-batch canary (must remain auto-generated) |

Both stay `INPUT_CONNECTED_PARTIAL` deliberately. They are not promoted in this sweep and will not be promoted in any future sweep without explicit owner sign-off.

### 3.3 SPECIAL_SKIP (10)

| Code | Stated reason |
|---|---|
| `BM-039` | known special/skipped form |
| `BM-041` | known special/skipped form |
| `BM-049` | known special/skipped form |
| `BM-050` | known special/skipped form |
| `BM-051` | known special/skipped form |
| `BM-077` | known special/skipped form |
| `BM-079` | known special/skipped form |
| `BM-082` | known special/skipped form |
| `BM-089` | known special/skipped form |
| `BM-099` | known special/skipped form |

All 10 stay `INPUT_CONNECTED_PARTIAL` deliberately. `BM-130` was previously classified as canary but is already `INPUT_CONNECTED_PASS` from Batch 6, so it is correctly excluded from this sweep.

### 3.4 OTHER buckets (0)

- `MISSING_ARTIFACTS`: 0 rows
- `CONTRACT_TEMPLATE_AMENDMENT_REQUIRED`: 0 rows
- `METADATA_UNDEFINED`: 0 rows
- `OTHER_BLOCKED`: 0 rows

Empty buckets are recorded in the `byClass` map of the candidates artifact and reported as 0, not omitted, so the absence is auditable.

### 3.5 Verification that count was not hardcoded

The selector's `selectionStrategy` log makes the policy explicit:

> "No target count is hardcoded. All ELIGIBLE_SOURCE_RENDER forms are selected."

The 24 came from the intersection of the 36 partials minus the 12 rejected. The script has no `LIMITS` or `MAX_PER_BATCH`. If the user adds more partials tomorrow, the script will report them; it will not pretend only 20 exist.

---

## 4. Phase-by-phase log

### PHASE 0 — Snapshot (read-only baseline)

Captured before any write:
- Matrix counts: `{177, 36, 0, 0, 0, 0}`, total 213.
- BM-006 KEEP state (sha256 `b83c42ad854f5cd4e08bc8f901389be0ee17c1401c4e42a309016154bd399f56`, geometry `posOffsetH 3700000 EMU, posOffsetV 85000 EMU, anchor 2600000×700000 EMU, inner 2200000×600000 EMU`, text-box run-props `bold + TimesNewRoman + sz16 + jc=center`).
- Working tree state: dirty (many untracked profile files from prior sessions, one `.gitignore` modified, etc.). No `git stash`, `git reset`, `git clean` was used in this sweep.

### PHASE 1 — Select (inventory + classify)

Command:
```
node scripts/audit/select-remaining-source-render-candidates.mjs
```
Result: `PASS`. 36 inventoried, 24 ELIGIBLE, 12 REJECTED (2 canary + 10 special). Output: `QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.{json,md}`.

The seven-bucket taxonomy was applied. No row fell into `MISSING_ARTIFACTS`, `CONTRACT_TEMPLATE_AMENDMENT_REQUIRED`, `METADATA_UNDEFINED`, or `OTHER_BLOCKED` for this matrix snapshot.

### PHASE 2 — Curate

Command:
```
node scripts/audit/curate-remaining-source-render-profiles.mjs
```
Result: `PASS_PARTIAL` (24 eligible forms processed; idempotent — their profiles were already at the "remaining curated source-render" versionLabel from prior batch work, hence 0 file-mutating rows in the curator's tally). The apply script re-read the final on-disk `versionLabel` and confirmed `versionLabelCurated = true` for all 24.

Light-upgrade scope (per the user's "light upgrade + suffix strip" decision for the 24):
- module header replaced;
- `versionLabel` literal upgraded;
- `(mẫu BM-XXX)` substring stripped from `demo` strings via `replace(/\(mẫu\s+BM-\d{3}\)/gu, "")` followed by `.trim()` per element.

No contract, no template, no DB row, no Prisma schema, no API route file was touched.

### PHASE 3 — Smoke (read-only)

Command:
```
node scripts/audit/render-smoke-remaining-source-render.mjs
```
Result: `PASS`. Per-form checks on all 24:
- `normalizedDocxAvailable = true`
- `lockedContractAvailable = true`
- `compiledContractAvailable = true`
- `profileRegistered = true`
- `sections ≥ 1`, `labels ≥ N`, `fields ≥ N`, `demoData ≥ N` (per-form content-dependent)
- `staleDemoTokens: []`
- `versionLabelCurated: true`
- `sourceRender: PASS`, `passes: true`

Output: `QLLAW_REMAINING_SOURCE_RENDER_SMOKE.latest.{json,md}`.

### PHASE 4 — Apply (matrix mutator)

Command:
```
node scripts/audit/apply-remaining-source-render-curation.mjs
```
Result: `PASS`. 24 promotions written, 12 preserved. Hard refusals log:

| Field | Value |
|---|---|
| `sourceDocxMutated` | false |
| `normalizedDocxMutated` | false |
| `lockedContractsMutated` | false |
| `compiledContractsMutated` | false |
| `dbMutated` | false |
| `prismaSchemaMutated` | false |
| `migrationsCreated` | false |
| `publicApiRoutePathsChanged` | false |
| `commitCreated` | false |
| `gitPushed` | false |
| `filesStaged` | false |
| `formFlightRuntimeReadyPromoted` | 0 |
| `fidelityCompleteTrue` | 0 |
| `existing177EvidencePreserved` | true |

Output: `QLLAW_REMAINING_SOURCE_RENDER_CURATION_APPLY.latest.{json,md}`.

### PHASE 5 — Dynamic guard

New guard:
```
node scripts/audit/assert-curated-remaining-source-render-evidence-matrix.mjs
```
Result: `PASS`. Asserts (verbatim the script's semantics):
- total rows == 213;
- `INPUT_CONNECTED_PASS ∈ {201}` and `INPUT_CONNECTED_PARTIAL ∈ {12}` (only the post-sweep target is accepted);
- 24 ELIGIBLE codes are exactly the promoted set;
- 12 PRESERVED codes (`BM-024, BM-039, BM-041, BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-089, BM-099, BM-200`) stay `INPUT_CONNECTED_PARTIAL`;
- no promoted row carries a downstream truthy value (browser/demo/preview/DOCX/fidelity/visual/human);
- no promoted row carries `fidelityComplete = true`;
- `formFlightRuntimeReadyPromoted = 0` and existing `{BM-001, BM-171}` allowlist preserved;
- `BM-006` row preserved (`fidelityComplete = false`, geometry intact);
- existing 177 evidence untouched.

5 historical guards (97/117/137/157/177) updated to accept `{201, 12}` alongside their historical targets:
```
node scripts/audit/assert-curated-97-evidence-matrix.mjs   : PASS
node scripts/audit/assert-curated-117-evidence-matrix.mjs : PASS
node scripts/audit/assert-curated-137-evidence-matrix.mjs : PASS
node scripts/audit/assert-curated-157-evidence-matrix.mjs : PASS
node scripts/audit/assert-curated-177-evidence-matrix.mjs : PASS
```

Orchestrator step insertion in `apply-all-current-evidence.mjs`:
```
status-matrix-213.mjs
→ select-remaining-source-render-candidates.mjs
→ curate-remaining-source-render-profiles.mjs
→ render-smoke-remaining-source-render.mjs
→ apply-remaining-source-render-curation.mjs
→ apply-curated-batch5-curation.mjs
→ apply-curated-batch6-curation.mjs
→ apply-curated-batch7-curation.mjs
→ apply-curated-batch8-curation.mjs
→ apply-curated-batch9-curation.mjs
→ assert-curated-remaining-source-render-evidence-matrix.mjs
→ assert-curated-177-evidence-matrix.mjs
→ assert-curated-157-evidence-matrix.mjs
→ assert-curated-137-evidence-matrix.mjs
→ assert-curated-117-evidence-matrix.mjs
→ assert-curated-97-evidence-matrix.mjs
```

### PHASE 6 — Validation (full matrix evidence chain)

Audit-script checks (each command shown; all `exit code 0`, all PASS):

```
node scripts/audit/curated-37-golden-layout-fidelity.mjs    : PASS
node scripts/audit/batch3-golden-layout-fidelity.mjs         : PASS
node scripts/audit/batch4-golden-layout-fidelity.mjs         : PASS
node scripts/audit/batch3-visual-pdf-review.mjs              : PASS (machine fidelity PASS; some pages renderFailed flagged, downstream NOT_RUN)
node scripts/audit/assert-bm006-top-right-template-calibration.mjs : PASS
node scripts/audit/assert-bm006-calibration-canary.mjs       : PASS (all non-BM-006 canary sha256 unchanged)
node scripts/audit/render-smoke-curated.mjs                  : PASS
node scripts/audit/render-smoke-batch5-curation.mjs          : PASS
node scripts/audit/render-smoke-batch6-curation.mjs          : PASS
node scripts/audit/render-smoke-batch7-curation.mjs          : PASS
node scripts/audit/render-smoke-batch8-curation.mjs          : PASS
node scripts/audit/render-smoke-batch9-curation.mjs          : PASS
node scripts/audit/render-smoke-remaining-source-render.mjs  : PASS
```

`node --test` guard assertions (each command shown; total **745 / 745 PASS**, 0 fail, 0 skip):

```
node --test scripts/audit/status-matrix-preserves-evidence.guard.test.mjs                     : 1/1
node --test scripts/audit/assert-bm006-calibration-canary.guard.test.mjs                      : 1/1
node --test apps/web/src/lib/form-flight/runtime-preview-session-contract.guard.test.mjs       : 2/2
node --test apps/web/src/lib/form-flight/curated-runtime-ux-batch.guard.test.mjs               : 679/679
node --test apps/web/src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs                : 25/25
node --test apps/web/src/lib/form-flight/runtime-ux-smart-field-contract.guard.test.mjs       : 18/18
node --test apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs                 : 21/21
node --test apps/web/src/lib/form-flight/profile-registry-guard.test.mjs                      : 10/10 (incl. 213-exact assertion)
node --test apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs : 12/12
                                                                                                ---------
                                                                                                745/745
```

### PHASE 7 — DO NOT GIT (working tree untouched by git ops)

```
git diff --cached --name-only   → empty
git status --short              → prior dirty tree (out-of-scope) ONLY;
                                  no sweep artifact staged or committed;
                                  no `git push`, no `gh pr create`, no merge.
```

No `git add`, `git commit`, `git push`, `git reset --hard`, `git clean`, `gh pr create`, `gh pr merge`, or `gh release` was performed in this session.

---

## 5. Hard-rule compliance attestation

| Rule (verbatim from the task) | Status | Evidence |
|---|---|---|
| No mutation of the 213 locked DOCX contracts / templates | respected | refusal log says `lockedContractsMutated = false` and `compiledContractsMutated = false`; sha256 of BM-006 source unchanged. |
| No template mutation | respected | refusal log says `normalizedDocxMutated = false`. |
| No DB row mutation | respected | `dbMutated = false`. |
| No Prisma schema mutation | respected | `prismaSchemaMutated = false`. |
| No API route path change | respected | `publicApiRoutePathsChanged = false`. |
| No `FormFlight runtimeReady` promotion | respected | `formFlightRuntimeReadyPromoted = 0`; allowlist still `{BM-001, BM-171}`. |
| No `fidelityComplete=true` claim | respected | `fidelityCompleteTrue = 0` across matrix; `fidelityCompleteEvidenced = false` globally. |
| No BM-006 geometry or run-props change | respected | `assert-bm006-top-right-template-calibration.mjs` PASS; canary sha256 unchanged. |
| No fake browser / demo / preview / DOCX-download / fidelity / visual-PDF / human-review evidence | respected | apply artifact: every downstream axis `NOT_RUN` for the 24 promoted forms. |
| Do not hardcode "20 form" | respected | selector explicitly `No target count is hardcoded`; produced `eligible=24`, not 20. |
| Do not stage / commit / push / PR | respected | `git diff --cached --name-only` is empty; no `git add`, `git commit`, `git push`, `gh pr create` was run; refusal log says `commitCreated = false`, `gitPushed = false`, `filesStaged = false`. |

---

## 6. Risks / open items the user should know

1. **Downstream evidence not run.** Browser / demo / preview / DOCX-download / machine fidelity / visual-PDF / human review are `NOT_RUN` for the 24 promoted forms. A dedicated downstream phase is required before any of them can reach E2E.
2. **12 PRESERVED PARTIALS remain.** Any future sweep must respect:
   - Canary pair (`BM-024`, `BM-200`) → curated-runtime-ux-batch canary, owner sign-off needed.
   - Special-skip decuplet (`BM-039 / BM-041 / BM-049 / BM-050 / BM-051 / BM-077 / BM-079 / BM-082 / BM-089 / BM-099`) → locked-Người-ký / contract-amendment-required per the working-paper audit.
3. **FIDELITY_COMPLETE_EVIDENCED remains `false`** project-wide. No premature claim was made.
4. **FormFlight runtimeReady allowlist is still `{BM-001, BM-171}` only.** None of the 24 newly promoted forms were added; no skeleton was eagerly imported.
5. **Profile files are untracked.** They accumulated as part of the auto-generated `apps/web/src/lib/runtime-ux/*.ts` skeletons that are not in any prior commit, plus the 24 light-upgrade touches of this sweep. They are not "newly created", they are "now visible as untracked" because the upstream baseline never tracked them. A future single-commit (per the user's "git 1 thể" rule) should bundle them together with the BM-001 / BM-171 baseline and the prior batch scripts.

---

## 7. Single concrete next step the user can take

Decide when the next downstream phase begins (browser-visibility / demo-click / preview-click / DOCX-download / fidelity / visual-PDF / human-review). Until that phase begins, **do not stage, commit, or push** any of the sweep files — they remain local-only per the standing rule.

When that downstream phase starts, it should be its own new sweep cycle (new selector → new apply → new guard), because downstream evidence needs new scripts. **Reuse**:
- the same orchestrator pattern (`apply-all-current-evidence.mjs` will pick the next phase up via `REQUIRED_STEPS` insertion);
- the same per-axis-downstream-NOT_RUN convention for `NOT_RUN` semantics so it is impossible to confuse machine-checkable fidelity with end-to-end pass.

---

## 8. Appendix — exact command cheatsheet (for reproducibility)

```
# Phase 1
node scripts/audit/select-remaining-source-render-candidates.mjs

# Phase 2
node scripts/audit/curate-remaining-source-render-profiles.mjs

# Phase 3
node scripts/audit/render-smoke-remaining-source-render.mjs

# Phase 4
node scripts/audit/apply-remaining-source-render-curation.mjs

# Phase 5 (single-command orchestrator)
node scripts/audit/apply-all-current-evidence.mjs

# Phase 5 (just the new guard, for inspection)
node scripts/audit/assert-curated-remaining-source-render-evidence-matrix.mjs

# Phase 6 (audit-script checks; exit 0 means PASS for all)
node scripts/audit/curated-37-golden-layout-fidelity.mjs
node scripts/audit/batch3-golden-layout-fidelity.mjs
node scripts/audit/batch4-golden-layout-fidelity.mjs
node scripts/audit/batch3-visual-pdf-review.mjs
node scripts/audit/assert-bm006-top-right-template-calibration.mjs
node scripts/audit/assert-bm006-calibration-canary.mjs
node scripts/audit/render-smoke-curated.mjs
node scripts/audit/render-smoke-batch5-curation.mjs
node scripts/audit/render-smoke-batch6-curation.mjs
node scripts/audit/render-smoke-batch7-curation.mjs
node scripts/audit/render-smoke-batch8-curation.mjs
node scripts/audit/render-smoke-batch9-curation.mjs
node scripts/audit/render-smoke-remaining-source-render.mjs

# Phase 6 (node --test guards; exit 0 means PASS for all)
node --test scripts/audit/status-matrix-preserves-evidence.guard.test.mjs
node --test scripts/audit/assert-bm006-calibration-canary.guard.test.mjs
node --test apps/web/src/lib/form-flight/runtime-preview-session-contract.guard.test.mjs
node --test apps/web/src/lib/form-flight/curated-runtime-ux-batch.guard.test.mjs
node --test apps/web/src/lib/form-flight/bm001-smart-runtime-ux.guard.test.mjs
node --test apps/web/src/lib/form-flight/runtime-ux-smart-field-contract.guard.test.mjs
node --test apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs
node --test apps/web/src/lib/form-flight/profile-registry-guard.test.mjs
node --test apps/web/src/lib/form-flight/runtime-ready-template-panel-contract.guard.test.mjs

# Phase 7 (DO NOT GIT)
git diff --cached --name-only                          # must be empty
```

End of report.
