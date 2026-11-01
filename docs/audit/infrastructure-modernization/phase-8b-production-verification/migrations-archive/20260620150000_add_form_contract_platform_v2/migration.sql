CREATE TABLE `form_contract_versions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `template_id` BIGINT UNSIGNED NOT NULL,
  `agency_id` BIGINT UNSIGNED NULL,
  `version_no` INTEGER NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  `revision` INTEGER NOT NULL DEFAULT 0,
  `base_contract_hash` VARCHAR(64) NULL,
  `contract_hash` VARCHAR(64) NULL,
  `template_hash` VARCHAR(128) NOT NULL,
  `normalized_docx_path` TEXT NULL,
  `draft_json` JSON NOT NULL,
  `compiled_json` JSON NULL,
  `created_by_official_id` BIGINT UNSIGNED NOT NULL,
  `approved_by_official_id` BIGINT UNSIGNED NULL,
  `published_by_official_id` BIGINT UNSIGNED NULL,
  `submitted_at` DATETIME(0) NULL,
  `approved_at` DATETIME(0) NULL,
  `published_at` DATETIME(0) NULL,
  `archived_at` DATETIME(0) NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  UNIQUE INDEX `uq_form_contract_scope_version`(`template_id`, `agency_id`, `version_no`),
  INDEX `idx_form_contract_agency_status`(`agency_id`, `status`),
  INDEX `idx_form_contract_hash`(`contract_hash`),
  INDEX `idx_form_contract_creator`(`created_by_official_id`),
  INDEX `idx_form_contract_published`(`status`, `published_at`),
  INDEX `idx_form_contract_template_status`(`template_id`, `status`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_form_contract_versions_template` FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_form_contract_versions_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_form_contract_versions_creator` FOREIGN KEY (`created_by_official_id`) REFERENCES `officials`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION,
  CONSTRAINT `fk_form_contract_versions_approver` FOREIGN KEY (`approved_by_official_id`) REFERENCES `officials`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `fk_form_contract_versions_publisher` FOREIGN KEY (`published_by_official_id`) REFERENCES `officials`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `form_contract_revisions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `contract_version_id` BIGINT UNSIGNED NOT NULL,
  `revision_no` INTEGER NOT NULL,
  `operation_type` VARCHAR(50) NOT NULL,
  `operations_json` JSON NOT NULL,
  `snapshot_json` JSON NOT NULL,
  `actor_official_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  UNIQUE INDEX `uq_form_contract_revision`(`contract_version_id`, `revision_no`),
  INDEX `idx_form_contract_revision_actor`(`actor_official_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_form_contract_revisions_version` FOREIGN KEY (`contract_version_id`) REFERENCES `form_contract_versions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_form_contract_revisions_actor` FOREIGN KEY (`actor_official_id`) REFERENCES `officials`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `form_contract_reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `contract_version_id` BIGINT UNSIGNED NOT NULL,
  `revision_no` INTEGER NOT NULL,
  `action` VARCHAR(30) NOT NULL,
  `comment` TEXT NULL,
  `actor_official_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  INDEX `idx_form_contract_review_actor`(`actor_official_id`),
  INDEX `idx_form_contract_review_version`(`contract_version_id`, `created_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_form_contract_reviews_version` FOREIGN KEY (`contract_version_id`) REFERENCES `form_contract_versions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_form_contract_reviews_actor` FOREIGN KEY (`actor_official_id`) REFERENCES `officials`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `form_preview_jobs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `contract_version_id` BIGINT UNSIGNED NOT NULL,
  `requested_by_official_id` BIGINT UNSIGNED NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  `sample_data_json` JSON NULL,
  `artifact_path` TEXT NULL,
  `error_code` VARCHAR(100) NULL,
  `error_json` JSON NULL,
  `started_at` DATETIME(0) NULL,
  `finished_at` DATETIME(0) NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  INDEX `idx_form_preview_version`(`contract_version_id`, `created_at`),
  INDEX `idx_form_preview_status`(`status`, `created_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_form_preview_jobs_version` FOREIGN KEY (`contract_version_id`) REFERENCES `form_contract_versions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_form_preview_jobs_requester` FOREIGN KEY (`requested_by_official_id`) REFERENCES `officials`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `official_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `official_id` BIGINT UNSIGNED NOT NULL,
  `agency_id` BIGINT UNSIGNED NULL,
  `permission_code` VARCHAR(100) NOT NULL,
  `granted_by_official_id` BIGINT UNSIGNED NULL,
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  UNIQUE INDEX `uq_official_permission_scope`(`official_id`, `agency_id`, `permission_code`),
  INDEX `idx_official_permission_agency`(`agency_id`, `permission_code`),
  INDEX `idx_official_permission_grantor`(`granted_by_official_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_official_permissions_official` FOREIGN KEY (`official_id`) REFERENCES `officials`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  CONSTRAINT `fk_official_permissions_grantor` FOREIGN KEY (`granted_by_official_id`) REFERENCES `officials`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION,
  CONSTRAINT `fk_official_permissions_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `official_permissions`
  (`official_id`, `agency_id`, `permission_code`, `granted_by_official_id`)
SELECT `id`, `agency_id`, permission_code, `id`
FROM `officials`
CROSS JOIN (
  SELECT 'FORM_TEMPLATE_EDIT' AS permission_code
  UNION ALL SELECT 'FORM_TEMPLATE_APPROVE'
  UNION ALL SELECT 'FORM_TEMPLATE_PERMISSION_ADMIN'
) permissions
WHERE `role` = 'ADMIN';
