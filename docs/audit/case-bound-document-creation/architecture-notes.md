# Case-bound Document Creation — Architecture Notes

> Discovery phase for PR #34. Branch: `feat/case-bound-document-creation`.
> Generated: 2026-07-03.
> Status: DISCOVERY_ONLY — no feature code written.

## 0. Hard Boundary

```
Standalone template = Runtime DOCX/Preview Session. No persisted document.
Persisted document = Generated Document Workspace. Has DB rows + audit logs.
Do not mix these two flows.
```

This discovery does NOT write feature code. It produces design documents only.

---

## 1. Existing Case Model

### 1.1 API

- **Controller**: `apps/api/src/modules/cases/cases.controller.ts`
- **Service**: `apps/api/src/modules/cases/cases.service.ts`
- **Auth**: `apps/api/src/modules/auth/agency-resource-access.service.ts`

### 1.2 Key Methods

| Method | Behavior |
|---|---|
| `CasesService.findAll(query, user?)` | Lists cases with agency scoping. ADMIN → all agencies. OFFICIAL → own agency only. Supports `q` (keyword search by case code/title/summary/national code), `stage`, `status`, pagination. |
| `CasesService.findOne(id, user)` | Returns full case detail including people, offenses, assignments, evidence, recent documents, events. Uses `assertCanAccessCase()` for authorization. |
| `CasesService.create(dto, user)` | Creates a case. OFFICIAL can only create for own agency. ADMIN can create for any. |
| `AgencyResourceAccessService.assertCanAccessCase(user, caseIdRaw)` | Loads case, checks agency ownership. ADMIN bypasses. OFFICIAL must match case agency. Throws `NotFoundException` if case missing, `ForbiddenException` if cross-agency. |

### 1.3 Case Authorization Rules

```
ADMIN → all cases (all agencies)
OFFICIAL → own agency only
VIEWER / unknown Clerk → ForbiddenException
Null user → UnauthorizedException
Missing case → NotFoundException
Cross-agency → ForbiddenException (403)
```

### 1.4 Case Entity Columns

```
cases:
  id (PK, BigInt, autoincrement)
  case_code (nullable)
  national_case_code (nullable)
  case_title (required)
  agency_id (FK → agencies, nullable)
  current_stage
  current_status
  is_deleted (boolean)
  ...timestamps, dates, person counts...
```

### 1.5 Case Search via Frontend

- Frontend calls `GET /api/v1/cases?q=...&pageSize=100`
- API returns `{ items: CaseOption[], pagination: {...} }`
- Case picker in `template-preview-workspace.tsx` already calls `/cases?pageSize=100` and renders results with search filter.

---

## 2. Existing Generated Document Model

### 2.1 Existing Creation Flow

The only way to create a `generated_document` today is through batch creation:

- **Controller**: `DocumentsController` at `POST /documents/cases/:caseId/batches`
- **Service**: `DocumentsService.createBatch()`
- **Scope**: Creates 1+ documents from selected templates for a case (PERSON_LEVEL → one doc per person; CASE_LEVEL → one doc per template)
- **No single-document creation endpoint exists.**
- **No `createOrOpenEditableDraft()` method exists.**

### 2.2 Existing Document Entity

```
generated_documents:
  id (PK, BigInt, autoincrement)
  batch_id (nullable FK → document_generation_batches)
  case_id (FK → cases, required)
  template_id (FK → templates, required)
  template_version_id (nullable FK → template_versions)
  document_code (nullable string)
  document_title (required string, max 500)
  target_scope (required string: CASE_LEVEL, PERSON_LEVEL, etc.)
  target_person_id (nullable FK → people)
  review_status (string, default "WAITING_REVIEW")
  render_payload_snapshot (JSON, nullable)
  validation_result (JSON, nullable)
  generated_by_name (nullable)
  generated_at (datetime, default now)
  ...
```

### 2.3 Review Status Values

From code analysis (`document-reviews.service.ts`):

