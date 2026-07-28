# Production Docker runbook

This runbook covers the production Compose stack in `docker-compose.prod.yml`.
It does not authorize edits to historical migrations, locked contracts, or
persisted database data.

## Current deployment gate

The active fresh-database authority is the squashed migration
`20260711000000_squashed_baseline`. A disposable MariaDB bootstrap probe has
verified two consecutive `prisma migrate deploy` runs, readiness after restart,
and all 213 locked contracts. Do not reintroduce or edit historical migration
directories from the retired chain.

Production uses `QLLAW_FONT_POLICY=required`. Mount an approved licensed Times
New Roman directory through `QLLAW_TNR_FONT_DIR`; API readiness fails closed if
the four required styles are not available. Use `fallback-allowed` only for
explicit development/test work.

## Preflight

1. Copy `.env.docker.example` to an ignored secret file such as `.env.docker`.
2. Replace every placeholder through the deployment secret store. Never commit
   the resulting file.
3. Keep `SEED_DATA=false` for normal deploys and every restart.
4. Ensure the host `storage/` and `logs/` directories are writable by UID/GID
   1000, used by the non-root `node` containers.
5. Take and verify a database backup using `DATABASE_BACKUP_RESTORE.md`.
6. Validate configuration without starting services:

```powershell
docker compose --env-file .env.docker -f docker-compose.prod.yml config --quiet
pnpm docker:verify -- --build
```

`docker:verify` checks the sensitive build-context guard, Compose config,
non-root users, healthchecks, the exact 213 locked and 213 compiled artifacts,
and both form-contract package entrypoints.

## First deploy and restart behavior

The API entrypoint waits for MariaDB, runs `prisma migrate deploy`, optionally
runs the seed, and then uses `exec` to start Node. Migration and seed failures are
fail-closed; the API must not start after either failure.

For a fresh deployment:

```powershell
docker compose --env-file .env.docker -f docker-compose.prod.yml up -d mysql
docker compose --env-file .env.docker -f docker-compose.prod.yml --profile bootstrap run --rm contract-bootstrap
docker compose --env-file .env.docker -f docker-compose.prod.yml up -d api web
docker compose --env-file .env.docker -f docker-compose.prod.yml ps
```

`contract-bootstrap` is an explicit one-shot operator job. It first runs the
idempotent squashed migration, then applies the 213 locked, compiled contract
corpus to the resulting current schema; it writes its provenance under the bind-mounted
`storage/bootstrap-artifacts/` directory. It is deliberately not part of
normal API startup or restarts. `SEED_DATA=true` seeds business catalog data
but does **not** replace this contract bootstrap job.

For an already initialized database, skip the one-shot job:

```powershell
docker compose --env-file .env.docker -f docker-compose.prod.yml up -d mysql
docker compose --env-file .env.docker -f docker-compose.prod.yml up -d api web
docker compose --env-file .env.docker -f docker-compose.prod.yml ps
```

Normal restarts must keep `SEED_DATA=false`. Never use restart loops, parallel
seed workers, or the bootstrap profile against an unapproved persistent database.

## Conditions and smoke checks

- API liveness: `GET /api/v1/health`
- API readiness: `GET /api/v1/ready`
- Web health: `GET /healthz`
- The web service is health-gated on the API; arbitrary sleeps are unnecessary.
- The database has no public host port in the production Compose file.

```powershell
Invoke-RestMethod http://127.0.0.1:3001/api/v1/health
Invoke-RestMethod http://127.0.0.1:3001/api/v1/ready
Invoke-RestMethod http://127.0.0.1:3000/healthz
```

Readiness is intentionally stricter than liveness. A non-ready response must be
investigated, not converted into a passing smoke result.

## Graceful stop and storage

Compose sends SIGTERM and allows 30 seconds for API/web and 45 seconds for
MariaDB. Nest shutdown hooks close Prisma before exit. Verify on staging:

```powershell
docker compose --env-file .env.docker -f docker-compose.prod.yml stop -t 30 api
docker compose --env-file .env.docker -f docker-compose.prod.yml logs --tail 100 api
```

The bind-mounted `storage/` tree contains generated documents and temporary
runtime preview files; only persisted generated-document artifacts belong to the
legal-document workspace. Standalone `/templates/:code` preview sessions remain
temporary and must never create generated-document rows.

Start sizing with at least 2 CPU and 2 GiB RAM for the API/LibreOffice container,
then tune from measured concurrent render time and peak RSS. Monitor disk usage
for `storage/`, MariaDB, and conversion temporary files. The wrapper uses a unique
temporary LibreOffice profile and a bounded timeout, but capacity exhaustion is
still an operational failure.

## Rollback limits

Application images can be rolled back to a previously verified immutable tag.
Database migration rollback is not automatic: `prisma migrate deploy` is forward
only. Restore a verified backup into an isolated environment, validate migration
history and legal-document/audit row counts, then follow an approved incident
plan. Never point a scratch migration or restore probe at the persistent volume.
