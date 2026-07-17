# API Unification Plan — Legal Template/Form Render Core

Generated: 2026-07-06
Scope: API-side render, payload, validation, persistence, and audit unification.
Constraint: Do not merge `/templates/:code` and `/documents/:id` semantics. Different lifecycle, same core.

## Current State Map

The current architecture is not one render workflow. It is a policy-switched collection of active systems:

- Runtime template preview uses `RuntimeTemplateRenderController` → `RuntimePreviewSessionService` → `StandaloneTemplateRenderService` → `ContractRenderPlanBuilder` → `DocxtemplaterContractRenderEngine`.
- Generated document rendering uses `DocumentRendererController` → `RenderGeneratedDocumentUseCase` → `DocumentRendererRoutingPolicy` → legacy, shadow, or active contract renderer.
- Legacy generated rendering still flows through `DocumentRendererService`, which owns a very large payload builder, BM-specific branches, generated file creation, and validation result updates.
- Contract generated rendering flows through `ContractShadowRendererOrchestrator`, writes `stored_files`, `generated_document_files`, `generated_documents.validation_result`, and `case_events`.
- Generated form input save is split between `POST /documents/generated/:documentId/form-inputs`, `PUT /documents/generated/:documentId/contract-form-inputs`, and BM-031 direct endpoints.
- Runtime contract UI resolution uses `RuntimeFormContractService` with DB-published contract first and locked-file fallback, while runtime rendering via `ContractRenderPlanBuilder` reads locked contract JSON directly.

## Target State Map

```text
ONE API render core
  ├─ RuntimeTemplateAdapter
  │   - no generated_documents writes
  │   - preview-session storage only
  │   - same validation/payload/contract renderer
  └─ GeneratedDocumentAdapter
      - generated_documents snapshot
      - generated_document_files
      - generated_document_audit_logs
      - same validation/payload/contract renderer
```

The route lifecycles stay separate:

- `/templates/:templateCode` and `/forms/runtime/:templateCode/*`: temporary runtime preview/export.
- `/documents/:id` and `/documents/generated/:documentId/*`: persisted generated document workspace.

## API Flow To Keep

- Keep `POST /forms/runtime/:templateCode/preview-session` as non-persisted preview-session flow.
- Keep `GET /forms/runtime/preview-sessions/:sessionId/docx|pdf` as temp session download endpoints.
- Keep `POST /documents/cases/:caseId/batches` as generated workspace creation.
- Keep `POST /documents/generated/:documentId/render-docx` as persisted render trigger.
- Keep `GET /documents/generated/:documentId/form-schema` and `PUT /documents/generated/:documentId/contract-form-inputs` as the strongest current validation model.
- Keep generated file download/delete audit behavior.

## API Flow To Deprecate

- Deprecate `POST /documents/generated/:documentId/form-inputs` after contract adapter parity is proven for active BM panels.
- Deprecate BM-031 direct endpoints after its payload/schema is represented in the shared contract adapter.
- Deprecate frontend PATCH/PUT `form-inputs` helpers unless backend routes are intentionally added.
- Deprecate direct per-BM payload builders as API-side truth; allow them only as UI adapters feeding shared schema.
- Treat audit/remediation scripts as audit-only; never allow them to influence runtime selection.

## Shared Services To Extract

- `ApiRenderOrchestrator`: coordinates contract resolution, payload normalization, validation, render plan build, render engine execution, and adapter persistence.
- `ContractSourceResolver`: returns the exact compiled/locked contract used by both UI schema and render plan.
- `RenderPayloadNormalizer`: accepts form input data and produces flattened render data with explicit provenance.
- `ContractInputValidator`: reusable required/unknown/type/default/computed validator currently closest to `ContractFormInputsService`.
- `RenderArtifactWriter`: writes DOCX/PDF to adapter-provided storage target.
- `RenderAuditEmitter`: emits lifecycle-specific audit events; no-op/session metadata for runtime, generated_document_audit_logs for generated documents.

## Adapters Needed

### RuntimeTemplateAdapter