| Action | Status |
|---|---|
| Default on creation | `WAITING_REVIEW` |
| APPROVE | `APPROVED` |
| REQUEST_REVISION | `NEEDS_REVISION` |
| MARK_WAITING_REVIEW | `WAITING_REVIEW` |
| CANCEL | `CANCELLED` |
| FINAL_EXPORT | `FINAL_EXPORTED` |

**There is no `DRAFT` status.** The closest to "draft" is `WAITING_REVIEW` for newly created batch documents, but these are created as part of batch workflows, not standalone.

### 2.4 Audit Events

From `generated-document-audit.service.ts`:

```
GENERATED_DOCUMENT_CREATED
GENERATED_DOCUMENT_RENDERED_DOCX
GENERATED_DOCUMENT_EXPORTED
GENERATED_DOCUMENT_DOWNLOADED
GENERATED_DOCUMENT_FILE_DELETED
GENERATED_DOCUMENT_FILES_BULK_DELETED
GENERATED_DOCUMENT_FILES_CLEANED_UP
GENERATED_DOCUMENT_ACCESS_DENIED
```

### 2.5 Form Data Storage

Documents store form data in `render_payload_snapshot.formInputs` (JSON). The `updateFormInputs()` service method deep-merges client-submitted data into this field. The schema validates via `UpdateGeneratedDocumentFormInputsDto` with `forbidNonWhitelisted: true`.

### 2.6 Existing Document File Behavior

`generated_document_files` are created only when the user explicitly renders DOCX/PDF through the document workspace. They are NOT created during batch creation. File columns:

```
generated_document_files:
  id (PK)
  generated_document_id (FK)
  file_format (DOCX, PDF, ...)
  file_name
  file_path (server path)
  file_size_bytes
  checksum
  is_final
```

### 2.7 Existing Generated Document Workspace

- **Route**: `/documents/:documentId` → `GeneratedDocumentWorkspace`
- **Preview tab**: loads `getGeneratedDocumentPreview(documentId)` → renders DOCX/PDF
- **History tab**: loads `getDocumentHistory(documentId)` → shows events
- **Audit panel**: loads `getGeneratedDocumentAudit(documentId)` → shows audit rows

---

## 3. Existing Frontend Template/Document Routes

### 3.1 Template Page

- **Route**: `/templates/:templateCode` → `TemplatePreviewWorkspace`
- **Components**: `ContractV2Renderer` for form, `RuntimePdfPreview` for PDF
- **CTA "Tạo văn bản từ hồ sơ"**: Currently **disabled** with tooltip "Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới."
- **Runtime form data**: Available in component state as `data: Record<string, unknown>`
- **Case picker**: Already exists (for data import), calls `/cases?pageSize=100`
- **No existing link from template CTA to document workspace**

### 3.2 Document Workspace

- **Route**: `/documents/:documentId`
- **Component**: `GeneratedDocumentWorkspace`
- **Tabs**: preview, history, form-editor
- **Client API**: `generated-documents-api.ts`

### 3.3 Existing Case Picker UI

Already implemented in `template-preview-workspace.tsx`:

```tsx
// State
const [casePickerOpen, setCasePickerOpen] = useState(false);
const [caseOptions, setCaseOptions] = useState<CaseOption[]>([]);

// Opens on button click
async function openCasePicker() {
  const result = await readApi<{ items: CaseOption[] }>("/cases?pageSize=100");
  setCaseOptions(result.items);
}

// Search filter
const filteredCaseOptions = caseOptions.filter(item =>
  `${item.caseCode} ${item.caseTitle}`.toLowerCase().includes(needle)
);

// Selection
async function chooseCase(item: CaseOption) {
  const detail = await getCaseDetail(item.id);
  applyCaseDetail(detail); // imports data into form fields
  setSelectedCase(item);
}
```

### 3.4 Existing Runtime Form Data Availability

When user clicks "Tạo văn bản từ hồ sơ", the current `data: Record<string, unknown>` state is available in the `TemplatePreviewWorkspace` component. This contains all form field values as entered or imported.

---

## 4. Existing Auth/Authorization Model

### 4.1 Auth Architecture

```
Clerk (browser session) → authenticates identity
DB officials → authorizes business access
```

