# EXECUTOR REPORT — FORM_FLIGHT_CORE_SHARED_ADAPTERS_AND_ROLLOUT_FACTORY_V1

## 1. Status

| Field | Value |
|---|---|
| **STATUS** | **PASS** |
| COMMIT_CREATED | NO |
| ROUTES_MERGED | NO |
| FAKE_GENERATED_DOCUMENT_ID_USED | NO |
| LOCKED_CONTRACTS_MUTATED | NO |
| NORMALIZED_DOCX_MUTATED | NO |
| SOURCE_DOCX_MUTATED | NO |
| MASS_ROLLOUT_213_STARTED | NO |
| LIVE_BROWSER_SIGNOFF | **NOT_AVAILABLE** (script-level signoff PASS; no Playwright/live-browser env in this session) |

**One-line verdict:** Shared core + two adapters built, BM-171 wired
through both flows, BM-001 second pilot skeleton registered, rollout
matrix classifies all 60 forms, and every audit + test gate is green —
without committing, pushing, opening a PR, mass-rollouting, mutating
locked contracts / normalized DOCX / source DOCX, merging routes,
faking a `generatedDocumentId`, or claiming live browser signoff.

---

## 2. Wording Correction

The previous BM-171 visual signoff report was corrected before any
code change in this phase. See
`docs/audit/bm171-visual-browser-signoff/EXECUTOR_REPORT.latest.md`.

| Previous claim | New wording | Reason |
|---|---|---|
| `STATUS: COMPLETE` | `STATUS: READY_TO_COMMIT_WITH_BROWSER_MANUAL_PENDING` | Report said Playwright was not run and screenshot was a 1×1 stub. Cannot claim COMPLETE. |
| `PART A — BM-171 browser visual signoff: PASS` | `PART A — BM-171 visual/script signoff: PASS` | A "browser visual signoff" requires an actual browser capture. Script-level content/visual checks passed; browser capture did not run. |
| (implicit "visual evidence") | `Real Playwright / live browser visual signoff: PENDING` + `Screenshot artifact: STUB, not visual evidence` | The 1×1 PNG stub is not visual evidence. Future task must run a real Playwright/live-browser capture and replace the stub. |

The wording correction is the first deliverable of this phase.

---

## 3. Shared Core Implemented

| Component | Path | Status | Notes |
|---|---|---|---|
| profile type | `apps/web/src/lib/form-flight/types.ts` | PASS | `FormFlightMode`, `FormFlightProfile`, `FormFlightAdapter`, `FormFlightPayloadMode` |
| payload builder | `apps/web/src/lib/form-flight/payload.ts` | PASS | `buildFormFlightPayload` wraps `buildRuntimePreviewPayloadFromDraft`; relative import keeps node:test runner happy |
| required validation | `apps/web/src/lib/form-flight/validation.ts` | PASS | `collectFormFlightMissingRequired`, `listFormFlightMissingPaths`, `snapshotFormFlightFields` |
| summary resolver | `apps/web/src/lib/form-flight/summary.ts` | PASS | `resolveFormFlightLine`, `resolveFormFlightSummary` |
| acceptance scanner | `apps/web/src/lib/form-flight/acceptance.ts` | PASS | `scanFormFlightAcceptance` flags missing requiredText + leaked forbiddenText |
| registry | `apps/web/src/lib/form-flight/registry.ts` | PASS | `registerFormFlightProfile`, `getFormFlightProfile`, `listFormFlightProfiles`, `__resetFormFlightProfilesForTests` |
| template runtime adapter | `apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts` | PASS | `gateRuntimePreview`, `buildRuntimePreviewPayload`, `resolveRuntimeSummary`, `acceptRuntimeRenderedText`, `listRuntimeMissingFields`, `createTemplateRuntimeAdapter` |
| generated document adapter | `apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts` | PASS | `gateGeneratedDocumentSave`, `buildGeneratedDocumentSavePayload`, `buildGeneratedDocumentDemoPayload`, `resolveGeneratedDocumentSummary`, `acceptGeneratedDocumentRenderedText`, `listGeneratedDocumentMissingFields`, `assertProfileInvariant` |

