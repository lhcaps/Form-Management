# AUTH GOVERNANCE PHASE 1 — BASELINE SNAPSHOT

**Date:** 2026-06-30
**Branch:** main
**HEAD:** a5504870 — Merge pull request #20 from lhcaps/codex/frontend-phase-3-polish

---

## Git Status

```
 M docs/audit/forms-root-cause/latest.json
 M docs/audit/forms-root-cause/latest.md
 M docs/audit/ready-absolute-blocker-burn-down-v3/blockers.latest.json
 M docs/audit/ready-absolute-blocker-burn-down-v3/blockers.latest.md
 M docs/audit/sample-data-coverage-v1/latest.json
 M docs/audit/sample-data-coverage-v1/latest.md
 M docs/audit/sot-gates-v1/latest.json
 M docs/audit/sot-gates-v1/latest.md
 M docs/audit/sot-rebase-v1/latest.json
 M docs/audit/sot-rebase-v1/latest.md
 M docs/audit/website-requirement-acceptance-v1/latest.json
 M docs/audit/website-requirement-acceptance-v1/latest.md
?? docs/audit/frontend-phase-3-verification/
```

**Worktree:** DIRTY — pre-existing audit artifact changes. No source code modified.

---

## Recent Commit History

```
a5504870 Merge pull request #20 from lhcaps/codex/frontend-phase-3-polish
602e0243 feat(web): improve page shell accessibility
e176b4c6 feat(web): polish published form editing state
dd96f708 Merge pull request #19 from lhcaps/feat/frontend-productization-phase-2
dfbad2d4 test(node): align bm031 template assertion
49b4ed3c fix(web): remove forbidden sample marker
79fe4262 test(api): refresh docx slot inventory gate
1e13e159 docs: refresh frontend verification artifacts
faf3e716 fix(web): populate nested sample prefill fields
a6577c13 fix(ci): unblock static verification
```

---

## Validation Results

| Command | Exit Code | Result |
|---------|-----------|--------|
| `pnpm typecheck` | 0 | PASS — form-contracts, api, web all type-check clean |
| `pnpm test:web-unit` | 0 | PASS — 75/75 tests pass, 0 failures |
| `check-213-remediation-readiness` | 0 | READY_ABSOLUTE — 213/213 pass |
| `build-website-requirement-acceptance-v1` | 0 | READY_ABSOLUTE — 57 requirements, 54 PASS, 3 NOT_DETECTABLE |
| `build-ready-absolute-blocker-burn-down-v3` | 0 | 0 blockers |

**Decision gate:** ALLOW
**canStartNonBlockedRemediation:** YES
**canStartFull213Remediation:** NO (git status has unexpected dirty files)

---

## Existing Auth-Related Environment Variables

### From `.env.example`

```env
AUTH_SESSION_COOKIE_NAME=qlv_session
AUTH_SESSION_TTL_DAYS=14
AUTH_COOKIE_SECURE=false  # set true for HTTPS
AUTH_COOKIE_DOMAIN=        # optional, for subdomain sharing
AUTH_COOKIE_SAMESITE=lax  # or strict/none
```

### Auth Config Service (`apps/api/src/infrastructure/config/app-config.service.ts`)

- `authSessionCookieName` — defaults to `qlv_session`
- `authSessionTtlMs` — 14 days default
- `authCookieSecure` — false by default, enforced true in production
- `authCookieSameSite` — configurable, defaults to `lax`
- `authCookieDomain` — optional subdomain sharing
- `tunnelTestMode` — skips production safety checks for cross-origin dev

### Seed Auth Config

```env
SEED_ADMIN_FULL_NAME=Admin
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=admin123
SEED_ADMIN_POSITION=Quan tri he thong
```

---

## App Readiness State

| Dimension | Status |
|-----------|--------|
| Form engine | READY_ABSOLUTE_VERIFIED |
| 213/213 contracts | PASS |
| C2 DB sync | PASS |
| C3 locked/compiled | PASS |
| Sample data 1735/1735 | PASS |
| Root-cause issues | 0 |
| SOT semantic issues | 0 |
| Next blocker | production-grade auth, agency permissions, audit logs, export history, user workflow security |

---

## Existing Auth Stack Summary

| Component | Technology | Production Safety |
|-----------|------------|-------------------|
| Auth provider | Self-hosted (custom) | ❌ No MFA, no SSO, no external IdP |
| Session storage | DB-backed (MariaDB) | ⚠️ Hash-based tokens, no JWT |
| Password hashing | scrypt (via Node crypto) | ✅ Adequate |
| Session token | 32-byte random, SHA-256 hashed | ⚠️ Opaque token, not JWT |
| Cookie | HttpOnly, configurable Secure/SameSite | ✅ Configured |
| Frontend auth check | React context + event bus | ⚠️ Client-side only |
| API auth | NestJS Guard (global) | ⚠️ No role-based route guards |
| Permission model | Form-specific only (FORM_TEMPLATE_EDIT/APPROVE/PERMISSION_ADMIN) | ⚠️ Incomplete |
| Agency scoping | Per-official agency_id FK | ⚠️ No enforcement in most endpoints |
| Audit logging | Generic audit_logs table | ⚠️ Incomplete coverage |
| Export history | None | ❌ No traceability |
| E2E test auth | Hardcoded admin/admin123 via env | ❌ Credentials in env |

---

## Conclusion

The current auth system is functional but **not production-grade for a legal/government workload**. Key gaps:

1. No external identity provider integration (no SSO, no MFA)
2. No JWT/OIDC standard — custom session tokens only
3. No comprehensive RBAC — only 3 form-specific permissions
4. No cross-agency data isolation enforcement
5. No export audit trail
6. No webhook-based identity sync capability
7. Seed credentials (`admin/admin123`) in environment files

**This audit is the correct next step before production deployment.**
