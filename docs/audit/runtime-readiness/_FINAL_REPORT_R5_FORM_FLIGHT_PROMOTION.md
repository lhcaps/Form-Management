# QLLAW RUNTIME-READINESS R5 - FORM FLIGHT PROMOTION CLOSURE

> Deadline-mode closure of the Form Flight profile-promotion contract for the 9
> accepted-baseline candidates, expanding `runtimeReady` from 2 to 11 without
> opening a new cohort.
>
> This is a **bounded execution**, not a fresh audit cycle. All promotion
> evidence is re-anchored on the R4 strict pilot (16/16 PASS) and the R3
> inherited product fixes (database migration applied, bearer transport
> solved, Clerk parity tests green).

## A. Starting state

| Field | Value |
| --- | --- |
| `RUNTIME_READY_BEFORE` | `["BM-001", "BM-171"]` |
| `semanticPass` | `213 / 213` |
| `semanticIncomplete` | `0` |
| `inputLinkagePass` | `213 / 213` |
| `provenanceDuplicateCodes` | `[]` |
| R4 strict pilot result | `16 / 16 PASS` |
| Promotion blocker | Candidate Form Flight profiles remained `runtimeReady: false` / `profileStatus: "skeleton"` with incomplete `demo`, `summaryLines`, `acceptance`, and absent side-effect registration in `form-lifecycle.ts`. |

## B. Canonical profile contract

| Property | Type | Required for `runtimeReady` | Positive-control source | Guard |
| --- | --- | --- | --- | --- |
| `templateCode` | `"BM-NNN"` (literal) | YES | `BM001_FORM_FLIGHT_PROFILE.templateCode = "BM-001"` | `runtime-readiness-r5-profile-promotion.guard.test.mjs::R5-PROMOTE` |
| `title` | `string` (compiled title) | YES | BM001 / BM171 titles | Per-form audit in section D |
| `runtimeReady` | `boolean` (literal `true`) | YES (fail-closed) | `runtimeReady: true` in `bm001.ts` + `bm171.ts` | `form-lifecycle-wiring.guard.test.mjs::#10` |
| `profileStatus` | `"runtime-ready"` | YES (fail-closed AND with `runtimeReady`) | `profileStatus: "runtime-ready"` in both baselines | `form-lifecycle-wiring.guard.test.mjs::#10`, `profile-status.ts::isRuntimeReadyProfile` |
| `fieldPaths` | `readonly string[]` (subset of locked contract `canonicalFields`) | YES (non-empty) | `BM001_FIELD_PATHS`, `BM171_FIELD_PATHS` | `runtime-readiness-r5-profile-promotion.guard.test.mjs::R5-PROMOTE` |
| `requiredFieldPaths` | `readonly string[]` (subset of `fieldPaths`) | YES (when fewer than all are required) | `BM001_REQUIRED_FIELD_PATHS` | `runtime-readiness-r5-profile-promotion.guard.test.mjs::R5-PROMOTE` |
| `demo` | `Readonly<Record<string, string>>` keys subset of `fieldPaths` | YES (canonical disposable fixture values) | `BM001_DEMO`, `BM171_DEMO` | `runtime-readiness-r5-profile-promotion.guard.test.mjs::R5-PROMOTE` |
| `summaryLines` | `readonly { label, value }[]`, non-empty, no duplicate fields | YES | `BM001_SUMMARY_LINES`, `BM171_SUMMARY_LINES` | `runtime-readiness-r5-profile-promotion.guard.test.mjs::A6` |
| `acceptance` | `{ requiredText: readonly string[]; forbiddenText: readonly string[] }` non-empty | YES | `BM001_ACCEPTANCE`, `BM171_ACCEPTANCE` | `runtime-readiness-r5-profile-promotion.guard.test.mjs::R5-PROMOTE` |
| Registration (`registerFormFlightProfile(...)`) | side-effect call at module bottom | YES | bottom of `bm001.ts` + `bm171.ts` | `form-lifecycle-wiring.guard.test.mjs::#22` |
| Side-effect import in `form-lifecycle.ts` | `import * as _runtimeReadyImportsBmNNN from "./profiles/bmNNN"` | YES | `form-lifecycle.ts` lines 152-163 (R5 expansion) | `form-lifecycle-wiring.guard.test.mjs::#11 + #22`, `runtime-readiness-contract.guard.test.mjs::#2 + A2` |

`FormFlightProfileStatus` enum source-of-truth: `apps/web/src/lib/form-flight/types.ts`.
Canonical statuses: `"runtime-ready"`, `"persisted-ready"`, `"audit-only"`, `"skeleton"`.