### 4.2 AgencyResourceAccessService Methods

| Method | Used For |
|---|---|
| `requireBusinessUser(user)` | Requires ADMIN/OFFICIAL with numeric ID |
| `assertCanAccessAgency(user, agencyId)` | ADMIN bypasses; OFFICIAL must match |
| `assertCanAccessCase(user, caseIdRaw)` | Combines case existence + agency check |
| `assertCanAccessGeneratedDocument(user, docIdRaw)` | Loads document → case → agency check |
| `assertCanAccessGeneratedDocumentFile(...)` | Full chain: file → doc → case → agency |

### 4.3 Frontend API Auth

`apps/web/src/lib/api-client.ts` uses `withApiFetchAuthDefaults()` which attaches Clerk Bearer token. `readApi()` is used for authenticated reads.

### 4.4 Prisma Schema Auth Fields

```
officials:
  id, role (ADMIN|OFFICIAL|VIEWER), agency_id (FK → agencies), is_active, permissions

auth_identities:
  provider (clerk), provider_user_id, official_id (FK → officials)
```

---

## 5. Candidate Implementation Options

### Option A — Reuse existing batch endpoint (add single-item wrapper)

Attempt to use `POST /documents/cases/:caseId/batches` with a single template.

**Verdict**: **Not viable.** The batch endpoint creates a `document_generation_batch` row for every call. It generates multiple documents for PERSON_LEVEL templates. It creates `WAITING_REVIEW` status, not a "draft" status. It does not support creating a single standalone document without a batch context. It does not support idempotent create-or-open.

### Option B — New thin case-bound creation endpoint

Add `POST /api/v1/documents/from-template` with body `{ templateCode, caseId, initialFormData? }`.

**Verdict**: **Recommended.** Cleanest approach. Server-side creation of a single `generated_document` with proper authorization, audit logging, and idempotent open-existing-draft behavior.

### Option C — Direct frontend route with query params

`/documents?templateCode=BM-001&caseId=...`

**Verdict**: **Rejected.** Easy to create fake workspace. Ambiguous lifecycle. Weak audit boundary. Previous PR #31 mistake to avoid.

### Option D — Persist runtime preview session into DB

**Verdict**: **Rejected.** Runtime session is temporary filesystem state. Must not be persisted as a generated document. Risks mixing runtime and persisted flows.

---

## 6. Recommended Approach

**Option B** — a new thin API endpoint in the existing `DocumentsController`.

### Why Option B

1. **Minimal new surface**: One new POST endpoint, one new DTO, one new service method.
2. **Reuses existing infrastructure**: Prisma model, audit service, authorization service, agency scoping.
3. **Clean lifecycle**: Server owns the creation. Frontend only orchestrates UX.
4. **Safe defaults**: Fails fast on bad inputs. No fake workspace possible.
5. **Audit-ready**: Can write `GENERATED_DOCUMENT_CREATED` immediately.
6. **Idempotent**: Can check for existing DRAFT before creating new.

### Why NOT Options A/C/D

- **A**: Batch endpoint is wrong abstraction. Creates batch rows, multi-document logic, wrong status.
- **C**: Query-only routing creates ambiguous lifecycle. No server validation.
- **D**: Persisting runtime sessions mixes temporary and persisted flows.

---

## 7. Proposed Endpoint Contract

### 7.1 Endpoint

```
POST /api/v1/documents/from-template
```

### 7.2 Request Body

```typescript
interface CreateFromTemplateDto {
  templateCode: string;   // required, validated against DB templates
  caseId: string;         // required, validated against DB cases
  initialFormData?: Record<string, unknown>; // optional, sanitized server-side
}
```

### 7.3 Response

```typescript
interface CreateFromTemplateResponse {
  documentId: string;
  templateCode: string;
  caseId: string;
  reviewStatus: string;  // "WAITING_REVIEW"
  created: boolean;      // true if new, false if existing draft reopened
  existingDraft: boolean;
  route: string;         // "/documents/{documentId}?tab=preview"
}
```

