# 213 DOCX Fidelity Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring all 213 BM form contracts to reviewed DOCX-faithful structure, field semantics, bindings, render output, and runtime sync.

**Architecture:** Treat the normalized DOCX plus the locked contract as the source pair for each BM. Use CodeGraph for code-path understanding, but use direct DOCX evidence for legal/semantic decisions. Mutate only one reviewed BM group at a time, then validate, compile, render-diff, audit, publish, and sync before selecting the next group.

**Tech Stack:** Node.js audit scripts, `@qllaw/form-contracts`, locked V1 contracts in `docs/audit/docx/contracts/locked`, compiled V2 artifacts in `docs/audit/docx/compiled-v2`, Form Studio/catalog services, DOCX OOXML evidence, CodeGraph MCP/CLI, Prisma-backed contract publish/sync.

---

## Current Findings

- CodeGraph is available in this checkout: `codegraph status` reports 1,139 files, 24,916 nodes, 69,050 edges, and an up-to-date index.
- Runtime DB sync is currently clean when run directly: `node scripts/audit/audit-contract-sync.mjs` reports `Matched: 213`, `Missing in DB: 0`, `Stale: 0`.
- Root-cause audit still shows the corpus is not semantically clean: `node scripts/audit/audit-forms-root-cause.mjs` reports 2,443 fields and 1,476 issues, with 1,154 FAIL and 322 REVIEW.
- Authoring baseline proves broad availability, not final correctness: `node scripts/audit-form-authoring-baselines.mjs` reports `Resolved: 183/213`, `LOCKED_VERIFIED: 184`, `EXTRACTED_NEEDS_REVIEW: 29`, and `Contract repair required: 29`, then exits non-zero.
- `pnpm audit:*` currently fails before running scripts because pnpm tries to purge `node_modules` in non-TTY mode under Node `v24.14.0`, while the repo wants Node `>=22 <23`. Until the runtime is normalized, use direct `node scripts/...` commands for read-only audits.
- The handoff direction is partially correct: evidence-only review, no cross-BM approval, issue-level delta, compile before audit, and DB sync are right. The missing part is that issue-count reduction is not a sufficient final goal. The final goal must be per-BM DOCX fidelity.

## File Structure

- Existing source of truth: `docs/audit/docx/contracts/locked/*.contract.locked.json`
- Existing compiled artifacts: `docs/audit/docx/compiled-v2/*.compiled.json`
- Existing baseline report: `docs/audit/form-authoring-baselines/audited.md`
- Existing root-cause report: `docs/audit/forms-root-cause/latest.json`
- Existing per-form evidence area: `docs/audit/per-form-render-accurate/<BM_CODE>/`
- Create: `docs/audit/213-docx-fidelity-board/latest.json`
- Create: `docs/audit/213-docx-fidelity-board/latest.md`
- Create: `docs/audit/213-docx-fidelity-board/per-bm.csv`
- Create: `scripts/audit/refresh-213-docx-fidelity-board.mjs`
- Create: `test/213-docx-fidelity-board.test.mjs`
- Reuse, do not replace yet: `scripts/audit/plan-213-bm-remediation-master.cjs`

## Task 1: Stabilize The Baseline

**Files:**
- Read: `docs/audit/form-authoring-baselines/audited.md`
- Read: `docs/audit/forms-root-cause/latest.json`
- Read: `docs/audit/docx/contracts/locked`
- Read: `docs/audit/docx/compiled-v2`

- [ ] **Step 1: Confirm CodeGraph is usable**

Run:

```powershell
codegraph status
```

Expected: index is up to date for `D:\Study\Project\QLLaw-main`. If it says the index is older, run `codegraph sync` before code exploration.

- [ ] **Step 2: Capture the dirty worktree before any mutation**

Run:

```powershell
git status --short --branch
```

Expected: save the output into the task notes. Do not delete untracked audit files unless the user explicitly approves cleanup.

- [ ] **Step 3: Run read-only live audits directly**

Run:

```powershell
node scripts/audit-form-authoring-baselines.mjs
node scripts/audit/audit-forms-root-cause.mjs
node scripts/audit/audit-contract-sync.mjs
```

