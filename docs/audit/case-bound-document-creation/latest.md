# Case-bound Document Creation — Discovery Report

> Generated: 2026-07-03
> Branch: `feat/case-bound-document-creation`
> Scope: PR #34 — design phase

## Status

**DISCOVERY_ONLY**

---

## Recommendation

**Option B** — Add a new thin `POST /api/v1/documents/from-template` endpoint in `DocumentsController`.

**Short decision**: The batch creation endpoint (`POST /documents/cases/:caseId/batches`) is the wrong abstraction for single-document creation. Option B is the cleanest approach with the least risk.

---

## Why This Is the Best Approach

### 1. No existing `createOrOpenEditableDraft()` method exists

The only way to create a `generated_document` today is through batch creation:
- `POST /documents/cases/:caseId/batches`
- Creates `document_generation_batch` rows
- Generates multiple documents for PERSON_LEVEL templates
- Sets `review_status = "WAITING_REVIEW"`
- Does NOT support idempotent single-document create/open
- Does NOT support `batch_id = null` for standalone documents

### 2. The batch endpoint is wrong abstraction for this flow

Batch creation assumes:
- Multiple templates selected
- A batch record per creation
- PERSON_LEVEL → one doc per person
- Not idempotent

Our flow needs:
- Single template + single case
- No batch record
- Idempotent: open existing draft if already created
- No multi-document expansion

### 3. Option B cleanly bridges the gap

```
/templates/:code → case picker → POST /api/v1/documents/from-template → /documents/:id?tab=preview
```

- One new controller method
- One new DTO
- One new service method
- Reuses: Prisma model, audit service, authorization service, agency scoping
- Reuses: frontend case picker, document workspace
- Proper idempotency via `batch_id IS NULL` + `review_status = 'WAITING_REVIEW'` query

### 4. Why NOT the other options

- **Option A (reuse batch)**: Wrong abstraction. Creates batch rows, multi-doc logic, wrong lifecycle.
- **Option C (query routing)**: Ambiguous lifecycle. No server validation. Easy to fake workspace.
- **Option D (persist runtime)**: Mixes temporary and persisted flows. Rejects cleanly per spec.

---

## Files Inspected

### Backend (API)

| File | Relevance |
|---|---|
| `apps/api/src/modules/documents/documents.controller.ts` | Existing endpoints, batch creation pattern |
| `apps/api/src/modules/documents/documents.service.ts` | `createBatch()`, canonical `render_payload_snapshot` shape |
| `apps/api/src/modules/documents/documents.service.spec.ts` | Batch creation tests, snapshot shape |
| `apps/api/src/modules/documents/generated-document-audit.service.ts` | Audit event constants, `record()`, `buildActor()` |
| `apps/api/src/modules/documents/document-reviews.service.ts` | Review status mapping, status constants |
| `apps/api/src/modules/documents/document-renderer.service.ts` | `updateFormInputs()` — form data storage |
| `apps/api/src/modules/documents/runtime-template-render.controller.ts` | Runtime preview session pattern |
| `apps/api/src/modules/cases/cases.controller.ts` | `GET /cases`, `GET /cases/:id` |
| `apps/api/src/modules/cases/cases.service.ts` | `findAll()`, `findOne()`, agency scoping |
| `apps/api/src/modules/auth/agency-resource-access.service.ts` | `assertCanAccessCase()`, `assertCanAccessAgency()` |
| `apps/api/prisma/schema.prisma` | Entity definitions, indexes, constraints |

### Frontend (Web)

| File | Relevance |
|---|---|
| `apps/web/src/app/templates/[templateCode]/page.tsx` | Entry point for `/templates/:code` |
| `apps/web/src/app/documents/[documentId]/page.tsx` | Document workspace entry |
| `apps/web/src/components/documents/template-preview-workspace.tsx` | Template page UI, case picker, CTA button state |
| `apps/web/src/components/documents/generated-document-workspace.tsx` | Document workspace with tabs |
| `apps/web/src/lib/generated-documents-api.ts` | Frontend API client for documents |
| `apps/web/src/lib/runtime-template-preview.ts` | Runtime preview session client |
| `apps/web/src/lib/api-client.ts` | Authenticated fetch wrapper |
| `apps/web/src/lib/cases-api.ts` | Case API client |
| `apps/web/src/lib/case-detail-api.ts` | Case detail client |

