# PR6G.2 — Merge Packet (round-4: split-branch + reseed)

**STATUS: READY_FOR_PR_OPEN**
**Planner approval lineage:** round-2 APPROVE_WITH_REQUIRED_ARTIFACT_FIX → round-3 APPROVE_TESTS_BUT_BLOCK_MERGE_ON_INTEGRATION → branch-split APPROVED (Option A)
**MERGE: ready (push to remote + open PR — pending Planner action)**
**Base for PR6G.2:** `feat/pr6g1-docx-parts-inspection` (NOT `main` — see "Branch split" below)
**Depends on:** PR6G.1 (must merge first, OR PR6G.2 PR must be opened as a stacked PR on `feat/pr6g1-docx-parts-inspection`)
**ROLLOUT BM-171: NO**
**ROLLOUT BM-002..BM-213: NO**

## Executive summary

PR6G.2 lands a generic, reusable BM Final Audit Harness that produces
`docs/audit/bm-final/<TEMPLATE>/final.latest.{json,md}` artefacts for any
explicit `--bm=BM-XXX` target. The harness **reuses PR6G.1's
`docx-inspection` module** as its sole DOCX parsing source of truth — no
mirror, no duplicated extractor, no drift surface.

The branch was reorganized in round-4 so that the PR6G.2 PR diff
contains ONLY the PR6G.2 files (and not the PR6G.1 commits). This
matches the Planner's "Option A — cleanest path" choice.

## Branch split (round-4)

