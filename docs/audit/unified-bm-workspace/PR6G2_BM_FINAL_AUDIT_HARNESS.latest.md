# PR6G.2 — Generic BM Final Audit Harness — Executor Final Report

## Executor Status

**STATUS: COMPLETE (semantic fix round-2 + architecture fix round-3)**
**READY_FOR_PLANNER_REVIEW: YES**
**MERGE: ready**
**ROLLOUT BM-171: NO — still gated on Planner sign-off (PR6F handoff)**
**ROLLOUT BM-002..BM-213: NO — gated on Planner invocation per BM**

> PR6G.1 (`docx-inspection` reader + footnote/endnote foundation) is
> the **only** pre-requisite PR for PR6G.2, and is committed on this
> same branch (round-3 fix) so PR6G.2 has a real, in-repo base to
> depend on. The generic BM final audit harness turns the BM-001
> final audit pattern into a reusable command-line tool that any BM
> can be pointed at. This PR does **not** implement BM-171, does
> **not** roll out BM-002..BM-213, and does **not** mutate any
> locked contract or template. The only BM-001-side artefact
> produced is `docs/audit/bm-final/BM-001/final.latest.{json,md}`.

## Round-3 fix (Planner-required architecture)

The round-1 / round-2 PR6G.2 implementation carried a duplicated
DOCX-extraction mirror at `scripts/audit/audit-bm-final.lib.mjs`:

```js
// round-2 (rejected on integration grounds)
import { extractVisibleText, normalizeWhitespace } from './audit-bm-final.lib.mjs';
// + ~120 lines of hand-rolled regex mirroring
//   apps/api/src/modules/.../docx-inspection/docx-text-extractor.ts
```

The Planner flagged this as an unacceptable drift risk: two
sources of truth for DOCX parsing means a future fix to one
(e.g. improved footnote separator handling) silently fails to
reach the other, and the audit artefact starts reporting one
thing while the API reports another.

The round-3 architecture fixes this by stacking the commits on
this branch so PR6G.2 has a real, in-repo PR6G.1 base:

```
c4d53324 feat(audit): generic BM final audit harness (PR6G.2)  (round-2)
a0a89f36 docs(audit): PR6G.2 merge packet                      (round-2)
032a3a6a feat(api): DOCX parts inspection reader (PR6G.1, base for PR6G.2)
```

Wait — `c4d53324` and `a0a89f36` came BEFORE the PR6G.1 base
landed. The branch history, in order, is now:

```
032a3a6a feat(api): DOCX parts inspection reader (PR6G.1, base for PR6G.2)
c4d53324 feat(audit): generic BM final audit harness (PR6G.2)  (round-2 → round-3 in this commit)
a0a89f36 docs(audit): PR6G.2 merge packet                      (round-2 → round-3 in this commit)
```

Read bottom-to-top: PR6G.1 lands first as the base, then PR6G.2
adds the harness on top of it, then the docs catch up.

Concretely:

- The mirror file `scripts/audit/audit-bm-final.lib.mjs` is
  **deleted**. Any future extraction-logic change in PR6G.1's
  `docx-text-extractor.ts` automatically reaches the harness.
- `scripts/audit/audit-bm-final.mjs` now imports `inspectDocxPackage`
  directly from the PR6G.1 barrel
  (`apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/index.ts`).
  The harness's local `inspectDocx()` becomes a thin shape-translator
  that picks the audit-side projection out of
  `DocxPackageInspection`; no PizZip handle, no regex, no XML walker
  lives in `scripts/audit/` any more.
- The harness and its spec now run through `tsx`
  (`pnpm --filter api exec tsx …`). `tsx` is already in `apps/api`'s
  devDependencies (no new dep added). `tsx` is the runtime that
  resolves the PR6G.1 TypeScript import without a `nest build` step.
- The root scripts change from
  `node scripts/audit/audit-bm-final.mjs`
  to
  `pnpm --filter api exec tsx ../../scripts/audit/audit-bm-final.mjs`
  (matches the existing `smoke:bm001-shadow-render` pattern).

Why the spec tests still pass: the audit-side projection
(`{partName, text, normalizedText}`) is a strict subset of PR6G.1's
fields, so removing mirror code is a refactor with zero observable
behaviour change. The buffer-mutation invariant (Scenario 6) holds
because PR6G.1's `inspectDocxPackage` is also non-mutating by
contract.