### E2E

| File | Relevance |
|---|---|
| `tests/e2e/runtime-preview-session.auth.spec.ts` | Authenticated E2E patterns |
| `tests/e2e/preview-panel-honest-ux.auth.spec.ts` | Runtime preview E2E |

### Docs

| File | Relevance |
|---|---|
| `docs/PROJECT_SPEC.md` | System invariants, workspace boundary, audit actions |
| `docs/AUTH_RBAC_POLICY.md` | Auth/RBAC invariants |
| `docs/SECURITY_POLICY.md` | Pattern blacklist, secret policy |
| `docs/TESTING_STRATEGY.md` | Testing layers, E2E strategy |
| `docs/RELEASE_CHECKLIST.md` | Release gates |
| `docs/audit/runtime-visual-preview/architecture-notes.md` | Prior PR architecture notes |
| `docs/audit/runtime-visual-preview/latest.md` | Prior PR report |

---

## Implementation Plan for PR #34

### Step 1 — Backend: New DTO

Create `CreateFromTemplateDto` in `apps/api/src/modules/documents/dto/`:

```typescript
export class CreateFromTemplateDto {
  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @IsString()
  @IsNotEmpty()
  caseId: string;
}
```

### Step 2 — Backend: New Service Method

Add `createFromTemplate()` method to `DocumentsService`:

```typescript
async createFromTemplate(
  dto: CreateFromTemplateDto,
  user: CurrentUser,
): Promise<CreateFromTemplateResponse> {
  // 1. Parse and validate IDs
  // 2. Resolve template from templateCode
  // 3. Authorization: assertCanAccessCase(user, caseId)
  // 4. Idempotency: find existing draft (batch_id IS NULL, WAITING_REVIEW, own)
  // 5. If found → return existing (created=false, existingDraft=true)
  // 6. If not found → create new document row
  // 7. Write GENERATED_DOCUMENT_CREATED audit (only on new)
  // 8. Return response
}
```

### Step 3 — Backend: New Controller Endpoint

Add to `DocumentsController`:

```typescript
@Post('from-template')
@ApiOperation({ summary: 'Tạo hoặc mở bản nháp văn bản từ biểu mẫu' })
async createFromTemplate(
  @Body() body: CreateFromTemplateDto,
  @CurrentUserDecorator() user: CurrentUser,
  @Req() req: Request,
) {
  const result = await this.documentsService.createFromTemplate(body, user);
  void this.audit.record({ /* GENERATED_DOCUMENT_CREATED if result.created */ });
  return result;
}
```

### Step 4 — Frontend: Client API

Add to `generated-documents-api.ts`:

```typescript
export async function createDocumentFromTemplate(payload: {
  templateCode: string;
  caseId: string;
}): Promise<CreateFromTemplateResponse> {
  return readApi<CreateFromTemplateResponse>('/documents/from-template', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
```

### Step 5 — Frontend: Enable CTA and Wire Up

Modify `template-preview-workspace.tsx`:

```typescript
// Enable CTA button
<button
  type="button"
  onClick={() => void openDocumentCreationCasePicker()}
  disabled={!runtime || creatingDocument}
>
  {creatingDocument ? "Đang tạo..." : "Tạo văn bản từ hồ sơ"}
</button>

// Case picker for document creation
async function handleCreateFromCase(caseItem: CaseOption) {
  setCreatingDocument(true);
  try {
    const result = await createDocumentFromTemplate({
      templateCode: normalizedTemplateCode,
      caseId: caseItem.id,
    });
    router.push(`/documents/${result.documentId}?tab=preview`);
  } catch (err) {
    setError(err instanceof Error ? err : new Error("Không tạo được bản nháp."));
  } finally {
    setCreatingDocument(false);
  }
}
```

