import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCKED_DIR = path.join(__dirname, "..", "docs/audit/docx/contracts/locked");

for (const file of fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"))) {
  const code = file.match(/BM-\d+/)?.[0];
  if (!["BM-054", "BM-159"].includes(code)) continue;

  const c = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
  console.log("\n=== " + code + " ===");
  for (const f of c.canonicalFields || []) {
    if (!/^[a-zA-Z0-9._-]+$/.test(f.path)) {
      console.log("  BAD: " + f.path + " (len=" + f.path.length + ")");
    }
  }
  // Also check labels
  for (const f of c.canonicalFields || []) {
    const label = (c.docxSlots?.find(s => s.slotId === f.path)?.label || "").trim();
    if (label.length > 200) {
      console.log("  LONG LABEL: " + label.slice(0, 100));
    }
  }
}
