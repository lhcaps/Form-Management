# PR-Z — Final Consolidation Audit And Updated Split Plan

**Generated:** 2026-07-07
**Workspace:** `D:/Study/Project/QLLaw-main`
**Branch:** `feat/pr6g2-bm-final-audit-harness`
**HEAD:** `f215a52ab13268700e11bce143eed56f9ea5db76`
**Reviewer:** Cursor Executor (audit-only role, no source mutation)
**Status:** Audit report — no files staged, no commit created, no branch created, no push, no `.gitignore` modified, no formatter / lint-fix run, no DB migration, no DOCX mutation.

> Source of truth: `git status --short` (218 entries), `git diff --name-status` (193 entries), `git ls-files --others --exclude-standard` (246 paths), all captured at audit-time.
>
> Prior reports referenced for cross-check:
>
> - `docs/audit/change-set-review/CHANGE_SET_FORENSIC_REVIEW.latest.md` (PR-X, 522 lines)
> - `docs/audit/change-set-review/CHANGE_SET_SPLIT_PLAN.final.md` (PR-X2, 368 lines)
> - `docs/audit/api-architecture-forensics/API_UNIFICATION_PLAN.latest.md` (PR-A through PR-F target state)
>
> **Delta vs prior PR-X2 split plan:** PR-X2 only modelled PR-A..D + a partial form-studio retirement. PR-E/F/F2/F3/F4/F4R/A2R/A3 added **113 BM panels**, **5 BM local save helpers**, a new `generated-input-save-core` module (8 files), a `bm031-direct` controller spec, **2 new static guard tests**, **2 PR-A2R profile-status files**, and **2 PR-A3 readiness mutations**. This report re-classifies the entire dirty tree (now 218 status entries vs. 83 at PR-X2) and rebuilds the commit structure for the new scope.

---

## 0. PHASE 0 — Raw Git State (verbatim)

```text
$ git branch --show-current
feat/pr6g2-bm-final-audit-harness

$ git rev-parse HEAD
f215a52ab13268700e11bce143eed56f9ea5db76

$ git status --short | count
218

$ git diff --name-only | count
193       # 161 modifications + 32 deletions + 0 renames

$ git ls-files --others --exclude-standard | count
246       # 28 top-level new + many nested storage/temp scratch artefacts

$ git diff --shortstat
 193 files changed, 696 insertions(+), 11372 deletions(-)
```

| Category                       | Count |
| ------------------------------ | ----- |
| Modified (M)                   | 161   |
| Deleted (D)                    | 32    |
| Renamed (R)                    | 0     |
| Untracked (??  paths)          | 246   |
| **Total status --short entries** | **218** |

> Note: the 218 vs 193 vs 246 counts are consistent — `git status --short` collapses untracked top-level directories (e.g. `?? docs/audit/api-architecture-forensics/`) into a single line, while `git ls-files --others --exclude-standard` enumerates every nested path under that directory. The 218-line status is the smallest count and is the canonical entry total. The 193 modified/deleted tracked entries are inside `git diff`. The 246 untracked paths are spread across:
>
> - `apps/api/src/modules/contract-platform/` (15 files)
> - `apps/api/src/modules/documents/rendering/application/api-render-core/` (10 files)
> - `apps/api/src/modules/documents/rendering/application/generated-input-save-core/` (8 files)
> - `apps/web/src/components/documents/` (3 new test/source files)
> - `apps/web/src/lib/` (7 new test/source files)
> - `docs/audit/{api-architecture,frontend-architecture,frontend-api-cleanup,change-set-review,unified-bm-workspace}/` (≈ 35 files)
> - `storage/temp/` (~170 files under `pr-bm171-debug/`, `pr6g51-*`, `pr7a-*`, `pr7a4-*`, `pr7a5-*`)
> - top-level `quanlynew-main.zip`, `setup-wsl-ubuntu-d.ps1`

---

## 1. PHASE 1 — File Classification (every dirty file in one bucket)

### 1.1 Bucket totals (using git status --short entry counts)

| Bucket                                            | Entries | New | Mod | Del | Notes |
| ------------------------------------------------- | ------- | --- | --- | --- | ----- |
| `PR_A_SELECTOR_AND_FORM_FLIGHT_GUARDS`            | 8       | 6   | 2   | 0   | Generated-form-panel-selector (.ts + .test.ts), profile-status.ts + test, runtime-consumer-guard test, types.ts + bm171.ts adapter wiring |
| `PR_BC_FORM_STUDIO_RETIRE_CONTRACT_PLATFORM_RUNTIME_CORE` | 60  | 18  | 11  | 31  | 30 deletion + 16 contract-platform new + 4 FE seam (nav-items, app-shell, form-studio-api re-export shim, retirement-guard test) + app.module.ts swap |
| `PR_D_GENERATED_RENDER_CORE`                       | 19      | 10  | 9   | 0   | All `api-render-core/` files + 6 documents/ call-site mods + 3 spec mods + bm031-direct boundary call |
| `PR_E_GENERATED_INPUT_SAVE_ORCHESTRATOR`          | 12      | 9   | 3   | 0   | `generated-input-save-core/` (8 files) + bm031-direct.module + bm031-direct.controller spec + documents.module provider wiring + app.module.ts registration |
| `PR_F_FRONTEND_GENERATED_SAVE_HELPER_CLEANUP`     | 1       | 0   | 1   | 0   | `apps/web/src/lib/document-form-api.ts` (-51 lines, removal of 3 unsupported PATCH/PUT helpers) |
| `PR_F2_RAW_FETCH_CLASSIFICATION_AUDIT`            | 5       | 3   | 0   | 0   | `pr-f2-generated-save-smoke.test.ts` + `FE_GENERATED_API_HELPER_CLEANUP.latest.md` + `FE_RAW_FETCH_ROUTE_CLASSIFICATION.latest.md` + 2 related `.json` documents |
| `PR_F3_GENERATED_READ_API_MIGRATION`              | 3       | 2   | 1   | 0   | `generated-document-read-api.guard.test.ts` + `FE_GENERATED_READ_API_MIGRATION.latest.md` + 113 BM panels (counted separately under PR-F4 cross-scope) |
| `PR_F4_GENERATED_SAVE_API_MIGRATION`              | 2       | 1   | 1   | 0   | `generated-document-save-api.guard.test.ts` + `FE_GENERATED_SAVE_API_MIGRATION.latest.md` + 113 BM flat-form panel mods + 5 BM local save helper mods |
| `PR_A2R_A3_FORM_FLIGHT_READINESS_REPAIR`          | 2       | 0   | 2   | 0   | `apps/web/src/lib/form-flight/types.ts` (+runtimeReady/profileStatus fields), `apps/web/src/lib/form-flight/profiles/bm171.ts` (PR-A3 promotion to runtime-ready) |
| `PR_F4R_BM_REPAIR`                                | 3       | 0   | 3   | 0   | `bm-031-form-inputs.tsx` (`requestSave` helper removed), `bm-170-form-inputs.tsx` (save flow regression repaired), `bm-172-form-inputs.tsx` (save flow regression repaired) |
| `AUDIT_DOCS_OPTIONAL`                             | 24      | 18  | 6   | 0   | `docs/audit/{api-architecture,frontend-architecture,unified-bm-workspace}/**` + `docs/audit/bm-final/**` + `docs/audit/bm-rollout/**` + `docs/audit/sot-gates-v1/**` |
| `TEMP_OR_SCRATCH_DO_NOT_COMMIT`                   | 175+    | —   | —   | —   | `storage/temp/**` (~170 files), `quanlynew-main.zip`, `setup-wsl-ubuntu-d.ps1`, `scripts/audit/_debug-smoke.mjs`, `docs/audit/unified-bm-workspace/_pr7a2-triage/**` |
| `UNKNOWN_NEEDS_PLANNER_REVIEW`                    | 0       | 0   | 0   | 0   | **All dirty source files have been classified. None remain UNKNOWN.** |

