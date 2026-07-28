# Candidate fresh-database test

| Field | Value |
|---|---|
| Run ID | `phase8b-codex-b3-20260710201945` |
| MariaDB | `mariadb:11` |
| Prisma sidecar | `node:22-bookworm-slim`; Prisma 6.19.3 |
| Host ports | none |
| Persistent credentials/database | not used |
| Candidate SHA-256 | `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5` |
| Probe exit | 0 |

## Direct SQL database

| Check | Result |
|---|---|
| Initial user tables | 0 |
| Apply `migration.candidate.sql` directly | exit 0 |
| Tables | 39 |
| Columns | 482 |
| Physical indexes | 194 |
| Foreign keys | 64 |
| Engines/collation | 39 × InnoDB / `utf8mb4_unicode_ci` |

## Prisma migration database

A temporary Prisma root contained the current `schema.prisma`, `migration_lock.toml`, and exactly one migration directory: `000000000000_squashed_baseline` with `migration.candidate.sql` as `migration.sql`.

| Check | Result |
|---|---|
| Initial user tables | 0 |
| First `prisma migrate deploy` | exit 0; baseline applied |
| Second `prisma migrate deploy` | exit 0; no pending migrations |
| `prisma migrate status` | exit 0; schema up to date |
| Failed `_prisma_migrations` rows | 0 |
| Tables excluding `_prisma_migrations` | 39 |
| Columns excluding `_prisma_migrations` | 482 |
| Physical indexes excluding `_prisma_migrations` | 194 |
| Foreign keys | 64 |

## Parity

| Diff | Exit | Output |
|---|---:|---|
| Migrated database → current Prisma datamodel | 0 | `-- This is an empty migration.` |
| Direct-apply database → Prisma-deploy database | 0 | `-- This is an empty migration.` |

Complete schema parity is proven for the candidate on MariaDB 11.

## Required custom SQL/data

`information_schema.columns` reports:

```text
auth_identities.updated_at default=current_timestamp() extra=on update current_timestamp()
```

The disposable behavior probe inserted an identity with `updated_at='2000-01-01'`, updated another field, and observed `on_update_worked=1`; the probe row was then deleted.

The candidate contains zero `INSERT` and zero `UPDATE` statements. Historical permission bootstrap and populated-row backfills were classified outside the fresh baseline in `CUSTOM_SQL_DATA_DELTA.latest.md`.

## Cleanup

| Resource | Exit |
|---|---:|
| Prisma sidecar container | 0 |
| MariaDB container | 0 |
| Network | 0 |
| Volume | 0 |
| Temporary Prisma workspace | 0 |

Post-cleanup inspection found no matching container, network, volume, or workspace.

## Evidence

- Full raw log: `logs/phase8b-codex-b3-20260710201945.log` — SHA-256 `bb0791961319459589dadffea05bef403d6ea9c4be8eb8f8d2181e9833aa5c2f`.
- Result envelope: `logs/phase8b-codex-b3-20260710201945.json` — SHA-256 `85a43116c75d32fb78b5cea8fd7faa00adb086ed6e76a5d75cadf962ef0d33b0`.

## Verdict

`FRESH_CANDIDATE_GO`.

No active migration, Prisma schema, canonical evidence, or persistent database was modified.
