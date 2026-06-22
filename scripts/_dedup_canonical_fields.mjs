import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCKED_DIR = path.join(__dirname, "..", "docs/audit/docx/contracts/locked");

const files = fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"));
let fixed = 0;

for (const file of files) {
  const fp = path.join(LOCKED_DIR, file);
  const c = JSON.parse(fs.readFileSync(fp, "utf8"));

  const fields = c.canonicalFields || [];
  const seen = new Set();
  const keep = [];
  const removed = [];

  for (const f of fields) {
    if (!seen.has(f.path)) {
      seen.add(f.path);
      keep.push(f);
    } else {
      removed.push(f.path);
    }
  }

  if (removed.length > 0) {
    c.canonicalFields = keep;
    fs.writeFileSync(fp, JSON.stringify(c, null, 2));
    fixed++;
    console.log(`FIXED: ${file} (removed ${removed.length} duplicate paths: ${removed.slice(0, 5).join(", ")}${removed.length > 5 ? "..." : ""})`);
  }
}

console.log("\nTotal contracts deduplicated: " + fixed);