The barrel `apps/web/src/lib/form-flight/index.ts` exposes the public
surface.

---

## 4. BM-171 Shared-Core Pilot

| Check | Result | Evidence |
|---|---|---|
| runtime uses shared profile | PASS | `apps/web/src/components/documents/template-preview-workspace.tsx` imports `@/lib/form-flight/profiles/bm171` and calls `gateRuntimePreview` |
| generated document uses shared profile | PASS | `apps/web/src/components/documents/bm-171-form-inputs.tsx` imports `@/lib/form-flight/profiles/bm171` and calls `buildGeneratedDocumentSavePayload` + `gateGeneratedDocumentSave` |
| same fieldPaths | PASS | `bm171-shared-core.test.ts` test #5 — both adapters read the same registered profile |
| required fields match locked contract | PASS | `bm171-shared-core.test.ts` test #4 — `requiredFieldPaths` matches locked contract required set |
| same payload key semantics | PASS | `bm171-shared-core.test.ts` test #6 — same draft → identical sanitized payload for both adapters |
| user override preserved | PASS | `bm171-shared-core.test.ts` test #9 — typed `Nguyễn Văn A — người nhận thật` survives in both adapters |
| missing required blocked | PASS | `bm171-shared-core.test.ts` test #8 — gates agree, both block |
| summary data-driven | PASS | `bm171-shared-core.test.ts` tests #11 + #12 — `—` when empty, typed when filled; both adapters agree |
| no route boundary violation | PASS | Runtime flow does NOT touch `generated_documents` / `generated_document_files` / `generated_document_audit_logs`; document flow keeps existing backend persistence |

---

## 5. Second Pilot

| Item | Result |
|---|---|
| **selected BM** | **BM-001** |
| **reason selected** | Largest READY_FOR_PROFILE_PORT form (39 fields / 28 required). Most mature typed API helper (`apps/web/src/lib/bm001-form-inputs-api.ts`). Proves the rollout factory's classification is honest and the shared core absorbs a non-BM-171 shape. |
| profile skeleton complete | PASS — `apps/web/src/lib/form-flight/profiles/bm001.ts` registers 35 fieldPaths + 22 requiredFieldPaths |
| minimal acceptance anchors | PASS — skeleton is honest about empty `demo`, undefined `summaryLines`, empty `acceptance.requiredText`, empty `acceptance.forbiddenText`. No fake anchors. |
| tests run | `bm001-second-pilot.test.ts` — 6/6 PASS. Full web-unit suite — 476/476 PASS. |

---

## 6. Rollout Matrix

| Classification | Count | Example BMs | Next action |
|---|---:|---|---|
| READY_FOR_PROFILE_PORT | 27 | BM-001, BM-023, BM-030, BM-031, BM-033, BM-037, BM-038, BM-039, BM-040, BM-171, ... | Generate FormFlightProfile skeleton; port demo, requiredFieldPaths, summary lines; run shared-core parity test. |
| NEEDS_PROFILE_FIELDS | 5 | BM-002, BM-008, BM-010, BM-012, ... | Fix demo fixture leaks (`undefined` / `Invalid Date` substrings), then generate skeleton. |
| NEEDS_SAVE_ADAPTER | 27 | BM-003, BM-005, BM-006, BM-007, BM-009, BM-011, BM-014, BM-015, ... | Refactor save handler into the `saveDocumentFormInputs` family, then port. |
| NEEDS_RENDER_PAYLOAD_MAPPING | 0 | — | None currently classified. |
| NEEDS_DOCX_CONTRACT_REVIEW | 0 | — | None currently classified. |
| NEEDS_LEGAL_REVIEW | 0 | — | None currently classified. |
| BLOCKED | 1 | (one component missing — see matrix) | Create component + registry entry first; port later. |
| **Total** | **60** | | |

Per-form detail:
`docs/audit/form-flight-baseline/FORM_FLIGHT_ROLLOUT_MATRIX.latest.json`
and `…latest.md`.

