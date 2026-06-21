# BM-023, BM-030, BM-031, BM-033 Contract Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development and superpowers:verification-before-completion. This continuation is executed inline because the user asked to keep progressing in the current run.

**Goal:** Refine BM-023, BM-030, BM-031, and BM-033 into semantic normalized-DOCX-backed authoring contracts and emit a complete sample DOCX artifact for every form while retaining draft and human-review safeguards.

**Architecture:** Reuse the normalized contract refinement pipeline and add only the fidelity controls exposed by this batch. Placeholder discovery will read visible Word text instead of drawing coordinates, reviewed per-form profiles will remain in exact DOCX order, and smoke verification will persist each rendered DOCX with hash and package-integrity evidence.

**Tech Stack:** Node.js ESM, PizZip, Docxtemplater, `@qllaw/form-contracts`, Node test runner, pnpm, OOXML package verification.

---

### Task 1: Lock the four DOCX contracts and visible paragraph evidence

**Files:**
- Modify: `test/form-contract-refinement.test.mjs`
- Modify: `scripts/form-refinement/normalized-contract-refinement.mjs`

- [ ] Add exact ordered placeholder expectations for BM-023, BM-030, BM-031, and BM-033.
- [ ] Add a regression assertion proving BM-031 evidence text excludes drawing position coordinates while retaining visible Word text.
- [ ] Run the focused test and confirm RED because the profiles are absent and current plain-text extraction includes non-visible OOXML values.
- [ ] Restrict paragraph text extraction to visible Word text nodes, tabs, and line breaks.
- [ ] Re-run the focused regression and confirm the coordinate-noise assertion passes.

### Task 2: Add reviewed semantic profiles and taxonomy coverage

**Files:**
- Create: `scripts/form-refinement/profiles/BM-023.json`
- Create: `scripts/form-refinement/profiles/BM-030.json`
- Create: `scripts/form-refinement/profiles/BM-031.json`
- Create: `scripts/form-refinement/profiles/BM-033.json`
- Modify: `docs/contracts/field-taxonomy.json`
- Modify: `test/form-contract-refinement.test.mjs`

- [ ] Define every DOCX placeholder in exact order with Vietnamese label, section, control, required flag, and natural sample.
- [ ] Register the `offense`, `investigation`, `sourceResolutionNotice`, `measure`, and `custody` namespaces before using them.
- [ ] Run focused tests and confirm every profile has exact DOCX parity and every namespace is registered.
- [ ] Confirm every refined contract remains `draft`, `source=unknown`, and `reviewRequired=true`.

### Task 3: Persist complete rendered DOCX artifacts with evidence

**Files:**
- Modify: `scripts/smoke-form-refinement.mjs`
- Modify: `scripts/form-refinement/normalized-contract-refinement.mjs`
- Modify: `test/form-contract-refinement.test.mjs`

- [ ] Add a failing test for deterministic preview artifact metadata: relative path, SHA-256, byte size, and a valid DOCX ZIP containing `word/document.xml`.
- [ ] Add an output helper that writes one preview DOCX per selected BM under `storage/form-preview/form-refinement/<batch>/`.
- [ ] Include artifact path, hash, and byte size in JSON and Markdown evidence.
- [ ] Keep visual QA explicitly `NOT_RUN` when LibreOffice is unavailable; do not treat package verification as visual approval.

### Task 4: Refine contracts and generate the four DOCX outputs

**Files:**
- Modify: `docs/audit/docx/contracts/BM-023__78e4f3906e4c.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-030__0cfa7ae4b177.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-031__ec3276d1eebe.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-033__51058a699877.contract.draft.json`
- Create: `docs/audit/form-authoring-baselines/refinement-BM-023-BM-030-BM-031-BM-033.json`
- Create: `docs/audit/form-authoring-baselines/refinement-BM-023-BM-030-BM-031-BM-033.md`

- [ ] Run refinement without `--write` and inspect field, binding, and generic-field counts.
- [ ] Write the four draft contracts only after exact profile parity passes.
- [ ] Run smoke to create four complete DOCX preview artifacts and evidence.
- [ ] Open every preview package structurally and confirm no unresolved placeholder, missing sample, literal leakage, missing part, or changed preserved part.

### Task 5: Verify the repository and commit one logical batch

**Files:**
- Regenerate: `docs/audit/form-authoring-baselines/audited.md`
- Regenerate: `docs/audit/docx/reports/SLOT-COVERAGE-SUMMARY.md`
- Regenerate: related deterministic JSON/CSV audit evidence

- [ ] Run focused tests and selected-code authoring audit.
- [ ] Run DOCX inventory verification, template audits, UI sync, encoding, and contract sync.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- [ ] Confirm BM-001 remains Automated YES / Human NO / Active NO.
- [ ] Review every diff, exclude `.cursor/plans/` and `storage/form-preview/` from staging, then commit one logical batch without pushing.

### Failure modes guarded

- A profile invents or omits a field: exact ordered parity blocks refinement.
- OOXML drawing coordinates pollute evidence: visible-text extraction ignores non-text element values.
- A preview exists only in memory: smoke persists a DOCX and records path, hash, and size.
- Rendering damages the template: all non-mutable package parts remain byte-identical.
- Automated checks are mistaken for legal approval: status, source, and review flags remain unchanged.
- A zero-placeholder normalized DOCX is falsely called complete: those forms are deferred to a DOCX remediation wave.

### Out of scope

- Locking, approving, or publishing these contracts without human legal review.
- Enabling active contract rendering.
- Reconstructing BM-019 through BM-022, BM-024 through BM-029, BM-032, or BM-034 through BM-036 before their normalized DOCX packages receive semantic placeholders.
