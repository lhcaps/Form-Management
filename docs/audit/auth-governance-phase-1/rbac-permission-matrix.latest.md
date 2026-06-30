# AUTH GOVERNANCE PHASE 1 — RBAC AND PERMISSION MATRIX

**Date:** 2026-06-30
**Phase:** Phase 6 — RBAC and Permission Matrix (PATCHED: Phase 1B)
**Provider:** Clerk (user-confirmed)

---

## 0. Provider/App Permission Split

**Clerk org role is coarse context only. QUANLYVKS DB permission is the final business authorization source.**

| Layer | Source | Purpose |
|-------|--------|---------|
| Identity | Clerk | User identity, email, session |
| Organization context | Clerk | Agency/coarse org mapping |
| Business permissions | QUANLYVKS DB | All legal, form, case, document permissions |
| Agency membership | QUANLYVKS DB | User-agency relationship |
| Role assignment | QUANLYVKS DB | Role-permission mapping |

---

## 1. Role Definitions

| Role | Description | Assignment | Break-glass |
|------|-------------|------------|-------------|
| `SYSTEM_ADMIN` | Full system access | Only via DB directly | Yes — use sparingly |
| `PERMISSION_ADMIN` | Manages users and roles within agency | DB role assignment | No |
| `FORM_EDITOR` | Can create/edit form templates | DB role assignment | No |
| `FORM_APPROVER` | Can approve/submit forms for publishing | DB role assignment | No |
| `OFFICIAL` | Default role. Can use published forms | DB role assignment | No |
| `REPORT_VIEWER` | Can view reports only | DB role assignment | No |
| `AUDITOR` | Can read audit logs | DB role assignment | No |
| `READ_ONLY` | Can view cases/documents only | DB role assignment | No |

---

## 2. Permission Definitions

| Permission | Description | Routes | Agency Scoped | Audit Event |
|-----------|-------------|--------|--------------|-------------|
| `case:read` | View cases | `GET /cases` | Yes | No |
| `case:create` | Create cases | `POST /cases` | Yes | Yes |
| `case:update` | Update cases | `PATCH /cases/:id` | Yes | Yes |
| `case:archive` | Archive cases | `PATCH /cases/:id/archive` | Yes | Yes |
| `document:read` | View documents | `GET /documents` | Yes | No |
| `document:create` | Create document batches | `POST /documents` | Yes | Yes |
| `document:update` | Update documents | `PUT /documents/:id` | Yes | Yes |
| `document:save-form-inputs` | Save form input data | `POST /documents/:id/form-inputs` | Yes | Yes |
| `document:export-docx` | Export to DOCX | `POST /documents/:id/render-docx` | Yes | Yes |
| `document:export-pdf` | Export to PDF | `POST /documents/:id/convert-pdf` | Yes | Yes |
| `document:view-export-history` | View export history | `GET /documents/:id/exports` | Yes | No |
| `template:read-published` | View published templates | `GET /templates` | Yes | No |
| `template:edit-draft` | Edit form drafts | `PATCH /admin/form-drafts/:id` | Agency | Yes |
| `template:submit-review` | Submit for review | `POST /admin/form-drafts/:id/submit-review` | Agency | Yes |
| `template:approve` | Approve/reject forms | `POST /admin/form-reviews/:id/approve` | Agency | Yes |
| `template:publish` | Publish forms | `POST /admin/form-versions/:id/publish` | Agency | Yes |
| `template:rollback` | Rollback published forms | `POST /admin/form-versions/:id/archive` | Agency | Yes |
| `form-studio:access` | Access Form Studio | `GET /admin/form-studio` | No | No |
| `permission:manage` | Manage permissions | `POST /admin/form-permissions` | Agency | Yes |
| `report:read` | View reports | `GET /cases/reports/summary` | Yes | No |
| `audit:read` | View audit logs | `GET /admin/audit-logs` | Agency | No |
| `agency:manage` | Manage agency settings | `PATCH /admin/agencies/:id` | Self only | Yes |
| `user:invite` | Invite users to agency | `POST /admin/users/invite` | Agency | Yes |
| `user:disable` | Disable users | `PATCH /admin/users/:id/disable` | Agency | Yes |

---

## 3. Role-Permission Matrix

| Permission | SYSTEM_ADMIN | PERMISSION_ADMIN | FORM_EDITOR | FORM_APPROVER | OFFICIAL | REPORT_VIEWER | AUDITOR | READ_ONLY |
|-----------|--------------|-----------------|-------------|---------------|----------|--------------|---------|-----------|
| case:read | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| case:create | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| case:update | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| case:archive | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| document:read | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| document:create | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| document:update | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| document:save-form-inputs | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| document:export-docx | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| document:export-pdf | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| document:view-export-history | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| template:read-published | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| template:edit-draft | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| template:submit-review | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| template:approve | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| template:publish | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| template:rollback | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| form-studio:access | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| permission:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| report:read | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| audit:read | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| agency:manage | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user:invite | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| user:disable | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Special Enforcement Rules

