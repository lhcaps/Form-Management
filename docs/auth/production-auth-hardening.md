# Auth Phase 2F - Production Auth Hardening

This checklist covers production and public staging auth configuration. It is
configuration-only guidance: do not use it to introduce new UI, roles, or form
workflow behavior.

## Required Backend Env

Set these on the API host or secret store before `NODE_ENV=production` starts.

| Variable | Production value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Enables startup safety checks. |
| `WEB_ORIGIN` | `https://your-app.example` | Canonical frontend origin. Required. |
| `API_CORS_ORIGIN` | `https://your-app.example` | Comma-separated allow-list. No wildcard. |
| `AUTH_COOKIE_SECURE` | `true` | Required for production cookies. |
| `AUTH_COOKIE_SAMESITE` | `none` or `lax` | Use `none` only for cross-origin frontend/API. |
| `CLERK_SECRET_KEY` | secret-store value | Required in production. Do not commit. |
| `CLERK_WEBHOOK_SECRET` | secret-store value | Required in production for webhook signature verification. |
| `TUNNEL_TEST` | `false` | Production startup rejects `true`. |
| `SEED_ADMIN_PASSWORD` | strong secret | Must not be a known default or a placeholder. |

Production startup also rejects obvious placeholder values such as
`change-me`, `replace-with-*`, and `<set-in-secret-store>`.

## Dev vs Production

| Setting | Development | Production |
|---|---|---|
| `TUNNEL_TEST` | Optional for local HTTPS tunnel tests | Must be `false` |
| CORS wildcard | Allowed only outside tunnel/production | Forbidden |
| Missing `WEB_ORIGIN` | Allowed; localhost fallback is added | Forbidden |
| Missing Clerk secrets | Allowed for legacy/local flows | Forbidden |
| `AUTH_COOKIE_SECURE=false` | Allowed for localhost | Forbidden |
| Unsafe cookie POST without Origin/Referer | Rejected when SameSite=None | Rejected when SameSite=None |
| Bearer-only API requests | Not CSRF-blocked | Not CSRF-blocked |

## CORS Examples

Single frontend:

```env
WEB_ORIGIN=https://qllaw.example
API_CORS_ORIGIN=https://qllaw.example
```

Frontend plus ops preview:

```env
WEB_ORIGIN=https://qllaw.example
API_CORS_ORIGIN=https://qllaw.example,https://ops.qllaw.example
```

Do not include paths, query strings, fragments, or `*`:

```env
# Bad
API_CORS_ORIGIN=*
API_CORS_ORIGIN=https://qllaw.example/app
API_CORS_ORIGIN=localhost:3000
```

## Cookie And CSRF Policy

When the frontend and API are on different origins, use:

```env
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=none
```

With `SameSite=None`, state-changing cookie-authenticated requests
`POST`, `PUT`, `PATCH`, and `DELETE` must include an `Origin` or `Referer`
matching the configured CORS allow-list. Missing or untrusted headers are
rejected. Bearer-only Clerk requests without the legacy session cookie are not
blocked by this CSRF guard.

## TUNNEL_TEST

`TUNNEL_TEST=true` is only for local public testing, for example Vercel frontend
calling a local API through Cloudflare Tunnel. It forces effective cookies to
`Secure=true` and `SameSite=None` without setting `NODE_ENV=production`.

Never set it in production:

```env
NODE_ENV=production
TUNNEL_TEST=false
```

Local tunnel example:

```env
NODE_ENV=development
TUNNEL_TEST=true
WEB_ORIGIN=https://your-vercel-domain.vercel.app
API_CORS_ORIGIN=https://your-vercel-domain.vercel.app
```

## Clerk Webhook

Default route with the current API prefix:

```text
POST /api/v1/auth/webhooks/clerk
```

Clerk dashboard setup:

1. Create a webhook endpoint pointing to
   `https://your-api.example/api/v1/auth/webhooks/clerk`.
2. Subscribe to `user.created`, `user.updated`, and `user.deleted`.
3. Store the signing secret as `CLERK_WEBHOOK_SECRET` in the API secret store.
4. Keep `CLERK_SECRET_KEY` in the API secret store for JWT verification.
5. Do not log raw webhook payloads, Clerk secrets, or bearer tokens.

If `CLERK_WEBHOOK_SECRET` is missing in development, webhook requests are
rejected gracefully. In production the API fails startup until the secret is set.

## Seed Bootstrap Warning

Seed credentials are bootstrap-only. Do not use shared defaults in staging or
production. Known default, `change-me`, and placeholder values are rejected by
production startup checks. `SEED_LE_HUY_PASSWORD` must be set only in local env
or a secret store when that account is intentionally seeded.

## Smoke Commands

Run after deployment:

```powershell
Invoke-RestMethod https://your-api.example/api/v1/health

$env:API_URL = "https://your-api.example"
node scripts/smoke-forms-runtime-213.mjs
```

Minimal cookie/CSRF sanity:

```powershell
$headers = @{ Origin = "https://your-app.example" }
Invoke-WebRequest `
  -Uri "https://your-api.example/api/v1/auth/me" `
  -Headers $headers `
  -Method GET `
  -SkipHttpErrorCheck
```

## Deployment Checklist

- [ ] `NODE_ENV=production`
- [ ] `TUNNEL_TEST=false`
- [ ] `WEB_ORIGIN` is the real frontend origin
- [ ] `API_CORS_ORIGIN` contains only real `http(s)` origins
- [ ] `API_CORS_ORIGIN` does not contain `*`
- [ ] `AUTH_COOKIE_SECURE=true`
- [ ] `AUTH_COOKIE_SAMESITE` matches the deployment topology
- [ ] `CLERK_SECRET_KEY` is set in the secret store
- [ ] `CLERK_WEBHOOK_SECRET` is set in the secret store
- [ ] Clerk webhook endpoint is `/api/v1/auth/webhooks/clerk`
- [ ] Seed passwords are strong and not committed
- [ ] Health and form runtime smoke pass
