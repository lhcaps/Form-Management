# QLLaw / QUANLYVKS — Project Operating Specification

> **File này là spec thực thi, không phải tài liệu thiết kế.**
> Mô tả bản chất thực sự của hệ thống, các invariant bắt buộc, và các rule kỹ thuật đã được chứng minh qua nhiều PR.

---

## 0. Scope & Status

Mỗi phần có tag trạng thái:

| Tag | Ý nghĩa |
|---|---|
| `[PERMANENT]` | Quy luật hệ thống, không thay đổi theo PR/feature |
| `[CURRENT]` | Thực tế hiện tại của codebase, có thể tiến hóa |
| `[PILOT]` | Đang thử nghiệm trong một PR, có thể thay đổi sau khi stabilize |
| `[FUTURE]` | Đã định hướng, chưa implement |

---

## 1. Product Identity [PERMANENT]

**QUANLYVKS là case/document workflow system, không phải form builder.**

Hệ thống nghiệp vụ pháp lý cho:
- Quản lý hồ sơ vụ án
- 213 biểu mẫu pháp lý (locked/compiled)
- Sinh DOCX/PDF từ hồ sơ + template
- Duyệt văn bản, phân quyền theo đơn vị
- Audit lịch sử xử lý

**Layout authority thuộc về DOCX template/contract đã kiểm chứng — không phải người dùng tự do chỉnh layout.**

Bốn lớp nghiệp vụ chính:

| Lớp | Mô tả | Entity |
|---|---|---|
| Case Management | Hồ sơ vụ án, phân quyền theo agency | `cases`, `case_people`, `case_events` |
| Form Contracts | 213 biểu mẫu locked, source of truth | `templates`, `template_versions` |
| Generated Documents | DOCX/PDF từ hồ sơ + dữ liệu + template | `generated_documents`, `generated_document_files` |
| Audit / Governance | Mọi thao tác quan trọng đều log | `generated_document_audit_logs` |

---

## 2. System Architecture [PERMANENT]

### 2.1 Cấu trúc monorepo

```
pnpm monorepo
apps/
  api/     → NestJS backend  (API prefix: /api/v1)
  web/     → Next.js frontend
packages/
  form-contracts/ → schema/contract/render logic cho 213 biểu mẫu
scripts/
  audit/*.mjs     → audit gates
docs/
  audit/
  auth/
  architecture docs
```

### 2.2 Tech stack chính thức

| Lớp | Công nghệ | Vai trò |
|---|---|---|
| Package manager | pnpm | monorepo workspace |
| Frontend | Next.js, React, TypeScript | web app, dashboard, runtime form |
| Styling | Tailwind CSS, shadcn-style patterns | admin UI, workflow UI |
| Backend | NestJS, TypeScript | API, business logic |
| ORM | Prisma | DB access/migration |
| Database | MariaDB/MySQL-compatible | persistence |
| Auth | Clerk + legacy/internal bridge | browser auth + API token bridge |
| Validation | class-validator, ValidationPipe whitelist/forbidNonWhitelisted | request boundary |
| File storage | filesystem + DB metadata | DOCX/PDF/generated files |
| PDF conversion | DocumentPdfService, Word COM (Windows), LibreOffice fallback | DOCX → PDF cho generated documents |
| CI/CD | GitHub Actions, Docker, Vercel preview | validation/release |
| QA | unit/integration tests, Playwright | reliability |

### 2.2.1 Env loading policy

Dự án dùng `dotenv` cho **Node-side tooling**, đặc biệt là Playwright/E2E, audit scripts, local scripts nếu cần.

**Không dùng custom `.env` parser.**

| Context | Cách load env |
|---|---|
| Next.js web runtime | Dùng env loading mặc định của Next.js. Không tự `dotenv.config()` trong runtime web. |
| NestJS API runtime | Dùng cơ chế config/env hiện hữu của API. Nếu cần chuẩn hóa, dùng `@nestjs/config`, không rải `dotenv.config()` trong nhiều file. |
| Playwright/E2E | Load `.env.e2e.local`, `.env.local`, `.env` bằng `dotenv` trong `playwright.config.ts`. |
| CI/Vercel/Production | Dùng platform secrets. Không phụ thuộc `.env.local`. |

Load order cho E2E:

```ts
import dotenv from 'dotenv';

for (const path of ['.env.e2e.local', '.env.local', '.env']) {
  dotenv.config({ path, override: false });
}

process.env.CLERK_PUBLISHABLE_KEY ??= process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
```

