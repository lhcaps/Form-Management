import fs from "node:fs";

const files = [
  "D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked/BM-002__f78301178da7.contract.locked.json",
  "D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked/BM-004__f78301178da7.contract.locked.json",
  "D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked/BM-005__f78301178da7.contract.locked.json",
];

for (const fp of files) {
  const c = JSON.parse(fs.readFileSync(fp, "utf8"));
  const code = fp.match(/BM-\d+/)[0];
  console.log(`\n=== ${code} ===`);
  console.log("Transforms:", (c.renderBindings || []).map((b) => b.transform).filter(Boolean).join(", "));
  console.log("Field paths:", (c.canonicalFields || []).map((f) => f.path).join(", "));
}
