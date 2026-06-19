# BM-001 Cutover Blocker Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve all five BM-001 conditional-review blockers with reproducible OOXML, print-media, policy, and evidence changes while keeping active cutover disabled.

**Architecture:** A narrow BM-001 OOXML remediator is integrated into the existing normalization pipeline, and the shared format auditor enforces the resulting legal-presentation invariants. The web action panel keeps its screen behavior but is removed from print media through a stable component marker and global print rule.

**Tech Stack:** Node.js ESM, PizZip, NestJS/Jest, Next.js/React/Tailwind CSS, Playwright, Microsoft Word Print Preview.

---

### Task 1: Lock the OOXML remediation contract

**Files:**
- Create: `test/docx-contract/test-bm001-template-remediator.test.mjs`
- Create: `scripts/docx-contract/lib/bm001-template-remediator.mjs`

- [ ] **Step 1: Write failing synthetic-package tests**

Create tests that build a DOCX package containing:

- one red `Tôi: {{receiver.fullName}};` paragraph;
- one `Mẫu số 01/HS` textbox with 8pt runs and no explicit color;
- one unrelated red paragraph;
- one sentinel package part.

Assertions:

```js
assert.doesNotMatch(receiverParagraph, /w:val="FF0000"/u);
assert.match(receiverParagraph, /w:val="000000"/u);
assert.match(formNote, /w:val="000000"/u);
assert.match(formNote, /<w:sz w:val="16"\/>/u);
assert.match(unrelatedParagraph, /w:val="FF0000"/u);
assert.equal(zip.file('word/header1.xml')?.asText(), '<w:hdr>SENTINEL</w:hdr>');
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test test/docx-contract/test-bm001-template-remediator.test.mjs
```

Expected: FAIL because `bm001-template-remediator.mjs` does not exist.

- [ ] **Step 3: Implement the minimal remediator**

Export:

```js
export function remediateBm001Template(docxBuffer) { /* scoped OOXML patch */ }
```

The function must throw an actionable error if `word/document.xml`, the
receiver paragraph, or the form-note textbox is missing.

- [ ] **Step 4: Add a real-template regression**

Read `storage/templates/normalized-docx/BM-001/BM-001_normalized.docx`, apply
the remediator, and assert the same target invariants against the resulting
OOXML.

- [ ] **Step 5: Run the test and verify GREEN**

Run:

```powershell
node --test test/docx-contract/test-bm001-template-remediator.test.mjs
```

Expected: PASS.

### Task 2: Integrate remediation into normalization

**Files:**
- Modify: `scripts/docx-contract/normalize-docx-format.mjs`
- Modify: `scripts/Convert-TemplateSourcesToNormalizedDocx.ps1`
- Modify: `package.json`
- Modify: `storage/templates/normalized-docx/BM-001/BM-001_normalized.docx`
- Modify: `apps/api/storage/templates/normalized-docx/BM-001/BM-001_normalized.docx`

- [ ] **Step 1: Add a failing CLI integration test**

Extend the remediator test to execute the normalization CLI with:

```powershell
node scripts/docx-contract/normalize-docx-format.mjs input.docx output.docx --template-code BM-001
```

Expected RED: output retains the red receiver paragraph because the CLI does not
route by template code yet.

- [ ] **Step 2: Route explicit template codes**

Parse `--template-code`. Apply shared typography first, then
`remediateBm001Template` only for `BM-001`. Reject unknown option syntax.

- [ ] **Step 3: Pass the selected code from PowerShell**

Call:

```powershell
node normalize-docx-format.mjs $targetPath $targetPath --template-code $source.Code
```

- [ ] **Step 4: Regenerate/remediate both tracked copies**

Run normalization on the root copy, copy the resulting bytes to the API copy,
and verify both SHA-256 hashes are equal.

- [ ] **Step 5: Run normalization tests**

Run:

```powershell
node --test test/docx-contract/test-docx-format-normalizer.test.mjs test/docx-contract/test-bm001-template-remediator.test.mjs
```

Expected: PASS.

### Task 3: Make legal color regressions automated blockers

**Files:**
- Modify: `apps/api/src/modules/documents/rendering/infrastructure/docx-format-auditor.ts`
- Modify: `apps/api/src/modules/documents/rendering/infrastructure/docx-format-auditor.spec.ts`

- [ ] **Step 1: Write failing auditor tests**

Add tests proving:

