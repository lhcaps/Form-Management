// Build script that writes all document-fidelity files using UTF-8 (no BOM).
// Invoke: node scripts/document-fidelity/_build.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

function write(rel, content) {
  const path = `${HERE}/${rel}`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, { encoding: "utf8" });
  console.log("wrote", path, "(" + content.length + " bytes)");
}

const FILES = JSON.parse(process.argv[2]);
for (const f of FILES) {
  write(f.path, f.content);
}