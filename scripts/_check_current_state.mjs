import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCKED_DIR = path.join(__dirname, "..", "docs/audit/docx/contracts/locked");

for (const code of ["BM-054", "BM-159"]) {
  const files = fs.readdirSync(LOCKED_DIR).filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (!files.length) { console.log(code + ": no contract"); continue; }
  const c = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, files[0]), "utf8"));
  console.log("\n=== " + code + " (" + files[0] + ") ===");
  console.log("canonicalFields: " + (c.canonicalFields || []).length);
  for (const f of c.canonicalFields || []) {
    const valid = /^[a-zA-Z][a-zA-Z0-9._-]+$/.test(f.path);
    console.log("  " + (valid ? "OK" : "BAD") + ": " + f.path.slice(0, 100));
  }
}
