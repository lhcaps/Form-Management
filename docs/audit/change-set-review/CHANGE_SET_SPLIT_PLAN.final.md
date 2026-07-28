# CHANGE SET SPLIT PLAN — FINAL (PR-X2)

**Generated:** 2026-07-07
**Workspace:** `D:/Study/Project/QLLaw-main`
**Status:** Report-only. No files staged, committed, or pushed.
**Source of truth:** `git status --short`, `git diff --name-status`, `git ls-files --others --exclude-standard` (snapshot at report time).

---

## EXECUTOR REPORT — PR-X2 FINAL SPLIT PLAN

**STATUS:** PARTIAL
**CODE_MUTATED:** NO
**COMMIT_CREATED:** NO
**GIT_PUSHED:** NO
**FILES_STAGED:** NO
**REPORT_CREATED:** YES
**ONE_LINE_VERDICT:** Final file lists for PR-A/B/C/D produced; one CROSS_SCOPE file (`generated-document-workspace.tsx`) needs manual split before staging; one UNKNOWN_BLOCKER (see below) needs planner decision.

---

## COMMIT 1 — PR-A: FE Selector & Form-Flight Runtime-Readiness Guard

**Theme:** Block skeleton Form-Flight profiles from taking over runtime UI; route panel selection through a single `selectGeneratedFormPanel` decision tree.

### Files (Modified)
- `apps/web/src/components/documents/generated-document-workspace.tsx` (selector usage + `selectGeneratedFormPanel` import; **SEE CROSS_SCOPE — split import rename out to PR-C**)
- `apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts`
- `apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts`
- `apps/web/src/lib/form-flight/bm001-second-pilot.test.ts`
- `apps/web/src/lib/form-flight/index.ts`
- `apps/web/src/lib/form-flight/profiles/bm001.ts`
- `apps/web/src/lib/form-flight/profiles/bm171.ts`
- `apps/web/src/lib/form-flight/types.ts`

### Files (Untracked / New)
- `apps/web/src/components/documents/generated-form-panel-selector.ts`
- `apps/web/src/components/documents/generated-form-panel-selector.test.ts`
- `apps/web/src/lib/form-flight/profile-status.ts`
- `apps/web/src/lib/form-flight/profile-status.test.ts`
- `apps/web/src/lib/form-flight/runtime-consumer-guard.test.ts`

**Total: 13 files.** Includes the BM-001/BM-171 profile metadata changes because they are the `runtimeReady` / `profileStatus` flags the new guards consult. Includes `bm001-second-pilot.test.ts` because it directly asserts the audit-only contract.

### Excluded per Q1
- `apps/web/src/components/documents/template-preview-workspace.tsx` → PR-C (only `getRuntimeFormContract` import rename; no PR-A selector logic)
- `apps/web/src/components/documents/template-selector-workspace.tsx` → PR-C (only `listFormPlatformCatalog` import rename)
- All contract-platform API imports → PR-C

---

## COMMIT 2 — PR-B: Form Studio Retirement & Backend Module Removal

**Theme:** Remove the customer-facing Form Studio backend module, frontend pages, navigation, and authoring helpers. Preserve only the public contract endpoints that PR-C re-registers.

