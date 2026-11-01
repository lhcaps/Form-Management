# QLLaw — Customer-local operations

This guide covers day-to-day operation of a customer-local QLLaw install.

## Operating scripts

All scripts live in `scripts/local/` and are PowerShell 5.1+ compatible.

| Script | Purpose |
|---|---|
| `doctor.ps1` | Run a non-destructive health check. |
| `setup.ps1` | First-time install or upgrade. Idempotent. |
| `start.ps1` | Start the local stack and wait for readiness. |
| `stop.ps1` | Stop the local stack. DB volume retained. |
| `status.ps1` | Print versions, container state, health endpoints. |
| `backup.ps1` | Take a timestamped MariaDB backup with SHA-256 manifest. |
| `restore.ps1` | Restore a backup with hash verification. |
| `smoke.ps1` | End-to-end smoke (health + catalogue count). |

## Daily workflow

```powershell
# Morning: verify everything is up
.\scripts\local\status.ps1

# If anything is down, restart
.\scripts\local\stop.ps1
.\scripts\local\start.ps1

# After working hours: take a backup
.\scripts\local\backup.ps1
```

## Service topology

| Service | Port | Owner | Stopping policy |
|---|---|---|---|
| Web (Next.js) | 3000 | Local process (pnpm dev) | `stop.ps1` frees port |
| API (NestJS) | 3001 | Local process (pnpm dev) | `stop.ps1` frees port |
| MariaDB | 3307 | Docker container `quanlyvks-mariadb` | `stop.ps1` stops container, retains volume |

## What stays in the repo

The customer-local delivery includes:

- Source code (apps/, packages/)
- Lockfile (pnpm-lock.yaml)
- Safe env examples (.env.example, .env.e2e.example, .env.docker.example, .env.docker.demo.example)
- Docker / Compose config
- Local operation scripts
- Customer documentation
- Audit evidence (docs/audit/final-213-customer-ready/)

## What does NOT ship in the repo

- `node_modules/`
- `.env`, `.env.local`, `.env.docker`, `.env.docker.demo`, `.env.e2e.local`
- `playwright/.clerk/`, `playwright/.auth/`
- `storage/generated/`, `storage/runtime-preview-sessions/`
- `test-results/`, `playwright-report/`
- local databases or backups
- `*.log` files
- scratch / probe scripts

The `.gitignore` enforces this; the `audit-repository-hygiene.mjs`
guard enforces it on every CI run.

## Database lifecycle

- The MariaDB volume is **only** deleted when the customer explicitly
  runs `docker compose -f infra/docker-compose.dev.yml down -v`.
  `stop.ps1` and `start.ps1` retain the volume.
- Migrations are applied with `prisma migrate deploy` (forward-only).
  To roll back a schema change, restore a backup.
- The 213 locked contracts and compiled registry are part of the
  application — they are NOT in the database. The database stores
  generated documents and audit log rows.

## Logging

- API logs (`apps/api/logs/`) rotate daily.
- `pnpm dev:infra:logs` tails Docker container logs.
- For Clerk auth issues, check the Clerk dashboard audit log.

## Updating

Customer-local installs follow the upgrade procedure in
`docs/CUSTOMER_LOCAL_INSTALLATION.md#upgrade-procedure`. Migrations
are forward-only; restore from backup if a release must be reverted.

## Status meanings

`status.ps1` reports:

- `API /health: 200` — API ready
- `API /health: NOT_RESPONDING` — API process not running
- `Web /healthz: 200` — Web ready
- `Web /healthz: NOT_RESPONDING` — Web process not running
- `DB: PASS` — MariaDB reachable on 127.0.0.1:3307
- `DB: FAIL` — MariaDB container not running
