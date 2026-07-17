# API Architecture Forensic Audit — Form-Management

Generated: 2026-07-06
Executor: Cursor Executor + CodeGraph Auditor
Phase: API_ARCHITECTURE_FORENSIC_AUDIT_DOCX_PHASE_0
Mode: audit-only. No commits, pushes, PRs, source-code edits, DB mutations, DOCX mutations, normalized DOCX mutations, source DOC/DOCX mutations, or staging were performed.

## Executive Verdict

The real architecture is a legal document workflow with two product lifecycles but more than one active implementation path. Runtime template preview correctly behaves as temporary preview-session storage and does not write generated document tables in the inspected path. Generated document workspace is persisted, but rendering, input saving, validation, and audit are split across legacy services, contract-renderer services, Form Studio contract services, BM-specific direct routes, and frontend BM-specific payload builders.

The system is close to the desired target, but not unified. The target should not merge `/templates/:templateCode` with `/documents/:id`; it should keep separate route semantics and force both lifecycles through one shared API render core with two adapters.

Top verdict: **PARTIAL boundary compliance, HIGH duplication risk, CRITICAL unification priority around generated form-inputs/render orchestration.**

## What Is The Real Architecture?

- QLLaw is not a generic form builder; the runtime code confirms a legal case/document workflow with generated documents tied to cases and agencies.
- Runtime template preview flow lives under `/forms/runtime/*` and stores only temporary preview files/metadata.
- Generated document flow lives under `/documents/generated/*` and persists generated document rows, file rows, stored file rows, validation snapshots, case events, and selected audit rows.
- There is already a contract renderer based on locked contracts, render plans, and `DocxtemplaterContractRenderEngine`.
- There is still a large legacy generated renderer (`DocumentRendererService`) with many BM-specific payload decisions.
- `RenderGeneratedDocumentUseCase` is a policy switch, not a single renderer.
- `RuntimeFormContractService` resolves DB-published contract versions before locked-file fallback, but `ContractRenderPlanBuilder` reads locked JSON contracts directly.

## What Is Currently Duplicated?

- Generated render path: legacy renderer vs contract active/shadow renderer.
- Input save path: legacy `form-inputs` vs contract `contract-form-inputs` vs BM-031 direct.
- Payload builders: backend legacy builder, contract validator/normalizer, per-BM frontend builders, Form Flight adapters.
- UI renderers: per-BM panels, generic template panel, `ContractV2Renderer`, runtime-ux profiles, Form Flight profiles.
- Validation: frontend missing-required checks, legacy backend snapshot updates, contract backend validator, render-plan missing-required detection.
- Audit tooling: runtime-ish audit scripts can look like production renderers but are not API runtime.

## What Is Dangerous?

- A generated document can render through different paths depending on `DocumentRendererRoutingPolicy` config and template allowlist.
- Legacy `POST /documents/generated/:documentId/form-inputs` accepts broad BM-specific payloads and updates persisted snapshots without the same contract validation as `ContractFormInputsService`.
- BM-031 direct endpoints write generated document form data outside the standard generated form-input and contract-form-input paths.
- Frontend helper methods declare PATCH/PUT save paths that were not found as backend route decorators.
- Runtime UI contract source can be DB-published while runtime render plan uses locked-file contracts, creating possible UI/render drift.
- Contract active generated render writes case events and file rows but no direct `generated_document_audit_logs` evidence was found in the orchestrator path.

## What Must Be Unified First?

First unify the core contract source, payload normalization, validation, and render orchestration behind a shared API core. Then connect runtime preview via `RuntimeTemplateAdapter` and generated render via `GeneratedDocumentAdapter`. Do not begin by deleting legacy renderer or merging route semantics.

## Product Boundary

### Runtime Template vs Generated Document