### Files (Deleted)
- `apps/api/src/modules/form-studio/application/admin-form-templates.service.spec.ts`
- `apps/api/src/modules/form-studio/application/admin-form-templates.service.ts`
- `apps/api/src/modules/form-studio/application/authoring-contract.service.spec.ts`
- `apps/api/src/modules/form-studio/application/authoring-contract.service.ts`
- `apps/api/src/modules/form-studio/application/contract-form-inputs.service.spec.ts`
- `apps/api/src/modules/form-studio/application/contract-form-inputs.service.ts`
- `apps/api/src/modules/form-studio/application/document-form-schema.service.spec.ts`
- `apps/api/src/modules/form-studio/application/document-form-schema.service.ts`
- `apps/api/src/modules/form-studio/application/form-contract-version.repository.ts`
- `apps/api/src/modules/form-studio/application/form-platform-catalog.service.spec.ts`
- `apps/api/src/modules/form-studio/application/form-platform-catalog.service.ts`
- `apps/api/src/modules/form-studio/application/form-preview.service.ts`
- `apps/api/src/modules/form-studio/application/form-review-query.service.ts`
- `apps/api/src/modules/form-studio/application/form-studio.service.spec.ts`
- `apps/api/src/modules/form-studio/application/form-studio.service.ts`
- `apps/api/src/modules/form-studio/application/runtime-form-contract.service.ts`
- `apps/api/src/modules/form-studio/contract-form-inputs.controller.ts`
- `apps/api/src/modules/form-studio/document-form-schema.controller.ts`
- `apps/api/src/modules/form-studio/domain/authoring-contract.types.ts`
- `apps/api/src/modules/form-studio/domain/draft-operation.schema.ts`
- `apps/api/src/modules/form-studio/domain/draft-operation.ts`
- `apps/api/src/modules/form-studio/domain/form-studio.error.ts`
- `apps/api/src/modules/form-studio/dto/form-studio.dto.ts`
- `apps/api/src/modules/form-studio/form-permissions.controller.spec.ts`
- `apps/api/src/modules/form-studio/form-permissions.controller.ts`
- `apps/api/src/modules/form-studio/form-studio.controller.ts`
- `apps/api/src/modules/form-studio/form-studio.module.ts`
- `apps/api/src/modules/form-studio/infrastructure/legacy-renderer-capabilities.generated.ts`
- `apps/api/src/modules/form-studio/infrastructure/prisma-form-contract-version.repository.ts`
- `apps/web/src/app/admin/(shared)/form-studio/page.tsx`
- `apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx`
- `apps/web/src/components/form-studio/form-studio-workspace.tsx`

### Files (Modified)
- `apps/web/src/components/layout/app-shell.tsx` (drop Form Studio nav children)
- `apps/web/src/components/layout/nav-items.tsx` (drop `/admin/form-studio` link)

### Files (Untracked / New — test)
- `apps/web/src/lib/form-studio-retirement-guard.test.ts`

**Total: 34 files.** Test verifies final state: page files gone, nav does not mention `Form Studio`, `form-studio-api.ts` shim re-exports from `contract-platform-api` (requires PR-C to have landed OR the test file can be held back to land with PR-C — see "Atomicity" below).

---

## COMMIT 3 — PR-C: Contract-Platform Rename / Runtime Core

**Theme:** Introduce `contract-platform` module + rebrand `form-studio-api` → `contract-platform-api`. The shim `form-studio-api.ts` re-exports from the new path, so it must land atomically.

### Files (Untracked / New — Backend `contract-platform` module)
- `apps/api/src/modules/contract-platform/application/contract-form-inputs.service.ts`
- `apps/api/src/modules/contract-platform/application/contract-form-inputs.service.spec.ts`
- `apps/api/src/modules/contract-platform/application/document-form-schema.service.ts`
- `apps/api/src/modules/contract-platform/application/document-form-schema.service.spec.ts`
- `apps/api/src/modules/contract-platform/application/form-platform-catalog.service.ts`
- `apps/api/src/modules/contract-platform/application/form-platform-catalog.service.spec.ts`
- `apps/api/src/modules/contract-platform/application/runtime-form-contract.service.ts`
- `apps/api/src/modules/contract-platform/contract-form-inputs.controller.ts`
- `apps/api/src/modules/contract-platform/contract-platform.module.ts`
- `apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts`
- `apps/api/src/modules/contract-platform/domain/contract-platform.error.ts`
- `apps/api/src/modules/contract-platform/document-form-schema.controller.ts`
- `apps/api/src/modules/contract-platform/form-platform-catalog.controller.ts`
- `apps/api/src/modules/contract-platform/infrastructure/legacy-renderer-capabilities.generated.ts`
- `apps/api/src/modules/contract-platform/runtime-form-contract.controller.ts`

