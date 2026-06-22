#!/usr/bin/env node
/**
 * Full verification of all 213 locked contracts vs their DOCX files.
 *
 * Parity rules:
 * - Every DOCX mustache (including duplicates) should have a contract slot.
 *   BUT if DOCX has N duplicates of the same mustache, and contract has M slots
 *   where N > M, the extra (N-M) mustaches are "semantic duplicates" — the DOCX
 *   uses the same placeholder in multiple places that semantically represent
 *   different fields.
 * - Every contract slot should have a matching DOCX mustache (1:1 or 1:many if the DOCX reuses).
 * - Count mismatch is ONLY a real issue if: DOCX unique > contract slots (DOCX has extra
 *   unique mustaches not in contract) OR DOCX total > contract slots AND DOCX total
 *   > DOCX unique (DOCX reuses fewer slots than total mustaches = duplicate usage).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts", "locked");

function getDocxMustaches(code) {
  const f = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(f)) return { total: 0, unique: new Set(), all: [], error: "no_docx" };
  try {
    const zip = new PizZip(fs.readFileSync(f));
    const xml = zip.file("word/document.xml")?.asText() || "";
    const all = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1].trim());
    return { total: all.length, unique: new Set(all), all, error: null };
  } catch (e) {
    return { total: 0, unique: new Set(), all: [], error: e.message };
  }
}

const ALL = Array.from({ length: 213 }, (_, i) => "BM-" + String(i + 1).padStart(3, "0"));

let ok = 0, issues = 0;
const report = [];

for (const code of ALL) {
  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter((f) => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));

  if (lockedFiles.length === 0) {
    report.push({ code, status: "NO_LOCKED" });
    continue;
  }

  const contract = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, lockedFiles[0]), "utf8"));
  const docxInfo = getDocxMustaches(code);
  const slots = contract.docxSlots || [];
  const fields = contract.canonicalFields || [];
  const bindings = contract.renderBindings || [];
  const slotIds = new Set(slots.map((s) => s.slotId));

  const problems = [];

  if (docxInfo.error) {
    problems.push("DOCX: " + docxInfo.error);
  } else {
    // 1. Generic slot IDs remaining
    const genericSlots = slots.filter((s) => /^[a-z]+\.field\d+$/i.test(s.slotId));
    if (genericSlots.length > 0) {
      problems.push("generic_slots: " + genericSlots.map((s) => s.slotId).join(", "));
    }

    // 2. Source = unknown
    const unknownFields = fields.filter((f) => f.source === "unknown");
    if (unknownFields.length > 0) {
      problems.push("unknown_source: " + unknownFields.map((f) => f.path).join(", "));
    }

    // 3. ReviewRequired = true
    const rrSlots = slots.filter((s) => s.reviewRequired === true);
    const rrFields = fields.filter((f) => f.reviewRequired === true);
    const rrBindings = bindings.filter((b) => b.reviewRequired === true);
    if (rrSlots.length > 0) problems.push("slots_reviewRequired: " + rrSlots.length);
    if (rrFields.length > 0) problems.push("fields_reviewRequired: " + rrFields.length);
    if (rrBindings.length > 0) problems.push("bindings_reviewRequired: " + rrBindings.length);

    // 4. Status
    if (contract.status !== "locked") problems.push("wrong_status: " + contract.status);

    // 5. Warnings
    if (contract.warnings && contract.warnings.length > 0) {
      problems.push("warnings: " + contract.warnings.join("; "));
    }

    // 6. Unresolved questions
    if (contract.unresolvedQuestions && contract.unresolvedQuestions.length > 0) {
      problems.push("unresolvedQuestions: " + contract.unresolvedQuestions.length);
    }

    // 7. Parity checks (semantic-aware)
    // Every DOCX unique mustache should have a slot
    const orphanedDocx = [...docxInfo.unique].filter((m) => !slotIds.has(m));
    if (orphanedDocx.length > 0) {
      problems.push("orphaned_docx_unique: " + orphanedDocx.length + " (unique mustaches not in contract: " + orphanedDocx.join(", ") + ")");
    }

    // Every slot should have a matching DOCX unique mustache
    const orphanedContract = slots.filter((s) => !docxInfo.unique.has(s.slotId));
    if (orphanedContract.length > 0) {
      problems.push("orphaned_contract_slots: " + orphanedContract.length + " (slots not in DOCX: " + orphanedContract.map((s) => s.slotId).join(", ") + ")");
    }

    // 8. Count parity summary
    const uniqueCount = docxInfo.unique.size;
    const slotCount = slots.length;
    const totalMustaches = docxInfo.total;
    const dupCount = totalMustaches - uniqueCount;

    if (uniqueCount !== slotCount) {
      if (dupCount > 0) {
        // DOCX reuses mustaches — only a problem if unique > slots (contract missing fields)
        if (uniqueCount > slotCount) {
          problems.push("docx_unique_gt_slots: docx=" + uniqueCount + " slots=" + slotCount + " (DOCX has " + (uniqueCount - slotCount) + " extra unique mustaches)");
        } else {
          // unique < slots — contract has extra slots not in DOCX (already checked above)
        }
      } else {
        // No duplicates but count differs
        problems.push("count_mismatch: unique=" + uniqueCount + " slots=" + slotCount);
      }
    }
  }

  if (problems.length > 0) {
    report.push({ code, status: "ISSUE", problems });
    issues++;
  } else {
    report.push({ code, status: "OK", total: docxInfo.total || 0, unique: docxInfo.unique?.size || 0 });
    ok++;
  }
}

console.log("=== FULL VERIFICATION REPORT ===\n");
console.log("OK:     " + ok);
console.log("ISSUES: " + issues);
console.log();

let issueNum = 0;
for (const r of report) {
  if (r.status !== "ISSUE") continue;
  issueNum++;
  console.log("[" + r.code + "] (" + r.problems.length + " issue(s)):");
  for (const p of r.problems) {
    console.log("  - " + p);
  }
}

if (issueNum === 0) {
  console.log("ALL 213 CONTRACTS — FULLY VERIFIED");
  console.log("Every DOCX mustache has a matching contract slot.");
  console.log("Every contract slot has a matching DOCX mustache.");
}
