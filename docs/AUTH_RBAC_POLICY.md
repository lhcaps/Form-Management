# AUTH_RBAC_POLICY.md — Authentication & Authorization / RBAC Policy

> **Source:** Extracted from `docs/PROJECT_SPEC.md` §4.
> **Canonical reference:** `docs/PROJECT_SPEC.md` is the master spec.

---

## 1. Core Invariants [PERMANENT]

```
Authentication ≠ Authorization.

Clerk authenticates identity.
DB officials/auth_identities decide business authorization.

Unknown Clerk user → VIEWER, no agency, business access forbidden.
Linked Clerk user → role/agency/permission loaded from officials DB.
ADMIN → global access.
OFFICIAL → own agency only.
Cross-agency access → 403.
Missing resource → 404.
Null/missing user → 401.
Admin routes → explicit permission check.
UI hide/show is not a security boundary.
Server/API always checks permission.
```

---

## 2. Auth PR History

| PR | Content |
|----|---------|
| #21 | Clerk canonical auth workflow + API token bridge |
| #22 | Agency resource authorization |
| #23 | Clerk DB identity projection + webhook sync |
| #24 | Admin identity linking workflow |
| #25 | Admin UX in AppShell |
| #26 | Form permission admin scope hardening |
| #27 | Env/CSRF production hardening |

---

## 3. Two Auth Layers

### 3.1 API Auth

API supports **two mechanisms**:

```
Cookie: qlv_session
  → AuthService.validateSession()
  → lookup in DB

Bearer token: Clerk session token
  → AuthService.validateClerkSession()
  → verify with Clerk backend
```

`qlv_session` is an internal/legacy backend cookie. Acceptable for API/legacy tests only.

### 3.2 Web Route Auth

Protected Next.js web routes require **Clerk browser session**.

Examples:
```
/templates/:templateCode
/admin/*
/documents/*
```

> **Critical rule:** Do NOT test Clerk-protected web routes by injecting `qlv_session`.

```
qlv_session ≠ Clerk browser session.

Clerk-protected web routes need session managed by Clerk SDK/middleware,
including Clerk-managed cookies/storage/session state.
```

---

## 4. Clerk E2E Auth Strategy

Use **Clerk ticket strategy** for authenticated Playwright E2E.

### 4.1 Goals

```
- Do NOT automate password form
- Do NOT depend on MFA
- Do NOT hardcode password
- Do NOT use qlv_session to fake web auth
- Create real Clerk browser session, then save Playwright storageState
```

### 4.2 Standard Flow

```
1. Playwright global setup loads env from .env.e2e.local via dotenv
2. Clerk Backend API creates sign-in ticket for E2E_CLERK_USER_EMAIL
3. Playwright opens /sign-in
4. Browser waits for Clerk SDK to load
5. page.evaluate() calls window.Clerk.client.signIn.create({ strategy: "ticket" })
6. Clerk SDK calls setActive(session)
7. Playwright saves storageState to playwright/.clerk/admin.json
8. Authenticated specs reuse that storageState
```

### 4.3 Required E2E Env

```
E2E_CLERK_USER_EMAIL=admin@example.test
CLERK_PUBLISHABLE_KEY=<CLERK_PUBLISHABLE_KEY>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<CLERK_SECRET_KEY>
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

> **Not required:** `E2E_CLERK_USER_PASSWORD` — ticket strategy does not need password.

### 4.4 Identity Projection Requirement

```
Clerk user
  → auth_identities.provider = "clerk"
  → auth_identities.provider_user_id = Clerk user id
  → auth_identities.official_id
  → officials.role = ADMIN or required role
  → officials.is_active = true
  → agency is valid
```

If Clerk login passes but business route denies access → authorization/identity projection issue, NOT an E2E auth issue.

### 4.5 Failure Triage

| Symptom | Check |
|---------|-------|
| Redirect to sign-in | Clerk session/storageState |
| Sign-in succeeds but app denies access | `auth_identities` → `officials` mapping |
| Env missing | `.env.e2e.local` and dotenv load order |
| **Never fallback to `qlv_session` for Clerk web routes** | — |

---

## 5. VIEWER / Unknown Clerk Behavior

```
Unknown Clerk user (not linked) → VIEWER role
  → No agency
  → Business access forbidden
  → May view public content only
```

---

## 6. ADMIN / OFFICIAL Behavior

| Role | Agency Access | Global Access |
|------|--------------|--------------|
| ADMIN | Yes (all agencies) | Yes |
| OFFICIAL | Own agency only | No |
| VIEWER | None | No |

---

## 7. Security Rules

```
UI hide/show is not a security boundary.
Server/API always checks permission.
Admin routes require explicit permission check.
Cross-agency access → 403.
Missing resource → 404.
Null/missing user → 401.
```

---

*Canonical source: `docs/PROJECT_SPEC.md §4`*