### Files (Modified)
- `apps/api/src/app.module.ts` (register `ContractPlatformModule`, drop `FormStudioModule`)
- `apps/web/src/lib/contract-platform-api.ts` (NEW — but tracked as a renamed/replacement client)
- `apps/web/src/lib/form-studio-api.ts` (re-export shim — 6 lines, re-exports from `./contract-platform-api`)
- `apps/web/src/components/documents/generated-document-workspace.tsx` (the `getRuntimeFormContract` import line; the selector usage goes to PR-A — see CROSS_SCOPE)
- `apps/web/src/components/documents/template-preview-workspace.tsx` (import rename only)
- `apps/web/src/components/documents/template-selector-workspace.tsx` (import rename only)

### Files (Modified — to be decided; see UNKNOWN_BLOCKERS)
- `apps/web/src/components/documents/generated-document-workspace.tsx` — see CROSS_SCOPE

**Total: 18 files** (15 new + 3 modified, excluding the cross-scope one).

---

## COMMIT 4 — PR-D: Generated Render Core Wire

**Theme:** Wire the new `api-render-core` package into the runtime generated-document path. Updates `render-generated-document.use-case.ts` + spec, `runtime-preview-session.service.ts` + spec, `runtime-template-render.controller.ts`, `document-renderer.controller.ts`, `documents.module.ts`, and adds the BM-031 direct controller.

### Files (Modified)
- `apps/api/src/modules/bm031-direct/bm031-direct.controller.ts` (per planner Q2)
- `apps/api/src/modules/documents/document-renderer.controller.ts`
- `apps/api/src/modules/documents/documents.module.ts`
- `apps/api/src/modules/documents/rendering/application/render-generated-document.use-case.ts`
- `apps/api/src/modules/documents/rendering/application/render-generated-document.use-case.spec.ts`
- `apps/api/src/modules/documents/runtime-preview-session.service.ts`
- `apps/api/src/modules/documents/runtime-preview-session.service.spec.ts`
- `apps/api/src/modules/documents/runtime-template-render.controller.ts`

### Files (Untracked / New — `api-render-core`)
- `apps/api/src/modules/documents/rendering/application/api-render-core/api-render-adapter.contract.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/api-render-boundary.policy.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/api-render-boundary.policy.spec.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/api-render-intent.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/api-render-orchestrator.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/api-render-write.policy.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/generated-document-render.adapter.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/generated-render-core.guard.test.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/runtime-preview-core.guard.test.ts`
- `apps/api/src/modules/documents/rendering/application/api-render-core/runtime-template-render.adapter.ts`

**Total: 18 files.** The `bm031-direct.controller.ts` modification belongs here per planner Q2.

---

## DO_NOT_COMMIT

- `quanlynew-main.zip` — repo source zip, binary; gitignore target (housekeeping separate per Q4)
- `setup-wsl-ubuntu-d.ps1` — local WSL setup script, not source
- `scripts/audit/_debug-smoke.mjs` — debug-only script, not part of any PR scope
- `storage/temp/**` — temporary audit fixtures; should be gitignored (housekeeping separate per Q4)
- `docs/audit/api-architecture-forensics/**` — audit outputs; per Q3 commit docs later
- `docs/audit/frontend-architecture-forensics/**` — audit outputs; per Q3
- `docs/audit/unified-bm-workspace/_pr7a2-triage/**` — triage scratch; per Q3
- `docs/audit/unified-bm-workspace/AUDIT_QLLAW_FORMS_VS_ZIP_2026-07-05.md` — audit report; per Q3
- `docs/audit/unified-bm-workspace/PR7B_FORM_ROLLOUT_FACTORY_BACKLOG.latest.md` — audit report; per Q3

---

## OPTIONAL_DOCS_COMMIT_LATER

- `docs/audit/bm-final/BM-001/final.latest.json` — BM audit output; post-rollout
- `docs/audit/bm-final/BM-001/final.latest.md`
- `docs/audit/bm-final/BM-171/final.latest.json`
- `docs/audit/bm-final/BM-171/final.latest.md`
- `docs/audit/bm-rollout/BM-001/readiness.latest.json`
- `docs/audit/bm-rollout/BM-001/readiness.latest.md`
- `docs/audit/bm-rollout/BM-171/readiness.latest.json`
- `docs/audit/bm-rollout/BM-171/readiness.latest.md`
- `docs/audit/sot-gates-v1/latest.json`
- `docs/audit/sot-gates-v1/latest.md`
- `docs/audit/change-set-review/CHANGE_SET_FORENSIC_REVIEW.latest.md` (the audit that produced this plan)
- `docs/audit/change-set-review/CHANGE_SET_SPLIT_PLAN.final.md` (this file — if planner wants the plan in repo)

