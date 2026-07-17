# Dependency-aware migration replay

| Field | Value |
|---|---|
| Run ID | `phase8b-codex-a2-20260710200825` |
| MariaDB image | `mariadb:11` |
| Host ports | none |
| Persistent credentials or database | not used |
| Probe exit | 0 |
| Cleanup exits | container 0; network 0; volume 0 |
| Matching leftovers after cleanup | none |

## Hypothesis and criterion

The isolated Stage 4A failures could be either migration defects or expected prerequisite failures. A sequence is `VALID_WITH_PREREQUISITES` only when it starts from zero tables, every ordered migration exits 0, and the final information-schema state matches the intended current definitions.

## Contract-platform sequence

| Step | Result |
|---|---|
| Empty check | 0 tables |
| `20260615000000_init_schema` | exit 0 |
| `20260620150000_add_form_contract_platform_v2` | exit 0 |
| `20260620170000_enforce_form_contract_scope_uniqueness` | exit 0 |

Final columns:

| Table | Column | Type | Nullable | Default |
|---|---|---|---|---|
| `form_contract_versions` | `scope_key` | `varchar(64)` | no | `GLOBAL` |
| `official_permissions` | `scope_key` | `varchar(64)` | no | `GLOBAL` |

Final unique indexes:

| Table | Index | Unique | Columns |
|---|---|---:|---|
| `form_contract_versions` | `uq_form_contract_scope_version` | yes | `template_id,scope_key,version_no` |
| `official_permissions` | `uq_official_permission_scope` | yes | `official_id,scope_key,permission_code` |

Classification: **`VALID_WITH_PREREQUISITES`**. The earlier error 1146 from running the second migration without the first was an expected missing-table prerequisite failure, not a defect in the ordered chain.

## Identity sequence

| Step | Result |
|---|---|
| Empty check | 0 tables |
| `20260615000000_init_schema` | exit 0 |
| `20260622000000_add_clerk_auth_identities` | exit 0 |
| `20260702000000_add_auth_identity_audit_logs` | exit 0 |

Final tables: `auth_identities`, `auth_identity_audit_logs`.

Final foreign keys:

| Constraint | Table | References | Delete | Update |
|---|---|---|---|---|
| `fk_auth_identities_official` | `auth_identities` | `officials` | SET NULL | NO ACTION |
| `fk_auth_identity_audit_actor` | `auth_identity_audit_logs` | `officials` | RESTRICT | NO ACTION |
| `fk_auth_identity_audit_identity` | `auth_identity_audit_logs` | `auth_identities` | RESTRICT | NO ACTION |

Classification: **`VALID_WITH_PREREQUISITES`**. The earlier error 1005 from running the audit-log migration without `auth_identities` was an expected foreign-key prerequisite failure, not a defect in the ordered chain.

## Evidence

- Full raw log: `logs/phase8b-codex-a2-20260710200825.log` — SHA-256 `8c6019f4b121477b9234afb8f75714a7ad77a4ae3b6fbab6ed0c2d608decb760`.
- Result envelope: `logs/phase8b-codex-a2-20260710200825.json` — SHA-256 `a236e66b6e576e2d3edd39ad70a19f7eb70f916ec1c483b9ef5336085d1ca743`.

No active migration, Prisma schema, or persistent database was modified.
