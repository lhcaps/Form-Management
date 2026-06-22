import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCKED_DIR = "D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked";

const BUILTIN = new Set([
  "identity", "trim", "uppercase", "lowercase",
  "vietnameseDate", "number", "booleanMark", "derived",
]);

const allTransforms = new Set();
const files = fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"));

for (const file of files) {
  const c = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
  for (const b of c.renderBindings || []) {
    if (!BUILTIN.has(b.transform)) {
      allTransforms.add(b.transform);
    }
  }
}

console.log("Custom transforms used:");
for (const t of [...allTransforms].sort()) {
  console.log("  " + t);
}
