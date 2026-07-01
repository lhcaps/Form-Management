# AUTH GOVERNANCE PHASE 1 — CURRENT AUTH MAP

**Date:** 2026-06-30
**Phase:** Phase 1 — CodeGraph Current Auth Map

---

## 1. Auth Components Overview

### 1.1 Web Frontend — Auth Layer

| File | Purpose | Data Source | Trust Boundary | User-Visible Behavior |
|------|---------|-------------|----------------|----------------------|
| `apps/web/src/lib/auth-context.tsx` | React context providing user/session state | API `/auth/me` via `fetchMe()` | Client-side only | Shows authenticated/unauthenticated state, redirects to /login |
| `apps/web/src/lib/auth-client.ts` | API calls for auth operations | API endpoints | Server | Login/logout/fetchMe/fetchCurrentAgency |
| `apps/web/src/lib/auth-events.ts` | Event bus for auth state changes | In-memory pub/sub | Client-side | Dispatches "unauthorized" events to all listeners |
| `apps/web/src/components/auth/auth-gate.tsx` | Route protection wrapper | `useAuth()` hook | Client-side only | Redirects unauthenticated users, shows loading fallback |
| `apps/web/src/lib/permissions.ts` | Frontend UI permission helpers | User from auth context | Client-side only | Controls UI visibility, NOT security |
| `apps/web/src/app/login/page.tsx` | Login page | None | None | Username/password form, redirects after auth |
| `apps/web/src/lib/current-user.ts` | Local cache for current user | Memory/cache | Client-side only | Stores user for non-React access |

**Security Concern:** All frontend auth checks are client-side only. A malicious user can bypass `AuthGate` by manipulating the React tree or directly accessing routes. **Backend is the only authoritative source.**

**Production Safety:** ❌ NOT production-safe as sole security layer.

---

### 1.2 API Backend — Auth Layer

| File | Purpose | Data Source | Trust Boundary | Security Concern |
|------|---------|-------------|---------------|-----------------|
| `apps/api/src/modules/auth/auth.service.ts` | Core auth logic | `officials` + `auth_sessions` tables | Server | Session management, password verification |
| `apps/api/src/modules/auth/auth.guard.ts` | Global auth guard | `@Public()` decorator | Server | Enforces authentication on all routes |
| `apps/api/src/modules/auth/auth.controller.ts` | Auth endpoints | None | Server | Login/logout/me/users/agency/change-password |
| `apps/api/src/modules/auth/form-permission.guard.ts` | Form permission enforcement | `official_permissions` table | Server | Checks FORM_TEMPLATE_* permissions |
| `apps/api/src/modules/auth/form-permission.decorator.ts` | Permission decorator | N/A | Server | `@RequirePermissions(...)` annotation |
| `apps/api/src/modules/auth/current-user.decorator.ts` | `@CurrentUser()` injection | Request `currentUser` | Server | Extracts user from request |
| `apps/api/src/modules/auth/public.decorator.ts` | `@Public()` annotation | N/A | Server | Marks routes as unauthenticated |
| `apps/api/src/modules/auth/token.util.ts` | Session token generation | Node crypto | Server | 32-byte random, SHA-256 hash |
| `apps/api/src/modules/auth/password.util.ts` | Password hashing/verification | Node crypto | Server | scrypt with 64-byte key |
| `apps/api/src/modules/auth/auth.module.ts` | Auth module wiring | N/A | Server | Global guards, DI |
| `apps/api/src/modules/auth/current-user.type.ts` | Type definitions | N/A | Server | `PublicUser`, `UserRole`, `FormPermission` |

**Security Concern:** `AuthGuard` is global but only checks session validity. No role-based enforcement at the route level except `FormPermissionGuard` for form-studio endpoints. Agency scoping is checked in some queries but not enforced globally.

**Production Safety:** ⚠️ PARTIALLY production-safe. Basic auth works but lacks MFA, SSO, comprehensive RBAC, and cross-agency isolation.

---

### 1.3 Database — Auth Models

| Table | Purpose | Auth-Relevant Columns | Production Safety |
|-------|---------|----------------------|-------------------|
| `officials` | User accounts | `id`, `username`, `password_hash`, `role`, `is_active`, `agency_id` | ⚠️ No external IdP, legacy role fallback |
| `auth_sessions` | Session tokens | `token_hash`, `official_id`, `expires_at`, `ip_address`, `user_agent` | ⚠️ No JWT, no refresh tokens |
| `agencies` | Organization/agency | `id`, `agency_name`, `agency_code`, `parent_agency_id` | ✅ Adequate structure |
| `official_permissions` | Granular permissions | `official_id`, `agency_id`, `scope_key`, `permission_code`, `granted_by_official_id` | ⚠️ Only form-specific permissions exist |
| `audit_logs` | Generic audit trail | `actor_name`, `action`, `entity_type`, `entity_id`, `ip_address`, `user_agent`, `old_value_json`, `new_value_json` | ⚠️ Incomplete coverage |