- a red `Tôi: ...` paragraph returns `fail`;
- a black `Tôi: ...` paragraph returns `pass`;
- a form-note textbox lacking explicit black returns `fail`;
- a black 8pt form-note textbox returns `pass`;
- documents without BM-001 identifying content return `not_applicable`.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
pnpm --filter api test -- --runInBand apps/api/src/modules/documents/rendering/infrastructure/docx-format-auditor.spec.ts
```

Expected: FAIL because the checks are absent.

- [ ] **Step 3: Implement `FMT-018` and `FMT-019`**

`FMT-018` scopes to the paragraph containing `Tôi:` and receiver identity
content. `FMT-019` scopes to the textbox containing `Mẫu số 01/HS` and its legal
basis. Applicable violations are hard failures.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same Jest command. Expected: PASS.

### Task 4: Fix BM-001 print/export form coverage

**Files:**
- Modify: `apps/web/src/components/documents/bm-001-form-inputs.tsx`
- Modify: `apps/web/src/app/globals.css`
- Create: `tests/e2e/bm001-print-layout.spec.ts`

- [ ] **Step 1: Write a failing Playwright print-media test**

The test logs in, opens `/documents/17`, verifies the two labeled controls,
switches to print media, and expects:

```ts
await expect(page.locator('[data-bm001-save-panel]')).toBeHidden();
await expect(page.getByLabel('Giới tính')).toBeVisible();
await expect(page.getByLabel('Tên gọi khác')).toBeVisible();
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm exec playwright test tests/e2e/bm001-print-layout.spec.ts --project=chromium
```

Expected: FAIL because the save panel has no stable marker and remains printed.

- [ ] **Step 3: Add the stable marker and print rule**

Add `data-bm001-save-panel` to the action panel and:

```css
@media print {
  [data-bm001-save-panel] {
    display: none !important;
  }
}
```

- [ ] **Step 4: Run the Playwright test and verify GREEN**

Run the same command. Expected: PASS with no relevant console error or API 5xx.

### Task 5: Record the product policy and remediation evidence

**Files:**
- Create: `docs/product/BM-001-rendering-policy.md`
- Create: `docs/reviews/BM-001-remediation-evidence-2026-06-20.md`
- Modify: `docs/product/BM-001-active-cutover-checklist.md`

- [ ] **Step 1: Record the instructional-note policy**

State that the canonical blank source keeps all seven instructions while filled
documents intentionally omit them.

- [ ] **Step 2: Update the checklist without approving cutover**

Mark the five remediation items as technically addressed only after their
evidence exists. Keep the Microsoft Word approval and active-cutover checkbox
unchecked.

- [ ] **Step 3: Generate fresh renderer evidence**

Run:

```powershell
pnpm smoke:bm001-shadow-render
pnpm report:bm001-shadow-evidence
```

Record newest artifact paths and SHA-256 hashes.

- [ ] **Step 4: Verify in Microsoft Word**

Open representative basic, long-content, missing-optional, and diacritics DOCX
files. Check normal view and Print Preview:

- receiver identity line black;
- form note legible on white background;
- pagination and signatures remain stable;
- no repair prompt.

- [ ] **Step 5: Write remediation evidence**

Record automated commands, Word observations, browser observations, hashes, and
the explicit statement that human active approval is still pending.

### Task 6: Full verification and commit

**Files:**
- All files above.

- [ ] **Step 1: Run focused verification**

```powershell
node --test test/docx-contract/test-docx-format-normalizer.test.mjs test/docx-contract/test-bm001-template-remediator.test.mjs test/bm001-cutover-readiness.test.mjs test/bm001-smoke-inspect.test.mjs
pnpm --filter api test -- --runInBand apps/api/src/modules/documents/rendering/infrastructure/docx-format-auditor.spec.ts apps/api/src/modules/documents/rendering/infrastructure/docx-template-renderer.spec.ts apps/api/src/modules/documents/rendering/infrastructure/docxtemplater-contract-render-engine.spec.ts
pnpm exec playwright test tests/e2e/bm001-print-layout.spec.ts --project=chromium
```

- [ ] **Step 2: Run repository gates**

```powershell
pnpm lint
pnpm test
pnpm build
pnpm audit:hardcode
pnpm audit:templates
pnpm audit:encoding
pnpm audit:docx:verify-locked
```

- [ ] **Step 3: Confirm cutover remains gated**

```powershell
pnpm check:bm001-cutover
pnpm check:bm001-cutover -- --require-ready
```

Expected: informational command exits `0`; hard gate exits `2` until the human
review is rewritten and approved.

- [ ] **Step 4: Review diff and commit logical changes**

Never stage the Office lock file. Use focused commits for design, renderer
remediation, web print fix, and final evidence when practical.

