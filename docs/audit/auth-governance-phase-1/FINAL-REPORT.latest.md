# AUTH GOVERNANCE PHASE 1 — FINAL REPORT

**Date:** 2026-06-30
**Task:** QUANLYVKS_AUTH_GOVERNANCE_PHASE_1B_CLERK_DECISION_PATCH_AND_PHASE_2_FOUNDATION_PLAN
**Status:** ✅ COMPLETE — Clerk decision patched, implementation-ready

---

## 1. Verdict

### Final Recommendation: **PROCEED_TO_CLERK_FOUNDATION**

### Chosen Provider: Clerk

**Reason:**
1. Best Next.js App Router integration
2. Clerk Organizations map directly to QUANLYVKS agencies
3. Built-in MFA support (paid plan)
4. Webhook-based audit event capture
5. Fastest time-to-production
6. Good free tier for development
7. No immediate SSO/SAML requirement (GATE-1 passed)

### Backup Provider: Auth0/Okta

**Escalation condition:** Only if enterprise SSO/SAML, centralized IdP integration, procurement/compliance, or customer IAM requirements become mandatory within 0–6 months.

### Rejected Providers

| Provider | Reason |
|---------|--------|
| **Supabase Auth** | Current architecture is MariaDB, not Supabase/Postgres/RLS. Migration cost too high. |
| **Auth.js/NextAuth** | Not recommended as primary. Additional security and maintenance burden. Not designed for legal/government compliance workflows. |

### Caveat

> This recommendation assumes **no mandatory enterprise SSO/SAML requirement** in the next 0–6 months. If SSO/SAML or strict enterprise procurement is required immediately, escalate to Auth0/Okta before implementation.

---

## 2. Scoring Model Correction

### Problem (Original)

Auth0 scored **119/116**, exceeding the maximum of 116. Per-criterion scores exceeded declared weight ceilings in some categories (e.g., "Developer experience" scored 10 against max 8).

### Fix Applied

Replaced single weighted-sum scoring with **5 independent decision categories** (each max 10):

| Category | Clerk | Auth0 |
|----------|-------|-------|
| MVP Velocity Score | 10 | 7 |
| Current Architecture Fit Score | 8 | 9 |
| Enterprise Procurement Score | 6 | 10 |
| Operational Complexity Score | 9 | 7 |
| Lock-in / Cost Risk | 7 | 5 |
| **Total** | **40/50** | **38/50** |

Clerk wins on MVP velocity and operations. Auth0 wins on enterprise procurement — which is the escalation condition, not the baseline.

### MFA/SSO Gate Correction

**Original:** `MFA requirement? If yes, switch to Auth0.`

**Corrected:** MFA alone does NOT force Auth0. The decision point is enterprise SSO/SAML, centralized IdP, procurement/compliance, and customer IAM requirements.

---

## 3. Why Business Permissions Remain in DB

QUANLYVKS legal workflow requires **domain-specific permissions** that go beyond what Clerk provides:

| Permission | Description | Must be in DB |
|-----------|-------------|---------------|
| `template:approve` | Approve/reject forms | ✅ Creator cannot self-approve |
| `document:export-docx` | Export to DOCX | ✅ Agency-scoped |
| `form-studio:access` | Access Form Studio | ✅ Role-gated |
| `audit:read` | Read audit logs | ✅ Auditor role |
| `permission:manage` | Manage user permissions | ✅ Permission admin |
| `user:invite` | Invite users | ✅ Agency-scoped |

**Clerk provides:**
- Identity (user, email, session)
- Organization context (org_id → agency)
- Public metadata (role hints — NOT authoritative)

**QUANLYVKS DB provides:**
- All legal, form, case, document permissions
- Role-permission mapping
- Agency membership enforcement
- Self-approval prevention
- Immutable audit trail
- Export history

> Clerk org role is **coarse context only**. QUANLYVKS DB permission is the **final business authorization source**.

---

## 4. Clerk Architecture Summary

### Web

- `ClerkProvider` at web root
- `clerkMiddleware()` for route protection
- `/sign-in` and `/sign-up` pages
- `UserButton` in topbar
- Public routes: `/sign-in(.*)`, `/sign-up(.*)`, `/health`
- Authenticated routes: `/`, `/templates`, `/documents(.*)`, `/cases(.*)`, `/reports(.*)`
- Admin routes: `/admin(.*)` (DB RBAC enforced in PR-4)

### API