Nguyên tắc:
- `override: false` để biến từ shell/CI thắng file `.env`.
- `.env.e2e.local` chỉ dùng local/E2E, không commit.
- Không expose `CLERK_SECRET_KEY` sang frontend.
- Không log env values.
- Không dùng custom parser.

### 2.3 Known caveats

- Windows Prisma DLL lock có thể gây local build/generate fail nếu dev server còn giữ process
- Node v24 có thể warning vì engines yêu cầu `>=22 <23`
- Một số audit script duplicate-name warning có thể tồn tại

---

## 3. Domain Model [PERMANENT]

### 3.1 Entity relationship overview

```
agencies
  └── officials (role, agency, active, permissions)
  └── official_permissions
auth_identities (Clerk identity projection)
  └── auth_identity_audit_logs
cases
  └── case_people (bị can, bị hại, người làm chứng...)
  └── case_offenses
  └── case_assignments
  └── case_events
generated_documents (văn bản đã sinh, gắn hồ sơ)
  └── generated_document_files (DOCX/PDF file metadata)
  └── generated_document_audit_logs (lịch sử thao tác)
stored_files
templates / template_versions / form contracts (213 biểu mẫu locked)
```

### 3.2 Officials vs Clerk Identity [PERMANENT]

**Clerk user không tự động là user nghiệp vụ.**

```
Clerk token ──→ chứng minh identity
DB officials ──→ quyết định role, agency, permission
```

| Clerk trạng thái | Business access |
|---|---|
| Unknown (chưa link) | VIEWER, không agency, business access bị cấm |
| Linked | Lấy role/agency/permission từ `officials` |
| ADMIN | Global access |

### 3.3 Generated Document Audit Actions [PERMANENT]

```typescript
GENERATED_DOCUMENT_CREATED
GENERATED_DOCUMENT_RENDERED_DOCX
GENERATED_DOCUMENT_EXPORTED
GENERATED_DOCUMENT_DOWNLOADED
GENERATED_DOCUMENT_FILE_DELETED
GENERATED_DOCUMENT_FILES_BULK_DELETED
GENERATED_DOCUMENT_FILES_CLEANED_UP
GENERATED_DOCUMENT_ACCESS_DENIED
AUTH_IDENTITY_LINKED
AUTH_IDENTITY_UNLINKED
```

---

## 4. Auth / RBAC / Identity Projection [PERMANENT]

### 4.1 Core invariants

```
Authentication ≠ Authorization.

Clerk xác thực identity.
DB officials/auth_identities quyết định nghiệp vụ.

VIEWER / unknown Clerk user → không business access.
ADMIN → global access.
OFFICIAL → chỉ own agency.
Cross-agency access → 403.
Missing resource → 404.
Null/missing user → 401.
Admin routes → explicit permission check.
UI hide/show → không phải security boundary.
Server/API luôn check permission.
```

### 4.2 Auth đã qua các phase

| PR | Nội dung |
|---|---|
| #21 | Clerk canonical auth workflow + API token bridge |
| #22 | Agency resource authorization |
| #23 | Clerk DB identity projection + webhook sync |
| #24 | Admin identity linking workflow |
| #25 | Admin UX in AppShell |
| #26 | Form permission admin scope hardening |
| #27 | Env/CSRF production hardening |

### 4.3 API AuthGuard (NestJS)

Hỗ trợ **hai mechanism** trên API:

```typescript
// Cookie: qlv_session
//   → AuthService.validateSession()
//   → lookup trong DB

// Bearer token: Clerk session token
//   → AuthService.validateClerkSession()
//   → verify với Clerk backend

// Public route: vẫn set currentUser nếu có cookie/token hợp lệ
// Protected route: throw UnauthorizedException nếu không authenticate được
```

### 4.4 Web auth vs API auth boundary

Có hai lớp auth khác nhau:

**API auth** — API có thể authenticate bằng:
- Cookie `qlv_session`
- Bearer Clerk session token

`qlv_session` là session/cookie nội bộ do NestJS backend cấp. Phù hợp cho legacy/admin/API-level tests hoặc flow nội bộ còn hỗ trợ cookie auth.

**Web route auth** — Protected web routes trong Next.js dùng **Clerk browser session**.

Ví dụ: `/templates/:templateCode`, `/admin/*`, `/documents/*`

