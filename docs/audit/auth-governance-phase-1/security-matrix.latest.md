# AUTH GOVERNANCE PHASE 1 — SECURITY MATRIX

**Date:** 2026-06-30
**Phase:** Phase 2 — Route and API Security Matrix

---

## 1. Web Route Classification

| Route | Current Protection | Required Protection | Gap | Expected Roles | Agency Filter | Data Sensitivity | Audit Log | Export Perm |
|-------|------------------|-------------------|-----|---------------|--------------|-----------------|-----------|------------|
| `/` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | No | Medium | No | No |
| `/login` | `@Public()` | PUBLIC | ✅ OK | — | — | Low | No | No |
| `/cases` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | MISSING | High | No | No |
| `/cases/[caseId]` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | MISSING | High | No | No |
| `/documents` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | MISSING | High | No | No |
| `/documents/[documentId]` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | MISSING | High | No | No |
| `/templates` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | No | Medium | No | No |
| `/reports` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | MISSING | High | No | No |
| `/imports` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | MISSING | High | No | No |
| `/settings` | `AuthGate` (client) | AUTHENTICATED | ⚠️ Client-only | ALL | No | Medium | No | No |
| `/admin` | `AuthGate` (client) | ADMIN_ONLY | ⚠️ Client-only | ADMIN | No | High | No | No |
| `/admin/form-studio` | `AuthGate` + `canOpenFormStudio` | FORM_EDITOR | ⚠️ Client-only | FORM_EDITOR | No | High | No | No |
| `/admin/form-studio/permissions` | `AuthGate` + `canManageFormPermissions` | PERMISSION_ADMIN | ⚠️ Client-only | PERMISSION_ADMIN | No | Critical | PARTIAL | No |

**Key:** ✅ = OK, ⚠️ = Gap exists, ❌ = Critical gap

---

## 2. API Route Classification

### 2.1 Auth Endpoints (`/api/v1/auth/*`)

| Endpoint | Method | Current Protection | Required | Gap | Expected Roles | Audit Log | Notes |
|----------|--------|-------------------|---------|-----|---------------|-----------|-------|
| `/auth/login` | POST | `@Public()` | PUBLIC | ✅ OK | — | No | Rate limited 5/min |
| `/auth/logout` | POST | `@Public()` | PUBLIC | ✅ OK | — | No | Destroys session |
| `/auth/me` | GET | `@Public()` | AUTHENTICATED | ✅ OK | ALL | No | Returns user |
| `/auth/users` | GET | AUTHENTICATED | AUTHENTICATED | ✅ OK | ALL | No | List officials |
| `/auth/agency` | GET | AUTHENTICATED | AUTHENTICATED | ✅ OK | ALL | No | Returns agency |
| `/auth/change-password` | POST | AUTHENTICATED | AUTHENTICATED | ✅ OK | ALL | No | Rate limited 3/min |

### 2.2 Cases Endpoints (`/api/v1/cases/*`)

| Endpoint | Method | Current Protection | Required | Gap | Expected Roles | Agency Filter | Audit Log | Notes |
|----------|--------|-------------------|---------|-----|---------------|--------------|-----------|-------|
| `/cases` | GET | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency filter | ALL | MISSING | UNKNOWN | Lists all cases |
| `/cases/reports/summary` | GET | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency filter | ALL | MISSING | UNKNOWN | No auth user |
| `/cases` | POST | AUTHENTICATED | AUTHENTICATED | ✅ OK | ALL | OK | UNKNOWN | Creates case |
| `/cases/:id` | GET | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency filter | ALL | MISSING | UNKNOWN | Gets case detail |
| `/cases/:id` | PATCH | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency filter | ALL | MISSING | UNKNOWN | Updates case |

**Critical Gap:** All case endpoints lack `currentUser.agencyId` filter. Any authenticated user can read/update ALL agencies' cases.

### 2.3 Documents Endpoints (`/api/v1/documents/*`)

| Endpoint | Method | Current Protection | Required | Gap | Expected Roles | Agency Filter | Audit Log | Notes |
|----------|--------|-------------------|---------|-----|---------------|--------------|-----------|-------|
| `/documents/generated/:id/render-payload` | GET | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | UNKNOWN | Gets render data |
| `/documents/generated/:id/pre-export-config` | GET | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | UNKNOWN | Gets config |
| `/documents/generated/:id/pre-export-config` | PUT | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | UNKNOWN | Saves config |
| `/documents/generated/:id/pre-export-config/scan-blanks` | POST | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | UNKNOWN | Scans blanks |
| `/documents/generated/:id/form-inputs` | POST | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | MISSING | Saves form data |
| `/documents/generated/:id/render-docx` | POST | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | MISSING | **Renders DOCX** |
| `/documents/generated/:id/convert-pdf` | POST | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | MISSING | Converts to PDF |
| `/documents/generated/:id/files/:fileId/download` | GET | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | MISSING | **Downloads file** |
| `/documents/generated/:id/files/:fileId` | DELETE | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | UNKNOWN | Deletes file |
| `/documents/generated/:id/files/bulk-delete` | POST | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | UNKNOWN | Bulk delete |
| `/documents/generated/:id/files/cleanup` | POST | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | UNKNOWN | Cleanup files |