### 7.4 Errors

| HTTP | Condition |
|---|---|
| 400 | Invalid templateCode or caseId format |
| 401 | Not authenticated |
| 403 | Cross-agency access (not own agency) |
| 404 | Template or case not found |
| 500 | Unexpected server error |

### 7.5 Authorization

- Must call `assertCanAccessCase(user, caseId)` before creation.
- ADMIN can create for any agency.
- OFFICIAL can only create for own agency.
- Unknown/VIEWER Clerk → 401/403.

### 7.6 Idempotency

```
1. Search for existing generated_document:
   WHERE case_id = caseId
   AND template_id = templateId
   AND review_status IN ('WAITING_REVIEW')
   AND batch_id IS NULL  // standalone, not batch-created
   AND generated_by_name = user.fullName  // own drafts only

2. If found → return existing with created=false, existingDraft=true
3. If not found → create new with review_status='WAITING_REVIEW'
```

The `batch_id IS NULL` constraint ensures we only reopen our own standalone drafts, not batch-created documents.

### 7.7 Form Data Handling

**v1 recommendation**: Do NOT accept `initialFormData` from client.

Reason: The runtime form data from `/templates/:code` is client-side state that has not been validated against the contract schema. Accepting it risks persisting unvalidated, potentially malformed data into the `render_payload_snapshot.formInputs`.

Instead, create the document with empty `formInputs: {}`. The user can then edit form data inside the `/documents/:id` workspace, where the existing `updateFormInputs()` flow with proper DTO validation applies.

This is the **safest v1 approach**.

If `initialFormData` is desired in a future iteration, it must be validated server-side against the contract schema before persisting, with `forbidNonWhitelisted: true` on the DTO.

---

## 8. Proposed Frontend UX

### 8.1 CTA Button State Changes

**Before PR #34:**

```tsx
<button disabled title="Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới.">
  Tạo văn bản từ hồ sơ
</button>
```

**After PR #34:**

```tsx
// When no case is selected → opens case picker dialog
<button onClick={() => openCasePickerForDocumentCreation()}>
  Tạo văn bản từ hồ sơ
</button>

// When case is already selected (from data import) → directly calls creation API
<button onClick={() => void createDocumentFromCase(selectedCase.id)}>
  Tạo văn bản từ hồ sơ
</button>
```

### 8.2 Case Picker Dialog

Uses existing case picker infrastructure with a new mode:

```tsx
// New mode: "documentCreation"
// Title: "Tạo văn bản từ hồ sơ"
// Description: "Chọn hồ sơ để tạo bản nháp văn bản từ biểu mẫu hiện tại."

async function handleCaseSelectionForDocument(caseItem: CaseOption) {
  setCreatingDocument(true);
  try {
    const result = await createDocumentFromTemplate({
      templateCode: normalizedTemplateCode,
      caseId: caseItem.id,
    });
    // Navigate to document workspace
    router.push(`/documents/${result.documentId}?tab=preview`);
  } catch (err) {
    if (err instanceof Error) {
      setCasePickerError(err.message);
    }
  } finally {
    setCreatingDocument(false);
  }
}
```

### 8.3 Error States

| Error | Message |
|---|---|
| 401 | "Yêu cầu đăng nhập." |
| 403 | "Không có quyền tạo văn bản cho hồ sơ này." |
| 404 (case) | "Không tìm thấy hồ sơ." |
| 404 (template) | "Biểu mẫu không tồn tại." |
| 500 | "Không thể tạo bản nháp. Vui lòng thử lại." |

### 8.4 Success Navigation

- Short loading state: "Đang tạo bản nháp..."
- Navigate to: `/documents/{documentId}?tab=preview`
- No green success toast before navigation.

### 8.5 No "Lịch sử xử lý" on standalone template page

Confirmed: The standalone template page must NOT show "Lịch sử xử lý" because it has no persisted document.

---

## 9. Data Persistence Plan

### 9.1 What Gets Written