Expected:
- Authoring baseline may exit non-zero while contract repair remains.
- Root cause should print the current total issue count.
- Contract sync must end with `Matched: 213`, `Missing in DB: 0`, `Stale: 0` before any new batch starts.

## Task 2: Build The Fidelity Board

**Files:**
- Create: `scripts/audit/refresh-213-docx-fidelity-board.mjs`
- Create: `docs/audit/213-docx-fidelity-board/latest.json`
- Create: `docs/audit/213-docx-fidelity-board/latest.md`
- Create: `docs/audit/213-docx-fidelity-board/per-bm.csv`
- Test: `test/213-docx-fidelity-board.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `test/213-docx-fidelity-board.test.mjs` with assertions that the board exists after the script runs, contains exactly 213 rows, includes BM code, title, root-cause issue counts, baseline findings, primary lane, and next action, and never marks a BM `DONE` when it has root-cause FAIL/REVIEW or baseline contract repair findings.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
node --test test/213-docx-fidelity-board.test.mjs
```

Expected: fails because `scripts/audit/refresh-213-docx-fidelity-board.mjs` and board outputs do not exist yet.

- [ ] **Step 3: Implement the board generator**

Create `scripts/audit/refresh-213-docx-fidelity-board.mjs`. It must read `docs/audit/forms-root-cause/latest.json`, `docs/audit/form-authoring-baselines/matrix.csv`, and locked contract metadata. It must classify each BM into exactly one primary lane:

- `CONTRACT_REPAIR`
- `PATH_DOMAIN_BINDING`
- `SOURCE_POLICY`
- `REMEDIATION_LEAK`
- `WEAK_EVIDENCE_REVIEW`
- `RENDER_FIDELITY`
- `LEGAL_REVIEW`
- `VERIFY_ONLY`

The script must write JSON, Markdown, and CSV to `docs/audit/213-docx-fidelity-board/`.

- [ ] **Step 4: Run the board generator and test**

Run:

```powershell
node scripts/audit/refresh-213-docx-fidelity-board.mjs
node --test test/213-docx-fidelity-board.test.mjs
```

Expected: test passes and `latest.md` lists the first remediation candidates by lane and risk.

## Task 3: Repair Contract-Structure Blockers First

**Files:**
- Read: `docs/audit/form-authoring-baselines/audited.md`
- Modify only after approval: affected `docs/audit/docx/contracts/locked/<BM_CODE>*.contract.locked.json`
- Regenerate: `docs/audit/docx/compiled-v2/<BM_CODE>.compiled.json`

- [ ] **Step 1: Select only `CONTRACT_REPAIR` BMs**

Use the board to select BMs with `TEMPLATE_PLACEHOLDER_WITHOUT_SLOT`, `CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER`, `BINDING_WITHOUT_TEMPLATE_PLACEHOLDER`, `REVIEW_REQUIRED_REMAINS`, or stale renderer manifest findings.

- [ ] **Step 2: Produce one evidence packet per BM**

For each selected BM, create:

```text
docs/audit/per-form-render-accurate/<BM_CODE>/evidence.latest.json
docs/audit/per-form-render-accurate/<BM_CODE>/evidence.latest.md
docs/audit/per-form-render-accurate/<BM_CODE>/patch-plan.latest.json
docs/audit/per-form-render-accurate/<BM_CODE>/patch-plan.latest.md
```

Expected: no approved decisions in this step.

- [ ] **Step 3: Apply only approved structural repairs**

Apply only changes backed by same-BM DOCX evidence:

- add missing slots for real DOCX placeholders
- remove orphan slots only when the DOCX placeholder no longer exists
- update renderBinding `from` and `slotId` together
- keep `source`, `required`, and `reviewRequired` unchanged unless explicitly approved

- [ ] **Step 4: Verify after each BM group**

Run:

```powershell
node scripts/audit-form-authoring-baselines.mjs
node scripts/audit/audit-forms-root-cause.mjs
node scripts/audit/audit-contract-sync.mjs
```

Expected: contract repair count decreases, root-cause issue-level deltas are attributed, and DB sync is clean after publish.

## Task 4: Then Fix Field Semantics

**Files:**
- Read: `docs/audit/forms-root-cause/latest.json`
- Modify only after approval: affected locked contract JSON files
- Regenerate: affected compiled V2 artifacts

