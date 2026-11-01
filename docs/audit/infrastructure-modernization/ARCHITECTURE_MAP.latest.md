# QLLaw production architecture map

This map is based on current on-disk code inspected after the immutable snapshot. Old audit Markdown is not treated as executable evidence.

## Runtime boundaries

```text
Clerk identity
  -> API authentication
  -> DB officials/auth_identities/permissions authorization

/templates/:templateCode
  -> temporary runtime preview session
  -> persisted=false
  -> no generated-document DB row or audit/history workspace

/documents/:id
  -> persisted generated document
  -> generated-file metadata + audit/history
```

The modernization task must not cross the standalone/persisted boundary or change public route contracts.

## API bootstrap and configuration

```text
apps/api/src/main.ts
  -> dotenv bootstrap loading
  -> ContractSyncGuard.verify()
  -> AppConfigService.assertProductionSafety()
  -> NestFactory.create(AppModule)
  -> CORS / cookies / request context / error filter
  -> global prefix + validation + optional Swagger
  -> app.listen()

apps/api/src/app.module.ts
  -> ConfigModule.forRoot()
  -> InfrastructureModule
  -> global ThrottlerGuard (60 requests / 60 seconds)
  -> global CsrfCookieGuard
  -> Prisma/Auth/Templates/Cases/Documents/Forms/Health modules
```

`loadApiEnvironment()` now preserves platform/container values, skips repository env files in production, and lets `ConfigModule` consume only the resulting process environment. `API_PORT` takes precedence over `PORT`; Nest shutdown hooks are enabled. Request completion logs contain request metadata only, and rate-limit headers are exposed through CORS.

## Contract build and consumers

```text
packages/form-contracts/src/index.ts + src/browser.ts
  -> tsup ESM + CJS + declarations
  -> dist/index.{js,cjs,d.ts}
  -> dist/browser.{js,cjs,d.ts}
  -> package exports "." and "./browser"
  -> apps/api and apps/web workspace dependencies
```

Both Docker builders install the pnpm workspace, build `@qllaw/form-contracts`, and then build their application. The runners copy the workspace package manifests, pnpm node_modules links, and contracts `dist`. A fresh Docker build and boot—not the apparent correctness of this graph—decides whether GitHub issue #13 remains reproducible.

## Production containers

```text
docker-compose.prod.yml
  -> MariaDB 11 healthcheck and persistent volume
  -> API image after DB health
  -> Web image after API service start

docker/api.Dockerfile
  -> deps -> contracts/API builder -> LibreOffice runner
  -> non-root node user + exact locked/compiled runtime assets
  -> docker/api-entrypoint.sh
  -> DB readiness wait -> prisma migrate deploy
  -> optional seed -> exec node dist/src/main.js

docker/web.Dockerfile
  -> deps -> contracts/Next builder -> Next runner
  -> non-root node user
  -> direct Node/Next PID 1
```

The current Compose file exposes MariaDB only to the internal network, health-gates API and web, drops Linux capabilities, enables `no-new-privileges`, and keeps seed opt-in (`SEED_DATA=false` by default). The entrypoint fails closed on DB readiness/migration errors, runs the package-local seed only when explicitly enabled, and `exec`s the API process. The runner has exactly 213 locked and 213 compiled contracts. Full API readiness remains blocked before Nest startup by the separate Prisma migration-history conflict recorded as `INFRA-P0-006`.

## Evidence pipeline

```text
browser/source/render evidence artifacts
  -> scripts/audit/apply-*.mjs
  -> docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json
  -> scripts/audit/status-matrix-213.mjs
  -> assert/guard scripts

scripts/audit/apply-all-current-evidence.mjs
  -> preflighted, locked, bounded apply-existing/check orchestration
  -> rollback on failure and semantic no-op restoration
```

The matrix is the canonical current status source, while apply scripts remain controlled mutating edges. The reducer preserves apply-owned downstream evidence; the orchestrator excludes live collectors/selectors, uses bounded children, and has transaction/lock guards. Repeated apply-existing execution is byte-idempotent at the stable state; check mode reports 201 PASS, 12 PARTIAL and no mutation.

## CI

`.github/workflows/ci.yml` has bounded static-verification and Docker jobs with concurrency cancellation and uploaded evidence. Static verification runs the deterministic root `verify:ci` surface (typecheck, lint, full tests/build and governed audits). The Docker job runs the production image verifier, including non-root/asset/LibreOffice/font probes and a real BM-001 DOCX-to-PDF conversion. It cannot honestly mark full API boot/readiness green until the migration-history decision is resolved.

## Governing instructions

Applicable instructions were read from root `AGENTS.md`, `apps/web/AGENTS.md`, the harness manifest/intake/failure log, and the always-on coding/safety/tooling rules. If Next.js code is changed, the matching guide under `node_modules/next/dist/docs/` must be read first.