Các route này **không được** test bằng cách tự inject `qlv_session`.

```
qlv_session ≠ Clerk browser session

Clerk-protected web routes cần session do Clerk SDK/middleware nhận diện,
gồm Clerk-managed cookies/storage/session state.
```

Vì vậy, E2E cho web routes phải dùng **Clerk-authenticated Playwright storageState**.

### 4.5 E2E Clerk auth strategy

Dự án dùng **Clerk ticket strategy** cho authenticated E2E.

**Mục tiêu:**
- Không automate password form
- Không phụ thuộc MFA
- Không hardcode password
- Không dùng `qlv_session` để fake web auth
- Tạo Clerk browser session thật rồi lưu Playwright storageState

**Flow chuẩn:**

```
1. Playwright global setup đọc env từ .env.e2e.local bằng dotenv
2. Clerk Backend API tạo sign-in ticket cho E2E_CLERK_USER_EMAIL
3. Playwright mở /sign-in
4. Đợi Clerk SDK load trong browser
5. Inject ticket: window.Clerk.client.signIn.create({ strategy: "ticket" })
6. Gọi Clerk.setActive() để activate session
7. Lưu browser storage state vào playwright/.clerk/admin.json
8. Authenticated specs reuse storageState này
```

**File liên quan:**
```
playwright.config.ts
tests/e2e/global.setup.ts
tests/e2e/*.auth.spec.ts
playwright/.clerk/admin.json
```

**Required E2E env:**
```
E2E_CLERK_USER_EMAIL=admin@example.test
CLERK_PUBLISHABLE_KEY=<CLERK_PUBLISHABLE_KEY>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<CLERK_SECRET_KEY>
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

**Không yêu cầu:** `E2E_CLERK_USER_PASSWORD` — password không được dùng trong E2E auth strategy hiện tại.

**Identity projection requirement:**

```
Clerk user
  → auth_identities.provider = "clerk"
  → auth_identities.provider_user_id = Clerk user id
  → auth_identities.official_id
  → officials.role = ADMIN hoặc quyền phù hợp
  → officials.is_active = true
  → agency hợp lệ
```

Nếu Clerk login pass nhưng business route bị deny: đó là lỗi authorization/identity projection, không phải lỗi E2E auth.

---

## 5. DOCX / Form Contract Source of Truth [PERMANENT]

### 5.1 213 biểu mẫu locked

```
Tất cả 213 biểu mẫu là locked/compiled.
Chúng là source of truth cho runtime form và DOCX rendering.
```

**Audit gates bắt buộc:**

```bash
pnpm audit:locked-compiled   # 213/213 consistent, 0 missing, 0 stale
pnpm audit:contract-sync      # tất cả contract sync với DB
```

**Không được mass-edit 213 templates/contracts trong PR nhỏ.**

### 5.2 DOCX rendering — hai flow khác nhau [PERMANENT]

#### Flow A: Runtime template render (standalone template page)

**Endpoint:** `POST /api/v1/forms/runtime/:templateCode/render-docx`

```
Mục đích:       Tạo DOCX tạm thời từ template, không gắn hồ sơ
Khi dùng:       /templates/:templateCode (standalone)
Lưu DB:         Không
Audit log:       Không
Response:        Binary DOCX
                Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
                Content-Disposition: attachment
                Body starts PK
