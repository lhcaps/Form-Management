import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const LOCKED_DIR = path.join(REPO_ROOT, "docs/audit/docx/contracts/locked");

const requireFromContracts = createRequire(path.join(REPO_ROOT, "packages/form-contracts/package.json"));
const { adaptV1Contract, compileContract } = requireFromContracts("@qllaw/form-contracts");

const targets = ["BM-054", "BM-159"];

for (const file of fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json"))) {
  const code = file.match(/BM-\d+/)?.[0];
  if (!targets.includes(code)) continue;

  const json = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));
  const adapted = adaptV1Contract(
    {
      schemaVersion: "1.0",
      sourceId: json.sourceId || file,
      templateCode: json.templateCode || code,
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

  const compiled = compileContract(adapted);
  console.log(`${code}: compile=${compiled.ok ? "OK" : "FAIL"}`);
  if (!compiled.ok) {
    compiled.issues?.forEach((i) => console.log(`  [${i.severity}] ${i.code}: ${i.message}`));
  }
  console.log(`  fields=${adapted.fields.length} bindings=${adapted.renderBindings.length}`);
}