**Critical Gap:** All document endpoints lack agency ownership verification. Users can access ANY agency's documents.

### 2.4 Form Studio Endpoints (`/api/v1/admin/form-*`)

| Endpoint | Method | Current Protection | Required | Gap | Expected Roles | Agency Filter | Audit Log | Notes |
|----------|--------|-------------------|---------|-----|---------------|--------------|-----------|-------|
| `/admin/form-templates` | GET | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | No | Lists templates |
| `/admin/form-templates` | POST | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | UNKNOWN | Creates template |
| `/admin/form-templates/:id/open-design` | POST | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | No | Opens design |
| `/admin/form-drafts/:id` | GET | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | No | Gets draft |
| `/admin/form-drafts/:id` | PATCH | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | UNKNOWN | Updates draft |
| `/admin/form-drafts/:id` | DELETE | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | UNKNOWN | Deletes draft |
| `/admin/form-drafts/:id/validate` | POST | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | No | Validates draft |
| `/admin/form-drafts/:id/preview` | POST | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | No | Previews draft |
| `/admin/form-drafts/:id/submit-review` | POST | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | Yes | Submits for review |
| `/admin/form-reviews/:id` | GET | `@RequireFormPermissions('FORM_TEMPLATE_APPROVE')` | FORM_APPROVER | ✅ OK | FORM_APPROVER | No | No | Gets review |
| `/admin/form-reviews/:id/request-changes` | POST | `@RequireFormPermissions('FORM_TEMPLATE_APPROVE')` | FORM_APPROVER | ✅ OK | FORM_APPROVER | No | Yes | Requests changes |
| `/admin/form-reviews/:id/approve` | POST | `@RequireFormPermissions('FORM_TEMPLATE_APPROVE')` | FORM_APPROVER | ✅ OK | FORM_APPROVER | No | Yes | Approves form |
| `/admin/form-versions/:id/publish` | POST | `@RequireFormPermissions('FORM_TEMPLATE_APPROVE')` | FORM_APPROVER | ✅ OK | FORM_APPROVER | No | Yes | **Publishes form** |
| `/admin/form-versions/:id/archive` | POST | `@RequireFormPermissions('FORM_TEMPLATE_APPROVE')` | FORM_APPROVER | ✅ OK | FORM_APPROVER | No | Yes | Archives form |
| `/admin/form-permissions` | GET | `@RequireFormPermissions('FORM_TEMPLATE_PERMISSION_ADMIN')` | PERMISSION_ADMIN | ✅ OK | PERMISSION_ADMIN | PARTIAL | PARTIAL | Lists permissions |
| `/admin/form-permissions` | POST | `@RequireFormPermissions('FORM_TEMPLATE_PERMISSION_ADMIN')` | PERMISSION_ADMIN | ✅ OK | PERMISSION_ADMIN | PARTIAL | Yes | Grants permission |
| `/admin/form-permissions/:id` | DELETE | `@RequireFormPermissions('FORM_TEMPLATE_PERMISSION_ADMIN')` | PERMISSION_ADMIN | ✅ OK | PERMISSION_ADMIN | PARTIAL | Yes | Revokes permission |
| `/admin/form-preview-jobs/:id` | GET | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | No | Gets preview job |
| `/admin/form-preview-jobs/:id/file` | GET | `@RequireFormPermissions('FORM_TEMPLATE_EDIT')` | FORM_EDITOR | ✅ OK | FORM_EDITOR | No | No | Downloads preview |

**Status:** Form Studio endpoints are well-protected with `@RequireFormPermissions`. Audit logging exists for publish/approve/review actions but may be incomplete.

### 2.5 Runtime Forms Endpoints (`/api/v1/forms/*`)

| Endpoint | Method | Current Protection | Required | Gap | Expected Roles | Agency Filter | Audit Log | Notes |
|----------|--------|-------------------|---------|-----|---------------|--------------|-----------|-------|
| `/forms/runtime/:templateCode` | GET | AUTHENTICATED | AUTHENTICATED | ⚠️ No agency check | ALL | MISSING | No | Gets runtime form |
| `/form-platform/catalog` | GET | AUTHENTICATED (optional) | AUTHENTICATED | ✅ OK | ALL | OK | No | Lists published forms |
| `/form-platform/catalog/:code` | GET | AUTHENTICATED (optional) | AUTHENTICATED | ✅ OK | ALL | OK | No | Gets published form |

