# AUTH GOVERNANCE PHASE 1 — CLERK IMPLEMENTATION ROADMAP

**Date:** 2026-06-30
**Phase:** Phase 10 — Implementation Roadmap (PATCHED: Phase 1B)
**Provider:** Clerk (user-confirmed 2026-06-30)

---

## 0. PR Sequence Overview

```mermaid
gantt
    title QUANLYVKS Auth Implementation (Clerk)
    dateFormat  YYYY-MM-DD
    section Foundation
    PR-1: Clerk Foundation       :2026-07-01, 7d
    PR-2: User/Agency Projection :2026-07-08, 7d
    section Security
    PR-3: API JWT Validation    :2026-07-15, 7d
    PR-4: RBAC Guards           :2026-07-22, 7d
    section Compliance
    PR-5: Audit Logging        :2026-08-01, 7d
    PR-6: Export History        :2026-08-08, 7d
    section Migration
    PR-7: E2E Migration        :2026-08-15, 7d
```

---

## 1. PR-1: Clerk Foundation

**Scope:** Auth provider foundation only. No DB changes, no API enforcement, no final RBAC.

### Goals

- Install `@clerk/nextjs` SDK
- Add `ClerkProvider` at web root
- Add `clerkMiddleware()` for route protection
- Add sign-in/sign-up pages
- Add `UserButton` in topbar
- Add Clerk env vars to `.env.example`
- **Keep old auth intact** — no removal, no API changes
- No DB migration
- No API JWT enforcement
- No final RBAC

### Files Likely Changed

```
NEW:
  apps/web/src/app/sign-in/[[...sign-in]]/page.tsx
  apps/web/src/app/sign-up/[[...sign-up]]/page.tsx
  apps/web/.env.example
  apps/web/.env.docker.example
  docs/audit/auth-governance-phase-2/          # Phase 2 artifacts

MODIFIED:
  apps/web/src/app/layout.tsx                   # Add ClerkProvider
  apps/web/src/middleware.ts                    # Clerk route protection
  apps/web/src/components/layout/topbar.tsx      # Add UserButton
  apps/web/src/lib/api-client.ts                 # Optional: Bearer token helper
```

### Tests

```typescript
// apps/web/src/app/sign-in/sign-in.test.tsx
test('unauthenticated user redirects to /sign-in', async ({ page }) => {
  await page.goto('/cases');
  await expect(page).toHaveURL(/\/sign-in/);
});

test('authenticated user can access /templates', async ({ page }) => {
  await authenticateAs(page, 'official');
  await page.goto('/templates');
  await expect(page).toHaveURL(/\/templates/);
});

test('sign out returns to sign-in', async ({ page }) => {
  await authenticateAs(page, 'official');
  await page.getByRole('button', { name: /user/i }).click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});
```

### Validation Commands

```bash
pnpm typecheck
pnpm test:web-unit
# Manual:
# 1. Open / → should redirect to /sign-in
# 2. Sign in → should redirect to /
# 3. Access /templates → should load
# 4. Sign out → should redirect to /sign-in
```

### Rollback

```bash
# Remove ClerkProvider from layout.tsx
# Remove middleware.ts (or restore previous version)
# Remove sign-in/sign-up routes
# Restore previous topbar
# Remove Clerk env vars
# pnpm remove @clerk/nextjs
```

### Risk Level: **MEDIUM**

- User-facing auth change
- No backend impact (old API auth still works)
- Can rollback easily

### Merge Gates

1. `pnpm typecheck` passes
2. `pnpm test:web-unit` passes
3. Existing auth still works (old API endpoints functional)
4. Manual testing: sign-in, sign-out, protected routes

---

## 2. PR-2: User/Agency Projection

### Goals

- DB migration for new tables
- `auth_identities` table
- `agencies.clerk_org_id` column
- `agency_memberships` table
- `provider_webhook_events` table
- Clerk webhook endpoint for user/org sync
- Idempotent event processing
- Seed dev agency/user
- **No full RBAC yet**

### Files Likely Changed

```
NEW:
  apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_auth_tables/
  apps/api/src/modules/webhooks/
    clerk-webhook.module.ts
    clerk-webhook.controller.ts
    clerk-webhook.service.ts
  apps/api/src/modules/auth/
    guards/clerk-jwt.guard.ts   # Reference only, not enforced yet

MODIFIED:
  apps/api/prisma/schema.prisma
  apps/api/src/app.module.ts
  apps/api/src/main.ts
```