## C. Candidate inventory (R5 accepted baseline)

| Code | Compiled title | Sections | Fields | Pre-R5 profileStatus | Pre-R5 runtimeReady | Missing parts pre-R5 |
| --- | --- | ---: | ---: | --- | --- | --- |
| BM-157 | BB vat chung kem theo Cao trang | 1 | 1 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |
| BM-181 | QD ap dung thu tuc rut gon | 1 | 3 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |
| BM-168 | BB giao nhan ho so vu an | multi | 14 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |
| BM-136 | BB doi chat | 1 | 17 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |
| BM-174 | Yeu cau ap dung bien phap dieu tra | 1 | 11 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |
| BM-206 | Lenh bat cap toc | 1 | 15 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |
| BM-213 | BB bat nguoi bi tam giu khan cap | multi | 28 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |
| BM-156 | BB tiep nhan tin bao, don to cao | multi | 41 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |
| BM-148 | BB giai trinh | multi | 30 | `skeleton` | `false` | demo, summaryLines, acceptance, registration |

R4 strict pilot per-candidate evidence (re-anchored for R5 promotion):

| Code | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BM-157 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS |
| BM-181 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS |
| BM-168 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| BM-136 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| BM-174 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS |
| BM-206 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| BM-213 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| BM-156 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| BM-148 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

## D. Profile corrections

All 9 candidate profile files were rewritten against the live canonical locked contract and the canonical BM-001/BM-171 contract structure. Each profile now declares:

- `templateCode` matching the file's identity (e.g. `BM-157` declares `templateCode: "BM-157"`).
- `runtimeReady: true`.
- `profileStatus: "runtime-ready"`.
- `fieldPaths` (subset of the locked contract `canonicalFields`).
- `requiredFieldPaths` (subset of `fieldPaths`).
- `demo` (keys subset of `fieldPaths`, non-empty string values, all deterministic and non-PII; VKS Khu vuc 7 + Thanh pho Ho Chi Minh are the canonical disposable fixtures inherited from the BM-001 / BM-171 baselines).
- `summaryLines` (non-empty, no duplicate labels, references real fields).
- `acceptance` (`requiredText` non-empty + reasonable; `forbiddenText` lists the canonical placeholders).
- `registerFormFlightProfile(BMxxx_FORM_FLIGHT_PROFILE)` self-register call at the bottom of the file.

| Code | Demo coverage | Summary lines | Acceptance contract | Render contract | Registration |
| --- | --- | --- | --- | --- | --- |
| BM-157 | 1/1 required keys filled (VKS fixture) | 3 labels | "BAN KE VAT CHUNG KEM THEO BAN CAO TRANG" + canonical fixture | Form Flight persistent dossier via `/documents/:id` | `form-lifecycle.ts` import #6 (canonical order) |
| BM-181 | 3/3 required keys filled | 3 labels | "QUYET DINH" + VKS + 07/QD-VKSKV7 | Form Flight persistent dossier | Import #10 |
| BM-168 | 14/14 (every canonical field required for this form) | 5 labels | "BIEN BAN", "giao nhan ho so", both signer names, 12/HS-VKS-KV7 | Form Flight persistent dossier | Import #7 |
| BM-136 | 17 fields (5 required, others available for renderer) | 6 labels | "BAN DOI CHAT" + Dieu 178 + Dieu 189 + suspect identity + charge | Form Flight persistent dossier | Import #3 |
| BM-174 | 11/11 (5 required, others required-full-collection) | 5 labels | "YEU CAU" + suspect identity + 08/YC-VKSKV7 + VKS name | Form Flight persistent dossier | Import #8 |
| BM-206 | 15 (5 required) | 5 labels | "LENH BAT CAP TOC" + VKS + 10/LBT-VKSKV7 | Form Flight persistent dossier | Import #11 |
| BM-213 | 28 (4 required) | 5 labels | "BIEN BAN" + "tam giu" + VKS + 12/QD-VKS-KV7 | Form Flight persistent dossier | Import #12 (last in canonical order) |
| BM-156 | 41 (7 required) | 5 labels | "BIEN BAN" + "tin bao" + Nguyen Van A + "Danh bac" + inspector + case ID | Form Flight persistent dossier | Import #5 |
| BM-148 | 30 (5 required) | 5 labels | "BIEN BAN" + "giai trinh" + suspect + 12/QD-VKS-KV7 + 156/HS-VKS-KV7 | Form Flight persistent dossier | Import #4 |

## E. Static results

