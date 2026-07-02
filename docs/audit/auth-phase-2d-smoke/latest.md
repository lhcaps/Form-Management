# Auth Phase 2D — Production Auth/Admin Smoke + Hardening Report

**Generated:** 2026-07-02T09:47:00Z (UTC+7)  
**Phase:** Auth Phase 2D — Post-PR#25 Smoke  
**Status:** ✅ READY

---

## Git Baseline

| Field | Value |
|-------|-------|
| HEAD | `78a13f84` |
| Branch | `main` |
| Working Tree | Clean |
| Auth/Admin PRs | #21, #22, #23, #24, #25 (all merged) |

### Recent Commits
```
78a13f84 Admin UX — Place Identity Linking in App Shell (#25)
84bb0bfd feat(ui): integrate admin identity page into app shell sidebar
3ab4c2c1 fix(auth): make Le Huy seed fail-friendly for missing migrations
c1c86df2 feat(auth): improve Le Huy seed DX — prisma:seed alias, email env, docs
725b7457 Auth Phase 2C — Clerk Identity Linking Admin Workflow (#24)
a4a40095 Auth Phase 2B — Clerk DB Identity Projection and Webhook Sync (#23)
1672f43b Auth Phase 2A — Agency Resource Authorization for Cases and Generated Files (#22)
403b86e9 Clerk canonical auth workflow and API token bridge (#21)
```

---

## DB / Migration Status

| Check | Result |
|-------|--------|
| Migration Status | ✅ Up to date |
| Migrations Applied | 12 |
| DB Engine | MariaDB 11 @ 127.0.0.1:3307 |
| Tables Verified | `auth_identities`, `auth_identity_audit_logs` present |

**Note:** Full seed verification requires running `pnpm --filter api seed` with `SEED_LE_HUY_PASSWORD` env var. Manual login test recommended.

---

## Runtime Auth Smoke

### Endpoints Tested

| Endpoint | Without Auth | Expected | Result |
|----------|-------------|----------|--------|
| `GET /api/v1/health` | 200 | ✅ | ✅ PASS |
| `GET /api/v1/auth/me` | null (Public endpoint) | ✅ | ✅ PASS |
| `GET /api/v1/admin/auth/identities` | 401 | ✅ | ✅ PASS |

### Key Findings