**Existing Auth Schema Notes:**
- `officials.role` is `String` with values `ADMIN` or `OFFICIAL` (default `OFFICIAL`)
- Legacy fallback heuristic based on `position_title` for rows with NULL role
- `official_permissions` table supports agency-scoped permissions via `agency_id` column
- `scope_key` in permissions allows future expansion (currently unused)
- No `users` table — `officials` is the user model

---

### 1.4 Tests — Auth Coverage

| File | Purpose | Coverage |
|------|---------|----------|
| `apps/api/src/modules/auth/auth.controller.spec.ts` | Auth controller unit tests | ✅ Login throttling, password change, session revocation |
| `apps/api/src/modules/auth/auth.service.spec.ts` | Auth service unit tests | ✅ Session validation, user lookup |
| `apps/web/src/lib/auth-network.spec.ts` | API client error handling | ✅ 401 detection, error unwrapping |
| `tests/e2e/helpers/auth.ts` | E2E auth helper | ⚠️ Hardcoded admin/admin123 credentials |

**E2E Auth Helper Notes:**
- Uses `E2E_ADMIN_USERNAME` and `E2E_ADMIN_PASSWORD` from env
- Falls back to `admin`/`admin123` if not set
- No multi-role test user support
- No agency-scoped test user support

---

## 2. Session Flow

```
Browser                    Web (Next.js)                 API (NestJS)
  |                              |                            |
  |-- GET /login --------------> |                            |
  |<-- Login form --------------- |                            |
  |                              |                            |
  |-- POST /auth/login ---------> | -- POST /api/v1/auth/login -> |
  |                              |    body: {username, password}   |
  |                              |    IP: x-forwarded-for         |
  |                              |    User-Agent: browser         |
  |                              |                               |
  |                              | <-- {user, expiresAt} -------- |
  |                              |    Set-Cookie: qlv_session    |
  |<-- 200 + Cookie ------------ | <-- HTTP 200 ----------------- |
  |                              |                               |
  |-- GET /cases --------------> |                               |
  |    Cookie: qlv_session ----> | -- fetchMe() --------------> |
  |                              |    Cookie: qlv_session         |
  |                              |                               |
  |                              | <-- AuthUser ---------------- |
  |<-- Authenticated page ------- |                               |
  |                              |                               |
  |-- POST /auth/logout --------> | -- POST /api/v1/auth/logout -> |
  |                              |    Cookie: qlv_session         |
  |                              |                               |
  |                              | <-- {ok: true} --------------- |
  |<-- 200 (redirects /login) -- | <-- Cookie cleared ------------|
```

---

## 3. Current Permission Model

### 3.1 Roles (from `current-user.type.ts`)

```typescript
type UserRole = 'ADMIN' | 'OFFICIAL' | 'VIEWER';
```

**Note:** `VIEWER` is defined but not enforced anywhere in the codebase.

### 3.2 Form Permissions (from `auth-client.ts`)

```typescript
type FormPermission =
  | 'FORM_TEMPLATE_EDIT'      // Can open/edit forms in Form Studio
  | 'FORM_TEMPLATE_APPROVE'  // Can approve/reject submitted forms
  | 'FORM_TEMPLATE_PERMISSION_ADMIN'; // Can manage permissions for others
```

### 3.3 Permission Assignment Logic

From `auth.service.ts` `toPublicUser()`:

```typescript
const adminPermissions = [
  'FORM_TEMPLATE_EDIT',
  'FORM_TEMPLATE_APPROVE',
  'FORM_TEMPLATE_PERMISSION_ADMIN',
];

const permissions =
  role === 'ADMIN'
    ? [...adminPermissions]  // ADMIN gets all permissions
    : official_permissions   // OFFICIAL gets explicit grants only
        .map(p => p.permission_code)
        .filter(p => adminPermissions.includes(p));
```

**Current Gap:** Only 3 permissions exist. All other operations (case management, document generation, reports, exports) have NO granular permission model.

---

## 4. Agency Scoping

### 4.1 Current Agency Model

From schema:
- Each `official` belongs to one `agency` via `agency_id` FK
- Agencies have hierarchical structure via `parent_agency_id`
- `official_permissions` can optionally scope permissions to specific `agency_id`

### 4.2 Agency Enforcement Status

| Endpoint/Feature | Agency Enforcement | Status |
|-----------------|-------------------|--------|
| `/auth/agency` | Returns user's agency | ✅ Enforced |
| `/auth/me` | Returns user's agency | ✅ Enforced |
| `/cases` | No agency filter in queries | ❌ MISSING |
| `/documents` | No agency filter in queries | ❌ MISSING |
| Form Studio permissions | Checks agency_id in permission query | ✅ Partial |
| Admin routes | ADMIN role bypasses all | ⚠️ OK |

**Critical Gap:** Most data endpoints do NOT filter by `currentUser.agencyId`. Any authenticated user can potentially access all agencies' data.

---

## 5. Current User Model