```

#### Flow B: Generated document render (persisted workspace)

**Endpoint:** `POST /api/v1/documents/generated/:documentId/render-docx`

```
Mục đích:       Sinh văn bản chính thức từ hồ sơ
Khi dùng:       /documents/:id (workspace)
Lưu DB:         Có (generated_document_files)
Audit log:       Có (GENERATED_DOCUMENT_RENDERED_DOCX)
```

### 5.3 DOCX style audit [CURRENT]

```typescript
DocxStyleAuditService.auditDocxFromFile(filePath) → DocxStyleAuditResult
DocxStyleAuditService.auditDocxFromBuffer(buffer) → DocxStyleAuditResult
DocxStyleAuditService.auditDocxFromParts(parts)   → DocxStyleAuditResult
```

Style profile: `VKS_KHU_VUC_7_STYLE_PROFILE`

```typescript
interface DocxStyleAuditResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  profileId: string;
  summary: { total, pass, warning, fail, notDetectable, notApplicable };
  findings: Array<{ severity, code, message, location, recommendation }>;
}
```

---

## 6. Workspace Boundary [PERMANENT]

**Đây là boundary quan trọng nhất của toàn hệ thống.**

### 6.1 Standalone template page: `/templates/:templateCode`

| Thuộc tính | Giá trị |
|---|---|
| `generatedDocumentId` | Không có |
| `generated_documents` row | Không |
| `generated_document_files` | Không |
| `generated_document_audit_logs` | Không |
| History workspace | Không |
| Route vào `/documents/:id` | Không được |
| "Lịch sử xử lý" link | Không được |

### 6.2 Persisted document workspace: `/documents/:id`

| Thuộc tính | Giá trị |
|---|---|
| `generatedDocumentId` | Có |
| `generated_documents` row | Có |
| `generated_document_files` | Có |
| `generated_document_audit_logs` | Có |
| History tab | Có |
| Preview tab | Có |
| Agency-scoped authorization | Có |

### 6.3 Kết luận

> **Standalone template = Runtime DOCX/Preview Session.**
> **Persisted document = Generated Document Workspace.**
> **Không được mix hai flow này.**

---

## 7. Generated Document Workspace [PERMANENT]

Workspace `/documents/:id` là hệ **persisted**.

**Phải giữ nguyên:**
- Preview tab (DOCX/PDF)
- History tab (lịch sử thao tác)
- Generated document action panel (download, render, convert PDF)
- Generated document audit panel
- `generated_document_files` (file metadata)
- `generated_document_audit_logs` (audit rows)
- Agency-scoped authorization (OFFICIAL chỉ own agency)

**Runtime preview session không được route vào `/documents/:id` trừ khi user thật sự tạo/open một generated document gắn hồ sơ.**

---

## 8. Runtime DOCX/Preview Session [PILOT — PR #31]

> **Trạng thái:** Đang implement trong PR #31. Có thể thay đổi sau khi stabilize.

### 8.1 Mục đích

Cho `/templates/:templateCode` tạo DOCX tạm thời trước khi tải:
- Không tạo generated document
- Không ghi DB
- Không fake workspace

### 8.2 Backend behavior

```typescript
// POST /api/v1/forms/runtime/:templateCode/preview-session
// → render DOCX tạm
// → lưu vào storage/runtime-preview-sessions/{sessionId}
// → chạy DOCX style audit (best-effort)
// → trả JSON metadata
// → cho tải DOCX explicit
// → TTL: 60 phút
// → cleanup expired sessions opportunistically

interface RuntimePreviewSession {
  sessionId: string;           // format: runtime_preview_<uuid>
  templateCode: string;
  fileName: string;
  fileSizeBytes: number;
  fileFormat: 'DOCX';
  docxDownloadUrl: string;     // /api/v1/forms/runtime/preview-sessions/:sessionId/docx
  pdfPreviewUrl: string | null; // [CURRENT] PDF URL when document.pdf exists; null on graceful fallback
  audit: DocxStyleAuditResult;
  warnings: Array<string | { code: string; message: string }>;
  missingRequired: unknown[];
  expiresAt: string;
  persisted: false;            // CRITICAL: không phải persisted document
}
```

### 8.3 Endpoint spec

| Method | Path | Response |
|---|---|---|
| `POST` | `/api/v1/forms/runtime/:templateCode/preview-session` | JSON (không Content-Disposition, body không PK) |
| `GET` | `/api/v1/forms/runtime/preview-sessions/:sessionId/docx` | DOCX attachment |
| `GET` | `/api/v1/forms/runtime/preview-sessions/:sessionId/pdf` | Inline PDF when `document.pdf` exists; graceful unavailable when conversion fails |
| `POST` | `/api/v1/forms/runtime/:templateCode/render-docx` | Pure binary DOCX download |

### 8.4 RESTRICTIONS

**Không được ghi vào:**
- `generated_documents`
- `generated_document_files`
- `generated_document_audit_logs`

**Session ID:**
- Format: `runtime_preview_<uuid>`
- Sanitize trước khi dùng trong filesystem path
- Kiểm tra exists và expired
- Chống path traversal

### 8.5 Runtime PDF visual preview [CURRENT — PR #33]

Runtime Preview Session now attempts DOCX → PDF conversion after `document.docx` is written.
The PDF is stored as `storage/runtime-preview-sessions/{sessionId}/document.pdf` and exposed through `pdfPreviewUrl` only when conversion succeeds.
If Word COM/LibreOffice conversion is unavailable or invalid, session creation still succeeds, `pdfPreviewUrl` remains `null`, and warnings include `PDF_PREVIEW_UNAVAILABLE`.

This remains filesystem-only runtime state:
- no `generated_documents` rows
- no `generated_document_files` rows
- no `generated_document_audit_logs` rows
- no `/documents/:id` routing

---

## 9. UX Truthfulness Rules [PERMANENT]

### 9.1 Khi có visual preview thật

Điều kiện:
- Có PDF iframe/object từ `pdfPreviewUrl`
- **Hoặc** browser DOCX renderer hiển thị nội dung tài liệu
- **Hoặc** representation visual đủ để kiểm tra nội dung/layout

→ UI được phép: **"Đã tạo bản xem trước"**

### 9.2 Khi không có visual preview

Nếu `pdfPreviewUrl: null` và không có DOCX renderer:

→ UI **phải**: **"Đã tạo file DOCX tạm thời"**

**Copy chuẩn:**
```
File DOCX đã được tạo tạm thời nhưng hiện chưa thể hiển thị trực tiếp trong trình duyệt. Bạn có thể tải DOCX để kiểm tra định dạng.
```

Panel style: neutral/warning, **không green success**.

### 9.3 PDF note

```
Tính năng xem trước PDF đang được phát triển.
```

### 9.4 Save-to-case CTA

Nút "Mở với hồ sơ để lưu DB" **chỉ hợp lệ** khi tồn tại flow thật:

```
/templates/:code
  → chọn hồ sơ/case
  → create/open generated document draft
  → /documents/:id?tab=preview