| Boundary | Runtime Template | Generated Document |
|---|---|---|
| Route family | `/forms/runtime/*` and frontend `/templates/:templateCode` | `/documents/generated/*` and frontend `/documents/:id` |
| Lifecycle | Temporary preview/export | Persisted legal workspace |
| Storage | `storage/runtime-preview-sessions` | generated document storage + DB rows |
| DB generated-document writes | Must be none | Required |
| Audit | Session metadata/style audit | `generated_document_audit_logs` + `case_events` |
| Source of user input | Runtime payload object | saved `render_payload_snapshot` / contract form inputs |

### Confirmed From README/Spec

The repository rules state that DOCX contracts are source of truth, `/templates/:templateCode` is runtime preview/session, and `/documents/:id` is persisted generated workspace. The code mostly follows this product boundary at the route/storage level.

### Whether Code Respects It

- Runtime preview service returns `persisted: false` and writes temp session files only: **PASS**.
- Generated document creation/render/file management uses DB tables: **PASS**.
- Validation and contract-source boundaries are split: **PARTIAL**.
- Duplicate generated save/render paths create divergent legal output risk: **FAIL until unified**.

## Current API Map

The full route inventory is in `API_ENDPOINT_INVENTORY.latest.csv`.

### Main Modules/Controllers/Services

| Area | Controllers | Services / Use Cases |
|---|---|---|
| Runtime render | `RuntimeTemplateRenderController`, `RuntimeFormContractController` | `RuntimePreviewSessionService`, `StandaloneTemplateRenderService`, `RuntimeFormContractService` |
| Generated documents | `DocumentsController`, `DocumentReviewsController`, `DocumentRendererController`, `DocumentFilesController`, `DocumentPdfController`, `GeneratedDocumentAuditController` | `DocumentsService`, `DocumentRendererService`, `RenderGeneratedDocumentUseCase`, `DocumentFilesService`, `DocumentPdfService`, `GeneratedDocumentAuditService` |
| Contract platform | `ContractFormInputsController`, `DocumentFormSchemaController`, `FormsCatalogController`, Form Studio admin controllers | `ContractFormInputsService`, `DocumentFormSchemaService`, `RuntimeFormContractService`, `FormsCatalogService` |
| Auth/RBAC | `AuthController`, `AdminAuthIdentitiesController`, `FormPermissionsController` | `AuthService`, `AuthGuard`, `AgencyResourceAccessService`, permission services |

## Runtime Template Flow

- Frontend route/component: `/templates/:templateCode`, `template-preview-workspace.tsx`, runtime preview/export helpers, Form Flight template runtime adapter.
- API endpoints: `GET /forms/runtime/:templateCode`, `POST /forms/runtime/:templateCode/preview-session`, `GET /forms/runtime/preview-sessions/:sessionId/docx`, `GET /forms/runtime/preview-sessions/:sessionId/pdf`, `POST /forms/runtime/:templateCode/render-docx`.
- Services: `RuntimeFormContractService`, `RuntimePreviewSessionService`, `StandaloneTemplateRenderService`.
- Renderer: `ContractRenderPlanBuilder` + `DocxtemplaterContractRenderEngine.renderActiveDocx`.
- Storage: `storage/runtime-preview-sessions/<sessionId>/document.docx`, optional `document.pdf`, `metadata.json`.
- DB writes: none found in runtime preview session path.
- Audit writes: style audit stored in session metadata, not generated-document audit logs.
- Risks: contract source drift between runtime UI resolver and render plan builder; validation not identical to generated contract save.

## Generated Document Flow

- Frontend route/component: `/documents/:id`, generated workspace, generic/BM-specific form panels, `document-form-api.ts`, generated document adapters.
- API endpoints: generated document list/detail/history/review, render-payload, form-inputs, contract-form-inputs, form-schema, render-docx, convert-pdf, file download/delete/cleanup, audit.
- Services: `DocumentsService`, `DocumentRendererService`, `ContractFormInputsService`, `DocumentFormSchemaService`, `RenderGeneratedDocumentUseCase`, `DocumentPdfService`, `DocumentFilesService`.
- Renderer: policy-routed legacy/shadow/active contract renderer.
- DB writes: `generated_documents`, `generated_document_files`, `stored_files`, `case_events`, selected `generated_document_audit_logs`.
- Audit writes: creation, download, delete, bulk-delete, cleanup, denied; render/save audit consistency needs follow-up.
- Risks: duplicate save validators and policy-routed render divergence.

