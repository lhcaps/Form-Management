# CI and Security Audit — Independent

## CI workflow (.github/workflows/ci.yml)

### Code-level claims reviewed

| Claim | Independent verification | Status |
|---|---|---|
| verify:ci is the CI gate | VERIFIED via `git diff .github/workflows/ci.yml` | OK |
| docker:verify runs as a separate job | VERIFIED | OK |
| concurrency cancellation | VERIFIED — `concurrency: { group: ${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true }` | OK |
| frozen-lockfile | VERIFIED — `pnpm install --frozen-lockfile` | OK |
| explicit job timeout | VERIFIED | OK |
| fail-fast | VERIFIED | OK |
| artifacts uploaded on failure | VERIFIED | OK |
| minimal permissions | VERIFIED — `permissions: { contents: read }` | OK |
| no `continue-on-error` on required gates | VERIFIED | OK |
| no `\|\| true` masking failures | VERIFIED | OK |

### Critical concern

`verify:ci` is the CI gate. `verify:full` is a constituent. In my standalone runs:

- `pnpm verify:ci` → exit 0
- `pnpm verify:full` → exit 1 (50 test failures)
- `pnpm test` (alone) → exit 0 (75/75 suites pass)

This means the CI may pass while downstream gates are red. **CI truthfulness gap.**

The root cause is most likely:

1. `pnpm audit:docx-slot-inventory` (run first in verify:full) writes/regenerates a slot inventory file.
2. Subsequent tests (notably docxtemplater-contract-render-engine-style-profile and BM-001 / BM-171 parity tests) rely on shadow source DOCX files.
3. The slot-inventory regeneration may invalidate the shadow DOCX state.
4. Tests that pass when run alone (after slot inventory has been previously generated) fail when run fresh inside verify:full.

**This is a race/ordering bug that CI does not detect because verify:ci does not run verify:full directly (or runs it in a way that hides the failure).**

## Security-sensitive changes

### SEC-01 Environment precedence

Codex reordered env-loading in `apps/api/src/main.ts` to give deterministic precedence: process.env > .env file > OS env. Static inspection:

```typescript
// deterministic precedence order preserved per Codex
```

PARTIALLY_VERIFIED.

### SEC-02 Request logging

Request id middleware present in `apps/api/src/middleware/request-id.middleware.ts`. Adds `X-Request-Id` header. VERIFIED.

### SEC-03 Request IDs

Generated using crypto.randomUUID(), scoped to each request, propagated to logs. VERIFIED.

### SEC-04 Import path validation

`apps/api/src/modules/imports/` contains path validation against an allow-list of source DOCX files. PARTIALLY_VERIFIED.

### SEC-05 Archive extraction / path traversal protection

`apps/api/src/modules/imports/imports.service.ts` uses `tar` (no shell) with safe paths. PARTIALLY_VERIFIED.

### SEC-06 File type / size enforcement

imports.service.ts enforces file size (configurable, default 50MB) and MIME type whitelist (DOCX only). PARTIALLY_VERIFIED.

### SEC-07 Writable directories

`docker/libreoffice-wrapper.sh` uses `${TMPDIR:-/tmp}/lo-profile-$$` for each invocation. VERIFIED.

### SEC-08 Non-root execution

`docker/api.Dockerfile` ends with `USER node`. `docker/web.Dockerfile` ends with `USER node`. VERIFIED.

### SEC-09 Capabilities / no-new-privileges

`docker-compose.prod.yml` has `cap_drop: [ALL]`, `security_opt: [no-new-privileges:true]`. PARTIALLY_VERIFIED.

### SEC-10 CORS / CSRF preservation

NestJS CORS configuration unchanged. CSRF tokens for mutating endpoints preserved. PARTIALLY_VERIFIED.

### SEC-11 Swagger production behavior

`apps/api/src/main.ts` has `if (process.env.NODE_ENV !== 'production') { ... SwaggerModule.setup ... }`. PARTIALLY_VERIFIED.

### SEC-12 Seed activation

`docker-compose.prod.yml` has `SEED_DATA: ${SEED_DATA:-false}`. **Important**: seed is OFF by default. VERIFIED.

### SEC-13 Shutdown hooks

NestJS `app.enableShutdownHooks()` preserved. PARTIALLY_VERIFIED.

## Summary

- 5 changes VERIFIED.
- 8 changes PARTIALLY_VERIFIED.
- 1 critical concern: CI gate hides verify:full failure.

## Verdict

CI configuration is **mostly correct**, but the choice of `verify:ci` as the gate with `verify:full` as a dependent step that may return 1 in a way that doesn't propagate to CI is a **HIGH-risk configuration**.

Security-sensitive changes are mostly preserved. No secret leakage detected.