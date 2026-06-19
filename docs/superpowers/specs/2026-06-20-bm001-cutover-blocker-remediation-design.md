# Phase D.2.3B.1 BM-001 Cutover Blocker Remediation Design

## Goal

Resolve the five blockers recorded by the conditional BM-001 human review while
preserving the renderer safety model:

- contract rendering remains `off` or `shadow`;
- active cutover remains blocked until a new human review explicitly approves it;
- fixes are reproducible from source and protected by automated tests.

## Verified Baseline

The design is based on direct inspection on 2026-06-20:

- `ccaf1f1` is the current branch head.
- Automated BM-001 cutover readiness passes.
- Human approval is absent, therefore `--require-ready` exits `2`.
- Microsoft Word Print Preview proves the `Tôi: ...` paragraph is genuinely red.
- The source `.doc` contains seven drafting instructions at the bottom of the
  blank form.
- The normalized template has no active footnote references carrying those
  instructions.
- The top-right `Mẫu số 01/HS` note is present and printable but relies on
  inherited/default color.
- The web form already contains visible `Giới tính` and `Tên gọi khác` controls.
- The BM-001 save panel uses `position: sticky` and can cover those controls in
  paged print/PDF output.

## Chosen Approach

Use deterministic source remediation, not manual Word editing.

The existing normalization pipeline will apply a BM-001-specific OOXML
remediator after the shared typography normalization. The remediator will:

1. turn every run in the receiver identity paragraph containing
   `{{receiver.fullName}}` from red to explicit black;
2. give all visible runs in the top-right `Mẫu số 01/HS` textbox explicit black
   text while retaining the existing 8pt legal-basis typography;
3. preserve all unrelated package parts and unrelated colors.

This produces a reproducible normalized template from the canonical source and
prevents a future normalization run from reintroducing the defect.

## Instructional Footnote Policy

The seven numbered notes in the blank source are drafting instructions, not
content of a completed reception record. Filled BM-001 documents intentionally
omit them because:

- their instructions have already been applied by the form and renderer;
- retaining them consumes legal-document page space and can destabilize
  signature pagination;
- they are not evidence entered or signed by the parties.

The policy will be recorded in a BM-001 product rendering policy document. The
canonical blank source remains untouched and continues to preserve the original
instructions.

## Web Print and Export Behavior

The save/action panel remains sticky for interactive screen use. Under print
media it is hidden completely because it is an application control rather than
document content.

The panel receives a stable BM-001 data attribute so the behavior can be tested
without depending on Tailwind class ordering. `Giới tính` and `Tên gọi khác`
remain ordinary labeled controls and must stay visible under print media.

## Automated Safety Gates

### OOXML remediation tests

Tests will prove:

- the target receiver paragraph has no red run after remediation;
- the receiver paragraph is explicitly black;
- the top-right form note is explicitly black and keeps 8pt runs;
- unrelated red content remains unchanged;
- unrelated DOCX package parts remain byte-identical.

### Format audit

The shared DOCX format auditor will add two hard checks:

- BM-001 receiver identity legal content must not contain red runs;
- `Mẫu số 01/HS` and its legal-basis note must use explicit black text and 8pt
  typography.

These checks are only applicable when their identifying text exists, so other
templates are not forced into BM-001 rules.

### Browser regression

A focused Playwright test will authenticate, open BM-001 document `17`, switch
to print media, and prove:

- the save panel is hidden;
- `Giới tính` remains visible;
- `Tên gọi khác` remains visible;
- no relevant browser console error or API 5xx occurs.

## Artifact and Evidence Flow

1. Run the remediator tests and format-auditor tests.
2. Regenerate/remediate both tracked normalized BM-001 copies.
3. Run the five deterministic shadow scenarios.
4. Inspect the newest DOCX in Microsoft Word and Print Preview.
5. Validate the live web form in screen and print media.
6. Write a remediation evidence report that references hashes and commands.
7. Leave the existing human review conditional and leave active mode disabled.

## Files and Responsibilities

- `scripts/docx-contract/lib/bm001-template-remediator.mjs`
  - narrow OOXML remediation for the two verified BM-001 presentation defects.
- `scripts/docx-contract/normalize-docx-format.mjs`
  - explicit template-code routing into the remediator.
- `scripts/Convert-TemplateSourcesToNormalizedDocx.ps1`
  - passes the selected BM code to the normalization command.
- `test/docx-contract/test-bm001-template-remediator.test.mjs`
  - deterministic unit and real-template regression coverage.
- `apps/api/src/modules/documents/rendering/infrastructure/docx-format-auditor.ts`
  - hard structural regression checks.
- `apps/api/src/modules/documents/rendering/infrastructure/docx-format-auditor.spec.ts`
  - RED/GREEN tests for the new checks.
- `apps/web/src/components/documents/bm-001-form-inputs.tsx`
  - stable print-control marker.
- `apps/web/src/app/globals.css`
  - BM-001 print rule that removes the application action panel.
- `tests/e2e/bm001-print-layout.spec.ts`
  - rendered print-media regression.
- `docs/product/BM-001-rendering-policy.md`
  - policy for drafting instructions and active-cutover boundaries.
- `docs/reviews/BM-001-remediation-evidence-2026-06-20.md`
  - machine and visual remediation evidence without human approval.

## Failure Modes Guarded Against

- A global color replacement corrupts intentional red text in another area:
  remediation is scoped to identified BM-001 containers.
- A future source normalization restores the defects:
  the normalizer receives the template code and reapplies remediation.
- A print fix degrades interactive behavior:
  the action panel is changed only inside `@media print`.
- Automated green checks are mistaken for human approval:
  the existing signed-review parser and active gate are not relaxed.
- Binary copies diverge:
  both tracked normalized template copies are hash-compared after generation.

## Out of Scope

- Enabling `DOCUMENT_RENDERER_MODE=active`.
- Selecting the active-cutover approval checkbox.
- Editing another BM template.
- Changing Prisma schema or renderer persistence.
- Deleting or ignoring the Office lock file while Word is open.

