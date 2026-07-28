-- Migration: add_generated_document_audit_logs
-- Purpose: Purpose-built audit trail for generated document lifecycle events

-- Create generated_document_audit_logs table
CREATE TABLE `generated_document_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Action classification
  `action` VARCHAR(64) NOT NULL,
  `result` VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',

  -- Actor info
  `actor_official_id` BIGINT UNSIGNED NULL,
  `actor_role` VARCHAR(50) NULL,
  `actor_name` VARCHAR(255) NULL,

  -- Resource ownership context
  `agency_id` BIGINT UNSIGNED NULL,
  `case_id` BIGINT UNSIGNED NULL,

  -- Generated document / file reference
  `generated_document_id` BIGINT UNSIGNED NULL,
  `generated_document_file_id` BIGINT UNSIGNED NULL,

  -- Template context
  `template_code` VARCHAR(64) NULL,
  `template_title` VARCHAR(255) NULL,
  `contract_version_id` BIGINT UNSIGNED NULL,

  -- File metadata snapshot (captured at audit time, not file contents)
  `file_name` VARCHAR(255) NULL,
  `file_mime_type` VARCHAR(128) NULL,
  `file_size_bytes` BIGINT UNSIGNED NULL,
  `file_kind` VARCHAR(32) NULL,

  -- Request metadata (sanitized - no tokens/cookies)
  `request_method` VARCHAR(16) NULL,
  `request_path` VARCHAR(500) NULL,
  `ip_address` VARCHAR(64) NULL,
  `user_agent` VARCHAR(500) NULL,

  -- Human-readable reason / summary
  `reason` VARCHAR(255) NULL,

  -- Arbitrary structured metadata (sanitized before storage)
  `metadata_json` JSON NULL,

  -- Timestamp
  `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_gen_doc_audit_action` (`action`),
  INDEX `idx_gen_doc_audit_result` (`result`),
  INDEX `idx_gen_doc_audit_actor` (`actor_official_id`),
  INDEX `idx_gen_doc_audit_agency` (`agency_id`),
  INDEX `idx_gen_doc_audit_case` (`case_id`),
  INDEX `idx_gen_doc_audit_document` (`generated_document_id`),
  INDEX `idx_gen_doc_audit_file` (`generated_document_file_id`),
  INDEX `idx_gen_doc_audit_template` (`template_code`),
  INDEX `idx_gen_doc_audit_created` (`created_at`)
) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign keys with SetNull to preserve audit history if business records are deleted
ALTER TABLE `generated_document_audit_logs`
  ADD CONSTRAINT `fk_gen_doc_audit_actor`
    FOREIGN KEY (`actor_official_id`) REFERENCES `officials`(`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `generated_document_audit_logs`
  ADD CONSTRAINT `fk_gen_doc_audit_agency`
    FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `generated_document_audit_logs`
  ADD CONSTRAINT `fk_gen_doc_audit_case`
    FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `generated_document_audit_logs`
  ADD CONSTRAINT `fk_gen_doc_audit_document`
    FOREIGN KEY (`generated_document_id`) REFERENCES `generated_documents`(`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE `generated_document_audit_logs`
  ADD CONSTRAINT `fk_gen_doc_audit_file`
    FOREIGN KEY (`generated_document_file_id`) REFERENCES `generated_document_files`(`id`)
    ON DELETE SET NULL ON UPDATE NO ACTION;
