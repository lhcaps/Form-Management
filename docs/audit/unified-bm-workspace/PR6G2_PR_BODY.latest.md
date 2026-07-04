# PR6G.2 — Generic BM Final Audit Harness

## Summary

Implements the generic BM Final Audit Harness (`pnpm audit:bm-final -- BM-XXX`)
producing `docs/audit/bm-final/<TEMPLATE>/final.latest.{json,md}` for any
explicit target. The harness **reuses PR6G.1's `docx-inspection` module** as
its single DOCX parsing source of truth — no mirror, no duplicated
extractor, no drift surface.

## Base / dependency

| field                    | value                                                                                            |
|--------------------------|--------------------------------------------------------------------------------------------------|
| base branch              | `feat/pr6g1-docx-parts-inspection` (PR6G.1, branch split — see `PR6G2_MERGE_PACKET.latest.md`)  |
| rebase target after merge | `main` (after PR6G.1 merges)                                                                    |
| depends on               | **PR6G.1** — `feat/pr6g1-docx-parts-inspection`. PR6G.2 imports `inspectDocxPackage` from there.  |

If PR6G.1 is not yet merged when this PR opens, this PR's
`feat/pr6g2-bm-final-audit-harness` should be treated as a stacked
PR; its PR diff does not include any PR6G.1 commits (verified by
`git diff feat/pr6g1..feat/pr6g2 --stat`).

Reviewer flow:

1. Review + merge PR6G.1 first.
2. Rebase PR6G.2 onto updated `main`.
3. Review + merge PR6G.2.

## PR diff

`git diff feat/pr6g1-docx-parts-inspection..feat/pr6g2-bm-final-audit-harness --stat`

```
 docs/audit/bm-final/BM-001/final.latest.json       |  64 ++
 docs/audit/bm-final/BM-001/final.latest.md         |  69 ++
 .../bm-input-foundation/source-guards.latest.json  | 167 ++++
 docs/audit/sot-gates-v1/latest.json                |   2 +-
 docs/audit/sot-gates-v1/latest.md                  |   2 +-
 .../BM001_FIELD_COVERAGE.latest.json               | 208 +++++
 .../PR6G2_BM_FINAL_AUDIT_HARNESS.latest.md         | 486 +++++++++++
 .../PR6G2_MERGE_PACKET.latest.md                   | 310 +++++++
 .../unified-bm-workspace/PR6G2_PR_BODY.latest.md   | 185 ++++
 package.json                                       |   2 +
 scripts/audit/audit-bm-final.mjs                   | 931 +++++++++++++++++++++
 test/audit-bm-final.spec.mjs                       | 287 +++++++
 12 files changed, 2711 insertions(+), 2 deletions(-)
```

13 PR6G.1 files do not appear in this diff. The single source of truth
for DOCX parsing is owned by PR6G.1.

Note on `docs/audit/sot-gates-v1/latest.{json,md}`: the diff is a
`generated` timestamp refresh only. PR6G.2 doesn't materially change
SOT gates content; this is a working-tree regen artefact captured at
first-commit time. Future re-runs of `pnpm audit:locked-compiled` will
update the timestamp again — that's fine.

## What this PR delivers

1. **Generic harness CLI** (`scripts/audit/audit-bm-final.mjs`).
   Runs as `pnpm audit:bm-final -- BM-XXX` (or positional
   `pnpm audit:bm-final -- BM-001`). Refuses to run without an
   explicit target (exits 2, no artefact written).

2. **JSON + MD artefact pair** under
   `docs/audit/bm-final/<TEMPLATE>/final.latest.{json,md}`.

3. **Three-signal readiness contract** (Planner-required):
   `status` (the BM's audit outcome), `harnessReady` (the generic
   infra ran cleanly), `rolloutReady` (this BM can be a rollout
   baseline). A `MANUAL_REQUIRED` BM is **not** `rolloutReady`.

4. **Single source of truth for DOCX parsing**: imports
   `inspectDocxPackage` from PR6G.1's barrel. No mirror. tsx is the
   runtime that resolves the TypeScript import; `tsx ^4.19.2` was
   already in `apps/api` devDeps so **no new dependency**.

5. **Safety probes** (no fake `generatedDocumentId`, no `/templates`
   DB writes, no demo fallback, no source-guard regression).

## Current BM-001 artefact

```
{
  "status": "MANUAL_REQUIRED",
  "harnessReady": true,
  "rolloutReady": false,
  "docxParts": { "footnotes": "NOT_APPLICABLE_BY_TEMPLATE", ... },
  "fieldCoverage": { "status": "PASS", "totalSlots": 39, "coveredSlots": 39 },
  "style": { "status": "MANUAL_REQUIRED" },
  "safety": { "noFakeGeneratedDocumentId": true, ... },
  "sourceGuardFindings": 22,
  "blockers": [
    "BM-001 visual style sign-off is still pending — see style.findings[] for the item(s) that need Planner eyeball."
  ]
}
```

The blocker is exactly the PR6F-phase-8 pending visual sign-off.
Re-running `pnpm audit:bm-final -- BM-001` after that sign-off
flips `status` to `PASS`, `rolloutReady` to `true`, and empties
`blockers[]`. Until then, BM-171 implementation **cannot start**.

`status` is `MANUAL_REQUIRED`, `harnessReady` is `true`,
`rolloutReady` is `false` — these are the explicit
Planner-required invariants for BM-001 right now.

## Artefacts introduced by this PR (and what they are NOT)

