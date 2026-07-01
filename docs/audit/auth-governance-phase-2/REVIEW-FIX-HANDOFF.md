# AUTH PHASE 2A — REVIEW-FIX HANDOFF

**Date:** 2026-07-02
**Status:** READY_TO_MERGE
**Commit:** `13ceba74` (fixes applied: `4d5a1c3`)

---

## HTTP Status Code Semantics

All business API endpoints (cases, generated document files) follow this invariant:

| Condition | HTTP Status | Exception |
|-----------|-------------|-----------|
| Missing/null/empty session user | **401** | `UnauthorizedException` |
| Authenticated VIEWER or Clerk-only user | **403** | `ForbiddenException` |
| Authenticated OFFICIAL accessing cross-agency resource | **403** | `ForbiddenException` |
| Resource not found (case/document/file) | **404** | `NotFoundException` |
| Invalid request parameter (malformed ID) | **400** | `BadRequestException` |

### Defense-in-depth note

`AuthGuard` intercepts unauthenticated requests at the route level in production. The service-layer `requireBusinessUser` check is preserved as defense in depth and for unit-test correctness.

---

## Cases Authorization Behavior

| Endpoint | ADMIN | OFFICIAL (same agency) | OFFICIAL (cross-agency) | VIEWER / Clerk | Null User |
|----------|-------|----------------------|------------------------|----------------|-----------|
| `GET /cases` | All non-deleted | Own agency | 403 | 403 | **401** |
| `GET /cases/:id` | All non-deleted | Own agency | 403 | 403 | **401** |
| `POST /cases` | All agencies | Own agency (or body agency) | 403 | 403 | **401** |
| `PATCH /cases/:id` | All agencies | Own agency only | 403 | 403 | **401** |
| `GET /cases/reports/summary` | All agencies | Own agency | 403 | 403 | **401** |

### Implementation notes

- `findAll`: calls `requireBusinessUser(user)` — throws `UnauthorizedException` for null/undefined, `ForbiddenException` for VIEWER.
- `getReportSummary`: calls `requireBusinessUser(user)`, ADMIN sees all, OFFICIAL scoped to own agency.
- `create`: calls `requireBusinessUser(user)`, defaults `agency_id` to user's agency, OFFICIAL cannot specify a different agency in body.
- `findOne`: calls `requireBusinessUser(user)`, then `assertCanAccessCase(user, id)`.
- `update`: calls `requireBusinessUser(user)`, then `assertCanAccessCase(user, id)`, OFFICIAL cannot change `agencyId`.

---

## Generated Document Files Authorization Behavior

| Endpoint | ADMIN | OFFICIAL (same agency) | OFFICIAL (cross-agency) | VIEWER / Clerk | Null User |
|----------|-------|----------------------|------------------------|----------------|-----------|
| `GET .../files/:fileId/download` | All | Own agency | 403 | 403 | **401** |
| `DELETE .../files/:fileId` | All | Own agency | 403 | 403 | **401** |
| `POST .../files/bulk-delete` | All | Own agency | 403 (zero deletes) | 403 | **401** |
| `POST .../files/cleanup` | All | Own agency | 403 | 403 | **401** |

### Authorization order invariant

- **No filesystem read/delete/list and no DB delete** occurs before authorization passes.
- `downloadGeneratedFile`: `assertCanAccessGeneratedDocumentFile` → then `createReadStream`.
- `deleteGeneratedFile`: `assertCanAccessGeneratedDocumentFile` → then DB delete + `fs.rmSync`.
- `bulkDeleteGeneratedFiles`: preflight `assertCanAccessGeneratedDocumentFile` for **all** IDs → zero deletes if any fails → then batch delete.
- `cleanupGeneratedFiles`: calls `assertCanAccessGeneratedDocument(user, documentId)` — document-level authorization only (no `fileId` needed for cleanup). Lists candidates only after auth passes.

### Cleanup authorization fix

Previous implementation used `assertCanAccessGeneratedDocumentFile(documentId, '0')` which triggered `BadRequestException` (bad `fileId='0'`) before any auth check. Fixed by adding `assertCanAccessGeneratedDocument(user, documentId)` — a new method that authorizes at the document level without requiring a file ID.

---

## Files Changed

### Core implementation
- `apps/api/src/modules/auth/agency-resource-access.service.ts` — added `assertCanAccessGeneratedDocument` method
- `apps/api/src/modules/auth/auth.module.ts` — exported `AgencyResourceAccessService`
- `apps/api/src/modules/cases/cases.service.ts` — `findAll` now calls `requireBusinessUser`
- `apps/api/src/modules/cases/cases.controller.ts` — passes `CurrentUser` to service methods
- `apps/api/src/modules/documents/document-files.service.ts` — `cleanupGeneratedFiles` uses `assertCanAccessGeneratedDocument`
- `apps/api/src/modules/documents/document-files.controller.ts` — passes `CurrentUser` to service methods

### Tests
- `apps/api/src/modules/auth/agency-resource-access.service.spec.ts` — added 7 tests for `assertCanAccessGeneratedDocument`
- `apps/api/src/modules/cases/cases-authorization.spec.ts` — fixed null-user test to assert `UnauthorizedException` (401); updated cleanup test for `assertCanAccessGeneratedDocument`
- `apps/api/src/modules/documents/documents.module.spec.ts` — added `AuthModule` import

---

## Validation Results

| Command | Result |
|---------|--------|
| `pnpm --filter api test --runInBand` | ✅ 362 passed |
| `pnpm --filter api typecheck` | ✅ 0 errors |
| `pnpm --filter api lint` | ✅ 0 errors |
| `pnpm --filter api build` | ✅ exit 0 |

---

## PR

**Branch:** `feat/auth-phase-2a-agency-resource-authorization`
**PR URL:** https://github.com/lhcaps/Form-Management/pull/new/feat/auth-phase-2a-agency-resource-authorization

---

## Deferred (Out of Scope)

- Clerk webhook sync → Auth Phase 2B
- DB identity projection → Auth Phase 2B
- CSRF SameSite=None hardening
- Form permission admin scope hardening
- Export history / audit logs
- Real Clerk E2E tests
