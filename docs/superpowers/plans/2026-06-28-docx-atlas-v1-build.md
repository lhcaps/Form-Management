# DOCX Atlas V1 Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build audit-only Atlas V1 scripts that summarize DOCX, contract, render-gate, and queue evidence for all 213 BM templates without mutating source artifacts.

**Architecture:** Keep the Atlas layer outside runtime rendering. Builders read normalized DOCX, locked contracts, board rows, and render-diff reports, then write deterministic JSON/Markdown evidence under `docs/audit/docx-atlas-v1`.

**Tech Stack:** Node.js ESM scripts, `node:test`, existing Phase 0 audit modules, PizZip through existing workspace dependencies.

---

### Task 1: Fail-First Builder Tests

**Files:**
- Create: `test/docx-atlas-v1-builders.test.mjs`

- [ ] Write tests that require four CLI scripts: `build-docx-atlas-v1.mjs`, `build-contract-atlas-v1.mjs`, `build-render-atlas-v1.mjs`, and `build-smart-remediation-queue-v1.mjs`.
- [ ] Assert `ooxml-context-extractor.mjs` exports `buildOccurrenceContext`.
- [ ] Assert duplicate risky placeholders spanning body/header classify as `CRITICAL`.
- [ ] Assert `DOCX_SAFE_RENDER_PASS_POLICY_BLOCKER` rejects `MEDIUM` DOCX risk.
- [ ] Build a two-BM temp fixture and assert builders write docx, contract, render, and queue atlas outputs without approval/apply artifacts.
- [ ] Run `node --test test/docx-atlas-v1-builders.test.mjs` and confirm it fails before implementation.

### Task 2: Harden Phase 0 Modules

**Files:**
- Modify: `scripts/audit/lib/ooxml-context-extractor.mjs`
- Modify: `scripts/audit/lib/smart-remediation-classifier.mjs`

- [ ] Add `buildOccurrenceContext(part, textNodes, occurrence, allOccurrences)` as a reusable export.
- [ ] Track real XML text-node offsets so paragraph/table context is based on XML position, not text-node index.
- [ ] Add rough `tableIndex`, `rowIndex`, and `cellIndex` detection for table-contained placeholders.
- [ ] Classify `CRITICAL` before `HIGH` when risky placeholders span header/body/footer with different contexts.
- [ ] Make policy-blocker logic require render `PASS`, DOCX risk `NONE` or `LOW`, no occurrence review, no structural repair candidate, and no disallowed issue codes.
- [ ] Run the new test and existing Phase 0 test.

### Task 3: Build Atlas CLI Scripts

**Files:**
- Create: `scripts/audit/build-docx-atlas-v1.mjs`
- Create: `scripts/audit/build-contract-atlas-v1.mjs`
- Create: `scripts/audit/build-render-atlas-v1.mjs`
- Create: `scripts/audit/build-smart-remediation-queue-v1.mjs`

- [ ] Implement shared CLI args: `--root`, repeated `--template-code`, `--limit`, `--out-dir`, `--force`, and `--concurrency` where relevant.
- [ ] DOCX Atlas reads normalized DOCX one file at a time and writes `docx-atlas.latest.json` and `.md`.
- [ ] Contract Atlas reads locked contracts and DOCX Atlas, runs structural mismatch summaries, and writes `contract-atlas.latest.json` and `.md`.
- [ ] Render Atlas aggregates cached or freshly-run render gates, treats `FAIL` as data, and writes `render-atlas.latest.json` and `.md`.
- [ ] Smart Queue reads board/docx/contract/render atlas, preserves blockers, applies classifier precedence, and writes `smart-remediation-queue.latest.json` and `.md`.
- [ ] Ensure all outputs include `canApplyRunNow: false`, `canMarkDone: false`, `noDbPublish: true`, and no approved decisions.

### Task 4: Repo Verification And Handoff

**Files:**
- Modify/Create artifacts under `docs/audit/docx-atlas-v1`

- [ ] Run `node --test test/docx-atlas-v1-builders.test.mjs`.
- [ ] Run `node --test test/docx-atlas-phase0-modules.test.mjs`.
- [ ] Run the Atlas builders for the current repo.
- [ ] Run `node scripts/audit/audit-contract-sync.mjs`.
- [ ] Run `node scripts/audit/refresh-213-docx-fidelity-board.mjs`.
- [ ] Check forbidden diffs with `git diff -- storage/templates/normalized-docx`, `git diff -- docs/audit/docx/contracts/locked`, and `git diff -- docs/audit/docx/compiled-v2`.
- [ ] Write `phase1-4-planner-handoff.latest.json` and `.md` with exact outputs, blocker counts, and next planner decision.