```

**Nếu chưa có flow thật:**
- `disabled`
- không có `href`
- không route tới `/documents?templateCode=...`
- không loop về templates

**Label:** `Tạo văn bản từ hồ sơ`

**Tooltip:** `Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới.`

---

## 10. Security / Env / Secrets [PERMANENT]

### 10.1 Pattern blacklist

| Pattern bị cấm | Lý do đúng |
|---|---|
| `body mode=metadata` | DTO whitelist/forbidNonWhitelisted reject là đúng; không được nhét control field vào payload form data |
| `?mode=metadata` | Endpoint `/render-docx` là binary-only; frontend dễ parse DOCX `PK...` như JSON |
| `/render-docx/metadata` làm final architecture | Sai lifecycle; chỉ trả metadata, không tạo preview artifact/session ổn định |
| `response.json(...)` trong Nest handler khi Nest serialize return value | Dễ gây circular JSON / cannot set headers after sent |
| Mix binary `StreamableFile` và JSON metadata trong cùng handler | Mơ hồ response contract, gây PK-is-not-JSON |
| Fake `generatedDocumentId` | Sai product boundary, sai security model |
| Hiển thị history/workspace links trong standalone mode | UX overpromise; standalone không có persisted document |
| Weaken DTO `whitelist`/`forbidNonWhitelisted` | Giảm an toàn input boundary |
| Touch 213 DOCX templates/contracts trong PR nhỏ | Dễ gây mass-edit ngoài scope |
| Log cookies/tokens/passwords | Secret/PII leak |
| Commit Playwright auth state | Session leak |
| Dùng `qlv_session` cookie để test Clerk web routes | Sai auth layer; web route cần Clerk browser session |
| Custom `.env` parser | Dễ sai quote/escape/multiline/Windows-Linux; dùng `dotenv` |
| `E2E_CLERK_USER_PASSWORD` trong code/spec/example | Ticket strategy không cần password; tăng secret surface |

### 10.2 Env / Secret Policy

| File | Commit? | Mục đích |
|---|---:|---|
| `.env.example` | Có | Template dev, không chứa secret thật |
| `.env.local` | Không | Secret/dev override local |
| `.env.e2e.example` | Có | Template E2E |
| `.env.e2e.local` | Không | Clerk dev keys cho E2E |
| `.env.production` | Không | Không dùng file local; dùng platform secrets |

**Bắt buộc `.gitignore`:**

```gitignore
.env.local
.env.e2e.local
playwright/.clerk/
playwright/.auth/
test-results/
playwright-report/
storage/runtime-preview-sessions/
```

**Secret rules:**

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY là public key, được expose frontend.
CLERK_SECRET_KEY là secret, không được commit, không được log, không được paste vào docs/report.
Nếu CLERK_SECRET_KEY bị lộ, phải rotate.
Không commit Playwright storage state.
Không commit screenshots/logs có token, cookie, session, password.
Không thêm E2E_CLERK_USER_PASSWORD vào code/spec/example.
```

