#!/usr/bin/env node
/**
 * Phase D — List all generic-path issues in locked contracts.
 *
 * Reads docs/audit/docx/contracts/locked/*.contract.locked.json
 * and reports per-form:
 *   - templateCode, title, stage
 *   - generic slot paths (docxSlots)
 *   - generic canonical paths (canonicalFields)
 *   - generic render binding paths (renderBindings)
 *   - suggested priority: easy / medium / hard
 *   - surrounding DOCX evidence (blockId, textBefore)
 *
 * Outputs:
 *   - docs/audit/docx/reports/generic-locked-contracts.json
 *   - docs/audit/docx/reports/GENERIC-LOCKED-CONTRACTS.md
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.cwd();
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const REPORTS_DIR = path.join(ROOT, "docs", "audit", "docx", "reports");

const FORM_STAGES = [
  { code: "01", label: "Tiếp nhận và giải quyết nguồn tin", bmRange: [1, 30] },
  { code: "02", label: "Biện pháp ngăn chặn, cưỡng chế", bmRange: [31, 69] },
  { code: "03", label: "Người tham gia tố tụng", bmRange: [70, 84] },
  { code: "04", label: "Giai đoạn điều tra", bmRange: [85, 140] },
  { code: "05", label: "Giai đoạn truy tố", bmRange: [141, 168] },
  { code: "06", label: "Vật chứng", bmRange: [169, 173] },
  { code: "07", label: "Biện pháp điều tra đặc biệt", bmRange: [174, 178] },
  { code: "08", label: "Thủ tục đặc biệt", bmRange: [179, 184] },
  { code: "09", label: "Người chưa thành niên", bmRange: [185, 213] },
];

function getStage(bmCode) {
  const match = (bmCode ?? "").match(/^BM-(\d+)/);
  if (!match) return "00";
  const n = parseInt(match[1], 10);
  return FORM_STAGES.find((s) => n >= s.bmRange[0] && n <= s.bmRange[1])?.code ?? "00";
}

function getStageLabel(code) {
  return FORM_STAGES.find((s) => s.code === code)?.label ?? "Không xác định";
}

const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;

function isGeneric(value) {
  if (typeof value !== "string" || value.trim().length === 0) return true;
  return GENERIC_RE.test(value);
}

function suggestPriority(genericCount, totalSlots) {
  if (genericCount === 0) return "none";
  if (genericCount === 1 && totalSlots <= 3) return "easy";
  if (genericCount <= 2 && totalSlots <= 5) return "easy";
  if (genericCount <= 2) return "medium";
  return "hard";
}

function main() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const files = fs.readdirSync(LOCKED_DIR)
    .filter((f) => f.endsWith(".contract.locked.json") && !f.startsWith("_"))
    .sort();

  const results = [];

  for (const file of files) {
    const contract = JSON.parse(
      fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"),
    );

    const slots = contract.docxSlots ?? [];
    const fields = contract.canonicalFields ?? [];
    const bindings = contract.renderBindings ?? [];

    const genericSlots = slots
      .filter((s) => isGeneric(s.slotId))
      .map((s) => ({
        slotId: s.slotId,
        blockId: s.location?.blockId ?? null,
        context: s.context ?? null,
        textBefore: s.evidence?.textBefore ?? null,
      }));

    const genericFields = fields
      .filter((f) => isGeneric(f.path))
      .map((f) => ({
        path: f.path,
        label: f.label ?? null,
        source: f.source ?? null,
      }));

    const genericBindings = bindings
      .filter((b) => isGeneric(b.slotId) || isGeneric(b.from))
      .map((b) => ({
        slotId: b.slotId,
        from: b.from ?? null,
        blockId: b.location?.blockId ?? null,
      }));

    const totalGeneric = genericSlots.length + genericFields.length + genericBindings.length;

    if (totalGeneric === 0) continue;

    const stage = getStage(contract.templateCode);

    results.push({
      file,
      templateCode: contract.templateCode,
      title: contract.templateTitle ?? "(unknown)",
      stage,
      stageLabel: getStageLabel(stage),
      totalSlots: slots.length,
      genericSlotCount: genericSlots.length,
      genericFieldCount: genericFields.length,
      genericBindingCount: genericBindings.length,
      totalGeneric,
      priority: suggestPriority(genericSlots.length, slots.length),
      genericSlots,
      genericFields,
      genericBindings,
      // Suggest which generic patterns appear
      genericPatterns: [...new Set([
        ...genericSlots.map((s) => s.slotId.match(/^([^.]+\.)/)?.[1] ?? "unknown"),
        ...genericFields.map((f) => f.path.match(/^([^.]+\.)/)?.[1] ?? "unknown"),
      ])].sort(),
    });
  }

  // Sort by priority then generic count
  const priorityOrder = { easy: 0, medium: 1, hard: 2, none: 3 };
  results.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return a.totalGeneric - b.totalGeneric;
  });

  // Summary counts
  const easy = results.filter((r) => r.priority === "easy");
  const medium = results.filter((r) => r.priority === "medium");
  const hard = results.filter((r) => r.priority === "hard");
  const totalGenericCount = results.reduce((s, r) => s + r.totalGeneric, 0);

  const json = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFormsWithGeneric: results.length,
      totalGenericIssues: totalGenericCount,
      easyBatchCount: easy.length,
      mediumBatchCount: medium.length,
      hardBatchCount: hard.length,
    },
    batches: {
      easy: easy.map((r) => ({
        templateCode: r.templateCode,
        title: r.title,
        stage: r.stage,
        genericCount: r.totalGeneric,
        genericPatterns: r.genericPatterns,
      })),
      medium: medium.map((r) => ({
        templateCode: r.templateCode,
        title: r.title,
        stage: r.stage,
        genericCount: r.totalGeneric,
        genericPatterns: r.genericPatterns,
      })),
      hard: hard.map((r) => ({
        templateCode: r.templateCode,
        title: r.title,
        stage: r.stage,
        genericCount: r.totalGeneric,
        genericPatterns: r.genericPatterns,
      })),
    },
    details: results,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, "generic-locked-contracts.json"),
    JSON.stringify(json, null, 2),
    "utf8",
  );

  // Generate markdown report
  const md = [];
  md.push("# Generic Locked Contracts Report");
  md.push("");
  md.push(`Sinh lúc: ${new Date().toISOString()}`);
  md.push(`Locked directory: ${LOCKED_DIR}`);
  md.push("");
  md.push("## Summary");
  md.push("");
  md.push(`- **Forms with generic paths: ${results.length}**`);
  md.push(`- **Total generic issues: ${totalGenericCount}**`);
  md.push(`- Easy batch: ${easy.length} form(s)`);
  md.push(`- Medium batch: ${medium.length} form(s)`);
  md.push(`- Hard batch: ${hard.length} form(s)`);
  md.push("");

  if (easy.length > 0) {
    md.push("## Easy Batch (1 generic slot, ≤3 total slots)");
    md.push("");
    md.push("| Template | Title | Stage | Patterns | Generic Slots |");
    md.push("|----------|-------|-------|----------|---------------|");
    for (const r of easy) {
      md.push(`| ${r.templateCode} | ${r.title} | ${r.stage} | ${r.genericPatterns.join(", ")} | ${r.genericSlots.map((s) => s.slotId).join(", ") || "-"} |`);
    }
    md.push("");
  }

  if (medium.length > 0) {
    md.push("## Medium Batch (≤2 generic slots, ≤5 total slots)");
    md.push("");
    md.push("| Template | Title | Stage | Patterns | Generic Slots |");
    md.push("|----------|-------|-------|----------|---------------|");
    for (const r of medium) {
      md.push(`| ${r.templateCode} | ${r.title} | ${r.stage} | ${r.genericPatterns.join(", ")} | ${r.genericSlots.map((s) => s.slotId).join(", ") || "-"} |`);
    }
    md.push("");
  }

  if (hard.length > 0) {
    md.push("## Hard Batch (>2 generic slots or >5 total slots)");
    md.push("");
    md.push("| Template | Title | Stage | Total Slots | Generic | Patterns | Generic Paths |");
    md.push("|----------|-------|-------|------------:|--------:|----------|---------------|");
    for (const r of hard) {
      const allGenericPaths = [
        ...r.genericSlots.map((s) => s.slotId),
        ...r.genericFields.map((f) => f.path),
        ...r.genericBindings.map((b) => `${b.slotId}→${b.from}`),
      ];
      md.push(`| ${r.templateCode} | ${r.title} | ${r.stage} | ${r.totalSlots} | ${r.totalGeneric} | ${r.genericPatterns.join(", ")} | ${allGenericPaths.join(", ") || "-"} |`);
    }
    md.push("");
  }

  md.push("## All Generic Details");
  md.push("");
  md.push("### Easy batch detail");
  md.push("");
  for (const r of easy) {
    md.push(`### ${r.templateCode} — ${r.title}`);
    md.push("");
    md.push(`Stage: ${r.stage} (${r.stageLabel})`);
    md.push(`Total slots: ${r.totalSlots}, Generic: ${r.totalGeneric}`);
    md.push("");
    if (r.genericSlots.length > 0) {
      md.push("**Generic docxSlots:**");
      for (const s of r.genericSlots) {
        md.push(`- \`${s.slotId}\` (blockId: ${s.blockId ?? "?"}, before: "${s.textBefore ?? ""}")`);
      }
      md.push("");
    }
    if (r.genericFields.length > 0) {
      md.push("**Generic canonicalFields:**");
      for (const f of r.genericFields) {
        md.push(`- \`${f.path}\` (label: "${f.label ?? ""}", source: ${f.source ?? "unknown"})`);
      }
      md.push("");
    }
    if (r.genericBindings.length > 0) {
      md.push("**Generic renderBindings:**");
      for (const b of r.genericBindings) {
        md.push(`- slotId: \`${b.slotId}\`, from: \`${b.from ?? ""}\``);
      }
      md.push("");
    }
  }

  md.push("### Medium batch detail");
  md.push("");
  for (const r of medium) {
    md.push(`### ${r.templateCode} — ${r.title}`);
    md.push("");
    md.push(`Stage: ${r.stage} (${r.stageLabel})`);
    md.push(`Total slots: ${r.totalSlots}, Generic: ${r.totalGeneric}`);
    md.push("");
    if (r.genericSlots.length > 0) {
      md.push("**Generic docxSlots:**");
      for (const s of r.genericSlots) {
        md.push(`- \`${s.slotId}\` (blockId: ${s.blockId ?? "?"}, before: "${s.textBefore ?? ""}")`);
      }
      md.push("");
    }
    if (r.genericFields.length > 0) {
      md.push("**Generic canonicalFields:**");
      for (const f of r.genericFields) {
        md.push(`- \`${f.path}\` (label: "${f.label ?? ""}", source: ${f.source ?? "unknown"})`);
      }
      md.push("");
    }
  }

  fs.writeFileSync(
    path.join(REPORTS_DIR, "GENERIC-LOCKED-CONTRACTS.md"),
    md.join("\n"),
    "utf8",
  );

  console.log(`\nGeneric locked contracts report:`);
  console.log(`  Total forms with generic paths: ${results.length}`);
  console.log(`  Total generic issues: ${totalGenericCount}`);
  console.log(`  Easy: ${easy.length}, Medium: ${medium.length}, Hard: ${hard.length}`);
  console.log(`\nReports:`);
  console.log(`  ${path.join(REPORTS_DIR, "generic-locked-contracts.json")}`);
  console.log(`  ${path.join(REPORTS_DIR, "GENERIC-LOCKED-CONTRACTS.md")}`);
}

main();
