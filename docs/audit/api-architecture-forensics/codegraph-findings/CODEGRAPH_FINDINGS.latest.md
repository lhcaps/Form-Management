# CodeGraph Findings — API Architecture Forensic Audit

Generated: 2026-07-06
Scope: QLLaw API-side legal form/document/render architecture.
Mode: audit-only. No source code or DOCX contracts were modified.

## CodeGraph Health

```json
{
  "cliFound": "not required for MCP use",
  "projectInitialized": true,
  "cursorMcpConfigured": true,
  "mcpToolAvailableInAgent": true,
  "exploreQuerySucceeded": true,
  "fallbackUsed": false,
  "errors": []
}
```

## Query Map Executed

1. API entry points: controllers, routes, guards, StreamableFile, Content-Disposition.
2. Render workflows: render-docx, preview-session, RenderGeneratedDocumentUseCase, DocxtemplaterContractRenderEngine, RuntimePreviewSessionService, DocumentPdfService.
3. Form payload workflows: form-inputs, render-payload, ContractFormInputsService, UpdateGeneratedDocumentFormInputsDto, render_payload_snapshot, validation_result.
4. Template/contract/DOCX source chain: template catalog, locked contracts, normalized DOCX, template versions, form-contracts, style profiles.
5. Persistence/audit: generated_documents, generated_document_files, generated_document_audit_logs, stored_files, case_events, templates, cases.
6. Auth/RBAC: Clerk guard, qlv_session, Bearer validation, agency-scoped access, generated document access guard.
7. Duplicate/competing systems: legacy renderer, contract renderer, runtime renderer, BM-specific helpers, Form Flight, runtime-ux, ContractV2Renderer, raw fetch, sample/demo paths.
8. Endpoint inventory: DocumentsController, RuntimeTemplateRenderController, FormStudio controllers, FormsCatalogController, TemplatesController, preview/download endpoints.

## High-Confidence Structural Findings

- Runtime template render route is `POST /forms/runtime/:templateCode/preview-session`, implemented by `RuntimeTemplateRenderController.createPreviewSession`, calling `RuntimePreviewSessionService.createPreviewSession`.
- Runtime preview stores DOCX/PDF under `storage/runtime-preview-sessions/<runtime_preview_uuid>/` and returns `persisted: false`. It does not create generated-document DB rows in the inspected service path.
- Runtime direct DOCX route is `POST /forms/runtime/:templateCode/render-docx`, implemented by `StandaloneTemplateRenderService.renderDocx`, using `ContractRenderPlanBuilder` + `DocxtemplaterContractRenderEngine.renderActiveDocx`.
- Generated render route is `POST /documents/generated/:documentId/render-docx`, implemented by `DocumentRendererController.renderDocx`, calling `RenderGeneratedDocumentUseCase.execute`.
- Generated render uses `DocumentRendererRoutingPolicy` with modes `off | legacy | shadow | active` through app config; templates not explicitly enabled route to legacy.
- Legacy generated renderer path is `LegacyDocumentRendererAdapter -> DocumentRendererService.renderDocx`; `DocumentRendererService` is very large and contains many BM-specific payload branches.
- Contract generated renderer path is `ContractDocumentRendererAdapter -> ContractShadowRendererOrchestrator.renderActive -> ContractRenderPlanBuilder -> DocxtemplaterContractRenderEngine`.
- Contract active generated render writes `stored_files`, `generated_document_files`, `generated_documents.validation_result`, and `case_events`, but not `generated_document_audit_logs` in the inspected orchestrator.
- Generated document creation route `POST /documents/cases/:caseId/batches` writes generated documents through `DocumentsService.createBatch` and emits `GENERATED_DOCUMENT_CREATED` audit rows asynchronously.
- Generated file download/delete/bulk-delete/cleanup routes emit generated-document audit log actions and record access-denied events on forbidden paths.
- Form input persistence is split between legacy `POST /documents/generated/:documentId/form-inputs`, contract-v2 `PUT /documents/generated/:documentId/contract-form-inputs`, and BM-031 direct `POST /documents/generated/:id/bm031-direct-form-inputs`.
- Contract form inputs validate required fields, unknown fields, default/system/computed values, and stale contract hash before updating `generated_documents.render_payload_snapshot`.
- Legacy form inputs update `render_payload_snapshot` and `validation_result`, plus `case_events`, with BM-specific DTO shape merging.
- Runtime form contract resolution reads DB `form_contract_versions` first, then falls back to locked-file contracts through `FormContractRepository`.
- `ContractRenderPlanBuilder` reads locked JSON contracts from `docs/audit/docx/contracts/locked` and does not use DB-published contract versions.
- Auth uses `AuthGuard`: public routes may attach optional user; protected routes require either qlv session cookie or Clerk Bearer token resolved to DB official/VIEWER.
- Agency boundary is centralized in `AgencyResourceAccessService`, but coverage varies by service/route; some generated document read/write routes rely on service-specific enforcement rather than controller-level guards.
- Frontend document form helpers include centralized `document-form-api.ts`, but many BM panels still build payloads individually and some helpers declare PATCH/PUT methods not backed by matching Nest routes.
- Runtime UI has at least three active presentation systems: `runtime-ux` profiles, `ContractV2Renderer`, and Form Flight adapters/profiles.

## Evidence Pointers

- `apps/api/src/modules/documents/runtime-template-render.controller.ts`
- `apps/api/src/modules/documents/runtime-preview-session.service.ts`
- `apps/api/src/modules/documents/rendering/application/standalone-template-render.service.ts`
- `apps/api/src/modules/documents/document-renderer.controller.ts`
- `apps/api/src/modules/documents/rendering/application/render-generated-document.use-case.ts`
- `apps/api/src/modules/documents/rendering/application/document-renderer-routing.policy.ts`
- `apps/api/src/modules/documents/rendering/infrastructure/legacy-document-renderer.adapter.ts`
- `apps/api/src/modules/documents/document-renderer.service.ts`
- `apps/api/src/modules/documents/rendering/application/contract-shadow-renderer.orchestrator.ts`
- `apps/api/src/modules/form-studio/application/contract-form-inputs.service.ts`
- `apps/api/src/modules/form-studio/application/runtime-form-contract.service.ts`
- `apps/api/src/modules/auth/auth.guard.ts`
- `apps/api/src/modules/auth/agency-resource-access.service.ts`
- `apps/web/src/lib/document-form-api.ts`
- `apps/web/src/lib/runtime-template-preview.ts`
- `apps/web/src/lib/form-flight/adapters/generated-document-adapter.ts`
- `apps/web/src/lib/form-flight/adapters/template-runtime-adapter.ts`

## Required Static Search Summary

The required `rg` commands were run. Output summaries are reflected in the main report. Large raw outputs were not embedded to avoid secrets/noise and token blow-up. The Unix `find` command requested by the task was not run because workspace tooling rules prohibit `find`; equivalent inventory was collected with `rg --files apps/api/scripts scripts/audit packages/form-contracts`.
