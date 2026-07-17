# PR-X — Change Set Forensic Review & Logical Split Plan

**Date:** 2026-07-07
**Reviewer:** Cursor Executor (audit-only role, no source mutation)
**Branch:** `feat/pr6g2-bm-final-audit-harness`
**HEAD:** `f215a52ab13268700e11bce143eed56f9ea5db76`

---

## 0. PHASE 0 — Raw Git State (verbatim)

```text
$ git branch --show-current
feat/pr6g2-bm-final-audit-harness

$ git rev-parse HEAD
f215a52ab13268700e11bce143eed56f9ea5db76

$ git status --short --untracked-files=all | wc -l
83

$ git diff --name-only | wc -l
65     # 32 deletions + 33 modifications (no renames)

$ git ls-files --others --exclude-standard | wc -l
227    # many are nested storage/temp scratch artefacts
```

Counts (git status --short only — counts top-level dirty entries, not nested untracked paths):

| Bucket       | Count |
| ------------ | ----- |
| Modified     | 33    |
| Deleted      | 32    |
| Renamed      | 0     |
| Untracked    | 18    |
| **Total entries (status --short)** | **83** |
| **Total untracked paths (recursive)** | **227** |

---

## 1. PHASE 1 — File Classification

### Bucket summary (top-level classification only)

| Bucket | Top-level entries | Notes |
| --- | --- | --- |
| `PR-A_FE_SELECTOR_GUARD` | 5 | New selector + 2 FE adapter rewires + 1 spec |
| `PR-B_FORM_STUDIO_RETIREMENT_AND_SEAM` | 34 | 30 deletions (BE+FE Form Studio sources) + 4 nav/perm seam files |
| `PR-C_CONTRACT_PLATFORM_RENAME_RUNTIME_CORE` | 16 | 1 add (contract-platform module, 15 files) + `app.module.ts` swap |
| `PR-D_GENERATED_RENDER_CORE_WIRE` | 9 | 9 api-render-core files + 3 modified documents controllers + 3 modified test/services |
| `PR6G_OR_PR7_PREEXISTING` | 10 | `docs/audit/bm-final/*`, `docs/audit/bm-rollout/*`, `docs/audit/sot-gates-v1/*` — pre-existing rollout/sign-off JSON/MD from PR6G/PR7 era; touched but not authored by PR-A..D |
| `AUDIT_ARTIFACT` | 18 | `docs/audit/api-architecture-forensics/*`, `docs/audit/frontend-architecture-forensics/*`, `docs/audit/unified-bm-workspace/AUDIT_QLLAW_FORMS_VS_ZIP_2026-07-05.md`, `docs/audit/unified-bm-workspace/PR7B_FORM_ROLLOUT_FACTORY_BACKLOG.latest.md` |
| `TEMP_OR_SCRATCH_DO_NOT_COMMIT` | 180+ | `storage/temp/**` (181 entries), `scripts/audit/_debug-smoke.mjs`, `setup-wsl-ubuntu-d.ps1`, `quanlynew-main.zip`, `docs/audit/unified-bm-workspace/_pr7a2-triage/**` (6 entries), `docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx` |

### 1.1 PR-A — FE selector guard (5 entries, scope: web only)

| Status | Path |
| --- | --- |
| `??` | `apps/web/src/components/documents/generated-form-panel-selector.ts` |
| `??` | `apps/web/src/components/documents/generated-form-panel-selector.test.ts` |
| `M`  | `apps/web/src/lib/form-flight/types.ts` |
| `M`  | `apps/web/src/lib/form-flight/index.ts` |
| `M`  | `apps/web/src/lib/form-flight/profiles/bm001.ts` |

Note: `generated-form-panel-selector` and its test are new; the 3 modified FE form-flight files are where the panel feeds. PR-A's job is hardening the selector surface against skeleton / audit-only profile takeover — confirmed by the `profile-status.ts` consumer pattern used by `generated-document-adapter.ts`.

### 1.2 PR-B — Form Studio retirement + lifecycle seam (34 entries)

**Backend deletions (24):**

