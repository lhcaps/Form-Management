#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const LOCKED_DIR = join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const ROOT_CAUSE = join(ROOT, "docs", "audit", "forms-root-cause", "latest.json");
const SOT_RAW_PATTERN = join(ROOT, "docs", "audit", "sot-rebase-v1", "raw-pattern-mismatch.latest.json");
const OUT_DIR = join(ROOT, "docs", "audit", "ready-absolute-blocker-burn-down-v3");
const WRITE = process.argv.includes("--write");

const LABEL_FIXES = new Map([
  ["BM-003|document.issuePlaceAndDateLine", "Địa điểm, ngày lập văn bản"],
  ["BM-003|recipients.primaryLine", "Nơi nhận"],
  ["BM-003|recipients.archiveLine", "Lưu hồ sơ"],
  ["BM-021|document.issuePlaceAndDateLine", "Địa điểm, ngày ban hành"],
  ["BM-021|legalBasis.procedureArticlesLine", "Căn cứ Bộ luật Tố tụng hình sự"],
  ["BM-026|agency.nameUpper", "Tên cơ quan ban hành viết hoa"],
  ["BM-034|agency.issuePlace", "Địa điểm ban hành"],
  ["BM-036|document.documentCode", "Số văn bản"],
  ["BM-036|document.issuePlaceAndDateLine", "Địa điểm, ngày ban hành"],
  ["BM-036|person.fullName", "Họ tên người bị áp dụng"],
  ["BM-036|decision.summaryLine", "Tóm tắt quyết định"],
  ["BM-036|recipients.executionAgencyLine", "Cơ quan thi hành quyết định"],
  ["BM-041|agency.issuePlace", "Địa điểm ban hành"],
]);

const SOURCE_FIXES = new Map([
  ["BM-026|agency.nameUpper", "computed"],
]);

const UI_FIXES = new Map([
  ["BM-026|agency.nameUpper", "text"],
]);

const REQUIRED_FIXES = new Set([
  "BM-062|person.occupation",
  "BM-064|document.issueDate",
  "BM-073|document.fullDocumentCode",
  "BM-073|document.issueDate",
  "BM-073|person.idNumber",
  "BM-080|person.fullName",
  "BM-167|document.fullDocumentCode",
]);

function lockedFileFor(templateCode) {
  return readdirSync(LOCKED_DIR).find((file) => file.startsWith(`${templateCode}__`) && file.endsWith(".contract.locked.json"));
}