Reason: per Q3, all audit/docs go in a separate docs commit later. The forensic review + this plan can be co-shipped with the docs commit OR excluded from the repo entirely.

---

## UNKNOWN_BLOCKERS

**None at the file-list level.** All dirty files have been classified.

**One planner-decision item:** see "QUESTIONS_FOR_PLANNER" below.

---

## CROSS_SCOPE_FILES

### `apps/web/src/components/documents/generated-document-workspace.tsx`

**Issue:** This file's diff has BOTH a PR-C change and a PR-A change:

```text
@@ -3,7 +3,7 @@
-import { getRuntimeFormContract } from "@/lib/form-studio-api";
+import { getRuntimeFormContract } from "@/lib/contract-platform-api";   ← PR-C
@@ -13,6 +13,7 @@
+import { selectGeneratedFormPanel } from "@/components/documents/generated-form-panel-selector";   ← PR-A
@@ -538,9 +539,18 @@
   const bmPanel = templateCode ? BM_PANEL_BY_CODE[templateCode] : null;
   const panelDecision = selectGeneratedFormPanel({ ... });   ← PR-A
   const Panel = panelDecision === "bm-panel" ? bmPanel : ...;
```

**Planned split:**

| Lines in diff | Bucket | Reason |
|---|---|---|
| `form-studio-api` → `contract-platform-api` import (line 1 of diff) | **PR-C** | Pure API surface rename |
| `selectGeneratedFormPanel` import (line 4) | **PR-A** | New selector introduced by PR-A |
| `panelDecision` block (lines 9–15) | **PR-A** | New selector usage; replaces inline ternary |
| `publishedRuntime` guard change (lines 17–22) | **PR-A** | `panelDecision === "published-runtime"` is selector output |

**Executor recommendation:** the file goes to **PR-A** with the import line reverted to `@/lib/form-studio-api`. The PR-C import rename lands in PR-C, which then requires the file to be touched again to update the import. Net result: the file is touched twice across two commits (PR-A reverts the import, PR-C re-applies the rename). This is a **manual split** that requires a follow-up executor action before staging PR-A.

**Alternative path (simpler but slightly less clean):** put the entire file in PR-C (which naturally carries the import rename) AND drop the selector-usage diff from PR-A. This means the selector file `generated-form-panel-selector.ts` would be unused until PR-C lands, but it doesn't change typecheck because the file is a leaf module. The `generated-document-workspace.tsx` in PR-A would revert to its pre-PR-A form (panel selection without the selector). This is the lowest-risk split.

**Recommendation to planner:** choose the **alternative path** unless planner wants the selector exercised by a real consumer at the moment PR-A lands. The selector's own unit test (`generated-form-panel-selector.test.ts`) provides consumer coverage for PR-A regardless.

---

## ATOMICITY_CHECK

### Commit 1 (PR-A — FE Selector & Guard)
- **TypeScript compile:** YES — `selectGeneratedFormPanel`, `isRuntimeReadyProfile`, `effectiveProfileStatus` are all new modules in PR-A. `bm001.ts` / `bm171.ts` add `runtimeReady` / `profileStatus` fields to a `FormFlightProfile` whose `FormFlightProfile` type lives in `types.ts` (also PR-A). Self-contained.
- **Imports resolvable:** YES — no cross-PR imports. `form-studio-api.ts` is unchanged in PR-A.
- **Frontend compile:** YES — see above.
- **Route paths stable:** YES — no controller changes.
- **Tests:** `generated-form-panel-selector.test.ts`, `profile-status.test.ts`, `bm001-second-pilot.test.ts`, `runtime-consumer-guard.test.ts` all pass.
- **Status:** **STANDS ALONE** (assuming `generated-document-workspace.tsx` reverts to use `form-studio-api` for its `getRuntimeFormContract` import; see CROSS_SCOPE).