- [ ] **Step 1: Select `PATH_DOMAIN_BINDING` candidates**

Use CodeGraph to inspect audit/apply code paths, then use same-BM DOCX evidence for semantics. Do not use cross-BM evidence to approve a remap.

- [ ] **Step 2: Require exact mutation shape**

Every approved path remap must update all of these together:

- `canonicalFields[].path`
- `canonicalFields[].label`
- `docxSlots[].id`
- `docxSlots[].label`
- `renderBindings[].slotId`
- `renderBindings[].from`

- [ ] **Step 3: Require issue-level delta**

After mutation, record:

- removed issues
- added issues
- severity changes
- reason changes
- whether new REVIEW issues are unmasking or regression

Expected: no aggregate-only approval.

## Task 5: Add Per-BM Render Fidelity Gate

**Files:**
- Create or reuse: `scripts/audit/run-docx-fidelity-all.mjs`
- Create or reuse: `scripts/audit/audit-docx-runtime-parity.mjs`
- Create or reuse: `scripts/audit/audit-docx-fidelity-mutations.mjs`
- Output: `docs/audit/per-form-render-accurate/<BM_CODE>/render-diff.latest.json`
- Output: `docs/audit/per-form-render-accurate/<BM_CODE>/render-diff.latest.md`

- [ ] **Step 1: Render the BM with representative payload**

Run the existing per-form render path for the BM under review. The render artifact must preserve DOCX package structure and have no unreplaced placeholders, literal `undefined`, or literal `null`.

- [ ] **Step 2: Compare rendered output to normalized DOCX**

The render diff must check:

- paragraph order
- table cell placeholder placement
- section headers
- signature/footer lines
- Times New Roman 13 baseline where applicable
- bold/body heading expectations where applicable

- [ ] **Step 3: Block `DONE` without render evidence**

A BM cannot be marked complete unless it has clean baseline, clean root-cause, clean render diff, clean compile, and clean DB sync.

## Task 6: Publish And Sync Only After Gates Pass

**Files:**
- Regenerate: `docs/audit/docx/compiled-v2/*.compiled.json`
- Publish via DB only after contract validation and compile pass

- [ ] **Step 1: Validate and compile**

Run:

```powershell
pnpm contract:validate
pnpm contract:compile
```

Expected: pass under the repo-supported Node/pnpm runtime. If pnpm still blocks in non-TTY mode, normalize the runtime before publishing.

- [ ] **Step 2: Publish**

Run:

```powershell
$env:OFFICIAL_ID='1'
pnpm publish:forms:db
```

Expected: only changed contracts are created or skipped idempotently.

- [ ] **Step 3: Verify DB sync**

Run:

```powershell
node scripts/audit/audit-contract-sync.mjs
```

Expected: `Matched: 213`, `Missing in DB: 0`, `Stale: 0`.

## Task 7: Completion Gate For All 213 Forms

**Files:**
- Update: `docs/audit/213-docx-fidelity-board/latest.json`
- Update: `docs/audit/213-docx-fidelity-board/latest.md`
- Update: `docs/audit/213-docx-fidelity-board/per-bm.csv`

- [ ] **Step 1: Run the full completion bundle**

Run:

```powershell
node scripts/audit-form-authoring-baselines.mjs
node scripts/audit/audit-forms-root-cause.mjs
node scripts/audit/run-docx-fidelity-all.mjs
node scripts/audit/audit-contract-sync.mjs
node scripts/audit/refresh-213-docx-fidelity-board.mjs
```

Expected:
- 213 rows in the board
- 0 BMs in `CONTRACT_REPAIR`
- 0 root-cause FAIL
- 0 unresolved REVIEW unless explicitly accepted in a dated legal-review ledger
- 0 stale DB contracts
- all 213 BMs either `DONE` or `LEGAL_REVIEW_ACCEPTED`

- [ ] **Step 2: Freeze the completion evidence**

Commit only the locked contracts, compiled artifacts, board outputs, render evidence, tests, and approved decision packets related to the completed batch.

Run:

```powershell
git status --short
git diff --stat
```

Expected: no unrelated scratch directories or temporary Office lock files in the final commit.
