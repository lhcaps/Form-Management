#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import {
  applyLock,
  checkLockBlockingIssues,
} from "./lock-reviewed-contracts.mjs";
import { evaluateFormArtifact } from "./lib/form-corpus-quality.mjs";

const ROOT = process.cwd();
const CONTRACTS_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");
const LOCKED_DIR = path.join(CONTRACTS_DIR, "locked");

function selectedCodes(args) {
  const index = args.indexOf("--codes");
  if (index === -1 || !args[index + 1]) {
    throw new Error(
      "Usage: node scripts/docx-contract/write-automated-review-candidates.mjs --codes BM-058,BM-213",
    );
  }
  return [...new Set(args[index + 1].split(",").map((value) => value.trim()))]
    .filter(Boolean)
    .sort();
}

function inferSource(fieldPath) {
  const [namespace, fieldName = ""] = fieldPath.split(".");
  if (namespace === "agency") return "agencyConfig";
  if (namespace === "official" || namespace === "signature") {
    return "officialConfig";
  }
  if (namespace === "person") return "casePayload";
  if (fieldName === "issuePlaceAndDateLine") return "manualOrDefault";
  return "manual";
}

function inferTransform(fieldPath) {
  return fieldPath === "document.issuePlaceAndDateLine"
    ? "date.issuePlaceDateLine"
    : "identity";
}

function findDraft(code) {
  const matches = fs
    .readdirSync(CONTRACTS_DIR)
    .filter(
      (fileName) =>
        fileName.startsWith(`${code}__`) &&
        fileName.endsWith(".contract.draft.json"),
    );
  if (matches.length !== 1) {
    throw new Error(
      `${code} expected exactly one draft contract, found ${matches.length}.`,
    );
  }
  return matches[0];
}

function reviewEvidence(slot) {
  return {
    context: slot.context ?? "",
    blockId: slot.location?.blockId ?? "",
    ...(slot.location?.tableCellId
      ? { tableCellId: slot.location.tableCellId }
      : {}),
    note: "Automated semantic parity candidate; human legal review remains required.",
  };
}

function buildCandidate(draft) {
  const slotMappings = Object.fromEntries(
    (draft.docxSlots ?? []).map((slot) => [
      slot.slotId,
      {
        canonicalPath: slot.slotId,
        source: inferSource(slot.slotId),
        transform: inferTransform(slot.slotId),
        reviewEvidence: reviewEvidence(slot),
      },
    ]),
  );
  const reviewedAt = new Date().toISOString();
  const mapping = {
    reviewedBy: "automated-semantic-remediation",
    reviewedAt,
    reviewKind: "automated",
  };
  const target = { slotMappings };
  const candidate = applyLock(
    draft,
    target,
    mapping,
    draft.sourceId,
  );
  candidate.status = "review-pending";
  return candidate;
}

fs.mkdirSync(LOCKED_DIR, { recursive: true });

for (const code of selectedCodes(process.argv.slice(2))) {
  const draftFile = findDraft(code);
  const draft = JSON.parse(
    fs.readFileSync(path.join(CONTRACTS_DIR, draftFile), "utf8"),
  );
  const candidate = buildCandidate(draft);
  const blockingIssues = checkLockBlockingIssues(candidate);
  if (blockingIssues.length > 0) {
    throw new Error(`${code} candidate blocked: ${blockingIssues.join(", ")}`);
  }

  const normalizedPath = path.join(
    ROOT,
    candidate.extractionSource.relativePath,
  );
  const quality = evaluateFormArtifact({
    contract: candidate,
    normalizedDocxBuffer: fs.readFileSync(normalizedPath),
  });
  if (quality.state !== "AUTOMATED_REVIEW_PENDING") {
    throw new Error(
      `${code} expected AUTOMATED_REVIEW_PENDING, received ${quality.state}: ${quality.issues
        .map((entry) => entry.code)
        .join(", ")}`,
    );
  }

  const outputName = draftFile.replace(
    ".contract.draft.json",
    ".contract.locked.json",
  );
  fs.writeFileSync(
    path.join(LOCKED_DIR, outputName),
    `${JSON.stringify(candidate, null, 2)}\n`,
    "utf8",
  );
  console.log(
    `${code}: semantic candidate written (${candidate.canonicalFields.length} fields, human review pending)`,
  );
}