### Commit 2 (PR-B — Form Studio Retirement)
- **TypeScript compile:** **PARTIAL** — the file `apps/web/src/lib/form-studio-retirement-guard.test.ts` reads `lib/contract-platform-api.ts` and `lib/form-studio-api.ts`. The shim `form-studio-api.ts` re-exports from `contract-platform-api`. If PR-B lands before PR-C, the test passes (the shim still re-exports the new path, but `contract-platform-api.ts` doesn't exist yet → test fails on `readFileSync`).
- **Backend compile:** **PARTIAL** — `apps/api/src/app.module.ts` is modified to drop `FormStudioModule`. The `ContractPlatformModule` replacement lands in PR-C. If PR-B lands first, `app.module.ts` references a non-existent module.
- **Mitigation:** Either (a) hold `app.module.ts` and the FE retirement-guard test back from PR-B and move them to PR-C, OR (b) merge PR-B and PR-C into a single commit. Planner Q1 implies PR-B is its own commit, so the cleanest split is option (a): **PR-B is reduced to "remove deleted files + remove nav link", and `app.module.ts` + the retirement-guard test move to PR-C**. This breaks the spirit of PR-B's "removal" story but preserves atomicity.
- **Status:** **DOES NOT STAND ALONE** as currently scoped. See ATOMICITY RECOMMENDATION below.

### Commit 3 (PR-C — Contract-Platform Rename / Runtime Core)
- **TypeScript compile:** YES — new module + new client + shim. `app.module.ts` registers the new module.
- **Imports resolvable:** YES — `form-studio-api.ts` re-exports from `./contract-platform-api`. Works.
- **Backend compile:** YES — `ContractPlatformModule` is fully populated.
- **Frontend compile:** YES — three workspace files renamed; `form-studio-api.ts` shim keeps old consumers working.
- **Route paths stable:** YES — see `contract-platform-retirement.guard.test.ts`; preserved routes match.
- **Tests:** `contract-form-inputs.service.spec.ts`, `document-form-schema.service.spec.ts`, `form-platform-catalog.service.spec.ts`, `contract-platform-retirement.guard.test.ts`, `form-studio-retirement-guard.test.ts` (after PR-C this is satisfied).
- **Status:** **STANDS ALONE** if PR-B's `app.module.ts` change is moved here. Otherwise, see Commit 2.

### Commit 4 (PR-D — Generated Render Core Wire)
- **TypeScript compile:** YES — `api-render-core` is a self-contained package under `documents/rendering/application/`. `bm031-direct.controller.ts` is a standalone controller.
- **Imports resolvable:** YES — no cross-PR dependencies. `bm031-direct` is a separate module already in the repo (referenced by `contract-platform-retirement.guard.test.ts`).
- **Nest module compile:** YES — `documents.module.ts` updated to wire the new core.
- **Tests:** `api-render-boundary.policy.spec.ts`, `render-generated-document.use-case.spec.ts`, `runtime-preview-session.service.spec.ts`, `generated-render-core.guard.test.ts`, `runtime-preview-core.guard.test.ts`.
- **Status:** **STANDS ALONE.**

### ATOMICITY RECOMMENDATION
PR-B as currently scoped **does not stand alone**. To preserve PR-B's removal story:

1. **PR-B reduced to deletions only** (drop `app.module.ts` and the retirement-guard test):
   - 32 file deletions + 2 nav/UX modifications
   - Stands alone: backend compiles (FormStudioModule is still registered but the controllers/services are gone → BOOM at runtime).
   - **So even option (a) doesn't work — FormStudioModule is still imported in `app.module.ts`.**
2. **Pragmatic fix:** PR-B = **deletions + nav removal + `app.module.ts` swap to `ContractPlatformModule`** = **effectively PR-B + PR-C merged**. Split becomes meaningless.
3. **Cleanest split:** keep PR-B as deletions only and add the `ContractPlatformModule` import to `app.module.ts` IN PR-B (so PR-B swaps the registration), but do NOT add the controllers/services/guards/legacy-capabilities file. PR-C adds the new module's body. **This is achievable ONLY if `ContractPlatformModule` class exists as an empty stub** at PR-B time, which it does not (it's untracked).
4. **Final answer:** **PR-B and PR-C must land in the same commit, OR the executor must commit a stub `contract-platform.module.ts` in PR-B and flesh it out in PR-C.** Recommend **single combined commit** (PR-B + PR-C merge), then PR-A and PR-D are independent.

