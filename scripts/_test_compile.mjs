import { adaptV1Contract } from "./packages/form-contracts/src/v1-adapter.ts";
import { compileContract } from "./packages/form-contracts/src/compiler.ts";
import { validateContract } from "./packages/form-contracts/src/validator.ts";
import fs from "node:fs";
import path from "node:path";

const LOCKED_DIR = "D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked";
const files = fs.readdirSync(LOCKED_DIR).filter((f) => f.endsWith(".contract.locked.json")).slice(0, 5);

for (const file of files) {
  const contract = JSON.parse(fs.readFileSync(path.join(LOCKED_DIR, file), "utf8"));

  const v1 = {
    schemaVersion: "1.0",
    sourceId: contract.sourceId || file,
    templateCode: contract.templateCode || file.split("__")[0].split("-")[0] + "-" + file.split("__")[0].split("-")[1],
    templateTitle: contract.title || file,
    documentKind: "form",
    status: "locked",
    extractionSource: contract.extractionSource || null,
    docxSlots: contract.docxSlots || [],
    canonicalFields: contract.canonicalFields || [],
    renderBindings: contract.renderBindings || [],
  };

  const adapted = adaptV1Contract(v1 as any, null);
  const validation = validateContract(adapted);
  const errors = validation.filter((r: any) => r.severity === "ERROR");
  const warnings = validation.filter((r: any) => r.severity === "WARNING");
  const compiled = compileContract(adapted);

  console.log(`${file.split("__")[0]}: validate=${errors.length} errors, ${warnings.length} warnings | compile=${compiled.ok ? "OK" : "FAIL"}`);
  if (errors.length > 0) {
    errors.slice(0, 3).forEach((e: any) => console.log(`  ERROR: ${e.code} - ${e.message}`));
  }
  if (!compiled.ok) {
    compiled.issues?.slice(0, 3).forEach((i: any) => console.log(`  COMPILE: ${i.code} - ${i.message}`));
  }
}
