/**
 * Smoke test: verifies all 213 locked contracts are runtime-eligible.
 * Mimics the FileFormContractRepository.loadSnapshot() logic.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTRACTS_ROOT = path.join(REPO_ROOT, "docs/audit/docx/contracts");
const LOCKED_DIR = path.join(CONTRACTS_ROOT, "locked");

function scanContracts(root) {
  const locked = [];
  const drafts = [];
  const invalid = [];

  const scanDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "locked") scanDir(full);
        continue;
      }
      if (/\.contract\.(draft|locked)\.json$/.test(entry.name)) {
        try {
          const json = JSON.parse(fs.readFileSync(full, "utf8"));
          if (json.documentKind === "reference") continue;
          if (json.status === "locked") locked.push(json);
          else drafts.push(json);
        } catch {
          invalid.push(entry.name);
        }
      }
    }
  };

  scanDir(root);

  // Locked shadows drafts for same templateCode
  const lockedCodes = new Set(locked.map((c) => c.templateCode));
  const activeDrafts = drafts.filter((d) => !lockedCodes.has(d.templateCode));

  return { locked, activeDrafts, invalid };
}

const { locked, activeDrafts, invalid } = scanContracts(CONTRACTS_ROOT);

console.log("=== FORM CONTRACT RUNTIME SMOKE TEST ===\n");
console.log(`Locked contracts (runtime-eligible): ${locked.length}`);
console.log(`Draft contracts (shadowed): ${locked.length}`);
console.log(`Active drafts (not shadowed): ${activeDrafts.length}`);
console.log(`Invalid files: ${invalid.length}`);

// Verify all 213 are locked
const allLockedCodes = new Set(locked.map((c) => c.templateCode));
const expected = Array.from({ length: 213 }, (_, i) => `BM-${String(i + 1).padStart(3, "0")}`);
const missing = expected.filter((c) => !allLockedCodes.has(c));

if (missing.length > 0) {
  console.log(`\nMISSING: ${missing.join(", ")}`);
} else {
  console.log(`\nALL 213 locked contracts present.`);
}

// Verify all are runtime-eligible (status=locked, no generic fields)
const genericPattern = /^[a-z]+\.field\d+$/i;
const nonEligible = locked.filter((c) =>
  (c.canonicalFields || []).some((f) => genericPattern.test(f.path)),
);
if (nonEligible.length > 0) {
  console.log(`\nNOT RUNTIME-ELIGIBLE (generic fields): ${nonEligible.map((c) => c.templateCode).join(", ")}`);
} else {
  console.log(`All locked contracts are runtime-eligible (no generic field paths).`);
}

// Check for any INVALID files
if (invalid.length > 0) {
  console.log(`\nINVALID FILES: ${invalid.join(", ")}`);
}

// Summary
console.log("\n=== RESULT ===");
if (locked.length === 213 && missing.length === 0 && nonEligible.length === 0 && invalid.length === 0) {
  console.log("PASS: All 213 forms are LOCKED_VERIFIED and runtime-eligible.");
} else {
  console.log("ISSUES FOUND - see above.");
}
