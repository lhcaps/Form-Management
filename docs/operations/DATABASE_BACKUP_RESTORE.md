# Database backup and restore verification

These procedures preserve the MariaDB database used by QLLaw. They do not alter
the Prisma schema or authorize migration-history rewrites.

## Backup

Take backups before deploys, migrations, controlled seeding, or recovery work.
The command runs inside the database container so the password remains in the
container environment and is not printed in the host command line.

PowerShell 7:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = "qllaw-$stamp.sql"
docker compose --env-file .env.docker -f docker-compose.prod.yml exec -T mysql sh -lc 'exec mariadb-dump --single-transaction --quick --routines --triggers --events --hex-blob --default-character-set=utf8mb4 -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' | Set-Content -LiteralPath $backup -Encoding utf8NoBOM
Get-FileHash -Algorithm SHA256 -LiteralPath $backup
Get-Item -LiteralPath $backup | Select-Object FullName,Length,LastWriteTimeUtc
```

For very large dumps, use Bash/WSL byte-preserving redirection:

```bash
docker compose --env-file .env.docker -f docker-compose.prod.yml exec -T mysql sh -lc 'exec mariadb-dump --single-transaction --quick --routines --triggers --events --hex-blob --default-character-set=utf8mb4 -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"' > qllaw.sql
sha256sum qllaw.sql
```

Store the dump, SHA-256, database name, application image tag, and UTC timestamp
in encrypted storage with tested retention. A zero-byte file is a failed backup.

## Restore verification in an isolated project

Never test a restore against the production volume. Create a separate ignored env
file whose `MYSQL_DATABASE` names a scratch database, then use a unique Compose
project so its volume cannot collide with production:

```powershell
$project = "qllaw-restore-verify"
docker compose --project-name $project --env-file .env.restore-verify -f docker-compose.prod.yml up -d mysql
docker compose --project-name $project --env-file .env.restore-verify -f docker-compose.prod.yml ps
Get-Content -LiteralPath .\qllaw.sql -Raw -Encoding utf8 | docker compose --project-name $project --env-file .env.restore-verify -f docker-compose.prod.yml exec -T mysql sh -lc 'exec mariadb --default-character-set=utf8mb4 -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE"'
```

Use Bash/WSL input redirection for a large dump. After import, verify at minimum:

```sql
SELECT COUNT(*) AS migrations FROM _prisma_migrations;
SELECT migration_name, finished_at, rolled_back_at
FROM _prisma_migrations ORDER BY started_at;
SELECT COUNT(*) AS generated_documents FROM generated_documents;
SELECT COUNT(*) AS generated_document_audit_logs FROM generated_document_audit_logs;
SELECT COUNT(*) AS audit_logs FROM audit_logs;
SELECT @@character_set_server, @@collation_server, @@time_zone;
```

Compare migration names/checksums and the generated-document/audit counts with the
backup manifest. Open a representative persisted document and verify its audit
history. Standalone runtime preview sessions are intentionally ephemeral and are
not a restore-success criterion.

Only after these checks may an operator run `prisma migrate status` against the
isolated restore. At present, do not run `migrate deploy` on a blank or restored
environment until the duplicate historical migrations have an approved baseline
strategy.

When verification is complete and the project name has been checked twice, the
isolated resources can be removed:

```powershell
docker compose --project-name qllaw-restore-verify --env-file .env.restore-verify -f docker-compose.prod.yml down -v
```

`down -v` is destructive for that Compose project. Never substitute the
production project name.

## Recovery and rollback limits

- Prisma migrations are forward-only; an image rollback does not undo SQL.
- Restore changes all data to the backup point. Preserve incident evidence before
  replacing anything.
- Never reseed as a substitute for restoring user, generated-document, or audit
  data.
- Confirm `utf8mb4` and `+07:00`/the approved timezone after every restore.
- Keep `SEED_DATA=false` during restore verification and normal restarts.
