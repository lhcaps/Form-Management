ALTER TABLE `form_contract_versions`
  ADD COLUMN `scope_key` VARCHAR(64) NOT NULL DEFAULT 'GLOBAL' AFTER `agency_id`;

UPDATE `form_contract_versions`
SET `scope_key` = CASE
  WHEN `agency_id` IS NULL THEN 'GLOBAL'
  ELSE CONCAT('AGENCY:', `agency_id`)
END;

ALTER TABLE `form_contract_versions`
  DROP INDEX `uq_form_contract_scope_version`,
  ADD UNIQUE INDEX `uq_form_contract_scope_version` (`template_id`, `scope_key`, `version_no`);

ALTER TABLE `official_permissions`
  ADD COLUMN `scope_key` VARCHAR(64) NOT NULL DEFAULT 'GLOBAL' AFTER `agency_id`;

UPDATE `official_permissions`
SET `scope_key` = CASE
  WHEN `agency_id` IS NULL THEN 'GLOBAL'
  ELSE CONCAT('AGENCY:', `agency_id`)
END;

ALTER TABLE `official_permissions`
  DROP INDEX `uq_official_permission_scope`,
  ADD UNIQUE INDEX `uq_official_permission_scope` (`official_id`, `scope_key`, `permission_code`);