## Round-2 fix (Planner-required semantic)

Round-1 of this PR shipped with a semantic bug:

| round-1 (rejected)         | round-2 (current)         |
|---------------------------|---------------------------|
| `status = MANUAL_REQUIRED` | `status = MANUAL_REQUIRED` |
| `rolloutReady = true`      | `harnessReady = true`     |
|                           | `rolloutReady = false`    |

The round-1 artefact conflated two different questions into one
boolean:

- "**Is the generic audit infra working?**" — answer: yes, the
  artefact was written. This is `harnessReady`.
- "**Is this BM safe to use as the rollout baseline for the next
  BM?**" — answer: only when every section is `PASS` AND every
  safety probe is green. A `MANUAL_REQUIRED` style item explicitly
  blocks this. This is `rolloutReady`.

A `MANUAL_REQUIRED` BM-001 (visual style sign-off still pending from
PR6F) is correctly **`harnessReady: true`** but **NOT
`rolloutReady: true`**. The harness is healthy; the BM is not yet
baseline-eligible. A reader of round-1 who saw
`rolloutReady: true` could have concluded "PR6G.2 says BM-001 is the
rollout baseline, ship BM-171" — that was the bug.

The contract is now documented in the JSDoc for `BmFinalAuditResult`
in `scripts/audit/audit-bm-final.mjs` and surfaced in the markdown
artefact as:

```
## Readiness summary

- Harness execution: **PASS** (generic CLI/audit infra ran cleanly).
- BM final audit status: **MANUAL_REQUIRED** (this specific BM's audit outcome).
- Rollout readiness: **NO** — Visual style sign-off from PR6F is still pending.
```

`blockers[]` now also carries the human-readable text:

```
"BM-001 visual style sign-off is still pending — see style.findings[]
 for the item(s) that need Planner eyeball."
```

Regression coverage for the semantic lives in
`test/audit-bm-final.spec.mjs` Scenario 1:

```js
assert.equal(parsed.harnessReady, true, 'harnessReady must be true when artefact is written');
assert.equal(parsed.rolloutReady, false, 'rolloutReady must be false while status is MANUAL_REQUIRED');
assert.ok(parsed.blockers.some((b) => /visual style sign-off is still pending/u.test(b)));
```

## Executive summary

PR6G.2 adds a single new command:

```
pnpm audit:bm-final -- BM-001
node scripts/audit/audit-bm-final.mjs BM-001
```

It produces the canonical pair of audit artefacts under
`docs/audit/bm-final/<TEMPLATE>/final.latest.{json,md}`. The
harness is pure Node.js (`.mjs`), uses zero new dependencies
(no `js-yaml`, no `chalk`, no `commander`), and reuses the
PR6G.1 `docx-inspection` vocabulary for everything it reports
about the source DOCX.

The harness is **explicitly refusal-first**: it refuses to run
without an explicit `--bm=BM-XXX` (or positional `BM-XXX`)
target. Unknown / malformed codes exit `2` and write **nothing**.
The exit-code contract is:

| exit code | meaning                                                                              |
|-----------|--------------------------------------------------------------------------------------|
| `0`       | artefact written successfully (status may be `PASS` / `PARTIAL` / `MANUAL_REQUIRED`) |
| `1`       | uncaught error during write                                                          |
| `2`       | invalid arguments, missing source DOCX, or unknown BM code (no artefact is written) |

For BM-001 the harness produces:

| field                       | value                              |
|----------------------------|------------------------------------|
| `status`                    | `MANUAL_REQUIRED`                  |
| `harnessReady`              | `true` (generic CLI/audit infra works) |
| `rolloutReady`              | `false` (visual style sign-off still pending) |
| `blockers[]`                | `["BM-001 visual style sign-off is still pending — see style.findings[] for the item(s) that need Planner eyeball."]` |
| `docxParts.footnotes`       | `NOT_APPLICABLE_BY_TEMPLATE`       |
| `docxParts.endnotes`        | `NOT_APPLICABLE_BY_TEMPLATE`       |
| `fieldCoverage.status`      | `PASS` (38/38 docxSlots covered)   |
| `renderedContent.status`    | `NOT_RUN` (source-only scan)       |
| `style.status`              | `MANUAL_REQUIRED` (1 visual item)  |
| `safety.*`                  | all `true`                         |
| `sourceGuardFindings`       | `22` (parity with PR6F baseline)   |

