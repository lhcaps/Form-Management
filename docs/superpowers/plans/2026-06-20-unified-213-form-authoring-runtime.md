# Unified 213-Form Authoring Runtime Implementation Plan

> **For Codex:** Use `superpowers:executing-plans` task by task. Every behavior change starts with a failing test and ends with focused verification.

**Goal:** Make all 213 standard BM templates openable in Form Studio from their own normalized DOCX and V1 contract, while keeping normal-user runtime restricted to published V2 or locked V1 artifacts.

**Architecture:** Authoring and runtime use separate resolvers. Form Studio materializes an agency-scoped V2 draft from a deterministic authoring baseline. `/documents` and `/admin/form-studio` consume one catalog projection but apply different lifecycle rules. Existing bespoke panels remain runtime fallback and are not the authoring source of truth.

**Tech Stack:** NestJS, Prisma/MySQL, Next.js/React, TypeScript, Zod, Jest, Node test runner, pnpm workspace.

---

## Scope controls

- Preserve unrelated in-progress BM component changes already present in the worktree.
- Do not enable `DOCUMENT_RENDERER_MODE=active`.
- Do not expose V1 draft or V2 draft through normal-user runtime.
- Do not label extracted contracts as legally or semantically verified.
- Do not create 213 new React components.
- Do not delete existing bespoke or generic fallback components.

## Task 1: Lock authoring resolver behavior with tests

**Files:**

- Create: `apps/api/src/modules/form-studio/application/authoring-contract.service.spec.ts`
- Modify: `apps/api/src/modules/form-studio/application/authoring-contract.service.ts`
- Modify: `apps/api/src/modules/form-studio/domain/authoring-contract.types.ts`
- Modify: `apps/api/src/modules/forms-contracts/domain/form-contract.ts`
- Modify: `apps/api/src/modules/forms-contracts/infrastructure/file-form-contract.repository.ts`

**Test first:**

- BM-004 V1 draft resolves to `EXTRACTED_NEEDS_REVIEW`, not `GENERIC_FALLBACK`.
- Locked V1 wins over a draft duplicate.
- Existing `DRAFT`/`CHANGES_REQUESTED` returns editable version.
- `IN_REVIEW`/`APPROVED` returns the existing version read-only.
- `PUBLISHED` becomes the base for a new version.
- V1 contract without normalized DOCX fails materialization with `NORMALIZED_DOCX_REQUIRED`.
- Missing V1 and normalized DOCX fails with `AUTHORING_BASE_NOT_FOUND`.
- Two concurrent `openDesign()` requests return the same winning draft.

**Implementation notes:**

- Preserve extraction provenance in `LoadedFormContract`.
- Return the real template identity, not the contract-version id, in baseline metadata.
- Do not classify a sparse extracted V1 contract as generic merely because field count is low; use a warning such as `EXTRACTION_SPARSE`.
- Catch Prisma `P2002` on the scope/version unique key, load the winning editable version, and return it as an idempotent success.
- Require normalized DOCX before creating a new DB draft.
- Keep DB read-only records openable without creating another draft.

**Focused verification:**

```powershell
pnpm --filter api test --runInBand --testPathPatterns=authoring-contract.service
pnpm --filter api exec tsc --noEmit
```

## Task 2: Make the platform catalog lifecycle-correct

**Files:**

- Create: `apps/api/src/modules/form-studio/application/form-platform-catalog.service.spec.ts`
- Modify: `apps/api/src/modules/form-studio/application/form-platform-catalog.service.ts`
- Modify: `apps/api/src/modules/form-studio/form-studio.controller.ts`
- Modify: `apps/api/src/modules/form-studio/form-studio.module.ts`

**Test first:**

- A non-published agency draft never produces `AGENCY_PUBLISHED`.
- A non-published global draft never produces `GLOBAL_PUBLISHED`.
- Agency published V2 wins over global published V2.
- Global published V2 wins over locked V1.
- Locked V1 is available as `LOCKED_FILE`.
- Draft V1 remains authoring-openable but runtime falls back to the registered legacy renderer.
- `NOT_INITIALIZED` is returned when no agency V2 version exists.
- Stage boundaries use the canonical `01..09` ranges, including BM-030 in stage `01`.
- Catalog returns exactly one item per DB template identity.

**Implementation notes:**

- Select authoring lifecycle and runtime lifecycle independently.
- Filter DB runtime candidates by `status === "PUBLISHED"` and non-null compiled artifact.
- Use `templates.stage_code` when present; otherwise use `FORM_STAGES`.
- Report `LEGACY_BESPOKE` or `GENERIC_FALLBACK` from a deterministic renderer-capability manifest.
- Make catalog readable by authenticated normal users for runtime metadata; expose authoring metadata only to permitted admin callers or keep the current endpoint admin-only and make `/documents` use a public runtime projection. Do not require `FORM_TEMPLATE_EDIT` merely to render the normal document catalog.

**Focused verification:**

```powershell
pnpm --filter api test --runInBand --testPathPatterns=form-platform-catalog.service
pnpm --filter api exec tsc --noEmit
```

## Task 3: Complete the open-design API contract

**Files:**

- Modify: `apps/api/src/modules/form-studio/application/admin-form-templates.service.spec.ts`
- Modify: `apps/api/src/modules/form-studio/application/admin-form-templates.service.ts`
- Modify: `apps/api/src/modules/form-studio/form-studio.controller.ts`

