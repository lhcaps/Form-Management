#!/usr/bin/env node
/**
 * Fix extraction hashes for forms where DOCX was modified but draft still has old hash.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DRAFT_DIR = path.join(ROOT, "docs", "audit", "docx", "contracts");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

const BLOCKED_HASH = new Set([
  "BM-051","BM-052","BM-060","BM-061","BM-062","BM-063","BM-064","BM-065","BM-066","BM-067",
]);

const draftFiles = (fs.readdirSync(DRAFT_DIR) ?? [])
  .filter(f => f.endsWith(".contract.draft.json") && !f.startsWith("_"))
  .sort();

let fixed = 0;

for (const file of draftFiles) {
  const formCode = file.replace(/__.*$/, "");
  if (!BLOCKED_HASH.has(formCode)) continue;

  const draftPath = path.join(DRAFT_DIR, file);
  const draft = JSON.parse(fs.readFileSync(draftPath, "utf8"));

  const relPath = draft.extractionSource?.relativePath;
  if (!relPath) continue;

  const absPath = path.join(ROOT, relPath);
  if (!fs.existsSync(absPath)) continue;

  const buf = fs.readFileSync(absPath);
  const actualHash = sha256(buf);
  const storedHash = draft.extractionSource?.sha256;

  if (storedHash !== actualHash) {
    console.log(`${formCode}: ${storedHash?.slice(0,8) ?? "null"} → ${actualHash.slice(0,8)}`);
    draft.extractionSource.sha256 = actualHash;
    fs.writeFileSync(draftPath, JSON.stringify(draft, null, 2));
    fixed++;
  }
}

console.log(`\nFixed hashes: ${fixed}`);
