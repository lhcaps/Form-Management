# Runtime Visual Preview Audit

Generated: 2026-07-02T22:47:10.3827366Z
Scope: PR #33 runtime DOCX to inline PDF preview for standalone templates.
Decision: PASS

## Implementation

- Runtime preview sessions still render and persist only temporary DOCX/PDF files under runtime session storage.
- `pdfPreviewUrl` is returned only when `document.pdf` exists for the temporary session.
- PDF conversion failures keep DOCX preview/download usable and return stable `PDF_PREVIEW_UNAVAILABLE` warning metadata.
- The standalone template UI shows an inline PDF iframe when available and an honest DOCX-only fallback when unavailable.
- Runtime artifact paths from the API are resolved to the API origin before iframe rendering or file download.
- No `generated_document` rows, audit rows, locked DOCX templates, or compiled form contracts were changed.

## Validation

| Gate | Result | Evidence |
| --- | --- | --- |
| `pnpm build` | PASS | contracts, API, and web production builds completed |
| `pnpm --filter api test --runInBand` | PASS | 64 suites, 522 tests passed |
| `pnpm test:web-unit` | PASS | 139 web unit tests passed |
| `pnpm --filter api lint` | PASS | ESLint completed |
| `pnpm --filter web lint` | PASS | ESLint completed |
| `pnpm --filter api exec tsc --noEmit` | PASS | TypeScript completed |
| `pnpm --filter web exec tsc --noEmit` | PASS | TypeScript completed |
| `pnpm test:e2e:auth` | PASS | 5 authenticated Playwright tests passed, including API-origin iframe assertion |
| `pnpm audit:hardcode` | PASS | Runtime hardcode audit passed |
| `pnpm audit:locked-compiled` | PASS | 213/213 locked contracts consistent |
| `pnpm audit:contract-sync` | PASS | DB compare matched 213/213, missing 0, stale 0 |
| Secret-pattern scan | REVIEWED | Existing docs/placeholders and one unit-test fake key matched; no generated session/auth file remained in git status |
| Forbidden generated-file status check | PASS | `.env.local`, `.env.e2e.local`, Playwright auth state, reports, test results, and runtime session output absent from git status |
| Locked contract/template diff guard | PASS | No `packages/form-contracts`, locked DOCX, `.docx`, or `.doc` paths changed |
| `git diff --check` | PASS | No whitespace errors |

## Notes

- Local commands emitted the repo's existing engine warning because this shell uses Node v24.14.0 while `package.json` wants `>=22 <23`; all validation gates above still passed.
- `audit:locked-compiled` regenerated timestamp-only `sot-gates-v1` files during validation; those generated changes were restored and are not part of this PR.
- The pre-existing untracked `docs/Project Spec/` folder was not modified or staged.

## Post-Merge Bug Fix: Authenticated Blob Preview

**Problem:** The original PR embedded the protected API PDF URL directly as iframe `src` (`/api/v1/forms/runtime/preview-sessions/:sessionId/pdf`). Browser iframe navigation cannot attach the Clerk Bearer token that the authenticated API client uses, causing the API to return HTTP 401 JSON instead of the PDF.

**Root Cause:** `iframe.src = resolvedApiUrl` navigates without custom headers. The API requires Bearer authentication but iframe navigation only sends cookies automatically. Without a matching session cookie, the request fails.

**Fix:** Fetch the PDF using the existing authenticated frontend API client, convert to a Blob, create a `blob:` object URL via `URL.createObjectURL(blob)`, and render the iframe from that blob URL.

**Implementation:**
- Added `fetchRuntimePreviewPdfBlob()` helper in `runtime-template-preview.ts` that:
  - Attaches Clerk Bearer token via `withApiFetchAuthDefaults()`
  - Validates `Content-Type: application/pdf`
  - Returns `Blob` for the caller to manage lifecycle
- Updated `RuntimePdfPreview` component to:
  - Fetch PDF blob on mount or when `pdfUrl` changes
  - Create `blob:` URL and set as iframe `src`
  - Revoke object URL on cleanup and when URL changes
  - Show honest fallback on fetch error (no raw JSON 401 rendered)
- "Mở PDF" now opens the blob URL in a new tab when available, disabled otherwise.

**Invariants preserved:**
- pdfPreviewUrl is still returned by backend as `/api/v1/forms/runtime/preview-sessions/:sessionId/pdf`
- PDF endpoint remains protected (no public endpoint added)
- Token never appears in URL query string
- Iframe never renders raw API URL directly
- DOCX download unchanged
