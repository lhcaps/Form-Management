import fs from "node:fs";

// Look at the Field function in BM-027
const c = fs.readFileSync("D:/Study/Project/QLLaw-main/apps/web/src/components/documents/bm-027-form-inputs.tsx", "utf8");
const lines = c.split("\n");
for (let i = 140; i < Math.min(220, lines.length); i++) {
  console.log("LINE " + i + ": " + lines[i]);
}
