import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const LOCKED_DIR = "D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked";
let fixed = 0;

for (const file of fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"))) {
  const fp = path.join(LOCKED_DIR, file);
  const c = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!c.extensionPoints) continue;

  let changed = false;
  c.extensionPoints = c.extensionPoints.map((e) => {
    if (!e.id) {
      changed = true;
      return { ...e, id: `ext-${e.name}` };
    }
    return e;
  });

  if (changed) {
    fs.writeFileSync(fp, JSON.stringify(c, null, 2));
    fixed++;
    console.log("FIXED: " + file);
  }
}
console.log("\nTotal locked contracts fixed: " + fixed);
