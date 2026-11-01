# PR7A — BM-171 Foundation Closeout / Merge Hygiene

**STATUS: READY_FOR_PLANNER_REVIEW**
**Task:** PR7A.7 — merge hygiene only. No new feature code.
**Branch:** `feat/pr6g2-bm-final-audit-harness` (this branch already carries
PR6G.1 → PR6G.2 history; PR7A work is **uncommitted**, sitting on top of
HEAD = `14a1fb2d` PR6G.2).
**HEAD base:** `14a1fb2d feat(audit): add generic BM final audit harness`.
**READY_TO_MERGE:** ✅ YES (per Planner acceptance of PR7A.6)
**ROLLOUT BM-171:** ⛔ NO mass-rollout. PR7A only proves **one BM (BM-171)**
can pass the same gates that BM-001 already passes. PR7B (factory) is
**not started**, **not scoped**, **not touched** here.
**ROLLOUT BM-002..BM-213:** ⛔ NO.
**Mutate normalized DOCX:** ⛔ NO.
**Mutate locked contract JSON:** ⛔ NO.
**Renderer logic changes:** ⛔ NO. The renderer / style-profile-engine
mods visible in the working tree are **PR6G.3 / PR6G.4** work that was
already accepted by the Planner in earlier rounds; PR7A.7 does not
re-shape them, only documents the grouping.

---

## 0. Executive summary

PR7A proves that **BM-171** can clear the same gates BM-001 already
clears. This task (PR7A.7) is **not** new feature work — it is
**merge hygiene**:

1. Inspect the git working tree.
2. Confirm every audit gate is still green.
3. Confirm no accidental unrelated files will sneak into a commit.
4. Lay out the commit grouping and PR-body so Planner can push and
   open the PR cleanly.
5. Confirm BM-001 stays READY (regression check).
6. Confirm BM-171 stays READY (post-PR7A.6 acceptance).
7. Confirm PR7B is not started.

All seven checks pass. The working tree contains **210 untracked** +
**14 modified** files, all of which are scoped to one of:

- **PR6G.3** — Generic Mapping Toolkit (form-contracts `bm-form-mapping/`,
  `apps/web/src/lib/bm-form-mapping/`, parity specs).
- **PR6G.4** — Generic Style Profile Engine
  (`apps/api/src/.../style-profile/`, `bm171-style-profile.ts`,
  `docx-style-rule-engine.ts`).
- **PR6G.5** — Rollout Readiness Gate
  (`scripts/audit/audit-bm-rollout-ready.mjs`, gate-15 visual signoff).
- **PR7A** — BM-171 Foundation + Visual Sign-off + Manual Approval
  (`docs/audit/bm-final/BM-171/`, `docs/audit/bm-rollout/BM-171/`,
  `docs/audit/bm-visual-signoff/BM-171/`, `docs/audit/bm-visual-signoff/BM-001/`,
  `docs/audit/unified-bm-workspace/PR7A*/`,
  `_pr7a2-triage/`).
- **Throwaway working-tree scratch** (`storage/temp/`) — explicitly
  **excluded** from the commit plan.

---

## 1. Git state (verbatim, captured at PR7A.7 start)

```
$ git status --short | wc -l
   224   (14 modified + 210 untracked)

$ git branch --show-current
feat/pr6g2-bm-final-audit-harness

$ git log --oneline -3
14a1fb2d feat(audit): add generic BM final audit harness
09528aa7 feat(api): add DOCX parts inspection foundation
12749f1f Merge pull request #37 from lhcaps/fix/ui-light-surface-body-override

$ git diff --stat
 .../modules/documents/document-renderer.service.ts            | 105 +++++++++++++-
 .../docx-inspection-rendered-preservation.spec.ts             |  33 +++--
 .../docxtemplater-contract-render-engine.ts                   |  34 +++++-
 apps/web/src/lib/bm001-form-inputs-api.ts                     |  11 +-
 docs/audit/bm-final/BM-001/final.latest.json                  |  23 ++--
 docs/audit/bm-final/BM-001/final.latest.md                    |  15 +--
 docs/audit/docx-slot-inventory/latest.json                    |   2 +-
 docs/audit/docx-slot-inventory/latest.md                      |   2 +-
 docs/audit/sot-gates-v1/latest.json                           |   2 +-
 docs/audit/sot-gates-v1/latest.md                             |   2 +-
 package.json                                                  |   6 +
 packages/form-contracts/src/index.ts                          |   1 +
 scripts/audit/audit-bm-final.mjs                              | 134 +++++++++++++++++-
 test/audit-bm-final.spec.mjs                                  |  96 ++++++++++++---
 14 files changed, 402 insertions(+), 64 deletions(-)
```

