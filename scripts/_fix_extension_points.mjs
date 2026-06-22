import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCKED_DIR = "D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked";

const files = fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"));

let fixed = 0;

for (const file of files) {
  const fp = path.join(LOCKED_DIR, file);
  const c = JSON.parse(fs.readFileSync(fp, "utf8"));

  // Check if extensionPoints already exists
  if (c.extensionPoints && Array.isArray(c.extensionPoints)) {
    // Add if not already there
    const hasDateLine = c.extensionPoints.some(
      (e) => e.kind === "TRANSFORM" && e.name === "date.issuePlaceDateLine",
    );
    if (!hasDateLine) {
      c.extensionPoints.push({ kind: "TRANSFORM", name: "date.issuePlaceDateLine" });
      fs.writeFileSync(fp, JSON.stringify(c, null, 2));
      fixed++;
      console.log("ADDED: " + file);
    }
    continue;
  }

  // Check if any binding uses a non-builtin transform
  const BUILTIN = new Set([
    "identity", "trim", "uppercase", "lowercase",
    "vietnameseDate", "number", "booleanMark", "derived",
  ]);

  const usesCustom = (c.renderBindings || []).some(
    (b) => b.transform && !BUILTIN.has(b.transform),
  );

  if (!usesCustom) continue;

  c.extensionPoints = [
    { kind: "TRANSFORM", name: "date.issuePlaceDateLine" },
  ];

  fs.writeFileSync(fp, JSON.stringify(c, null, 2));
  fixed++;
  console.log("FIXED: " + file);
}

console.log("\nTotal fixed: " + fixed);