```typescript
interface AuthUser {
  id: string;
  username: string | null;
  fullName: string;
  positionTitle: string | null;
  rankTitle: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;           // 'ADMIN' | 'OFFICIAL' | 'VIEWER'
  agencyId: string | null;
  agencyName: string | null;
  agencyCode: string | null;
  isActive: boolean;
  permissions: FormPermission[]; // Only 3 form-specific permissions
}
```

**Missing fields for production:**
- No `externalId` / provider identity field
- No `lastLoginAt`
- No `createdBy`
- No `mfaEnabled`
- No `locked` / `disabledAt`
- No `passwordChangedAt`

---

## 6. Audit Log Model

### 6.1 Current Audit Log Table

```prisma
model audit_logs {
  id             BigInt   @id @default(autoincrement())
  actor_name     String?  @db.VarChar(255)
  action         String   @db.VarChar(100)
  entity_type    String   @db.VarChar(100)
  entity_id      BigInt?
  case_id        BigInt?
  old_value_json Json?
  new_value_json Json?
  ip_address     String?
  user_agent     String?
  created_at     DateTime @default(now())
}
```

### 6.2 Audit Log Coverage Status

**LIKELY COVERED (based on code structure):**
- Form Studio publish/approve actions (via `form_contract_reviews`)
- Document generation events
- Case operations

**MISSING / UNKNOWN:**
- Auth events (login, logout, password change)
- Document save (form input save)
- Document export (DOCX/PDF)
- Template edits
- Permission changes
- Agency changes
- Session revocation

**Note:** Precise audit log coverage requires searching all service files for `audit_logs` table writes. This map documents the model; full coverage audit is in Phase 3.

---

## 7. Seed Data

### 7.1 Seed Admin Account

From `.env.example` and seed logic:
- **Username:** `admin`
- **Password:** `admin123` (⚠️ WEAK, must change for production)
- **Role:** `ADMIN`
- **Agency:** Seed default agency (e.g., "Viện kiểm sát")
- **Permissions:** All form permissions

### 7.2 Seed Agency

- **Name:** `Viện kiểm sát`
- **Code:** `VKS-DEFAULT`
- **Parent:** None (by default)

### 7.3 Production Safety Concern

Seed admin credentials are documented in `.env.example`. While the seed only runs on empty DB, the weak default password is a risk if production deployment fails to change it. The `assertProductionSafety()` check in `app-config.service.ts` enforces this.

---

## 8. Infrastructure Components

### 8.1 Auth Configuration

From `AppConfigService`:

| Config Key | Default | Production | Security |
|-----------|---------|------------|----------|
| `AUTH_SESSION_COOKIE_NAME` | `qlv_session` | `qlv_session` | ✅ Named but not secret |
| `AUTH_SESSION_TTL_DAYS` | 14 | 14 | ⚠️ No refresh token |
| `AUTH_COOKIE_SECURE` | `false` | `true` (enforced) | ✅ Required for HTTPS |
| `AUTH_COOKIE_SAMESITE` | `lax` | configurable | ✅ Good defaults |
| `AUTH_COOKIE_DOMAIN` | none | optional | ✅ For subdomain sharing |

### 8.2 Production Safety Checks

From `app-config.service.ts` `assertProductionSafety()`:
1. `AUTH_COOKIE_SECURE` must be `true` in production
2. `SEED_ADMIN_PASSWORD` must not be `admin123` in production
3. `API_CORS_ORIGIN` must not be `*` in production
4. `TUNNEL_TEST` mode skips checks for cross-origin development

**Note:** No MFA enforcement. No SSO requirement check.

---

## 9. Summary: Current Auth Posture

### Strengths

1. ✅ Session tokens are cryptographically random (32-byte, SHA-256 hashed)
2. ✅ Passwords use scrypt (adequate for current threat model)
3. ✅ Cookie is HttpOnly (prevents XSS token theft)
4. ✅ Production safety checks prevent weak defaults in production
5. ✅ Rate limiting on login (5/min) and password change (3/min)
6. ✅ Session revocation on password change
7. ✅ Global auth guard covers all API routes
8. ✅ Form permission model exists (3 permissions)
9. ✅ Agency-scoped permissions model exists in schema

### Weaknesses

1. ❌ No external IdP / SSO integration
2. ❌ No MFA capability
3. ❌ No JWT / standard token format
4. ❌ VIEWER role defined but not enforced
5. ❌ Only 3 form permissions — no other RBAC
6. ❌ No cross-agency data isolation enforcement
7. ❌ No comprehensive audit logging
8. ❌ No export history / traceability
9. ❌ No webhook sync capability for external IdP
10. ❌ No refresh token rotation
11. ❌ Seed admin password in environment files

### Assessment

**Current auth is adequate for internal-only deployment with trusted users.**

**NOT adequate for:**
- Multi-agency deployment with data isolation requirements
- Government/legal compliance requirements
- Enterprise SSO integration
- Audit/compliance logging
- Export traceability

**Recommendation:** Phase 1 should implement an external auth provider (Clerk recommended) to address these gaps.