**14 modified** are all regen / PR6G.x carryover. **None** are PR7A new.
**None** require a behaviour-changing commit by themselves — they
belong to PR6G.3 / PR6G.4 / PR6G.5 commits.

**210 untracked** are scoped to PR6G.3 / PR6G.4 / PR6G.5 / PR7A
sub-trees, plus `storage/temp/` scratch, plus `_pr7a2-triage/` raw XML
scratch.

---

## 2. File-classification table

Every untracked / modified file mapped to exactly one bucket.
**ACCIDENTAL bucket is empty.** No file is misclassified.

### 2.1 Throwaway / NOT to commit

| Path prefix                              | Reason                                            |
|------------------------------------------|---------------------------------------------------|
| `storage/temp/`                          | Shadow-render scratch; never tracked historically (`git log --all -- "storage/temp/"` returns 0 commits). Should stay in `.gitignore`. |
| `docs/audit/unified-bm-workspace/_pr7a2-triage/` | Raw triage XML/JSON scratch; the canonical evidence is `PR7A2_BM171_DOCX_PARTS_LAYOUT_TRIAGE.latest.{json,md}`. Leading underscore = scratch by repo convention. |

Both prefixes are intentionally **not** committed. (`.gitignore` does
**not** yet list them — that is a separate concern, out of scope for
PR7A.7. PR7B/8.x can tighten the gitignore if Planner agrees.)

### 2.2 PR6G.3 — Generic Mapping Toolkit

| File                                                       | Status    |
|------------------------------------------------------------|-----------|
| `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-shared-mapping-parity.spec.ts` | untracked |
| `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-rendered-docx-parity.spec.ts`  | untracked |
| `apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts`  | untracked |
| `apps/web/src/lib/bm-form-mapping/`                        | untracked dir |
| `packages/form-contracts/src/bm-form-mapping/`             | untracked dir |
| `packages/form-contracts/test/archive-line.test.ts`        | untracked |
| `packages/form-contracts/test/bm-form-mapping-barrel.test.ts` | untracked |
| `packages/form-contracts/test/date-mapping.test.ts`        | untracked |
| `packages/form-contracts/test/identity-date.test.ts`       | untracked |
| `packages/form-contracts/test/place-date-line.test.ts`     | untracked |
| `packages/form-contracts/test/text-mapping.test.ts`        | untracked |
| `packages/form-contracts/src/index.ts`                     | modified (barrel re-export — `+1 line`) |
| `docs/audit/unified-bm-workspace/PR6G31_SHARED_MAPPING_CONTRACT.latest.md` | untracked |
| `docs/audit/unified-bm-workspace/PR6G3_GENERIC_MAPPING_TOOLKIT.latest.md` | untracked |

### 2.3 PR6G.4 — Generic Style Profile Engine

| File                                                       | Status    |
|------------------------------------------------------------|-----------|
| `apps/api/src/modules/documents/rendering/infrastructure/style-profile/` (entire dir) | untracked |
| `apps/api/src/modules/documents/document-renderer.service.ts`         | modified (PR6G.4 wiring) |
| `apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.ts` | modified (PR6G.4 wiring) |
| `apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/docx-inspection-rendered-preservation.spec.ts` | modified (PR6G.4 spec update) |
| `apps/web/src/lib/bm001-form-inputs-api.ts`                | modified (PR6G.4 web adapter) |
| `docs/audit/unified-bm-workspace/PR6G4_GENERIC_STYLE_PROFILE_ENGINE.latest.md` | untracked |

