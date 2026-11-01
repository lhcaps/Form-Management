# QLLaw — Troubleshooting

## Doctor reports failures

Run `scripts/local/doctor.ps1` and read each row.

| Row | Meaning | Fix |
|---|---|---|
| `FAIL tool/node` | Node not 22.x | Install Node 22 LTS |
| `FAIL tool/pnpm` | pnpm not installed | `corepack enable && corepack prepare pnpm@10 --activate` |
| `WARN tool/docker` | Docker not on PATH | Install Docker Desktop |
| `WARN port/web` | Port 3000 already bound | Stop the conflicting process or change `WEB_PORT` |
| `WARN port/api` | Port 3001 already bound | Same |
| `WARN database/tcp-reachability` | MariaDB unreachable | `pnpm dev:infra:up && pnpm dev:infra:wait` |
| `FAIL artifact/form-contracts-dist` | Build missing | `pnpm build:contracts` |
| `FAIL artifact/prisma-client` | Prisma client missing | `pnpm prisma:generate` |
| `WARN renderer/libreoffice` | LibreOffice missing | Install or accept DOCX rendering failure |
| `WARN renderer/times-new-roman` | TNR missing | Install Times New Roman or set `QLLAW_FONT_POLICY=fallback-allowed` |

## MariaDB will not start

```powershell
# 1. Inspect logs
pnpm dev:infra:logs

# 2. Confirm port is free
Test-NetConnection -ComputerName 127.0.0.1 -Port 3307

# 3. Recreate the container (DB volume retained unless you also remove it)
pnpm dev:infra:down
pnpm dev:infra:up
```

If the volume is corrupt, restore the most recent backup:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\restore.ps1 `
  -BackupPath .\backups\<latest>\qllaw-<stamp>.sql -Confirm
```

## Migration fails

`prisma migrate deploy` is forward-only. If a migration fails:

1. Read the error in `pnpm prisma:migrate:status`.
2. If the migration is broken, restore the database from backup.
3. If the schema conflict is real, prepare a corrective migration in a
   follow-up release; do **not** edit historical migration SQL files.

## "Catalogue count != 213"

Run `pnpm audit:forms:corpus`. The corpus report shows which form
codes are missing from the catalogue and which are present.

## API returns 503 (not ready)

The API has separate `health` and `ready` endpoints. `ready` fails
until:

- MariaDB is reachable.
- All 213 locked contracts are loaded.
- All 213 compiled registry artifacts are loaded.
- LibreOffice is available (if `QLLAW_FONT_POLICY=required`).

`scripts/local/status.ps1` separates these signals.

## Clerk auth failures

- `__session` cookie missing → user not signed in.
- `Authorization: Bearer ...` 401 → API key invalid or expired.
- Webhook signature mismatch → `CLERK_WEBHOOK_SECRET` incorrect.

Always rotate Clerk secrets through the Clerk dashboard, never by
hand-editing `.env` while the API is running. Restart the API after
rotating.

## Smoke test fails

`scripts/local/smoke.ps1` prints which check failed:

| Check | Fix |
|---|---|
| API /health | See "API returns 503" above |
| Web /healthz | Restart `pnpm dev:web` |
| DB | Restart MariaDB container |
| Catalogue count != 213 | See "Catalogue count != 213" above |

## Logs location

- API logs: `apps/api/logs/`
- Web logs: stdout/stderr from `pnpm dev:web`
- Docker logs: `pnpm dev:infra:logs`

## When to escalate

Escalate to the QLLaw support contact when:

- A release is rolled back and the customer cannot return to the
  previous release.
- Locked contracts were modified out-of-band (a hard release
  invariant).
- A security advisory (HIGH or CRITICAL) requires operator action
  before the next scheduled maintenance window.
