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

// The DOCX mustaches for these BMs have XML inside the mustache.
// We fix the DOCX by replacing the malformed XML-mustache with the clean version.
const FIXES = {
  "BM-054": {
    malformed: "</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/><w:u w:val=\"none\"/></w:rPr><w:t>agency.name</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/></w:rPr><w:t>",
    clean: "agency.name",
  },
  "BM-159": {
    malformed: "subordinat</w:t></w:r><w:bookmarkStart w:id=\"1\" w:name=\"_GoBack\"/><w:bookmarkEnd w:id=\"1\"/><w:r><w:rPr><w:rFonts w:hint=\"default\" w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t>eProcuracyTrialAssignment.article1Line",
    clean: "subordinateProcuracyTrialAssignment.article1Line",
  },
};

function inferSource(fp) {
  if (fp.includes("parentName")) return "agencyConfig";
  if (fp.includes("name")) return "agencyConfig";
  if (fp.includes("documentCode") || fp.includes("issuePlace") || fp.includes("issueDate")) return "agencyConfig";
  if (fp.includes("dateLine") || fp.includes("Line")) return "agencyConfig";
  return "manual";
}

function inferTransform(fp) {
  if (fp.includes("dateLine")) return "date.issuePlaceDateLine";
  return "identity";
}

for (const [code, fix] of Object.entries(FIXES)) {
  console.log("\n=== " + code + " ===");
  const docxPath = path.join(DOCX_OUT, code, code + "_normalized.docx");

  // Fix DOCX
  let buf = fs.readFileSync(docxPath);
  let zip = new PizZip(buf);
  let xml = zip.file("word/document.xml")?.asText() || "";

  const badPattern = "{{" + fix.malformed + "}}";
  const goodPattern = "{{" + fix.clean + "}}";

  if (xml.includes(badPattern)) {
    xml = xml.split(badPattern).join(goodPattern);
    zip.file("word/document.xml", xml);
    fs.writeFileSync(docxPath, zip.generate({ type: "nodebuffer" }));
    console.log("DOCX: fixed malformed mustache");
  } else {
    console.log("WARNING: malformed pattern not found in DOCX!");
    continue;
  }

  // Extract mustaches from fixed DOCX
  buf = fs.readFileSync(docxPath);
  zip = new PizZip(buf);
  xml = zip.file("word/document.xml")?.asText() || "";
  const mustaches = [...new Set([...xml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()))];
  console.log("DOCX mustaches (" + mustaches.length + " unique): " + mustaches.slice(0, 5).join(", ") + (mustaches.length > 5 ? "..." : ""));

  // Rebuild contract from scratch for these 2 BMs
  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (lockedFiles.length === 0) { console.log("No locked contract found!"); continue; }

  const contractPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

  // Remove all existing docxSlots and canonicalFields and renderBindings
  contract.docxSlots = [];
  contract.canonicalFields = [];
  contract.renderBindings = [];

  // Rebuild from mustaches
  for (const must of mustaches) {
    const slot = {
      slotId: must,
      location: { partName: "word/document.xml", blockId: "", tableCellId: null },
      context: "",
      slotType: "text",
      required: false,
      confidence: 0.5,
      reviewRequired: false,
    };
    contract.docxSlots.push(slot);

    const field = {
      path: must,
      source: inferSource(must),
      transform: inferTransform(must),
      reviewRequired: false,
    };
    contract.canonicalFields.push(field);

    const binding = {
      slotId: must,
      from: must,
      transform: inferTransform(must),
      reviewRequired: false,
    };
    contract.renderBindings.push(binding);
  }

  // Ensure extensionPoints has the custom transform
  const BUILTIN = new Set(["identity", "trim", "uppercase", "lowercase", "vietnameseDate", "number", "booleanMark", "derived"]);
  const neededTransforms = mustaches.filter(m => !BUILTIN.has(inferTransform(m)));
  if (!contract.extensionPoints) contract.extensionPoints = [];
  for (const t of neededTransforms) {
    if (!contract.extensionPoints.some(e => e.name === t)) {
      contract.extensionPoints.push({ id: "ext-" + t, kind: "TRANSFORM", name: t });
    }
  }

  fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2));
  console.log("Contract rebuilt with " + mustaches.length + " slots");

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
      docxSlots: contract.docxSlots,
      canonicalFields: contract.canonicalFields,
      renderBindings: contract.renderBindings,
      extensionPoints: contract.extensionPoints || [],
    },
    null,
  );

  const compiled = compileContract(adapted);
  console.log("Compile: " + (compiled.ok ? "OK" : "FAIL (" + compiled.issues?.length + " issues)"));
  if (!compiled.ok) {
    compiled.issues?.slice(0, 5).forEach(i => console.log("  " + i.code + ": " + i.message.slice(0, 100)));
  }
}