### 4.1 Official Cannot Access Form Studio

**Rule:** OFFICIAL cannot access `/admin/form-studio` or any admin routes.

**Enforcement:** PR-4 permission guard + middleware route protection.

### 4.2 Official Can Fill/Export Only Published Forms in Own Agency

**Rule:** OFFICIAL can fill and export only published templates within their agency scope.

**Enforcement:** Template must have `status = PUBLISHED` and `agency_id` must match user's agency.

### 4.3 Form Editor Cannot Approve Own Draft

**Rule:** A user with `template:edit-draft` CANNOT have `template:approve` for the same form template they created.

**Implementation:**

```typescript
// In form-studio.service.ts approve method
async approve(formVersionId: string, userId: string) {
  const formVersion = await this.getFormVersion(formVersionId);

  if (formVersion.createdByOfficialId === userId) {
    throw new ForbiddenException(
      'Bạn không thể phê duyệt biểu mẫu do chính bạn tạo. Cần người khác duyệt.'
    );
  }
}
```

### 4.4 Form Approver Cannot Publish Unless Permission Exists

**Rule:** Approver can approve but cannot publish unless `template:publish` permission exists.

**Implementation:** `template:publish` is not assigned to `FORM_APPROVER` role. Separate role or explicit grant required.

### 4.5 Permission Admin Cannot Edit Legal Forms

**Rule:** PERMISSION_ADMIN can manage users/roles but cannot automatically edit legal forms.

**Implementation:** PERMISSION_ADMIN has no `template:edit-draft` permission.

### 4.6 Auditor Read-Only

**Rule:** AUDITOR can read logs but cannot mutate any data.

**Implementation:** AUDITOR has only `audit:read`. No write permissions assigned.

### 4.7 System Admin is Break-glass

**Rule:** SYSTEM_ADMIN is for emergency use only. Avoid routine use.

**Implementation:** SYSTEM_ADMIN assigned only via direct DB write. No UI for SYSTEM_ADMIN assignment.

### 4.8 Cross-Agency Access Denied by Default

**Rule:** All data operations must be scoped to the user's agency. No cross-agency access by default.

**Implementation:** Every query includes `WHERE agency_id = :agencyId`. Middleware verifies membership.

---

## 5. Clerk Integration

### 5.1 Clerk Roles vs App Permissions

| Clerk Role | Clerk Permissions | App Role | Notes |
|-----------|-------------------|----------|-------|
| `org:admin` | Full org admin | SYSTEM_ADMIN | Break-glass |
| `org:member` | Basic member | OFFICIAL | Default |
| `form_editor` | Custom metadata | FORM_EDITOR | Via public_metadata |
| `form_approver` | Custom metadata | FORM_APPROVER | Via public_metadata |
| `report_viewer` | Custom metadata | REPORT_VIEWER | Via public_metadata |
| `auditor` | Custom metadata | AUDITOR | Via public_metadata |

> **Important:** Clerk org roles and public_metadata are **hints only**. QUANLYVKS DB is the authoritative source for business permissions.

### 5.2 Public Metadata Structure (Hint Only)

```typescript
interface ClerkPublicMetadata {
  role: 'SYSTEM_ADMIN' | 'PERMISSION_ADMIN' | 'FORM_EDITOR' | 'FORM_APPROVER' |
        'OFFICIAL' | 'REPORT_VIEWER' | 'AUDITOR' | 'READ_ONLY';
  permissions?: string[]; // Hints only — do NOT enforce directly
  agency_id?: string;     // Hints only — do NOT enforce directly
}
```

---

## 6. Route Protection Matrix

| Route Pattern | Required Permission | Role Check | Agency Filter |
|---------------|---------------------|------------|---------------|
| `/cases` GET | `case:read` | — | ✅ |
| `/cases` POST | `case:create` | — | ✅ |
| `/cases/:id` GET | `case:read` | — | ✅ |
| `/cases/:id` PATCH | `case:update` | — | ✅ |
| `/documents/*` GET | `document:read` | — | ✅ |
| `/documents/*` POST | `document:create` | — | ✅ |
| `/documents/:id/form-inputs` | `document:save-form-inputs` | — | ✅ |
| `/documents/:id/render-docx` | `document:export-docx` | — | ✅ |
| `/documents/:id/convert-pdf` | `document:export-pdf` | — | ✅ |
| `/admin/form-studio` | `form-studio:access` | — | — |
| `/admin/form-drafts/*` | `template:edit-draft` | — | ✅ |
| `/admin/form-reviews/*` | `template:approve` | ✅ Self-check | ✅ |
| `/admin/form-versions/*/publish` | `template:publish` | — | ✅ |
| `/admin/form-permissions/*` | `permission:manage` | — | ✅ |
| `/admin/audit-logs` | `audit:read` | — | ✅ |
| `/reports` | `report:read` | — | ✅ |