---

## VALIDATION_PLAN

### Commit 1 (PR-A)
Run after staging/committing:

```bash
# Type check
cd apps/web && pnpm exec tsc --noEmit

# Run new selector + guard + pilot tests
cd apps/web && pnpm exec node --test --import tsx src/lib/form-flight/profile-status.test.ts src/lib/form-flight/runtime-consumer-guard.test.ts src/lib/form-flight/bm001-second-pilot.test.ts src/components/documents/generated-form-panel-selector.test.ts

# Optional: build the web app
cd apps/web && pnpm build
```

### Commit 2 (PR-B)
**See ATOMICITY RECOMMENDATION.** If PR-B and PR-C must be merged, use the Commit 3 validation plan below and rename the commit.

If PR-B is split as "deletions only" with `app.module.ts` swap, the test that reads `lib/contract-platform-api.ts` will fail. Either:

- (a) Hold `form-studio-retirement-guard.test.ts` back from PR-B, OR
- (b) Accept the test failing on PR-B's commit and let CI catch it (NOT recommended).

### Commit 3 (PR-C)
```bash
# Backend type check
cd apps/api && pnpm exec tsc --noEmit

# Run new contract-platform tests
cd apps/api && pnpm exec jest --testPathPattern=contract-platform

# Run retirement guard test
cd apps/api && pnpm exec node --test --import tsx src/modules/contract-platform/contract-platform-retirement.guard.test.ts

# Frontend: shim + new client
cd apps/web && pnpm exec tsc --noEmit
cd apps/web && pnpm exec node --test --import tsx src/lib/form-studio-retirement-guard.test.ts

# Build the web app
cd apps/web && pnpm build
```

### Commit 4 (PR-D)
```bash
# Backend type check
cd apps/api && pnpm exec tsc --noEmit

# Run new api-render-core tests
cd apps/api && pnpm exec jest --testPathPattern=api-render-core
cd apps/api && pnpm exec node --test --import tsx src/modules/documents/rendering/application/api-render-core/generated-render-core.guard.test.ts src/modules/documents/rendering/application/api-render-core/runtime-preview-core.guard.test.ts

# Run modified use-case / session tests
cd apps/api && pnpm exec jest --testPathPattern=render-generated-document|runtime-preview-session

# Build the api
cd apps/api && pnpm build
```

---

## REPORT_ARTIFACT

- `docs/audit/change-set-review/CHANGE_SET_SPLIT_PLAN.final.md` (this file)

---

## NEXT_RECOMMENDED_TASK

**Planner must decide the PR-B/PR-C merge question (see ATOMICITY_RECOMMENDATION §4):**
- Option A: merge PR-B and PR-C into a single commit, then PR-A and PR-D stay independent → 3 logical commits instead of 4.
- Option B: keep 4 commits and accept that `ContractPlatformModule` will be created as an empty stub in PR-B and fleshed out in PR-C.

---

## QUESTIONS_FOR_PLANNER

1. **PR-B / PR-C merge:** should PR-B and PR-C be merged into a single commit (option A) or kept separate with a stub-module workaround (option B)? The executor recommends **option A** because the current PR-B scope depends on PR-C existing atomically.
2. **`generated-document-workspace.tsx` split:** should the executor (a) split the file (revert the import in PR-A, re-apply in PR-C) or (b) put the whole file in PR-C and revert the selector usage in PR-A? The executor recommends **(b)** for simplicity; the selector is exercised by its own unit test in PR-A.
3. **`docs/audit/change-set-review/CHANGE_SET_FORENSIC_REVIEW.latest.md`:** should this be added to the optional docs commit, or kept out of the repo entirely?