Skeleton profiles for the 27 READY forms:
`docs/audit/form-flight-baseline/FORM_FLIGHT_PROFILE_SKELETONS.latest.json`.

---

## 7. Files Changed

| File | Change | Reason | Risk |
|---|---|---|---|
| `apps/web/src/lib/form-flight/types.ts` | NEW | Core types | LOW |
| `apps/web/src/lib/form-flight/payload.ts` | NEW | Shared payload builder (wraps `runtime-ux/runtime-preview-payload`) | LOW |
| `apps/web/src/lib/form-flight/validation.ts` | NEW | Shared required-field gate | LOW |
| `apps/web/src/lib/form-flight/summary.ts` | NEW | Shared summary resolver | LOW |
| `apps/web/src/lib/form-flight/acceptance.ts` | NEW | Shared acceptance scanner | LOW |
| `apps/web/src/lib/form-flight/registry.ts` | NEW | Shared profile registry | LOW |
| `apps/web/src/lib/form-flight/index.ts` | NEW | Public barrel | LOW |
| `apps/web/src/lib/form-flight/profiles/bm171.ts` | NEW | BM-171 canonical profile (production reference) | LOW |
| `apps/web/src/lib/form-flight/profiles/bm001.ts` | NEW | BM-001 skeleton profile (second pilot) | LOW |
| `apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts` | NEW | Template-runtime adapter | LOW |
| `apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts` | NEW | Generated-document adapter | LOW |
| `apps/web/src/lib/form-flight/bm171-shared-core.test.ts` | NEW | 16-test shared-core proof | LOW |
| `apps/web/src/lib/form-flight/bm001-second-pilot.test.ts` | NEW | 6-test second-pilot proof | LOW |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | MODIFIED — `gateRuntimePreview` parity call; `canonicalGate.ok === false` discriminator | Wire BM-171 runtime flow to the shared core | LOW |
| `apps/web/src/components/documents/bm-171-form-inputs.tsx` | MODIFIED — `buildGeneratedDocumentSavePayload` + `gateGeneratedDocumentSave` parallel signal | Wire BM-171 generated-document flow to the shared core | LOW |
| `scripts/audit/form-flight-rollout-factory.mjs` | NEW | Classifies the 60 legacy forms; emits matrix + skeleton profiles | LOW |
| `docs/audit/form-flight-baseline/FORM_FLIGHT_CORE_V1.latest.{md,json}` | NEW | Core V1 contract document | LOW |
| `docs/audit/form-flight-baseline/FORM_FLIGHT_BM171_SHARED_CORE.latest.{md,json}` | NEW | BM-171 pilot evidence | LOW |
| `docs/audit/form-flight-baseline/FORM_FLIGHT_SECOND_PILOT.latest.{md,json}` | NEW | BM-001 second pilot evidence | LOW |
| `docs/audit/form-flight-baseline/FORM_FLIGHT_ROLLOUT_MATRIX.latest.{md,json}` | NEW | 60-form classification matrix (auto-generated by factory) | LOW |
| `docs/audit/form-flight-baseline/FORM_FLIGHT_PROFILE_SKELETONS.latest.json` | NEW | Skeleton profiles for the 27 READY forms (auto-generated by factory) | LOW |
| `docs/audit/bm171-visual-browser-signoff/EXECUTOR_REPORT.latest.md` | MODIFIED — wording correction | Stop overclaiming browser evidence | NONE — report file |

No locked contracts, normalized DOCX, source DOCX, generated
document panels, route files, auth / RBAC files, or
`generatedDocumentId` factories were touched.

---

## 8. Validation Commands