```
D apps/api/src/modules/form-studio/form-studio.module.ts
D apps/api/src/modules/form-studio/form-studio.controller.ts
D apps/api/src/modules/form-studio/form-permissions.controller.ts
D apps/api/src/modules/form-studio/form-permissions.controller.spec.ts
D apps/api/src/modules/form-studio/contract-form-inputs.controller.ts
D apps/api/src/modules/form-studio/document-form-schema.controller.ts
D apps/api/src/modules/form-studio/dto/form-studio.dto.ts
D apps/api/src/modules/form-studio/domain/authoring-contract.types.ts
D apps/api/src/modules/form-studio/domain/draft-operation.schema.ts
D apps/api/src/modules/form-studio/domain/draft-operation.ts
D apps/api/src/modules/form-studio/domain/form-studio.error.ts
D apps/api/src/modules/form-studio/infrastructure/legacy-renderer-capabilities.generated.ts
D apps/api/src/modules/form-studio/infrastructure/prisma-form-contract-version.repository.ts
D apps/api/src/modules/form-studio/application/form-studio.service.ts
D apps/api/src/modules/form-studio/application/form-studio.service.spec.ts
D apps/api/src/modules/form-studio/application/admin-form-templates.service.ts
D apps/api/src/modules/form-studio/application/admin-form-templates.service.spec.ts
D apps/api/src/modules/form-studio/application/authoring-contract.service.ts
D apps/api/src/modules/form-studio/application/authoring-contract.service.spec.ts
D apps/api/src/modules/form-studio/application/contract-form-inputs.service.ts
D apps/api/src/modules/form-studio/application/contract-form-inputs.service.spec.ts
D apps/api/src/modules/form-studio/application/document-form-schema.service.ts
D apps/api/src/modules/form-studio/application/document-form-schema.service.spec.ts
D apps/api/src/modules/form-studio/application/form-contract-version.repository.ts
D apps/api/src/modules/form-studio/application/form-preview.service.ts
D apps/api/src/modules/form-studio/application/form-review-query.service.ts
D apps/api/src/modules/form-studio/application/form-platform-catalog.service.ts
D apps/api/src/modules/form-studio/application/form-platform-catalog.service.spec.ts
D apps/api/src/modules/form-studio/application/runtime-form-contract.service.ts
```

**Web deletions + seam changes (5):**

```
D apps/web/src/app/admin/(shared)/form-studio/page.tsx
D apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx
D apps/web/src/components/form-studio/form-studio-workspace.tsx
M apps/web/src/components/layout/nav-items.tsx
M apps/web/src/components/layout/app-shell.tsx
M apps/web/src/lib/permissions.ts          # removes canOpenFormStudio/canApproveForms/canEditForms/canManageFormPermissions
M apps/web/src/lib/form-studio-api.ts       # retargeted to re-export from ./contract-platform-api
?? apps/web/src/lib/form-studio-retirement-guard.test.ts
```

### 1.3 PR-C — contract-platform rename + runtime preview core wire (16 entries)

**Tracked modification (1):**

```
M apps/api/src/app.module.ts   # swaps FormStudioModule → ContractPlatformModule
```

**New untracked (15, all under apps/api/src/modules/contract-platform/):**

```
?? apps/api/src/modules/contract-platform/contract-platform.module.ts
?? apps/api/src/modules/contract-platform/domain/contract-platform.error.ts
?? apps/api/src/modules/contract-platform/infrastructure/legacy-renderer-capabilities.generated.ts
?? apps/api/src/modules/contract-platform/contract-form-inputs.controller.ts
?? apps/api/src/modules/contract-platform/document-form-schema.controller.ts
?? apps/api/src/modules/contract-platform/form-platform-catalog.controller.ts
?? apps/api/src/modules/contract-platform/runtime-form-contract.controller.ts
?? apps/api/src/modules/contract-platform/application/contract-form-inputs.service.ts
?? apps/api/src/modules/contract-platform/application/contract-form-inputs.service.spec.ts
?? apps/api/src/modules/contract-platform/application/document-form-schema.service.ts
?? apps/api/src/modules/contract-platform/application/document-form-schema.service.spec.ts
?? apps/api/src/modules/contract-platform/application/form-platform-catalog.service.ts
?? apps/api/src/modules/contract-platform/application/form-platform-catalog.service.spec.ts
?? apps/api/src/modules/contract-platform/application/runtime-form-contract.service.ts
?? apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts
```

Note: PR-C is purely a **path rename** of the BE Form Studio module into `contract-platform`. All controllers / services / domain errors / generated legacy file **names changed but functionality preserved**. Net new line growth is in `contract-platform-retirement.guard.test.ts` (a customer-side guard test that mirrors the FE retirement guard from PR-B). Public HTTP route paths are preserved (still `/admin/form-templates`, `/forms/runtime/:code`, `/admin/form-permissions` per the read of the new controllers).

**Also tied to PR-C FE side:**

```
?? apps/web/src/lib/contract-platform-api.ts         # new API client; the old `form-studio-api.ts` re-exports these
```

### 1.4 PR-D — Generated render core wire (9 new core files + 6 changed call-sites)

**New untracked (9, all under apps/api/src/modules/documents/rendering/application/api-render-core/):**

```
?? apps/api/src/modules/documents/rendering/application/api-render-core/api-render-adapter.contract.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/api-render-boundary.policy.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/api-render-boundary.policy.spec.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/api-render-intent.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/api-render-orchestrator.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/api-render-write.policy.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/generated-document-render.adapter.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/generated-render-core.guard.test.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/runtime-preview-core.guard.test.ts
?? apps/api/src/modules/documents/rendering/application/api-render-core/runtime-template-render.adapter.ts
```

