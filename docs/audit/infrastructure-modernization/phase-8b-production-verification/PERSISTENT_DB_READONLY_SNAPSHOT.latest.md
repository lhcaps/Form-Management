# Phase 8B - Persistent DB read-only snapshot

## Verdict

`SCHEMA_DIFFERENCE` - bounded to two historical `scope_key` defaults. Migration metadata is healthy and fully aligned with the current 13-directory history. The persistent database was not modified.

This is not yet a transition GO decision. E1-E3 disposable simulations must prove the exact metadata procedure and determine whether the two retained defaults are an accepted compatibility difference or a transition blocker.

## Safety boundary

- Source: running `quanlyvks-mariadb` container, metadata only.
- SQL mode: `SET SESSION TRANSACTION READ ONLY` plus `START TRANSACTION READ ONLY`.
- Application/business rows read: `0`.
- Credentials exposed: none.
- Persistent writes: none.
- Before/after structure SHA-256: `1ea4e8e74fc4273b52c373937619141ea865ac7219f4d7977e8048c6f51bf2ae` / identical.
- Before/after migration metadata SHA-256: `c526a1cdaa2c534a4758fc3d1e0884ef75f241a402bb06c0c57d8ce4c37b1f11` / identical.

## Metadata snapshot

| Item | Result |
| --- | --- |
| MariaDB | `11.8.8-MariaDB-ubu2404` |
| Database | `quanlyvks` |
| Schema defaults | `utf8mb4` / `utf8mb4_unicode_ci` |
| Application tables | `39` |
| `_prisma_migrations` table | present |
| Total columns | `490` (`482` application + `8` migration metadata) |
| Physical indexes | `195` (`194` application + migration metadata PK) |
| Foreign keys | `64` |
| Migration metadata rows | `15` |
| Unique migration names | `13` |
| Active failed rows | `0` |
| Rolled-back historical attempts | `2` |
| Filesystem-only names | `0` |
| Database-only names | `0` |

The two rolled-back attempts are for `20260616000000_add_officials_role` and `20260616010000_add_official_credentials`; each has a later successful row. They are historical status records, not active failures.

## Prisma inspection

`pnpm migrate:status` from `apps/api`, using the repository's root-env package wrapper, exited `0` and reported 13 migrations with an up-to-date database.

The database-to-datamodel diff exited `0` and found exactly two differences:

```sql
ALTER TABLE `form_contract_versions` ALTER COLUMN `scope_key` DROP DEFAULT;
ALTER TABLE `official_permissions` ALTER COLUMN `scope_key` DROP DEFAULT;
```

The persistent columns currently retain `DEFAULT 'GLOBAL'`; the current Prisma schema and generated candidate intentionally have no default. The candidate audit found current write paths supply `scope_key`, so this difference is compatibility-preserving for current code, but Stage C simulations must still account for it explicitly. No persistent DDL is authorized or proposed in this phase.

An initial root-level Prisma invocation exited `1` because the package-local environment selected the unsupported `sha256_password` authentication plugin. The repository's existing `apps/api` `migrate:status` wrapper loads the root `.env` and succeeded. This was a local command-environment issue, not a database migration failure.

## Evidence

- Before snapshot: `logs/phase8b-codex-c1-20260710202535.json` (`8217f26fc8b1e99c0bf585319329f4f0045b4131a6e2507996593ddec78faf90`).
- After snapshot: `logs/phase8b-codex-c1-20260710202636.json` (`db0ed1a5eaee8de9e736006fe1421d49523ee31af8c98f7d2df3bd7bd0808550`).
- Compact metadata logs are byte-identical: SHA-256 `04dfebe2a4375c33889e549a2324a93f967269ac6dc28fa1e9e8c168ea1ff619`.
- Prisma read-only command log: `logs/phase8b-codex-c1-prisma-readonly.log`.

## Classification

- Schema: `SCHEMA_DIFFERENCE` (two bounded defaults).
- Migration metadata: healthy; no `MIGRATION_METADATA_FAILURE`.
- History: no name divergence under the current 13-migration filesystem history.
- Persistent mutation: `NO`.
