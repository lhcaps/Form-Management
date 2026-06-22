#!/usr/bin/env node
// Applies explicitly reviewed semantic mappings to draft DOCX contracts.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  evaluateFormArtifact,
  isGenericContractPath,
} from "./lib/form-corpus-quality.mjs";

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const LOCKED_DIR = path.join(CONTRACTS_DIR, "locked");
const THIS_FILE = fileURLToPath(import.meta.url);

const loadJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, "utf8"));

function getMappingPath() {
  const index = process.argv.findIndex((argument) => argument === "--mapping");
  if (index === -1 || index >= process.argv.length - 1) {
    throw new Error(
      "Usage: node lock-reviewed-contracts.mjs --mapping <path-to-mapping.json>",
    );
  }
  return process.argv[index + 1];
}

export function validateMapping(mapping) {
  const errors = [];

  if (!mapping.reviewedBy) errors.push("mapping.reviewedBy is required");
  if (!mapping.reviewedAt) errors.push("mapping.reviewedAt is required");
  if (!["human", "automated"].includes(mapping.reviewKind)) {
    errors.push('mapping.reviewKind must be "human" or "automated"');
  }
  if (!mapping.targets || typeof mapping.targets !== "object") {
    errors.push("mapping.targets must be an object");
    return errors;
  }

  for (const [templateCode, target] of Object.entries(mapping.targets)) {
    if (!target.decision) {
      errors.push(`[${templateCode}] decision is required`);
    }
    if (
      target.decision === "locked" &&
      mapping.reviewKind === "automated"
    ) {
      errors.push(
        `[${templateCode}] automated review cannot produce decision="locked"`,
      );
    }
    if (target.decision !== "locked") continue;

    if (!target.sourceId) {
      errors.push(
        `[${templateCode}] sourceId is required for locked decision`,
      );
    }
    if (!target.slotMappings || typeof target.slotMappings !== "object") {
      errors.push(
        `[${templateCode}] slotMappings must be an object for locked decision`,
      );
      continue;
    }
    for (const [slotId, mappingEntry] of Object.entries(
      target.slotMappings,
    )) {
      if (!mappingEntry.canonicalPath) {
        errors.push(
          `[${templateCode}][${slotId}] canonicalPath is required`,
        );
      }
      if (!mappingEntry.source) {
        errors.push(`[${templateCode}][${slotId}] source is required`);
      }
      if (!mappingEntry.reviewEvidence) {
        errors.push(
          `[${templateCode}][${slotId}] reviewEvidence is required`,
        );
      }
    }
  }

  return errors;
}

function findDraftContract(sourceId) {
  return fs
    .readdirSync(CONTRACTS_DIR)
    .filter(
      (fileName) =>
        fileName.endsWith(".contract.draft.json") &&
        !fileName.startsWith("_"),
    )
    .find((fileName) => fileName.includes(sourceId));
}

export function checkLockBlockingIssues(contract) {
  const issues = [];

  const genericSlots = (contract.docxSlots ?? []).filter((slot) =>
    isGenericContractPath(slot.slotId),
  );
  if (genericSlots.length > 0) {
    issues.push(
      `${genericSlots.length} generic slotId(s): ${genericSlots
        .map((slot) => slot.slotId)
        .join(", ")}`,
    );
  }

  const genericFields = (contract.canonicalFields ?? []).filter((field) =>
    isGenericContractPath(field.path),
  );
  if (genericFields.length > 0) {
    issues.push(
      `${genericFields.length} generic canonicalField path(s): ${genericFields
        .map((field) => field.path)
        .join(", ")}`,
    );
  }

  const unknownSources = (contract.canonicalFields ?? []).filter(
    (field) => !field.source || field.source === "unknown",
  );
  if (unknownSources.length > 0) {
    issues.push(
      `${unknownSources.length} canonicalField(s) with source=unknown`,
    );
  }

  const reviewRequired = [
    ...(contract.canonicalFields ?? []).filter(
      (field) => field.reviewRequired === true,
    ),
    ...(contract.docxSlots ?? []).filter(
      (slot) => slot.reviewRequired === true,
    ),
    ...(contract.renderBindings ?? []).filter(
      (binding) => binding.reviewRequired === true,
    ),
  ];
  if (reviewRequired.length > 0) {
    issues.push(`${reviewRequired.length} item(s) with reviewRequired=true`);
  }

  const unresolved = (contract.unresolvedQuestions ?? []).filter((value) =>
    value?.trim(),
  );
  if (unresolved.length > 0) {
    issues.push(`${unresolved.length} unresolved question(s)`);
  }

  return issues;
}