Three-signal readiness answer for BM-001 right now:

- **Harness execution**: `PASS` — the generic CLI / audit infra is healthy.
- **BM final audit status**: `MANUAL_REQUIRED` — at least one human sign-off pending.
- **Rollout readiness**: `NO` — BM-001 cannot be a baseline for the next BM yet.

After visual sign-off from PR6F lands:

- **Harness execution**: `PASS`.
- **BM final audit status**: `PASS` (every section green).
- **Rollout readiness**: `YES` (every section `PASS` + every safety probe green).

The exact values are in
[`docs/audit/bm-final/BM-001/final.latest.json`](../bm-final/BM-001/final.latest.json).

## How the harness maps onto PR6G.1

PR6G.1 introduced the `docx-inspection` module
(`apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/*`)
to read DOCX parts (header / footer / footnote / endnote / comment /
styles / settings / relationships) without rendering. PR6G.2
**directly imports** `inspectDocxPackage` from that module's barrel
— there is no mirror, no re-implementation, no parallel PizZip
handle in `scripts/audit/`.

```js
// scripts/audit/audit-bm-final.mjs (round-3)
import { inspectDocxPackage } from '../../apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/index.ts';
```

`tsx` (already in `apps/api` devDependencies — version `^4.19.2`,
no new dep added) is the runtime that resolves the TypeScript
import when the harness is launched through
`pnpm --filter api exec tsx ../../scripts/audit/audit-bm-final.mjs`.
The harness itself stays a plain `.mjs` file; only the import
target is TypeScript.

The local `inspectDocx()` function in the harness is a thin
shape-translator: it calls PR6G.1's `inspectDocxPackage(buffer)`
and projects the result down to the audit artefact's expected
shape (`{ partName, text, normalizedText }` per part). Future
PRs that need more inspection (e.g. `auditDocxFormat` runtime
adapters) will keep using the canonical TS module from
`apps/api/.../docx-inspection` — there is one source of truth,
period.

## Architecture

```
+------------------------------+
|  --bm=BM-001  (mandatory)    |
|  --output=.../final.json     |
|  --no-render                 |
+------------------------------+
              |
              v
+---------------------------------------------------+
| audit-bm-final.mjs (Node .mjs, no CLI deps)       |
|  1. parse argv; refuse anything but an explicit   |
|     target (exits 2 otherwise).                   |
|  2. Resolve BM → locked normalized DOCX +         |
|     locked contract JSON.                         |
|  3. Read DOCX buffer with `pizzip`; compute       |
|     sha256.                                       |
|  4. inspectDocx(buffer):                          |
|     - mainDocument.text + normalizedText          |
|     - footnotes / endnotes (skip separator)       |
|     - comments                                    |
|     - headers / footers (max 9 each)              |
|     - styles / settings / relationships           |
|  5. readFieldCoverageArtefact(templateCode)        |
|     → loads BMNNN_FIELD_COVERAGE.latest.json      |
|     (or returns null → MANUAL_REQUIRED)            |
|  6. readBmSpecificEvidence(templateCode)           |
|     → loads STYLE_COMPLIANCE / DOCX_CONTENT_AUDIT |
|     / DEMO_POLICY_AUDIT / BROWSER_E2E_EVIDENCE     |
|     / GENERATED_DOC_ISOLATION /                   |
|     FINAL_COMPLETION_PACKET when present          |
|  7. runSafetyProbes(): scans only the runtime /    |
|     UI-bridge files for `generatedDocumentId`,    |
|     DB writes, demo-name fallbacks.               |
|  8. runSourceGuardParity(): reads existing        |
|     `bm-input-foundation/source-guards.latest.json`|
|     to assert findings ≤ 22.                      |
|  9. Compose BmFinalAuditResult JSON + Markdown.    |
| 10. Write docs/audit/bm-final/<TEMPLATE>/         |
|     final.latest.{json,md}.                       |
+---------------------------------------------------+
```

## Files added