- **`/me` is intentionally `@Public()`** — allows checking auth state without forcing login
- **Admin endpoint returns 401 without session** — correct protected behavior
- **MariaDB query bug (PR #25):** ✅ FIXED — no `mode: 'insensitive'` in codebase

---

## Frontend Smoke (Code Review)

### Topbar Auth Source Fix (PR #25)

| Check | Status |
|-------|--------|
| Uses `@/lib/auth-context` | ✅ Yes |
| Uses Clerk raw `isSignedIn` | ❌ Not present |
| Auth condition: `status === "unauthenticated"` | ✅ Correct |

**Verdict:** Topbar correctly uses app auth context, not raw Clerk state.

### Admin Identity Page

| Check | Status |
|-------|--------|
| Page exists in AppShell | ✅ Via PR #25 |
| Single sidebar | ✅ Via AppShell layout |
| Single topbar | ✅ Via AppShell layout |

---

## Authorization Regression

### PR #22 (Agency Resource Authorization) — Still Active

| Test Suite | Result |
|------------|--------|
| cases-authorization | ✅ PASS |
| auth service tests | ✅ PASS |
| **Total Tests** | **109/109 PASSED** |

### Guard Coverage

| Guard | Status |
|-------|--------|
| `AgencyResourceAccessService` | ✅ Implemented |
| `FormPermission` decorator | ✅ Implemented |
| Generated file access control | ✅ Implemented |

---

## Audit Table Schema

```sql
auth_identity_audit_logs {
  id                 BigInt (PK, autoincrement)
  actor_official_id  BigInt (FK -> officials)
  action             VARCHAR(64)
  identity_id        BigInt (FK -> auth_identities)
  provider           VARCHAR(50)
  provider_user_id   VARCHAR(255)
  before_official_id BigInt? (nullable)
  after_official_id  BigInt? (nullable)
  reason             VARCHAR(500)?
  metadata_json      JSON?
  created_at         DateTime (default: now())
}
```

**Audit log entries created on:** link, unlink operations by admin

**Note:** Full audit smoke test requires Clerk login and admin identity operations. Manual test recommended.

---

## Env / Hardening Findings

### CORS Configuration

| Field | Value | Assessment |
|-------|-------|------------|
| Development | `http://localhost:3000,http://127.0.0.1:3000` | ✅ Safe |
| Production | From `WEB_ORIGIN` env | ✅ No wildcard |
| TUNNEL_TEST mode | Cookie: Secure=true, SameSite=none | ✅ Required for tunnel |

### Cookie Security

| Field | Default | Production | Assessment |
|-------|---------|------------|------------|
| AUTH_COOKIE_SECURE | `false` | Must be `true` | ✅ Enforced |
| SameSite | `lax` | `none` in tunnel mode | ✅ Correct |

### Production Safety Checks

| Check | Status |
|-------|--------|
| ADMIN password not `admin123` | ✅ Throws if unchanged |
| CORS not wildcard | ✅ Throws if `*` |
| AUTH_COOKIE_SECURE=true | ✅ Required in production |

### Clerk Webhook

| Field | Status |
|-------|--------|
| CLERK_WEBHOOK_SECRET | Optional in dev |
| Svix signature verification | ✅ Implemented |
| Graceful rejection if missing | ✅ Logs warning |

---

## Validation Commands

| Command | Result | Notes |
|---------|--------|-------|
| `pnpm --filter api test --runInBand` | ✅ 381/381 | All tests pass |
| `pnpm --filter api lint` | ✅ PASS | ESLint clean |
| `pnpm --filter api exec tsc --noEmit` | ✅ PASS | TypeScript clean |
| `pnpm --filter web lint` | ✅ PASS | ESLint clean |
| `pnpm --filter web exec tsc --noEmit` | ✅ PASS | TypeScript clean |
| `pnpm build` | ⚠️ BLOCKED | Windows Prisma DLL lock (Linux CI handles) |

---

## Bugs Found / Fixed

### Fixed in PR #25 (Codex)

| Bug | Severity | Fix |
|-----|----------|-----|
| `mode: "insensitive"` in Prisma queries | 🔴 Critical | Removed — MariaDB incompatible |
| Topbar using Clerk raw state | 🟡 Medium | Uses `useAppAuth()` from auth-context |

### No New Bugs Found

No additional runtime bugs found during Phase 2D smoke testing.

---

## Residual Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| Clerk webhook not configured in dev | 🟡 Low | Graceful fallback, logs warning |
| Lê Huy admin not seeded yet | 🟡 Low | Run seed with env vars |
| TUNNEL_TEST mode enables cross-origin cookies | 🟡 Low | Only active when `TUNNEL_TEST=true` |
| Windows Prisma DLL lock blocks local build | 🟢 Info | Remote Linux CI handles this |

---

## Known Residual (Out of Scope)

| Item | Reason |
|------|--------|
| `node --test` root failures (213-form) | Baseline audit noise |
| shadcn v4 → v5 migration | Not auth-related |
| Role editor UI | Future work |
| Agency admin dashboard | Future work |
| Bulk identity linking | Future work |
| DOCX template preview | Not auth-related |

---

## Recommendation

**✅ READY**

All critical checks passed:
- ✅ 381/381 API tests pass
- ✅ Authorization regression pass (109 tests)
- ✅ MariaDB query bug fixed
- ✅ Topbar auth source fixed
- ✅ Env hardening verified
- ✅ Remote CI checks green (PR #25)

### Suggested Next Steps

1. **Option A: Auth Phase 2E — Env/CSRF Production Hardening**
   - Finalize production env setup
   - Test cross-origin cookie flow
   - Verify Clerk webhook in production

2. **Option B: Form Permission Admin Scope Hardening** (Recommended)
   - Implement `FORM_TEMPLATE_PERMISSION_ADMIN` scope
   - Add agency-scoped form permissions
   - This is a known gap from previous phases

---

**Report generated by:** Cursor/Codex  
**Phase:** Auth Phase 2D  
**Branch:** main  
**HEAD:** 78a13f84
