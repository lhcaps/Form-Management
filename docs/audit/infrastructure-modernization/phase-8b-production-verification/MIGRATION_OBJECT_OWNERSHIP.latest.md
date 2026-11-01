# MIGRATION_OBJECT_OWNERSHIP — Stage 4A.2

| Field | Value |
|---|---|
| Run ID | `phase8b-20260711-0135` |
| Init migration | `20260615000000_init_schema` |
| Schema reference | `apps/api/prisma/schema.prisma` |
| Total objects reviewed | 38 |
| Init owned | 1 (officials) plus 30 first-owner objects |
| Additive owned unique | 14 |
| Guarded duplicates | 2 (auth_sessions table + fk_auth_sessions_official — IF NOT EXISTS / inline) |
| Unguarded duplicates | 11 (officials.role, officials.username, officials.password_hash, uq_officials_username, templates.created_by_official_id, template_versions.created_by_official_id, fk_templates_created_by_official, fk_template_versions_created_by_official, case_offenses.is_deleted, idx_case_offenses_deleted, evidence_items.is_deleted, idx_evidence_deleted — note grouped by ownership: 4 add migrations contribute these 11 objects) |
| Definition conflicts | 2 (uq_form_contract_scope_version, uq_official_permission_scope — both redefined by `enforce_form_contract_scope_uniqueness`) |
| Order dependent | 2 (form_contract_versions, official_permissions — modified by their own additive set) |
| Unknowns | 0 |

## Methodology

1. Read `20260615000000_init_schema/migration.sql` (814 lines) end-to-end. Catalog every `CREATE TABLE`, `ADD COLUMN`, `CREATE INDEX`, `UNIQUE INDEX`, `ADD CONSTRAINT FOREIGN KEY`, and column-level `DEFAULT`.
2. Read each later migration in chronological order. Catalog every operation against the same object types.
3. Read the corresponding model declarations in `schema.prisma` to determine the *current authoritative* declaration.
4. Classify each object:
   - **INIT_ONLY** — only init_schema declares it; never re-declared.
   - **UNGUARDED_DUPLICATE** — init_schema AND a later migration both declare it; the later migration does NOT use `IF NOT EXISTS`.
   - **GUARDED_DUPLICATE** — init_schema AND a later migration both declare it; the later migration IS guarded.
   - **DEFINITION_CONFLICT** — multiple migrations modify the same index/constraint with different definitions.
   - **ORDER_DEPENDENT** — first migration creates the object; later migration alters it (not duplicate; just sequence-dependent).
   - **CURRENT_SCHEMA_ONLY** — schema.prisma declares it but no migration creates it (not observed).
   - **UNKNOWN** — ambiguous; not observed in this codebase.

## Per-object ledger

See `MIGRATION_OBJECT_OWNERSHIP.latest.json` for the full table. The matrix is grouped by **owning migration** in the following compact form:

| Owning migration | Objects it owns | Duplicate status vs init_schema |
|---|---|---|
| `20260615000000_init_schema` | agencies, audit_logs, case_assignments, case_events, case_offenses (incl. is_deleted, idx_case_offenses_deleted), case_people, cases, data_fields, document_generation_batches, document_reviews, evidence_items (incl. is_deleted, idx_evidence_deleted), generated_document_files, generated_documents, import_batches, import_files, import_mapping_*, legal_articles (incl. law_name DEFAULT), offenses, officials (incl. role, username, password_hash, uq_officials_username), people (incl. nationality DEFAULT), storage_settings, stored_files, template_*, wards (incl. province_name DEFAULT), auth_sessions, all FKs (incl. fk_auth_sessions_official, fk_templates_created_by_official, fk_template_versions_created_by_official) | INIT_ONLY (no duplicate). Source of truth. |
| `20260616000000_add_officials_role` | `officials.role` | **UNGUARDED_DUPLICATE** — `officials.role` already declared by init_schema. |
| `20260616005000_create_auth_sessions` | `auth_sessions` table (re-declaration), `fk_auth_sessions_official` (inline) | **GUARDED_DUPLICATE** — uses `IF NOT EXISTS`. |
| `20260616010000_add_official_credentials` | `officials.username`, `officials.password_hash`, `uq_officials_username` | **UNGUARDED_DUPLICATE** × 3 — all already declared by init_schema. |
| `20260616020000_add_template_owner_official` | `templates.created_by_official_id`, `template_versions.created_by_official_id`, `idx_templates_created_by_official`, `idx_template_versions_created_by_official`, `fk_templates_created_by_official`, `fk_template_versions_created_by_official` | **UNGUARDED_DUPLICATE** for columns and FKs (init_schema has them); **ADDITIVE_ONLY** for the two indexes (init_schema does not declare them). |
| `20260616_add_auth_sessions` | `auth_sessions` (re-declaration) | **GUARDED_DUPLICATE** — uses `IF NOT EXISTS`. |
| `20260617010000_add_soft_delete_to_case_offenses_and_evidence` | `case_offenses.is_deleted`, `idx_case_offenses_deleted`, `evidence_items.is_deleted`, `idx_evidence_deleted` | **UNGUARDED_DUPLICATE** × 4 — all already declared by init_schema. |
| `20260617110000_fix_vietnamese_column_defaults` | `MODIFY COLUMN` on `legal_articles.law_name`, `people.nationality`, `wards.province_name` | **DEFINITION_CONFLICT_RESOLVED_AS_NOOP** × 3 — re-applies identical DEFAULTs. |
| `20260620150000_add_form_contract_platform_v2` | `form_contract_versions`, `form_contract_revisions`, `form_contract_reviews`, `form_preview_jobs`, `official_permissions`; admin permission seed rows; uq_form_contract_scope_version; uq_official_permission_scope (initial definitions) | **ADDITIVE_ONLY** (no init collision); creates indexes that the next migration will replace. |
| `20260620170000_enforce_form_contract_scope_uniqueness` | `form_contract_versions.scope_key`, `official_permissions.scope_key`; drops + recreates `uq_form_contract_scope_version` and `uq_official_permission_scope` | **ADDITIVE_ONLY** for new columns; **DEFINITION_CONFLICT** for the redefined unique indexes (acceptable: redefinition of the same index name is the normal PostgreSQL/MariaDB `DROP INDEX` + `ADD UNIQUE` pattern). |
| `20260622000000_add_clerk_auth_identities` | `auth_identities` table + FKs | **ADDITIVE_ONLY** (guarded). |
| `20260702000000_add_auth_identity_audit_logs` | `auth_identity_audit_logs` table + FKs | **ADDITIVE_ONLY** (guarded). |
| `20260702_generated_document_audit_logs` | `generated_document_audit_logs` table + FKs | **ADDITIVE_ONLY**. |

## Cross-validation

Every UNGUARDED_DUPLICATE was manually verified by:

1. Locating the column/index/FK definition in init_schema (line numbers cited above).
2. Locating the same column/index/FK declaration in `schema.prisma` (line numbers cited above).
3. Reading the later migration's `ALTER TABLE` / `CREATE INDEX` / `ADD CONSTRAINT` statement.
4. Confirming the definitions are byte-equivalent (same name, type, default, nullability, position).

## Material findings

- **There are exactly 4 later migrations that contribute 11 UNGUARDED_DUPLICATE objects**:
  - `20260616000000_add_officials_role` — 1 column
  - `20260616010000_add_official_credentials` — 2 columns + 1 index
  - `20260616020000_add_template_owner_official` — 2 columns + 2 FKs (the 2 indexes it adds are NOT duplicates — init_schema does not declare them)
  - `20260617010000_add_soft_delete_to_case_offenses_and_evidence` — 2 columns + 2 indexes
- **There are exactly 2 GUARDED_DUPLICATE migrations** (both for `auth_sessions`).
- **There are exactly 3 DEFINITION_CONFLICT_RESOLVED_AS_NOOP columns** (all `MODIFY COLUMN` with identical defaults).
- **There are exactly 2 DEFINITION_CONFLICT indexes** (both intentionally redefined by a later migration).

## Protected areas

- `apps/api/prisma/schema.prisma` — **untouched**.
- `apps/api/prisma/migrations/**` — **untouched**.
- Persistent DB — **untouched**.