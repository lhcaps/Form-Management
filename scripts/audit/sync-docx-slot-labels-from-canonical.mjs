#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const LOCKED_DIR = join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const OUT_DIR = join(ROOT, "docs", "audit", "ready-absolute-blocker-burn-down-v3");
const WRITE = process.argv.includes("--write");
const BAD_LABELS = new Set(["\u00d4 tr\u1ed1ng", "Slot from Wave 02 DOCX remediation"]);

function isBadSlotLabel(label) {
  return BAD_LABELS.has(String(label || "").trim());
}

function isUsableCanonicalLabel(label) {
  const value = String(label || "").trim();
  return value.length > 0 && !BAD_LABELS.has(value);
}

function syncContract(file) {
  const filePath = join(LOCKED_DIR, file);
  const contract = JSON.parse(readFileSync(filePath, "utf8"));
  const canonicalByPath = new Map(
    (contract.canonicalFields || []).map((field) => [field.path, field]),
  );
  const changes = [];

  for (const slot of contract.docxSlots || []) {
    if (!isBadSlotLabel(slot.label)) continue;
    const canonical = canonicalByPath.get(slot.slotId);
    if (!canonical || !isUsableCanonicalLabel(canonical.label)) continue;

    const oldLabel = slot.label;
    slot.label = canonical.label;
    slot.reviewedBy = canonical.reviewedBy || slot.reviewedBy || "Codex slot-label sync";
    slot.reviewedAt = canonical.reviewedAt || slot.reviewedAt || new Date().toISOString();
    slot.reviewEvidence = {
      ...(slot.reviewEvidence || {}),
      slotLabelSync: {
        source: "canonicalFields[].label",
        oldLabel,
        newLabel: canonical.label,
        canonicalPath: canonical.path,
        canonicalReviewedBy: canonical.reviewedBy || null,
        canonicalReviewedAt: canonical.reviewedAt || null,
      },
    };

    changes.push({
      templateCode: contract.templateCode,
      sourceId: contract.sourceId,
      slotId: slot.slotId,
      oldLabel,
      newLabel: canonical.label,
      canonicalReviewedBy: canonical.reviewedBy || null,
      canonicalReviewedAt: canonical.reviewedAt || null,
    });
  }

  if (WRITE && changes.length > 0) {
    writeFileSync(filePath, `${JSON.stringify(contract, null, 2)}\n`, "utf8");
  }

  return changes;
}

function main() {
  const files = readdirSync(LOCKED_DIR)
    .filter((file) => file.endsWith(".contract.locked.json"))
    .sort();
  const changes = files.flatMap(syncContract);
  const byTemplate = {};
  for (const change of changes) {
    byTemplate[change.templateCode] = (byTemplate[change.templateCode] || 0) + 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode: WRITE ? "write" : "dry-run",
    sourcePolicy: "docxSlots.label follows canonicalFields[].label when the slot path matches and the canonical label is usable",
    changedSlots: changes.length,
    changedContracts: Object.keys(byTemplate).length,
    byTemplate,
    changes,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    join(OUT_DIR, "slot-label-sync.latest.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  const lines = [
    "# DOCX Slot Label Sync",
    "",
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    "",
    `Changed slots: ${report.changedSlots}`,
    `Changed contracts: ${report.changedContracts}`,
    "",
    "| BM | Slot | Old label | New label |",
    "|---|---|---|---|",
    ...changes.slice(0, 200).map((change) =>
      `| ${change.templateCode} | ${change.slotId} | ${String(change.oldLabel).replace(/\|/g, "\\|")} | ${String(change.newLabel).replace(/\|/g, "\\|")} |`,
    ),
  ];
  if (changes.length > 200) {
    lines.push("", `Truncated table at 200 rows; JSON contains all ${changes.length} changes.`);
  }
  writeFileSync(join(OUT_DIR, "slot-label-sync.latest.md"), `${lines.join("\n")}\n`, "utf8");

  console.log(`[slot-label-sync] mode=${report.mode}`);
  console.log(`[slot-label-sync] changedSlots=${report.changedSlots}`);
  console.log(`[slot-label-sync] changedContracts=${report.changedContracts}`);
}

main();