**Test first:**

- `POST /admin/form-templates/:id/open-design` delegates to authoring, never runtime.
- Invalid numeric template id returns a structured `FORM_TEMPLATE_NOT_FOUND` instead of a raw `BigInt` exception.
- Read-only versions return a `draftId`/version id that the editor can open.

**Focused verification:**

```powershell
pnpm --filter api test --runInBand --testPathPatterns=admin-form-templates.service
```

## Task 4: Use the unified catalog in Form Studio

**Files:**

- Create: `apps/web/src/lib/form-platform-catalog.ts`
- Create: `apps/web/src/lib/form-platform-catalog.test.ts`
- Modify: `apps/web/src/lib/form-studio-api.ts`
- Modify: `apps/web/src/components/form-studio/form-studio-workspace.tsx`

**Test first:**

- Lifecycle labels map to the seven approved Vietnamese states.
- Primary actions map correctly for all states.
- Baseline banner distinguishes locked, extracted-needs-review, and generic fallback.
- Sparse extraction displays “Extraction còn thô”.

**Implementation notes:**

- Replace `listFormStudioTemplates()` as the catalog source with `listFormPlatformCatalog()`.
- Keep version history loading only after a template/version is opened.
- Type the authoring baseline response; remove `unknown` parsing.
- Ensure every lifecycle action is clickable:
  - read-only states open the existing version;
  - published creates the next editable version;
  - archived opens history.
- Slot input must use slots originating from the selected baseline contract rather than unrestricted free text.

**Focused verification:**

```powershell
pnpm test:web-unit
pnpm --filter web exec tsc --noEmit
```

## Task 5: Collapse `/documents` to one canonical collection

**Files:**

- Modify: `apps/web/src/lib/form-platform-catalog.ts`
- Modify: `apps/web/src/lib/form-platform-catalog.test.ts`
- Modify: `apps/web/src/components/documents/template-selector-workspace.tsx`

**Test first:**

- Merging static legal metadata with platform catalog yields one item per `templateCode`.
- Recommendations only sort/filter the canonical collection.
- Runtime badge is derived from runtime source, not authoring status.
- Draft V2 and draft V1 are never selected as runtime renderer.

**Implementation notes:**

- Retain `vksTemplateCatalog` only for legal title/search/recommendation metadata that is not yet in DB.
- Overlay DB/catalog state by `templateCode`.
- Render one card collection; remove the second repeated recommendation card list.
- `AGENCY_PUBLISHED`/`GLOBAL_PUBLISHED` selects V2 renderer, `LOCKED_FILE` selects locked contract-driven runtime, bespoke/generic sources keep existing fallback.

**Focused verification:**

```powershell
pnpm test:web-unit
pnpm --filter web exec tsc --noEmit
```

## Task 6: Replace the static baseline report with a reusable per-BM gate

**Files:**

- Create: `test/form-authoring-baselines.test.mjs`
- Modify: `scripts/audit-form-authoring-baselines.mjs`
- Modify: `package.json`
- Regenerate: `docs/audit/form-authoring-baselines/matrix.csv`
- Regenerate: `docs/audit/form-authoring-baselines/audited.md`
- Create: `docs/forms/FORM_REFINEMENT_WORKFLOW.md`

**Test first:**

- Corpus has exactly 213 unique `BM-001..BM-213` codes.
- Every code has normalized DOCX and V1 authoring source.
- Locked contract selection is deterministic.
- BM-139 records canonical and alternate provenance deterministically.
- Field and binding counts in the matrix match the selected V1 contract.
- `--codes BM-004,BM-027` limits the evidence report to those forms while still validating code syntax.

**Implementation notes:**

- Reuse the same stage ranges and quality rules as application code.
- Add script:

```json
"audit:form-authoring-baselines": "node scripts/audit-form-authoring-baselines.mjs"
```

- Add a repeatable form-refinement workflow:
  1. inspect canonical DOCX and extraction;
  2. reconcile fields/slots/bindings;
  3. edit in Form Studio;
  4. run selected-code audit;
  5. preview DOCX and inspect package;
  6. record human review;
  7. only then approve/publish.
- The audit is a backlog/evidence matrix, not a legal-completeness certificate.

**Focused verification:**

```powershell
pnpm test:node
pnpm audit:form-authoring-baselines
pnpm audit:form-authoring-baselines -- --codes BM-004
```

## Task 7: End-to-end and regression verification

**Files:**

- Modify only if a failing gate exposes a scoped defect.

**Run sequentially:**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit:templates
pnpm audit:form-authoring-baselines
pnpm audit:contract-sync
pnpm audit:form-ui-sync
pnpm smoke:bm001-shadow-render
pnpm check:bm001-cutover
```

**Acceptance evidence:**

- BM-004 authoring opens without `RUNTIME_CONTRACT_NOT_FOUND`.
- BM-004 normal runtime remains unavailable until published/locked.
- Catalog count is 213 with one item per BM.
- Form Studio shows real lifecycle and baseline provenance.
- `/documents` has one canonical collection and honest renderer badges.
- Active renderer remains disabled.
- BM-001 remains Automated YES / Human NO / Active NO.