| Command | Exit | Result |
|---|---|---|
| `pnpm --filter web lint` | 0 | clean |
| `pnpm --filter web exec tsc --noEmit` | 0 | clean (after discriminator fix in `template-preview-workspace.tsx`) |
| `pnpm --filter api lint` | 0 | clean |
| `pnpm --filter api exec tsc --noEmit` | 0 | clean |
| `pnpm --filter @qllaw/form-contracts exec tsc --noEmit` | 0 | clean |
| `pnpm audit:hardcode` | 0 | `Runtime hardcode audit passed.` |
| `pnpm audit:locked-compiled` | 0 | `213/213 consistent` |
| `pnpm audit:contract-sync` | 0 | `Matched: 213 / Missing in DB: 0 / Stale: 0` |
| `pnpm audit:bm-final -- BM-171` | 0 | `status=PASS harnessReady=true rolloutReady=true` |
| `pnpm audit:bm-rollout-ready -- BM-171` | 0 | `status=READY technicalReady=true rolloutReady=true` |
| `pnpm audit:bm-source-render-parity -- BM-171` | 0 | `present 39/39, absent 14/14, header 4/4, superscript 0, xml parts 5/5, overall PASS` |
| `pnpm test:web-unit` | 0 | `tests 476 / pass 476 / fail 0` (up from 454 — the new 16 + 6 tests land in this suite) |
| `node scripts/audit/form-flight-rollout-factory.mjs` | 0 | Wrote `…FORM_FLIGHT_ROLLOUT_MATRIX.latest.{json,md}` and `…FORM_FLIGHT_PROFILE_SKELETONS.latest.json`. Summary: `{"READY_FOR_PROFILE_PORT":27,"NEEDS_PROFILE_FIELDS":5,"NEEDS_SAVE_ADAPTER":27,…,"BLOCKED":1}` |
| `apps/api` `tsx scripts/reproduce-bm171-runtime-user-override.mjs` | 0 | `[OK] BM-171 user-override preservation passes acceptance checks.` |
| `apps/api` `tsx scripts/reproduce-bm171-runtime-missing-required.mjs` | 0 | `[OK] BM-171 missing-required gate detects all three mandated required fields.` |
| `apps/api` `tsx scripts/reproduce-bm171-runtime-stale-cleanup.mjs` | 0 | `[OK] BM-171 stale-fallback cleanup passes acceptance checks.` |
| `apps/api` `tsx scripts/reproduce-bm171-runtime-preview-before.mjs` | 0 | `[OK] BM-171 runtime preview BEFORE fix matches production semantics.` |
| `apps/api` `tsx scripts/reproduce-bm171-runtime-preview-after.mjs` | 0 | `[OK] BM-171 runtime preview AFTER fix matches production semantics.` |
| `apps/api` `tsx scripts/reproduce-bm171-visual-browser-signoff.mjs` | 0 | `[OK] BM-171 visual browser signoff passes acceptance checks.` |

The reproduction scripts run from `apps/api/` because they import
from `apps/api/src/modules/documents/...` which is a `.ts` source
that `tsx` resolves at runtime. Running them from the workspace
root with bare `node` fails with `ERR_MODULE_NOT_FOUND` for the
compiled-only paths — this is a known environment quirk, not a
regression. The reproduction scripts pass via the same `tsx` runner
used in the previous session.

---

## 9. Artifacts

| Artifact | Path |
|---|---|
| Form Flight Core V1 contract (md) | `docs/audit/form-flight-baseline/FORM_FLIGHT_CORE_V1.latest.md` |
| Form Flight Core V1 contract (json) | `docs/audit/form-flight-baseline/FORM_FLIGHT_CORE_V1.latest.json` |
| BM-171 shared-core evidence (md) | `docs/audit/form-flight-baseline/FORM_FLIGHT_BM171_SHARED_CORE.latest.md` |
| BM-171 shared-core evidence (json) | `docs/audit/form-flight-baseline/FORM_FLIGHT_BM171_SHARED_CORE.latest.json` |
| Rollout matrix (md) | `docs/audit/form-flight-baseline/FORM_FLIGHT_ROLLOUT_MATRIX.latest.md` |
| Rollout matrix (json) | `docs/audit/form-flight-baseline/FORM_FLIGHT_ROLLOUT_MATRIX.latest.json` |
| Skeleton profiles (json) | `docs/audit/form-flight-baseline/FORM_FLIGHT_PROFILE_SKELETONS.latest.json` |
| Second pilot BM-001 (md) | `docs/audit/form-flight-baseline/FORM_FLIGHT_SECOND_PILOT.latest.md` |
| Second pilot BM-001 (json) | `docs/audit/form-flight-baseline/FORM_FLIGHT_SECOND_PILOT.latest.json` |
| BM-171 visual signoff report (corrected wording) | `docs/audit/bm171-visual-browser-signoff/EXECUTOR_REPORT.latest.md` |

