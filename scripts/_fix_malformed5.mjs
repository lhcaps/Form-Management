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

const FIXES = {
  "BM-054": { bad: "rPr", good: "agency.name" },
  "BM-159": { bad: "subordinat", good: "subordinateProcuracyTrialAssignment.article1Line" },
};

for (const [code, fix] of Object.entries(FIXES)) {
  console.log("\n=== " + code + " ===");
  const docxPath = path.join(DOCX_OUT, code, code + "_normalized.docx");

  // Fix DOCX (may already be fixed from previous run)
  let buf = fs.readFileSync(docxPath);
  let zip = new PizZip(buf);
  let xml = zip.file("word/document.xml")?.asText() || "";

  // The DOCX may have the malformed XML version - fix it
  if (code === "BM-054") {
    const bad = "</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/><w:u w:val=\"none\"/></w:rPr><w:t>agency.name</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/></w:rPr><w:t>";
    if (xml.includes("{{" + bad + "}}")) {
      xml = xml.split("{{" + bad + "}}").join("{{" + fix.good + "}}");
      zip.file("word/document.xml", xml);
      fs.writeFileSync(docxPath, zip.generate({ type: "nodebuffer" }));
      console.log("DOCX: fixed malformed XML mustache");
    } else {
      // Check if the clean version is already there
      const mustaches = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());
      if (mustaches.includes("agency.name")) console.log("DOCX: clean mustache already present");
      else console.log("DOCX: malformed mustache not found! Current mustaches: " + mustaches.slice(0, 5).join(", "));
    }
  } else {
    const bad = "subordinat</w:t></w:r><w:bookmarkStart w:id=\"1\" w:name=\"_GoBack\"/><w:bookmarkEnd w:id=\"1\"/><w:r><w:rPr><w:rFonts w:hint=\"default\" w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t>eProcuracyTrialAssignment.article1Line";
    if (xml.includes("{{" + bad + "}}")) {
      xml = xml.split("{{" + bad + "}}").join("{{" + fix.good + "}}");
      zip.file("word/document.xml", xml);
      fs.writeFileSync(docxPath, zip.generate({ type: "nodebuffer" }));
      console.log("DOCX: fixed malformed XML mustache");
    } else {
      const mustaches = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());
      if (mustaches.includes("subordinateProcuracyTrialAssignment.article1Line")) console.log("DOCX: clean mustache already present");
      else console.log("DOCX: malformed mustache not found! Current: " + mustaches.slice(0, 5).join(", "));
    }
  }

  // Fix contract
  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (!lockedFiles.length) continue;

  const contractPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

  let changed = false;

  // Fix canonicalFields
  for (const f of contract.canonicalFields || []) {
    if (f.path === fix.bad) {
      console.log("FIX canonicalField: " + f.path + " -> " + fix.good);
      f.path = fix.good;
      changed = true;
    }
  }

  // Fix docxSlots
  for (const s of contract.docxSlots || []) {
    if (s.slotId === fix.bad) {
      console.log("FIX docxSlot: " + s.slotId.slice(0, 40) + " -> " + fix.good);
      s.slotId = fix.good;
      changed = true;
    }
  }

  // Fix renderBindings
  for (const b of contract.renderBindings || []) {
    if (b.slotId === fix.bad) {
      console.log("FIX renderBinding.slotId: " + b.slotId.slice(0, 40) + " -> " + fix.good);
      b.slotId = fix.good;
      changed = true;
    }
    if (b.from === fix.bad) {
      console.log("FIX renderBinding.from: " + b.from.slice(0, 40) + " -> " + fix.good);
      b.from = fix.good;
      changed = true;
    }
  }

  // Ensure extensionPoints
  if (!contract.extensionPoints) contract.extensionPoints = [];

  if (!changed) {
    console.log("No changes needed in contract");
  } else {
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2));
    console.log("Contract saved");
  }

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
    compiled.issues?.slice(0, 5).forEach(i => console.log("  ERR: " + i.code + ": " + i.message.slice(0, 100)));
  }
}