export function collapseExactDuplicates(
  records,
  { key, semanticValue, label },
) {
  const byKey = new Map();
  for (const record of records) {
    const recordKey = key(record);
    const existing = byKey.get(recordKey);
    if (!existing) {
      byKey.set(recordKey, record);
      continue;
    }
    if (
      JSON.stringify(semanticValue(existing)) !==
      JSON.stringify(semanticValue(record))
    ) {
      throw new Error(`Conflicting duplicate ${label} "${recordKey}".`);
    }
  }
  return [...byKey.values()];
}

function mappingEntryFor(target, pathValue) {
  return (
    target.slotMappings?.[pathValue] ??
    target.slotMappings?.[pathValue.replace(/_(\d+)$/u, "")] ??
    Object.values(target.slotMappings ?? {}).find(
      (entry) => entry.canonicalPath === pathValue,
    )
  );
}

export function applyLock(contract, target, mapping, sourceId) {
  const locked = structuredClone(contract);

  locked.status = "locked";
  locked.sourceId = sourceId;
  locked.reviewedBy = mapping.reviewedBy;
  locked.reviewedAt = mapping.reviewedAt;
  locked.reviewKind = mapping.reviewKind;

  locked.docxSlots = (locked.docxSlots ?? []).map((slot) => {
    const entry = mappingEntryFor(target, slot.slotId);
    if (!entry) return slot;

    slot.slotId = entry.canonicalPath;
    slot.reviewRequired = false;
    slot.reviewEvidence = {
      ...(slot.evidence ?? {}),
      ...entry.reviewEvidence,
    };
    return slot;
  });
  locked.docxSlots = collapseExactDuplicates(locked.docxSlots, {
    key: (slot) => slot.slotId,
    semanticValue: (slot) => ({
      slotType: slot.slotType ?? null,
      required: Boolean(slot.required),
      reviewRequired: Boolean(slot.reviewRequired),
    }),
    label: "DOCX slot",
  });

  for (const field of locked.canonicalFields ?? []) {
    const entry = mappingEntryFor(target, field.path);
    if (!entry) continue;

    field.path = entry.canonicalPath;
    field.source = entry.source;
    field.transform = entry.transform;
    field.reviewRequired = false;
    field.reviewedBy = mapping.reviewedBy;
    field.reviewedAt = mapping.reviewedAt;
    field.reviewEvidence = entry.reviewEvidence ?? null;
  }
  locked.canonicalFields = collapseExactDuplicates(
    locked.canonicalFields ?? [],
    {
      key: (field) => field.path,
      semanticValue: (field) => ({
        type: field.type ?? null,
        source: field.source ?? null,
        required: Boolean(field.required),
        uiComponent: field.uiComponent ?? null,
        reviewRequired: Boolean(field.reviewRequired),
      }),
      label: "canonical field",
    },
  );

  for (const binding of locked.renderBindings ?? []) {
    const entry = mappingEntryFor(target, binding.slotId);
    if (!entry) continue;

    binding.slotId = entry.canonicalPath;
    binding.from = entry.canonicalPath;
    binding.transform = entry.transform ?? binding.transform;
    binding.reviewRequired = false;
  }
  locked.renderBindings = collapseExactDuplicates(
    locked.renderBindings ?? [],
    {
      key: (binding) => binding.slotId,
      semanticValue: (binding) => ({
        from: binding.from ?? null,
        transform: binding.transform ?? null,
        fallback: binding.fallback ?? null,
        reviewRequired: Boolean(binding.reviewRequired),
      }),
      label: "render binding",
    },
  );

  locked.warnings = [];

  if (locked.productMetadata) {
    locked.productMetadata.stage = {
      ...locked.productMetadata.stage,
      reviewRequired: false,
    };
    locked.productMetadata.reviewRequired = false;
  }
  if (locked.renderFormatHints) {
    locked.renderFormatHints.reviewRequired = false;
  }
  if (locked.formInputHints) {
    locked.formInputHints.reviewRequired = false;
  }
  if (locked.reportingHints) {
    locked.reportingHints.reviewRequired = false;
  }

  return locked;
}

function normalizedPathFor(contract) {
  return contract.extractionSource?.relativePath
    ? path.join(ROOT, contract.extractionSource.relativePath)
    : null;
}

