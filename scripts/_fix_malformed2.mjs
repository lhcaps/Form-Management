import PizZip from "pizzip";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const DOCX_OUT = path.join(REPO_ROOT, "storage/templates/normalized-docx");
const LOCKED_DIR = path.join(REPO_ROOT, "docs/audit/docx/contracts/locked");

const requireFromContracts = createRequire(path.join(REPO_ROOT, "packages/form-contracts/package.json"));
const { adaptV1Contract, compileContract } = requireFromContracts("@qllaw/form-contracts");

const MALFORMED = {
  "BM-054": {
    "malformed": "</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/><w:u w:val=\"none\"/></w:rPr><w:t>agency.name</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/></w:rPr><w:t>",
    "clean": "agency.name",
  },
  "BM-159": {
    "malformed": "subordinat</w:t></w:r><w:bookmarkStart w:id=\"1\" w:name=\"_GoBack\"/><w:bookmarkEnd w:id=\"1\"/><w:r><w:rPr><w:rFonts w:hint=\"default\" w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t>eProcuracyTrialAssignment.article1Line",
    "clean": "subordinateProcuracyTrialAssignment.article1Line",
  },
};

for (const [code, fix] of Object.entries(MALFORMED)) {
  const docxPath = path.join(DOCX_OUT, code, code + "_normalized.docx");
  console.log("\n=== " + code + " ===");

  // Fix DOCX
  let buf = fs.readFileSync(docxPath);
  let zip = new PizZip(buf);
  let xml = zip.file("word/document.xml")?.asText() || "";

  const bad = "{{" + fix.malformed + "}}";
  const good = "{{" + fix.clean + "}}";

  if (xml.includes(bad)) {
    xml = xml.split(bad).join(good);
    zip.file("word/document.xml", xml);
    fs.writeFileSync(docxPath, zip.generate({ type: "nodebuffer" }));
    console.log("DOCX fixed: " + bad.slice(0, 80) + " -> " + fix.clean);
  } else {
    console.log("WARNING: malformed pattern not found in DOCX!");
    // Try to fix anyway
    const re = new RegExp("\\{\\{[^}]*\\}\\}", "g");
    const matches = [...xml.matchAll(re)].map(m => m[0]);
    console.log("Current mustaches:", matches.slice(0, 5));
  }

  // Rebuild contract slots from DOCX
  buf = fs.readFileSync(docxPath);
  zip = new PizZip(buf);
  xml = zip.file("word/document.xml")?.asText() || "";
  const mustaches = [...new Set([...xml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))];

  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (lockedFiles.length === 0) { console.log("No locked contract"); continue; }

  const contractPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

  // Find and fix the malformed field
  const malformedField = (contract.canonicalFields || []).find(f =>
    !/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(f.path)
  );

  if (malformedField) {
    console.log("Contract field: " + malformedField.path.slice(0, 80) + " -> " + fix.clean);
    malformedField.path = fix.clean;
  }

  const malformedSlot = (contract.docxSlots || []).find(s =>
    !/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(s.slotId)
  );
  if (malformedSlot) {
    console.log("Contract slot: " + malformedSlot.slotId.slice(0, 80) + " -> " + fix.clean);
    malformedSlot.slotId = fix.clean;
  }

  const malformedBinding = (contract.renderBindings || []).find(b =>
    !/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(b.slotId) ||
    !/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(b.from)
  );
  if (malformedBinding) {
    console.log("Contract binding: slotId=" + malformedBinding.slotId.slice(0, 80) + " from=" + malformedBinding.from.slice(0, 80));
    if (!/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(malformedBinding.slotId)) {
      malformedBinding.slotId = fix.clean;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(malformedBinding.from)) {
      malformedBinding.from = fix.clean;
    }
  }

  fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2));
  console.log("Contract saved");

  // Verify compile
  const adapted = adaptV1Contract(
    {
      schemaVersion: "1.0",
      sourceId: contract.sourceId || code,
      templateCode: contract.templateCode || code,
      templateTitle: contract.title || code,
      documentKind: "form",
      status: "locked",
      extractionSource: contract.extractionSource || null,
      docxSlots: contract.docxSlots || [],
      canonicalFields: contract.canonicalFields || [],
      renderBindings: contract.renderBindings || [],
      extensionPoints: contract.extensionPoints || [],
    },
    null,
  );
  const compiled = compileContract(adapted);
  console.log("Compile: " + (compiled.ok ? "OK" : "FAIL"));
  if (!compiled.ok) {
    compiled.issues?.slice(0, 5).forEach(i => console.log("  " + i.code + ": " + i.message.slice(0, 100)));
  }
}