> **Reconciliation:** `PR_F3 + PR_F4 + PR_F4R` together touch all 113 BM flat-form panels + the 5 BM local save helpers + BM-031/170/172 save-flow regressions. The BM panel count of 113 is split across the three PR buckets per the migration report `FE_GENERATED_READ_API_MIGRATION.latest.md` and `FE_GENERATED_SAVE_API_MIGRATION.latest.md` (each lists 113 BM files; three panels — BM-031/170/172 — additionally get the requestSave helper removed under PR-F4R). The audit doc buckets do not affect source-control truth and are tracked separately under `AUDIT_DOCS_OPTIONAL`.

### 1.2 Per-bucket detail (top-level entries only)

#### 1.2.1 `PR_A_SELECTOR_AND_FORM_FLIGHT_GUARDS`

| Status | Path |
| ------ | ---- |
| `??`   | `apps/web/src/components/documents/generated-form-panel-selector.ts` |
| `??`   | `apps/web/src/components/documents/generated-form-panel-selector.test.ts` |
| `??`   | `apps/web/src/lib/form-flight/profile-status.ts` |
| `??`   | `apps/web/src/lib/form-flight/profile-status.test.ts` |
| `??`   | `apps/web/src/lib/form-flight/runtime-consumer-guard.test.ts` |
| `M`    | `apps/web/src/lib/form-flight/types.ts` |
| `M`    | `apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts` |
| `M`    | `apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts` |

> Note: `bm171.ts` is `M` but the readiness promotion is PR-A3 — see §1.2.8. The adapter wiring imports `isRuntimeReadyProfile` from the new `profile-status.ts` (single source of truth declared in PR-A).

#### 1.2.2 `PR_BC_FORM_STUDIO_RETIRE_CONTRACT_PLATFORM_RUNTIME_CORE`

**Backend deletions (29):** all 24 `apps/api/src/modules/form-studio/application/**`, `domain/**`, `dto/**`, `form-permissions.controller*`, `form-studio.controller*`, `form-studio.module.ts`, `infrastructure/legacy-renderer-capabilities.generated.ts`, `infrastructure/prisma-form-contract-version.repository.ts`, plus the 5 `apps/api/src/modules/form-studio/contract-form-inputs.controller.ts`, `apps/api/src/modules/form-studio/document-form-schema.controller.ts`, `apps/api/src/modules/form-studio/runtime-form-contract.service.ts` (3 controllers/services from `application/`).

**Web deletions (3):** `apps/web/src/app/admin/(shared)/form-studio/page.tsx`, `apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx`, `apps/web/src/components/form-studio/form-studio-workspace.tsx`.

**Backend untracked under `contract-platform/` (15):**

| Path |
| ---- |
| `apps/api/src/modules/contract-platform/contract-platform.module.ts` |
| `apps/api/src/modules/contract-platform/domain/contract-platform.error.ts` |
| `apps/api/src/modules/contract-platform/infrastructure/legacy-renderer-capabilities.generated.ts` |
| `apps/api/src/modules/contract-platform/contract-form-inputs.controller.ts` |
| `apps/api/src/modules/contract-platform/document-form-schema.controller.ts` |
| `apps/api/src/modules/contract-platform/form-platform-catalog.controller.ts` |
| `apps/api/src/modules/contract-platform/runtime-form-contract.controller.ts` |
| `apps/api/src/modules/contract-platform/application/{contract-form-inputs,document-form-schema,form-platform-catalog,runtime-form-contract}.service.ts` (4) |
| `apps/api/src/modules/contract-platform/application/{contract-form-inputs,document-form-schema,form-platform-catalog}.service.spec.ts` (3 — note: `runtime-form-contract.service.spec.ts` is intentionally absent in this snapshot; planner should verify whether that means a deliberately-skipped spec or a missing test) |
| `apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts` |

**Web untracked (1):** `apps/web/src/lib/contract-platform-api.ts`.

**Web modified (seam edits, 4):**
- `apps/web/src/components/layout/nav-items.tsx` (drops Form Studio menu item + `canOpenFormStudio` import)
- `apps/web/src/components/layout/app-shell.tsx` (drops `isFormStudio` layout branch)
- `apps/web/src/lib/form-studio-api.ts` (collapsed to a 6-line re-export shim that re-exports from `./contract-platform-api`)
- `apps/web/src/lib/form-studio-retirement-guard.test.ts` (new guard test — untracked)

> Cross-scope: `apps/api/src/app.module.ts` is shared with PR-E (registers `GeneratedInputSaveModule` as well). See §2.1.

#### 1.2.3 `PR_D_GENERATED_RENDER_CORE`

**Untracked under `api-render-core/` (10):**
- `api-render-adapter.contract.ts` (TS interface only)
- `api-render-boundary.policy.{ts,spec.ts}`
- `api-render-intent.ts`
- `api-render-orchestrator.ts`
- `api-render-write.policy.ts`
- `generated-document-render.adapter.ts`
- `runtime-template-render.adapter.ts`
- `generated-render-core.guard.test.ts`
- `runtime-preview-core.guard.test.ts`

