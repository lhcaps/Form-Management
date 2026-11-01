-- ============================================================
-- QUANLYVKS - Auth identity link audit log
-- Phase 2C: Clerk Identity Linking Admin Workflow
-- Purpose-built audit table for identity link/unlink operations.
-- ============================================================

CREATE TABLE IF NOT EXISTS `auth_identity_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_official_id` BIGINT UNSIGNED NOT NULL,
  `action` VARCHAR(64) NOT NULL COMMENT 'AUTH_IDENTITY_LINKED | AUTH_IDENTITY_UNLINKED',
  `identity_id` BIGINT UNSIGNED NOT NULL,
  `provider` VARCHAR(50) NOT NULL,
  `provider_user_id` VARCHAR(255) NOT NULL,
  `before_official_id` BIGINT UNSIGNED NULL,
  `after_official_id` BIGINT UNSIGNED NULL,
  `reason` VARCHAR(500) NULL,
  `metadata_json` JSON NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  INDEX `idx_auth_identity_audit_actor` (`actor_official_id`),
  INDEX `idx_auth_identity_audit_identity` (`identity_id`),
  INDEX `idx_auth_identity_audit_provider_user` (`provider_user_id`),
  INDEX `idx_auth_identity_audit_created_at` (`created_at`),
  CONSTRAINT `fk_auth_identity_audit_actor`
    FOREIGN KEY (`actor_official_id`) REFERENCES `officials` (`id`)
    ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT `fk_auth_identity_audit_identity`
    FOREIGN KEY (`identity_id`) REFERENCES `auth_identities` (`id`)
    ON DELETE RESTRICT ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
