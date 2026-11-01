# QLLaw — Customer-local installation

This guide covers installing QLLaw on a customer-controlled machine.
It does **not** cover cloud or multi-tenant production deployments.

## Requirements

| Requirement | Version | Notes |
|---|---|---|
| Windows | 10 / 11 / Server 2019+ | Linux x86_64 also supported |
| Node.js | 22.x (>= 22 < 23) | LTS line |
| pnpm | >= 10.0.0 | Use `corepack enable && corepack prepare pnpm@10 --activate` |
| Docker Desktop | 4.x | Required for MariaDB. WSL2 backend recommended. |
| Docker Compose | v2.x | Bundled with Docker Desktop |
| Disk free | >= 10 GB | Source + node_modules + DB |
| RAM | >= 8 GB | 4 GB minimum for development |
| Ports free | 3000 (Web), 3001 (API), 3307 (MariaDB) | Stop other services that bind these |

LibreOffice is **only** required if you run the DOCX rendering pipeline
locally (the pre-built Docker image already includes it).

## First-time installation

```powershell
# 1. Clone
git clone https://github.com/lhcaps/Form-Management.git
cd Form-Management
git checkout codex/customer-ready-baseline

# 2. Setup
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\setup.ps1
```

`setup.ps1` performs:

1. Copies `.env.example` → `.env` (only if missing — never overwrites).
2. Runs `pnpm install --frozen-lockfile`.
3. Brings up MariaDB via `pnpm dev:infra:up` and waits for readiness.
4. Runs `prisma migrate deploy` to apply the schema.
5. Runs `pnpm dev:health` to verify the stack boots.

## First launch

```powershell
# Start the local stack and wait for health
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\start.ps1
```

After the start script reports healthy, open:
- Web: http://127.0.0.1:3000
- API: http://127.0.0.1:3001/api/v1/health

## First administrator account

QLLaw uses Clerk for authentication. The customer-local install must:

1. Create a Clerk application at https://dashboard.clerk.com/.
2. Copy the publishable + secret keys into `.env`:
   - `CLERK_SECRET_KEY=sk_test_...`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...`
3. Restart `pnpm dev` to pick up the new env.
4. The first user to sign in via Clerk is the implicit customer administrator.
   Grant the administrator the `Officials.Admin` role through the
   Clerk dashboard or the QLLaw admin UI.

## Database initialization

The `setup.ps1` script runs `prisma migrate deploy`. If you need to
bootstrap the 213 locked contracts into a fresh database, run the
explicit one-shot bootstrap job (see `docs/operations/PRODUCTION_DOCKER_RUNBOOK.md`).

## Shutdown and restart

```powershell
# Graceful stop (DB volume retained)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\stop.ps1

# Restart
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\start.ps1
```

## Upgrade procedure

```powershell
# 1. Stop the stack
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\stop.ps1

# 2. Pull the new release
git fetch origin
git checkout <tag-or-commit>

# 3. Re-run setup (idempotent — does NOT overwrite .env)
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\setup.ps1

# 4. Start
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\start.ps1
```

## Backups

See `docs/CUSTOMER_LOCAL_BACKUP_RESTORE.md`.

## Logs

- API logs: `apps/api/logs/` (when run via `pnpm dev`)
- Web logs: stdout when run via `pnpm dev`
- Docker logs: `pnpm dev:infra:logs`

## Troubleshooting

See `docs/CUSTOMER_LOCAL_TROUBLESHOOTING.md`.

## Known limitations

- The customer-local install runs against a single MariaDB instance.
  Production-scale horizontal scaling requires the production Docker
  Compose stack, not the customer-local scripts.
- LibreOffice rendering uses fallback fonts if Times New Roman is not
  installed on the host. Production requires the licensed font.
- 213 forms are exposed by the catalogue, but only 25 have been
  runtime-browser-verified end-to-end. The remainder are catalogued
  and generate-server-rendered DOCX but not yet browser-certified.

## Security responsibilities

The customer is responsible for:

- Generating and safeguarding the Clerk secret key.
- Choosing and storing all database passwords.
- Backing up the database (`scripts/local/backup.ps1`) at a cadence
  appropriate to the volume of new generated documents.
- Restricting host access to ports 3000/3001/3307.
- Rotating the API `AUTH_COOKIE_SECRET` periodically.
- Reviewing Clerk user roles on a regular cadence.