### 2.4 PR6G.5 — Rollout Readiness Gate

| File                                                       | Status    |
|------------------------------------------------------------|-----------|
| `scripts/audit/audit-bm-rollout-ready.mjs`                 | untracked |
| `scripts/audit/audit-bm-source-guards.mjs`                 | untracked |
| `scripts/audit/audit-bm-source-render-parity.mjs`          | untracked |
| `scripts/audit/audit-bm-openability.mjs`                   | untracked |
| `scripts/audit/build-bm001-visual-signoff-packet.mjs`      | untracked |
| `scripts/audit/build-bm171-visual-signoff-packet.mjs`      | untracked |
| `scripts/audit/build-bm171-visual-signoff-packet-full.mjs` | untracked |
| `test/audit-bm-rollout-ready.spec.mjs`                     | untracked |
| `test/bm171-template-draft-app.spec.mjs`                   | untracked |
| `scripts/audit/audit-bm-final.mjs`                         | modified (PR6G.5 wiring — manual-approval override) |
| `test/audit-bm-final.spec.mjs`                             | modified (PR6G.5 spec scenarios) |
| `package.json`                                             | modified (`+6 lines` of `audit:*` scripts) |
| `docs/audit/bm-rollout/`                                   | untracked dir |
| `docs/audit/bm-visual-signoff/`                            | untracked dir |
| `docs/audit/unified-bm-workspace/PR6G5_ROLLOUT_READINESS_GATE.latest.md` | untracked |

### 2.5 PR7A — BM-171 Foundation

| File                                                       | Status    |
|------------------------------------------------------------|-----------|
| `apps/api/scripts/inspect-bm171-body-layout.mjs`           | untracked |
| `apps/api/scripts/inspect-bm171-docx-parts.mjs`            | untracked |
| `apps/api/scripts/render-bm001-canonical-signoff.mjs`      | untracked |
| `apps/api/scripts/render-bm171-canonical-signoff.mjs`      | untracked |
| `apps/api/scripts/render-bm171-canonical-signoff-full.mjs` | untracked |
| `docs/audit/bm-final/BM-171/`                              | untracked dir |
| `docs/audit/bm-final/BM-001/` (modified artefacts)         | modified |
| `docs/audit/bm-visual-signoff/BM-001/`                     | untracked dir |
| `docs/audit/bm-visual-signoff/BM-171/`                     | untracked dir |
| `docs/audit/unified-bm-workspace/PR7A*`                    | untracked (10 files) |
| `docs/audit/unified-bm-workspace/BM171_FIELD_COVERAGE.latest.json` | untracked |
| `docs/audit/docx-slot-inventory/latest.{json,md}`          | modified (regen, 1 line timestamp) |
| `docs/audit/sot-gates-v1/latest.{json,md}`                 | modified (regen, 1 line timestamp) |

### 2.6 Accidental / unrelated

**Empty.** Every modified or untracked file maps cleanly to one of the
four PR buckets above or to the throwaway bucket. Nothing else is in
the tree.

---

## 3. Recommended commit plan (one commit per PR bucket)

The branch is a stacked branch. Each bucket should become its own
commit so the resulting PRs have **single-purpose diffs**. This matches
the repo's policy: "One logical change per commit."

> The exact split is Planner's call. The plan below is the
> recommended shape based on what was previously discussed in the
> PR6G/PR7A planning rounds.

### Commit A — PR6G.3 (Generic Mapping Toolkit)

```
git add \
  packages/form-contracts/src/bm-form-mapping/ \
  packages/form-contracts/test/ \
  packages/form-contracts/src/index.ts \
  apps/web/src/lib/bm-form-mapping/ \
  apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-shared-mapping-parity.spec.ts \
  apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm001-rendered-docx-parity.spec.ts \
  apps/api/src/modules/documents/rendering/infrastructure/pr6g31-bm171-rendered-docx-parity.spec.ts \
  docs/audit/unified-bm-workspace/PR6G31_SHARED_MAPPING_CONTRACT.latest.md \
  docs/audit/unified-bm-workspace/PR6G3_GENERIC_MAPPING_TOOLKIT.latest.md

git commit -m "feat(form-contracts): generic mapping toolkit (PR6G.3)"
```

