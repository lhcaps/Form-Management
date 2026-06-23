import { createHash } from "node:crypto";

import PizZip from "pizzip";

const REQUIRED_DOCX_PARTS = Object.freeze([
  "[Content_Types].xml",
  "_rels/.rels",
  "word/document.xml",
]);

const GENERATED_PATH_PATTERNS = Object.freeze([
  /(^|\.)field(?:\d+)?(?:_|$)/iu,
  /(^|\.)placeholder(?:_\d+)?$/iu,
]);

function issue(code, details = []) {
  return Object.freeze({
    code,
    details: Object.freeze([...details]),
  });
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function semanticSlotSignature(slot) {
  return JSON.stringify({
    slotType: slot.slotType ?? null,
    required: Boolean(slot.required),
    reviewRequired: Boolean(slot.reviewRequired),
  });
}

function semanticBindingSignature(binding) {
  return JSON.stringify({
    from: binding.from ?? null,
    transform: binding.transform ?? null,
    fallback: binding.fallback ?? null,
    reviewRequired: Boolean(binding.reviewRequired),
  });
}

function duplicateIssues(records, keyOf, signatureOf, exactCode, conflictCode) {
  const grouped = new Map();
  for (const record of records) {
    const key = keyOf(record);
    if (!key) continue;
    const current = grouped.get(key) ?? [];
    current.push(record);
    grouped.set(key, current);
  }

  const exact = [];
  const conflicts = [];
  for (const [key, group] of grouped) {
    if (group.length < 2) continue;
    const signatures = new Set(group.map(signatureOf));
    if (signatures.size === 1) exact.push(key);
    else conflicts.push(key);
  }

  return [
    ...(exact.length > 0 ? [issue(exactCode, exact.sort())] : []),
    ...(conflicts.length > 0
      ? [issue(conflictCode, conflicts.sort())]
      : []),
  ];
}

function inspectPackage(buffer) {
  let zip;
  try {
    zip = new PizZip(buffer);
  } catch (error) {
    return {
      issues: [
        issue("DOCX_PACKAGE_INVALID", [
          error instanceof Error ? error.message : String(error),
        ]),
      ],
      placeholders: [],
    };
  }

  const missing = REQUIRED_DOCX_PARTS.filter((partName) => !zip.file(partName));
  if (missing.length > 0) {
    return {
      issues: [issue("DOCX_REQUIRED_PART_MISSING", missing)],
      placeholders: [],
    };
  }

  const documentXml = zip.file("word/document.xml").asText();
  const placeholders = uniqueSorted(
    [...documentXml.matchAll(/\{\{([^{}]+)\}\}/gu)].map((match) =>
      match[1].trim(),
    ),
  );
  return { issues: [], placeholders };
}

function isApprovedHumanReview(contract) {
  return (
    contract.reviewKind === "human" &&
    typeof contract.reviewedBy === "string" &&
    contract.reviewedBy.trim().length > 0 &&
    contract.reviewedBy !== "system-batch-lock" &&
    /^\d{4}-\d{2}-\d{2}T/u.test(contract.reviewedAt ?? "")
  );
}

/**
 * Returns true when a field path is generated scaffolding rather than a
 * reviewed semantic name.
 */
export function isGenericContractPath(value) {
  if (typeof value !== "string" || value.trim().length === 0) return true;
  return GENERATED_PATH_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Returns true if CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER should be suppressed
 * for a given slotId in a given contract, per the active audit policies.
 *
 * The suppression logic:
 * - Remove-pending slots: never suppressed.
 * - Metadata-only slots: always suppressed (field has no DOCX placeholder by design).
 * - Alias-orphaned canonical slots: suppressed when the alias target is rendered.
 *   An orphaned canonical slot has no DOCX placeholder, but an active alias maps
 *   it to a different slot (the alias target) that IS rendered. Since the alias
 *   target renders the same data, the canonical slot's missing placeholder is fine.
 */
export function isSlotPolicySuppressed(policies, templateCode, slotId) {
  if (!policies) return false;

  const _isRemove = policies.isRemovePending;
  const _isMeta = policies.isMetadataOnlyField;
  const _getAlias = policies.getAliasForField;
  const _isAliasActive = policies.isAliasActive;
  const _isConflictPending = policies.isConflictPending;

  // Remove-pending slots are never suppressed.
  if (_isRemove && _isRemove(templateCode, slotId)) return false;

  // Alias-orphaned canonical slots: suppress only if alias is active.
  // Skip if conflict-pending (those emit remediation issues).
  if (_getAlias && _isConflictPending && _isAliasActive) {
    const alias = _getAlias(templateCode, slotId);
    if (alias) {
      if (_isConflictPending(alias)) return false; // conflict: emit remediation
      if (_isAliasActive(templateCode, slotId)) return true; // active: suppress
    }
  }

  // Metadata-only slots: always suppressed, unless they also have a conflict-pending alias.
  // A conflict-pending field should emit remediation, not be silently suppressed.
  if (_isMeta && _isMeta(templateCode, slotId)) {
    if (_isConflictPending && _getAlias) {
      const alias = _getAlias(templateCode, slotId);
      if (alias && _isConflictPending(alias)) return false; // conflict: emit remediation
    }
    return true; // normal metadata-only: suppress
  }

  return false;
}

/**
 * Returns informational note codes for suppressed slot/binding items.
 * Returns null if the item is not suppressed.
 *
 * @param {object|null} policies
 * @param {string} templateCode
 * @param {string} slotId - the slotId being checked
 * @param {string|null} [fieldPath] - optional canonical field path (same as slotId for non-alias)
 */
export function getSuppressionNote(policies, templateCode, slotId, fieldPath) {
  if (!policies) return null;

  const _isMeta = policies.isMetadataOnlyField;
  const _isRemove = policies.isRemovePending;
  const _isAliasActive = policies.isAliasActive;

  const effectiveField = fieldPath ?? slotId;

  // Metadata-only fields: suppressed.
  if (_isMeta && _isMeta(templateCode, effectiveField)) return "ACCEPTED_METADATA_ONLY_FIELD";

  // Remove-pending: not suppressed (kept as remediation).
  if (_isRemove && _isRemove(templateCode, effectiveField)) return null;

  // Alias-orphaned canonical: suppressed when alias is active.
  // slotId is the orphaned canonical field; isAliasActive checks that the alias
  // direction is "canonical_aliases_to_suffixed_slot" and neither side is remove-pending.
  if (_isAliasActive && _isAliasActive(templateCode, effectiveField)) {
    return "FIELD_SATISFIED_BY_ALIAS";
  }

  return null;
}

/**
 * Evaluates one V1 contract together with the normalized DOCX it references.
 *
 * @param {object} opts
 * @param {object} opts.contract
 * @param {Buffer} opts.normalizedDocxBuffer
 * @param {object|null} [opts.policies] - Optional result of loadAuditPolicies().
 *   When provided, alias and metadata-only policies suppress certain remediation
 *   issues and emit informational notes instead.
 */
export function evaluateFormArtifact({ contract, normalizedDocxBuffer, policies = null }) {
  const issues = [];
  const packageInspection = inspectPackage(normalizedDocxBuffer);
  issues.push(...packageInspection.issues);

  if (
    typeof contract.extractionSource?.sha256 !== "string" ||
    contract.extractionSource.sha256 !== sha256(normalizedDocxBuffer)
  ) {
    issues.push(issue("EXTRACTION_HASH_MISMATCH"));
  }

  const slots = contract.docxSlots ?? [];
  const fields = contract.canonicalFields ?? [];
  const bindings = contract.renderBindings ?? [];
  const slotIds = uniqueSorted(slots.map((slot) => slot.slotId));
  const bindingSlotIds = uniqueSorted(
    bindings.map((binding) => binding.slotId),
  );
  const templatePlaceholders = packageInspection.placeholders;

  if (packageInspection.issues.length === 0) {
    const templateSet = new Set(templatePlaceholders);
    const slotSet = new Set(slotIds);
    const bindingSet = new Set(bindingSlotIds);

    const templateWithoutSlot = templatePlaceholders.filter(
      (placeholder) => !slotSet.has(placeholder),
    );
    if (templateWithoutSlot.length > 0) {
      issues.push(
        issue("TEMPLATE_PLACEHOLDER_WITHOUT_SLOT", templateWithoutSlot),
      );
    }

    const slotWithoutTemplate = slotIds.filter(
      (slotId) => !templateSet.has(slotId),
    );
    if (slotWithoutTemplate.length > 0) {
      const suppressed = [];
      const remaining = [];
      for (const slotId of slotWithoutTemplate) {
        if (isSlotPolicySuppressed(policies, contract.templateCode, slotId)) {
          suppressed.push(slotId);
        } else {
          remaining.push(slotId);
        }
      }
      if (remaining.length > 0) {
        issues.push(
          issue("CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER", remaining),
        );
      }
      // suppressed slots: emit informational note instead of remediation issue
      for (const slotId of suppressed) {
        const note = getSuppressionNote(policies, contract.templateCode, slotId, slotId);
        issues.push(issue(note ?? "ACCEPTED_METADATA_ONLY_FIELD", [slotId]));
      }
    }

    const bindingWithoutTemplate = bindingSlotIds.filter(
      (slotId) => !templateSet.has(slotId),
    );
    if (bindingWithoutTemplate.length > 0) {
      const suppressed = [];
      const remaining = [];
      for (const slotId of bindingWithoutTemplate) {
        if (isSlotPolicySuppressed(policies, contract.templateCode, slotId)) {
          suppressed.push(slotId);
        } else {
          remaining.push(slotId);
        }
      }
      if (remaining.length > 0) {
        issues.push(
          issue("BINDING_WITHOUT_TEMPLATE_PLACEHOLDER", remaining),
        );
      }
      // suppressed bindings: emit informational note instead of remediation issue
      for (const slotId of suppressed) {
        const note = getSuppressionNote(policies, contract.templateCode, slotId, slotId);
        issues.push(issue(note ?? "ACCEPTED_METADATA_ONLY_FIELD", [slotId]));
      }
    }

    const slotWithoutBinding = slotIds.filter(
      (slotId) => !bindingSet.has(slotId),
    );
    if (slotWithoutBinding.length > 0) {
      issues.push(issue("CONTRACT_SLOT_WITHOUT_BINDING", slotWithoutBinding));
    }
  }

  if (slots.some((slot) => isGenericContractPath(slot.slotId))) {
    issues.push(
      issue(
        "GENERIC_SLOT_PATH",
        uniqueSorted(
          slots
            .map((slot) => slot.slotId)
            .filter((path) => isGenericContractPath(path)),
        ),
      ),
    );
  }
  if (fields.some((field) => isGenericContractPath(field.path))) {
    issues.push(
      issue(
        "GENERIC_CANONICAL_PATH",
        uniqueSorted(
          fields
            .map((field) => field.path)
            .filter((path) => isGenericContractPath(path)),
        ),
      ),
    );
  }
  if (
    bindings.some(
      (binding) =>
        isGenericContractPath(binding.slotId) ||
        isGenericContractPath(binding.from),
    )
  ) {
    issues.push(
      issue(
        "GENERIC_BINDING_PATH",
        uniqueSorted(
          bindings
            .flatMap((binding) => [binding.slotId, binding.from])
            .filter((path) => isGenericContractPath(path)),
        ),
      ),
    );
  }

  issues.push(
    ...duplicateIssues(
      slots,
      (slot) => slot.slotId,
      semanticSlotSignature,
      "EXACT_DUPLICATE_SLOT",
      "CONFLICTING_DUPLICATE_SLOT",
    ),
  );
  issues.push(
    ...duplicateIssues(
      bindings,
      (binding) => binding.slotId,
      semanticBindingSignature,
      "EXACT_DUPLICATE_BINDING",
      "CONFLICTING_DUPLICATE_BINDING",
    ),
  );

  const unresolvedReviewItems = [
    ...slots.filter((slot) => slot.reviewRequired === true).map((slot) => slot.slotId),
    ...fields
      .filter((field) => field.reviewRequired === true)
      .map((field) => field.path),
    ...bindings
      .filter((binding) => binding.reviewRequired === true)
      .map((binding) => binding.slotId),
  ];
  if (unresolvedReviewItems.length > 0) {
    issues.push(
      issue("REVIEW_REQUIRED_REMAINS", uniqueSorted(unresolvedReviewItems)),
    );
  }
  if ((contract.unresolvedQuestions ?? []).some((value) => value?.trim())) {
    issues.push(
      issue(
        "UNRESOLVED_QUESTIONS_REMAIN",
        contract.unresolvedQuestions.filter((value) => value?.trim()),
      ),
    );
  }
  if (
    fields.some(
      (field) => !field.source || field.source === "unknown",
    )
  ) {
    issues.push(
      issue(
        "UNKNOWN_FIELD_SOURCE",
        uniqueSorted(
          fields
            .filter((field) => !field.source || field.source === "unknown")
            .map((field) => field.path),
        ),
      ),
    );
  }

  if (!isApprovedHumanReview(contract)) {
    issues.push(issue("HUMAN_REVIEW_NOT_APPROVED"));
  }

  const issueCodes = new Set(issues.map((entry) => entry.code));
  let state = "VERIFIED";
  if (
    issueCodes.has("DOCX_PACKAGE_INVALID") ||
    issueCodes.has("DOCX_REQUIRED_PART_MISSING")
  ) {
    state = "PACKAGE_REPAIR_REQUIRED";
  } else if (
    issueCodes.has("GENERIC_SLOT_PATH") ||
    issueCodes.has("GENERIC_CANONICAL_PATH") ||
    issueCodes.has("GENERIC_BINDING_PATH")
  ) {
    state = "SEMANTIC_REMEDIATION_REQUIRED";
  } else if (
    [...issueCodes].some(
      (code) =>
        code !== "HUMAN_REVIEW_NOT_APPROVED",
    )
  ) {
    state = "CONTRACT_REPAIR_REQUIRED";
  } else if (issueCodes.has("HUMAN_REVIEW_NOT_APPROVED")) {
    state = "AUTOMATED_REVIEW_PENDING";
  }

  return Object.freeze({
    state,
    issues: Object.freeze(issues),
    actualSha256: sha256(normalizedDocxBuffer),
    templatePlaceholders: Object.freeze(templatePlaceholders),
    slotIds: Object.freeze(slotIds),
    bindingSlotIds: Object.freeze(bindingSlotIds),
  });
}
