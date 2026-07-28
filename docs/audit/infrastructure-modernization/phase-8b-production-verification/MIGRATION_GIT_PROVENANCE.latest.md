# MIGRATION_GIT_PROVENANCE — Stage 4A.4

| Field | Value |
|---|---|
| Run ID | `phase8b-20260711-0135` |
| Head | `ea3e1c3c53278fad09c8557487ffb1d48d685a65` |
| Branch | `audit/bm006-visual-fidelity-evidence` |

## Commits touching `apps/api/prisma/`

```
b7c8a7be 2026-07-02 19:50 +0700  feat(documents): add generated document export history and audit trail (#28)
3ab4c2c1 2026-07-02 05:38 +0700  fix(auth): make Le Huy seed fail-friendly for missing migrations
725b7457 2026-07-02 05:18 +0700  Auth Phase 2C — Clerk Identity Linking Admin Workflow (#24)
a4a40095 2026-07-02 04:31 +0700  Auth Phase 2B — Clerk DB Identity Projection and Webhook Sync (#23)
e38e7012 2026-06-24 01:14 +0700  feat(deploy): add public staging config for Vercel + Cloudflare Tunnel
1cff7035 2026-06-20 17:56 +0700  feat(form-studio): add contract platform v2
86e606cd 2026-06-19 01:46 +0700  chore(form-inputs): add case-payload button + new bm form variants   ← init_schema ADDED
4661a967 2026-06-17 10:57 +0700  feat: template rendering, seed-config, and web/api client updates   ← fix_vietnamese_column_defaults ADDED
4ed21629 2026-06-17 08:42 +0700  Initial commit: import QLLaw project                                ← five UNGUARDED additive migrations ADDED
```

## Per-migration provenance

| Migration | First commit | Date (UTC+7) | Mode | Init existed? | Classification |
|---|---|---|---|---|---|
| `20260615000000_init_schema` | `86e606cd` | 2026-06-19 01:46 | ADDED (813 lines) | n/a (this IS init) | **INIT_RETROACTIVELY_EXPANDED** |
| `20260616000000_add_officials_role` | `4ed21629` | 2026-06-17 08:42 | ADDED | **No** (init arrived 2 days later) | ADDITIVE_CREATED_BEFORE_CURRENT_INIT |
| `20260616005000_create_auth_sessions` | `4ed21629` | 2026-06-17 08:42 | ADDED | **No** (init arrived 2 days later) | ADDITIVE_CREATED_BEFORE_CURRENT_INIT |
| `20260616010000_add_official_credentials` | `4ed21629` | 2026-06-17 08:42 | ADDED | **No** (init arrived 2 days later) | ADDITIVE_CREATED_BEFORE_CURRENT_INIT |
| `20260616020000_add_template_owner_official` | `4ed21629` | 2026-06-17 08:42 | ADDED | **No** (init arrived 2 days later) | ADDITIVE_CREATED_BEFORE_CURRENT_INIT |
| `20260616_add_auth_sessions` | `4ed21629` | 2026-06-17 08:42 | ADDED | **No** (init arrived 2 days later) | ADDITIVE_CREATED_BEFORE_CURRENT_INIT |
| `20260617010000_add_soft_delete_to_case_offenses_and_evidence` | `4ed21629` | 2026-06-17 08:42 | ADDED | **No** (init arrived 41 h later) | ADDITIVE_CREATED_BEFORE_CURRENT_INIT |
| `20260617110000_fix_vietnamese_column_defaults` | `4661a967` | 2026-06-17 10:57 | ADDED | **No** (init arrived 41 h later) | ADDITIVE_CREATED_BEFORE_CURRENT_INIT |
| `20260620150000_add_form_contract_platform_v2` | `1cff7035` | 2026-06-20 17:56 | ADDED | Yes | ADDITIVE_AFTER_CURRENT_INIT |
| `20260620170000_enforce_form_contract_scope_uniqueness` | `1cff7035` | 2026-06-20 17:56 | ADDED | Yes | ADDITIVE_AFTER_CURRENT_INIT |
| `20260622000000_add_clerk_auth_identities` | `a4a40095` | 2026-07-02 04:31 | ADDED | Yes | ADDITIVE_AFTER_CURRENT_INIT |
| `20260702000000_add_auth_identity_audit_logs` | `725b7457` | 2026-07-02 05:18 | ADDED | Yes | ADDITIVE_AFTER_CURRENT_INIT |
| `20260702_generated_document_audit_logs` | `b7c8a7be` | 2026-07-02 19:50 | ADDED | Yes | ADDITIVE_AFTER_CURRENT_INIT |

## Conclusions

1. **Init_schema was retroactively expanded**: it is the LAST migration to enter git history, added in `86e606cd` (2026-06-19). Six earlier migrations already existed that declare columns and indexes init_schema then incorporated.
2. **There is no historical "original" init_schema to restore**: git history contains exactly one version of `init_schema/migration.sql`. Any remediation that claims to "restore the original init_schema" would have to fabricate it.
3. **The collision pattern is one-directional**: every UNGUARDED_DUPLICATE is "init_schema declares X; a later migration tries to ADD X". There are no reverse collisions (no later migration declares Y and a subsequent init_schema declares Y too).
4. **Six of the twelve later migrations were created against a schema that did not exist yet** (`4ed21629` initial commit predates `86e606cd` init_schema by 2 days for 5 of them; `4661a967` predates by 41 hours for 1 of them).
5. **Checksum implications**: the only checksum available for `init_schema` is its current one. Restoring a "historical" checksum would require either:
   - Forging an older init_schema file (forbidden by Stage 4A operating mode), or
   - Accepting the current checksum as the authoritative baseline.

## Protected areas

- All migration files — **untouched**.
- `apps/api/prisma/schema.prisma` — **untouched**.
- Persistent DB — **untouched**.

## Open question for user

Without an external source of truth (e.g. a release artifact or a previous CI build artifact), it is **impossible** to recover a "prior" init_schema from git alone. Any history-ambiguity classification is **HISTORY_AMBIGUOUS** with current evidence pointing strongly to "current init_schema is the only init_schema that ever existed in this codebase".