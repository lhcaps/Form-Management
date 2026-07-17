# Phase 8B - Active baseline implementation

## Verdict

`ACTIVE_BASELINE_GO`

Stage D was entered only after `TRANSITION_GO`. The 13-directory legacy chain is archived and hash-verified, the active path contains exactly one squashed baseline, fresh deployment passes twice, and E1-E3 were repeated successfully using the installed active baseline.

## Archive

- Source directories recorded: `13`.
- Source migration SQL files recorded: `13`.
- Archive directories/files: `13` / `13`.
- Every archive SHA-256 equals its source SHA-256: yes.
- Independent pre-change backup: `%TEMP%/qllaw-phase8b-stage-d-prechange-backup-202607110338`.
- Archive manifest: `ARCHIVE_MANIFEST.latest.json`.
- Manifest SHA-256: `e06cdde9ae8effce94bf61987ff0ea3cc2ed45789ed18cde98802f350ebc16c5`.
- Legacy migration metadata file in active directory: none existed; none was dropped.

The old directories were removed from the active Prisma path only after archive and backup hashes matched.

## Active baseline

- Directory: `apps/api/prisma/migrations/20260711000000_squashed_baseline/`.
- Active migration directory count: `1`.
- Active migration file count: `1`.
- Candidate SHA-256: `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5`.
- Active SQL SHA-256: `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5`.
- Byte-identical to approved candidate: yes.
- `schema.prisma` SHA-256 before/after: `057375956a72fe40e11e0950c4126c4827e05824714a881f9de9ea0826e6022b` / identical.
- Required bootstrap data statements: none.

## Active fresh validation

The reusable migration regression gate ran against a database confirmed to contain zero tables:

- First deploy: exit `0`.
- Second deploy: exit `0`.
- Failed migration rows: `0`.
- Status: exit `0`.
- Database-to-current-datamodel diff: empty.
- Resulting structure: `40` tables including `_prisma_migrations`, `490` total columns.
- Container/network/volume cleanup: `0` / `0` / `0`, no leftovers.

## Active transition validation

E1-E3 were rerun with only `20260711000000_squashed_baseline` exposed as active history:

| State | Verdict | Final status | Deploy 1/2 | App-schema mutation | Legacy history preserved |
| --- | --- | --- | --- | --- | --- |
| E1 successful old metadata | PASS | `0` | `0` / `0` | no | yes |
| E2 active failed old row | PASS | `0` | `0` / `0` | no | yes |
| E3 incomplete old metadata | PASS | `0` | `0` / `0` | no | yes |

E2 again proved that resolving the baseline first does not clear an active failed row: deploy exited `1` until the old failure was resolved as rolled back.

- Evidence: `logs/phase8b-codex-c3-20260710204911.json`.
- Evidence SHA-256: `c2df5598e085454dd6844fc844e4452da9a8faf7964c55a7d0f9a9b3fbfe672a`.

## Rollback rehearsal

A filesystem-only rollback rehearsal ran in a unique OS-temp workspace:

1. Installed the active baseline and verified its candidate hash.
2. Removed that temp active baseline.
3. Restored all 13 archived directories.
4. Verified all 13 restored SQL hashes against `ARCHIVE_MANIFEST.latest.json`.
5. Reinstalled the active baseline and reverified byte equality.
6. Removed the rehearsal workspace.

Result: `13/13` restored hashes matched, reinstalled active count `1`, active hash matched, cleanup succeeded. The live active tree was not disturbed by the rehearsal.

## Safety

- Persistent migration resolution executed: no.
- Persistent DDL/data mutation: no.
- Staged files after implementation: `0`.
- Branch/HEAD changed: no.
- Commit/push/PR: none.