| artefact                                                       | scope                  | notes                                                                                                                          |
|----------------------------------------------------------------|------------------------|--------------------------------------------------------------------------------------------------------------------------------|
| `docs/audit/bm-final/BM-001/final.latest.{json,md}`            | BM-001 only            | The single PR6G.2 artefact. Regenerated by `pnpm audit:bm-final -- BM-001`.                                                   |
| `docs/audit/unified-bm-workspace/BM001_FIELD_COVERAGE.latest.json` | **BM-001 seed only** | Enumerates the 39 `docxSlots` from the locked BM-001 contract. **This is a BM-001-only seed artefact; PR6G.2 does NOT generate field-coverage artefacts for any other BM.** Mass rollout to BM-002..BM-213 is explicitly NOT done by this PR. |
| `docs/audit/bm-input-foundation/source-guards.latest.json`     | PR6F baseline          | First introduced by PR6G.2 round-3 to capture the running source-guards report (22 findings, content-equivalent to PR6F). PR6G.2 doesn't change any source-guards scope; it captures the snapshot at first-commit time. |
| `docs/audit/sot-gates-v1/latest.{json,md}`                     | Repo-wide              | Diff is a `generated` timestamp refresh only. PR6G.2 doesn't materially change SOT gates content. Working-tree regen artefact. |

**No new artefacts are generated for BM-002..BM-213 by this PR.**

## What this PR does NOT do

- ✅ No BM-171 work.
- ✅ No mass rollout to BM-002..BM-213.
- ✅ No locked contract / template mutation.
- ✅ No new npm dependencies.
- ✅ No DB writes from `/templates` flow.
- ✅ No fake `generatedDocumentId` (`status` and `style` always
     report real numbers, or a `no-*-artefact` placeholder
     identifying the missing input).

## Validation (all re-run on round-4 branch state)

| command                                                                            | result                      |
|------------------------------------------------------------------------------------|-----------------------------|
| `pnpm --filter api exec tsx --test ../../test/audit-bm-final.spec.mjs`           | **14/14 pass**              |
| `pnpm audit:bm-final -- BM-001`                                                    | MANUAL_REQUIRED, ready=true, rollout=false |
| `pnpm audit:bm-final -- --bm=ZZ-999`                                               | exit 2, no artefact          |
| `pnpm audit:bm-final` (no args)                                                    | exit 2, no artefact          |
| `pnpm --filter api exec jest --testPathPatterns "docx-inspection/...\|bm001\|footnote\|content\|style"` | 58/58 pass |
| `node scripts/audit/audit-bm-source-guards.mjs`                                    | 22 findings (parity with PR6F) |
| `pnpm audit:hardcode`                                                              | passed                       |
| `pnpm audit:locked-compiled`                                                       | 213/213 consistent           |
| `pnpm audit:contract-sync`                                                         | 213 matched, 0 missing, 0 stale |
| `pnpm --filter web exec tsc --noEmit`                                              | clean                        |
| `pnpm --filter api exec tsc --noEmit`                                              | clean                        |
| `pnpm test:web-unit`                                                               | 422/422 pass                 |

## Pre-existing test infra note (NOT a regression in this PR)

`apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/docx-inspection-rendered-preservation.spec.ts`
imports `../bm001-style-overrides`. That file was always an
untracked scratch file in the PR6F/PR6C working tree. Once the
working tree is clean (which is what PR6G.2's branch split
delivers), the spec's test suite fails to RUN with `Cannot find
module '../bm001-style-overrides'`.

This is a pre-existing PR6G.1 issue inherited by PR6G.2. The
validation table above excludes that one spec via path filter.
The spec itself is in the PR6G.1 commit (not in this PR's diff).
**PR6G.1 should ship a follow-up commit that adds the real
`bm001-style-overrides.ts`** (out of scope for PR6G.2 but worth
flagging in PR6G.1 review).

## Branch / commit summary

PR6G.1 branch (`feat/pr6g1-docx-parts-inspection`):
1 commit `716659ef` "feat(api): DOCX parts inspection reader (PR6G.1)".

PR6G.2 branch (`feat/pr6g2-bm-final-audit-harness`):
5 commits (`fdf8871d`, `65f2c22a`, `bdb9d6eb`, `02ef2f02`, `7efdd27c`,
`b7ad9146` — round-4 docs). See
`docs/audit/unified-bm-workspace/PR6G2_MERGE_PACKET.latest.md` for
full details.

## Out of scope (Planner-locked)

- BM-171 implementation. Locked behind
  `BM-001 final audit = PASS + rolloutReady = true`.
- Mass artifact generation for all 213 BMs. Each BM is its own
  Planner approval.
- `BM_CORE_REGISTRY` side-effects. Untouched.
- Visual sign-off on BM-001 post-processor-rendered DOCX. Already
  covered by `BM001_STYLE_COMPLIANCE.latest.json`. PR6G.2 only
  reports its status, it does not re-confirm it.

## Rollback

```
git revert --no-commit <pr6g2-merge-sha>
```

Or pre-merge:
```
git branch -D feat/pr6g2-bm-final-audit-harness
```

No force-push on shared branches.

## Next work after this PR (NOT BM-171)

1. Merge PR6G.1 first, rebase PR6G.2 onto `main`, merge it.
2. Planner eyeball on BM-001 post-processor-rendered DOCX.
3. Re-run `pnpm audit:bm-final -- BM-001` — `status` flips to
   `PASS`, `rolloutReady` flips to `true`, `blockers[]` empties.
4. THEN PR6G.3 — Generic Mapping Toolkit.
5. BM-171 implementation is **still gated** on
   `BM-001 final audit = PASS + rolloutReady = true`.
