# TESTING_STRATEGY.md — Testing Layers, Coverage & E2E

> **Source:** Extracted from `docs/PROJECT_SPEC.md` §11.
> **Canonical reference:** `docs/PROJECT_SPEC.md` is the master spec.

---

## 1. Test Layers

### 1.1 Backend Unit/Integration Tests

```
✓ preview-session returns JSON (not PK)
✓ sessionId/fileName/fileSizeBytes/persisted=false
✓ no Content-Disposition on create session
✓ docx endpoint returns attachment
✓ missing/expired session → 404
✓ path traversal rejected
✓ no generated_documents rows created
✓ no generated_document_files rows created
✓ no generated_document_audit_logs rows created
✓ /render-docx remains download-only
✓ DTO whitelist still rejects unknown body fields
```

### 1.2 Frontend Tests

```
✓ /templates/:code shows "Xem trước bản in"
✓ click preview → preview-session (not render-docx)
✓ no auto-download on preview
✓ Tải DOCX uses session docx URL
✓ no "Lịch sử xử lý" in standalone
✓ if no visual preview → "Đã tạo file DOCX tạm thời"
✓ save-to-case CTA disabled unless real flow exists
✓ generated document workspace preview/history still render
```

### 1.3 Playwright E2E

```
✓ Protected web routes use Clerk-authenticated Playwright storageState
✓ Do NOT use qlv_session cookie to test Clerk web routes
✓ Clerk E2E uses ticket strategy, not password/MFA form automation
✓ global.setup.ts creates Clerk session and saves playwright/.clerk/admin.json
✓ Authenticated specs reuse storageState from playwright/.clerk/admin.json
✓ E2E user must be linked with active official in DB identity projection
✓ Do NOT commit auth state, token, cookie, password
```

---

## 2. Validation Gates (Standard Commands)

```bash
pnpm --filter api test --runInBand
pnpm --filter api lint
pnpm --filter api exec tsc --noEmit
pnpm --filter web lint
pnpm --filter web exec tsc --noEmit
pnpm typecheck
pnpm lint
pnpm audit:hardcode
pnpm audit:locked-compiled
pnpm audit:contract-sync
pnpm build
```

---

## 3. Runtime Preview Smoke Checklist

```
□ /templates/BM-001
□ click "Xem trước bản in"
□ POST /preview-session returns JSON, not PK
□ no auto-download
□ panel appears with honest UX
□ Tải DOCX downloads from /preview-sessions/:sessionId/docx
□ no "Lịch sử xử lý"
□ save-to-case CTA disabled unless real flow exists
□ /documents/:id preview/history still works
```

---

## 4. Authenticated E2E Setup

### 4.1 Command

```bash
pnpm test:e2e:auth
```

### 4.2 Expected Env

```
dotenv loads .env.e2e.local
CLERK_PUBLISHABLE_KEY available
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY available
CLERK_SECRET_KEY available
E2E_CLERK_USER_EMAIL available
No E2E_CLERK_USER_PASSWORD required
```

### 4.3 Expected Auth Flow

```
□ Clerk sign-in ticket created through Backend API
□ Clerk SDK loaded in browser
□ signIn.create({ strategy: "ticket" }) succeeds
□ setActive() succeeds
□ storageState saved to playwright/.clerk/admin.json
□ /templates/BM-001 loads without redirect to sign-in
```

### 4.4 Expected Runtime Preview E2E

```
□ click "Xem trước bản in"
□ POST /api/v1/forms/runtime/BM-001/preview-session returns JSON, not PK
□ no Content-Disposition on preview-session response
□ panel shows "Đã tạo file DOCX tạm thời" when pdfPreviewUrl is null
□ "Tính năng xem trước PDF đang được phát triển" visible
□ no "Đã tạo bản xem trước" when no visual preview exists
□ no "Lịch sử xử lý"
□ save-to-case CTA disabled
□ click "Tải DOCX"
□ DOCX download starts with PK
```

---

## 5. E2E Failure Triage

| Symptom | Check |
|---------|-------|
| Redirect to sign-in | Clerk session/storageState |
| Sign-in succeeds but app denies access | `auth_identities` → `official` mapping |
| Env missing | `.env.e2e.local` and dotenv load order |
| **Never fallback to `qlv_session` for Clerk web routes** | — |

---

## 6. No API-Equivalent Substitutes for UI Click Flows

Critical path **must** have E2E or smoke tests.

```
Do NOT accept "API equivalent" for UI flows that require real clicks.
Form must test: happy path, validation error, loading, disabled, permission denied.
Visual UI important for critical flows → screenshot/visual regression when appropriate.
```

---

*Canonical source: `docs/PROJECT_SPEC.md §11`*