- Bearer token (`Authorization: Bearer <JWT>`)
- Clerk JWKS validation in `ClerkJwtGuard`
- Extract: `sub`, `org_id`, `email`, `public_metadata`
- Map: Clerk org → QUANLYVKS agency
- Inject: `RequestUserContext` into controllers
- Agency membership verified server-side (never trust client-provided)

### DB Projection

- `auth_identities` — maps Clerk user ID to local official
- `agencies` — extended with `clerk_org_id`
- `agency_memberships` — user-agency mapping
- `roles`, `permissions`, `role_permissions` — RBAC catalog
- `membership_roles` — role assignment per agency
- `provider_webhook_events` — idempotent webhook processing
- `audit_logs` — extended with actor/user/agency context
- `export_history` — document export traceability

### Webhook

| Event | Action |
|-------|--------|
| `user.created/updated/deleted` | Sync auth_identities |
| `organization.created/updated/deleted` | Sync agencies |
| `organizationMembership.created/updated/deleted` | Sync agency_memberships |

Webhook must be **idempotent** via `provider_webhook_events` table.

---

## 5. RBAC Matrix

8 roles, 25 permissions, 9 special enforcement rules.

| Role | Key Permissions | Notes |
|------|---------------|-------|
| `SYSTEM_ADMIN` | All | Break-glass only |
| `PERMISSION_ADMIN` | permission:manage, user:invite | No form editing |
| `FORM_EDITOR` | template:edit-draft, form-studio:access | Cannot approve own draft |
| `FORM_APPROVER` | template:approve | Cannot publish |
| `OFFICIAL` | case:*, document:* | Cannot access admin |
| `REPORT_VIEWER` | report:read | Read-only |
| `AUDITOR` | audit:read | Read-only |
| `READ_ONLY` | case:read, document:read | Read-only |

**Cross-agency access denied by default.**

---

## 6. PR-1 Scope (Clerk Foundation)

**This is the only implementation target for the next phase.**

### Goals

- Install `@clerk/nextjs` SDK
- Add `ClerkProvider` at web root
- Add `clerkMiddleware()` for route protection
- Add sign-in/sign-up pages
- Add `UserButton` in topbar
- Add Clerk env vars to `.env.example`
- **Keep old auth intact** — no removal, no API changes
- No DB migration, no API JWT enforcement, no final RBAC

### Files Likely Changed

```
NEW:
  apps/web/src/app/sign-in/[[...sign-in]]/page.tsx
  apps/web/src/app/sign-up/[[...sign-up]]/page.tsx
  apps/web/.env.example
  apps/web/.env.docker.example
  docs/audit/auth-governance-phase-2/

MODIFIED:
  apps/web/src/app/layout.tsx
  apps/web/src/middleware.ts
  apps/web/src/components/layout/topbar.tsx
  apps/web/src/lib/api-client.ts (optional)
```

### Tests

1. Unauthenticated user redirects to `/sign-in`
2. Authenticated user can access `/templates`
3. Authenticated user can access `/documents`
4. Sign out returns to `/sign-in`

### Validation

```bash
pnpm typecheck
pnpm test:web-unit
# Manual: sign-in, sign-out, protected routes
```

### Rollback

- Remove ClerkProvider from `layout.tsx`
- Remove `middleware.ts`
- Remove sign-in/sign-up routes
- Restore previous topbar
- `pnpm remove @clerk/nextjs`

### Risk: **MEDIUM**

---

## 7. Open Gates

These must be evaluated before implementation proceeds past PR-1.

| Gate | Status | Action |
|------|--------|--------|
| **GATE-1: SSO/SAML** | ✅ PASSED | No immediate requirement. Clerk approved. |
| **GATE-2: MFA** | ⚠️ VERIFY | Verify Clerk project settings and selected plan. |
| **GATE-3: Clerk Orgs** | ✅ DESIGNED | Use Clerk Organizations for agency context. DB remains authoritative. |
| **GATE-4: Clerk Roles** | ✅ DESIGNED | DB is authoritative for business permissions. |
| **GATE-5: API Security** | ✅ DESIGNED | Bearer token validation required. Never trust client-provided agencyId. |
| **Staging/Prod Clerk envs** | ⚠️ PLAN | Separate Clerk instances for staging and production. |

---

## 8. Implementation Roadmap (7 PRs)

| PR | Focus | Risk | Tests | DB Migration |
|----|-------|------|-------|-------------|
| PR-1 | Clerk Foundation | Medium | 4 | None |
| PR-2 | User/Agency Projection | High | 7 | New tables |
| PR-3 | API JWT Validation | Medium | 6 | None |
| PR-4 | RBAC Guards | High | 7 | None |
| PR-5 | Audit Logging | Medium | 5 | Alter audit_logs |
| PR-6 | Export History | Low | 5 | New table |
| PR-7 | E2E Migration | Low | 10 | None |