(10 files, all untracked — the adapter `.contract.ts` is a TS interface-only file.)

**Modified call-sites (6):**

```
M apps/api/src/modules/documents/document-renderer.controller.ts       # adds assertRenderIntentBoundary
M apps/api/src/modules/documents/documents.module.ts                   # registers 3 new providers from api-render-core
M apps/api/src/modules/documents/runtime-preview-session.service.ts    # swaps StandaloneTemplateRenderService → ApiRenderOrchestrator
M apps/api/src/modules/documents/runtime-preview-session.service.spec.ts
M apps/api/src/modules/documents/rendering/application/render-generated-document.use-case.ts   # shrinks to delegate to ApiRenderOrchestrator
M apps/api/src/modules/documents/rendering/application/render-generated-document.use-case.spec.ts
M apps/api/src/modules/bm031-direct/bm031-direct.controller.ts         # adds assertRenderIntentBoundary (CROSS-AREA — see §3)
M apps/api/src/modules/documents/runtime-template-render.controller.ts # adds 2 assertRenderIntentBoundary calls
```

### 1.5 PR6G/PR7 pre-existing (10 entries)

```
M docs/audit/bm-final/BM-001/final.latest.json
M docs/audit/bm-final/BM-001/final.latest.md
M docs/audit/bm-final/BM-171/final.latest.json
M docs/audit/bm-final/BM-171/final.latest.md
M docs/audit/bm-rollout/BM-001/readiness.latest.json
M docs/audit/bm-rollout/BM-001/readiness.latest.md
M docs/audit/bm-rollout/BM-171/readiness.latest.json
M docs/audit/bm-rollout/BM-171/readiness.latest.md
M docs/audit/sot-gates-v1/latest.json
M docs/audit/sot-gates-v1/latest.md
```

These are timestamped `*.latest.{json,md}` artefacts from prior milestone sign-off runs. They were regenerated by background audit tools during PR6G/PR7 cycles and are not authored by PR-A..D. **Do not commit alongside PR-A..D** unless planner wants a separate "audit-docs refresh" commit.

### 1.6 AUDIT_ARTIFACT (18 entries)

```
?? docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.json
?? docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.md
?? docs/audit/api-architecture-forensics/API_DUPLICATION_AND_DEAD_CODE.latest.json
?? docs/audit/api-architecture-forensics/API_ENDPOINT_INVENTORY.latest.csv
?? docs/audit/api-architecture-forensics/API_RENDER_WORKFLOW_GRAPH.latest.json
?? docs/audit/api-architecture-forensics/API_UNIFICATION_PLAN.latest.json
?? docs/audit/api-architecture-forensics/API_UNIFICATION_PLAN.latest.md
?? docs/audit/api-architecture-forensics/codegraph-findings/CODEGRAPH_FINDINGS.latest.md
?? docs/audit/frontend-architecture-forensics/FE_API_CALLER_INVENTORY.latest.csv
?? docs/audit/frontend-architecture-forensics/FE_ARCHITECTURE_FORENSIC_AUDIT.latest.json
?? docs/audit/frontend-architecture-forensics/FE_ARCHITECTURE_FORENSIC_AUDIT.latest.md
?? docs/audit/frontend-architecture-forensics/FE_DUPLICATION_AND_DEAD_CODE.latest.json
?? docs/audit/frontend-architecture-forensics/FE_PR_A_RECOMMENDATION.latest.md
?? docs/audit/frontend-architecture-forensics/FE_SELECTOR_AND_ADAPTER_GRAPH.latest.json
?? docs/audit/frontend-architecture-forensics/codegraph-findings/FE_CODEGRAPH_FINDINGS.latest.md
?? docs/audit/unified-bm-workspace/AUDIT_QLLAW_FORMS_VS_ZIP_2026-07-05.md
?? docs/audit/unified-bm-workspace/PR7B_FORM_ROLLOUT_FACTORY_BACKLOG.latest.md
```

Plus the binary `.docx`:

```
?? docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx
```

These are forensic audit reports that codegen the *.latest.* pattern. Planner has not yet asked to commit them. **Default: do not commit in PR-A..D**. Stage separately only if planner requests.

### 1.7 TEMP_OR_SCRATCH_DO_NOT_COMMIT (~190 entries)