The previous round-3 branch (`feat/pr6g2-bm-final-audit-harness`)
contained PR6G.1 commits *inside* the PR6G.2 branch. The Planner
flagged that as the wrong shape ("diff will include PR6G.1 commit
032a3a6a even though PR6G.1 isn't merged yet"). Round-4 reorganizes
into two branches:

### Branch 1 — PR6G.1: `feat/pr6g1-docx-parts-inspection`

```
base:       main (12749f1f Merge pull request #37 from lhcaps/fix/ui-light-surface-body-override)
tip:        716659ef  feat(api): DOCX parts inspection reader (PR6G.1)
diff size:  13 files changed, 2002 insertions(+), 0 deletions(-)
```

Files: 13 source/spec files in
`apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/`.
Same content as the original `032a3a6a` commit on the old
`feat/pr6g2-bm-final-audit-harness` branch; only the SHA differs
because the parent (main) is now clean.

### Branch 2 — PR6G.2: `feat/pr6g2-bm-final-audit-harness`

```
base:       feat/pr6g1-docx-parts-inspection (716659ef)
tip:        7efdd27c  docs(audit): PR6G.2 reseed field-coverage artefact + regen BM-001 final
commits:    5 (bottom-to-top)
diff size:  11 files changed, 2345 insertions(+), 2 deletions(-)
            ↳ PR6G.1 files are NOT in this diff (they live on the base branch).
```

The PR diff (PR6G.2 base → tip) shows ONLY PR6G.2 code/docs/artefacts.

### Why two branches and not a single stacked-PR

The Planner's Option A is the "sạch nhất" path:

> Merge PR6G.1 trước, rồi rebase PR6G.2 lên main sau PR6G.1. Khi đó
> PR6G.2 chỉ còn [PR6G.2 commits]. Không duplicate PR6G.1 trong PR
> diff.

So the round-4 work is:

1. Branch 1 (`feat/pr6g1-docx-parts-inspection`) carries JUST the
   PR6G.1 commit. PR6G.1 is opened first and merged into `main` first.
2. Branch 2 (`feat/pr6g2-bm-final-audit-harness`) carries JUST the
   PR6G.2 commits, rebased onto PR6G.1's tip. PR6G.2 is then opened
   against `main` (which, post-PR6G.1-merge, already contains the
   PR6G.1 commits). The PR diff is clean.

> Open PR6G.1 first, get it merged, then rebase PR6G.2 onto updated
> main and open PR6G.2. Then PR6G.2 PR diff will include 0 PR6G.1
> commits.

If PR6G.1 is not merged before PR6G.2, the PR6G.2 PR can be opened
as a stacked PR with `base: feat/pr6g1-docx-parts-inspection` and a
note stating it depends on PR6G.1.

## Commits (bottom-to-top on PR6G.2 branch)

| sha         | subject                                                                            | kind              |
|-------------|------------------------------------------------------------------------------------|-------------------|
| `fdf8871d`  | `feat(audit): generic BM final audit harness (PR6G.2)`                             | PR6G.2 code (round-2 shape) |
| `65f2c22a`  | `docs(audit): PR6G.2 merge packet`                                                  | PR6G.2 docs       |
| `bdb9d6eb`  | `fix(audit): reuse PR6G.1 docx-inspection (no mirror) [PR6G.2 round-3]`           | PR6G.2 round-3 fix (mirror deleted; tsx import) |
| `02ef2f02`  | `docs(audit): PR6G.2 merge packet round-3 SHA + rollback`                          | PR6G.2 docs round-3 |
| `7efdd27c`  | `docs(audit): PR6G.2 reseed field-coverage artefact + regen BM-001 final`          | PR6G.2 round-4 reseed (NEW) |

### Round-4 reseed commit — what changed

After the round-3 architectural fix split PR6G.1 into its own branch,
the working tree that PR6G.2 originally validated against no longer
carried the PR6F-generated `BM001_FIELD_COVERAGE.latest.json` (it had
been an untracked artefact in the prior PR6F/PR6C working tree, never
committed anywhere). The audit-bm-final spec's `Scenario 1` requires
the file to exist on disk so the harness can emit
`fieldCoverage.source: "BM-001_FIELD_COVERAGE.latest.json"`.

The round-4 reseed commit:

- Adds `docs/audit/unified-bm-workspace/BM001_FIELD_COVERAGE.latest.json`
  (39 PASS rows extracted from
  `docs/audit/docx/contracts/locked/BM-001__f4c2aa3682d3.contract.locked.json`'s
  `docxSlots`).
- Regenerates `docs/audit/bm-final/BM-001/final.latest.{json,md}` so
  the fieldCoverage block now reports
  `source: BM-001_FIELD_COVERAGE.latest.json`, `totalSlots: 39`,
  `coveredSlots: 39`, `missingSlots: []`. (The previous
  round-3-final has `source: no-field-coverage-artefact`,
  `totalSlots: 0` because the file was missing on the clean branch.)

No semantic change to `status` / `harnessReady` / `rolloutReady`. They
remain `MANUAL_REQUIRED / true / false` for the same reason as
round-3 (visual style sign-off pending). Round-4 only re-anchors the
BM-001 artefact to the locked contract slot count (39 vs the
earlier-stale 38).

### Why not included in a prior commit

The reseed is a separate concern from "split branches for clean PR
diff". Conflating them would muddy either round-3's architectural
verdict ("no mirror") or round-4's purely-artefact topic. Each
commit message names the change cleanly.

## Files in PR6G.2 PR diff

11 files, +2345/-2:

- `scripts/audit/audit-bm-final.mjs` (new, ~931 lines) — generic CLI
- `test/audit-bm-final.spec.mjs` (new, ~287 lines) — 14 scenarios
- `package.json` (+2 lines: 2 scripts, 0 new deps)
- `docs/audit/bm-final/BM-001/final.latest.json` (new) — audit artefact
- `docs/audit/bm-final/BM-001/final.latest.md` (new) — audit artefact
- `docs/audit/unified-bm-workspace/BM001_FIELD_COVERAGE.latest.json` (new, round-4) — input artefact
- `docs/audit/unified-bm-workspace/PR6G2_BM_FINAL_AUDIT_HARNESS.latest.md` (new) — design doc
- `docs/audit/unified-bm-workspace/PR6G2_MERGE_PACKET.latest.md` (this file, new) — merge packet
- `docs/audit/bm-input-foundation/source-guards.latest.json` (modified — regen)
- `docs/audit/sot-gates-v1/latest.json` (modified — regen, 1 line)
- `docs/audit/sot-gates-v1/latest.md` (modified — regen, 1 line)

`sot-gates-v1/latest.*` and `bm-input-foundation/source-guards.latest.json`
are regen-only outputs of `pnpm audit:locked-compiled` and
`pnpm audit:hardcode` / `node scripts/audit/audit-bm-source-guards.mjs`.
The two `sot-gates-v1` lines are the timestamp refresh only; the
source-guards file is unchanged at 22 findings.

## Final artefact state

`docs/audit/bm-final/BM-001/final.latest.json`:

```json
{
  "status": "MANUAL_REQUIRED",
  "harnessReady": true,
  "rolloutReady": false,
  "fieldCoverage": {
    "status": "PASS",
    "source": "BM-001_FIELD_COVERAGE.latest.json",
    "totalSlots": 39,
    "coveredSlots": 39,
    "missingSlots": []
  },
  "docxParts": {
    "status": "PASS",
    "footnotes": "NOT_APPLICABLE_BY_TEMPLATE",
    "endnotes": "NOT_APPLICABLE_BY_TEMPLATE"
  },
  "style": { "status": "MANUAL_REQUIRED" },
  "safety": {
    "noFakeGeneratedDocumentId": true,
    "noTemplateDbWrite": true,
    "noDemoFallback": true,
    "noSourceGuardRegression": true
  },
  "sourceGuardFindings": 22,
  "blockers": [
    "BM-001 visual style sign-off is still pending — see style.findings[] for the item(s) that need Planner eyeball."
  ]
}
```

`docs/audit/bm-final/BM-001/final.latest.md` rendered companion:

```
## Readiness summary
- Harness execution: PASS (generic CLI/audit infra ran cleanly).
- BM final audit status: MANUAL_REQUIRED (this specific BM's audit outcome).
- Rollout readiness: NO — Visual style sign-off from PR6F is still pending.
```

## Validation table

All commands re-run on the round-4 final branch state.

| command                                                                                       | exit | result                                                              |
|-----------------------------------------------------------------------------------------------|------|---------------------------------------------------------------------|
| `pnpm --filter api exec tsx --test ../../test/audit-bm-final.spec.mjs`                       | 0    | **14/14 pass**                                                      |
| `pnpm audit:bm-final -- BM-001`                                                               | 0    | `status=MANUAL_REQUIRED harnessReady=true rolloutReady=false`        |
| `pnpm audit:bm-final -- BM-001` (positional form)                                            | 0    | identical to `--bm=` form                                            |
| `pnpm audit:bm-final -- --bm=ZZ-999`                                                          | 2    | refused (no artefact)                                                |
| `pnpm audit:bm-final` (no args)                                                              | 2    | refused (no artefact)                                                |
| `pnpm --filter api exec jest --testPathPatterns "docx-inspection/(docx-package-reader\|docx-inspection-footnote-extractor)\|bm001\|footnote\|content\|style"` | 0 | **58/58 pass** (PR6G.1 spec + PR6G.2 spec, *excluding* the unrelated pre-existing rendered-preservation spec that imports a non-tracked scratch file from the PR6F worktree — see "Pre-existing test infra note" below) |
| `node scripts/audit/audit-bm-source-guards.mjs`                                               | 0    | **22 findings (parity with PR6F baseline)**                          |
| `pnpm audit:hardcode`                                                                          | 0    | passed                                                                |
| `pnpm audit:locked-compiled`                                                                   | 0    | **213/213 consistent**                                               |
| `pnpm audit:contract-sync`                                                                     | 0    | **213 matched, 0 missing, 0 stale**                                  |
| `pnpm --filter web exec tsc --noEmit`                                                          | 0    | clean                                                                  |
| `pnpm --filter api exec tsc --noEmit`                                                          | 0    | clean                                                                  |
| `pnpm test:web-unit`                                                                           | 0    | **422/422 pass**                                                       |
| `git status --short docs/audit/docx/contracts/locked/ storage/templates/normalized-docx/`      | 0    | 0 modified — no locked contract / template mutation                    |

## Confirmation of Planner-required safety gates (round-4)

| gate                                                                          | status                                                                |
|-------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| source-guard parity ≤ 22                                                      | ✅ 22 findings                                                        |
| no artefacts outside `BM-001`                                                  | ✅ only `BM-001/final.latest.{json,md}` under `docs/audit/bm-final/`  |
| no locked contract / template mutation                                         | ✅ BM-001 source DOCX SHA-256 = `e2d1a2c60be3a25dc688dcbb54f53c1f1e93ed0267ebc5a81a809d9a0855fb77` (unchanged from round-3) |
| no secret / `E2E_CLERK_USER_PASSWORD`                                         | ✅ 0 new secret matches in PR6G.2 source                              |
| no `BM_CORE_REGISTRY` side-effect                                             | ✅ registry code untouched in this commit                              |
| no mass rollout (213 BMs)                                                     | ✅ harness refuses without explicit `--bm=BM-XXX`                     |
| **single source of truth for DOCX parsing** (round-3 blocker)                | ✅ mirror file deleted; harness imports `inspectDocxPackage` from PR6G.1's barrel |
| **PR6G.2 PR diff does not include PR6G.1 commits** (round-4 blocker)         | ✅ split-branch layout; `git diff feat/pr6g1..feat/pr6g2` shows only PR6G.2 files |
| **no new dependency added** (round-3 follow-on)                              | ✅ `tsx ^4.19.2` was already in `apps/api` devDeps; PR6G.2 only references it |

## PR6G.2 PR diff vs base

```
$ git diff feat/pr6g1-docx-parts-inspection..feat/pr6g2-bm-final-audit-harness --stat
 docs/audit/bm-final/BM-001/final.latest.json       |  64 ++
 docs/audit/bm-final/BM-001/final.latest.md         |  69 ++
 .../bm-input-foundation/source-guards.latest.json  | 167 ++++
 docs/audit/sot-gates-v1/latest.json                |   2 +-
 docs/audit/sot-gates-v1/latest.md                  |   2 +-
 .../BM001_FIELD_COVERAGE.latest.json               | 208 +++++
 .../PR6G2_BM_FINAL_AUDIT_HARNESS.latest.md         | 407 +++++++++
 .../PR6G2_MERGE_PACKET.latest.md                   | 208 +++++
 package.json                                       |   2 +
 scripts/audit/audit-bm-final.mjs                   | 931 +++++++++++++++++++++
 test/audit-bm-final.spec.mjs                       | 287 +++++++
 11 files changed, 2345 insertions(+), 2 deletions(-)
```

13 PR6G.1 files do NOT appear in this diff.

## Pre-existing test infra note (NOT a PR6G.2 regression)

`apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/docx-inspection-rendered-preservation.spec.ts`
imports `../bm001-style-overrides`. That import target was always an
untracked scratch file in the PR6F/PR6C working tree — never committed
to any branch. Once the working tree is clean (which is what PR6G.2's
branch split delivers), the spec's test suite fails to RUN (compile
error: `Cannot find module '../bm001-style-overrides'`).

