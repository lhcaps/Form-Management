# AUTH GOVERNANCE PHASE 1 — CLERK ENV AND SECRET STRATEGY

**Date:** 2026-06-30
**Phase:** Phase 7 — Clerk Env and Secret Strategy (Phase 1B)
**Provider:** Clerk

---

## 0. Purpose

This document defines the environment variables and secret management strategy for Clerk integration. All secrets must be managed per this strategy before implementation begins.

---

## 1. Required Environment Variables

### 1.1 Web App (Next.js)

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public (browser) | Clerk publishable key (`pk_test_...`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public | Sign-in page URL (e.g., `/sign-in`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public | Sign-up page URL (e.g., `/sign-up`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | Public | Fallback after sign in (e.g., `/`) |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Public | Fallback after sign up (e.g., `/`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Public | Redirect after sign in (e.g., `/`) |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Public | Redirect after sign up (e.g., `/`) |

> **Note:** `NEXT_PUBLIC_` prefix exposes these to the browser. Only publishable keys go in the browser. These are safe.

### 1.2 API (NestJS)

| Variable | Scope | Description |
|----------|-------|-------------|
| `CLERK_SECRET_KEY` | Server only | Clerk secret key (`sk_test_...`). **Never expose to browser.** |
| `CLERK_JWT_ISSUER` | Server only | Clerk JWT issuer (derived from secret key, or explicit) |
| `CLERK_JWKS_URL` | Server only | JWKS endpoint URL (derived from issuer, usually auto-detected) |
| `CLERK_API_AUDIENCE` | Server only | JWT audience claim (optional, for multi-tenant) |
| `CLERK_WEBHOOK_SECRET` | Server only | Webhook signing secret for webhook verification |

### 1.3 Webhook Verification

| Variable | Scope | Description |
|----------|-------|-------------|
| `CLERK_WEBHOOK_SECRET` | Server only | `sv_...` secret. Used to verify webhook signatures. |
| `CLERK_WEBHOOK_PORT` | Server only | Local webhook relay port (dev only, e.g., `3001`) |

---

## 2. Environment Separation

### 2.1 Environment Overview

| Environment | Clerk Instance | Purpose |
|-------------|---------------|---------|
| `local` | Clerk Development | Local development |
| `test` | Clerk Development or Test | Automated testing |
| `staging` | Clerk Staging or Production (staging mode) | Pre-production testing |
| `production` | Clerk Production | Live application |

### 2.2 Clerk Instance Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ Clerk Dashboard: https://dashboard.clerk.com                   │
│                                                              │
│ ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│ │ Development      │  │ Staging         │  │ Production    │  │
│ │ clerk.dev/...    │  │ clerk.dev/...   │  │ clerk.com/...│  │
│ │ sk_test_...      │  │ sk_test_...     │  │ sk_live_...  │  │
│ │ pk_test_...      │  │ pk_test_...     │  │ pk_live_...  │  │
│ └─────────────────┘  └─────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- **Development:** Use Clerk's development instance. Easy reset, test emails.
- **Staging:** Use a separate Clerk instance or production instance with staging mode.
- **Production:** Use production Clerk instance with live keys.

---

## 3. .env.example

```env
# ============================================================
# Clerk Authentication (Phase 1B)
# Copy this file to .env.local and fill in real values.
# NEVER commit .env.local to version control.
# ============================================================

# --- Clerk Keys ---
# Get these from: https://dashboard.clerk.com → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=<set-in-secret-provider>

# --- Clerk Webhook ---
# Get this from: https://dashboard.clerk.com → Webhooks
# Used to verify incoming webhook signatures
CLERK_WEBHOOK_SECRET=sv_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# --- Clerk JWT ---
# Issuer is auto-derived from CLERK_SECRET_KEY.
# Override only if you have multiple Clerk instances or custom issuer.
# CLERK_JWT_ISSUER=https://your-app.clerk.accounts.dev
# CLERK_JWKS_URL=https://your-app.clerk.accounts.dev/.well-known/jwks.json

# --- Clerk Redirect URLs ---
# These must match URLs configured in Clerk Dashboard → Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

---

## 4. .env.docker.example

```env
# ============================================================
# Docker Environment — Clerk Configuration
# Used for docker-compose and containerized deployments.
# ============================================================

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
CLERK_WEBHOOK_SECRET=${CLERK_WEBHOOK_SECRET}
# CLERK_JWT_ISSUER=${CLERK_JWT_ISSUER}
# CLERK_JWKS_URL=${CLERK_JWKS_URL}

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

---

## 5. .env.test.example (E2E Testing)

```env
# ============================================================
# E2E Test Environment — Clerk Configuration
# Dedicated Clerk development instance for automated tests.
# ============================================================

# Test Clerk instance keys
CLERK_SECRET_KEY=test_clerk_secret_key_for_e2e
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=test_clerk_publishable_key_for_e2e
CLERK_WEBHOOK_SECRET=test_clerk_webhook_secret_for_e2e

# Redirect URLs (test instance)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# E2E Test Users (created in test Clerk instance)
# DO NOT use production credentials
E2E_ADMIN_EMAIL=admin@test.qlv.local
E2E_ADMIN_PASSWORD=test-admin-123

E2E_FORM_EDITOR_EMAIL=editor@test.qlv.local
E2E_FORM_EDITOR_PASSWORD=test-editor-123

E2E_OFFICIAL_EMAIL=official@test.qlv.local
E2E_OFFICIAL_PASSWORD=test-official-123

E2E_APPROVER_EMAIL=approver@test.qlv.local
E2E_APPROVER_PASSWORD=test-approver-123

E2E_AUDITOR_EMAIL=auditor@test.qlv.local
E2E_AUDITOR_PASSWORD=test-auditor-123

E2E_OTHER_AGENCY_EMAIL=other@test.qlv.local
E2E_OTHER_AGENCY_PASSWORD=test-other-123
```

---

## 6. Security Rules

### 6.1 Never Commit Secrets

```
RULE: Never commit real Clerk keys to version control.

.gitignore must include:
  .env.local
  .env.*.local
  apps/web/.env.local
  apps/api/.env.local

.gitignore should NOT ignore:
  .env.example     ← placeholder only, safe to commit
  .env.docker.example  ← placeholder only, safe to commit
  .env.test.example    ← placeholder only, safe to commit
```

### 6.2 Placeholder Values Only

`.env.example` must contain **only placeholder values**:

```
# WRONG — real-looking but fake keys:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_123456789

# CORRECT — clearly marked as placeholders:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6.3 Separate Clerk Instances

- **Never use production Clerk keys in development or test.**
- **Never use development Clerk keys in staging or production.**
- Each environment gets its own Clerk instance or at minimum its own key set.

### 6.4 Webhook Secret Rotation

- Webhook secrets should be rotated periodically.
- Store old secrets temporarily during rotation for zero-downtime.
- Update `CLERK_WEBHOOK_SECRET` and re-deploy.

### 6.5 E2E Testing Rules

```
RULE: E2E tests must NOT use production Clerk tenant.

- Use dedicated Clerk development instance for CI.
- Create deterministic test users in the test Clerk instance.
- Do not rely on production user accounts.
- Do not use MFA on automated test accounts.
```

---

## 7. Secret Management

### 7.1 Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in values from Clerk Dashboard
3. Restart the dev server

### 7.2 Docker / Containerized

1. Pass secrets via environment variables at runtime
2. Use Docker secrets or K8s secrets for production
3. Never bake secrets into Docker images

### 7.3 CI/CD

```yaml
# GitHub Actions example
env:
  CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
  CLERK_WEBHOOK_SECRET: ${{ secrets.CLERK_WEBHOOK_SECRET }}
```

### 7.4 Production

- Use a secret manager (e.g., AWS Secrets Manager, HashiCorp Vault)
- Inject secrets at deployment time
- Never log secret values

---

## 8. Clerk Dashboard Configuration Checklist

Before implementation PR-1, configure in Clerk Dashboard:

### Required

- [ ] Create Clerk application (Development instance)
- [ ] Copy publishable key (`pk_test_...`)
- [ ] Copy secret key (`sk_test_...`)
- [ ] Copy webhook secret (`sv_...`)
- [ ] Add Redirect URLs:
  - [ ] `http://localhost:3000/sign-in`
  - [ ] `http://localhost:3000/sign-up`
  - [ ] `http://localhost:3000/`
  - [ ] `http://localhost:3001/` (API webhook)
- [ ] Enable Organizations (for agency mapping)
- [ ] Create test users for E2E

### Optional (Post-PR-1)

- [ ] Configure MFA settings
- [ ] Configure SSO (if enterprise requirement)
- [ ] Set up custom email templates
- [ ] Configure webhook endpoints