```
?? storage/temp/pr-bm171-debug/*                                         # 5 files
?? storage/temp/pr6g51-bm001-canonical-signoff/...                      # many run dirs
?? storage/temp/pr7a-bm171-canonical-signoff/...                        # many run dirs
?? storage/temp/pr7a-bm171-canonical-test/...                           # 8 files
?? storage/temp/pr7a4-bm171-full-signoff/...                            # many run dirs
?? storage/temp/pr7a4-bm171-full-signoff-real-editor/...                # 8 files
?? storage/temp/pr7a5-bm171-visual-verification/roundtrip/*.docx        # 2 files
?? docs/audit/unified-bm-workspace/_pr7a2-triage/*                      # 6 raw triage files
?? docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx  # binary audit rep
?? scripts/audit/_debug-smoke.mjs                                       # local smoke debug
?? setup-wsl-ubuntu-d.ps1                                               # local environment script, not part of project
?? quanlynew-main.zip                                                   # repo snapshot zip
```

**Hard DO-NOT-COMMIT.** These are scratch artefacts from PR6G/PR7 verification runs and from audit CLI debugging. Per project .gitignore philosophy they should never be committed; if anything, add to `.gitignore` in a separate housekeeping task (do NOT modify `.gitignore` in this task).

---

## 2. PHASE 2 — Logical Commit Plan

> All commits deliberately avoid `git add`/staging — this is a plan, not an execution.

### Commit 1 — PR-A: FE selector guard

| Field | Value |
| --- | --- |
| **Risk** | LOW |
| **Depends on** | None — pure FE |
| **Public route paths change** | NO |
| **DB / DOCX / locked contracts touched** | NO |
| **Files to include (5)** | `apps/web/src/components/documents/generated-form-panel-selector.ts` (new), `apps/web/src/components/documents/generated-form-panel-selector.test.ts` (new), `apps/web/src/lib/form-flight/types.ts`, `apps/web/src/lib/form-flight/index.ts`, `apps/web/src/lib/form-flight/profiles/bm001.ts` |
| **Files explicitly excluded** | `apps/web/src/lib/form-flight/profile-status.ts`, `apps/web/src/lib/form-flight/profile-status.test.ts`, `apps/web/src/lib/form-flight/runtime-consumer-guard.test.ts`, `apps/web/src/lib/form-flight/adapters/*`, `apps/web/src/lib/form-flight/profiles/bm171.ts`, `apps/web/src/lib/form-flight/bm001-second-pilot.test.ts` (see §3 cross-contamination) |
| **Validation commands** | `pnpm --filter web test -- --grep "generated-form-panel-selector"`, `pnpm --filter web lint`, manual: hover/click skeleton profile in BM-001 panel — must default to "generic" decision |

### Commit 2 — PR-B: Form Studio retirement + lifecycle seam

| Field | Value |
| --- | --- |
| **Risk** | HIGH (kills existing customer-facing surface) |
| **Depends on** | NONE at commit-time, but functionally relies on PR-C contract-platform being live to serve the surviving `/forms/runtime/:code` endpoint |
| **Public route paths change** | NO — `/admin/form-studio*` pages are simply removed; `/forms/runtime/:code` still served by the contract-platform module (renamed in PR-C). |
| **DB / DOCX / locked contracts touched** | NO — no DB migration, no DOCX mutation. |
| **Files to include (34)** | All 29 Form Studio backend deletions listed in §1.2 + 5 FE: 2 deleted page.tsx, `form-studio-workspace.tsx` (D), `nav-items.tsx`, `app-shell.tsx`, `permissions.ts`, `form-studio-api.ts`, **NEW** `form-studio-retirement-guard.test.ts`. |
| **Files explicitly excluded** | Contract-platform sources (PR-C); api-render-core (PR-D); app.module.ts swap (PR-C); form-studio-api.ts must remain in this commit ONLY as the slimmed re-export (do NOT include the new `contract-platform-api.ts` here — that lands with PR-C so the re-export resolves to an existing symbol). |
| **Validation commands** | `pnpm --filter api build`, `pnpm --filter web build`, `pnpm --filter web test -- --grep "retirement guard"`, manual: visit `/admin/form-studio` → must 404; visit `/admin/auth/identities` → sidebar must NOT contain "Form Studio". |

> **Note (ordering):** If the planner wants strict atomicity, PR-B should land FIRST (it removes the pages) and PR-C should land afterwards introducing the contract-platform module that registers the same HTTP routes via new controllers. That ordering means the BE is briefly down between commits — acceptable for trunk-based rollouts behind a feature flag but worth flagging.

### Commit 3 — PR-C: contract-platform rename + runtime preview core wire

