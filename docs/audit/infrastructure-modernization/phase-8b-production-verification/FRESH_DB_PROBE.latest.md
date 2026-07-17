# FRESH_DB_PROBE — Stage 3 (Phase 8B)

| Field | Value |
|---|---|
| Run ID | `phase8b-20260711-0100` |
| MariaDB image | `mariadb:11` (matches `infra/docker-compose.dev.yml`) |
| Probe database | `quanlyvks_probe` |
| Probe credentials | Stored only as `docker -e MYSQL_*` env; never printed |
| Host OS | Windows 10.0.26200 |
| Container | `phase8b-20260711-0100-mariadb` |
| Network | `phase8b-20260711-0100-net` (bridge, no host port) |
| Volume | `phase8b-20260711-0100-mariadb-data` (fresh, disposable) |
| Sidecar | `phase8b-20260711-0100-prisma` (`node:22-bookworm-slim`) |

## Procedure

1. Pre-clean: `docker rm -f`, `docker network rm`, `docker volume rm` for any prior Phase 8B resources matching the run ID.
2. Boot MariaDB with unique container name, unique network, unique volume.
3. Wait for `docker inspect --format '{{.State.Health.Status}}' == healthy` (5 s).
4. Confirm `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='quanlyvks_probe'` returns `0`.
5. Run `prisma migrate deploy` **inside a sidecar container** joined to the same network so Prisma can resolve `phase8b-mariadb:3306`.
6. Capture exit code and complete output.
7. Read `_prisma_migrations`.
8. Re-run `prisma migrate deploy` against the same disposable DB.
9. Cleanup via `try/finally` (network + volume + containers deleted).

## Results

### Pre-migrate confirmation
```
table_count
0
```

### First `prisma migrate deploy` — exit 1
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": MySQL database "quanlyvks_probe" at "phase8b-mariadb:3306"

13 migrations found in prisma/migrations

Applying migration `20260615000000_init_schema`
Applying migration `20260616_add_auth_sessions`
Applying migration `20260616000000_add_officials_role`
Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from.
Migration name: 20260616000000_add_officials_role
Database error code: 1060
Database error:
Duplicate column name 'role'
Please check the query number 1 from the migration file.
```

### `_prisma_migrations` after first run
```
migration_name                       finished_at                  applied_steps_count
20260615000000_init_schema           2026-07-10 18:14:01.664      1
20260616_add_auth_sessions           2026-07-10 18:14:01.666      1
20260616000000_add_officials_role    NULL                         0
```

### Post-init table count
```
table_count
32
```

### Second `prisma migrate deploy` — exit 1 (idempotence check)
```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied.
The `20260616000000_add_officials_role` migration started at 2026-07-10 18:14:01.667 UTC failed
```

## Classification

| Hypothesis | Status | Evidence |
|---|---|---|
| `MIGRATION_CODE_DEFECT` | **CONFIRMED** | `20260616000000_add_officials_role/migration.sql` issues `ALTER TABLE officials ADD COLUMN role`, but `20260615000000_init_schema/migration.sql` already creates `officials.role` (line 486). `schema.prisma` model `officials` (line 571) declares `role String @default("OFFICIAL")`, consistent with `init_schema`, not with the additive migration. |
| `PERSISTENT_DB_DRIFT` | DISCONFIRMED | Fresh DB confirmed with 0 tables before migrate; failure reproduces on empty schema. |
| `ENTRYPOINT_DEFECT` | DISCONFIRMED | Stage 3 invokes `prisma migrate deploy` directly inside a sidecar, bypassing `docker/api-entrypoint.sh`. |
| `PROBE_CONFIGURATION_DEFECT` | DISCONFIRMED | Unique volume, unique network, schema confirmed empty, network alias resolves. |
| `UNKNOWN` | n/a | Root cause fully classified. |

## Idempotence

`first_exit = 1`, `second_exit = 1`. The system is **not idempotent** because the failed migration leaves a permanent `P3009` lock in `_prisma_migrations`.

## Protected areas

- `apps/api/prisma/schema.prisma` — **untouched**.
- All existing migration files — **untouched**.
- Persistent user DB — **untouched**.
- `docker/api-entrypoint.sh` — **untouched**.

## Log files

- `logs/stage3-migrate-deploy.log` (first run, exit 1)
- `logs/stage3-migrate-deploy-second.log` (second run, exit 1)
- `logs/stage3-prisma-migrations.log`
- `logs/stage3-table-count.log`
- `logs/stage3-empty-check.log`
- `logs/stage3-script.log`
- `logs/stage3-fresh-db-probe.json` (programmatic result envelope)

## Next step

**STAGE 4 — Migration Remediation Gate.** The failure reproduces on a fresh DB, so the gate opens. The smallest failing boundary is migration `20260616000000_add_officials_role`, query #1. Stage 4 will (a) author a regression smoke, (b) enumerate the safe forward-only repair options, and (c) defer any editing of an already-applied migration to a separate user decision.