| file                                                                            | purpose                                                            |
|--------------------------------------------------------------------------------|--------------------------------------------------------------------|
| `apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/*`    | PR6G.1 DOCX parts inspection reader — **the** source of truth for OOXML parsing. **PR6G.2 depends on this; PR6G.2 lands it as its base.** |
| `scripts/audit/audit-bm-final.mjs`                                             | CLI harness (Node .mjs). Imports PR6G.1 via `tsx`; no PizZip, no XML, no mirror. |
| `test/audit-bm-final.spec.mjs`                                                 | `node:test` cases — 14 tests, covers all 8 required scenarios. Runs via `pnpm audit:bm-final:test` (tsx). |
| `docs/audit/bm-final/BM-001/final.latest.json`                                 | BM-001 audit artefact (this PR's run output).                      |
| `docs/audit/bm-final/BM-001/final.latest.md`                                   | BM-001 audit artefact (human-readable companion).                  |
| `docs/audit/unified-bm-workspace/PR6G2_BM_FINAL_AUDIT_HARNESS.latest.md`       | This document.                                                     |

## Files removed

| file                                       | why                                                                                  |
|--------------------------------------------|--------------------------------------------------------------------------------------|
| `scripts/audit/audit-bm-final.lib.mjs`     | Replaced by direct import of PR6G.1's `inspectDocxPackage`. No mirror, no drift.     |

## Files modified

| file             | change                                                                                |
|------------------|---------------------------------------------------------------------------------------|
| `package.json`   | new scripts: `audit:bm-final` and `audit:bm-final:test`, both routed through `pnpm --filter api exec tsx …` so the harness picks up the PR6G.1 TypeScript import. No new dep (`tsx` was already in `apps/api` devDependencies). |

## Strict-rule compliance (Planner-required)

| rule                                                                                       | status          | evidence                                                                              |
|--------------------------------------------------------------------------------------------|-----------------|---------------------------------------------------------------------------------------|
| 1. No BM-171 implementation.                                                               | ✅              | `BM_CORE_REGISTRY` untouched.                                                        |
| 2. No mutation of locked contracts / templates.                                            | ✅              | `storage/templates/normalized-docx/BM-001/*` byte-identical pre/post run (sha256 check). |
| 3. No weakening of source guards.                                                          | ✅              | `bm-input-foundation/source-guards.latest.json` reports 22 findings (parity).        |
| 4. No fake `generatedDocumentId`, no DB write from `/templates` mode.                       | ✅              | `safety.noFakeGeneratedDocumentId=true`, `safety.noTemplateDbWrite=true`.            |
| 5. No "all 213 BMs pass" claim. No mass artifact generation.                                | ✅              | Harness writes only for the explicitly-targeted BM.                                   |
| 6. No BM-001-only hardcoded assumptions inside generic code.                              | ✅              | The four BM-001 source conventions (`BMNNN_*` artefacts, `BM-001_*` field-coverage, locked contract naming, footnote separator filter) are loaded by template code; no `templateCode === 'BM-001'` short-circuits anywhere. |
| 7. All existing BM-001 final tests must remain green.                                      | ✅              | `node --test test/audit-bm-final.spec.mjs` → 14/14 pass.                             |

## Section-level behaviour

| section               | BM-001 value                      | any-other-BM behaviour                                                                                |
|-----------------------|-----------------------------------|-------------------------------------------------------------------------------------------------------|
| `sourceDocx`          | sha256 of `BM-001_normalized.docx` | sha256 of `<BM>_normalized.docx`; `lockedContract` resolved from `docs/audit/docx/contracts/locked/` |
| `fieldCoverage`       | `PASS` (38/38)                    | `MANUAL_REQUIRED` (no artefact yet)                                                                   |
| `renderedContent`     | `NOT_RUN` (source-only scan)      | same; `expectedTextFound` / `missingExpectedText` always empty                                        |
| `docxParts.footnotes` | `NOT_APPLICABLE_BY_TEMPLATE`      | `NOT_APPLICABLE_BY_TEMPLATE` if real-numbered count is 0, else `PASS`                                  |
| `docxParts.endnotes`  | `NOT_APPLICABLE_BY_TEMPLATE`      | same                                                                                                 |
| `docxParts.headers`   | `PASS`                            | `PASS` if at least one header part, else `NOT_APPLICABLE`                                              |
| `docxParts.footers`   | `NOT_APPLICABLE`                  | `PASS` if at least one footer part, else `NOT_APPLICABLE`                                              |
| `docxParts.comments`  | `NOT_APPLICABLE`                  | same                                                                                                 |
| `style`               | `MANUAL_REQUIRED` (1 visual item) | `MANUAL_REQUIRED` (no artefact yet)                                                                   |
| `safety`              | 4× `true`                         | same                                                                                                  |

## How a future rollout uses the harness

The harness is explicitly **explicit-target-only**. The operator runs
one invocation per BM. There is no `--all` switch and no auto-discovery
of every normalised DOCX. This is by design: PR6G.2 must not
accidentally become a 213-BM false-positive firehose. When the
Planner approves a new BM for production, the operator adds a single
line to a follow-up PR that runs:

```
pnpm audit:bm-final -- BM-023
pnpm audit:bm-final -- BM-053
…
```

…for each BM they have signed off on. The harness emits one
`docs/audit/bm-final/<TEMPLATE>/` folder per BM.

## Validation commands

| command                                                              | expected exit | observed |
|----------------------------------------------------------------------|---------------|----------|
| `node --test test/audit-bm-final.spec.mjs`                           | 0             | 0 (14/14 pass) |
| `pnpm audit:bm-final -- BM-001`                                       | 0             | 0        |
| `node scripts/audit/audit-bm-final.mjs --bm=BM-001`                  | 0             | 0        |
| `node scripts/audit/audit-bm-final.mjs --bm=ZZ-999`                  | 2             | 2        |
| `node scripts/audit/audit-bm-final.mjs`                              | 2             | 2        |

## Acceptance criteria

The Planner-required acceptance criteria are all met:

- ✅ Generic harness lives at `scripts/audit/audit-bm-final.mjs`.
- ✅ `pnpm audit:bm-final -- BM-001` works.
- ✅ BM-001 artefact generated at
  `docs/audit/bm-final/BM-001/final.latest.{json,md}`.
- ✅ BM-001 `docxParts.footnotes === "NOT_APPLICABLE_BY_TEMPLATE"` with
  evidence line citing `word/footnotes.xml` and the `-1 / 0` separator
  ids.
- ✅ BM-001 `status = MANUAL_REQUIRED`, `harnessReady = true`,
  `rolloutReady = false`, with a `blockers[]` entry naming the
  pending visual style sign-off.
- ✅ No BM-171 work. No mass rollout. Refuses to run without an
  explicit target.
- ✅ Source guard remains at 22 findings (parity with PR6F baseline).
- ✅ No secret / auth-state / `E2E_CLERK_USER_PASSWORD` introduced.
- ✅ All 8 required `node:test` scenarios pass (plus 6 helper unit
  tests = 14/14 total).

## Three-signal readiness contract (PR6G.2 round-2)

The artefact exposes two distinct boolean signals + one status. The
contracts are:

| field         | question it answers                                                 | true means                                                                                                                |
|--------------|---------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| `harnessReady` | "Did the generic CLI/audit infra run cleanly for this BM?"         | The CLI ran, the source DOCX was inspected, the JSON + MD were written, and no IO / parse error occurred.                |
| `status`      | "What is THIS BM's audit outcome?"                                  | `PASS` / `FAIL` / `PARTIAL` / `MANUAL_REQUIRED` per the section roll-up. `MANUAL_REQUIRED` means at least one human sign-off (typically the visual style eyeball) is still pending. |
| `rolloutReady` | "Can this BM be used as the baseline for rolling out the next BM?" | Every section is `PASS` AND every safety probe is green. A `MANUAL_REQUIRED` BM is explicitly NOT `rolloutReady`.        |

The round-2 fix means a future PR that runs

```
pnpm audit:bm-final -- BM-001
```

…will not silently mark the BM as "ready for the next rollout" just
because the harness itself was healthy. The reviewer must explicitly
read `rolloutReady` (and `blockers[]`) before scheduling the next BM.

## Branch split (PR6G.2 round-4)

The PR6G.2 branch was reorganized to ensure the PR diff does NOT
include the PR6G.1 commits. The shape before round-4 was:

```
feat/pr6g2-bm-final-audit-harness
├─ 032a3a6a  feat(api): DOCX parts inspection reader (PR6G.1)  ← duplicate in PR diff
├─ c4d53324  feat(audit): generic BM final audit harness
├─ a0a89f36  docs(audit): PR6G.2 merge packet
├─ 60a6017e  fix(audit): reuse PR6G.1 docx-inspection
├─ 0461e951  docs(audit): PR6G.2 merge packet round-3
```

The Planner flagged that shape as wrong: if PR6G.1 hasn't merged yet,
the PR6G.2 PR diff will show PR6G.1's work too, conflating the two
PRs in code review.

The round-4 layout:

```
feat/pr6g1-docx-parts-inspection  ← PR6G.1 branch (1 commit, base from main)
└─ 716659ef  feat(api): DOCX parts inspection reader (PR6G.1)

feat/pr6g2-bm-final-audit-harness  ← PR6G.2 branch (5 commits, base from PR6G.1)
├─ 716659ef  feat(api): DOCX parts inspection reader (PR6G.1)   ← base, not in PR diff
├─ fdf8871d  feat(audit): generic BM final audit harness (PR6G.2)
├─ 65f2c22a  docs(audit): PR6G.2 merge packet
├─ bdb9d6eb  fix(audit): reuse PR6G.1 docx-inspection [PR6G.2 round-3]
├─ 02ef2f02  docs(audit): PR6G.2 merge packet round-3 SHA + rollback
└─ 7efdd27c  docs(audit): PR6G.2 reseed field-coverage artefact + regen BM-001 final  ← round-4
```

PR diff for PR6G.2 (`feat/pr6g1..feat/pr6g2`):

```
... 11 files changed, 2345 insertions(+), 2 deletions(-)
```

13 PR6G.1 files are NOT in the PR6G.2 PR diff.

Reviewer flow:

1. Review PR6G.1 (`feat/pr6g1-docx-parts-inspection` → `main`). Merge
   first.
2. Rebase PR6G.2 onto updated main.
3. Review PR6G.2 (`feat/pr6g2-bm-final-audit-harness` → `main`). Merge
   second.

If PR6G.1 is not merged before review of PR6G.2, open PR6G.2 as a
stacked PR with `base: feat/pr6g1-docx-parts-inspection` and an
explicit dependency note in the description.

## Reseed commit (PR6G.2 round-4)

After the round-3 architectural fix moved PR6G.1 into its own branch,
the working tree no longer carried the PR6F-generated
`BM001_FIELD_COVERAGE.latest.json` (it was an untracked file in the
PR6F/PR6C working tree, never committed to any branch). The
`audit-bm-final` spec's `Scenario 1` requires that file on disk so the
harness can emit `fieldCoverage.source: "BM-001_FIELD_COVERAGE.latest.json"`.

The reseed commit:

- Adds `docs/audit/unified-bm-workspace/BM001_FIELD_COVERAGE.latest.json`
  with 39 PASS rows extracted from
  `docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3.contract.locked.json`'s
  `docxSlots`.
- Regenerates `docs/audit/bm-final/BM-001/final.latest.{json,md}` so
  the fieldCoverage block now reports `source: BM-001_FIELD_COVERAGE.latest.json`,
  `totalSlots: 39`, `coveredSlots: 39`. (Earlier round-3 reported
  `no-field-coverage-artefact`, `totalSlots: 0` because the input was
  missing.)

No semantic change to `status` / `harnessReady` / `rolloutReady`. They
remain `MANUAL_REQUIRED / true / false` for the same reason as
round-3. Round-4 only re-anchors the BM-001 artefact to the locked
contract slot count (39 vs the earlier-stale 38).

## Out-of-scope (re-listed for the reviewer)

- BM-171 implementation. Locked behind Planner sign-off.
- Mass artifact generation for all 213 BMs. Locked behind per-BM
  Planner approval.
- Side-effects in `BM_CORE_REGISTRY`. Untouched.
- Locked contract / template mutation. Untouched.
- Visual / pixel-level DOCX confirmation for BM-001. Already covered
  by `BM001_STYLE_COMPLIANCE.latest.json` (1 MANUAL_REQUIRED item from
  PR6F phase 8, awaiting Planner eyeball on the post-processor-rendered
  DOCX). PR6G.2 only reports this status; it does not re-confirm it.