- Input: `templateCode`, user/session context, form data.
- Contract source: same resolver as generated flow.
- Persistence: writes only runtime preview-session files and metadata.
- DB writes: none.
- Audit: session-local style audit/warnings only unless product later requires a separate runtime access log.

### GeneratedDocumentAdapter

- Input: `documentId`, user context, form data or saved snapshot.
- Authorization: require business user and agency-scoped generated document access.
- Persistence: `generated_documents.render_payload_snapshot`, `generated_document_files`, `stored_files`, `case_events`.
- Audit: `generated_document_audit_logs` for create/save/render/download/export/delete/denied.

## Validation Boundary

- Use one validator for required fields, unknown fields, type checks, defaults, system fields, computed fields, and stale contract hash.
- Frontend validation is advisory only; backend validation is authoritative.
- Runtime preview may return missing-required warnings without persistence.
- Generated document save/render must persist validation result and block invalid persisted render if legal output would be misleading.

## Persistence Boundary

- Runtime adapter must never write `generated_documents`, `generated_document_files`, `generated_document_audit_logs`, `stored_files` related to generated documents, or `case_events`.
- Generated adapter must never write runtime preview-session metadata except for explicit preview-only operations.
- File writes must be lifecycle-scoped: `runtime-preview-sessions` for runtime, generated document storage for generated.

## Audit Boundary

- Runtime: session metadata contains warnings, style audit, missing required fields; no generated audit row.
- Generated: every persisted lifecycle change emits `generated_document_audit_logs` or a deliberate documented exception.
- Access denied on generated document/file operations must emit `GENERATED_DOCUMENT_ACCESS_DENIED` when enough route context exists.

## Migration Sequence

### PR-A: guard runtime selector from skeleton profile takeover

Goal: prevent audit-only/skeleton profiles from being selected at runtime.
Files/areas: `apps/web/src/lib/form-flight`, `apps/web/src/lib/runtime-ux`, profile status checks.
Risk: low-to-medium; UI selection only.

### PR-B: extract shared API render orchestration core

Goal: introduce `ApiRenderOrchestrator`, `ContractSourceResolver`, `RenderPayloadNormalizer`, and `ContractInputValidator` without changing routes.
Files/areas: `apps/api/src/modules/documents/rendering/application`, `apps/api/src/modules/form-studio/application`.
Risk: medium; extraction behind existing code paths.

### PR-C: route runtime preview through shared core

Goal: make runtime preview use the same contract source, validator, payload normalization, and renderer while preserving temp-only persistence.
Files/areas: `RuntimePreviewSessionService`, `StandaloneTemplateRenderService`, new `RuntimeTemplateAdapter`.
Risk: medium; runtime output parity required.

### PR-D: route generated document render through shared core

Goal: make generated render use shared core with `GeneratedDocumentAdapter`; keep route semantics and audit/persistence.
Files/areas: `RenderGeneratedDocumentUseCase`, `ContractShadowRendererOrchestrator`, legacy adapter wrapper.
Risk: high; persisted legal document outputs.

### PR-E: adapterize existing good UI forms

Goal: port BM-001 and BM-171 lessons into safe UI adapters without skeleton takeover.
Files/areas: `apps/web/src/lib/form-flight`, BM profiles, generated workspace panel registry.
Risk: medium; UI behavior.

### PR-F: deprecate duplicate per-BM API helpers

Goal: remove or fence BM direct helpers and unsupported frontend methods after parity.
Files/areas: `document-form-api.ts`, BM panels, BM-031 direct module.
Risk: high; needs route usage telemetry/tests.

## No-Go List

- Do not merge runtime template and generated document route semantics.
- Do not let runtime preview write generated document tables.
- Do not let generated document render bypass agency authorization.
- Do not use sample/demo payloads for legal output.
- Do not let style profiles mutate locked DOCX/source DOCX.
- Do not run mass rollout or remediation scripts during architecture PRs.
- Do not delete audit scripts until runtime references are proven absent.

## First Safe PR After Audit

PR-A only: guard runtime selector from skeleton profile takeover and add narrow tests proving audit-only/skeleton profiles cannot become runtime-selected profiles for `/templates/:templateCode` or `/documents/:id`.