## Renderer Architecture

### Contract Renderer

The contract renderer consists of:

- `ContractRenderPlanBuilder`: loads locked JSON contracts, maps form data to fields/bindings, detects missing required values, and validates transforms.
- `DocxtemplaterContractRenderEngine`: applies bindings to DOCX and style-profile post-processing.
- `ContractShadowRendererOrchestrator`: drives shadow/active generated renders and persists active generated artifacts.
- `StandaloneTemplateRenderService`: uses the same lower renderer for runtime template DOCX output.

### Legacy Adapter

`LegacyDocumentRendererAdapter` delegates to `DocumentRendererService.renderDocx`. This keeps old generated rendering active for templates not routed to contract mode. It is the largest duplication risk.

### Routing Policy

`DocumentRendererRoutingPolicy` returns `legacy`, `shadow`, or `active` based on config mode and enabled template list. This means output can differ by deployment/config if template coverage is not complete.

### Style Profiles

Style profiles for BM-001/BM-171 apply post-render styling and text/drop rules without mutating locked DOCX. They are useful but dangerous if profile selection is too broad or skeleton/audit-only profiles can take over runtime.

### PDF Conversion

- Runtime preview uses `DocumentPdfService.convertDocxFileToPdf` best-effort and falls back to DOCX if unavailable.
- Generated flow uses `POST /documents/generated/:documentId/convert-pdf` to convert latest generated DOCX and persist PDF artifacts.

## Payload / Validation Architecture

### DTOs

- Runtime: `CreatePreviewSessionDto`, `RenderRuntimeTemplateDocxDto` accept optional data object.
- Generated legacy: `UpdateGeneratedDocumentFormInputsDto`, `RenderGeneratedDocumentDto`, pre-export DTOs.
- Generated contract: `SaveContractFormInputsDto` with `contractHash` and `data`.

### Form Inputs Save

- Legacy save updates `generated_documents.render_payload_snapshot` and `validation_result`, plus `case_events`.
- Contract save resolves contract by hash/source, applies defaults/system/computed values, validates required/type/unknown fields, then updates the snapshot.
- BM-031 direct save is a dangerous BM-specific bypass.

### Required Fields / Missing Required

- Contract input validator has strongest missing-required enforcement.
- Render plan detects missing required for rendering and exposes warnings/missingRequired.
- Frontend BM panels also perform local missing-required checks, but those are advisory and inconsistent.

### Placeholder / Stale Fallback / Sample Data

- Render plan bindings can apply fallbacks.
- Style profiles can replace/drop text post-render.
- Sample/demo endpoints and scripts exist and must be fenced from persisted legal output.

## Persistence / Audit Architecture

### Prisma Write Map

| Table | Writers / Paths |
|---|---|
| `generated_documents` | `DocumentsService.createBatch`, legacy form save, contract form save, legacy/contract render, review/status paths |
| `generated_document_files` | legacy render, contract active render, PDF conversion, file delete/cleanup |
| `generated_document_audit_logs` | `GeneratedDocumentAuditService` from creation/file operations/audit paths |
| `stored_files` | generated render/file import/PDF/form preview paths |
| `case_events` | generated creation/render/save/review and case domain updates |
| `templates`, `template_versions` | template catalog/normalizer/import/publish flows |
| `form_contract_versions` | Form Studio publish/archive/contract resolution |
| `cases`, `case_people`, `case_events` | case workspace and generated document context |

### Missing Audit Points

- Legacy/contract form input save paths do not show consistent generated-document audit events.
- Contract active generated render records `case_events` but no direct generated-document audit log in inspected orchestrator.
- PDF conversion audit behavior requires follow-up in `DocumentPdfService`.

## Auth/RBAC Boundary

### Authentication Mechanisms

