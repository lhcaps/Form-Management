# SECURITY_POLICY.md — Security, Secrets & Pattern Blacklist

> **Source:** Extracted from `docs/PROJECT_SPEC.md` §10.
> **Canonical reference:** `docs/PROJECT_SPEC.md` is the master spec.

---

## 1. Env File Policy

| File | Commit? | Purpose |
|------|---------|---------|
| `.env.example` | Yes | Template dev, no real secrets |
| `.env` | No | Secrets/dev override — local only |
| `.env.local` | No | Secrets/dev override — local only |
| `.env.e2e.example` | Yes | Template E2E with safe placeholders |
| `.env.e2e.local` | No | Clerk dev keys for E2E — local only |
| `.env.production` | No | Do not use; use platform secrets |

---

## 2. Required .gitignore Entries

```gitignore
.env.local
.env.e2e.local
playwright/.clerk/
playwright/.auth/
test-results/
playwright-report/
storage/runtime-preview-sessions/
```

---

## 3. Secret Rules

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is public — may be exposed to frontend.
CLERK_SECRET_KEY is secret — NEVER commit, log, or paste into docs/reports.
If CLERK_SECRET_KEY is leaked → rotate immediately.
Do NOT commit Playwright storage state.
Do NOT commit screenshots/logs containing tokens, cookies, sessions, or passwords.
Do NOT add E2E_CLERK_USER_PASSWORD to code/spec/example.
```

---

## 4. Prohibited Secret-Like Patterns

Do **not** include in code, specs, or examples:

```
sk_test_     (Clerk test secret key prefix)
sk_live_     (Clerk live secret key prefix)
E2E_CLERK_USER_PASSWORD
__session    (Clerk session cookie name — may appear in grep false positives, use anchored pattern)
__clerk      (Clerk browser cookie name — may appear in grep false positives, use anchored pattern)
admin.json   (Playwright auth state file)
playwright/.clerk/
```

---

## 5. Secret Grep Command

Run before every merge/PR:

```bash
rg "sk_(test|live)_[A-Za-z0-9]|E2E_CLERK_USER_PASSWORD" .
```

Expected: **Zero matches**.

---

## 6. Pattern Blacklist

| Pattern | Why it is wrong |
|---------|----------------|
| `body mode=metadata` | DTO whitelist/forbidNonWhitelisted reject is correct; do not inject control fields into form data |
| `?mode=metadata` | `/render-docx` is binary-only; frontend may parse DOCX `PK...` as JSON |
| `/render-docx/metadata` as final architecture | Wrong lifecycle; no stable preview artifact/session |
| `response.json(...)` in Nest handler while Nest serializes return value | Can cause circular JSON / cannot set headers after sent |
| Mixing `StreamableFile` binary and JSON metadata in same handler | Ambiguous response contract |
| Fake `generatedDocumentId` | Wrong product boundary and wrong security model |
| History/workspace links in standalone template mode | Standalone has no persisted document |
| Weakening DTO `whitelist`/`forbidNonWhitelisted` | Unsafe input boundary |
| Touching 213 DOCX templates/contracts in small PRs | Mass-edit risk |
| Logging cookies/tokens/passwords/env values | Secret/PII leak |
| Committing Playwright auth state | Session leak |
| Using `qlv_session` cookie for Clerk-protected web routes | Wrong auth layer |
| Custom `.env` parser | Fragile quote/escape/multiline/Windows-Linux behavior |
| `E2E_CLERK_USER_PASSWORD` in code/spec/example | Ticket strategy does not need password |

---

## 7. Production Secrets

Production secrets live **only on platform** (Vercel env vars, Docker secrets, platform config). Do not commit to repo.

---

## 8. Env Loading Policy

```
Node-side tooling / E2E:   Use dotenv. Do NOT use custom .env parser.
Next.js web runtime:       Use native Next.js env loading. Do NOT call dotenv.config() in frontend runtime.
NestJS API runtime:        Use existing API config/env system. If standardizing, prefer @nestjs/config.
CI / Vercel / Production:  Use platform secrets. Do not depend on .env.local.
```

**E2E dotenv load order:**

```ts
import dotenv from 'dotenv';

for (const path of ['.env.e2e.local', '.env.local', '.env']) {
  dotenv.config({ path, override: false });
}

process.env.CLERK_PUBLISHABLE_KEY ??= process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
```

Rule: `override: false` means shell/CI env wins over local files.

---

*Canonical source: `docs/PROJECT_SPEC.md §10`*
