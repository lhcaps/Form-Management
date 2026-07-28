-- ============================================================
-- QUANLYVKS - Clerk identity projection table
-- Phase 2B: Auth Identity Projection
-- Maps external identity providers (Clerk) to internal officials.
-- ============================================================

CREATE TABLE IF NOT EXISTS `auth_identities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `provider` VARCHAR(50) NOT NULL,
  `provider_user_id` VARCHAR(255) NOT NULL,
  `official_id` BIGINT UNSIGNED NULL,
  `email` VARCHAR(255) NULL,
  `username` VARCHAR(100) NULL,
  `full_name` VARCHAR(255) NULL,
  `last_synced_at` DATETIME(0) NULL,
  `raw_profile_json` JSON NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_auth_identities_provider_user` (`provider`, `provider_user_id`),
  INDEX `idx_auth_identities_official` (`official_id`),
  INDEX `idx_auth_identities_email` (`email`),
  CONSTRAINT `fk_auth_identities_official`
    FOREIGN KEY (`official_id`) REFERENCES `officials` (`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