### Step 6 — Tests

1. Backend unit tests in `documents.service.spec.ts`
2. Frontend unit tests for CTA state changes
3. E2E test: authenticated user creates document from template

### Step 7 — Docs

Update `docs/PROJECT_SPEC.md` to document the new endpoint and workspace boundary.

---

## Validation Plan

### Commands

```bash
# TypeScript
pnpm --filter api exec tsc --noEmit
pnpm --filter web exec tsc --noEmit

# Tests
pnpm --filter api test --runInBand
pnpm test:web-unit

# E2E (authenticated)
pnpm test:e2e:auth

# Audit gates
pnpm audit:hardcode
pnpm audit:locked-compiled
pnpm audit:contract-sync

# Build
pnpm build

# Lint
pnpm lint
```

### Expected Results

| Check | Expected |
|---|---|
| `pnpm --filter api exec tsc --noEmit` | PASS |
| `pnpm --filter web exec tsc --noEmit` | PASS |
| `pnpm --filter api test --runInBand` | PASS (all suites including new tests) |
| `pnpm audit:hardcode` | PASS |
| `pnpm audit:locked-compiled` | PASS |
| `pnpm audit:contract-sync` | PASS |
| `pnpm build` | PASS |
| `pnpm lint` | PASS |

### Smoke Checklist

```
□ GET /templates/BM-001 → loads
□ Click "Tạo văn bản từ hồ sơ" → case picker opens
□ Select case → loading state
□ Navigate to /documents/:id?tab=preview
□ Document workspace renders correctly
□ Audit log row exists for GENERATED_DOCUMENT_CREATED
□ Cross-agency → 403 error message
□ Re-open same case+template → same document returned (not new)
□ Unauthenticated → redirect to sign-in
```

---

## Open Questions

### 1. Should `initialFormData` be accepted in v1?

**Decision needed**: Should the runtime form data be carried into the generated document draft?

**Recommendation**: NO for v1. Create with empty `formInputs: {}`. User edits in workspace.

**Reason**: Runtime form data is client-side state that has not been validated against the contract schema. Persisting unvalidated data risks malformed data in `render_payload_snapshot.formInputs`.

**Future**: If desired, validate server-side against contract schema with `forbidNonWhitelisted: true` before accepting.

### 2. Should the "Nhập từ hồ sơ" (data import) flow be connected to the CTA?

Currently, selecting a case via "Nhập từ hồ sơ" imports data into the runtime form fields. Should the CTA automatically use the already-selected case?

**Recommendation**: YES — if a case is already selected (badge shows `selectedCase`), the CTA should directly call the creation API without re-opening the case picker.

### 3. Should the case picker show agency info?

The existing case picker in `template-preview-workspace.tsx` shows `caseCode` and `caseTitle`. Should it also show the agency name for cross-agency awareness?

**Recommendation**: Add agency info to case picker rows in a follow-up if needed. Not a v1 blocker.

### 4. Should `document_code` be auto-generated in v1?

The `generated_documents` model has `document_code` as nullable. Currently batch creation sets it to `{templateCode}-{timestamp}`. Should the same pattern apply?

**Recommendation**: YES, use the same pattern: `{templateCode}-{Date.now()}` for uniqueness.

### 5. What if the same case+template has multiple "standalone" drafts?

The idempotency query finds the first `WAITING_REVIEW` standalone document. If multiple exist (shouldn't happen normally), the first one is returned.

**Risk**: Low. With `created_by_name = user.fullName` filter, each user only sees their own drafts.

---

## Summary

PR #34 needs:

```
NEW: 1 DTO
NEW: 1 service method
NEW: 1 controller endpoint
NEW: 1 frontend API client function
CHG: template-preview-workspace.tsx (enable CTA, wire up)
NEW: 1 set of backend unit tests
NEW: 1 E2E spec
NEW: docs/PROJECT_SPEC.md update
```

**No migrations needed. No schema changes. No new dependencies.**
