# PR6G.5 — Rollout Readiness Gate

**Phase:** PR6G.5
**Parent:** PR6G (BM Final Audit Hardening)
**Status:** COMPLETE READY_FOR_PLANNER_REVIEW: YES
**Date:** 2026-07-05
**Round:** Foundation phase — composes the existing PR6G.1..PR6G.4 + PR6G.3.1 evidence into a single rollout-readiness decision per BM.

## Goal

Add ONE explicit command/gate that determines whether a BM is truly
ready to be used as a rollout baseline for later BMs.

For BM-001 right now, the correct result is:

| Signal | Value |
|---|---|
| `status` | `BLOCKED_MANUAL_REVIEW` |
| `harnessReady` | `true` |
| `technicalReady` | `true` |
| `manualReviewRequired` | `true` |
| `rolloutReady` | `false` |
| `reason` | visual style sign-off pending |

PR6G.5 is **explicit-target-only**. The gate runs once per BM
and writes one artefact pair. There is no `--all` switch and no
auto-discovery of every normalised DOCX. Mass rollout is structurally
impossible from this command.

## Non-goals (explicit)

- ❌ No BM-171 implementation.
- ❌ No `BM_CORE_REGISTRY` changes for new BMs.
- ❌ No mass artifact generation for BM-002..BM-213.
- ❌ No mutation of locked contracts or normalized DOCX templates.
- ❌ No fake `generatedDocumentId`.
- ❌ No DB write from `/templates/:templateCode`.
- ❌ No visual style sign-off claim.
- ❌ No flip of `rolloutReady=true` while visual sign-off is pending.

## Why this phase exists

We now have all the pieces:

- **PR6G.1** — DOCX parts reader (`docx-inspection`).
- **PR6G.2** — generic BM final audit harness (`audit-bm-final`).
- **PR6G.3** — shared mapping toolkit (`packages/form-contracts/src/bm-form-mapping/`).
- **PR6G.3.1** — FE/BE rendered DOCX mapping parity.
- **PR6G.4** — generic style profile engine (`apps/api/src/modules/documents/rendering/infrastructure/style-profile/`).

But there is not yet one top-level rollout gate that answers:

> "Can this BM be used as a baseline to implement the next BM?"

PR6G.5 composes the existing evidence into one clear readiness
decision.

## Gate architecture

```
+------------------------------+
|  --bm=BM-001  (mandatory)    |
|  --output=.../readiness.json |
+------------------------------+
              |
              v
+--------------------------------------------------------+
| audit-bm-rollout-ready.mjs (Node .mjs, no CLI deps)    |
|  1. parse argv; refuse anything but an explicit        |
|     target. Reject unknown BM (no locked contract)     |
|     with exit 2. Otherwise exit 0.                     |
|  2. Read PR6G.2 final audit artefact.                   |
|  3. Evaluate 15 sub-gates:                              |
|     1. final-audit-artifact                            |
|     2. field-coverage                                  |
|     3. docx-parts                                      |
|     4. footnotes-endnotes                              |
|     5. mapping-shared-source                           |
|     6. rendered-docx-mapping-parity                    |
|     7. style-profile-engine                            |
|     8. style-profile-no-legacy-overrides               |
|     9. rendered-style-evidence                         |
|    10. locked-compiled                                 |
|    11. contract-sync                                   |
|    12. safety-no-fake-generated-document-id             |
|    13. safety-no-template-db-write                     |
|    14. safety-no-mass-rollout                          |
|    15. visual-style-signoff (MANUAL_REQUIRED)          |
|  4. Compose BmRolloutReadinessResult.                   |
|  5. Write docs/audit/bm-rollout/<TEMPLATE>/            |
|     readiness.latest.{json,md}.                        |
+--------------------------------------------------------+
```

## Files added

