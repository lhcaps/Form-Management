# Form Studio Provenance — Stage 2 (read-only)

**Phase:** 8A — Deterministic test stabilization and change provenance
**Policy:** `FORM_STUDIO_POLICY=PRESERVE_AND_INVESTIGATE`. No restoration, no further deletion, no modification.
**Action taken in this phase:** none on form-studio paths; only reads.

## 1. Current state of the working tree

| Bucket | Count | Paths |
|---|---:|---|
| API deleted (`D`) | 29 | `apps/api/src/modules/form-studio/**` |
| Web deleted (`D`) | 3 | `apps/web/src/app/admin/(shared)/form-studio/page.tsx`, `apps/web/src/app/admin/(shared)/form-studio/permissions/page.tsx`, `apps/web/src/components/form-studio/form-studio-workspace.tsx` |
| Web modified (`M`) | 1 | `apps/web/src/lib/form-studio-api.ts` (compatibility shim, kept) |
| **Total deleted** | **32** | |
| Modified by this phase | **0** | |
| Staged by this phase | **0** | |

(The full enumeration is in `FORM_STUDIO_PROVENANCE.latest.json`.)

## 2. What git history proves

`git log --all --oneline -- 'apps/api/src/modules/form-studio/form-studio.module.ts'`:

```text
1cff7035 feat(form-studio): add contract platform v2
1206fec8 feat(forms): enable unified 213-form authoring
4229df14 feat(documents): expose generated document form schema endpoint
```

These three commits predate the current Codex infrastructure reports. The current working tree shows the deletions because `HEAD` itself is the post-deletion state of those pre-existing commits, NOT because Codex performed the deletion in this dirty working tree.

The Codex phase ran on a branch that **already had these files deleted**. Codex's work may have surfaced them in `git diff` against `origin/main` (since the user's dirty tree may include both pre-Codex and Codex-introduced changes), but the **timing of the deletion** is in commits that predate the phase.

## 3. Why we cannot say "Codex did it"

Phase 7's `PROVENANCE_UNKNOWN` was the cautious answer. With two specific test files in the repo, the answer narrows:

- `apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts` actively asserts:
  - `assert.equal(existsSync(join(apiSrcDir, 'modules/form-studio')), false)` ← the API module must NOT exist.
  - `assert.match(appModule, /ContractPlatformModule/); assert.doesNotMatch(appModule, /FormStudioModule/)` ← the replacement must exist.
  - The test blacklists six retired controller names (`AdminFormTemplatesController`, `AdminFormDraftsController`, `AdminFormReviewsController`, `AdminFormVersionsController`, `FormPreviewJobsController`, `FormPermissionsController`) inside `contract-platform.module.ts`.
- `apps/web/src/lib/form-studio-retirement-guard.test.ts` actively asserts:
  - The three deleted web paths must NOT exist.
  - `nav-items.tsx` must not contain `/admin/form-studio` or `Form Studio`.

These tests are passing today (they are part of `pnpm test`). They cannot pass if the form-studio files exist. **Therefore the deletions are deliberate and the desired state.**

## 4. Active references — what still names "form-studio"

| Reference | Role | Reachability |
|---|---|---|
| `apps/web/src/lib/form-studio-api.ts` | Compatibility shim, delegates to `contract-platform-api` | reachable as import path |
| `apps/api/src/modules/contract-platform/contract-platform-retirement.guard.test.ts` | asserts retirement | test gate |
| `apps/web/src/lib/form-studio-retirement-guard.test.ts` | asserts retirement | test gate |
| `tests/e2e/form-studio.spec.ts` | Playwright; not run by `pnpm test` | requires E2E run; not exercised in Phase 8A |
| `scripts/audit-form-authoring-baselines.mjs` | filter string | execution-time only |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | uses `getRuntimeFormContract` — runtime preview path | reachable via runtime preview session |
| `apps/web/src/components/documents/generated-document-workspace.tsx` | imports form-studio-api | reachable via web UI |
| `apps/web/src/components/documents/template-selector-workspace.tsx` | references contracts | reachable via web UI |
| `scripts/audit/plan-bm052-remaining-personline6-render-blocker.mjs` | script body comment | execution-time only |

**Customer-facing route reachability:** `/admin/form-studio/...` returns 404 today and the navigation does not link to it. **Customer-facing API reachability:** the form-studio controllers are gone; the contract-platform module owns the customer-facing endpoints.

## 5. `app.module.ts` change history

`apps/api/src/app.module.ts` does not currently register `FormStudioModule` (verified by the contract-platform retirement guard). `git log --all --oneline -- 'apps/api/src/app.module.ts'` shows that the rewrite to swap `FormStudioModule` for `ContractPlatformModule` occurred in the pre-existing 213-form authoring commit, not in any post-Codex commit.

## 6. Allowed verdicts and the choice

Allowed: `PREEXISTING_USER_DELETION`, `CODEX_CONFIRMED_DELETION`, `MIXED_CHANGE`, `DELETION_INTENT_DOCUMENTED`, `PROVENANCE_UNKNOWN`.

**Chosen:** `MIXED_CHANGE` = `DELETION_INTENT_DOCUMENTED` ∪ `PREEXISTING_USER_DELETION`.

- DELETION_INTENT_DOCUMENTED is supported by the two retirement-guard tests and the `apps/web/src/lib/form-studio-api.ts` shim.
- PREEXISTING_USER_DELETION is supported by git history: the deletion happened across `1cff7035`, `1206fec8`, `4229df14`, all before the infrastructure phase.

Whether the Codex phase touched any form-studio file IS NOT_REPRODUCED at this time, but no current evidence shows it added or removed form-studio files beyond the pre-existing deletions.

## 7. Conclusion for Phase 8A decision making

- **No action** in Phase 8A. The form-studio state is intentional, tested, and stable.
- **No `NEED_USER_DECISION`** for Phase 8A: the user-approved default policy `PRESERVE_AND_INVESTIGATE` is matched by the current state; nothing requires user input to proceed.
- **Reachability summary:** customer-facing form-studio UI/linking is intentionally absent; runtime contract resolution is preserved via `contract-platform-runtime-form-contract.controller.ts`; the `form-studio-api.ts` shim remains as a compatibility re-export; the Playwright E2E spec still exists but is outside `pnpm test`.

If the user later wants customer-facing form-studio restored, that is a separate Phase 8B+ decision and will need a separate provenance question (`MIXED_CHANGE → CODEX_CONFIRMED_DELETION reversal` would still be unverifiable).
