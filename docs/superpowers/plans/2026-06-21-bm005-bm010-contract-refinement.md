# BM-005..BM-010 Contract Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:verification-before-completion. This continuation is executed inline because the user asked to keep progressing in the current run.

**Goal:** Replace the generic extracted draft contracts for BM-005 through BM-010 with semantic, normalized-DOCX-backed authoring contracts that compile and render clean previews while remaining review-required drafts.

**Architecture:** A reusable refinement pipeline reads exact `{{field.path}}` placeholders from each normalized DOCX and reconciles them against a reviewed per-form profile. It refuses to write when the profile and DOCX differ, preserves original-source provenance, switches authoring extraction provenance to the normalized DOCX, and emits deterministic contracts plus smoke evidence. Existing bespoke runtime panels remain unchanged.

**Tech Stack:** Node.js ESM, PizZip, Docxtemplater, `@qllaw/form-contracts`, Node test runner, pnpm.

---

### Task 1: Lock normalized-placeholder discovery and profile parity

**Files:**
- Create: `scripts/form-refinement/normalized-contract-refinement.mjs`
- Create: `test/form-contract-refinement.test.mjs`
- Create: `scripts/form-refinement/profiles/BM-005.json`
- Create: `scripts/form-refinement/profiles/BM-006.json`
- Create: `scripts/form-refinement/profiles/BM-007.json`
- Create: `scripts/form-refinement/profiles/BM-008.json`
- Create: `scripts/form-refinement/profiles/BM-009.json`
- Create: `scripts/form-refinement/profiles/BM-010.json`

- [ ] Write tests asserting each profile has exact set equality with placeholders in its normalized DOCX.
- [ ] Run the focused Node test and confirm it fails because the refinement module/profiles do not exist.
- [ ] Implement placeholder extraction, paragraph anchors, profile loading, and parity validation.
- [ ] Re-run the focused test and confirm the discovery/parity cases pass.

### Task 2: Build semantic review-required V1 contracts

**Files:**
- Modify: `scripts/form-refinement/normalized-contract-refinement.mjs`
- Modify: `test/form-contract-refinement.test.mjs`
- Modify: `docs/contracts/field-taxonomy.json`

- [ ] Add failing tests for semantic slot IDs, zero generic `.field#` keys, one binding per field, `source=unknown`, `reviewRequired=true`, and V2 adapter compilation.
- [ ] Add the missing namespaces used by the six normalized DOCX packages: `official`, `sourceVerification`, `sourceRequest`, `sourceMaterialRequest`, `sourceTransfer`, `sourceResolutionExtension`, and `sourceSuspension`.
- [ ] Implement deterministic contract construction from the normalized placeholder order and profile metadata.
- [ ] Re-run focused tests and confirm all contract-construction assertions pass.

### Task 3: Add safe write CLI and refine six checked-in contracts

**Files:**
- Create: `scripts/refine-form-contracts-from-normalized-docx.mjs`
- Modify: `package.json`
- Modify: `docs/audit/docx/contracts/BM-005__4cf240724a90.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-006__87ff96f9a866.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-007__549970d471d1.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-008__87981f1c5cf8.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-009__ad542fd7bc45.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-010__3814cd2b4bcf.contract.draft.json`

- [ ] Add a CLI test for selected-code parsing and dry-run behavior.
- [ ] Implement `--codes` plus explicit `--write`; refuse missing profiles, missing contracts, malformed codes, placeholder/profile drift, and non-draft targets.
- [ ] Add `refine:form-contracts` to root scripts.
- [ ] Run the CLI first without `--write`, inspect the proposed counts, then run it with `--write` for BM-005..BM-010.

### Task 4: Render smoke and evidence

**Files:**
- Create: `scripts/smoke-form-refinement.mjs`
- Modify: `package.json`
- Create: `docs/audit/form-authoring-baselines/refinement-BM-005-BM-006-BM-007-BM-008-BM-009-BM-010.md`
- Create: `docs/audit/form-authoring-baselines/refinement-BM-005-BM-006-BM-007-BM-008-BM-009-BM-010.json`

- [ ] Add failing tests proving sample render resolves all placeholders, includes all sample values, preserves non-mutable package parts, and contains no `undefined`/`null`.
- [ ] Implement the in-memory smoke runner and package-integrity evidence.
- [ ] Run smoke for BM-005..BM-010 and inspect the generated report.
- [ ] Attempt visual render with the document renderer; if LibreOffice remains unavailable, record structural-only QA explicitly.

### Task 5: Verify repository behavior and review the diff

**Files:**
- Regenerate: `docs/audit/form-authoring-baselines/selection-BM-005-BM-006-BM-007-BM-008-BM-009-BM-010.md`
- Regenerate: `docs/audit/form-authoring-baselines/selection-BM-005-BM-006-BM-007-BM-008-BM-009-BM-010.csv`

- [ ] Run focused tests and selected-code authoring audit.
- [ ] Run DOCX contract verification and form/runtime smoke gates.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` sequentially.
- [ ] Confirm BM-001 cutover remains Automated YES / Human NO / Active NO.
- [ ] Review every changed file, ensure BM-005..010 remain draft/review-required, and commit one logical batch.

### Failure modes guarded

- A profile silently omits or invents a DOCX field: exact placeholder/profile set equality blocks the write.
- A semantic name does not render: slot IDs remain identical to normalized DOCX placeholders and smoke renders every sample.
- Draft contracts are accidentally treated as verified: every slot, field, and binding remains `reviewRequired=true`, with every source still `unknown`.
- Rendering damages the Word package: smoke compares all preserved OOXML parts.
- The batch regresses runtime behavior: existing bespoke panels are not replaced or removed.

### Out of scope

- Locking or publishing BM-005..BM-010 without human approval.
- Enabling active contract rendering.
- Remediating BM-004, whose normalized DOCX currently has no semantic render placeholders.
