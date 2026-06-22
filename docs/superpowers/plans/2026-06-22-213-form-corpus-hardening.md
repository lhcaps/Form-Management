# 213-Form Corpus Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 213 form artifacts structurally truthful, runtime-safe, and progressively semantically faithful to their normalized DOCX files.

**Architecture:** A shared corpus quality evaluator becomes the source of truth for lock, authoring, and runtime readiness. Mechanical defects are repaired corpus-wide, while semantic changes remain fail-closed and template-specific.

**Tech Stack:** Node.js ESM, TypeScript/NestJS, PizZip, node:test/Jest, DOCX OOXML, LibreOffice render QA.

---

### Task 1: Add the corpus quality evaluator

**Files:**
- Create: `scripts/docx-contract/lib/form-corpus-quality.mjs`
- Create: `test/docx-contract/test-form-corpus-quality.test.mjs`
- Modify: `scripts/docx-contract/verify-locked-contracts.mjs`
- Modify: `scripts/audit-form-authoring-baselines.mjs`
- Modify: `test/form-authoring-baselines.test.mjs`

- [ ] Write failing tests for package parts, hash parity, placeholder parity,
  broad generic paths, conflicting duplicates, and review provenance.
- [ ] Run the focused tests and confirm they fail because the evaluator does
  not exist.
- [ ] Implement pure evaluation functions and deterministic issue codes.
- [ ] Integrate the evaluator into locked verification and authoring grades.
- [ ] Re-run focused tests and confirm they pass.

### Task 2: Harden lock generation

**Files:**
- Create: `test/docx-contract/test-lock-reviewed-contracts.test.mjs`
- Modify: `scripts/docx-contract/lock-reviewed-contracts.mjs`
- Modify: `scripts/docx-contract/generate-all-lock-mappings-v2.mjs`

- [ ] Write failing tests proving automated mappings cannot claim human review,
  exact duplicate records are collapsed, conflicts fail, and unresolved
  questions survive.
- [ ] Refactor lock behavior into exported pure functions.
- [ ] Add explicit `reviewKind: human|automated` mapping metadata.
- [ ] Make the CLI write only contracts accepted by the quality evaluator.
- [ ] Re-run focused lock tests.

### Task 3: Repair BM-058 package and semantic template

**Files:**
- Modify: `scripts/docx-contract/lib/semantic-template-remediator.mjs`
- Modify: `scripts/docx-contract/remediate-semantic-template.mjs`
- Modify: `test/docx-contract/test-semantic-template-remediator.test.mjs`
- Modify: `storage/templates/normalized-docx/BM-058/BM-058_normalized.docx`
- Modify: `scripts/form-refinement/profiles/BM-058.json`
- Modify: `docs/audit/docx/contracts/BM-058__6de8f0022bff.contract.draft.json`
- Modify: `docs/audit/docx/contracts/locked/BM-058__6de8f0022bff.contract.locked.json`

- [ ] Add a failing regression test for the broken package.
- [ ] Add reviewed BM-058 replacement anchors and semantic fields.
- [ ] Generate the normalized DOCX from a valid complete package.
- [ ] Verify package preservation, placeholder parity, and hash synchronization.
- [ ] Render and inspect every BM-058 page.

### Task 4: Remediate BM-213 semantics

**Files:**
- Modify: `scripts/docx-contract/lib/semantic-template-remediator.mjs`
- Modify: `test/docx-contract/test-semantic-template-remediator.test.mjs`
- Modify: `storage/templates/normalized-docx/BM-213/BM-213_normalized.docx`
- Modify: `scripts/form-refinement/profiles/BM-213.json`
- Modify: `docs/audit/docx/contracts/BM-213__33383be18132.contract.draft.json`
- Modify: `docs/audit/docx/contracts/locked/BM-213__33383be18132.contract.locked.json`

- [ ] Add the exact expected semantic field order to the refinement test.
- [ ] Add fail-closed BM-213 OOXML replacements.
- [ ] Replace only fillable blanks; preserve literal legal ellipses.
- [ ] Refine contracts, synchronize hashes, and run preview smoke.
- [ ] Render and inspect every BM-213 page.

### Task 5: Reconcile mechanically safe corpus defects

**Files:**
- Create: `scripts/docx-contract/reconcile-locked-corpus.mjs`
- Create: `test/docx-contract/test-reconcile-locked-corpus.test.mjs`
- Modify: mechanically eligible files under
  `docs/audit/docx/contracts/locked/`

- [ ] Write failing tests for dry-run, exact deduplication, conflict rejection,
  and hash synchronization.
- [ ] Implement a dry-run-first reconciler.
- [ ] Run dry-run and review per-form actions.
- [ ] Apply only exact mechanical changes.
- [ ] Re-run corpus quality and preserve automated-review status.

### Task 6: Remediate remaining semantic waves

**Files:**
- Modify: selected normalized DOCX, profile, contract, panel, and test files per
  wave.
- Create: one design/evidence record per wave under `docs/audit/docx/`.

- [ ] Generate a deterministic queue from `SEMANTIC_REMEDIATION_REQUIRED`.
- [ ] Group forms by workflow and shared document structure.
- [ ] For each group, use test-first fail-closed remediation.
- [ ] Run focused preview and render QA before moving to the next group.
- [ ] Stop and record explicit questions for legally ambiguous fields.

### Task 7: Enforce runtime readiness

**Files:**
- Modify: `apps/api/src/modules/documents/rendering/application/contract-render-plan.builder.ts`
- Modify: `apps/api/src/modules/documents/rendering/application/contract-render-plan.builder.spec.ts`
- Modify: runtime readiness reports/scripts as required by the evaluator.

- [ ] Write failing tests for package/hash/generic/review blockers.
- [ ] Reject active rendering for contracts below the required quality state.
- [ ] Keep shadow inspection available for pending forms.
- [ ] Run API focused tests and forms runtime smoke.

### Task 8: Run final evidence gates

**Files:**
- Modify: deterministic generated audit reports only.

- [ ] Run DOCX locked verification and corpus quality audit.
- [ ] Run form refinement and authoring baseline audits.
- [ ] Run contract validation, lint, typecheck, tests, and build.
- [ ] Run `/documents/{id}` end-to-end smoke.
- [ ] Render and inspect all changed DOCX files.
- [ ] Report technical verification and human/legal review as separate states.

