# QLLaw fresh baseline commands

> Initial execution evidence from the dirty local tree. Exit code and duration are recorded per command; semantic failures remain failures even when the process exited 0.

| Command | Exit | Seconds | Result | Summary |
|---|---:|---:|---|---|
| `pnpm --filter @qllaw/form-contracts typecheck` | 0 | 2.708 | PASS | TypeScript contract package clean. |
| `pnpm --filter api exec tsc --noEmit` | 0 | 20.557 | PASS | API TypeScript clean without requiring a running dev server. |
| `pnpm --filter web exec tsc --noEmit` | 0 | 11.39 | PASS | Web TypeScript clean without requiring a running dev server. |
| `pnpm typecheck` | 0 | 5.959 | PASS | Root typecheck clean. |
| `pnpm lint` | 0 | 89.83 | PASS | Contracts, API, and web lint clean. |
| `pnpm test` | 1 | 51.576 | FAIL | FAIL: 1/696 API test failed because the DOCX slot inventory report was older than 24h; 695 passed. |
| `pnpm build` | 0 | 63.694 | PASS | Contracts, Prisma client, API, and Next production build passed. |
| `pnpm audit:hardcode` | 1 | 0.446 | FAIL | FAIL: intentional legacy-draft markers were treated as forbidden runtime defaults in two web files. |
| `pnpm audit:locked-compiled` | 0 | 0.475 | PASS | 213/213 locked and compiled contracts consistent. |
| `pnpm audit:contract-sync` | 0 | 1.075 | PASS | 213/213 DB comparison matched; no mutation reported. |
| `pnpm audit:encoding` | 0 | 0.825 | PASS | No BOM detected. |
| `pnpm gate:forms:213` | 1 | 0.391 | FAIL | FAIL: locked-contract verification report was stale. |
| `node scripts/audit/status-matrix-213.mjs` | 0 | 0.141 | FAIL_INTEGRITY | FAIL_INTEGRITY: exit 0 but rewrote canonical state from the reported 201/12 state to 177/36. |
| `docker compose --env-file .env.docker -f docker-compose.prod.yml config --quiet` | 0 | 0.177 | PASS | Compose syntax/interpolation valid without printing resolved secrets. |
| `docker compose (safe CI env) build --no-cache` | 0 | 90.023 | PASS | Fresh API and web images built with safe placeholder CI values. |
| `docker image inspect baseline images (size)` | 0 | 0.158 | PASS | API 601,984,503 bytes; web 355,553,407 bytes; Config.User empty on both. |
| `docker web image resolves @qllaw/form-contracts/browser` | 0 | 0.461 | PASS | Issue #13 import path resolves in the fresh web image. |
| `docker API image seed dependency assets probe` | 1 | 0.413 | FAIL | FAIL: runner omits source/catalog files required by prisma/seed.ts. |
| `docker API image locked contract corpus count` | 1 | 0.421 | FAIL | FAIL: /app/docs/audit/docx/contracts/locked is missing. |
| `docker API image non-root assertion` | 1 | 0.43 | FAIL | FAIL: image UID is 0. |
| `docker API image LibreOffice/font probe` | 0 | 0.905 | PARTIAL | PARTIAL: LibreOffice 7.4.7.2 exists; Times New Roman falls back to Liberation Serif. |
| `docker API entrypoint seed script probe` | 1 | 0.473 | FAIL | FAIL: API package has seed but not the db:seed command invoked by entrypoint. |
| `docker compose isolated verification config --quiet` | 0 | 0.175 | PASS | Isolated override config valid; no user storage or persistent DB mounted. |
| `docker compose isolated verification up --no-build` | 0 | 11.686 | PASS | Isolated services created and started. |
| `docker isolated boot condition wait` | 0 | 90.018 | FAIL | FAIL: API restart loop exit 255; API/web readiness never passed. |
| `docker isolated API logs (redacted tail)` | 0 | 0.12 | PASS | Root cause output: exec /usr/local/bin/api-entrypoint.sh: no such file or directory. |
| `docker compose isolated verification down -v` | 0 | 1.013 | PASS | Only the isolated project, network, and volumes were removed. |
| `node --test all apps/web form-flight guard tests` | 0 | 0.394 | PASS | 9 suites / 803 tests passed; runtime-ready allowlist and standalone boundary preserved. |
| `node --test scripts/audit/assert-bm006-calibration-canary.guard.test.mjs` | 0 | 0.354 | PASS | BM-006 canary guard passed. |
| `bounded status-matrix preservation guard with hash check` | 0 | 0.59 | PASS | 3/3 passed under 5s timeout and canonical hash was restored. |
| `pnpm install --frozen-lockfile` | — | — | NOT_RUN | Existing dependencies were usable; independent typechecks, lint, build, and tests executed. |
| `node scripts/audit/apply-all-current-evidence.mjs (twice)` | — | — | BLOCKED_BASELINE | Deferred after the standalone reducer proved destructive and the orchestrator was found to invoke live browser collection without a timeout. |

## Baseline conclusion

- Typecheck, lint, build, locked/compiled consistency, contract sync, encoding, Compose config, and fresh image build passed.
- Root tests, hardcode audit, forms gate, evidence integrity, API runner content, non-root, seed command, and boot readiness failed.
- The historical status-matrix test does not currently hang under a bounded timeout, but its fixed backup path and live canonical mutation remain unsafe on interruption/concurrency.
- The first `apply-all-current-evidence` double-run was intentionally deferred until the destructive reducer/orchestrator boundary is repaired and covered by regression tests.
