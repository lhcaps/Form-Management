# Runtime Visual Preview Architecture Notes

## Existing runtime session flow

PR #31 added the standalone runtime preview session flow for `/templates/:templateCode`.
`TemplatePreviewWorkspace` calls `createRuntimePreviewSession()`, which POSTs JSON form data to `/api/v1/forms/runtime/:templateCode/preview-session`.
`RuntimeTemplateRenderController` delegates to `RuntimePreviewSessionService`.
The service renders a standalone DOCX with `StandaloneTemplateRenderService`, writes `document.docx` and `metadata.json` under `storage/runtime-preview-sessions/{sessionId}`, runs style audit best-effort, returns JSON metadata, and keeps `persisted: false`.

The current runtime session metadata has `pdfPath: null`, and `buildSessionResponse()` always returns `pdfPreviewUrl: null`.
The PDF endpoint already exists at `/api/v1/forms/runtime/preview-sessions/:sessionId/pdf`; it resolves the session metadata and streams `application/pdf` inline only if `getSessionPdfPath()` reports an existing PDF file.
`POST /api/v1/forms/runtime/:templateCode/render-docx` remains the pure binary DOCX download endpoint and is not part of preview-session JSON metadata.

## Existing PDF infrastructure

Generated-document PDF conversion is implemented by `DocumentPdfService`.
Its public `convertLatestDocxToPdf(documentId, dto)` method is intentionally tied to the persisted generated-document workspace: it reads `generated_documents` and `generated_document_files`, writes `stored_files` and `generated_document_files`, updates `generated_documents.validation_result`, and creates a `case_events` row.

The reusable conversion mechanics inside that service are file-based:
- validate DOCX source integrity with `assertDocxSourceReadyForPdf()`;
- call PowerShell helpers from `apps/api/scripts/pdf-convert-word-com.ps1` and `apps/api/scripts/pdf-convert-fallback.ps1`;
- validate output integrity with `assertPdfOutputIntegrity()` by checking `%PDF-`, non-empty content, and `%%EOF`.

The helpers take server-side source and target paths. They do not need request paths and can be reused for runtime session files if exposed through a filesystem-only boundary.

## Chosen approach

Option A: runtime DOCX -> PDF.

Reason: the repo already has a DOCX-to-PDF conversion path using Word COM and LibreOffice fallback. A browser DOCX renderer would add a new client dependency and weaker DOCX layout fidelity. Runtime sessions already write a temporary DOCX file under a sanitized session directory, so the backend can attempt PDF generation immediately after writing `document.docx`.

The implementation will add a filesystem-level conversion boundary and keep generated-document persistence separate. Runtime preview PDF generation will be best-effort:
- success writes `document.pdf`, records its path in `metadata.json`, and returns a non-null `pdfPreviewUrl`;
- failure keeps the DOCX session downloadable, records no `pdfPath`, and adds a stable `PDF_PREVIEW_UNAVAILABLE` warning.

## Files to change

- `apps/api/src/modules/documents/document-pdf.service.ts`
- `apps/api/src/modules/documents/runtime-preview-session.service.ts`
- `apps/api/src/modules/documents/runtime-preview-session.service.spec.ts`
- `apps/api/src/modules/documents/runtime-template-render.controller.spec.ts`
- `apps/web/src/components/documents/template-preview-workspace.tsx`
- `apps/web/src/components/documents/runtime-pdf-preview.tsx`
- `apps/web/src/lib/runtime-template-preview.test.ts`
- `tests/e2e/preview-panel-honest-ux.spec.ts`
- `tests/e2e/runtime-preview-session.auth.spec.ts`
- `docs/audit/runtime-visual-preview/latest.md`
- `docs/audit/runtime-visual-preview/latest.json`

`docs/PROJECT_SPEC.md` may receive a minimal status update from future/pilot graceful-unavailable to current runtime PDF preview with graceful fallback.

## Risks

- Environment: local or CI machines may not have Word COM or LibreOffice, so conversion must be non-fatal.
- Platform: the existing helpers run through PowerShell; non-Windows environments depend on the fallback helper and available conversion tools.
- Conversion: DOCX files with unresolved placeholders, invalid literals, or malformed ZIP parts must not be exposed as successful PDF previews.
- Browser: inline PDF display varies by browser and user settings; the UI must show a clear fallback if iframe loading fails.
- Performance: conversion can be slower than DOCX render; preview-session remains synchronous for now and should keep failures graceful.
- Cleanup: runtime PDFs live in the same TTL-governed session folder as DOCX and metadata.
- Security: session IDs remain sanitized, runtime paths are server-generated, and the client never supplies a file path.

## Non-goals confirmed

- No case-bound document creation.
- No `generated_documents` writes.
- No `generated_document_files` writes.
- No `generated_document_audit_logs` writes.
- No `stored_files` writes for runtime previews.
- No `/documents/:id` route from standalone template preview.
- No fake `generatedDocumentId`.
- No locked DOCX contract/template mutation.
- No DTO whitelist or `render-docx` contract weakening.

## Authenticated PDF Blob Rendering

The runtime PDF preview requires an authenticated fetch because the PDF endpoint is protected by Clerk Bearer token auth. Direct iframe embedding of the API URL would cause HTTP 401 since iframe navigation cannot attach custom Authorization headers.

### Pattern

1. Backend returns `pdfPreviewUrl` as `/api/v1/forms/runtime/preview-sessions/:sessionId/pdf`
2. Frontend fetches the URL using `fetchRuntimePreviewPdfBlob()` which:
   - Uses `withApiFetchAuthDefaults()` to attach Clerk Bearer token
   - Validates `Content-Type: application/pdf`
   - Returns `Blob`
3. `URL.createObjectURL(blob)` creates a `blob:` URL
4. Iframe `src` is set to the `blob:` URL
5. `URL.revokeObjectURL()` is called on cleanup or when URL changes

### Why this pattern

- iframe navigation cannot attach `Authorization: Bearer <token>` header
- Cookies are sent automatically only if the cookie domain matches the iframe URL origin
- `blob:` URLs are same-origin with the page, so they bypass cross-origin restrictions
- The auth token is attached by the fetch call, not by the iframe navigation
