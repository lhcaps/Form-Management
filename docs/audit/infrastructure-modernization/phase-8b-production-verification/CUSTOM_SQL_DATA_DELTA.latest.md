# Custom SQL and data delta audit

## Scope

Compared all 13 current `migration.sql` files against the immutable schema-generated baseline and the current application/seed write paths.

Inventory:

- six `UPDATE` statements;
- one `INSERT ... SELECT`;
- two database column comments;
- two `ON UPDATE CURRENT_TIMESTAMP(0)` declarations;
- three explicit `ENGINE=InnoDB` declarations;
- no session settings, views, triggers, procedures, generated columns, or custom functions.

## Classification

| Source delta | Classification | Candidate decision |
|---|---|---|
| Final table/column/index/FK DDL, names, and FK actions | `REQUIRED_IN_BASELINE` | Already generated from `schema.prisma`; 64 FK names/actions and final mapped indexes are retained. |
| `utf8mb4` / `utf8mb4_unicode_ci` | `REQUIRED_IN_BASELINE` | Already present on all 39 generated tables. |
| Correct Vietnamese defaults from `20260617110000_fix_vietnamese_column_defaults` | `REQUIRED_IN_BASELINE` | Already generated from the current schema. |
| `auth_identities.updated_at ... ON UPDATE CURRENT_TIMESTAMP(0)` from `20260622000000_add_clerk_auth_identities` | `REQUIRED_IN_BASELINE` | Added once with a source/reason SQL comment. Identity upsert/link/unlink paths do not set `updated_at`, while API output exposes it. |
| Existing-official role promotion from `20260616000000_add_officials_role` | `REQUIRED_AS_POST_BASELINE_MIGRATION` | Not run on an empty baseline. Stage C must establish from real migration metadata whether it already ran before any legacy transition is approved. |
| Existing-official username derivation from `20260616010000_add_official_credentials` | `REQUIRED_AS_POST_BASELINE_MIGRATION` | Not run on an empty baseline. If ever required for a legacy state, it needs collision-safe review before reuse. Fresh usernames are `OWNED_BY_SEED`. |
| Two populated-row `scope_key` transforms from `20260620170000_enforce_form_contract_scope_uniqueness` | `REQUIRED_AS_POST_BASELINE_MIGRATION` | Not run on an empty baseline. Stage C migration metadata determines whether the real existing state already received them. |
| `scope_key DEFAULT 'GLOBAL'` left by the old ALTER statements | `OBSOLETE` | Current schema has no default and all current create paths set `scope_key` explicitly. Candidate does not retain the old default. Any real-DB default difference is reported in Stage C, not hidden. |
| Template/template-version blanket attribution to username `admin` | `OBSOLETE` | Fresh ownership is seed-owned. Existing transition does not execute the baseline and therefore preserves existing ownership; it must not re-attribute arbitrary custom templates. |
| Three ADMIN permission rows from `20260620150000_add_form_contract_platform_v2` | `OBSOLETE` | Fresh migration runs before officials exist. Current ADMIN authorization grants the same three permissions by role, and seed does not require DB rows. |
| `auth_sessions.updated_at ON UPDATE` from `20260616_add_auth_sessions` | `OBSOLETE` | The duplicate guarded table DDL is normally a no-op and current session paths insert/select/delete rather than update. |
| Role and auth-audit column comments | `NON_FUNCTIONAL_ONLY` | Documentation only; they do not enforce values and are not copied. |
| SQL narrative comments / column order (`AFTER`) | `NON_FUNCTIONAL_ONLY` | Not copied. |
| Explicit `ENGINE=InnoDB` on three later tables | `OBSOLETE` | Redundant under the supported MariaDB/InnoDB environment; Stage B3 records the actual resulting engine. |

## Augmented candidate

`migration.candidate.sql` was first copied byte-for-byte from `migration.generated.sql`, then changed only at the `auth_identities.updated_at` definition:

```sql
-- Retained from 20260622000000_add_clerk_auth_identities: identity update paths rely on the database-managed timestamp.
`updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
```

| Artifact | SHA-256 |
|---|---|
| `migration.generated.sql` | `a8be201236a362adacbffeb4bd905db10942b54a9ed1a98ba8ec09b68b26efb7` |
| `migration.candidate.sql` | `002158c79fbace15308fb89caa3c65554489f10fa8ebc5622703f9953aee07d5` |

The byte diff contains exactly one source/reason comment and one functional line change. The generated artifact remains unchanged.

## Unknowns

Material candidate unknowns: **0**.

Conditional legacy data transforms are transition-state concerns, not baseline construction. Stage C must prove their applicability from non-sensitive migration metadata; the candidate is never applied to a populated existing database.