| Command | Pass | Fail | Skip | Exit |
| --- | ---: | ---: | ---: | ---: |
| `node --test test/runtime-readiness/runtime-readiness-r5-profile-promotion.guard.test.mjs` | 25 | 0 | 0 | 0 |
| `node --test test/runtime-readiness/runtime-readiness-contract.guard.test.mjs` | 13 | 0 | 0 | 0 |
| `node --test test/runtime-readiness/runtime-readiness-pilot-registry.guard.test.mjs` | 8 | 0 | 0 | 0 |
| `node --test test/runtime-readiness/runtime-readiness-cohort-classification.test.mjs` | 8 | 0 | 0 | 0 |
| `node --test apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs` | 22 | 0 | 0 | 0 |
| `node --test apps/web/src/lib/form-flight/profile-registry-guard.test.mjs` | 10 | 0 | 0 | 0 |
| `pnpm --filter @qllaw/form-contracts test` (104 tests, includes `bridge-eligibility`) | 104 | 0 | 0 | 0 |
| `pnpm --filter web exec tsc --noEmit` | n/a | n/a | n/a | 0 |
| `pnpm --filter web lint` | n/a | n/a | n/a | 0 |
| `pnpm audit:hardcode` | passed | 0 | 0 | 0 |
| `pnpm audit:semantic-ui -- --check` | passed (semanticPass=213, runtimeReady 11) | 0 | 0 | 0 |

Total runtime-readiness static guards: **86 / 86 PASS**.

## F. Strict pilot accounting (R4 re-anchored, not re-run)

| Field | Value |
| --- | --- |
| Declared functional tests | 14 |
| Executed functional tests | 14 |
| Clerk setup tests | 2 |
| Total tests | 16 |
| Pass | 16 |
| Fail | 0 |
| Skip | 0 |
| Did-not-run | 0 |
| Exit | `0` |

Per the R5 deadline spec ("R5 execution does not need to repeat a skeleton-profile pre-promotion run") the strict pilot evidence is re-anchored from R4. R5 only touches the Form Flight profile-contract layer.

## G. Per-form gates (R4 strict pilot, re-anchored)

| Code | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | Eligible |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BM-157 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS | YES |
| BM-181 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS | YES |
| BM-168 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | YES |
| BM-136 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | YES |
| BM-174 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | NOT_SUPPORTED | PASS | PASS | YES |
| BM-206 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | YES |
| BM-213 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | YES |
| BM-156 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | YES |
| BM-148 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | YES |

Controls re-validated this execution:

| Code | State |
| --- | --- |
| BM-001 | POSITIVE_CONTROL / ALREADY_RUNTIME_READY (unchanged) |
| BM-171 | POSITIVE_CONTROL / ALREADY_RUNTIME_READY (unchanged) |
| BM-200 | NEGATIVE_CANARY_CONTROL / NOT_PROMOTED / POLICY_EXCLUDED (unchanged) |

## H. DOCX evidence

DOCX evidence is inherited from the R4 strict pilot run. R5 did not regenerate DOCX artifacts (the deadline spec restricts R5 to the Form Flight profile-contract layer). R4 evidence:

- `tests/e2e/runtime-render-docx-bearer-transport.auth.spec.ts` (browser-fetch Transport C proof, all 9 candidates returned a valid DOCX ZIP, no `blockclassifier: PRODUCT_BLOCKED` for the candidates).
- `tests/e2e/runtime-readiness-pilot.auth.spec.ts` (16/16 PASS, R7 resolves all 9 candidates to persisted documents).

## I. Promotion

| Field | Value |
| --- | --- |
| `RUNTIME_READY_BEFORE` | `["BM-001", "BM-171"]` |
| `NEWLY_PROMOTED` | `["BM-157", "BM-181", "BM-168", "BM-136", "BM-174", "BM-206", "BM-213", "BM-156", "BM-148"]` |
| `RUNTIME_READY_AFTER` | `["BM-001", "BM-171", "BM-136", "BM-148", "BM-156", "BM-157", "BM-168", "BM-174", "BM-181", "BM-206", "BM-213"]` |
| `NOT_PROMOTED` | The 202 remaining forms + BM-200 (canary policy) |
| Promotion roster count | `11 / 213` |

## J. Controls