### Tests

```typescript
test('webhook creates auth_identity on user.created')
test('webhook updates auth_identity on user.updated')
test('webhook handles user.deleted')
test('webhook creates agency on organization.created')
test('webhook creates membership on organizationMembership.created')
test('idempotency: same event_id processed once')
test('handles missing official gracefully')
```

### Validation Commands

```bash
pnpm typecheck
pnpm db:migrate:deploy
pnpm db:seed:test
pnpm test:api
```

### Rollback

```bash
pnpm db:migrate:rollback --steps 1
```

### Risk Level: **HIGH**

- DB schema change
- Webhook processing
- User sync logic

### Merge Gates

1. `pnpm typecheck` passes
2. `pnpm db:migrate:deploy` succeeds
3. `pnpm test:api` passes
4. Webhook events processed correctly
5. Existing officials preserved

---

## 3. PR-3: API JWT Validation

### Goals

- Web sends `Authorization: Bearer <Clerk JWT>` to API
- API validates Clerk JWT via JWKS
- API extracts: `providerUserId`, `orgId`, `email`
- API maps provider identity to local `User`
- API maps active org to `Agency`
- API injects `RequestUserContext` into controllers/services
- Protect **read endpoints first**
- Test env bypass only explicit and isolated

### Files Likely Changed

```
NEW:
  apps/api/src/modules/auth/
    guards/clerk-jwt.guard.ts
    guards/agency-context.guard.ts
    middleware/clerk-auth.middleware.ts

MODIFIED:
  apps/api/src/modules/auth/auth.module.ts   # Register new guards
  apps/api/src/app.module.ts
```

### Tests

```typescript
test('accepts valid Clerk JWT')
test('rejects expired token')
test('rejects invalid signature')
test('rejects missing Authorization header')
test('extracts user context correctly (sub, org_id, email)')
test('maps Clerk org to QUANLYVKS agency')
```

### Validation Commands

```bash
pnpm typecheck
pnpm test:api
curl -H "Authorization: Bearer $CLERK_TEST_TOKEN" \
  http://localhost:3001/api/v1/cases
```

### Rollback

- Remove guards from module
- Restore old session-based auth

### Risk Level: **MEDIUM**

- New NestJS auth guard (ClerkJwtGuard) validates tokens against Clerk JWKS
- Affects all API routes
- Web middleware (Next.js) is separate — protects web routes only

### Merge Gates

1. `pnpm typecheck` passes
2. `pnpm test:api` passes
3. API rejects unauthenticated requests
4. API accepts valid Clerk JWTs

---

## 4. PR-4: RBAC Guards

### Goals

- Permission guards on all endpoints
- Agency scope guards on all data queries
- Admin route guard
- Form-studio guard
- `OFFICIAL` cannot access `/admin/*`
- `FORM_EDITOR` cannot access admin routes
- Cross-agency access denied by default
- Self-approval prevention

### Files Likely Changed

```
MODIFIED:
  apps/api/src/modules/cases/cases.service.ts       # Add agency filter
  apps/api/src/modules/documents/documents.service.ts  # Add agency filter
  apps/api/src/modules/form-studio/form-studio.service.ts  # Add self-approval
  apps/api/src/modules/auth/
    guards/permission.guard.ts
    guards/self-approval.guard.ts
```

### Tests

```typescript
test('user cannot access other agency cases')
test('user cannot access other agency documents')
test('creator cannot approve own form')
test('form editor can edit own agency forms')
test('official cannot access /admin/form-studio')
test('form editor can access /admin/form-studio')
test('auditor cannot mutate data')
```

### Validation Commands

```bash
pnpm typecheck
pnpm test:api
# Manual: Create users in two agencies, verify isolation
```

### Rollback

- Revert service changes
- Disable permission guards

### Risk Level: **HIGH**

- Core security functionality
- Could break existing users if filters are wrong

### Merge Gates

1. `pnpm typecheck` passes
2. `pnpm test:api` passes
3. Cross-agency isolation verified
4. Self-approval blocked
5. Role-based access enforced

---

## 5. PR-5: Audit Logging

### Goals

- Log save/export/publish/permission changes
- Immutable audit event model
- `audit_logs` extended with new columns
- `actor_user_id`, `agency_id`, `before_hash`, `after_hash`
- Audit viewer UI (if safe)

### Files Likely Changed

