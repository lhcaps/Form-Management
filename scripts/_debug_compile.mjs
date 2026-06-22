import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const THIS_FILE = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(THIS_FILE, "../..");
const LOCKED_DIR = path.join(REPO_ROOT, "docs/audit/docx/contracts/locked");

const requireFromContracts = createRequire(path.join(REPO_ROOT, "packages/form-contracts/package.json"));
const { adaptV1Contract, compileContract } = requireFromContracts("@qllaw/form-contracts");

const files = fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json")).slice(0, 5);

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
    },
    null,
  );
  const compiled = compileContract(adapted);
  console.log(`${file.split("__")[0]}: compile=${compiled.ok ? "OK" : "FAIL"}`);
  if (!compiled.ok) {
    compiled.issues?.slice(0, 3).forEach((i) => console.log(`  [${i.severity}] ${i.code}: ${i.message}`));
  }
}
