// Read JSON from stdin, write each file in UTF-8 (no BOM).
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const chunks = [];
process.stdin.on("data", (c) => chunks.push(c));
process.stdin.on("end", () => {
  const json = Buffer.concat(chunks).toString("utf8");
  const files = JSON.parse(json);
  for (const f of files) {
    const path = "D:/Study/Project/QLLaw-main/scripts/document-fidelity/" + f.path;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, f.content, { encoding: "utf8" });
    console.log("wrote", path, "(" + f.content.length + " bytes)");
  }
});