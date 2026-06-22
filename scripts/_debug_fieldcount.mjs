import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCKED_DIR = path.join(__dirname, "..", "docs/audit/docx/contracts/locked");

const files = fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"));

// Check a few specific BMs
const targets = ["BM-051", "BM-004", "BM-062"];
for (const file of files) {
  const code = file.match(/BM-\d+/)?.[0];
  if (!targets.includes(code)) continue;

  const c = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
  console.log("\n=== " + code + " ===");
  console.log("canonicalFields count: " + (c.canonicalFields || []).length);
  console.log("renderBindings count: " + (c.renderBindings || []).length);
  console.log("docxSlots count: " + (c.docxSlots || []).length);

  const paths = (c.canonicalFields || []).map((f) => f.path);
  const seen = new Set();
  const dupes = [];
  for (const p of paths) {
    if (seen.has(p)) dupes.push(p);
    seen.add(p);
  }
  console.log("Duplicate paths: " + dupes.join(", ") || "none");
  console.log("Unique paths: " + seen.size);
}
