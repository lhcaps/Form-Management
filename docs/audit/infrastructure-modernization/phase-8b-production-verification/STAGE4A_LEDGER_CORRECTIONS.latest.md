# Stage 4A ledger corrections

This is an additive correction to `MIGRATION_OBJECT_OWNERSHIP.latest.{md,json}` and `STAGE4A_FINAL.latest.md`. It does not rewrite those earlier artifacts.

## Recalculation boundary

The authoritative recalculation unit is each live `objects[]` row in `MIGRATION_OBJECT_OWNERSHIP.latest.json`, keyed by `type:name`. The 34 keys are unique. They include 33 schema-object/default keys and one data/bootstrap key (`official_permissions (admin rows)`).

The earlier top-level `summary`, `classification_counts`, and markdown totals are inconsistent with their own `objects[]` rows. The current rows and current migration SQL produce the counts below.

## Corrected arithmetic

| Metric | Correct value |
|---|---:|
| Ledger entries | 34 |
| Unique `type:name` keys | 34 |
| Duplicate ledger keys | 0 |
| Non-empty classifications | 7 |
| `INIT_ONLY` | 1 |
| `UNGUARDED_DUPLICATE` | 12 |
| `GUARDED_DUPLICATE` | 2 |
| `ADDITIVE_ONLY` | 12 |
| `ORDER_DEPENDENT` | 2 |
| `DEFINITION_CONFLICT` | 2 |
| `DEFINITION_CONFLICT_RESOLVED_AS_NOOP` | 3 |
| `CURRENT_SCHEMA_ONLY` | 0 |
| `UNKNOWN` | 0 |

Type counts are: 10 tables, 9 columns, 7 indexes, 4 foreign keys, 3 defaults, and 1 seed/data behavior.

The classifications do not overlap: every unique key has exactly one classification. Related objects can belong to different classifications—for example, an order-dependent table and the intentionally redefined unique index on that table—but no individual key is double-counted.

## Exact unguarded duplicates

| Later migration | Duplicate objects |
|---|---|
| `20260616000000_add_officials_role` | `officials.role` |
| `20260616010000_add_official_credentials` | `officials.username`; `officials.password_hash`; `uq_officials_username` |
| `20260616020000_add_template_owner_official` | `templates.created_by_official_id`; `template_versions.created_by_official_id`; `fk_templates_created_by_official`; `fk_template_versions_created_by_official` |
| `20260617010000_add_soft_delete_to_case_offenses_and_evidence` | `case_offenses.is_deleted`; `idx_case_offenses_deleted`; `evidence_items.is_deleted`; `idx_evidence_deleted` |

Canonical total: **12 unguarded duplicate objects across four migrations**.

The prior value `11` is contradicted by both the twelve names printed in the earlier markdown and the twelve live JSON rows.

## Exact guarded duplicates

The two unique guarded duplicate objects are:

- table `auth_sessions`;
- foreign key `fk_auth_sessions_official`.

Each object is re-declared by both `20260616005000_create_auth_sessions` and `20260616_add_auth_sessions`, so there are four later declaration instances but only two unique object keys. Both migrations guard the table creation with `CREATE TABLE IF NOT EXISTS`.

## Intentional index redefinitions

The two `DEFINITION_CONFLICT` keys are expected ordered replacements, not standalone defects:

- `uq_form_contract_scope_version` changes from `(template_id, agency_id, version_no)` to `(template_id, scope_key, version_no)`;
- `uq_official_permission_scope` changes from `(official_id, agency_id, permission_code)` to `(official_id, scope_key, permission_code)`.

Both require `20260620150000_add_form_contract_platform_v2` before `20260620170000_enforce_form_contract_scope_uniqueness`.

## Additive-only entries

The twelve additive-only ledger keys are:

1. `idx_templates_created_by_official`;
2. `idx_template_versions_created_by_official`;
3. table `form_contract_revisions`;
4. table `form_contract_reviews`;
5. table `form_preview_jobs`;
6. data behavior `official_permissions (admin rows)`;
7. `form_contract_versions.scope_key`;
8. `official_permissions.scope_key`;
9. table `auth_identities`;
10. foreign key `fk_auth_identities_official`;
11. table `auth_identity_audit_logs`;
12. table `generated_document_audit_logs`.

## Verdict

`STAGE4A_ARITHMETIC_CORRECTED`.

No migration, Prisma schema, persistent database, or prior Stage 4A report was modified.