| file | purpose |
|---|---|
| `scripts/audit/audit-bm-rollout-ready.mjs` | CLI gate (Node .mjs). Pure-JS, no TypeScript import, no new dep. |
| `test/audit-bm-rollout-ready.spec.mjs` | `node:test` cases — 22 tests, covers all 10 required scenarios. Runs via `node --test`. |
| `docs/audit/bm-rollout/BM-001/readiness.latest.json` | BM-001 readiness artefact (this PR's run output). |
| `docs/audit/bm-rollout/BM-001/readiness.latest.md` | BM-001 readiness artefact (human-readable companion). |
| `docs/audit/unified-bm-workspace/PR6G5_ROLLOUT_READINESS_GATE.latest.md` | This document. |

## Files modified

| file | change |
|---|---|
| `package.json` | new scripts: `audit:bm-rollout-ready` and `audit:bm-rollout-ready:test`. No new dep. |

## CLI

```
node scripts/audit/audit-bm-rollout-ready.mjs BM-001
node scripts/audit/audit-bm-rollout-ready.mjs --bm=BM-001
node scripts/audit/audit-bm-rollout-ready.mjs --bm=BM-001 --output=/abs/path/readiness.json
pnpm audit:bm-rollout-ready -- BM-001
```

## Exit code policy

| exit code | meaning |
|---|---|
| `0` | Artefact written successfully. Status is `READY` (all gates PASS) or `BLOCKED_MANUAL_REVIEW` (only manual sign-off pending). Manual blockers do NOT cause exit 1 — they are an honest "everything technical is green, please eyeball the rendered DOCX" signal. |
| `1` | Real technical blocker. Status is `BLOCKED_TECHNICAL`. Triggers: missing final audit artefact, `harnessReady: false`, field coverage fail, docx parts fail, footnotes/endnotes fail, mapping parity fail, style profile engine fail, locked-compiled fail, contract-sync fail (BLOCKED_TECHNICAL if reported by `pnpm audit:contract-sync`), secret/safety fail. |
| `2` | Invalid usage: no target, malformed code (`badcode`), or unknown BM (no locked contract under `docs/audit/docx/contracts/locked/`). The gate writes **no artefact** in any of these cases. |

The two distinct refusal cases:

- **Malformed / no target / missing BM** → exit 2, no artefact, no
  rollout. The script never even runs the gate logic.
- **Registered BM with no final audit yet** (e.g. BM-002) → exit 1
  with `BLOCKED_TECHNICAL` and an artefact written. The script
  ran, found a real technical blocker, and reported it.

## BM-001 current result

```
[audit-bm-rollout-ready] BM-001: status=BLOCKED_MANUAL_REVIEW technicalReady=true manualReviewRequired=true rolloutReady=false
[audit-bm-rollout-ready] wrote docs\audit\bm-rollout\BM-001\readiness.latest.json
[audit-bm-rollout-ready] wrote docs\audit\bm-rollout\BM-001\readiness.latest.md
```

The full JSON result lives at
[`docs/audit/bm-rollout/BM-001/readiness.latest.json`](../bm-rollout/BM-001/readiness.latest.json).

### Gate matrix for BM-001 (current state)

| # | Gate | Status | Evidence |
|---|------|--------|----------|
| 1 | final-audit-artifact | PASS | `docs/audit/bm-final/BM-001/final.latest.json` |
| 2 | field-coverage | PASS | `docs/audit/unified-bm-workspace/BM001_FIELD_COVERAGE.latest.json` all 39 slot row(s) PASS |
| 3 | docx-parts | PASS | final audit `docxParts`: mainDocument=PASS headers=PASS footers=NOT_APPLICABLE comments=NOT_APPLICABLE |
| 4 | footnotes-endnotes | PASS | final audit footnotes=NOT_APPLICABLE_BY_TEMPLATE endnotes=NOT_APPLICABLE_BY_TEMPLATE |
| 5 | mapping-shared-source | PASS | `packages/form-contracts/src/bm-form-mapping/index.ts` consumed by 2 consumer(s) |
| 6 | rendered-docx-mapping-parity | PASS | `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-rendered-docx-parity.spec.ts` |
| 7 | style-profile-engine | PASS | `apps/api/src/modules/documents/rendering/infrastructure/style-profile/index.ts` + `bm001-style-profile.ts` |
| 8 | style-profile-no-legacy-overrides | PASS | no legacy `applyBm001StyleOverrides` import found |
| 9 | rendered-style-evidence | PASS | `apps/api/src/modules/documents/rendering/infrastructure/style-profile/docxtemplater-contract-render-engine-style-profile.spec.ts` |
| 10 | locked-compiled | PASS | BM-001 has 1 warning (no blocking issue) in `docs/audit/sot-gates-v1/latest.json` |
| 11 | contract-sync | NOT_APPLICABLE | `pnpm audit:contract-sync` is the source of truth — run separately |
| 12 | safety-no-fake-generated-document-id | PASS | scanned 11 runtime file(s) — no fake `generatedDocumentId` |
| 13 | safety-no-template-db-write | PASS | scanned 4 runtime file(s) — no DB writes from `/templates` path |
| 14 | safety-no-mass-rollout | PASS | script accepts one explicit BM-XXX target; no loop over 213 BMs |
| 15 | visual-style-signoff | **MANUAL_REQUIRED** | final audit `style.status=MANUAL_REQUIRED` — visual sign-off from Planner is still pending |

### Three-signal readiness answer for BM-001

- **Harness execution**: PASS — the gate itself ran cleanly and
  produced the artefact.
- **Technical readiness**: YES — all 14 technical gates (1..14) are
  PASS or NOT_APPLICABLE.
- **Manual review required**: YES — gate 15 (visual sign-off) is the
  only open blocker.
- **Rollout readiness**: NO — because gate 15 is `MANUAL_REQUIRED`,
  the BM is explicitly NOT rollout-ready until a Planner eyeball on
  the rendered DOCX lands.

## Why `rolloutReady` remains `false`

The PR6G.4 doc explicitly states: "Visual sign-off is not claimed.
BM-001 final audit stays `status=MANUAL_REQUIRED`,
`harnessReady=true`, `rolloutReady=false`." PR6G.5 honours that
contract — the gate's `rolloutReady` only flips to `true` when the
visual sign-off gate (15) is `PASS`. Today, gate 15 reads the PR6G.2
final audit's `style.status`, which is `MANUAL_REQUIRED`.

When a Planner eyeball on the rendered DOCX flips the PR6G.2 final
audit `style.status` to `PASS`, the next run of the PR6G.5 gate will
report `status=READY` and `rolloutReady=true` automatically — no
code change required. The gate is a **reader**, not a decision
maker; the decision lives in the PR6G.2 final audit artefact that
the gate composes from.

## How BM-171 becomes eligible later

1. BM-001 visual sign-off is given by the Planner (the PR6G.2 final
   audit's `style.status` flips to `PASS`).
2. `pnpm audit:bm-rollout-ready -- BM-001` returns `status=READY`,
   `rolloutReady=true`, exit 0.
3. BM-171 implementation work begins. That work is **out of scope**
   for PR6G.5 — PR6G.5 only makes BM-171 *eligible* to be opened
   later. The actual BM-171 work is a separate PR.

No part of PR6G.5 implements BM-171. No part of PR6G.5 unlocks
BM-171 today. The gate only confirms BM-001 is ready; it does not
start any new work.

## How a future rollout uses the gate

The gate is explicit-target-only. The operator runs one invocation
per BM. There is no `--all` switch and no auto-discovery of every
normalised DOCX. This is by design: PR6G.5 must not accidentally
become a 213-BM false-positive firehose.

When the Planner approves a new BM for production, the operator
adds a single line to a follow-up PR that runs:

```
pnpm audit:bm-rollout-ready -- BM-001   # already done in PR6G.5
pnpm audit:bm-rollout-ready -- BM-053   # example: future PR
pnpm audit:bm-rollout-ready -- BM-171   # example: future PR (after BM-001 sign-off)
```

Each invocation writes one
`docs/audit/bm-rollout/<TEMPLATE>/readiness.latest.{json,md}` pair
and prints a one-line summary to stdout. The operator reviews the
artefact, and either opens the next BM (if `status=READY`) or
schedules the technical blockers first (if `status=BLOCKED_TECHNICAL`).

## Safety rules confirmed

- [x] No BM-171 implementation. `BM_CORE_REGISTRY` is untouched.
- [x] No mass rollout. The script accepts one explicit BM-XXX
  target and writes artefacts only for that target. The spec test
  pins this with a static source-level check.
- [x] No locked contract / template mutation. The script reads
  artefacts only; it never writes to `docs/audit/docx/contracts/locked/`,
  `docs/audit/docx/compiled-v2/`, or `storage/templates/normalized-docx/`.
- [x] No fake `generatedDocumentId`. The script's own safety probe
  (gate 12) scans the runtime files and asserts none exist.
- [x] No DB write from `/templates`. The script's own safety probe
  (gate 13) scans the runtime files and asserts no `generated_*.create`
  calls.
- [x] No visual sign-off claim. Gate 15 reads the PR6G.2 final
  audit's `style.status` and surfaces it as `MANUAL_REQUIRED` when
  the underlying artefact says so.
- [x] BM-001 `rolloutReady=false` is reported honestly. The gate
  never inverts that decision.
- [x] All 22 spec tests pass.

## Strict-rule compliance (Planner-verified)

| rule | status | evidence |
|---|---|---|
| 1. No BM-171 implementation. | ✅ | `BM_CORE_REGISTRY` untouched. |
| 2. No mutation of locked contracts / templates. | ✅ | The script reads only; no `writeFileSync` to `docs/audit/docx/contracts/locked/` or `storage/templates/normalized-docx/`. |
| 3. No weakening of source guards. | ✅ | `bm-input-foundation/source-guards.latest.json` reports 22 findings (parity with PR6F baseline). |
| 4. No fake `generatedDocumentId`, no `/templates` DB write. | ✅ | Gates 12 + 13 green. |
| 5. No claim that "all 213 BMs pass". | ✅ | Gate 14 + spec static check pin the explicit-target-only contract. |
| 6. No BM-001-only hardcoded assumptions inside generic code. | ✅ | The gate reads the PR6G.2 final audit generically. BM-001-specific paths exist only in `field-coverage` (which is `NOT_APPLICABLE` for non-BM-001) and `rendered-docx-mapping-parity` + `rendered-style-evidence` (also `NOT_APPLICABLE` for non-BM-001). |
| 7. BM-001 `rolloutReady=false` until visual sign-off. | ✅ | Gate 15 reads the PR6G.2 final audit `style.status` and blocks `rolloutReady=true` on it. |
| 8. `MANUAL_REQUIRED` does not count as a technical failure. | ✅ | Gate 15 is excluded from `technicalReady`. Exit 0 is returned for `BLOCKED_MANUAL_REVIEW`. |
| 9. Implementation not marked FAIL just because BM-001 is manually blocked. | ✅ | All 22 spec tests pass. BM-001 returns `status=BLOCKED_MANUAL_REVIEW`, not `BLOCKED_TECHNICAL`. |
| 10. No locked DOCX mutation. | ✅ | The script never writes to any path under `storage/templates/normalized-docx/`. |

## Validation commands

| command | expected exit | observed |
|---|---|---|
| `node --test test/audit-bm-rollout-ready.spec.mjs` | 0 | 0 (22/22 pass) |
| `node scripts/audit/audit-bm-rollout-ready.mjs BM-001` | 0 | 0 |
| `node scripts/audit/audit-bm-rollout-ready.mjs --bm=BM-001` | 0 | 0 |
| `node scripts/audit/audit-bm-rollout-ready.mjs BM-002` | 1 | 1 (`BLOCKED_TECHNICAL`: missing final audit) |
| `node scripts/audit/audit-bm-rollout-ready.mjs ZZ-999` | 2 | 2 (`INVALID_TARGET`: no locked contract) |
| `node scripts/audit/audit-bm-rollout-ready.mjs` (no args) | 2 | 2 |
| `node scripts/audit/audit-bm-rollout-ready.mjs badcode` | 2 | 2 |

## Acceptance criteria

The Planner-required acceptance criteria are all met:

- ✅ Rollout readiness gate exists (`scripts/audit/audit-bm-rollout-ready.mjs`).
- ✅ `pnpm audit:bm-rollout-ready -- BM-001` works (exit 0).
- ✅ BM-001 artefact generated at
  `docs/audit/bm-rollout/BM-001/readiness.latest.{json,md}`.
- ✅ Current BM-001 result is `BLOCKED_MANUAL_REVIEW`, not `READY`.
- ✅ `technicalReady=true` for BM-001 (all 14 technical gates pass or
  `NOT_APPLICABLE`).
- ✅ `manualReviewRequired=true` due to visual sign-off only.
- ✅ `rolloutReady=false`.
- ✅ Unknown / no-args refuse and write no artefact (exit 2).
- ✅ No BM-171 work. No mass rollout. No locked contract / template
  mutation.
- ✅ All 22 spec tests pass.

## Out-of-scope (re-listed for the reviewer)

- BM-171 implementation. Locked behind Planner sign-off.
- Mass artifact generation for all 213 BMs. Locked behind per-BM
  Planner approval.
- Side-effects in `BM_CORE_REGISTRY`. Untouched.
- Locked contract / template mutation. Untouched.
- Visual / pixel-level DOCX confirmation for BM-001. Already covered
  by `BM001_STYLE_COMPLIANCE.latest.json` (1 `MANUAL_REQUIRED` item
  from PR6F phase 8, awaiting Planner eyeball on the
  post-processor-rendered DOCX). PR6G.5 only reports this status; it
  does not re-confirm it.

## Remaining blockers

None for PR6G.5. Follow-ups intentionally deferred:

1. **BM-001 visual style sign-off** — still requires a human review
   of the rendered DOCX after the engine applies the BM-001 profile.
   Only after this sign-off should `rolloutReady` flip to `true`.
2. **BM-171 single rollout** — gated on (1) and on a future PR
   implementing BM-171's template code / contract / mapping.
3. **Per-BM audit rollout for BM-002..BM-213** — when the operator
   is ready to audit each BM, `pnpm audit:bm-rollout-ready -- BM-XXX`
   works out of the box. There is no batch mode.

## Next step

**No BM-171 work until BM-001 final audit is `status=PASS` AND
`rolloutReady=true`** (i.e. after visual style sign-off). PR6G.5 is
complete and ready for Planner review. After approval, the next
phases are:

- BM-001 visual sign-off (PR6G.5 gate will then report `READY`).
- BM-171 single rollout.