**Gap:** `/forms/runtime/:templateCode` does not verify agency ownership of the form contract.

### 2.6 Templates Endpoints (`/api/v1/templates/*`)

| Endpoint | Method | Current Protection | Required | Gap | Expected Roles | Audit Log | Notes |
|----------|--------|-------------------|---------|-----|---------------|-----------|-------|
| `/templates/groups` | GET | AUTHENTICATED | AUTHENTICATED | ✅ OK | ALL | No | Lists groups |
| `/templates` | GET | AUTHENTICATED | AUTHENTICATED | ✅ OK | ALL | No | Lists templates |
| `/templates/mine` | GET | AUTHENTICATED | AUTHENTICATED | ✅ OK | ALL | No | Lists user's templates |
| `/templates/:id` | GET | AUTHENTICATED | AUTHENTICATED | ✅ OK | ALL | No | Gets template |

### 2.7 System Endpoints

| Endpoint | Method | Current Protection | Required | Gap | Expected Roles | Notes |
|----------|--------|-------------------|---------|-----|---------------|-------|
| `/ready` | GET | `@Public()` | PUBLIC | ✅ OK | — | Readiness check |

---

## 3. Gap Summary by Category

### 3.1 AUTHENTICATED — All Users

| Gap | Severity | Routes Affected |
|-----|----------|----------------|
| No agency filter on case endpoints | P0 | `/cases/*` |
| No agency filter on document endpoints | P0 | `/documents/*` |
| No agency check on `/forms/runtime/:templateCode` | P1 | `/forms/runtime/*` |
| No audit log on form save | P1 | `POST /documents/*/form-inputs` |
| No audit log on document export (DOCX/PDF) | P0 | `POST /documents/*/render-docx`, `POST /documents/*/convert-pdf` |
| No export history | P0 | All export endpoints |
| Client-side route protection only | P1 | All web routes |
| No VIEWER role enforcement | P2 | All endpoints |

### 3.2 FORM_EDITOR — Form Studio Users

| Gap | Severity | Routes Affected |
|-----|----------|----------------|
| No agency filter on form-studio endpoints | P2 | `/admin/form-*` |
| No audit log on draft save | P2 | `PATCH /admin/form-drafts/:id` |
| No draft creator cannot approve own form | P2 | `/admin/form-reviews/*/approve` |

### 3.3 FORM_APPROVER — Form Approvers

| Gap | Severity | Routes Affected |
|-----|----------|----------------|
| No self-approval prevention | P2 | `/admin/form-reviews/*/approve` |
| Approver can silently publish | P2 | `/admin/form-versions/:id/publish` |

### 3.4 PERMISSION_ADMIN — Permission Managers

| Gap | Severity | Routes Affected |
|-----|----------|----------------|
| Permission changes partially audited | P2 | `/admin/form-permissions/*` |

---

## 4. STRIDE Analysis Summary

| Threat | Applicable Routes | Current Mitigation | Gap |
|--------|-----------------|-------------------|-----|
| **Spoofing** | All authenticated | Session tokens, password auth | No MFA, no SSO |
| **Tampering** | All write endpoints | None | No request signing, no integrity verification |
| **Repudiation** | All endpoints | Partial audit_logs | Auth events not logged, form saves not logged, exports not logged |
| **Information Disclosure** | Case/document endpoints | None | No cross-agency isolation, any user sees all data |
| **Denial of Service** | Login endpoint | Rate limiting (5/min) | No account lockout after failures |
| **Elevation of Privilege** | Form-studio endpoints | Permission guards | No self-approval prevention, no VIEWER enforcement |

---

## 5. Priority Actions

### P0 — Critical (Must Fix Before Production)

1. Add agency filter to all case endpoints
2. Add agency filter to all document endpoints
3. Add audit log to document export (DOCX/PDF)
4. Add export history tracking
5. Add agency ownership verification to `/forms/runtime/:templateCode`

### P1 — High (Should Fix)

1. Add audit log to form save operations
2. Replace client-side `AuthGate` with server-side middleware
3. Add MFA capability
4. Add SSO integration
5. Implement account lockout after failed login attempts

### P2 — Medium (Should Plan)

1. Prevent self-approval of forms
2. Enforce VIEWER role
3. Add agency filter to form-studio endpoints
4. Complete audit log coverage
5. Add request signing/integrity verification