### Commit B — PR6G.4 (Generic Style Profile Engine)

```
git add \
  apps/api/src/modules/documents/rendering/infrastructure/style-profile/ \
  apps/api/src/modules/documents/document-renderer.service.ts \
  apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.ts \
  apps/api/src/modules/documents/rendering/infrastructure/docx-inspection/docx-inspection-rendered-preservation.spec.ts \
  apps/web/src/lib/bm001-form-inputs-api.ts \
  docs/audit/unified-bm-workspace/PR6G4_GENERIC_STYLE_PROFILE_ENGINE.latest.md

git commit -m "feat(renderer): generic style profile engine (PR6G.4)"
```

### Commit C — PR6G.5 (Rollout Readiness Gate)

```
git add \
  scripts/audit/audit-bm-rollout-ready.mjs \
  scripts/audit/audit-bm-source-guards.mjs \
  scripts/audit/audit-bm-source-render-parity.mjs \
  scripts/audit/audit-bm-openability.mjs \
  scripts/audit/build-bm001-visual-signoff-packet.mjs \
  scripts/audit/build-bm171-visual-signoff-packet.mjs \
  scripts/audit/build-bm171-visual-signoff-packet-full.mjs \
  scripts/audit/audit-bm-final.mjs \
  test/audit-bm-rollout-ready.spec.mjs \
  test/audit-bm-final.spec.mjs \
  test/bm171-template-draft-app.spec.mjs \
  package.json \
  docs/audit/unified-bm-workspace/PR6G5_ROLLOUT_READINESS_GATE.latest.md

git commit -m "feat(audit): rollout readiness gate (PR6G.5)"
```

### Commit D — PR7A (BM-171 Foundation + Visual Sign-off)

```
git add \
  apps/api/scripts/inspect-bm171-body-layout.mjs \
  apps/api/scripts/inspect-bm171-docx-parts.mjs \
  apps/api/scripts/render-bm001-canonical-signoff.mjs \
  apps/api/scripts/render-bm171-canonical-signoff.mjs \
  apps/api/scripts/render-bm171-canonical-signoff-full.mjs \
  docs/audit/bm-final/BM-171/ \
  docs/audit/bm-final/BM-001/ \
  docs/audit/bm-rollout/ \
  docs/audit/bm-visual-signoff/ \
  docs/audit/unified-bm-workspace/BM171_FIELD_COVERAGE.latest.json \
  docs/audit/unified-bm-workspace/PR7A_BM171_INTAKE.latest.md \
  docs/audit/unified-bm-workspace/PR7A_BM171_STYLE_PROFILE_REQUIREMENTS.latest.md \
  docs/audit/unified-bm-workspace/PR7A_BM171_RENDERED_TEXT_EVIDENCE.latest.md \
  docs/audit/unified-bm-workspace/PR7A_BM171_ROLLOUT_PLAN.latest.md \
  docs/audit/unified-bm-workspace/PR7A2_BM171_DOCX_PARTS_LAYOUT_TRIAGE.latest.json \
  docs/audit/unified-bm-workspace/PR7A2_BM171_DOCX_PARTS_LAYOUT_TRIAGE.latest.md \
  docs/audit/unified-bm-workspace/PR7A3_BM171_PARAGRAPH_SUPPRESSION.latest.json \
  docs/audit/unified-bm-workspace/PR7A3_BM171_PARAGRAPH_SUPPRESSION.latest.md \
  docs/audit/unified-bm-workspace/PR7A4_BM-171_OPENABILITY.latest.json \
  docs/audit/unified-bm-workspace/PR7A4_BM-171_OPENABILITY.latest.md \
  docs/audit/unified-bm-workspace/PR7A4_BM-171_SOURCE_RENDER_PARITY.latest.json \
  docs/audit/unified-bm-workspace/PR7A4_BM-171_SOURCE_RENDER_PARITY.latest.md \
  docs/audit/unified-bm-workspace/PR7B_FORM_ROLLOUT_FACTORY_BACKLOG.latest.md \
  docs/audit/docx-slot-inventory/latest.json \
  docs/audit/docx-slot-inventory/latest.md \
  docs/audit/sot-gates-v1/latest.json \
  docs/audit/sot-gates-v1/latest.md

git commit -m "feat(audit): BM-171 foundation + visual sign-off (PR7A)"
```

