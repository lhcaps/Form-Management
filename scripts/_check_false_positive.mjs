#!/usr/bin/env node
import fs from "node:fs";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage", "templates", "normalized-docx");
const LOCKED_DIR = path.join(REPO_ROOT, "docs", "audit", "docx", "contracts", "locked");

const PROBLEMATIC = ["BM-002","BM-004","BM-005","BM-006","BM-008","BM-010","BM-012","BM-018","BM-019","BM-021","BM-022","BM-023","BM-024","BM-026","BM-034","BM-035","BM-036","BM-039","BM-041","BM-053","BM-054","BM-057","BM-070","BM-071","BM-072","BM-103","BM-134","BM-135","BM-136","BM-156","BM-184","BM-190","BM-199"];

let falsePositive = 0, realIssue = 0;

for (const code of PROBLEMATIC) {
  const normFile = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(normFile)) continue;
  const buf = fs.readFileSync(normFile);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();
  const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());
  const unique = [...new Set(musts)];

  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (lockedFiles.length === 0) continue;
  const c = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, lockedFiles[0]), "utf8"));
  const slotCount = (c.docxSlots || []).length;

  const match = unique.length === slotCount;
  console.log(code + ": docx=" + musts.length + " unique=" + unique.length + " slots=" + slotCount + " | " + (match ? "FALSE POSITIVE" : "REAL_ISSUE"));
  if (match) falsePositive++; else realIssue++;
}

console.log("\nFalse positives: " + falsePositive + " / " + PROBLEMATIC.length);
console.log("Real issues:     " + realIssue);