const main = () => {
  const mappingPath = getMappingPath();
  if (!fs.existsSync(mappingPath)) {
    console.error(`Mapping file not found: ${mappingPath}`);
    process.exitCode = 1;
    return;
  }

  const mapping = loadJson(mappingPath);
  const mappingErrors = validateMapping(mapping);
  if (mappingErrors.length > 0) {
    console.error("Mapping validation errors:");
    for (const error of mappingErrors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(LOCKED_DIR, { recursive: true });

  const results = [];
  for (const [templateCode, target] of Object.entries(mapping.targets)) {
    if (target.decision !== "locked") {
      console.log(
        `[${templateCode}] decision = "${target.decision}" - skipping`,
      );
      results.push({
        templateCode,
        decision: target.decision,
        status: "skipped",
      });
      continue;
    }

    const sourceId = target.sourceId ?? templateCode;
    const draftFile = findDraftContract(sourceId);
    if (!draftFile) {
      console.error(
        `[${templateCode}] Draft contract not found for sourceId: ${sourceId}`,
      );
      results.push({
        templateCode,
        sourceId,
        status: "error",
        error: "Draft not found",
      });
      continue;
    }

    const draftPath = path.join(CONTRACTS_DIR, draftFile);
    const contract = loadJson(draftPath);
    let locked;
    try {
      locked = applyLock(contract, target, mapping, sourceId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${templateCode}] ${message}`);
      results.push({
        templateCode,
        sourceId,
        status: "blocked",
        issues: [message],
      });
      continue;
    }

    const blockingIssues = checkLockBlockingIssues(locked);
    if (blockingIssues.length > 0) {
      console.error(`[${templateCode}] Blocking issues - CANNOT LOCK:`);
      for (const issue of blockingIssues) console.error(`  - ${issue}`);
      results.push({
        templateCode,
        sourceId,
        status: "blocked",
        issues: blockingIssues,
      });
      continue;
    }

    const normalizedPath = normalizedPathFor(locked);
    if (!normalizedPath || !fs.existsSync(normalizedPath)) {
      const message = `Normalized DOCX not found: ${normalizedPath ?? "(missing path)"}`;
      console.error(`[${templateCode}] ${message}`);
      results.push({
        templateCode,
        sourceId,
        status: "blocked",
        issues: [message],
      });
      continue;
    }

    const quality = evaluateFormArtifact({
      contract: locked,
      normalizedDocxBuffer: fs.readFileSync(normalizedPath),
    });
    if (quality.state !== "VERIFIED") {
      const qualityIssues = quality.issues.map((entry) => entry.code);
      console.error(
        `[${templateCode}] Quality gate blocked lock: ${qualityIssues.join(", ")}`,
      );
      results.push({
        templateCode,
        sourceId,
        status: "blocked",
        issues: qualityIssues,
      });
      continue;
    }

    const lockedFileName = draftFile.replace(
      ".contract.draft.json",
      ".contract.locked.json",
    );
    const lockedPath = path.join(LOCKED_DIR, lockedFileName);
    fs.writeFileSync(
      lockedPath,
      `${JSON.stringify(locked, null, 2)}\n`,
      "utf8",
    );
    console.log(`[${templateCode}] Locked: ${lockedPath}`);
    results.push({
      templateCode,
      sourceId,
      file: lockedFileName,
      status: "locked",
      slots: locked.docxSlots?.length,
      fields: locked.canonicalFields?.length,
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    mappingFile: mappingPath,
    reviewedBy: mapping.reviewedBy,
    reviewedAt: mapping.reviewedAt,
    reviewKind: mapping.reviewKind,
    results,
    totalLocked: results.filter((result) => result.status === "locked").length,
    totalSkipped: results.filter((result) => result.status === "skipped")
      .length,
    totalBlocked: results.filter((result) => result.status === "blocked")
      .length,
    totalError: results.filter((result) => result.status === "error").length,
  };

  console.log("\nSummary:");
  console.log(`  Locked:  ${summary.totalLocked}`);
  console.log(`  Skipped: ${summary.totalSkipped}`);
  console.log(`  Blocked: ${summary.totalBlocked}`);
  console.log(`  Error:   ${summary.totalError}`);

  if (summary.totalBlocked > 0 || summary.totalError > 0) {
    process.exitCode = 1;
  }
};

if (path.resolve(process.argv[1] ?? "") === path.resolve(THIS_FILE)) {
  main();
}