```
NEW:
  apps/api/src/modules/audit/
    audit.module.ts
    audit.service.ts
    audit.controller.ts
  apps/web/src/app/admin/audit-logs/page.tsx

MODIFIED:
  apps/api/src/modules/cases/cases.service.ts
  apps/api/src/modules/documents/document-renderer.service.ts
  apps/api/src/modules/form-studio/form-studio.service.ts
```

### Tests

```typescript
test('audit log created on case create')
test('audit log created on document export')
test('audit log created on permission change')
test('audit log contains before_hash and after_hash')
test('audit viewer shows correct entries')
```

### Validation Commands

```bash
pnpm typecheck
pnpm test:api
```

### Risk Level: **MEDIUM**

- DB writes on every operation
- Performance impact to measure

### Merge Gates

1. `pnpm typecheck` passes
2. `pnpm test:api` passes
3. Audit logs created on all write operations

---

## 6. PR-6: Export History

### Goals

- Persist export history records
- `contract_hash` — SHA-256 of form contract version
- `input_snapshot_hash` — SHA-256 of form inputs
- `exported_file_hash` — SHA-256 of exported file
- UI history panel
- Integrity verification capability

### Files Likely Changed

```
NEW:
  apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_export_history/
  apps/api/src/modules/export-history/
    export-history.module.ts
    export-history.service.ts
  apps/web/src/app/documents/[id]/export-history/page.tsx

MODIFIED:
  apps/api/src/modules/documents/document-renderer.service.ts
  apps/api/prisma/schema.prisma
```

### Tests

```typescript
test('export creates export_history record')
test('export_history contains contract_hash')
test('export_history contains input_snapshot_hash')
test('export_history contains exported_file_hash')
test('history panel shows correct records')
```

### Validation Commands

```bash
pnpm typecheck
pnpm db:migrate:deploy
pnpm test:api
```

### Risk Level: **LOW**

- New table, no existing data affected
- UI feature only

### Merge Gates

1. `pnpm typecheck` passes
2. `pnpm db:migrate:deploy` succeeds
3. Export history records created correctly

---

## 7. PR-7: E2E Migration

### Goals

- Clerk test auth helper for Playwright
- Deterministic test users with roles
- Deterministic test organization/agency
- Role-based E2E tests
- CI env docs
- No rate-limit flake

### Files Likely Changed

```
MODIFIED:
  tests/e2e/helpers/auth.ts
  tests/e2e/auth.spec.ts
  tests/e2e/roles.spec.ts
  tests/e2e/agency-isolation.spec.ts
  .env.test.example
  .github/workflows/e2e.yml
```

### Tests

```typescript
test('unauthenticated user redirected to /sign-in')
test('authenticated Official opens /templates')
test('Official can open published form')
test('Official can save form data')
test('Official can export DOCX')
test('Official cannot access /admin/form-studio')
test('Form Editor can access /admin/form-studio')
test('Approver can approve but creator cannot approve own draft')
test('cross-agency document access denied')
test('export creates audit log and export history')
```

### Risk Level: **LOW**

- Test changes only
- No production impact

### Merge Gates

1. All E2E tests pass
2. No flaky auth failures
3. CI passes

---

## 8. Summary Table

| PR | Focus | Risk | Duration | Tests | DB Migration |
|----|-------|------|----------|-------|-------------|
| 1 | Clerk Foundation | Medium | 1 week | 3 | None |
| 2 | User/Agency Projection | High | 1 week | 7 | New tables |
| 3 | API JWT Validation | Medium | 1 week | 6 | None |
| 4 | RBAC Guards | High | 1 week | 7 | None |
| 5 | Audit Logging | Medium | 1 week | 5 | Alter audit_logs |
| 6 | Export History | Low | 1 week | 5 | New table |
| 7 | E2E Migration | Low | 1 week | 10 | None |

---

## 9. Merge Gates (All PRs)

Each PR requires:

1. `pnpm typecheck` passes
2. `pnpm test:web-unit` passes
3. `pnpm test:api` passes (if API changes)
4. Manual testing in staging environment
5. Security review sign-off
6. QA sign-off

---

## 10. Open Questions

1. **MFA requirement?** — Verify Clerk project settings and selected plan. MFA alone does not change provider.
2. **SSO timeline?** — If SSO is planned within 6 months, escalate to Auth0/Okta.
3. **Migration strategy?** — Keep old auth for graceful transition.
4. **Seed data migration?** — How to migrate existing officials to Clerk.