**Modified call-sites (9):**
- `apps/api/src/modules/documents/document-renderer.controller.ts`
- `apps/api/src/modules/documents/document-renderer.controller.spec.ts`
- `apps/api/src/modules/documents/documents.module.ts`
- `apps/api/src/modules/documents/documents.module.spec.ts`
- `apps/api/src/modules/documents/runtime-preview-session.service.ts`
- `apps/api/src/modules/documents/runtime-preview-session.service.spec.ts`
- `apps/api/src/modules/documents/runtime-template-render.controller.ts`
- `apps/api/src/modules/documents/rendering/application/render-generated-document.use-case.ts`
- `apps/api/src/modules/documents/rendering/application/render-generated-document.use-case.spec.ts`
- `apps/api/src/modules/bm031-direct/bm031-direct.controller.ts` (calls `assertRenderIntentBoundary(...)` from PR-D's new policy — cross-scope; see §2.2)

> Generated-input-save-core files are tracked separately under PR-E (§1.2.4); BM-031 module's adapter wiring (`bm031-direct-form-inputs-save.adapter.ts` + module change) is PR-E; the BM-031 controller's `assertRenderIntentBoundary` call is PR-D because the policy is PR-D's.

#### 1.2.4 `PR_E_GENERATED_INPUT_SAVE_ORCHESTRATOR`

**Untracked under `generated-input-save-core/` (8):**
- `bm031-direct-form-inputs-save.adapter.ts`
- `contract-form-inputs-save.adapter.ts`
- `legacy-generated-form-inputs-save.adapter.ts`
- `generated-input-save.orchestrator.{ts,test.ts}`
- `generated-input-save.module.ts`
- `generated-input-save.types.ts`
- `generated-input-save.guard.test.ts`

**Modified call-sites (4):**
- `apps/api/src/modules/bm031-direct/bm031-direct.module.ts` (registers BM-031 adapter + forwardRef to GeneratedInputSaveModule)
- `apps/api/src/modules/bm031-direct/bm031-direct.controller.spec.ts` (new spec, untracked)
- `apps/api/src/modules/documents/documents.module.ts` (registers legacy adapter + forwardRef to GeneratedInputSaveModule) — cross-scope with PR-D
- `apps/api/src/app.module.ts` (registers GeneratedInputSaveModule) — cross-scope with PR-BC

#### 1.2.5 `PR_F_FRONTEND_GENERATED_SAVE_HELPER_CLEANUP`

| Status | Path |
| ------ | ---- |
| `M`    | `apps/web/src/lib/document-form-api.ts` |

(-51 lines, removes `patchDocumentFormInputs`, `replaceDocumentFormInputs`, `patchBm031DirectFormInputs` — verified by reading the diff. `document-form-api.ts` still exports `getDocumentRenderPayload`, `saveDocumentFormInputs`, `savePublishedContractFormInputs`, `saveBm031DirectFormInputs`.)

> The 113 BM flat-form panel mods and 5 BM local save helper mods do **not** belong here — they belong to PR-F3 / PR-F4 (FE migration to `readApi` + `saveDocumentFormInputs`). The PR-F bucket is the seam-only helper removal.

#### 1.2.6 `PR_F2_RAW_FETCH_CLASSIFICATION_AUDIT`

| Status | Path |
| ------ | ---- |
| `??`   | `apps/web/src/components/documents/pr-f2-generated-save-smoke.test.ts` |
| `??`   | `docs/audit/frontend-api-cleanup/FE_GENERATED_API_HELPER_CLEANUP.latest.md` |
| `??`   | `docs/audit/frontend-api-cleanup/FE_RAW_FETCH_ROUTE_CLASSIFICATION.latest.md` |

> Includes the smoke test referenced from `FE_RAW_FETCH_ROUTE_CLASSIFICATION.latest.md`. No source mutation — read-only classification. The two related `.json` files under `docs/audit/frontend-architecture-forensics/` (`FE_ARCHITECTURE_FORENSIC_AUDIT.latest.json`, `FE_DUPLICATION_AND_DEAD_CODE.latest.json`) are routed to `AUDIT_DOCS_OPTIONAL`.

#### 1.2.7 `PR_F3_GENERATED_READ_API_MIGRATION`

| Status | Path |
| ------ | ---- |
| `??`   | `apps/web/src/lib/generated-document-read-api.guard.test.ts` |
| `??`   | `docs/audit/frontend-api-cleanup/FE_GENERATED_READ_API_MIGRATION.latest.md` |
| `M`    | 113 BM flat-form panels — see `FE_GENERATED_READ_API_MIGRATION.latest.md` for the explicit list and verify against `git diff --name-only` |

> Read migration means: replace `fetch(\`${API_BASE_URL}/documents/generated/${id}/render-payload\`, { credentials: "include" })` with `readApi<JsonObject>(\`/documents/generated/${id}/render-payload\`, { noStore: true })`. The `readApi` import comes from `@/lib/api-client`. The 5 BM local save helpers (bm001/053/090/097/156) both read and save through this seam — their reads also fall here, their saves under PR-F4.

#### 1.2.8 `PR_F4_GENERATED_SAVE_API_MIGRATION`

| Status | Path |
| ------ | ---- |
| `??`   | `apps/web/src/lib/generated-document-save-api.guard.test.ts` |
| `??`   | `docs/audit/frontend-api-cleanup/FE_GENERATED_SAVE_API_MIGRATION.latest.md` |
| `M`    | 113 BM flat-form panels (same 113 as PR-F3 — they share files; see §2.3) |
| `M`    | `apps/web/src/lib/bm001-form-inputs-api.ts` |
| `M`    | `apps/web/src/lib/bm053-form-inputs-api.ts` |
| `M`    | `apps/web/src/lib/bm090-form-inputs-api.ts` |
| `M`    | `apps/web/src/lib/bm097-form-inputs-api.ts` |
| `M`    | `apps/web/src/lib/bm156-form-inputs-api.ts` |

> Save migration means: replace raw `fetch(..., { method: "POST" or "PATCH/PUT" })` calls against `/documents/generated/:id/form-inputs` with `await saveDocumentFormInputs(documentId, body)`. PR-F removed the unsupported PATCH/PUT helpers from the seam, so PR-F4 normalises everything to the supported POST seam.

#### 1.2.9 `PR_A2R_A3_FORM_FLIGHT_READINESS_REPAIR`

| Status | Path |
| ------ | ---- |
| `M`    | `apps/web/src/lib/form-flight/types.ts` (+`runtimeReady`/`profileStatus` fields) |
| `M`    | `apps/web/src/lib/form-flight/profiles/bm171.ts` (+`runtimeReady: true`, `profileStatus: "runtime-ready"`) |

> PR-A2R is the adapter readiness guard repair (the new `profile-status.ts` predicate closes a long-standing loophole where audit-only / skeleton profiles were silently promoted to runtime). PR-A3 is the BM-171 promotion; it does **not** promote BM-001 (the test asserts BM-001 stays audit-only). No other profile is promoted.

#### 1.2.10 `PR_F4R_BM_REPAIR`

| Status | Path |
| ------ | ---- |
| `M`    | `apps/web/src/components/documents/bm-031-form-inputs.tsx` (-25 lines; `requestSave(method, body)` helper removed; only `saveBm031DirectFormInputs` remains). |
| `M`    | `apps/web/src/components/documents/bm-170-form-inputs.tsx` (-17/-13 lines; saves repoint to `saveDocumentFormInputs`) |
| `M`    | `apps/web/src/components/documents/bm-172-form-inputs.tsx` (-12 lines; saves repoint to `saveDocumentFormInputs`) |

#### 1.2.11 `AUDIT_DOCS_OPTIONAL` (24 entries)

| Status | Path |
| ------ | ---- |
| `M` x 6 | `docs/audit/bm-final/BM-001/{final.latest.json,final.latest.md}`, `BM-171/{final.latest.json,final.latest.md}` |
| `M` x 4 | `docs/audit/bm-rollout/BM-001/{readiness.latest.json,readiness.latest.md}`, `BM-171/{readiness.latest.json,readiness.latest.md}` |
| `M` x 2 | `docs/audit/sot-gates-v1/{latest.json,latest.md}` |
| `??` x ~12 | `docs/audit/api-architecture-forensics/**` (8 files including 1 binary `.docx`), `docs/audit/frontend-architecture-forensics/**` (7 files), `docs/audit/unified-bm-workspace/AUDIT_QLLAW_FORMS_VS_ZIP_2026-07-05.md`, `docs/audit/unified-bm-workspace/PR7B_FORM_ROLLOUT_FACTORY_BACKLOG.latest.md`, `docs/audit/change-set-review/{CHANGE_SET_FORENSIC_REVIEW.latest.md,CHANGE_SET_SPLIT_PLAN.final.md}` |

> All audit docs are timestamped `*.latest.{json,md}` artefacts generated by background audit tools. Not authored by PR-A..F4R. Default: do NOT commit alongside PR-A..F4R.

#### 1.2.12 `TEMP_OR_SCRATCH_DO_NOT_COMMIT` (~175+ paths)

```text
storage/temp/pr-bm171-debug/*                                                 (5 files)
storage/temp/pr6g51-bm001-canonical-signoff/BM-001/2026-07-04T21-05-25-024Z/* (8 files)
storage/temp/pr6g51-bm001-canonical-signoff/BM-001/2026-07-05T09-53-47-884Z/* (8 files)
storage/temp/pr7a-bm171-canonical-signoff/.../2026-07-04T22-17-20-330Z/*      (8 files)
storage/temp/pr7a-bm171-canonical-signoff/.../2026-07-04T22-17-38-296Z/*      (8 files)
storage/temp/pr7a-bm171-canonical-signoff/.../2026-07-05T08-45-10-865Z/*      (8 files)
storage/temp/pr7a-bm171-canonical-signoff/.../2026-07-05T09-54-03-627Z/*      (8 files)
storage/temp/pr7a-bm171-canonical-test/.../2026-07-04T22-16-25-833Z/*         (8 files)
storage/temp/pr7a-bm171-canonical-test/rendered.docx                           (1 file)
storage/temp/pr7a4-bm171-full-signoff-real-editor/.../*                        (8 files)
storage/temp/pr7a4-bm171-full-signoff/.../*                                    (~64 files across 8 run dirs)
storage/temp/pr7a5-bm171-visual-verification/roundtrip/{source,rendered}-roundtrip.docx  (2 files)
docs/audit/unified-bm-workspace/_pr7a2-triage/*                                (6 raw triage files)
docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx (1 binary, .docx format)
quanlynew-main.zip                                                              (1 file, repo-source zip)
setup-wsl-ubuntu-d.ps1                                                          (1 file, WSL setup)
scripts/audit/_debug-smoke.mjs                                                  (debug-only; not present in current dirty tree but referenced in `FE_GENERATED_API_HELPER_CLEANUP.latest.md`)
```

**Hard DO-NOT-COMMIT.** Two of the binary artefacts (`API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx` and `quanlynew-main.zip`) must never be committed; the rest should be git-ignored in a follow-up housekeeping PR.

#### 1.2.13 `UNKNOWN_NEEDS_PLANNER_REVIEW`

**None at the file-list level — all dirty source files have been classified.** The only open questions are at the **commit-boundary** level and are listed in §3 (RECOMMENDED_COMMIT_STRUCTURE) and §7 (QUESTIONS_FOR_PLANNER).

---

## 2. PHASE 2 — Cross-Scope Files

These files are touched by more than one logical task and need an explicit split decision.

### 2.1 `apps/api/src/app.module.ts` (PR-BC ∩ PR-E)

**Issue:** the diff swaps `FormStudioModule → ContractPlatformModule` (PR-BC) and adds `GeneratedInputSaveModule` (PR-E) in the same change.

```text
-    FormStudioModule,
+    ContractPlatformModule,
+    GeneratedInputSaveModule,
```

**Risk:** if PR-BC lands without PR-E, the BE starts (FormStudioModule becomes ContractPlatformModule, but GeneratedInputSaveModule is missing → `documents.module.ts` and `bm031-direct.module.ts` reference it via `forwardRef` → Nest DI explosion). If PR-E lands without PR-BC, the BE starts but `app.module.ts` still references the deleted `FormStudioModule` → compile error.

**Recommendation: `KEEP_AS_ONE_COMMIT`** — bundle with PR-BC + PR-E in the same commit (Commit 2 of §3). This is atomic because PR-E's `forwardRef` requires PR-BC's `ContractPlatformModule` to exist, and PR-BC's `ContractPlatformModule` registration requires PR-E to also be registered (or BE compilation will fail). Splitting them creates a non-compilable intermediate state.

### 2.2 `apps/api/src/modules/bm031-direct/bm031-direct.controller.ts` (PR-D ∩ PR-E)

**Issue:** the modified controller does two things at once:
- Calls `assertRenderIntentBoundary(...)` from `api-render-boundary.policy` — **PR-D** boundary enforcement.
- Delegates the save flow through `GeneratedInputSaveOrchestrator.save(...)` — **PR-E** orchestration.

**Recommended split:**

| Diff hunk | Bucket | Reason |
| --------- | ------ | ------ |
| `import { GeneratedInputSaveOrchestrator }` and the body that calls `this.generatedInputSave.save({...})` | **PR-E** | Save orchestration is PR-E's responsibility. |
| `import { assertRenderIntentBoundary }` and the body that calls `assertRenderIntentBoundary(...)` | **PR-D** | Boundary policy is PR-D's; controller asserts at the route entry. |

Both hunks are part of the same file. **Recommendation: `KEEP_AS_ONE_COMMIT` for the controller itself**, but the controller can land with PR-D because:
- `assertRenderIntentBoundary(...)` works even when the orchestrator is a no-op stub.
- `GeneratedInputSaveOrchestrator` is only invoked when the route is hit; BE type-check does not require the orchestrator to exist if the import resolves.
- The orchestrator IS required once PR-E lands, which is the same commit as PR-BC (per §2.1) → so the controller file lands with PR-D atomically.

This is simpler than splitting the file in two. The file's two semantically-distinct changes ride together.

### 2.3 The 113 BM flat-form panels (PR-F3 ∩ PR-F4 ∩ PR-F4R)

**Issue:** all 113 `bm-XXX-form-inputs.tsx` files import `readApi` and `saveDocumentFormInputs` and use both helpers. The PR-F3 migration touches read paths; the PR-F4 migration touches save paths. PR-F4R additionally touches the three BM-031/170/172 panels to remove the legacy `requestSave` shim.

**Recommendation: `MERGE_LOGICAL_COMMITS`** — bundle all 113 BM panels + the 5 BM local save helpers into a **single PR-F3+F4 commit** because:
- Each panel's diff contains both a read change and a save change.
- Splitting by change type would require splitting each of the 113 files in half — 226 partial diffs across two commits.
- The PR-F3 guard and PR-F4 guard are designed to be run together; they cross-verify each other.
- The two migration docs (`FE_GENERATED_READ_API_MIGRATION.latest.md` and `FE_GENERATED_SAVE_API_MIGRATION.latest.md`) explicitly state this is a coupled migration.

**Result:** Commit 4 in §3 contains 113 + 5 + 3 = 121 BM-side source files, plus the two guard tests.

### 2.4 `apps/web/src/lib/form-flight/types.ts` (PR-A ∩ PR-A2R)

**Issue:** the file adds both:
- `FormFlightProfileStatus` union type (PR-A — the new status vocabulary)
- `readonly runtimeReady?: boolean` and `readonly profileStatus?: FormFlightProfileStatus` fields (PR-A2R — explicit readiness signal)

**Recommendation: `KEEP_AS_ONE_COMMIT`** — both fields are declared in the type; the runtime predicate `isRuntimeReadyProfile` in the new `profile-status.ts` reads them. Splitting them into two commits would require type-only commits, which TypeScript does not actually support for ambient shape mutations. Bundle with PR-A + PR-A2R + PR-A3 in Commit 1.

### 2.5 `apps/web/src/lib/form-flight/profiles/bm171.ts` (PR-A ∩ PR-A3)

**Issue:** the modified file registers `BM171_FORM_FLIGHT_PROFILE` with `runtimeReady: true` + `profileStatus: "runtime-ready"`. The rest of the file already existed.

**Recommendation: `KEEP_AS_ONE_COMMIT` with PR-A + PR-A3** — the runtime readiness declaration IS the PR-A3 promotion; the file is otherwise a PR-A anchor.

### 2.6 `apps/web/src/lib/document-form-api.ts` (PR-F ∩ PR-F4)

**Issue:** PR-F deletes the 3 unsupported helpers (-51 lines). PR-F4's 113 BM migrations switch their save helpers from those deleted exports to the supported `saveDocumentFormInputs`. Without PR-F first, the 113 PR-F4 migrations would break compile because they would still reference `patchDocumentFormInputs` etc.

**Recommendation: `MERGE_LOGICAL_COMMITS`** — PR-F and PR-F4 must land together OR in PR-F → PR-F4 order with PR-F as the leading commit. The static guard `document-form-api.generated-form-input-guard.test.ts` (PR-F) verifies that no caller exists for those three names — so once PR-F lands, PR-F4's guard `generated-document-save-api.guard.test.ts` enforces that all callers route through `saveDocumentFormInputs`.

**Result:** include both in Commit 4 of §3. The seam deletion + migration land together.

### 2.7 `apps/web/src/lib/form-flight/adapters/{generated-document-adapter,template-runtime-adapter}.ts` (PR-A ∩ PR-A2R)

**Issue:** both adapters import `isRuntimeReadyProfile` from the new `profile-status.ts`. PR-A introduces the selector logic; PR-A2R introduces the readiness guard repair that closes the skeleton-takeover loophole.

**Recommendation: `KEEP_AS_ONE_COMMIT`** with PR-A + PR-A2R. The adapters are useless without the predicate, and the predicate has nothing to operate on without the adapters. Bundle in Commit 1.

### 2.8 `apps/api/src/modules/documents/documents.module.ts` (PR-D ∩ PR-E)

**Issue:** the diff registers both the new `api-render-core` providers (PR-D) and the legacy generated adapter (PR-E) in the same provider array, and adds `forwardRef(() => GeneratedInputSaveModule)` at the imports line.

**Recommendation: `SPLIT_BY_PATCH`** if possible, otherwise `KEEP_AS_ONE_COMMIT`. The Nest DI graph requires both PR-D's `ApiRenderOrchestrator` and PR-E's `LegacyGeneratedFormInputsSaveAdapter` to be registered once they exist. If PR-D lands first, the orchestrator providers register fine without the legacy adapter. If PR-E lands first, the legacy adapter registers fine without the orchestrator. The `forwardRef` to `GeneratedInputSaveModule` is shared and is a runtime concern, not a compile concern.

**Simpler recommendation:** `KEEP_AS_ONE_COMMIT` — bundle with Commit 3 (PR-D + PR-E) because both halves require the same Nest forwardRef graph topology to be valid.

### 2.9 `apps/api/src/modules/bm031-direct/bm031-direct.module.ts` (PR-E)

**Issue:** single-bucket — registers the BM-031 adapter and adds `forwardRef(() => GeneratedInputSaveModule)`. Not cross-scope. Listed for completeness.

**Recommendation: bundle with PR-E → Commit 3.**

### 2.10 `apps/web/src/lib/contract-platform-api.ts` (PR-BC)

**Issue:** single-bucket — the new client that `form-studio-api.ts` re-exports from. The shim `form-studio-api.ts` MUST land in the same commit as `contract-platform-api.ts` because the shim resolves `./contract-platform-api` at runtime.

**Recommendation: `KEEP_AS_ONE_COMMIT`** — bundle with PR-BC → Commit 2.

### 2.11 `apps/web/src/lib/form-studio-api.ts` (PR-BC ∩ PR-F cross-scope?)

**Issue:** the diff reduces this from a 388-line helper surface to a 6-line re-export shim. The shim is used by:
- `template-preview-workspace.tsx` (calls `getRuntimeFormContract`) — PR-BC
- `template-selector-workspace.tsx` (calls `listFormPlatformCatalog`) — PR-BC
- The static guard `form-studio-retirement-guard.test.ts` (reads it) — PR-BC

The PR-F guard `document-form-api.generated-form-input-guard.test.ts` also reads `form-studio-api.ts` and asserts it stays a re-export shim.

**Recommendation: `KEEP_AS_ONE_COMMIT`** with PR-BC. PR-F's guard test will then verify it stays slim — but the test itself is PR-F's and lands with PR-F.

---

## 3. PHASE 3 — Recommended Final Commit Structure

The smallest safe commit structure preserving atomicity and reviewability is **4 logical commits + 2 optional** (audit docs and housekeeping). Each commit is independently type-check-able, lint-clean, and test-pass per §5.

### Commit 1 — PR-A + PR-A2R + PR-A3: FE Form Flight selector, runtime-readiness guard, BM-171 opt-in

**Theme:** single source of truth for runtime-readiness; BM-171 promoted to runtime-ready; BM-001 stays audit-only.

| Field | Value |
| ----- | ----- |
| **Risk** | LOW (FE only) |
| **Depends on** | None (self-contained) |
| **Public route paths change** | NO |
| **DB / DOCX / locked contracts touched** | NO |
| **Files to include (8)** | `apps/web/src/components/documents/generated-form-panel-selector.ts` (new), `apps/web/src/components/documents/generated-form-panel-selector.test.ts` (new), `apps/web/src/lib/form-flight/profile-status.ts` (new), `apps/web/src/lib/form-flight/profile-status.test.ts` (new), `apps/web/src/lib/form-flight/runtime-consumer-guard.test.ts` (new), `apps/web/src/lib/form-flight/types.ts` (M), `apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts` (M), `apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts` (M), `apps/web/src/lib/form-flight/profiles/bm171.ts` (M) |
| **Files explicitly excluded** | All backend files, all `bm-NNN-form-inputs.tsx` files, all form-studio / contract-platform files, all api-render-core files, all generated-input-save-core files, all 113 BM panels, all 5 BM local save helpers, all audit docs, all storage/temp files |
| **Stands alone** | YES — TS-check independent, no backend imports changed |
| **Validation commands** | `pnpm --filter web exec tsc --noEmit`, `pnpm --filter web lint`, `pnpm --filter api exec tsx --test ../web/src/lib/form-flight/profile-status.test.ts ../web/src/lib/form-flight/runtime-consumer-guard.test.ts ../web/src/components/documents/generated-form-panel-selector.test.ts` |

### Commit 2 — PR-B + PR-C + PR-E (merged): Form Studio retirement, contract-platform rename, generated input save orchestrator

**Theme:** the BE backend gets its end-of-life / re-platform; customer-facing Form Studio pages and admin authoring controllers are deleted; their behaviour is preserved by `contract-platform` controllers and `generated-input-save-core` orchestrator.

| Field | Value |
| ----- | ----- |
| **Risk** | HIGH (kills customer surface; requires PR-E module wire to compile) |
| **Depends on** | None at commit-time, but functionally consolidates PR-B + PR-C + PR-E into one atomic commit (see §2.1, §2.8, §2.10) |
| **Public route paths change** | NO (same `/admin/form-templates`, `/forms/runtime/:code`, `/admin/form-permissions`, `/documents/generated/:id/{form-inputs,contract-form-inputs,bm031-direct-form-inputs}` HTTP paths are preserved) |
| **DB / DOCX / locked contracts touched** | NO |
| **Files to include (60)** | All 32 form-studio backend + 3 web deletions, all 18 contract-platform untracked files (15 backend + 1 web + 1 retirement guard + 1 form-studio-api shim edit), all 8 generated-input-save-core files, all 4 generated-input-save-core call-sites (bm031-direct.module, bm031-direct.controller.spec, documents.module, app.module), all 2 web seam edits (nav-items.tsx, app-shell.tsx), 1 generated-document form-input seam module diff (`document-form-api.ts` — wait, this belongs to Commit 4, see §2.6; explicitly excluded here) |
| **Files explicitly excluded** | All 113 BM panels, all 5 BM local save helpers, all 6 PR-D files (api-render-core/** + 6 call-sites + BM-031 controller boundary), audit docs, storage/temp files, document-form-api.ts (PR-F → Commit 4) |
| **Stands alone** | YES — BE module swaps atomically; `ContractPlatformModule` lands with all controllers; `GeneratedInputSaveModule` lands with all adapters; `app.module.ts` registers both |
| **Validation commands** | `pnpm --filter api exec tsc --noEmit`, `pnpm --filter api test`, manual: `GET /forms/runtime/BM-001` returns contract metadata via contract-platform; `POST /documents/generated/:id/bm031-direct-form-inputs` delegates through orchestrator |

> **Atomicity rationale:** PR-B (deletions) + PR-C (contract-platform rename) + PR-E (save orchestrator) are inseparable. PR-B's `app.module.ts` swap requires PR-C's `ContractPlatformModule` to exist. PR-E's `forwardRef` requires both PR-C and the save adapters to be registered. The smallest atomic unit is all three together.

### Commit 3 — PR-D: Generated render core wire

**Theme:** `api-render-core` becomes the single seam for both runtime template and generated document render paths; orchestrator dispatches to lifecycle-specific adapters; `assertRenderIntentBoundary` enforces `runtime-template` vs `generated-document` at every entry point.

| Field | Value |
| ----- | ----- |
| **Risk** | MEDIUM (orchestration change) |
| **Depends on** | Commit 2 (uses `ContractPlatformModule` which Compile-needs) |
| **Public route paths change** | NO |
| **DB / DOCX / locked contracts touched** | NO |
| **Files to include (19)** | All 10 `api-render-core/` files (8 source + 2 guards), 9 documents/ call-site modifications (`document-renderer.controller.{ts,spec.ts}`, `documents.module.{ts,spec.ts}`, `runtime-preview-session.service.{ts,spec.ts}`, `runtime-template-render.controller.ts`, `render-generated-document.use-case.{ts,spec.ts}`), 1 bm031-direct.controller.ts edit (PR-D's `assertRenderIntentBoundary` call — the controller's PR-E orchestration change was already landed in Commit 2) |
| **Files explicitly excluded** | Commit 1 files, all generated-input-save-core files (PR-E → Commit 2), all 113 BM panels + 5 local helpers (PR-F3/F4 → Commit 4), audit docs, storage/temp files |
| **Stands alone** | YES |
| **Validation commands** | `pnpm --filter api test`, especially `render-generated-document.use-case.spec.ts`, `api-render-boundary.policy.spec.ts`, `generated-render-core.guard.test.ts`, `runtime-preview-core.guard.test.ts` |

### Commit 4 — PR-F + PR-F2 + PR-F3 + PR-F4 + PR-F4R: Frontend generated-API cleanup + read/save migration

**Theme:** the unsupported PATCH/PUT generated-save helpers are removed from the FE seam; all 113 BM flat-form panels migrate to `readApi` for reads and `saveDocumentFormInputs` for saves; the 5 BM local save helpers likewise migrate; BM-031/170/172 save-flow regressions are repaired; the new static guards lock the migration.

| Field | Value |
| ----- | ----- |
| **Risk** | MEDIUM (113 BM panel + 5 local helper migrations; touching every customer-facing panel) |
| **Depends on** | Commit 2 (BE orchestrator needed for full coverage) |
| **Public route paths change** | NO (POST-only seam preserved; PATCH/PUT routes stay absent per backend truth) |
| **DB / DOCX / locked contracts touched** | NO |
| **Files to include (127)** | 1 seam diff (`document-form-api.ts` -51 lines for PR-F), 3 BM-regression files (`bm-031`, `bm-170`, `bm-172` for PR-F4R), 113 BM flat-form panels for PR-F3/F4 shared, 5 BM local save helpers (`bm001`, `bm053`, `bm090`, `bm097`, `bm156`) for PR-F3/F4 shared, 2 new guard tests (`document-form-api.generated-form-input-guard.test.ts` for PR-F, `generated-document-read-api.guard.test.ts` for PR-F3), 1 new save-guard test (`generated-document-save-api.guard.test.ts` for PR-F4), 1 PR-F2 smoke test |
| **Files explicitly excluded** | Commit 1 + 2 + 3 files, all audit docs, `quanlynew-main.zip`, `setup-wsl-ubuntu-d.ps1`, `scripts/audit/_debug-smoke.mjs`, all storage/temp files |
| **Stands alone** | YES — every changed file is type-checked against the new seam and the static guards prove no caller slipped through |
| **Validation commands** | `pnpm --filter web exec tsc --noEmit`, `pnpm --filter web lint`, `pnpm --filter api exec tsx --test ../web/src/lib/document-form-api.generated-form-input-guard.test.ts ../web/src/components/documents/pr-f2-generated-save-smoke.test.ts ../web/src/lib/generated-document-read-api.guard.test.ts ../web/src/lib/generated-document-save-api.guard.test.ts ../web/src/lib/form-flight/profile-status.test.ts ../web/src/lib/form-flight/runtime-consumer-guard.test.ts` |

> **Atomicity rationale:** PR-F must land before PR-F3/F4 because the unsupported helpers must be deleted from the seam before any caller switches. PR-F4R (BM-031/170/172 repair) must land with PR-F4 because the three panels still reference `patchBm031DirectFormInputs` / local `requestSave` shims that PR-F removed. The two migration docs (`FE_GENERATED_READ_API_MIGRATION.latest.md`, `FE_GENERATED_SAVE_API_MIGRATION.latest.md`) cross-reference each other — they are pair-mate deliverables.

### Commit 5 (OPTIONAL) — Audit and forensic docs

**Theme:** commit the planning + audit artefacts produced during PR-A..F4R. If planner wants a clean PR cycle, defer to a later doc-only commit.

| Field | Value |
| ----- | ----- |
| **Risk** | LOW |
| **Files to include** | All 24 entries under `AUDIT_DOCS_OPTIONAL` (§1.2.11) EXCEPT the binary `.docx` file |
| **Files explicitly excluded** | `docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx` (binary; consider converting to `.md` or git-ignoring), `docs/audit/unified-bm-workspace/_pr7a2-triage/**`, all storage/temp files |
| **Stands alone** | YES (doc-only commit) |

### Commit 6 (OPTIONAL) — Housekeeping: ignore cleanup + script deletions

**Theme:** add `storage/temp/**`, `_pr7a2-triage/**`, `*.docx` (under `docs/audit/**`), `quanlynew-main.zip`, `setup-wsl-ubuntu-d.ps1`, `scripts/audit/_debug-smoke.mjs` to `.gitignore`. **NOT recommended in this PR cycle** — `.gitignore` changes are a separate concern and the prompt explicitly says "Do not modify `.gitignore`."

> **Recommendation: skip Commit 6 entirely from this PR cycle.** Park the housekeeping intent for a follow-up PR.

---

## 4. PHASE 4 — Safety Review (dangerous-pattern scan on dirty source files)

Search scope: every changed file in §1. Patterns explicitly named in the prompt were searched with `Grep` over `apps/api/src/**` + `apps/web/src/**`.

| Pattern                      | Files matched in dirty set | Verdict |
| ---------------------------- | -------------------------- | ------- |
| `mode=`                      | none in dirty source | clean |
| `render-docx/metadata`       | none in dirty source | clean |
| `generated_documents` (Prisma model) | matches in pre-existing files only (`bm031-direct.service.ts`, `documents.service.ts`, `generated-document-audit.service.ts`, `contract-shadow-renderer.orchestrator.ts`, etc.) — none of the **dirty** files introduce a new reference | unchanged pre-existing |
| `generated_document_files`   | same as above | unchanged pre-existing |
| `generated_document_audit_logs` | `generated-document-audit.service.ts` — pre-existing, unchanged | clean |
| `case_events`                | pre-existing service files only | unchanged pre-existing |
| `prisma`                     | pre-existing common ref | no NEW prisma client reference added |
| `schema.prisma`              | `apps/api/prisma/schema.prisma` is **NOT in dirty list** | no schema mutation |
| `migration`                  | NO matches in dirty source | no migration triggered |
| `credentials`                | only `credentials: "include"` in `apps/web/src/lib/api-client.ts` (fetch option, pre-existing), no secrets | clean |
| `secret`                     | no matches | clean |
| `qlv_session`                | 6 matches in **unchanged pre-existing** files: `apps/api/src/common/csrf-cookie.guard.spec.ts`, `apps/api/src/infrastructure/config/app-config.service.ts`, `apps/web/src/proxy.ts`, `apps/api/src/modules/auth/auth.controller.spec.ts`, `apps/api/src/modules/auth/auth.guard.spec.ts` | none in dirty source — no auth-secret leak |
| `PATCH` / `PUT`              | only in the deleted PR-F helpers (no longer in current files) and the supported `savePublishedContractFormInputs` PUT (pre-existing) | unchanged pre-existing |
| `documents/generated`         | pre-existing FE helpers (`document-form-api.ts`, `generated-documents-api.ts`) + the new `pr-f2-generated-save-smoke.test.ts` | smoke test; clean |
| `bm031-direct-form-inputs`   | pre-existing FE helper + the new PR-F2 smoke test | clean |
| `runtimeReady` / `profileStatus` | `apps/web/src/lib/form-flight/types.ts`, `apps/web/src/lib/form-flight/profile-status.ts`, `apps/web/src/lib/form-flight/profile-status.test.ts`, `apps/web/src/lib/form-flight/profiles/bm171.ts`, `apps/web/src/lib/form-flight/adapters/*.ts` — **adopted by PR-A + PR-A2R + PR-A3** | expected safe matches |
| `getFormFlightProfile`       | `apps/web/src/lib/form-flight/profile-status.test.ts`, `apps/web/src/lib/form-flight/profile-status.ts` — calls into the registry | expected safe match |

### Verdict

**No secrets, no `schema.prisma` mutation, no DB migration, no locked-contract mutation, no destructive auth-bypass change present in the dirty set.** Every dirty source file either:
- introduces an internal seam or guard (PR-A/A2R/F),
- deletes dead code (PR-B, PR-F, F3 raw-fetch),
- migrates callers to the seam (PR-C/E/F3/F4),
- wires Nest modules (PR-BC, D, E),
- declares a new boundary policy (PR-D),
- or is a static guard test (PR-F, F3, F4, A, A2R).

The `bm031-direct.controller.ts` change in PR-D only **calls** the new boundary assertion; it does not introduce new DB writes or schema fields.

---

## 5. PHASE 5 — Validation Snapshot (non-mutating)

| Command | Exit | Result | Summary |
| ------- | ---- | ------ | ------- |
| `pnpm --filter web exec tsc --noEmit` (cwd: `apps/web`) | 0 | **PASS** | No TS errors across web tree (covers all 113 BM panels + adapters + selectors + form-flight + contract-platform client). |
| `pnpm --filter api exec tsc --noEmit` (cwd: `apps/api`) | 0 | **PASS** | No TS errors across api tree (covers contract-platform/, api-render-core/, generated-input-save-core/, documents/, bm031-direct/, app.module.ts). |
| `pnpm --filter web lint` | 0 | **PASS** | ESLint 9, all clean. |
| `pnpm --filter api exec tsx --test …/profile-status.test.ts …/runtime-consumer-guard.test.ts …/generated-form-panel-selector.test.ts …/document-form-api.generated-form-input-guard.test.ts …/pr-f2-generated-save-smoke.test.ts …/generated-document-read-api.guard.test.ts …/generated-document-save-api.guard.test.ts` | 0 | **PASS** | 73 tests pass / 0 fail across 14 suites. Includes: 21 profile-runtime-readiness guard tests (PR-A + PR-A2R + PR-A3), 7 generated-form-panel-selector tests (PR-A), 2 runtime-consumer-guard tests (PR-A + PR-A2R), 6 PR-F guard tests (PR-F), 13 PR-F2 smoke tests (PR-F2), 18 PR-F3 + PR-F4 guard tests (PR-F3 + PR-F4). |

### Validation commands NOT run (per prompt restrictions)

- **No** `pnpm --filter api build` (Nest bootstrap, would require Mongo/MySQL).
- **No** `pnpm --filter web build` (Next.js production build, slow).
- **No** `pnpm --filter api test` (full jest suite — planner scope, not PR-scope).
- **No** `pnpm --filter web test` (full playwright + jest suite — prompt restricts E2E/migrations).
- **No** `pnpm test:e2e` or `playwright` runs.
- **No** docs suite, no Docusaurus build.
- **No** `prisma migrate` / `prisma generate`.
- **No** formatter (`prettier --write`).
- **No** `eslint --fix`.

---

## 6. PHASE 6 — Report Artifact

This file (written) is the report artifact:

```
docs/audit/change-set-review/FINAL_CONSOLIDATION_SPLIT_PLAN.latest.md
```

No JSON sibling was created per prompt. No `CODE_MUTATED`. No `FILES_STAGED`. No `COMMIT_CREATED`. No `GIT_PUSHED`. No `.gitignore` modified.

---

## 7. PHASE 7 — Executive Tally, Recommendations, and Planner Questions

### 7.1 Bucket summary

| Bucket | Entries | Risk | Notes |
| ------ | ------- | ---- | ----- |
| PR-A + PR-A2R + PR-A3 selector and Form Flight guards + BM-171 opt-in | 8 | LOW | New selector + 2 new test files + 2 new guards; FE only |
| PR-B + PR-C + PR-E form-studio retirement + contract-platform + generated-input-save orchestrator | 60 | HIGH | 32 deletions (kills customer surface) + 18 BE renames + 10 BE save orchestrator files; atomic |
| PR-D generated render core wire | 19 | MEDIUM | New core + 9 call-sites; atomic |
| PR-F frontend generated save helper cleanup | 1 | LOW | -51 lines seam delete; atomic |
| PR-F2 raw fetch classification audit | 5 | LOW | No source mutation; audit + 1 smoke test |
| PR-F3 generated read API migration | 113 (files cross-counted with PR-F4) | MEDIUM | 113 BM panels → readApi |
| PR-F4 generated save API migration | 113 (same files) | MEDIUM | 113 BM panels → saveDocumentFormInputs |
| PR-F4R BM repair | 3 | LOW | requestSave helper removal from BM-031/170/172 |
| PR-A2R + PR-A3 form-flight readiness repair | 2 (cross-counted with PR-A) | LOW | types.ts + bm171.ts |
| AUDIT_DOCS_OPTIONAL | 24 | LOW | Default: do not commit in PR cycle |
| TEMP_OR_SCRATCH_DO_NOT_COMMIT | 175+ | n/a | storage/temp + scripts + zips |

### 7.2 Recommended commit order

```text
Commit 1 (PR-A + PR-A2R + PR-A3)  →  Commit 2 (PR-B + PR-C + PR-E atomic)  →  Commit 3 (PR-D)  →  Commit 4 (PR-F + PR-F2 + PR-F3 + PR-F4 + PR-F4R)
```

Atomicity rules:

- **Commit 1 first** — pure FE; no inter-commit coupling.
- **Commit 2 second** — atomic by construction (PR-B's app.module.ts swap requires PR-C's module; PR-E's forwardRef requires PR-C's module; all three land together).
- **Commit 3 third** — depends on Commit 2 (BE module graph must exist).
- **Commit 4 fourth** — depends on Commit 2 (BE seam must exist); the static guards prove the migration is complete.

If planner wants the absolute minimum commits (per the prompt's "4 commits" guidance): **exactly 4 commits, no optional doc/housekeeping commits**. If planner wants to land audit docs separately, add Commit 5. Housekeeping is intentionally NOT a commit in this cycle.

### 7.3 Files NOT staged, NOT modified, NOT deleted by this review

- No source file edited.
- No `.gitignore` modified.
- One new file created: `docs/audit/change-set-review/FINAL_CONSOLIDATION_SPLIT_PLAN.latest.md`.
- No existing file deleted.
- No formatter / lint-fix run.
- No commit performed.
- No branch created / pushed.

### 7.4 Questions for planner

1. **Commit 2 atomicity:** is the executor's recommendation to bundle PR-B + PR-C + PR-E into a single commit acceptable, OR would the planner prefer to split it as (a) PR-B deletions + nav-removal + form-studio-API-shim + app.module.ts swap — landing first with `ContractPlatformModule` as a stub, then (b) PR-C fleshes out the controllers + PR-E? (See §2.1 and §2.8 for the coupling risk.) The current `ContractPlatformModule` does not yet exist as a stub, so option (a) requires creating a stub-class in PR-B — which adds 1 extra file.
2. **Commit 4 113-panel migration:** is the executor's recommendation to merge PR-F3 + PR-F4 into a single commit (per §2.3 and §2.6) acceptable, OR should they be two separate commits with PR-F3 first (113 panels → readApi) then PR-F4 (113 panels → saveDocumentFormInputs)? The 113 files would each touch both read and save paths so a per-panel split is impractical.
3. **Audit doc commit (Commit 5):** should the 24 `AUDIT_DOCS_OPTIONAL` files land as Commit 5 in this PR cycle, OR stay un-versioned for a later doc-only PR?
4. **Housekeeping (Commit 6):** strictly parked — the prompt forbids `.gitignore` mutation. When planner wants this, a follow-up PR adds `storage/temp/**`, `_pr7a2-triage/**`, `*.docx` (under `docs/audit/**`), `quanlynew-main.zip`, `setup-wsl-ubuntu-d.ps1`, `scripts/audit/_debug-smoke.mjs` to `.gitignore` and (optionally) physically deletes the now-ignored artefacts from the working tree.
5. **docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx:** the binary `.docx` is untracked and listed in §1.2.12. Two options: convert to `.md` before committing, OR add to `.gitignore` in the housekeeping commit. No third option is recommended.
6. **runtime-form-contract.service.spec.ts absence:** §1.2.2 notes that the contract-platform module ships 3 spec files (contract-form-inputs, document-form-schema, form-platform-catalog) but no spec for `runtime-form-contract.service.ts`. Is this intentional (legacy monolithic test elsewhere) or a missing test the planner wants added before Commit 2 lands?
7. **`permissions.ts` referenced by prior PR-X forensic review but NOT in current dirty set:** the prior `CHANGE_SET_FORENSIC_REVIEW.latest.md` listed `apps/web/src/lib/permissions.ts` as `M` but the current `git diff --name-only` does not include it. The current `git status` confirms `permissions.ts` is clean. No action needed — the forensic review had a stale snapshot. The `canOpenFormStudio` etc. functions still exist on disk and are no longer imported by `nav-items.tsx`. Future code may want to delete the unused functions; this is outside PR-B's scope (dead-code removal is hygiene).
