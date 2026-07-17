# Phase 8B - Existing DB transition simulation

## Verdict

`TRANSITION_GO`

E1, E2, and E3 all reached a deterministic final state with `migrate status` exit `0`, two consecutive `migrate deploy` exits `0`, zero active failed migration rows, preserved legacy metadata, and no application-schema mutation. No persistent database write occurred.

The persistent schema differs from the current Prisma datamodel only by the two previously identified `DEFAULT 'GLOBAL'` clauses on `form_contract_versions.scope_key` and `official_permissions.scope_key`. This is a bounded, compatibility-preserving historical difference: the candidate exactly matches the current datamodel, current writes provide `scope_key`, and the transition procedure performs metadata-only resolution. It is classified as non-material for the local squash gate; it remains an explicit operator-visible difference and is not silently altered.

## Schema-only clone

- Source operation: `mariadb-dump --no-data --skip-lock-tables` against the persistent container.
- Application/business rows read or copied: `0`.
- Dump contains `INSERT`, `REPLACE`, or `LOAD DATA`: `NO`.
- Dump size: `54,954` bytes.
- Dump SHA-256: `ec48b52d9df6a4ff1d6e20dc1d877d8ab5e15d2f5d44d6ddf64af46febe697c8`.
- Clone: disposable MariaDB `11`, unique container, dynamic host port.
- Clone structure: `40` tables (`39` application + `_prisma_migrations`), `490` columns, `195` physical indexes, `64` foreign keys.
- Historical defaults preserved in clone: both `scope_key` columns use `DEFAULT 'GLOBAL'`.
- Candidate-only active history during simulation: `000000000000_squashed_baseline`.
- Candidate SHA-256: `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5`.

## E1 - Successful legacy history

Fixture: all 13 current legacy migration names, each represented by a successful non-sensitive metadata row.

| Check | Result |
| --- | --- |
| Status before baseline resolution | exit `1`, expected divergence |
| `resolve --applied 000000000000_squashed_baseline` | exit `0` |
| Status after the single resolution | exit `0` |
| Deploy after resolution, first / second | `0` / `0` |
| Final status | `0` |
| Final regression deploy, first / second | `0` / `0` |
| Legacy rows preserved | yes, 13 old + 1 baseline row |
| Active failed rows | `0` |
| Application-schema mutation | none |

One baseline resolution is sufficient for E1. Prisma accepts database-only legacy rows once the single active baseline is marked applied; deleting old metadata is neither required nor permitted by the runbook.

## E2 - Active failed legacy row

Fixture: successful `20260615000000_init_schema` plus an active failed `20260616000000_add_officials_role` row matching the Stage 3 `P3018` / MariaDB `1060` failure class.

The deliberately incorrect order proved the guard:

- Baseline `resolve --applied` itself exited `0`.
- Status remained exit `1`.
- Deploy remained exit `1` with Prisma `P3009` naming the failed legacy migration.
- Application structure remained byte-fingerprint equivalent.

The correct procedure was then run from a fresh clone:

| Check | Result |
| --- | --- |
| Resolve failed row `--rolled-back` | exit `0` |
| Workspace required for rollback resolution | candidate-only history was sufficient |
| Resolve baseline `--applied` | exit `0` |
| Final status | exit `0` |
| Deploy first / second | `0` / `0` |
| Legacy rows preserved | yes, init + rolled-back failed row + baseline row |
| Active failed rows | `0` |
| Application-schema mutation | none |

Therefore an active failed row must be resolved as rolled back before the baseline transition is considered operationally complete. The real persistent database currently has zero active failed rows, so this branch is not applicable to its present state, but the branch is proven.

## E3 - Incomplete legacy metadata

Fixture: complete application schema plus the first 6 successful legacy migration names only.

| Check | Result |
| --- | --- |
| Status before baseline resolution | exit `1`, expected divergence |
| `resolve --applied 000000000000_squashed_baseline` | exit `0` |
| Status after the single resolution | exit `0` |
| Deploy first / second | `0` / `0` |
| Legacy rows preserved | yes, 6 old + 1 baseline row |
| Active failed rows | `0` |
| Application-schema mutation | none |

One baseline resolution is sufficient for E3 when no active failed row exists.

## Persistent non-mutation proof

The persistent metadata snapshot taken before transition work and the snapshot taken after the schema-only dump and all simulations have identical hashes:

- Structure SHA-256: `1ea4e8e74fc4273b52c373937619141ea865ac7219f4d7977e8048c6f51bf2ae`.
- Migration metadata SHA-256: `c526a1cdaa2c534a4758fc3d1e0884ef75f241a402bb06c0c57d8ce4c37b1f11`.
- Application rows read: `0`.
- Persistent writes: `0`.

## Cleanup and evidence

- Successful run: `logs/phase8b-codex-c3-20260710203608.json`.
- JSON SHA-256: `792d25dfe79c73c6fc95653e4a05051b3ec1bfec0c98f97702d0577b30ad05ca`.
- Compact log SHA-256: `bcd075eb1dd4bc5506adf882185e4a8ea1b75f1a40361f2ec0d9e95c9bcf54ea`.
- Duration: `33,987 ms`.
- Disposable container removal exit: `0`.
- Disposable container leftovers: `0`.
- Temporary workspace removed: yes.
- Final persistent snapshot: `logs/phase8b-codex-c1-20260710203700.json`.

Three preliminary harness attempts failed before a valid simulation result because of an incorrect Node import, an incorrect disposable-client password variable, and missing FK-check wrappers around the compact DDL dump. Each attempt failed closed, removed its exact disposable container, and left no resource behind. They are retained as raw negative evidence and are not counted as transition results.