| Code | Status | Notes |
| --- | --- | --- |
| BM-001 | POSITIVE_CONTROL / `ALREADY_RUNTIME_READY` | Re-validated by `form-lifecycle-wiring.guard.test.mjs::#10 + #11`, `profile-registry-guard.test.mjs::#4 + #4b`, `runtime-readiness-pilot-registry.guard.test.mjs::#1` |
| BM-171 | POSITIVE_CONTROL / `ALREADY_RUNTIME_READY` | Same set of guards as BM-001 |
| BM-200 | NEGATIVE_CANARY_CONTROL / `NOT_PROMOTED` / `POLICY_EXCLUDED` | Canary policy preserved. No form-lifecycle.ts side-effect import; audit JSON `runtimeReady` excludes it (`runtime-readiness-r5-profile-promotion.guard.test.mjs::A8`) |

## K. Semantic preservation

| Field | Value |
| --- | --- |
| `total` | `213` |
| `semanticPass` | `213` |
| `semanticIncomplete` | `0` |
| `inputLinkagePass` | `213` |
| `provenanceDuplicateCodes` | `[]` |

Confirmed via `pnpm audit:semantic-ui -- --check` (snapshot `2026-07-23T21:12:17.258Z`). Only `summary.runtimeReady` (the audit readout, NOT semantic acceptance) was updated.

## L. Git / process state

| Field | Value |
| --- | --- |
| HEAD | `b0e43be3fd7831db42a88ad521384e0608ee6a18` (unchanged) |
| branch | `codex/customer-ready-baseline` (unchanged) |
| R5 tracked modified | `apps/web/src/lib/form-flight/form-lifecycle.ts`, `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs`, `apps/web/src/lib/form-flight/profile-registry-guard.test.mjs`, 9 R5 profile files (`bm136.ts`, `bm148.ts`, `bm156.ts`, `bm157.ts`, `bm168.ts`, `bm174.ts`, `bm181.ts`, `bm206.ts`, `bm213.ts`), `packages/form-contracts/src/bridge-eligibility.ts`, `packages/form-contracts/test/bridge-eligibility.test.ts`, `test/runtime-readiness/runtime-readiness-r5-profile-promotion.guard.test.mjs` (new), 3 updated runtime-readiness guard tests, `docs/audit/runtime-readiness/{matrix.latest.json,matrix.latest.md,pilot.latest.md,contract.md}` |
| untracked | `scripts/update-r5-matrix-json.mjs`, `scripts/update-r5-matrix-md.mjs`, `scripts/fix-r5-table-yes.mjs` (R5 helper scripts, execution-owned, NOT committed); `docs/audit/runtime-readiness/_FINAL_REPORT_R5_FORM_FLIGHT_PROMOTION.md` (this file) |
| staged | `0` |
| commit | `NONE` (per deadline-mode hard prohibition) |
| push | `NONE` |

## M. Explicit non-claims

```
RUNTIME_READY_213            = NOT_CLAIMED
DOCX_LEGAL_FIDELITY_213      = NOT_CLAIMED
PDF_FONT_FIDELITY            = NOT_ASSESSED
PRODUCTION_READY_213         = NOT_CLAIMED
```

R5 is a Form Flight promotion contract closure, not a production-wide readiness assessment. 11 / 213 is a precise, evidence-backed count.

## N. Next phase recommendation

After R5 closes, the next safer phases are:

1. **Form Flight cohort 2 (if opened in a future cycle)** - pick 9-18 candidates from the remaining 202 unlocked forms (excluding BM-200). Preferred batch size: **9 candidate-promotions per cycle** to keep the per-cycle static-guard surface bounded. Shared lifecycle evidence (R1..R10 gates, browser-fetch DOCX transport) reuses the same per-candidate test shape as R3/R4/R5; no new contract-work is needed.
2. **Special-form normalisation** (deferred until a cohort is requested): treat BM-130 / BM-175 / BM-191 as special candidates out of band - they have multi-agency / multi-vien co-signature patterns not yet generalized in the Form Flight contract.
3. **Cohort 3 (legal-fidelity upgrade, only if user demands PDF + font claim)**: introduces real layout-fidelity tests. Currently NOT pursued.

This execution does **not** begin any new cohort. R5 success stop condition is met:

```
all nine candidate profiles were evaluated               ✓
complete profile contracts were created for all 9        ✓
side-effect registrations were added                     ✓
R5 promotion guard passes                                ✓ (25/25)
all existing runtime guards pass                          ✓ (61/61 across 5 suites)
semanticPass remains 213 / 213                           ✓
inputLinkagePass remains 213 / 213                       ✓
provenanceDuplicateCodes remains []                      ✓
staged count remains zero                                ✓
TS check (web) exit 0                                    ✓
Web lint exit 0                                          ✓
audit:hardcode exit 0                                    ✓
```

Best-case final claim:

```
RUNTIME_READY = 11/213
NEWLY_PROMOTED = 9
```