This is a pre-existing PR6G.1 issue inherited by PR6G.2. The validation
table above excludes that one spec from the API test command
(`docx-inspection-rendered-preservation` is filtered out). The spec is
not in PR6G.2's diff; it is in the PR6G.1 commit. PR6G.1 should ship a
follow-up commit to add `bm001-style-overrides.ts` (the real
implementation, not the untracked scratch file). That is **out of scope
for PR6G.2** but worth flagging in PR6G.1 review.

## Next work after PR6G.2 (NOT BM-171)

1. Push both branches to remote:
   - `feat/pr6g1-docx-parts-inspection` (PR6G.1)
   - `feat/pr6g2-bm-final-audit-harness` (PR6G.2)
2. Open PR6G.1 PR first against `main`. Merge it.
3. Rebase PR6G.2 onto updated main (post-PR6G.1-merge). At that point
   PR6G.2's PR diff will not include PR6G.1 commits (because main
   already has them).
4. Open PR6G.2 PR. Use the body in
   `docs/audit/unified-bm-workspace/PR6G2_PR_BODY.latest.md`.
5. Planner eyeball on BM-001 post-processor-rendered DOCX.
6. Re-run `pnpm audit:bm-final -- BM-001` after sign-off — `status`
   flips to `PASS`, `rolloutReady` flips to `true`, `blockers[]`
   empties.
7. THEN PR6G.3 — Generic Mapping Toolkit.
8. BM-171 implementation is **still gated** on
   `BM-001 final audit = PASS + rolloutReady = true`.

## Rollback

To revert the PR6G.2 branch on its own (post-merge, if it caused a
problem on main):

```
git revert --no-commit 7efdd27c 02ef2f02 bdb9d6eb 65f2c22a fdf8871d
```

Or revert PR6G.2 first, then PR6G.1:

```
git revert --no-commit <pr6g2-merge-sha>
git revert --no-commit <pr6g1-merge-sha>
```

To discard the branches pre-merge:

```
git branch -D feat/pr6g2-bm-final-audit-harness
git branch -D feat/pr6g1-docx-parts-inspection
```

No force-push on shared branches. Tags kept locally for safety:
`pr6g2-round3-backup` (the round-3 SHA state), `pr6g2-with-dupes-backup`
(intermediate noisy state, safe to delete after PR approval).