### Commit E — `PR7A_BM171_FOUNDATION_CLOSEOUT_MERGE_PACKET` (this file)

```
git add docs/audit/unified-bm-workspace/PR7A_BM171_FOUNDATION_CLOSEOUT_MERGE_PACKET.latest.md
git commit -m "docs(audit): PR7A BM-171 foundation closeout merge packet"
```

> **No commit is created by PR7A.7 itself.** The packet describes
> what **Planner** will commit after review.

---

## 4. Gates re-verified post-PR7A.6

All gates re-run on the current working tree.

| command                                              | exit | result                                       |
|------------------------------------------------------|------|----------------------------------------------|
| `pnpm audit:bm-final -- BM-171`                      | 0    | `status=PASS harnessReady=true rolloutReady=true` |
| `pnpm audit:bm-final -- BM-001`                      | 0    | `status=PASS harnessReady=true rolloutReady=true` |
| `pnpm audit:bm-rollout-ready -- BM-171`              | 0    | `status=READY technicalReady=true manualReviewRequired=false rolloutReady=true` |
| `pnpm audit:bm-rollout-ready -- BM-001`              | 0    | `status=READY technicalReady=true manualReviewRequired=false rolloutReady=true` |
| `pnpm audit:bm-final:test`                           | 0    | **15/15 pass** |
| `pnpm --filter api exec tsx --test ../../test/audit-bm-rollout-ready.spec.mjs` | 0 | **31/31 pass** |
| `pnpm audit:hardcode`                                | 0    | `Runtime hardcode audit passed.` |
| `pnpm audit:locked-compiled`                         | 0    | `C3 EXIT 0 — gate complete` (213/213 CONSISTENT, 0 STALE, 0 CRITICAL/HIGH/MEDIUM) |
| `pnpm audit:contract-sync`                           | 0    | `All contracts synced` |
| `pnpm --filter api exec tsc --noEmit`                | 0    | clean |
| `pnpm --filter web exec tsc --noEmit`                | 0    | clean |
| `pnpm --filter form-contracts exec tsc --noEmit`     | 0    | clean |
| `git status --short docs/audit/docx/contracts/locked/ storage/templates/normalized-docx/` | 0 | **0 modified** — no locked contract / normalized-DOCX mutation |

**All gates green. No regression.**

---

## 5. End-state confirmation (per Planner acceptance of PR7A.6)

| check                                                | status |
|------------------------------------------------------|--------|
| Git diff understood and scoped                       | ✅ §2 file-classification table is exhaustive |
| No accidental unrelated files included               | ✅ §2.6 accidental bucket is empty |
| All required gates still pass                        | ✅ §4 |
| PR summary ready                                     | ✅ §6 |
| Commit plan clear                                    | ✅ §3 |
| BM-001 remains READY                                 | ✅ `audit:bm-final` + `audit:bm-rollout-ready` PASS for BM-001 |
| BM-171 remains READY                                 | ✅ `audit:bm-final` + `audit:bm-rollout-ready` PASS for BM-171 |
| PR7B remains not started                             | ✅ `PR7B_FORM_ROLLOUT_FACTORY_BACKLOG.latest.md` is a backlog doc only; no factory code, no rollout scripts, no other-BM artefacts written |
| Renderer logic unchanged by PR7A.7                   | ✅ PR7A.7 made zero source-code edits |
| Normalized DOCX unchanged                            | ✅ `git status storage/templates/normalized-docx/` → 0 changes |
| Locked contract JSON unchanged                       | ✅ `git status docs/audit/docx/contracts/locked/` → 0 changes |
| `.codegraph/` index excluded                         | ✅ already in `.gitignore` |
| `storage/temp/` not staged                           | ✅ all `storage/temp/` paths are untracked and not in any commit plan |
| `_pr7a2-triage/` not staged                          | ✅ leading-underscore scratch; canonical evidence is in `PR7A2_*.latest.{json,md}` |