- `AuthGuard` accepts legacy session cookie (`qlv_session` equivalent via configured cookie name) and Clerk Bearer token.
- Clerk identities resolve to DB officials through `auth_identities`; unknown Clerk users become safe VIEWER identities.
- Global auth likely protects most routes unless `@Public` is applied; runtime controller did not show explicit public decorator.

### Generated Document Authorization

- `AgencyResourceAccessService` provides business-user and agency-scoped generated document/file access checks.
- File download/delete flows show explicit access-denied audit handling.
- Some generated document read/render/save flows rely on service-level enforcement; controller evidence alone is not sufficient.

### Runtime Template Access

Runtime template preview does not need generated document authorization because it should not touch persisted document rows. It still may require authentication globally depending on app guard/public decorator configuration.

### Risks

- Generated endpoints must consistently call agency access checks before reads/writes.
- Runtime endpoints must never accidentally call generated adapters.
- VIEWER Clerk identities must not access business generated documents.

## Duplicate / Competing Systems

See `API_DUPLICATION_AND_DEAD_CODE.latest.json` for the full register.

| ID | Severity | System | Recommendation |
|---|---|---|---|
| DUP-001 | CRITICAL | Legacy generated renderer | Wrap then deprecate behind unified core |
| DUP-004 | CRITICAL | Legacy generated form-inputs save | Deprecate after contract parity |
| DUP-006 | CRITICAL | BM-031 direct form input save | Manual review, then adapterize/deprecate |
| DUP-007 | HIGH | BM-specific frontend payload builders | Convert to UI adapters feeding shared schema |
| DUP-008 | HIGH | Unsupported frontend helper methods | Remove or add intentional backend routes |
| DUP-012 | HIGH | Style-profile post-processing | Keep but fence selection and tests |
| DUP-013 | MEDIUM | Audit-only render scripts | Keep as audit-only; do not use as runtime truth |

## Dead Code / Audit-Only Code

Audit/remediation scripts under `scripts/audit` include render, apply, review, plan, and signoff tooling. They are useful evidence generators but must not be treated as API runtime. Any `apply-*` script should be considered dangerous until manually reviewed because it can mutate source DOCX/contracts or related artifacts when invoked with write flags.

## BM-001 / BM-171 Lessons

- BM-001 demonstrates that a focused UI adapter can map a good form experience into the existing generated-document save/render flow.
- BM-171 demonstrates that profile-driven adapter/render improvements can fix complex layout needs without mutating locked DOCX.
- Skeleton takeover happened because profile/adapter selection can choose incomplete or audit-oriented profiles at runtime if not explicitly guarded.
- Prevent globally by adding profile status metadata, disallowing skeleton/audit-only statuses in runtime selectors, and testing both runtime and generated adapter selection.

## Target Unified API Workflow

```text
Request route
  -> lifecycle adapter selection
  -> shared contract source resolver
  -> shared payload normalizer
  -> shared contract input validator
  -> shared render plan builder
  -> shared DOCX renderer
  -> lifecycle persistence adapter
  -> lifecycle audit adapter
```

Runtime adapter persists only preview-session files. Generated adapter persists generated document snapshots/files/audit rows.

## Migration Plan

1. PR-A: guard runtime selector from skeleton profile takeover.
2. PR-B: extract shared API render orchestration core.
3. PR-C: route runtime preview through shared core.
4. PR-D: route generated document render through shared core.
5. PR-E: adapterize existing good UI forms.
6. PR-F: deprecate duplicate per-BM API helpers.

## Appendix A — Full Endpoint Inventory

See `API_ENDPOINT_INVENTORY.latest.csv`.

## Appendix B — CodeGraph Findings

See `codegraph-findings/CODEGRAPH_FINDINGS.latest.md`.

## Appendix C — Call Graphs

See `API_RENDER_WORKFLOW_GRAPH.latest.json`.

## Appendix D — Duplicate/Dead Code Register

See `API_DUPLICATION_AND_DEAD_CODE.latest.json`.
