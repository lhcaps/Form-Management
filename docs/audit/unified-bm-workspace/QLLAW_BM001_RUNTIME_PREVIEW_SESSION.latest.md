# BM-001 Runtime Preview-Session Evidence — latest

> **Generated**: 2026-07-07T21:25:00.000Z
> **Template code**: BM-001
> **Auth strategy**: clerk_ticket_storage_state
> **Auth storage**: `playwright/.clerk/admin.json` (gitignored)
> **Spec**: `tests/e2e/runtime-preview-session.auth.spec.ts`

## Status

- **status**: PASS
- **sourceRenderStatus**: PASS
- **browserVisibilityStatus**: PASS
- **demoClickStatus**: PASS
- **previewClickStatus**: PASS
- **fidelityCompleteClaimed**: false (not claimed; only preview-session metadata was asserted)

## Root cause (snapshot)

The BM-001 preview-session POST was failing in two layered ways:

1. **Frontend short-circuit**: the runtime preview workspace gates `previewDocx()` on the locked-contract `requiredFieldKeys`. With an empty draft the gate fires a "thiếu trường bắt buộc" error and returns without sending the POST. The original `runtime-preview-session.auth.spec.ts` did not click "Dữ liệu demo" before clicking "Xem trước bản in", so `waitForResponse` for `/api/v1/forms/runtime/BM-001/preview-session` never resolved and the test timed out at 30s.
2. **API blocking on PDF conversion**: even with a populated draft, the runtime preview-session service awaited `DocumentPdfService.convertDocxFileToPdf(...)` synchronously and without a timeout. That helper shells out to PowerShell (Word COM / LibreOffice fallback). On environments without a working Office/soffice path the helper can take many minutes — well past any interactive request budget. The session contract already supports `pdfPreviewUrl: null` plus an honest DOCX-only fallback, so PDF is a "nice to have" derived artifact, not a hard dependency.

## Fix

1. **`apps/api/src/modules/documents/runtime-preview-session.service.ts`**: race the PDF conversion against a bounded budget (default `8000ms`, override via `QLLAW_RUNTIME_PREVIEW_PDF_BUDGET_MS`). When the budget is exceeded the session response returns `pdfPreviewUrl: null` plus the `PDF_PREVIEW_UNAVAILABLE` warning, and the orphan conversion is allowed to finish in the background. The DOCX is unaffected either way.
2. **`tests/e2e/runtime-preview-session.auth.spec.ts`**: click "Dữ liệu demo" before clicking "Xem trước bản in" so the locked-contract gate is satisfied and the POST actually fires. This matches the user flow described in the workspace's demo banner.
3. **Status matrix note** (`scripts/audit/status-matrix-213.mjs` + `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{md,json}`): corrected the stale `demoClickVerified/previewClickVerified/fidelityComplete are intentionally false across all rows` note to reflect that `demoClickVerified=true` is now true for the 37 curated forms. `previewClickVerified` remains false except where new evidence is produced; for BM-001, `previewClickVerified` is set true by the per-form status in the matrix.

## Strict product boundary (verified by spec)

- `POST /api/v1/forms/runtime/BM-001/preview-session` returns JSON, not DOCX bytes.
- Response body does **not** start with `PK`.
- Response Content-Type is `application/json`.
- `persisted: false`.
- `sessionId` matches `^runtime_preview_[a-f0-9-]{36}$`.
- `docxDownloadUrl` is `/api/v1/forms/runtime/preview-sessions/<id>/docx`.
- `pdfPreviewUrl` is `null` (DOCX-only fallback on this machine).
- No `generatedDocumentId` in the response.
- No `generated_documents` / `generated_document_files` / `generated_document_audit_logs` writes.
- No `/documents/:id` navigation in the standalone template route.
- "Tải DOCX" button is present and points to the session's DOCX URL.
- No "Lịch sử xử lý" link in the standalone template.
- Save-to-case CTA is disabled.
- No auto-download on preview click.

## Per-form status (BM-001 only — not all 37)

| Code | Source render | Browser verified | Demo click | Preview click | Preview session JSON | Persisted | pdfPreviewUrl | Docx URL | Fallback copy | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| BM-001 | yes | yes | yes | yes | yes | false | null | yes | honest | `pdfPreviewUrl === null` is the supported DOCX-only fallback on this machine. |

The 36 other curated forms in this phase still have `previewClickVerified = false`. The status-matrix note now reflects that honestly.

## Validation commands run

| Command | Exit | Summary |
|---|---|---|
| `pnpm --filter api exec tsc --noEmit` | 0 | API typecheck passes |
| `pnpm --filter api exec jest --runInBand --testPathPatterns="runtime-preview-session"` | 0 | 17 passed (incl. new PDF-budget test) |
| `pnpm --filter api exec jest --runInBand --testPathPatterns="api-render"` | 0 | 21 passed (boundary/orchestrator) |
| `pnpm --filter api exec jest --runInBand --testPathPatterns="runtime-template-render.controller"` | 0 | 8 passed (controller) |
| `pnpm test:e2e:auth -- -g "BM-001"` (preview-session spec) | 0 | 3 passed (clerk setup × 2 + BM-001 standalone in 7.1s) |

## Files changed

- `apps/api/src/modules/documents/runtime-preview-session.service.ts` — bounded PDF race
- `apps/api/src/modules/documents/runtime-preview-session.service.spec.ts` — new test for budget behaviour
- `tests/e2e/runtime-preview-session.auth.spec.ts` — click "Dữ liệu demo" before preview click
- `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md` — note correction
- `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json` — note correction
- `scripts/audit/status-matrix-213.mjs` — generator no longer reverts the note

## Constraints respected

- No DOCX / locked contract / compiled contract / DB / Prisma schema mutation.
- No migration.
- No `qlv_session` for web route.
- No env / secret values logged.
- No commit, push, stage, branch, or PR created.
- `playwright/.clerk/admin.json` not committed.
- `.env.e2e.local` not committed.
- FormFlight `runtimeReady` allowlist not promoted (still BM-001 + BM-171 only).
- FIDELITY_COMPLETE_EVIDENCED not claimed.
- BM-001 preview-click not extended to all 37 forms.

## Remaining risks

- DOCX download/golden fidelity evidence is **not** claimed; this spec asserts session metadata + button click. Full DOCX-byte + golden-evidence work is intentionally out of scope.
- preview-click evidence exists only for BM-001 in this phase. The 36 other curated forms still have `previewClickVerified = false` in the matrix.
- The orphan PDF conversion still consumes CPU/memory until it finishes or the OS terminates the helper process. No correctness risk to the session.