```
generated_documents (1 row):
  - case_id: provided caseId
  - template_id: resolved from templateCode
  - document_title: "{templateName} - {caseCode}"
  - target_scope: "CASE_LEVEL" (or template's render_scope)
  - review_status: "WAITING_REVIEW"
  - render_payload_snapshot: { formInputs: {}, payloadOverrides: {}, ... }
  - generated_by_name: current user full name
  - batch_id: null (standalone document)
```

### 9.2 What Does NOT Get Written

```
generated_document_files — NOT created (only created on explicit render)
generated_document_audit_logs — only GENERATED_DOCUMENT_CREATED (best-effort)
case_events — NOT created for single document creation
```

### 9.3 When generated_document_files Are Created

Only when the user explicitly clicks "Render DOCX" or "Convert PDF" inside the `/documents/:id` workspace. Not during creation.

### 9.4 When Audit Logs Are Created

- `GENERATED_DOCUMENT_CREATED` written **only on new creation** (not on reopen of existing draft).
- Fire-and-forget (non-blocking), consistent with PR #29 policy.

---

## 10. Audit Plan

### 10.1 Audit Events

| Event | When | Params |
|---|---|---|
| `GENERATED_DOCUMENT_CREATED` | New document created | action=CREATED, result=SUCCESS, caseId, generatedDocumentId, template templateCode |
| `GENERATED_DOCUMENT_ACCESS_DENIED` | Authorization failure | action=ACCESS_DENIED, reason="case-access-denied" |

### 10.2 Audit Actor

Built from `CurrentUser` via `GeneratedDocumentAuditService.buildActor()`:
- `officialId`: from user.id (BigInt)
- `role`: ADMIN or OFFICIAL
- `fullName`: from user.fullName
- `agencyId`: from user.agencyId

### 10.3 Request Metadata

Captured via `GeneratedDocumentAuditService.normalizeRequestMeta(req)` — excludes tokens/cookies.

---

## 11. Test Plan

### 11.1 Backend Unit Tests

```typescript
// documents.service.spec.ts or new spec file
describe('createFromTemplate') {
  it('creates document with WAITING_REVIEW status')
  it('returns created=true on new document')
  it('returns created=false, existingDraft=true when draft exists')
  it('rejects cross-agency caseId with 403')
  it('rejects missing template with 404')
  it('rejects missing case with 404')
  it('rejects unauthenticated user with 401')
  it('records GENERATED_DOCUMENT_CREATED audit on new document')
  it('does NOT record audit when reopening existing draft')
  it('does NOT create generated_document_files')
  it('sets batch_id to null')
  it('sets generated_by_name from user.fullName')
}
```

### 11.2 Frontend Tests

```typescript
// template-preview-workspace.spec.ts or runtime-template-preview.spec.ts
describe('createDocumentFromTemplate CTA') {
  it('enables CTA button after PR #34')
  it('opens case picker on click')
  it('calls createFromTemplate API on case selection')
  it('navigates to /documents/:id?tab=preview on success')
  it('shows error message on 403')
  it('shows error message on 404')
  it('shows error message on 500')
  it('shows loading state during creation')
  it('re-opens existing draft without creating new document')
}
```

### 11.3 E2E Tests (Playwright)

```typescript
// e2e/case-bound-document-creation.spec.ts
it('authenticated user creates document from template via case picker', async () => {
  await page.goto('/templates/BM-001');
  await page.getByRole('button', { name: 'Tạo văn bản từ hồ sơ' }).click();
  // case picker opens
  await page.getByPlaceholder('Tìm theo mã hoặc tên hồ sơ').fill('VKS-2026');
  await page.getByText('VKS-2026-001').first().click();
  // loading state
  await expect(page).toHaveURL(/\/documents\/.*\?tab=preview/);
});

it('cross-agency case → error message', async () => {
  // create document for case from different agency
  // expect 403 error in case picker
});

it('reopens existing draft instead of creating new', async () => {
  // create once → navigate to document
  // go back to template → create again
  // expect same document opened, not new one
});
```

### 11.4 Auth Security Tests