---

## 10. Remaining Risks

| Risk | Severity | Recommendation |
|---|---|---|
| BM-001 second pilot has empty `demo` / `summaryLines` / `acceptance` | LOW | Future task must author these by hand using the BM-001 API helper and the existing BM-001 component as references. Skeleton is honest about its gaps. |
| Live browser / Playwright visual signoff not yet run | MEDIUM | Future task must run a real `/templates/BM-171` Playwright/live-browser capture, replace the 1×1 stub screenshot, and re-label the visual signoff report. The user explicitly forbade claiming browser signoff without this capture. |
| Reproduction scripts run only via `apps/api/` `tsx` runner | LOW | Root-level `node` invocation fails on the compiled-only path. Pin the runner in `package.json` or a wrapper script. |
| Rollout matrix classifies 27 forms as `NEEDS_SAVE_ADAPTER` | MEDIUM | Batch 3 in the user's rollout plan. Do not attempt per-form port. Refactor the shared save adapter family first. |
| Rollout matrix classifies 5 forms as `NEEDS_PROFILE_FIELDS` (demo leaks) | LOW-MEDIUM | Batch 4. Fix demo fixture leaks, then port. |
| Locked-contract / normalized DOCX / source DOCX are the load-bearing source of truth | ALWAYS-HIGH | They MUST NOT be mutated. Future batches must classify-then-port, never fix-by-mutating the source. |

---

## 11. Recommendation

**READY_TO_COMMIT** — the code, the wiring, the BM-171 pilot, the
BM-001 second pilot skeleton, the rollout matrix, the skeleton
profiles, the four `FORM_FLIGHT_*` artifacts, and the wording
correction in the BM-171 visual signoff report are all in place.
Every audit + test + typecheck + lint gate is green. No commits,
pushes, or PRs were created in this session — that is intentional
and matches the role contract.

**Reason:** The user's `Role Contract` (item 0 of the prompt)
explicitly forbids the executor from committing, pushing, opening a
PR, mass-rollouting, deep-fixing all 60 forms, canonicalizing all 55
non-canonical forms, mutating locked contracts / normalized DOCX /
source DOCX, rewriting auth/RBAC, merging routes, faking
`generatedDocumentId`, or claiming live browser signoff. None of
those happened. The phase deliverable is ready for the
Planner/Gatekeeper (ChatGPT) to decide on commit + the next batch.

**Suggested next batches (per the user's rollout plan):**

1. **Commit baseline + BM-171** as one clean commit (Planner/Gatekeeper).
2. **Batch 1 — 5 READY_FOR_PROFILE_PORT forms** with `S` complexity
   (smallest field count). Measure speed per form.
3. **Batch 2 — 20 remaining READY_FOR_PROFILE_PORT forms** with `M` / `L`
   complexity.
4. **Batch 3 — NEEDS_SAVE_ADAPTER** (shared refactor of save handler
   family, then per-form port). 27 forms.
5. **Batch 4 — NEEDS_PROFILE_FIELDS** (fix demo fixture leaks, then
   port). 5 forms.
6. **Batch 5 — BLOCKED** (write the missing component first; do not
   roll into shared core).
7. **Live browser / Playwright visual signoff** for BM-171 +
   representatives from each batch. Re-label the visual signoff
   report after each capture.
8. **BM-001 second-pilot promotion** — fill the empty
   `demo` / `summaryLines` / `acceptance` blocks of the BM-001
   skeleton, then run the shared-core parity test again.

End of report.