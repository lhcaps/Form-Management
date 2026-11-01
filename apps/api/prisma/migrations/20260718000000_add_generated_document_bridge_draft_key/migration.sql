ALTER TABLE `generated_documents`
  ADD COLUMN `bridge_draft_key` VARCHAR(64) NULL,
  ADD UNIQUE INDEX `uq_generated_documents_bridge_draft_key` (`bridge_draft_key`);
