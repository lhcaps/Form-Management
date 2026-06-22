import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCKED_DIR = path.join(__dirname, "..", "docs/audit/docx/contracts/locked");

let total = 0, missing = 0;

for (const file of fs.readdirSync(LOCKED_DIR).filter(f => f.endsWith(".contract.locked.json"))) {
  const fp = path.join(LOCKED_DIR, file);
  const c = JSON.parse(fs.readFileSync(fp, "utf8"));
  total++;

  let needsSave = false;

  for (const f of c.canonicalFields || []) {
    if (f.type === undefined) { f.type = "text"; needsSave = true; }
  }
  for (const b of c.renderBindings || []) {
    if (b.transform === undefined) { b.transform = "identity"; needsSave = true; }
    if (b.fallback === undefined) { b.fallback = ""; needsSave = true; }
  }

  if (needsSave) {
    fs.writeFileSync(fp, JSON.stringify(c, null, 2));
    console.log("FIXED: " + file);
    missing++;
  }
}

console.log("\nTotal scanned: " + total + ", Fixed: " + missing);
