# QLLaw — Backup and restore

Customer-local backup strategy:

- Take a daily backup before working hours.
- Keep at least 14 days of backups.
- Store backup files on a separate physical disk from the live
  database to mitigate disk-failure risk.
- Encrypt the backup directory at rest when the customer site
  requires it.

## Backup procedure

```powershell
# Take a backup to ./backups/qllaw-<timestamp>/
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\backup.ps1
```

The script:

1. Connects to the running MariaDB container.
2. Runs `mariadb-dump --single-transaction --quick --routines --triggers --events --hex-blob`.
3. Computes a SHA-256 of the dump file.
4. Writes a `manifest.json` next to the dump.

A zero-byte dump file is treated as a hard failure — the script
aborts with a non-zero exit code.

## Manual backup (advanced)

If `scripts/local/backup.ps1` is not available, the same effect can be
achieved via:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "qllaw-$stamp.sql"
docker compose -f infra/docker-compose.dev.yml exec -T mariadb sh -lc 'exec mariadb-dump --single-transaction --quick --routines --triggers --events --hex-blob --default-character-set=utf8mb4 -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' | Set-Content -LiteralPath $backup -Encoding utf8NoBOM
Get-FileHash -Algorithm SHA256 -LiteralPath $backup
```

## Restore procedure

Restore requires the `--confirm` flag and validates the SHA-256
before applying. Use a fresh isolated MariaDB instance whenever
possible.

```powershell
# 1. Dry-run: print what would happen
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\restore.ps1 `
  -BackupPath .\backups\qllaw-20260727-101530\qllaw-20260727-101530.sql

# 2. Apply
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\local\restore.ps1 `
  -BackupPath .\backups\qllaw-20260727-101530\qllaw-20260727-101530.sql `
  -Confirm
```

## Verification after restore

After restoring, verify:

```powershell
# Confirm migration history
& pnpm prisma:migrate:status

# Confirm health
& pnpm dev:health

# Confirm catalogue still exposes 213 forms
& pnpm audit:forms:corpus
```

## Off-site backup retention

Customer backup retention is the customer's responsibility. QLLaw
does not phone home. Recommended:

- Daily local snapshot retained for 14 days.
- Weekly off-site copy retained for 6 months.
- A documented quarterly restore drill on an isolated test host.