**Secret grep trước merge:**

```bash
rg "sk_test_|sk_live_|E2E_CLERK_USER_PASSWORD|__session|__clerk|admin.json|playwright/.clerk" .
```

**Kỳ vọng:** Không có secret hardcoded, không có auth state trong git, không có password E2E trong code.

### 10.3 Production secrets

Chỉ nằm trên platform (Vercel env vars, Docker secrets, platform config). Không commit vào repo.

---

## 11. Testing / QA / E2E [PERMANENT]

### 11.1 Test layers

#### Backend unit/integration

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

#### Frontend

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

#### E2E (Playwright)

```
✓ Protected web routes dùng Clerk-authenticated Playwright storageState.
✓ Không dùng qlv_session cookie để test Clerk web routes.
✓ Clerk E2E dùng ticket strategy, không password/MFA form automation.
✓ global.setup.ts tạo Clerk session và lưu playwright/.clerk/admin.json.
✓ Authenticated specs dùng storageState từ playwright/.clerk/admin.json.
✓ E2E user phải linked với active official trong DB identity projection.
✓ Không commit auth state, token, cookie, password.
```

### 11.2 Validation gates chuẩn

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

### 11.3 Runtime smoke checklist

```
□ /templates/BM-001
□ click "Xem trước bản in"
□ POST /preview-session returns JSON not PK
□ no auto-download
□ panel appears with honest UX
□ Tải DOCX downloads from /preview-sessions/:sessionId/docx
□ no "Lịch sử xử lý"
□ save-to-case CTA disabled unless real flow exists
□ /documents/:id preview/history still works
```

### 11.4 Authenticated E2E checklist

**Command:** `pnpm test:e2e:auth`

**Expected setup:**
```
dotenv loads .env.e2e.local
CLERK_PUBLISHABLE_KEY available
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY available
CLERK_SECRET_KEY available
E2E_CLERK_USER_EMAIL available
No E2E_CLERK_USER_PASSWORD required
```

**Expected auth flow:**
```
□ Clerk sign-in ticket created through Backend API
□ Clerk SDK loaded in browser
□ signIn.create({ strategy: "ticket" }) succeeds
□ setActive() succeeds
□ storageState saved to playwright/.clerk/admin.json
□ /templates/BM-001 loads without redirect to sign-in
```

**Expected runtime preview E2E:**
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

**If E2E fails:**
- Redirect to sign-in → check Clerk session/storage state
- Sign-in succeeds but app denies access → check `auth_identities` → `official` mapping
- Env missing → check `.env.e2e.local` and dotenv load order
- **Do not fallback to `qlv_session` for Clerk web routes**

---

## 12. Release Gates [PERMANENT]

Mọi PR/phản ánh thay đổi nghiệp vụ phải pass:

```
1. ✓ Đúng product boundary (standalone vs persisted workspace)
2. ✓ Đúng source of truth (DOCX contracts)
3. ✓ Không phá auth/agency boundary (cross-agency → 403)
4. ✓ Không mutate locked contracts ngoài scope
5. ✓ Không tạo UX claim sai (honest UX spec)
6. ✓ Có unit/integration tests
7. ✓ Có E2E hoặc smoke cho critical path
8. ✓ Full gates pass (lint, typecheck, audit gates, build)
9. ✓ Docs/audit cập nhật nếu feature/audit-sensitive
10. ✓ Git status sạch, không secrets, không generated artifacts ngoài scope
11. ✓ Secret hygiene pass — không hardcoded secret, không auth state, không `.env.e2e.local`
12. ✓ Authenticated E2E strategy đúng tầng — Clerk web routes dùng Clerk ticket/storageState, không dùng `qlv_session`
```

---

## 13. Tooling / Skills [PERMANENT]

### 13.1 Layer mapping

**Khi sửa UI (customer-facing / admin):**
- Dùng: PixelPoint, Impeccable, Taste Skill, Emil Kowalski
- Phải: run Playwright smoke hoặc Storybook

**Khi sửa auth:**
- Dùng: Clerk skills, `@clerk/testing` patterns, Clerk ticket strategy
- Phải: verify identity projection, test 401/403