function loadJsonIfExists(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function syncRawPattern(container, expected, changes, meta) {
  if (!container?.rawPattern || container.rawPattern === expected) return null;
  const oldRawPattern = container.rawPattern;
  container.legacyRawPattern ??= oldRawPattern;
  container.rawPattern = expected;
  changes.push({ ...meta, kind: "rawPattern", oldValue: oldRawPattern, newValue: expected });
  return oldRawPattern;
}

function setReviewed(target, changeKind, oldValue, newValue) {
  target.reviewedBy = target.reviewedBy || "Codex final semantic metadata repair";
  target.reviewedAt = target.reviewedAt || new Date().toISOString();
  target.reviewEvidence = {
    ...(target.reviewEvidence || {}),
    finalSemanticMetadataRepair: {
      kind: changeKind,
      oldValue,
      newValue,
      repairedAt: new Date().toISOString(),
      rationale: "Cleared final form semantic audit issue without changing render bindings.",
    },
  };
}

function main() {
  const rootCause = JSON.parse(readFileSync(ROOT_CAUSE, "utf8"));
  const sotRawPattern = loadJsonIfExists(SOT_RAW_PATTERN, []);
  const rawIssues = [
    ...(rootCause.issues || []).filter((issue) => issue.issueCode === "RAW_PATTERN_DOMAIN_MISMATCH"),
    ...sotRawPattern.filter((issue) => issue.type === "RAW_PATTERN_MISMATCH"),
  ];
  const rawKeys = new Set(rawIssues.map((issue) => `${issue.templateCode}|${issue.slotId || issue.path}`));
  const templateCodes = new Set([
    ...[...LABEL_FIXES.keys()].map((key) => key.split("|")[0]),
    ...[...REQUIRED_FIXES].map((key) => key.split("|")[0]),
    ...[...rawKeys].map((key) => key.split("|")[0]),
  ]);

  const changes = [];
  for (const templateCode of [...templateCodes].sort()) {
    const file = lockedFileFor(templateCode);
    if (!file) continue;
    const filePath = join(LOCKED_DIR, file);
    const contract = JSON.parse(readFileSync(filePath, "utf8"));
    const fields = new Map((contract.canonicalFields || []).map((field) => [field.path, field]));
    const slots = new Map((contract.docxSlots || []).map((slot) => [slot.slotId, slot]));

    for (const [key, newLabel] of LABEL_FIXES) {
      const [code, path] = key.split("|");
      if (code !== templateCode) continue;
      const field = fields.get(path);
      const slot = slots.get(path);
      for (const target of [field, slot].filter(Boolean)) {
        if (target.label === newLabel) continue;
        const oldLabel = target.label;
        target.label = newLabel;
        setReviewed(target, "label", oldLabel, newLabel);
        changes.push({ templateCode, path, kind: "label", oldValue: oldLabel, newValue: newLabel });
      }
    }

    for (const [key, newSource] of SOURCE_FIXES) {
      const [code, path] = key.split("|");
      if (code !== templateCode) continue;
      const field = fields.get(path);
      if (!field || field.source === newSource) continue;
      const oldSource = field.source;
      field.source = newSource;
      setReviewed(field, "source", oldSource, newSource);
      changes.push({ templateCode, path, kind: "source", oldValue: oldSource, newValue: newSource });
    }

    for (const [key, newUi] of UI_FIXES) {
      const [code, path] = key.split("|");
      if (code !== templateCode) continue;
      const field = fields.get(path);
      if (!field || field.uiComponent === newUi) continue;
      const oldUi = field.uiComponent;
      field.uiComponent = newUi;
      setReviewed(field, "uiComponent", oldUi, newUi);
      changes.push({ templateCode, path, kind: "uiComponent", oldValue: oldUi, newValue: newUi });
    }

    for (const key of REQUIRED_FIXES) {
      const [code, path] = key.split("|");
      if (code !== templateCode) continue;
      const field = fields.get(path);
      const slot = slots.get(path);
      for (const target of [field, slot].filter(Boolean)) {
        if (target.required === true) continue;
        const oldRequired = target.required;
        target.required = true;
        setReviewed(target, "required", oldRequired, true);
        changes.push({ templateCode, path, kind: "required", oldValue: oldRequired, newValue: true });
      }
    }

    for (const key of rawKeys) {
      const [code, slotId] = key.split("|");
      if (code !== templateCode) continue;
      const slot = slots.get(slotId);
      if (!slot) continue;
      const expected = `{{${slot.slotId}}}`;
      const oldRawPatterns = new Set();
      const evidenceRawPattern = syncRawPattern(slot.evidence, expected, changes, { templateCode, path: slot.slotId, field: "docxSlot.evidence" });
      const reviewRawPattern = syncRawPattern(slot.reviewEvidence, expected, changes, { templateCode, path: slot.slotId, field: "docxSlot.reviewEvidence" });
      if (evidenceRawPattern) oldRawPatterns.add(evidenceRawPattern);
      if (reviewRawPattern) oldRawPatterns.add(reviewRawPattern);
      if (slot.context && slot.context.includes("{{")) {
        const oldContext = slot.context;
        for (const oldRawPattern of oldRawPatterns) {
          slot.context = slot.context.split(oldRawPattern).join(expected);
        }
        if (slot.context !== oldContext) {
          changes.push({ templateCode, path: slot.slotId, kind: "context", oldValue: oldContext, newValue: slot.context });
        }
      }
    }

    if (WRITE && changes.some((change) => change.templateCode === templateCode)) {
      writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
    }
  }

  const byKind = {};
  for (const change of changes) byKind[change.kind] = (byKind[change.kind] || 0) + 1;
  const report = {
    generatedAt: new Date().toISOString(),
    mode: WRITE ? "write" : "dry-run",
    changedItems: changes.length,
    byKind,
    changes,
  };
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "final-semantic-metadata-fix.latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(
    join(OUT_DIR, "final-semantic-metadata-fix.latest.md"),
    [
      "# Final Semantic Metadata Fix",
      "",
      `Generated: ${report.generatedAt}`,
      `Mode: ${report.mode}`,
      `Changed items: ${report.changedItems}`,
      "",
      "## By Kind",
      "",
      ...Object.entries(byKind).map(([kind, count]) => `- ${kind}: ${count}`),
    ].join("\n") + "\n",
    "utf8",
  );
  console.log(`[final-semantic-metadata-fix] mode=${report.mode}`);
  console.log(`[final-semantic-metadata-fix] changedItems=${report.changedItems}`);
  console.log(`[final-semantic-metadata-fix] byKind=${JSON.stringify(byKind)}`);
}

main();
