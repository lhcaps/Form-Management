import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const LOCKED_DIR = path.join(REPO_ROOT, "docs/audit/docx/contracts/locked");
const requireFromContracts = createRequire(path.join(REPO_ROOT, "packages/form-contracts/package.json"));
const { adaptV1Contract } = requireFromContracts("@qllaw/form-contracts");

const files = fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"));

let errors = 0;

for (const file of files) {
  const json = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
  const adapted = adaptV1Contract(
    {
      schemaVersion: "1.0",
      sourceId: json.sourceId || file,
      templateCode: json.templateCode || file.split("__")[0],
      templateTitle: json.title || file,
      documentKind: "form",
      status: "locked",
      extractionSource: json.extractionSource || null,
      docxSlots: json.docxSlots || [],
      canonicalFields: json.canonicalFields || [],
      renderBindings: json.renderBindings || [],
      extensionPoints: json.extensionPoints || [],
    },
    null,
  );

  const keyCount = {};
  const idCount = {};
  for (const f of adapted.fields) {
    keyCount[f.key] = (keyCount[f.key] || 0) + 1;
    idCount[f.id] = (idCount[f.id] || 0) + 1;
  }

  const dupKeys = Object.entries(keyCount).filter(([, c]) => c > 1).map(([k]) => k);
  const dupIds = Object.entries(idCount).filter(([, c]) => c > 1).map(([k]) => k);

  if (dupKeys.length > 0 || dupIds.length > 0) {
    errors++;
    console.log(`${file.split("__")[0]}: dup keys=${dupKeys.join(",")} dup ids=${dupIds.join(",")}`);
  }
}

console.log("\nTotal with duplicates: " + errors);