**Khi sửa repo architecture:**
- Dùng: CodeGraph trước khi đọc file
- Không: duplicate helper/client/schema

**Khi sửa backend API:**
- Dùng: NestJS patterns, class-validator, Prisma
- Phải: validate mọi params/query/body, không `any`

### 13.2 Auth/RBAC/Security layer

- Clerk, Clerk Session Tokens, Clerk webhook sync
- Clerk ticket strategy for Playwright E2E
- DB identity projection
- Better Auth/OpenFGA/Casbin/Permit.io (reference cho future)
- `dotenv` for Node-side tooling/E2E env loading
- Gitleaks, Semgrep, OWASP ASVS

```
Authentication != Authorization.
Clerk authenticates identity.
DB officials/permissions authorize business access.
qlv_session chỉ dùng cho API/legacy-cookie test, không dùng cho Clerk web routes.
Protected web E2E phải dùng Clerk-authenticated storageState.
Không commit secret, token, cookie, auth state.
Nếu Clerk secret lộ, rotate.
```

### 13.3 QA/testing layer

- Playwright
- Clerk ticket strategy for authenticated E2E
- Playwright storageState
- Vitest/Jest tùy repo hiện hữu
- Testing Library
- Storybook test
- axe-core, Lighthouse
- Playwright MCP nếu cần agent tự verify browser

```
Critical path phải có E2E hoặc smoke.
Clerk-protected route phải test bằng Clerk session thật.
Không chấp nhận "API equivalent" cho UI flow cần click thật.
Form phải test happy path, validation error, loading, disabled, permission denied.
Visual UI quan trọng phải có screenshot/visual regression khi phù hợp.
```

### 13.4 Implementation rules theo cẩm nang

```
Auth/RBAC:
  → Authentication ≠ Authorization
  → Middleware chỉ xác thực session
  → Permission phải check ở handler
  → Mọi action quan trọng phải audit log
  → Không tin metadata từ client

Agent workflow:
  → Map architecture trước khi sửa
  → Tránh duplicate helper/schema
  → Keep diff minimal
  → Validate bằng test/typecheck/Playwright

Database:
  → Schema change qua migration
  → Seed tách migration
  → Multi-tenant query có agency boundary
  → Không sửa production DB trực tiếp
```

---

## 14. Definition of Done [PERMANENT]

Một thay đổi được coi là **xong** khi đủ 12 điều kiện ở section 12 (Release Gates).

---

## 15. File Policy Checklist [PERMANENT]

Bộ policy nên duy trì trong repo:

| File | Mục đích |
|---|---|
| `docs/PROJECT_SPEC.md` | Spec này — bản chất hệ thống, invariant |
| `docs/AUTH_RBAC_POLICY.md` | Auth/RBAC invariants chi tiết (từ section 4) |
| `docs/SECURITY_POLICY.md` | Secrets, env, pattern blacklist (từ section 10) |
| `docs/TESTING_STRATEGY.md` | Testing layers, coverage, E2E (từ section 11) |
| `docs/RELEASE_CHECKLIST.md` | Pre-release gates |

---

## Appendix A. PR #31 / PR #33 — Runtime Preview Session (Current State)

> Phần này ghi nhận trạng thái hiện tại của PR #31. Sau khi PR merge và stabilize, chuyển vào spec chính.

**Scope đúng:**
- Runtime DOCX/Preview Session + honest fallback UX
- Không phải full PDF visual preview
- Không phải case-bound document creation flow
- Không touch 213 DOCX templates/contracts

**Đã implement:**
- `RuntimePreviewSessionService`
- `POST /preview-session`
- `GET /preview-sessions/:sessionId/docx`
- `GET /preview-sessions/:sessionId/pdf` → inline PDF when PR #33 conversion succeeds, graceful unavailable otherwise
- `/render-docx/metadata` đã remove
- `/render-docx` pure binary
- `runtime-template-preview.ts` client
- Inline PDF visual preview UI for runtime sessions when `pdfPreviewUrl` exists
- Storage: `storage/runtime-preview-sessions/` (gitignored)
- Clerk ticket E2E strategy + `playwright/.clerk/` storageState