```typescript
it('unauthenticated → 401')
it('VIEWER Clerk → 403')
it('OFFICIAL cross-agency → 403')
it('ADMIN cross-agency → 200 OK')
it('OFFICIAL own agency → 200 OK')
```

---

## 12. Risks

### 12.1 Risk: Idempotency edge case — batch-created vs standalone documents

**Risk**: If a user previously created documents for the same case+template via batch, the standalone draft lookup might accidentally match a batch-created document.

**Mitigation**: The idempotency query filters by `batch_id IS NULL`, ensuring only standalone-created documents are considered for draft reopening. Batch-created documents always have a non-null `batch_id`.

### 12.2 Risk: Form data carried from runtime

**Risk**: If `initialFormData` is accepted from the client, malicious/malformed data could be persisted.

**Mitigation**: v1 does NOT accept `initialFormData`. Document is created with empty `formInputs: {}`. User edits form data inside the workspace where `updateFormInputs()` with proper DTO validation applies.

### 12.3 Risk: Case picker loads 100 cases without pagination

**Risk**: Large agencies with many cases could have performance issues.

**Mitigation**: This is the same case picker used for data import today. If pagination is needed, it can be added as a follow-up. Not a v1 blocker.

### 12.4 Risk: Agency resource access service called twice (case check + document check)

**Risk**: Two round-trips to DB for authorization.

**Mitigation**: Acceptable for v1. Optimization can be a follow-up if profiling shows it matters.

### 12.5 Risk: Generated document without template_version_id

**Risk**: Documents created without a `template_version_id` may not render correctly.

**Mitigation**: The `render_payload_snapshot.contractMeta` will have `contractLookupStatus: 'MISSING'`, consistent with the existing batch creation pattern. The rendering pipeline already handles this via the `TODO(PLAN.md v2.3 C1/J1)` comment in `documents.service.ts`.

---

## 13. Non-Goals Confirmed

```
NO runtime session persistence
NO mixing of standalone and persisted flows
NO mutation of 213 locked DOCX contracts/templates
NO fake generatedDocumentId
NO DTO whitelist weakening
NO query-only routing
NO creation of generated_document_files during document creation
NO "Lịch sử xử lý" on standalone template page
NO commit of runtime preview sessions
```

---

## 14. Files Inspected

### Backend

- `apps/api/src/modules/documents/documents.controller.ts`
- `apps/api/src/modules/documents/documents.service.ts`
- `apps/api/src/modules/documents/documents.service.spec.ts`
- `apps/api/src/modules/documents/generated-document-audit.service.ts`
- `apps/api/src/modules/documents/document-reviews.service.ts`
- `apps/api/src/modules/documents/document-renderer.service.ts` (updateFormInputs)
- `apps/api/src/modules/documents/runtime-template-render.controller.ts`
- `apps/api/src/modules/cases/cases.controller.ts`
- `apps/api/src/modules/cases/cases.service.ts`
- `apps/api/src/modules/auth/agency-resource-access.service.ts`
- `apps/api/prisma/schema.prisma`

### Frontend

- `apps/web/src/app/templates/[templateCode]/page.tsx`
- `apps/web/src/app/documents/[documentId]/page.tsx`
- `apps/web/src/components/documents/template-preview-workspace.tsx`
- `apps/web/src/components/documents/generated-document-workspace.tsx`
- `apps/web/src/lib/generated-documents-api.ts`
- `apps/web/src/lib/runtime-template-preview.ts`
- `apps/web/src/lib/api-client.ts`
- `apps/web/src/lib/cases-api.ts`
- `apps/web/src/lib/case-detail-api.ts`

### E2E

- `tests/e2e/runtime-preview-session.auth.spec.ts`
- `tests/e2e/preview-panel-honest-ux.auth.spec.ts`

### Docs

- `docs/PROJECT_SPEC.md`
- `docs/AUTH_RBAC_POLICY.md`
- `docs/SECURITY_POLICY.md`
- `docs/TESTING_STRATEGY.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/audit/runtime-visual-preview/architecture-notes.md`
- `docs/audit/runtime-visual-preview/latest.md`
- `docs/audit/runtime-visual-preview/latest.json`
