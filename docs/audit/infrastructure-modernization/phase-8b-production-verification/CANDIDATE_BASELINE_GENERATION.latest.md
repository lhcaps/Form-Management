# Candidate baseline generation

| Field | Value |
|---|---|
| Prisma CLI | 6.19.3 |
| `@prisma/client` | 6.19.3 |
| Node | 22.23.1 |
| pnpm | 10.33.2 |
| Schema | `apps/api/prisma/schema.prisma` |
| Schema SHA-256 | `057375956a72fe40e11e0950c4126c4827e05824714a881f9de9ea0826e6022b` |
| Exit | 0 |

## Exact command

```powershell
$env:CI = 'true'
pnpm --filter api exec prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script --output D:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\stage4b-candidate\000000000000_squashed_baseline\migration.generated.sql
```

The installed CLI explicitly supports `--from-empty`, `--to-schema-datamodel`, `--script`, and `--output`.

## Generated artifact

| Metric | Value |
|---|---:|
| Bytes | 48,351 |
| Lines | 1,060 |
| Tables | 39 |
| Columns | 482 |
| Named secondary/unique indexes | 152 |
| Primary-key indexes | 39 |
| Total index declarations | 191 |
| Foreign keys | 64 |
| `INSERT` | 0 |
| `UPDATE` | 0 |
| Views | 0 |
| Triggers | 0 |
| Procedures | 0 |

Path: `stage4b-candidate/000000000000_squashed_baseline/migration.generated.sql`.

SHA-256: `a8be201236a362adacbffeb4bd905db10942b54a9ed1a98ba8ec09b68b26efb7`.

The generated file has not been manually edited. Its hash remained unchanged after the augmented candidate was created.

The 191 SQL declarations comprise 152 named indexes and 39 declared primary keys. MariaDB materializes 194 physical indexes after application because it adds three supporting indexes needed by foreign keys; `CANDIDATE_FRESH_DB_TEST.latest.md` records the live information-schema count.

## Verdict

`GENERATED_FROM_COMPLETE_CURRENT_SCHEMA`.

This artifact supersedes the earlier proposal to copy `20260615000000_init_schema/migration.sql`, which lacks later current models.