**Điều kiện merge tối thiểu:**
```
□ All gates pass
□ UI không nói "Đã tạo bản xem trước" khi không có visual preview
□ UI nói "Đã tạo file DOCX tạm thời"
□ PDF unavailable message trung thực
□ Save-to-case CTA disabled nếu chưa có flow
□ No "Lịch sử xử lý" in standalone
□ Clerk-authenticated E2E/smoke bền vững (ticket strategy)
□ GitHub CI green
□ Docker build green
□ Vercel green
```

---

## Appendix B. Smart Generic Prefill [CURRENT — PR #34]

> **Trạng thái:** Đã implement trong PR #34.

### B.1 Mục đích

Cho `/templates/:templateCode` điền nhanh các trường chung mà không cần nhập thủ công:
- Địa điểm + ngày lập (dùng ngày hiện tại)
- Các trường boilerplate an toàn

### B.2 Cấu trúc

**File mới:**
- `apps/web/src/lib/smart-generic-prefill.ts` — engine phân loại + value provider
- `apps/web/src/lib/smart-generic-prefill.test.ts` — 75 unit tests

**File sửa:**
- `apps/web/src/components/documents/template-preview-workspace.tsx` — nút "Điền nhanh thông tin chung"

**Tách biệt:**
- `sample-data.ts` **không bị sửa** — demo data vẫn tách riêng
- "Điền dữ liệu mẫu" được đổi tên thành "Dữ liệu demo"

### B.3 Phân loại trường

| Phân loại | Số trường | Điền tự động |
|---|---|---|
| `SAFE_RUNTIME_DEFAULT` | 69 | YES V1 |
| `SAFE_GENERIC_PREFILL` | 384 | YES V1 (69 fields) |
| `REVIEW_REQUIRED` | 37 | NO |
| `NEVER_AUTO` | 2,007 | NEVER |

### B.4 V1 implemented (128 trường)

**Điền tự động:**
- `document.issuePlaceDateLine` → `TP. Hồ Chí Minh, ngày DD tháng MM năm YYYY`
- `document.issuePlaceAndDateLine` → `TP. Hồ Chí Minh, ngày DD tháng MM năm YYYY`
- `document.ngayBan` / `document.issueDay` → `DD`
- `document.issueDate` → `YYYY-MM-DD` hoặc `ngày DD tháng MM năm YYYY` (theo control type)
- `recipients.archiveLine` → `Lưu: HSVA, HSKS, VP.`

**Không điền:**
- `accused.*`, `victim.*`, `witness.*`, `informant.*`, `reporter.*`
- `offense.*`, `decision.*`, `case.*`, `measure.*`
- `detentionArrest.*`, `prosecution.*`, `indictment.*`
- `person.birth*`, `offense.dateOfOffense`
- `agency.*`, `official.*`, `signature.*` (không có real profile source trong v1)
- `legalBasis.*` (không có trusted boilerplate)

### B.5 Policy

```
Auto-apply on load:  KHÔNG — chỉ khi user click
Overwrite existing:   KHÔNG — chỉ điền trường trống
Default place:        TP. Hồ Chí Minh
Timezone:            Asia/Ho_Chi_Minh
Date format:         ngày DD tháng MM năm YYYY
```

### B.6 Boundary giữ nguyên

```
Không ghi: generated_documents, generated_document_files
Không tạo: case-bound document flow
Không đụng: 213 DOCX contracts/templates
```

---

## Appendix C. Future Features [FUTURE]

Các feature đã định hướng nhưng chưa implement:

| Feature | Trạng thái |
|---|---|
| Case-bound document creation flow | Chưa implement |
| Browser DOCX renderer cho visual preview | Chưa implement |
| Runtime PDF conversion hardening | Future follow-up |
| Agency/official profile prefill v2 | Chưa implement |
| Signature prefill v2 | Chưa implement |
| legalBasis boilerplate prefill v2 | Chưa implement |

---

## Bottom Line

> **QUANLYVKS/Form-Management là hệ thống nghiệp vụ pháp lý nghiêm túc.**
>
> - **Clerk** authenticates identity.
> - **DB officials/permissions** authorize business access.
> - **DOCX contracts** are source of truth.
> - **Generated document workspace** là nơi lưu và audit văn bản thật.
> - **Runtime session** là lớp tạm cho standalone template.
> - **Playwright E2E** dùng Clerk ticket strategy + storageState cho protected web routes.
> - **dotenv** là env loader chuẩn cho Node-side tooling/E2E; không dùng custom parser.

---

*Generated from project handoff + codebase analysis. Last updated: 2026-07-03.*