---

## 6. PR body (for Planner to paste when opening PR7A)

```markdown
## PR7A — BM-171 Foundation

### What
Establishes that **BM-171** can pass the same `audit:bm-final` and
`audit:bm-rollout-ready` gates that **BM-001** already passes. No
mass-rollout. No locked-contract mutation. No normalized-DOCX
mutation. No new feature work beyond PR6G.3 / PR6G.4 / PR6G.5
(which land as separate commits A/B/C in this branch).

### Why
The audit machinery for one BM (BM-001) was already PR6G.2-merged.
PR7A proves the machinery works for a second, structurally different
BM (BM-171) without any per-BM special-casing in the audit scripts.

### Acceptance gates (re-run on this branch)
- `pnpm audit:bm-final -- BM-171` → `status=PASS rolloutReady=true`
- `pnpm audit:bm-final -- BM-001` → `status=PASS rolloutReady=true` (regression)
- `pnpm audit:bm-rollout-ready -- BM-171` → `status=READY rolloutReady=true`
- `pnpm audit:bm-rollout-ready -- BM-001` → `status=READY rolloutReady=true` (regression)
- `pnpm audit:bm-final:test` → 15/15 pass
- `pnpm --filter api exec tsx --test ../../test/audit-bm-rollout-ready.spec.mjs` → 31/31 pass
- `pnpm audit:hardcode` → pass
- `pnpm audit:locked-compiled` → 213/213 CONSISTENT
- `pnpm audit:contract-sync` → pass
- typecheck (api / web / form-contracts) → clean

### Files
See `docs/audit/unified-bm-workspace/PR7A_BM171_FOUNDATION_CLOSEOUT_MERGE_PACKET.latest.md`
for the exhaustive file-classification table and the commit-plan.

### Risk
Low. This PR does not introduce a BM-002..BM-213 factory; it only
proves BM-171 + BM-001 both pass. The factory lives in PR7B (not
started).
```

---

## 7. Rollback (post-merge)

To discard the PR7A work pre-merge, simply:

```
git reset --hard 14a1fb2d
git clean -fdx storage/temp/ docs/audit/unified-bm-workspace/_pr7a2-triage/
```

To revert post-merge:

```
git revert -m 1 <pr7a-merge-sha>
```

No force-push. No hard-reset on shared branches.

---

## 8. What's NOT in PR7A (deliberately)

| item                                                | reason                                  |
|-----------------------------------------------------|-----------------------------------------|
| PR7B — form rollout factory                         | Out of scope. Planner has not started it. Backlog only. |
| Other BM codes (BM-002..BM-213) artefacts           | Out of scope. PR7A only proves BM-001 + BM-171. |
| Renderer logic refactor                             | Renderer / style-profile work visible in the tree is PR6G.4 — not PR7A. |
| Normalized DOCX regeneration                       | Not requested.                         |
| Locked contract JSON edits                          | Forbidden by AGENTS.md.                 |
| `.gitignore` tightening for `storage/temp/` + `_pr7a2-triage/` | Hygiene improvement; suggest follow-up in PR7B/8.x. |

---

## 9. Next-step after Planner accepts PR7A.7

Planner action only:

1. Re-read this packet (§2 file-classification, §3 commit plan, §4 gates).
2. Confirm commit grouping is acceptable (or amend if Planner prefers
   a different slice).
3. Execute the four `git add …; git commit …` sequences from §3.
4. Push `feat/pr6g2-bm-final-audit-harness` to remote.
5. Open PR7A PR. Body: §6 above.
6. Wait for review.
7. After merge: open PR7B (factory) per
   `docs/audit/unified-bm-workspace/PR7B_FORM_ROLLOUT_FACTORY_BACKLOG.latest.md`.

---

**Generated:** 2026-07-05 (PR7A.7 — merge hygiene)
**Executor:** Cursor (Claude Opus 4 + Cursor)
**Planner:** ChatGPT (gatekeeper)
**READY_TO_MERGE:** YES — but the commits themselves are Planner's to
create. PR7A.7 produced this packet only.