---

## 9. Artifacts Created/Updated (Phase 1B)

| Artifact | Status | Change |
|----------|--------|--------|
| `provider-decision-matrix.latest.md` | Updated | Corrected scoring model, added decision gates, clarified MFA/SSO |
| `provider-decision-matrix.latest.json` | Updated | Corrected scoring, gate status |
| `FINAL-REPORT.latest.md` | Updated | Final verdict, corrections, PR-1 scope |
| `target-auth-architecture.latest.md` | Updated | Full Clerk architecture with diagrams |
| `rbac-permission-matrix.latest.md` | Updated | Provider/app split, enforcement rules |
| `rbac-permission-matrix.latest.csv` | Updated | Enforcement column added |
| `rbac-permission-matrix.latest.json` | Updated | Provider/app split, 9 enforcement rules |
| `db-schema-plan.latest.md` | Updated | webhook_events FK removed, membership_roles added |
| `implementation-roadmap.latest.md` | Updated | Clerk-specific, PR-1 scope detailed |
| `e2e-auth-strategy.latest.md` | Updated | Clerk test strategy, test users, CI setup |
| `clerk-env-secret-strategy.latest.md` | **New** | Clerk env vars, secret management, dashboard checklist |

**Total: 11 artifacts updated, 1 new artifact created**

---

## 10. Validation

### Command Results

| Command | Exit Code | Result |
|---------|-----------|--------|
| `pnpm typecheck` | 0 | ✅ PASS |
| `pnpm test:web-unit` | 0 | ✅ PASS — 75/75 tests pass |
| `check-213-remediation-readiness` | 0 | ✅ READY_ABSOLUTE — 213/213 pass |
| `build-website-requirement-acceptance-v1` | 0 | ✅ READY_ABSOLUTE — 54/57 PASS |
| `build-ready-absolute-blocker-burn-down-v3` | 0 | ✅ 0 blockers |

### Decision Gate: **PROCEED**

### Source Code Changed: **NO** (only docs/audit/auth-governance-phase-1/**)

---

## 11. Git Status

```
Branch: main
HEAD: a5504870

Dirty files (expected):
  docs/audit/auth-governance-phase-1/  ← UPDATED (Phase 1B artifacts)
  docs/audit/frontend-phase-3-verification/  ← PRE-EXISTING
  docs/audit/forms-root-cause/  ← PRE-EXISTING
  docs/audit/ready-absolute-blocker-burn-down-v3/  ← PRE-EXISTING
  docs/audit/sample-data-coverage-v1/  ← PRE-EXISTING
  docs/audit/sot-gates-v1/  ← PRE-EXISTING
  docs/audit/sot-rebase-v1/  ← PRE-EXISTING
  docs/audit/website-requirement-acceptance-v1/  ← PRE-EXISTING
```

---

## 12. Summary

- **Verdict:** PROCEED_TO_CLERK_FOUNDATION
- **Provider:** Clerk (user-confirmed 2026-06-30)
- **Backup:** Auth0/Okta (escalate only if SSO/SAML mandatory)
- **Rejected:** Supabase Auth, Auth.js (primary)
- **Source code changed:** No
- **Artifacts:** 11 updated, 1 new (clerk-env-secret-strategy)
- **Open questions:** Reduced to implementation details (MFA plan, staging envs, SSO timeline)
- **Next step:** PR-1: Clerk Foundation

---

## Appendix: Provider Decision Summary

### Score Comparison (Corrected)

| Provider | MVP Velocity | Arch Fit | Enterprise | Ops | Lock-in | Total |
|----------|-------------|----------|------------|-----|---------|-------|
| **Clerk** | **10** | 8 | 6 | **9** | 7 | **40/50** |
| Auth0 | 7 | 9 | **10** | 7 | 5 | 38/50 |
| Auth.js | 7 | 8 | 3 | 5 | **10** | 33/50 |
| Supabase | 6 | 4 | 5 | 6 | 7 | 28/50 |

### Key Differentiators

| Criteria | Clerk | Auth0 |
|----------|-------|-------|
| Next.js fit | 10/10 | 7/10 |
| Organization model | 9/10 | 10/10 |
| MFA support | 7/10 (paid) | 10/10 |
| SSO/SAML | 6/10 | 10/10 |
| Developer experience | 9/10 | 7/10 |
| Cost | 7/10 | 5/10 |
