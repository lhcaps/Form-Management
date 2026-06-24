# QUANLYVKS — Frontend API Contract (Phase 1)

> Stable contract for FE development. Covers auth, cases, documents, templates, and admin form studio.
> Version: `v1` — prefix `/api/v1` on all routes.

---

## Table of Contents

1. [Global Rules](#1-global-rules)
2. [Auth](#2-auth)
3. [Cases](#3-cases)
4. [Documents](#4-documents)
5. [Templates](#5-templates)
6. [Forms Catalog (Public)](#6-forms-catalog-public)
7. [Form Runtime (Platform)](#7-form-runtime-platform)
8. [Admin Form Studio](#8-admin-form-studio)
9. [Imports](#9-imports)
10. [Known Limitations](#10-known-limitations)

---

## 1. Global Rules

### Base URL

```
/api/v1
```

### Authentication

- **Session cookie**: `qlv_session` (httpOnly, secure, sameSite=none in production).
- FE **must** set `credentials: 'include'` on every fetch:

```typescript
// Every API call must include credentials
const res = await fetch('/api/v1/cases', {
  credentials: 'include',   // ← required for cookie auth
});

// Login/logout
const loginRes = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username, password }),
});
```

- A `Bearer` token in `Authorization` header is also accepted (fallback auth).
- Login sets the cookie; logout clears it.
- Check `/auth/me` to verify session is alive.

### CORS

- `credentials: 'include'` requires `origin` in the CORS allow-list.
- Do **not** use `mode: 'cors'` with `credentials: 'include'` unless the origin is preflight-approved.
- Vercel deployments: set `WEB_ORIGIN` env var on the API.

### Error Response Shape

Every error follows this structure:

```typescript
{
  statusCode: number;   // HTTP status code
  code: string;        // semantic error code
  message: string;     // human-readable message (Vietnamese)
  requestId: string;   // stable request ID for tracing
  timestamp: string;   // ISO 8601
  path: string;        // request path
}
```

Example:

```json
{
  "statusCode": 400,
  "code": "INVALID_INPUT",
  "message": "Mã hồ sơ không hợp lệ.",
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2026-06-24T14:00:00.000Z",
  "path": "/api/v1/cases"
}
```

### Validation

- Backend enforces `whitelist`, `forbidNonWhitelisted`, `transform`, `forbidUnknownValues`.
- Send **only** whitelisted fields in request bodies.
- Unknown fields are silently stripped; unexpected types cause a `400`.

### Role / Permission Model

| Role | Behavior |
|---|---|
| `ADMIN` | Sees all cases regardless of agency. Has full form studio access by default. |
| `OFFICIAL` | Sees only cases belonging to their agency. Form studio requires explicit permissions. |

Permissions (granted individually):

| Permission | Description |
|---|---|
| `FORM_TEMPLATE_EDIT` | Create/edit/patch/submit form drafts |
| `FORM_TEMPLATE_APPROVE` | Approve/reject/publish form versions |
| `FORM_TEMPLATE_PERMISSION_ADMIN` | Manage permission grants |

### Agency Scope

- `GET /cases` is **scoped by agency**. ADMIN sees all; OFFICIAL sees only their agency's cases.
- If an OFFICIAL has no `agencyId`, the response is an **empty page** (not all cases).
- Authenticated but unknown agency: same — empty result, no 403.

---

## 2. Auth

### POST /auth/login

**Public.** Throttle: 5 attempts per minute.

```json
// Request
{ "username": "string", "password": "string" }

// Response 200
{
  "user": {
    "id": "string",
    "username": "string | null",
    "fullName": "string",
    "positionTitle": "string | null",
    "rankTitle": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "role": "ADMIN" | "OFFICIAL",
    "agencyId": "string | null",
    "agencyName": "string | null",
    "agencyCode": "string | null",
    "isActive": true,
    "permissions": ["FORM_TEMPLATE_EDIT", "FORM_TEMPLATE_APPROVE"]
  },
  "expiresAt": "2026-07-08T00:00:00.000Z"
}
// Sets cookie: qlv_session (httpOnly, secure, sameSite=none)

// Response 401
{ "statusCode": 401, "code": "...", "message": "Username không tồn tại hoặc đã bị khoá." }
```

### POST /auth/logout

**Public.** Clears cookie.

```json
// Response 200
{ "ok": true }
```

### GET /auth/me

**Public** (session-aware).

```json
// Response 200 — authenticated
{ "user": { ...same as login response... } }

// Response 200 — no session
null
```

### GET /auth/users

**Protected.** List active officials (for dropdowns/pickers).

```json
// Response 200
[
  {
    "id": "string",
    "fullName": "string",
    "positionTitle": "string | null",
    "agencyName": "string | null"
  }
]
```

### GET /auth/agency

**Protected.**

```json
// Response 200
{
  "id": "string",
  "name": "string",
  "code": "string | null",
  "parentName": "string | null"
}

// Response 200 (no agencyId)
null
```

### POST /auth/change-password

**Protected.** Throttle: 3 attempts per minute.

```json
// Request
{ "currentPassword": "string", "newPassword": "string (min 8 chars)" }

// Response 200
{ "ok": true, "revokedOtherSessions": 2 }

// Response 400 — same password
// Response 401 — wrong current password
```

---

## 3. Cases

### GET /cases

**Protected.** Paginated list. Scoped by agency for OFFICIAL.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Search case code, national code, title, summary |
| `stage` | string | e.g. `RECEPTION`, `INVESTIGATION`, `PROSECUTION`, `TRIAL` |
| `status` | string | e.g. `DRAFT`, `IN_PROGRESS`, `CLOSED` |
| `page` | number | Default: 1 |
| `pageSize` | number | Default: 20, max: 100 |

```json
// Response 200
{
  "items": [
    {
      "id": "string",
      "caseCode": "string",
      "nationalCaseCode": "string | null",
      "caseTitle": "string",
      "caseSummary": "string | null",
      "caseType": "CRIMINAL_CASE | CIVIL_CASE | ...",
      "sourceType": "string | null",
      "currentStage": "string",
      "currentStatus": "string",
      "wardId": "string | null",
      "agencyId": "string | null",
      "receivedDate": "date string | null",
      "acceptedDate": "date string | null",
      "prosecutedDate": "date string | null",
      "closedDate": "date string | null",
      "priority": "LOW | NORMAL | HIGH | URGENT",
      "note": "string | null",
      "createdByName": "string | null",
      "updatedByName": "string | null",
      "createdAt": "ISO string",
      "updatedAt": "ISO string"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /cases/reports/summary

**Protected.**

```json
// Query: ?period=WEEK&anchorDate=2026-06-24
// Response 200
{
  "period": "WEEK",
  "anchorDate": "2026-06-24",
  "generatedAt": "ISO string",
  "items": [
    {
      "periodLabel": "W25/2026",
      "caseCount": 10,
      "wards": [{ "wardName": "Phường 1", "count": 5 }],
      "offenses": [{ "offenseName": "Trộm cắp tài sản", "count": 3 }]
    }
  ]
}
```

### POST /cases

**Protected.** Create a new case.

```json
// Request body (all fields optional except caseTitle)
{
  "caseCode": "string | auto-generated",
  "nationalCaseCode": "string | null",
  "caseTitle": "string (required)",
  "caseSummary": "string | null",
  "caseType": "CRIMINAL_CASE | CIVIL_CASE",
  "sourceType": "string | null",
  "currentStage": "string",
  "currentStatus": "string",
  "wardId": "string | null",
  "agencyId": "string | null",
  "receivedDate": "YYYY-MM-DD | null",
  "priority": "LOW | NORMAL | HIGH | URGENT",
  "note": "string | null",
  "createdByName": "string (auto-filled from session)"
}

// Response 201 — returns full case detail (same as GET /cases/:id)
```

### GET /cases/:id

**Protected.**

```json
// Response 200
{
  "id": "string",
  "caseCode": "string",
  // ... all case fields ...
  "people": [
    {
      "id": "string",
      "personId": "string",
      "roleType": "ACCUSED | DEFENDANT | VICTIM | WITNESS | ...",
      "personOrder": 1,
      "legalStatus": "string | null",
      "isPrimary": true,
      "isActive": true,
      "note": "string | null",
      "person": {
        "id": "string",
        "fullName": "string",
        "gender": "string | null",
        "dateOfBirth": "date string | null",
        "birthYear": "number | null",
        "identityNo": "string | null",
        "currentAddress": "string | null",
        ...
      }
    }
  ],
  "offenses": [
    {
      "id": "string",
      "personId": "string | null",
      "offenseId": "string",
      "legalArticleId": "string | null",
      "offenseDescription": "string | null",
      "isPrimary": false,
      "isDeleted": false,
      "offense": {
        "id": "string",
        "offenseCode": "string",
        "offenseName": "string",
        "offenseGroup": "string | null",
        ...
      }
    }
  ],
  "assignments": [
    {
      "id": "string",
      "officialId": "string",
      "assignmentRole": "string",
      "assignedDate": "date string | null",
      "decisionNo": "string | null",
      "decisionDate": "date string | null",
      "isActive": true,
      "official": {
        "id": "string",
        "fullName": "string",
        "positionTitle": "string | null",
        "rankTitle": "string | null"
      }
    }
  ],
  "evidence": [
    {
      "id": "string",
      "evidenceCode": "string | null",
      "evidenceName": "string",
      "evidenceType": "string | null",
      "quantity": "string | null",
      "unit": "string | null",
      "description": "string | null",
      "currentStatus": "string",
      "storageLocation": "string | null",
      "isDeleted": false,
      "owner": { "id": "string", "fullName": "string" } | null
    }
  ],
  "recentGeneratedDocuments": [
    {
      "id": "string",
      "templateId": "string",
      "documentCode": "string",
      "documentTitle": "string",
      "targetScope": "CASE_LEVEL | PERSON_LEVEL | ...",
      "reviewStatus": "WAITING_REVIEW | APPROVED | REVISION_REQUESTED | CANCELLED",
      "generatedAt": "ISO string",
      "approvedAt": "ISO string | null"
    }
  ],
  "events": [
    {
      "id": "string",
      "eventType": "CASE_CREATED | CASE_STATUS_CHANGED | DOCUMENT_BATCH_CREATED | ...",
      "eventTitle": "string",
      "eventDescription": "string | null",
      "stageCode": "string | null",
      "statusBefore": "string | null",
      "statusAfter": "string | null",
      "eventDate": "ISO string",
      "createdByName": "string | null"
    }
  ]
}
```

### PATCH /cases/:id

**Protected.** Partial update.

```json
// Request body — any subset of create-case fields
// Response 200 — returns full case detail
```

### Evidence sub-resources (under `/cases/:caseId/evidence`)

| Method | Path | Description |
|---|---|---|
| GET | `/cases/:caseId/evidence` | List evidence |
| POST | `/cases/:caseId/evidence` | Add evidence |
| PATCH | `/cases/:caseId/evidence/:evidenceId` | Update evidence |
| DELETE | `/cases/:caseId/evidence/:evidenceId` | Soft-delete evidence |

### People sub-resources (under `/cases/:caseId/people`)

| Method | Path | Description |
|---|---|---|
| GET | `/cases/:caseId/people` | List case people |
| POST | `/cases/:caseId/people` | Add person to case |
| PATCH | `/cases/:caseId/people/:casePersonId` | Update link |
| DELETE | `/cases/:caseId/people/:casePersonId` | Soft-delete (deactivate) |

### Offenses sub-resources (under `/cases/:caseId/offenses`)

| Method | Path | Description |
|---|---|---|
| GET | `/cases/:caseId/offenses` | List offenses |
| POST | `/cases/:caseId/offenses` | Add offense |
| PATCH | `/cases/:caseId/offenses/:caseOffenseId` | Update offense |
| DELETE | `/cases/:caseId/offenses/:caseOffenseId` | Soft-delete |

### Assignments sub-resources (under `/cases/:caseId/assignments`)

| Method | Path | Description |
|---|---|---|
| GET | `/cases/:caseId/assignments` | List assignments |
| POST | `/cases/:caseId/assignments` | Add assignment |
| PATCH | `/cases/:caseId/assignments/:assignmentId` | Update assignment |
| DELETE | `/cases/:caseId/assignments/:assignmentId` | Soft-delete |

---

## 4. Documents

### GET /documents/cases/:caseId/available-templates

**Protected.** Returns templates applicable to the case.

```json
// Response 200
{
  "case": {
    "id": "string",
    "caseCode": "string",
    "caseTitle": "string",
    "currentStage": "string",
    "currentStatus": "string"
  },
  "targets": {
    "people": [
      {
        "casePersonId": "string",
        "personId": "string",
        "roleType": "ACCUSED | DEFENDANT | ...",
        "legalStatus": "string | null",
        "isPrimary": true,
        "personOrder": 1,
        "fullName": "string",
        "birthYear": "number | null",
        "residenceAddress": "string | null"
      }
    ]
  },
  "templates": [
    {
      "id": "string",
      "templateCode": "string",
      "templateNo": "string | null",
      "templateName": "string",
      "renderScope": "CASE_LEVEL | PERSON_LEVEL | SELECTED_PERSONS | EVIDENCE_LEVEL",
      "outputStrategy": "string",
      "stageCode": "string | null",
      "defaultOutputFormats": ["DOCX", "PDF"],
      "requiresReview": true,
      "targetMode": "Tạo 1 biểu mẫu cho toàn bộ hồ sơ | Tạo biểu mẫu riêng theo từng bị can/người liên quan",
      "group": {
        "id": "string",
        "groupCode": "string",
        "groupName": "string",
        "groupOrder": 1
      } | null
    }
  ]
}
```

### POST /documents/cases/:caseId/plan

**Protected.** Preview generation plan (no DB write).

```json
// Request body
{
  "templateIds": ["string", ...],
  "targetPersonIds": ["string", ...] | null,   // null = auto-select accused/defendant
  "formats": ["DOCX", "PDF"] | null            // null = DOCX + PDF
}

// Response 200
{
  "case": { ...same as above... },
  "formats": ["DOCX", "PDF"],
  "totalDocuments": 5,
  "items": [
    {
      "templateId": "string",
      "templateCode": "string",
      "templateNo": "string",
      "templateName": "string",
      "renderScope": "PERSON_LEVEL",
      "outputStrategy": "string",
      "targetPersonId": "string",
      "targetPersonName": "string",
      "documentTitle": "string"
    }
  ],
  "warnings": [
    "Biểu mẫu BM-003 cần bị can/người liên quan nhưng hồ sơ chưa có dữ liệu phù hợp."
  ]
}
```

### POST /documents/cases/:caseId/batches

**Protected.** Create batch of pending documents (no DOCX/PDF rendered yet).

> **Current limitation**: Documents are created with `reviewStatus: WAITING_REVIEW` and `validation_result.status: NOT_RENDERED_YET`. File download is not yet available in this phase.

```json
// Request body — same as /plan
// Response 201
{
  "id": "string",
  "batchCode": "DGB-2026-1740000000000",
  "caseId": "string",
  "requestedFormats": ["DOCX", "PDF"],
  "status": "COMPLETED",
  "totalDocuments": 5,
  "successDocuments": 5,
  "failedDocuments": 0,
  "createdAt": "ISO string",
  "completedAt": "ISO string",
  "documents": [
    {
      "id": "string",
      "templateId": "string",
      "templateCode": "string",
      "templateName": "string",
      "documentCode": "string",
      "documentTitle": "string",
      "targetScope": "PERSON_LEVEL",
      "targetPersonId": "string",
      "reviewStatus": "WAITING_REVIEW",
      "generatedAt": "ISO string",
      "approvedAt": null
    }
  ]
}
```

### GET /documents/batches/:batchId

**Protected.**

### GET /documents/generated

**Protected.** Search generated documents.

```json
// Query: ?caseId=&status=&templateId=&page=&pageSize=
// Response 200
{
  "items": [...],
  "pagination": { ... }
}
```

### GET /documents/generated/:documentId

**Protected.**

### GET /documents/generated/:documentId/history

**Protected.** Processing history.

### POST /documents/generated/:documentId/review

**Protected.** Approve/revise/cancel.

```json
// Request body
{
  "action": "APPROVE" | "REQUEST_REVISION" | "CANCEL",
  "reviewNote": "string | null"
}

// Response 200
{
  "id": "string",
  "reviewStatus": "APPROVED | REVISION_REQUESTED | CANCELLED",
  "approvedAt": "ISO string | null"
}
```

### GET /documents/generated/:documentId/render-payload

**Protected.** Get render data.

### POST /documents/generated/:documentId/form-inputs

**Protected.** Save form data before render.

### POST /documents/generated/:documentId/render-docx

**Protected.** Trigger DOCX render.

### GET /documents/generated/:documentId/files/:fileId/download

**Protected.** Download generated file (future phase).

### GET /document-review-queue

**Protected.** List documents awaiting review.

```json
// Response 200
[
  {
    "id": "string",
    "documentTitle": "string",
    "caseCode": "string",
    "caseTitle": "string",
    "templateName": "string",
    "reviewStatus": "WAITING_REVIEW | APPROVED | REVISION_REQUESTED | CANCELLED",
    "generatedAt": "ISO string",
    "generatedByName": "string | null"
  }
]
```

---

## 5. Templates

### GET /templates/groups

**Protected.** List template groups (sorted by `group_order`).

```json
// Response 200
[
  {
    "id": "string",
    "groupCode": "string",
    "groupName": "string",
    "groupOrder": 1,
    "description": "string | null"
  }
]
```

### GET /templates

**Protected.**

```json
// Query: ?q=&groupCode=&renderScope=&stageCode=&activeOnly=true&mine=
// Response 200 — paginated
{
  "items": [
    {
      "id": "string",
      "templateCode": "string",
      "templateNo": "string | null",
      "templateName": "string",
      "groupId": "string | null",
      "stageCode": "string | null",
      "renderScope": "CASE_LEVEL | PERSON_LEVEL | ...",
      "outputStrategy": "string",
      "isActive": true,
      "createdAt": "ISO string"
    }
  ],
  "pagination": { ... }
}
```

### GET /templates/:id

**Protected.** Full template detail.

---

## 6. Forms Catalog (Public)

> These endpoints are **public** (no auth required) but require the form contracts to be published in DB.

### GET /forms/catalog

**Public.**

```json
// Query: ?stage=01&status=locked&q=
// Response 200
{
  "forms": [
    {
      "sourceId": "BM-001",
      "templateCode": "string",
      "templateName": "string",
      "stageCode": "01",
      "stageName": "string",
      "status": "locked",
      "version": 1,
      "updatedAt": "ISO string"
    }
  ],
  "total": 213
}
```

### GET /forms/catalog/by-stage

**Public.** Grouped by stage.

### GET /forms/catalog/:sourceId

**Public.** Full contract detail. Throws 404 if not found.

```json
// Response 200
{
  "sourceId": "BM-001",
  "templateCode": "string",
  "templateName": "string",
  "stageCode": "01",
  "status": "locked",
  "version": 1,
  "draftJson": { ... },
  "compiledJson": { ... },
  "updatedAt": "ISO string"
}

// Response 404
// { "statusCode": 404, "message": "Không tìm thấy biểu mẫu." }
```

---

## 7. Form Runtime (Platform)

### GET /forms/runtime/:templateCode

**Protected.** Resolves published contract for runtime rendering.

```json
// Query: ?contractHash=
// Response 200
{
  "templateCode": "string",
  "templateName": "string",
  "contractHash": "string",
  "version": 1,
  "compiledJson": {
    "fields": [...],
    "renderBindings": [...]
  },
  "metadata": { ... }
}

// Response 404 — no published contract
```

---

## 8. Admin Form Studio

> All endpoints require `FORM_TEMPLATE_EDIT` permission unless noted.

### GET /admin/form-templates

```json
// Query: ?q=
// Response 200 — paginated
{
  "items": [...],
  "pagination": { ... }
}
```

### POST /admin/form-templates

**Requires**: `FORM_TEMPLATE_EDIT`.

```json
// Request body
{
  "templateName": "string",
  "templateCode": "string",
  "groupId": "string | null",
  "stageCode": "string | null"
}

// Response 201 — returns new template
```

### POST /admin/form-templates/import

**Requires**: `FORM_TEMPLATE_EDIT`. Multipart upload.

```typescript
const formData = new FormData();
formData.append('file', docxFile);
formData.append('templateName', 'Tên biểu mẫu');
formData.append('groupId', '1');

const res = await fetch('/api/v1/admin/form-templates/import', {
  method: 'POST',
  credentials: 'include',
  body: formData,
});
```

### GET /admin/form-drafts/:draftId

### PATCH /admin/form-drafts/:draftId

```json
// Request body
{
  "operations": [
    { "op": "add", "path": "/fields/0", "value": { ... } },
    { "op": "replace", "path": "/fields/0/label", "value": "Mới" }
  ],
  "expectedRevision": 3
}

// Response 200
{
  "id": "string",
  "revision": 4,
  "draftJson": { ... }
}
```

### DELETE /admin/form-drafts/:draftId

### POST /admin/form-drafts/:draftId/validate

### POST /admin/form-drafts/:draftId/preview

### POST /admin/form-drafts/:draftId/submit-review

**Requires**: `FORM_TEMPLATE_EDIT`.

### GET /admin/form-reviews/:id

**Requires**: `FORM_TEMPLATE_APPROVE`.

### POST /admin/form-reviews/:id/request-changes

**Requires**: `FORM_TEMPLATE_APPROVE`.

### POST /admin/form-reviews/:id/approve

**Requires**: `FORM_TEMPLATE_APPROVE`.

### POST /admin/form-versions/:id/publish

**Requires**: `FORM_TEMPLATE_APPROVE`.

### POST /admin/form-versions/:id/archive

**Requires**: `FORM_TEMPLATE_APPROVE`.

### GET /admin/form-preview-jobs/:jobId

### GET /admin/form-preview-jobs/:jobId/file

### GET /admin/form-permissions

**Requires**: `FORM_TEMPLATE_PERMISSION_ADMIN`.

### POST /admin/form-permissions

**Requires**: `FORM_TEMPLATE_PERMISSION_ADMIN`.

```json
// Request body
{
  "officialId": "string",
  "permission": "FORM_TEMPLATE_EDIT | FORM_TEMPLATE_APPROVE",
  "agencyId": "string | null"
}
```

### DELETE /admin/form-permissions/:id

**Requires**: `FORM_TEMPLATE_PERMISSION_ADMIN`.

---

## 9. Imports

### POST /import/upload

**Protected.** Multipart upload (max 20 files, 25MB each).

```typescript
const formData = new FormData();
files.forEach(f => formData.append('files', f));

const res = await fetch('/api/v1/import/upload', {
  method: 'POST',
  credentials: 'include',
  body: formData,
});
```

### GET /import/history

### GET /import/batches/:batchId

### POST /import/batches/:batchId/confirm

### GET /import/files/:fileId/download

---

## 10. Known Limitations

| # | Limitation | Workaround for FE |
|---|---|---|
| 1 | `POST /documents/cases/:caseId/batches` creates records with `NOT_RENDERED_YET` — no DOCX/PDF file to download yet | Show "Chờ duyệt" badge; download button disabled. |
| 2 | `/ready` returns 503 if contracts not published (BM-001, BM-002, BM-003 not locked) | Handle 503 gracefully; show "Hệ thống đang khởi tạo". |
| 3 | `GET /cases` for unauthenticated or OFFICIAL-without-agency returns empty page (not 401) | Check `total === 0` — this is correct behavior. |
| 4 | No CSRF token endpoint in this phase | Use Origin/Referer header enforcement (handled by `CsrfCookieGuard`). FE must use `credentials: 'include'`. |
| 5 | TypeScript `strict: false` — some response types use `any` in normalization layer | Treat normalized responses as `unknown`, narrow in FE. |
| 6 | Auth `username` is matched by `full_name` lowercase | Users log in with their `full_name` (lowercase normalized), not a separate username. |
| 7 | SameSite=None requires `Secure` cookie — won't work over plain HTTP | Dev: ensure `TUNNEL_TEST=true` or `AUTH_COOKIE_SECURE=false` is set; Production: HTTPS required. |
| 8 | `/auth/me` returns `null` (not 401) when not logged in | Treat `null` as "not authenticated". |

---

## Quick FE Integration Checklist

```typescript
// 1. API client base config
const api = {
  baseUrl: '/api/v1',
  credentials: 'include' as const,
};

// 2. Error handler
async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, credentials: 'include' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.statusCode, err.code, err.message, err.requestId);
  }
  return res.json();
}

// 3. Auth state
// GET /api/v1/auth/me → user | null

// 4. Pagination helper
// ?page=1&pageSize=20 → check response.pagination.totalPages
```
