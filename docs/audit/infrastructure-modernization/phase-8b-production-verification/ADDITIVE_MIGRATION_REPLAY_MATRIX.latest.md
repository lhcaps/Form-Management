# ADDITIVE_MIGRATION_REPLAY_MATRIX — Stage 4A.3

- Run ID: `phase8b-20260711-0135`
- MariaDB image: `mariadb:11`
- Init migration: `20260615000000_init_schema`
- Init applied: PASS

## Totals

- Tested: **12**
- VALID_AFTER_INIT: **6**
- LATENT_DUPLICATE_FAILURE: **4**
- GUARDED_NO_OP: **0**
- DEFINITION_CONFLICT: **0**
- INVALID_INIT_BASE: **0**
- UNKNOWN: **0**

## Matrix

| # | Migration | Init exit | Target exit | Code | Message | Guarded | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | `20260616000000_add_officials_role` | 0 | 1 | 1060 | -------------- \| ALTER TABLE officials \|   ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL' | no | **LATENT_DUPLICATE_FAILURE** |
| 2 | `20260616005000_create_auth_sessions` | 0 | 0 | — |  | no | **VALID_AFTER_INIT** |
| 3 | `20260616010000_add_official_credentials` | 0 | 1 | 1060 | -------------- \| ALTER TABLE officials \|   ADD COLUMN username VARCHAR(100) NULL AFTER full_name, | no | **LATENT_DUPLICATE_FAILURE** |
| 4 | `20260616020000_add_template_owner_official` | 0 | 1 | 1060 | -------------- \| ALTER TABLE templates \|   ADD COLUMN created_by_official_id BIGINT UNSIGNED NULL AFTER is_active | no | **LATENT_DUPLICATE_FAILURE** |
| 5 | `20260616_add_auth_sessions` | 0 | 0 | — |  | no | **VALID_AFTER_INIT** |
| 6 | `20260617010000_add_soft_delete_to_case_offenses_and_evidence` | 0 | 1 | 1060 | -------------- \| ALTER TABLE case_offenses \|   ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE, | no | **LATENT_DUPLICATE_FAILURE** |
| 7 | `20260617110000_fix_vietnamese_column_defaults` | 0 | 0 | — |  | no | **VALID_AFTER_INIT** |
| 8 | `20260620150000_add_form_contract_platform_v2` | 0 | 0 | — |  | no | **VALID_AFTER_INIT** |
| 9 | `20260620170000_enforce_form_contract_scope_uniqueness` | 0 | 1 | 1146 | -------------- \| ALTER TABLE `form_contract_versions` \|   ADD COLUMN `scope_key` VARCHAR(64) NOT NULL DEFAULT 'GLOBAL' | no | **INVALID_ORDERING** |
| 10 | `20260622000000_add_clerk_auth_identities` | 0 | 0 | — |  | no | **VALID_AFTER_INIT** |
| 11 | `20260702000000_add_auth_identity_audit_logs` | 0 | 1 | 1005 | -------------- \| CREATE TABLE IF NOT EXISTS `auth_identity_audit_logs` ( \|   `id` BIGINT UNSIGNED NOT NULL AUTO_INCREM | yes | **INVALID_ORDERING** |
| 12 | `20260702_generated_document_audit_logs` | 0 | 0 | — |  | no | **VALID_AFTER_INIT** |

## Logs

- 20260616000000_add_officials_role: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig1.log`
- 20260616005000_create_auth_sessions: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig2.log`
- 20260616010000_add_official_credentials: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig3.log`
- 20260616020000_add_template_owner_official: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig4.log`
- 20260616_add_auth_sessions: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig5.log`
- 20260617010000_add_soft_delete_to_case_offenses_and_evidence: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig6.log`
- 20260617110000_fix_vietnamese_column_defaults: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig7.log`
- 20260620150000_add_form_contract_platform_v2: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig8.log`
- 20260620170000_enforce_form_contract_scope_uniqueness: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig9.log`
- 20260622000000_add_clerk_auth_identities: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig10.log`
- 20260702000000_add_auth_identity_audit_logs: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig11.log`
- 20260702_generated_document_audit_logs: `d:\Study\Project\QLLaw-main\docs\audit\infrastructure-modernization\phase-8b-production-verification\logs\stage4a-replay\mig12.log`