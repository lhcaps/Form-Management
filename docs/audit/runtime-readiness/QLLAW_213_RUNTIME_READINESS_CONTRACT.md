# QLLAW 213 — Runtime-Readiness Contract

> Authoritative gating contract for promoting a BM-XXX code from a
> persisted-draft-bridge / skeleton status to a `runtimeReady` runtime-ready
> status. A promotion is only valid when **every mandatory gate** produces
> reproduced evidence under the rules of this contract.

## 0. Where promotion happens

There are three coordinated runtime-readiness authorities
plus one independent DOCX-render configuration surface:

1. `packages/form-contracts/src/bridge-eligibility.ts` —
   `STANDALONE_RUNTIME_TEMPLATE_CODES` (canonical Form-Flight allowlist)
2. `apps/web/src/lib/form-flight/form-lifecycle.ts` —
   `RUNTIME_READY_FORM_FLIGHT_PROFILES` (re-exports the canonical list, and
   requires side-effect `import * as _runtimeReadyImports from "./profiles/bmXXX"`)
3. `apps/web/src/lib/form-flight/profiles/bmXXX.ts` —
   `BMxxx_FORM_FLIGHT_PROFILE.runtimeReady === true && profileStatus === "runtime-ready"`
4. (Independent) API env `DOCUMENT_RENDERER_CONTRACT_TEMPLATES` — controls the
   **DOCX render path**, not the **runtime readiness** path. A candidate may be
   runtime-ready in (1)+(2)+(3) and still route through the legacy DOCX renderer
   if (4) does not include its code. The contract below treats DOCX as a
   "smoke" check and not as part of the runtime gating.

A promotion **requires coordinated edits** in (1), (2), (3), the
`form-lifecycle-wiring.guard.test.mjs` (lines 320 / 327 hard-coded list), and
`test/forms/semantic-ui-maturity.audit.test.mjs` (line 755). **All edits must
land together as one logical change.**

## 1. Gate reference

| Gate | Mandatory | What counts as evidence | Where the evidence lives |
| --- | --- | --- | --- |
| R1 Template route | YES | Authenticated Playwright `GET /templates/BM-XXX` returns 200, the route shell renders the form (no `/sign-in` redirect), and no document write occurs in network panel. | `tests/e2e/runtime-readiness-pilot.auth.spec.ts` row for `BM-XXX`. |
| R2 Complete field interaction | YES | Each compiled editable field appears exactly once in the rendered DOM, is reachable, accepts a deterministic test token, and is not silently disabled or hidden. | spec per candidate. |
| R3 Canonical document creation | YES | The official UI "create" action triggers **exactly one** POST `/api/v1/documents/draft-from-template` (skeleton path) **or** uses the runtime preview session (BM-001/BM-171 path), returns a real `documentId` / sessionId, and transitions the route to that id. No test-only persistence bypass. | spec request-accounting row. |
| R4 Persistence & hydration | YES | Re-opening the document session (or generated-doc route) shows the user's typed values on the correct fields, no sibling leakage, empty values stay empty, page refresh preserves them. | spec per candidate. |
| R5 Update lifecycle | YES | Editing a deterministic subset, saving through the canonical UI, reloading — updated values persist, untouched values are unchanged, **no duplicate create** during update. | spec per candidate. |
| R6 Preview | YES | Preview opens, reflects persisted values, no stale demo override, no cross-form leakage. | spec per candidate. |
| R7 DOCX generation smoke | YES | Canonical generate action completes, download is non-empty DOCX zip, `word/document.xml` parses, deterministic tokens appear where mapped. (NOT a proof of pagination / legal fidelity / fonts / visual parity.) | spec DOCX smoke row. |
| R8 Optional PDF smoke | NO | If `libreOfficePath` / `soffice` is available, conversion produces a non-empty PDF. Otherwise `PDF_SMOKE = NOT_SUPPORTED`. **Not a runtime blocker** unless the repository explicitly elevates it. | spec per candidate. |
| R9 Isolation | YES | Candidate values do not appear in another form; document IDs are isolated; case context is correct; no shared mutable draft leakage. | spec cross-form leak check. |
| R10 Regression & fail-closed | YES | BM-001 + BM-171 still PASS the existing guards; unsupported forms do not silently bypass the gate; BM-200 stays a skeleton; errors fail closed. | `apps/web/src/lib/form-flight/form-lifecycle-wiring.guard.test.mjs`, `bm001-runtime-ready.guard.test.mjs`, `bm001-smart-runtime-ux.guard.test.mjs`, the new `runtime-readiness-contract.guard.test.mjs`. |

Promotion verdict `(PROMOTION_STATUS)`:

```
APPROVED   only if R1..R10 all PASS (R8 may be NOT_SUPPORTED, never FAIL)
REJECTED   any mandatory gate FAIL or missing evidence
```

## 2. Evidence rules

- Evidence is **observability-grade**: a passing test exit code, a network-call record, a file-system artifact at a documented path, or a measured DOM count.
- "Trust me, the UI looked right" is not evidence.
- Evidence files must live under `tests/e2e/runtime-readiness-pilot.auth.spec.ts` or `test/runtime-readiness/*.guard.test.mjs`. They must be checked into the repo (or referenced by relative path if execution-owned).
- Numbers in the final report must match `verdicts.filter((v) => v.verdict === "PASS").length` and the equivalent for FAIL/SKIP, not narrative prose.

## 3. Anti-patterns the contract forbids

- Bulk-adding codes to `STANDALONE_RUNTIME_TEMPLATE_CODES` without per-code evidence.
- Per-form `if (formCode === "BM-...")` conditionals in **product** code to make a candidate pass. (Permitted only inside test fixtures and only as a defensive, narrowly-scoped label-collection helper.)
- Weakening `isRuntimeReadyProfile` to return `true` for skeletoned profiles.
- Removing BM-200's skeleton flag to inflate the promotion count.
- Editing DOCX templates, compiled contracts, or extract artifacts to massage the readiness verdict.
- Reporting `runtimeReady` numeric totals without a corresponding `RUNTIME_READY_BEFORE / RUNTIME_READY_AFTER / NEWLY_PROMOTED` block.

## 4. Cohort taxonomy (one primary cohort per code, traits allowed to overlap)

```
SIMPLE_SINGLE_SECTION          1 section, ≤ 8 compiled fields, no list/appendix
DENSE_SINGLE_SECTION           1 section, > 8 fields OR with person-identity struct
MULTI_SECTION                  2..4 sections
PERSON_IDENTITY                contains per-person payload (PERSON_LEVEL or SELECTED_PERSONS render_scope)
REPEATED_LINE_RECIPIENTS       ≥ 2 repeated recipient lines (linear, not gridded)
RECORD_OR_MINUTES              procedural record / minutes structure (time, attendees, content)
APPENDIX_OR_LIST               contains a list/appendix payload (auto-numbered, line, or table)
CANARY_OR_SPECIAL              BM-200 + any future code marked canary
UNCLASSIFIED                   anything that does not fit the above
```

A code is **promoted by primary cohort**; evidence within the cohort may be re-used only if the underlying contract structure is genuinely identical.

## 5. Static guard surface (added in this R0/R1 campaign)

```
test/runtime-readiness/runtime-readiness-contract.guard.test.mjs
test/runtime-readiness/runtime-readiness-pilot-registry.guard.test.mjs
test/runtime-readiness/runtime-readiness-cohort-classification.test.mjs
```

The first guard checks the structural invariants of this contract (gate definitions, required evidence, BM-200 policy preservation, evidence-on-promotion rule). The second guard checks the **promotion registry** stays in lock-step with the canonical `STANDALONE_RUNTIME_TEMPLATE_CODES` and `form-lifecycle.ts` imports. The third guard checks the 213-form cohort matrix file.

## 6. Decision rule

Promotion decisions are made **per-candidate**, using the four outcomes
below. They are derived purely from gate evidence — never from a campaign's
desired output count.

```
PROMOTION_APPROVED
  all mandatory static profile gates pass
  AND strict lifecycle R1–R7/R9/R10 passes
  AND post-promotion strict pilot re-run exits 0
  AND all canonical readiness surfaces agree exactly

PROMOTION_PENDING
  profiles / registry / bridge allowlist changed
  AND post-promotion strict lifecycle has not yet run for the new roster
  → no new form is ratified; previously ratified runtime-ready forms remain
    unchanged in their own canonical surfaces until strict pilot runs

PROMOTION_REJECTED
  any mandatory static gate fails
  OR any mandatory strict-pilot gate fails
  → the candidate must be removed from every coordinated readiness surface
    (bridge allowlist, lifecycle side-effect import, profile
    runtimeReady/profileStatus, matrix current readiness, maturity runtime
    readiness, promotion reports)
  → its semantic UI profile is preserved

PROMOTION_ROLLBACK_REQUIRED
  a form was added to canonical runtime-ready surfaces
  AND later fails post-promotion strict validation
  → roll back the same surfaces as PROMOTION_REJECTED
```

Mandatory gate missing or failed:
- no new form is ratified for this cycle,
- previously ratified runtime-ready forms remain unchanged.

This rule is the same for any campaign size. It must not encode a fixed
11-form result, nor any other specific count. The contract describes rules,
not the current campaign's desired output.
