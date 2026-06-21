# BM-019/BM-020 DOCX Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic semantic placeholders to BM-019 and BM-020, refine their draft contracts, and produce structural evidence without changing legal approval or runtime cutover state.

**Architecture:** A shared fail-closed OOXML paragraph editor preserves package parts and exposes exact replacement primitives. BM-specific remediation maps use those primitives, after which the existing normalized-DOCX refinement pipeline generates review-required contracts and previews.

**Tech Stack:** Node.js ESM, `pizzip`, `node:test`, JSON contract/profile files, pnpm workspace scripts.

---

### Task 1: Lock the remediation behavior with failing tests

**Files:**
- Create: `test/docx-contract/test-semantic-template-remediator.test.mjs`
- Create: `scripts/docx-contract/lib/semantic-template-remediator.mjs`

- [ ] **Step 1: Write tests for BM-019 and BM-020**

Cover these behaviors:

- replaces the exact reviewed header/body/recipient/signature anchors;
- preserves an unrelated `word/header1.xml` sentinel byte-for-byte;
- is idempotent when called twice;
- throws when a required anchor is missing;
- throws when a required anchor occurs more than once;
- rejects unsupported template codes.

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test test/docx-contract/test-semantic-template-remediator.test.mjs
```

Expected: FAIL because `semantic-template-remediator.mjs` does not exist.

- [ ] **Step 3: Implement the minimal fail-closed remediator**

The public API is:

```js
export function remediateSemanticTemplate(templateCode, docxBuffer) {}
```

It must edit only `word/document.xml`, use exact BM-specific anchors, preserve
all other package parts, and return a complete DOCX buffer.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
node --test test/docx-contract/test-semantic-template-remediator.test.mjs
```

Expected: all remediator tests pass.

### Task 2: Add a safe CLI and remediate checked-in DOCX files

**Files:**
- Create: `scripts/docx-contract/remediate-semantic-template.mjs`
- Modify: `storage/templates/normalized-docx/BM-019/BM-019_normalized.docx`
- Modify: `storage/templates/normalized-docx/BM-020/BM-020_normalized.docx`
- Modify: `test/docx-contract/test-semantic-template-remediator.test.mjs`

- [ ] **Step 1: Add a failing CLI integration test**

The test runs:

```powershell
node scripts/docx-contract/remediate-semantic-template.mjs BM-019 input.docx output.docx
```

It verifies the output contains reviewed placeholders and the input is
unchanged.

- [ ] **Step 2: Run the focused test and verify RED**

Expected: FAIL because the CLI does not exist.

- [ ] **Step 3: Implement the CLI**

Require exactly a supported BM code plus input/output paths. Refuse in-place
updates unless input and output are explicitly the same resolved path.

- [ ] **Step 4: Run the CLI on BM-019 and BM-020**

```powershell
node scripts/docx-contract/remediate-semantic-template.mjs BM-019 storage/templates/normalized-docx/BM-019/BM-019_normalized.docx storage/templates/normalized-docx/BM-019/BM-019_normalized.docx
node scripts/docx-contract/remediate-semantic-template.mjs BM-020 storage/templates/normalized-docx/BM-020/BM-020_normalized.docx storage/templates/normalized-docx/BM-020/BM-020_normalized.docx
```

- [ ] **Step 5: Re-run remediator tests**

Expected: checked-in templates match the same placeholder invariants and all
tests pass.

### Task 3: Add reviewed semantic profiles

**Files:**
- Create: `scripts/form-refinement/profiles/BM-019.json`
- Create: `scripts/form-refinement/profiles/BM-020.json`
- Modify: `test/form-contract-refinement.test.mjs`

- [ ] **Step 1: Add exact expected field orders to the test**

BM-019 fields:

```text
agency.parentName
agency.name
document.documentCode
document.issuePlaceAndDateLine
official.issuerTitle
initiationRequest.originatingDecisionCode
initiationRequest.originatingDecisionDateText
initiationRequest.originatingIssuerName
initiationRequest.originalOffenseName
initiationRequest.originalLegalArticle
initiationRequest.additionalOffenseName
initiationRequest.additionalLegalArticle
initiationRequest.orderedAuthorityName
recipients.archiveLine
signature.signMode
signature.positionTitle
signature.signerName
```

BM-020 fields:

```text
agency.parentName
agency.name
document.documentCode
document.issuePlaceAndDateLine
official.issuerTitle
initiationRequest.reasonLine
initiationRequest.article1Line
initiationRequest.article2Line
initiationRequest.orderedAuthorityName
recipients.archiveLine
signature.signMode
signature.positionTitle
signature.signerName
```

- [ ] **Step 2: Run the focused refinement test and verify RED**

Run:

```powershell
node --test test/form-contract-refinement.test.mjs
```

Expected: BM-019/BM-020 fail because profiles are missing.

- [ ] **Step 3: Create both profiles**

Every field has `label`, `section`, `uiComponent`, `required`, and a natural
Vietnamese sample. Keep `unresolvedQuestions` empty only where the mapping is
fully determined by the DOCX and bespoke panel.

- [ ] **Step 4: Run the focused refinement test and verify GREEN**

Expected: all existing and new profile/refinement/preview tests pass.

### Task 4: Dry-run and write draft contracts

**Files:**
- Modify: `docs/audit/docx/contracts/BM-019__3c2858f47dad.contract.draft.json`
- Modify: `docs/audit/docx/contracts/BM-020__0f61c04c750d.contract.draft.json`

- [ ] **Step 1: Dry-run**

```powershell
pnpm refine:form-contracts -- --codes BM-019,BM-020
```

Expected:

- BM-019: generic contract becomes 17 semantic fields/bindings.
- BM-020: generic contract becomes 13 semantic fields/bindings.
- no files change.

- [ ] **Step 2: Write only after reviewing counts**

```powershell
pnpm refine:form-contracts -- --codes BM-019,BM-020 --write
```

- [ ] **Step 3: Verify invariants**

Run focused tests and confirm both contracts remain draft, all sources remain
unknown, all field/slot/binding review flags remain true, and parser warnings
are replaced by the normalized-DOCX human-review warning.

### Task 5: Produce evidence and run quality gates

**Files:**
- Create: `docs/audit/form-authoring-baselines/refinement-BM-019-BM-020.json`
- Create: `docs/audit/form-authoring-baselines/refinement-BM-019-BM-020.md`
- Modify: deterministic audit outputs generated by the approved scripts only

- [ ] **Step 1: Run focused smoke and audits**

```powershell
pnpm smoke:form-refinement -- --codes BM-019,BM-020
pnpm audit:form-authoring-baselines -- --codes BM-019,BM-020
pnpm audit:docx:verify
```

- [ ] **Step 2: Run global audits**

```powershell
pnpm audit:form-authoring-baselines
pnpm audit:templates
pnpm audit:form-ui-sync
pnpm audit:encoding
pnpm audit:contract-sync
```

- [ ] **Step 3: Run repository quality gates**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

- [ ] **Step 4: Attempt runtime smoke**

Start the API with the documented stable command, wait for readiness, run
`pnpm smoke:forms-runtime`, and stop the API. If local infrastructure blocks
startup, report the exact blocker without weakening any other gate.

- [ ] **Step 5: Review and commit**

Review every changed file, exclude `.cursor/plans/` and
`storage/form-preview/`, then commit the logical batch. Do not push.
