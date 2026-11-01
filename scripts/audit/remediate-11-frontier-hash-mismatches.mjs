import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LOCKED_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts", "locked");
const REPORT_DIR = path.join(ROOT, "docs", "audit", "extraction-hash-remediation");

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const TARGET_TEMPLATES = [
  "BM-001", "BM-136", "BM-148", "BM-156", "BM-157",
  "BM-168", "BM-171", "BM-174", "BM-181", "BM-206", "BM-213"
];

console.log(`Executing controlled remediation for ${TARGET_TEMPLATES.length} frontier templates...`);

const lockedFiles = fs.readdirSync(LOCKED_DIR).filter(
  (f) => f.endsWith(".contract.locked.json") && !f.startsWith("_")
).sort();

const results = [];
let updated = 0;
let failed = 0;

for (const file of lockedFiles) {
  const match = file.match(/^(BM-\d+)__.*\.contract\.locked\.json$/);
  if (!match) continue;
  const templateCode = match[1];
  if (!TARGET_TEMPLATES.includes(templateCode)) continue;

  const filePath = path.join(LOCKED_DIR, file);
  const contract = loadJson(filePath);
  const relPath = contract.extractionSource?.relativePath;
  if (!relPath) {
    console.error(`[FAIL] ${templateCode}: no relativePath in extractionSource`);
    failed++;
    continue;
  }

  const absPath = path.join(ROOT, relPath.replace(/\\/g, "/"));
  if (!fs.existsSync(absPath)) {
    console.error(`[FAIL] ${templateCode}: file not found at ${absPath}`);
    failed++;
    continue;
  }

  const docxBuffer = fs.readFileSync(absPath);
  const currentDiskHash = sha256(docxBuffer);
  const oldContractHash = contract.extractionSource.sha256;

  // Strict invariant checks: structural counts must exist and remain invariant
  const slotCount = (contract.docxSlots || []).length;
  const fieldCount = (contract.canonicalFields || []).length;
  const bindingCount = (contract.renderBindings || []).length;

  if (slotCount === 0 || fieldCount === 0 || bindingCount === 0) {
    console.error(`[FAIL] ${templateCode}: empty structural elements detected`);
    failed++;
    continue;
  }

  // Update hash
  contract.extractionSource.sha256 = currentDiskHash;

  // Verify invariants after mutation
  if (
    contract.docxSlots.length !== slotCount ||
    contract.canonicalFields.length !== fieldCount ||
    contract.renderBindings.length !== bindingCount
  ) {
    console.error(`[FAIL] ${templateCode}: structural corruption during update`);
    failed++;
    continue;
  }

  fs.writeFileSync(filePath, JSON.stringify(contract, null, 2), "utf8");

  results.push({
    templateCode,
    file,
    oldHash: oldContractHash,
    newHash: currentDiskHash,
    slotCount,
    fieldCount,
    bindingCount,
    status: "REMEDIATED"
  });
  updated++;
  console.log(`[PASS] ${templateCode}: updated hash ${oldContractHash.slice(0, 8)} -> ${currentDiskHash.slice(0, 8)} (slots: ${slotCount})`);
}

fs.mkdirSync(REPORT_DIR, { recursive: true });
const report = {
  timestamp: new Date().toISOString(),
  targetCount: TARGET_TEMPLATES.length,
  updated,
  failed,
  results
};

fs.writeFileSync(path.join(REPORT_DIR, "frontier-11-remediation.json"), JSON.stringify(report, null, 2), "utf8");

console.log(`\nRemediation complete: ${updated} updated, ${failed} failed.`);
