import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCKED_DIR = path.join(__dirname, "..", "docs/audit/docx/contracts/locked");

// Find ALL contracts with non-alphanumeric field paths
let badCount = 0;

for (const file of fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"))) {
  const fp = path.join(LOCKED_DIR, file);
  const c = JSON.parse(fs.readFileSync(fp, "utf8"));
  let changed = false;

  const cleanFields = (c.canonicalFields || []).map((f) => {
    // Path must match: letters, numbers, dots, underscores, dashes
    if (!/^[a-zA-Z0-9._-]+$/.test(f.path)) {
      // Extract semantic path from XML garbage
      const match = f.path.match(/([a-zA-Z][a-zA-Z0-9._-]+)/);
      if (match) {
        const clean = match[1].replace(/^[^a-zA-Z]+/, "");
        if (clean && /^[a-zA-Z][a-zA-Z0-9._-]+$/.test(clean)) {
          console.log(`CLEAN: ${file} ${f.path.slice(0, 60)}... -> ${clean}`);
          changed = true;
          return { ...f, path: clean };
        }
      }
      // If can't clean, keep as-is but log
      console.log(`SKIP: ${file} ${f.path.slice(0, 80)} (cannot clean)`);
      return f;
    }
    return f;
  });

  if (changed) {
    c.canonicalFields = cleanFields;
    fs.writeFileSync(fp, JSON.stringify(c, null, 2));
    badCount++;
  }
}

console.log("\nTotal contracts cleaned: " + badCount);