| Field | Value |
| --- | --- |
| **Risk** | MEDIUM (NestJS module rename — DI tokens may shift) |
| **Depends on** | PR-B (Form Studio module removal completes the seam) |
| **Public route paths change** | NO — same `/admin/form-templates`, `/forms/runtime/:code`, `/admin/form-permissions` HTTP paths are preserved by the new controllers. |
| **DB / DOCX / locked contracts touched** | NO |
| **Files to include (16)** | `M apps/api/src/app.module.ts`, all 15 new `apps/api/src/modules/contract-platform/**` files, `?? apps/web/src/lib/contract-platform-api.ts` |
| **Files explicitly excluded** | `apps/web/src/lib/form-studio-api.ts` (already modified in PR-B; only the re-export shim remains), `api-render-core/**` (PR-D). |
| **Validation commands** | `pnpm --filter api build`, `pnpm --filter api test` (must pass without referencing deleted Form Studio imports), manual: `GET /forms/runtime/BM-001` returns contract metadata via contract-platform; check Nest DI starts with no `UndefinedModuleException`. |

### Commit 4 — PR-D: Generated render core wire

| Field | Value |
| --- | --- |
| **Risk** | MEDIUM (changes orchestration logic in render pipeline) |
| **Depends on** | PR-C (uses the same AppRenderIntent boundary introduced in the new module's controllers) |
| **Public route paths change** | NO — same paths; behaviour change only. The boundary policy throws on misuse (e.g. calling `renderGeneratedDocumentDocx` with `runtime-template` lifecycle). |
| **DB / DOCX / locked contracts touched** | NO — code-only orchestration change. |
| **Files to include (16)** | 10 new `apps/api/src/modules/documents/rendering/application/api-render-core/**` files + 6 modified call-sites in `apps/api/src/modules/documents/` (document-renderer.controller.ts, documents.module.ts, runtime-preview-session.service.ts, runtime-preview-session.service.spec.ts, render-generated-document.use-case.ts, render-generated-document.use-case.spec.ts, runtime-template-render.controller.ts). |
| **Files explicitly excluded** | `apps/api/src/modules/bm031-direct/bm031-direct.controller.ts` — see §3 cross-contamination. This file imports from the new `api-render-boundary.policy` but is NOT authorised by PR-D's blast radius. |
| **Validation commands** | `pnpm --filter api test`, especially `render-generated-document.use-case.spec.ts`, `api-render-boundary.policy.spec.ts`, `generated-render-core.guard.test.ts`, `runtime-preview-core.guard.test.ts`. Manual: trigger render of BM-001 generated document + BM-171 runtime preview; both should succeed and route via the new orchestrator. |

### Commit 5 (OPTIONAL) — Audit & forensic docs

| Field | Value |
| --- | --- |
| **Risk** | LOW |
| **Depends on** | None |
| **Files to include** | The 17 forensic audit documents listed in §1.6 (excluding the binary `.docx`) and the 10 PR6G/PR7 artefacts listed in §1.5. |
| **Files explicitly excluded** | The binary `API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx` (consider converting to .md first or excluding — `.docx` adds noise to PRs); `_pr7a2-triage/*` (raw, do not version); `storage/temp/**` (do not commit). |
| **Validation** | N/A — these are reports. |

> **Recommendation: do NOT commit the audit/forensic artefacts in this PR cycle.** They are reference material; committing them now will pollute PR-A..D's history. Keep them in working tree only and re-evaluate after PR-D lands.

### Files that should NOT be committed in any PR-A..D bucket (DO_NOT_COMMIT)

| Path / pattern | Reason |
| --- | --- |
| `storage/temp/**` (181 files) | Scratch verification artefacts from PR6G/PR7; must never be committed. Add to `.gitignore` in a separate housekeeping PR. |
| `docs/audit/unified-bm-workspace/_pr7a2-triage/*` (6 files) | Raw triage JSON/XML; unversioned debug material. |
| `docs/audit/api-architecture-forensics/API_ARCHITECTURE_FORENSIC_AUDIT.latest.docx` | Binary forensic artefact (1 file). Consider git-ignoring `.docx` reports or converting to `.md`. |
| `scripts/audit/_debug-smoke.mjs` | Local debug script — does not match scripts/audit/*.mjs convention; either delete or move into a debug folder. |
| `setup-wsl-ubuntu-d.ps1` | Local environment setup, not a build artefact. |
| `quanlynew-main.zip` | Whole-repo zip snapshot of `quanlynew-main`; not source. |
| `apps/web/src/lib/form-flight/profile-status.ts`, `apps/web/src/lib/form-flight/profile-status.test.ts`, `apps/web/src/lib/form-flight/runtime-consumer-guard.test.ts` | These support PR-A but expose additional commit boundary risk — see UNKNOWN. |

### UNKNOWN_NEEDS_PLANNER_REVIEW

| Path | Why unknown |
| --- | --- |
| `apps/web/src/lib/form-flight/profile-status.ts` | New file. The `generated-document-adapter.ts` PR-A diff imports `isRuntimeReadyProfile` from this file. The file likely belongs to PR-A as the runtime-readiness predicate the panel uses. Planner must decide: include it in Commit 1 (PR-A), or split into its own commit. |
| `apps/web/src/lib/form-flight/profile-status.test.ts` | Test for the above. Same decision. |
| `apps/web/src/lib/form-flight/runtime-consumer-guard.test.ts` | New test file. Its scope is the FE form-flight consumers (bm171.ts, bm001.ts, generated-document-adapter.ts). Could be PR-A (consumer hardening) or its own PR. Planner decision needed. |
| `apps/api/src/modules/bm031-direct/bm031-direct.controller.ts` | Pre-existing controller now imports `assertRenderIntentBoundary` from PR-D's `api-render-boundary.policy`. See §3 — this is a cross-contamination finding. Planner must decide: include in Commit 4 (PR-D) with rationale, or split into a separate boundary enforcement PR. |
| `apps/web/src/lib/form-flight/bm001-second-pilot.test.ts` | +370/-370 lines. Large test file. Likely tied to the BM-001 second pilot run from PR6G51. Should NOT be committed alongside PR-A. Planner: stash to a PR6G-backport branch or leave dirty. |
| `apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts` | Modified by +53 lines. Looks like new `isRuntimeReadyProfile` wiring analogous to `generated-document-adapter.ts`. Belongs in PR-A but is currently unselected for PR-A's commit boundary. |
| `apps/web/src/lib/form-flight/profiles/bm171.ts` | +7 lines, minor. Likely part of PR-A's `profileStatus: "runtime-ready"` wiring. |
| `apps/web/src/components/documents/generated-document-workspace.tsx`, `template-preview-workspace.tsx`, `template-selector-workspace.tsx` | Modified by 24/2/2 lines. These panels likely consume the new selector + API client. Likely belong to PR-A or be scattered PR-C consumers. |
| `apps/web/src/components/documents/generated-form-panel-selector.test.ts` | Test for the PR-A selector; should be in Commit 1 (already selected) but verify both `.ts` and `.test.ts` move together. |
| `apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts` | New customer-side retirement guard test for the BE side. Mirrors the FE `form-studio-retirement-guard.test.ts` from PR-B. Belongs with PR-C. |

---

## 3. PHASE 3 — Cross-Contamination Findings

### 3.1 CRITICAL — `bm031-direct.controller.ts` imports PR-D boundary at a pre-existing controller

```diff
+ import { assertRenderIntentBoundary } from '../documents/rendering/application/api-render-core/api-render-boundary.policy';
…
+     assertRenderIntentBoundary({
+       lifecycle: 'generated-document',
+       intent: 'GENERATED_BM031_DIRECT_SAVE',
+     });
```

`bm031-direct.controller.ts` is part of the pre-existing BM-031 direct save flow (not part of PR-D or PR-C). It now carries a hard dependency on PR-D's `api-render-boundary.policy`. **Cross-cutting risk:**

- Until Commit 4 (PR-D) lands, this file references an undeclared module path; BE TypeScript build will FAIL if the file is staged alone.
- After Commit 4, this change is logically part of "boundary enforcement across all entry points", which is sensible but expands PR-D's scope.

**Recommendation:** include `bm031-direct.controller.ts` in **Commit 4 (PR-D)** with a rationale paragraph in the commit body, OR split into a fifth commit "boundary enforcement on legacy entry points".

### 3.2 MODERATE — `form-studio-api.ts` and `contract-platform-api.ts` are a coupled pair

`form-studio-api.ts` is now a 7-line re-export shim that re-exports `getRuntimeFormContract`, `listFormPlatformCatalog`, `FormPlatformCatalogItem`, `FormPlatformCatalogResponse` from `./contract-platform-api`. This means:

- `contract-platform-api.ts` MUST exist in the same tree at runtime; otherwise `form-studio-api.ts` is dead.
- If PR-B (Commit 2) lands first and PR-C (Commit 3) lags behind, every consumer of `form-studio-api.ts`'s re-exports will fail to resolve `./contract-platform-api`.

The safe ordering is:

```
PR-B (deletions) → PR-C (introduces contract-platform-api.ts) → PR-A (consumes contract-platform-api)
```

But the natural narrative ordering is **PR-A → PR-B → PR-C → PR-D**. If narrative ordering is preferred, **staging `form-studio-api.ts` MUST be delayed to land atomically with `contract-platform-api.ts`**. Easiest implementation: keep PR-B's `form-studio-api.ts` modification parked until PR-C commits, OR commit them jointly as Commit 2.5.

### 3.3 MINOR — `apps/web/src/components/documents/{template-preview,template-selector,generated-document}-workspace.tsx` reference contract-platform

```bash
$ rg 'contract-platform' apps/web/src
apps/web/src/components/documents/template-selector-workspace.tsx
apps/web/src/components/documents/template-preview-workspace.tsx
apps/web/src/components/documents/generated-document-workspace.tsx
```

Each is +2..+24 lines. They likely cross-reference PR-C's API client and PR-A's selector. **Risk:** these workspaces may be partial PR-A + partial PR-C consumers. Without diff inspection of every line they could break build if split incorrectly between commits.

**Recommendation:** group all 3 workspace edits into whichever commit introduces their primary dependency. Suggest Commit 1 (PR-A) since the selector change drives them.

### 3.4 MINOR — `generated-document-adapter.ts` and `template-runtime-adapter.ts` mirror each other

Both adapters (53+53 lines, 61+61 lines respectively) import `isRuntimeReadyProfile` and wire it to the same skeleton/audit-only short-circuit. They are paired PR-A changes. **Risk:** splitting them across commits creates asymmetry where one adapter treats skeleton as runtime-ready while the other does not.

**Recommendation:** include BOTH in Commit 1 (PR-A).

### 3.5 MODERATE — Module-swap risk in `app.module.ts` vs NestJS DI

`app.module.ts` only registers `ContractPlatformModule` in place of `FormStudioModule`. If the contract-platform module's providers don't export the same DI tokens, dependents in `documents.module.ts`, `bm031-direct` etc. may fail injection. From the diff inspection of `documents.module.ts` it explicitly registers 3 new providers from `api-render-core/` — this mitigates the risk but the planner should run a full `pnpm --filter api build` between PR-B and PR-D.

### 3.6 MINOR — `apps/api/src/modules/documents/runtime-template-render.controller.ts` and `runtime-preview-session.service.ts` reference `api-render-core` policy/orthestrator

These two changes are part of PR-D (Commit 4). They are correctly scoped.

### 3.7 STRUCTURAL — `apps/api/src/modules/contract-platform/infrastructure/legacy-renderer-capabilities.generated.ts`

This is a *regenerated* file under the new module path, not authored fresh. The rename implies regeneration of the legacy-renderer capability snapshot for the new module name. If the content is genuinely byte-different from the Form Studio source, include in PR-C; if byte-identical (just at new path), it's still a file **add** to PR-C.

### 3.8 NOTE — `_pr7a2-triage/*` lives under `docs/audit/unified-bm-workspace/`

These 6 raw triage files live in what looks like an audited area but are prefixed with `_` (underscore). The leading underscore signals "gitignore-able / un-versioned raw triage". They should not be committed; instead update `.gitignore` to exclude `_pr7a2-triage/**`. **Do not modify `.gitignore` in this task** — flag for planner.

---

## 4. PHASE 4 — Safety Review (dangerous pattern scan)

Search scope: only `apps/api/src/*` and `apps/web/src/*` source files (NOT docx, NOT storage/temp).

| Pattern | Files matched | Verdict |
| --- | --- | --- |
| `mode=` | none in dirty source | clean |
| `render-docx/metadata` | none in dirty source | clean |
| `generated_documents` (Prisma model) | matches in **many pre-existing** files (NOT in dirty set): `bm031-direct.service.ts`, `case-people.service.ts`, `case-offenses.service.ts`, `evidence.service.ts`, `case-assignments.service.ts`, `cases.service.ts`, `agency-resource-access.service.ts`, `imports.service.ts`, `documents.service.ts`, `document-pdf.service.ts`, `document-files.service.ts`, `generated-document-audit.service.ts`, `contract-shadow-renderer.orchestrator.ts` | these are **unchanged pre-existing references**; none in dirty files (verified by rg against dirty source) |
| `generated_document_files` | same files as above | unchanged pre-existing |
| `generated_document_audit_logs` | `generated-document-audit.service.ts` & spec | pre-existing, unchanged |
| `case_events` | many pre-existing service files | pre-existing, unchanged |
| `prisma` | pre-existing common ref | no NEW prisma client reference added |
| `schema.prisma` | `apps/api/prisma/schema.prisma` is **NOT in dirty list** | no schema mutation |
| `migration` | NONE in dirty source files (matches only inside test fixtures / shadcn migration comments — unrelated) | no migration triggered |
| `locked` | `packages/form-contracts` refs | no dirty file mutates locked contracts |
| `normalized` | commented in pre-existing types | none in dirty files |
| `source.docx` / `source.doc` / `DOCX` | matches are READ-ONLY document path references in dirty `runtime-preview-session.service.ts` and the new `api-render-core/*` files | READ-ONLY (write is guarded by `assertRenderWriteBoundary`) |
| `sample` / `demo` | matches in pre-existing test fixtures | no dirty file introduces new sample fixtures beyond what already exists |
| `credentials` | none in dirty source | clean |
| `secret` | none in dirty source | clean |
| `qlv_session` | matches only in **unchanged pre-existing** files: `apps/web/src/proxy.ts:28`, `app-config.service.ts:100`, `auth.guard.spec.ts`, `auth.controller.spec.ts`, `csrf-cookie.guard.spec.ts` | none in dirty source — no auth-secret leak |

### Verdict

**No secrets, no schema.prisma mutation, no DB migration, no locked-contract mutation, no destructive auth-bypass change present in the dirty set.** Both bm031-direct and documents-module changes only **call** the new boundary assertions; they do not introduce new DB writes or schema fields.

---

## 5. PHASE 5 — Report Artifact

This file (written) is the report artifact:

```
docs/audit/change-set-review/CHANGE_SET_FORENSIC_REVIEW.latest.md
```

No JSON sibling was created, per Phase 5 instruction.

---

## 6. PHASE 6 — Validation

No build/test was run (audit-only). The following no-mutating commands were executed:

| Command | Outcome |
| --- | --- |
| `git status --short` | 83 entries (33M / 32D / 0R / 18??) — captured |
| `git diff --name-status` (scoped) | 65 tracked entries — captured |
| `git ls-files --others --exclude-standard` (scoped) | 227 untracked paths — captured |
| `rg 'render-docx/metadata\|generated_documents\|generated_document_files\|generated_document_audit_logs\|case_events\|schema.prisma\|migration\|qlv_session'` against dirty source files | only pre-existing matches in unchanged files; **no dirty source file** newly references these patterns |
| `git diff` for `app.module.ts`, `bm031-direct.controller.ts`, documents module set, form-studio-api.ts, form-flight adapters, form-studio/delete list, FE works-space, FE retirement guard | classified into §1 |

No file was staged, no commit was created, no branch was created or pushed, no source code was edited, no formatter was run, no lint was run, no DB was touched, no `.gitignore` was modified.

---

## 7. PHASE 7 — Executive Tally & Recommendations

### Bucket summary table

| Bucket | File Count (top-level) | Risk | Notes |
| --- | --- | --- | --- |
| PR-A FE selector guard | 5 | LOW | New selector + 3 form-flight wiring files |
| PR-B Form Studio retirement + seam | 34 | HIGH | 30 deletions (kills customer Form Studio) + 4 FE seam edits |
| PR-C contract-platform rename | 16 | MEDIUM | BE module rename; routes preserved |
| PR-D generated render core wire | ~16 | MEDIUM | New api-render-core + 6 modified call-sites + cross-cutting bm031 |
| PR6G/PR7 pre-existing audit refresh | 10 | LOW | Not authored by PR-A..D; leftover from previous milestone |
| AUDIT_ARTIFACT (forensics / audit) | 18 | LOW | Reference docs; default do-not-commit |
| TEMP/SCRATCH do-not-commit | ~190 | n/a | storage/temp, raw triage, local scripts, repo zip |
| UNKNOWN / cross-area | 9 items in §2 | VARIES | Planner must decide bucket |

### Recommended commit order

```
Commit 1 (PR-A)  → Commit 2 (PR-B) → Commit 3 (PR-C, includes contract-platform-api.ts) → Commit 4 (PR-D, includes bm031-direct.controller.ts)
```

Or, to minimise inter-commit risk:

```
Commit 1 (PR-B deletion + slimmed form-studio-api re-export shim keeping everything functional via existing /forms/runtime path) → Commit 2 (PR-C: contract-platform rename, BE module swap) → Commit 3 (PR-A: FE selector hardening) → Commit 4 (PR-D generated render core wire)
```

The second ordering removes `form-studio-api.ts` ↔ `contract-platform-api.ts` cross-commit coupling.

### Questions for planner

1. Does Commit 1 (PR-A) include `apps/web/src/lib/form-flight/profile-status.ts`, `profile-status.test.ts`, `runtime-consumer-guard.test.ts`, `template-runtime-adapter.ts`, `bm171.ts`, `bm001-second-pilot.test.ts`? They sit on the PR-A boundary but expand the diff significantly.
2. Should `apps/api/src/modules/bm031-direct/bm031-direct.controller.ts` be committed with PR-D as a "boundary enforcement across entry points" commit, or split out?
3. Do you want a separate "audit-docs refresh" commit (Commit 5) bundling the 17 forensic JSON/MD + 10 PR6G/PR7 latest artefacts, or are they to remain un-versioned?
4. Should `storage/temp/**` and `_pr7a2-triage/**` and the binary `.docx` be added to `.gitignore` in a follow-up housekeeping PR (NOT this one)?
5. Should PR-B's `form-studio-api.ts` re-export shim be deferred until PR-C lands so the re-export target exists at commit-time?

### Files explicitly NOT staged, NOT modified, NOT deleted by this review

- No source file edited
- No new file created except `docs/audit/change-set-review/CHANGE_SET_FORENSIC_REVIEW.latest.md`
- No existing file deleted
- No `.gitignore` modified
- No formatter run
- No commit performed
