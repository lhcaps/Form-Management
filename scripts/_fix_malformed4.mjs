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

// For each malformed entry, find the closest matching clean mustache in DOCX
// and replace only that entry in canonicalFields, docxSlots, renderBindings
const MALFORMED = {
  "BM-054": {
    // The canonicalFields has garbage; docxSlots/slotId also garbage
    // We know from DOCX analysis that the clean path is "agency.name"
    // But we need to identify WHICH canonicalField is the garbage one
    // and which mustache in DOCX is the one that maps to it.
    // Strategy: find canonicalField where path contains "<" (XML garbage)
    // Find the corresponding mustache in DOCX (should be "agency.name")
    // Fix canonicalField, docxSlot, renderBinding to use "agency.name"
  },
  "BM-159": {
    // canonicalField path is "subordinat</w:t>..." - extract "subordinateProcuracyTrialAssignment.article1Line"
  },
};

function findMalformedInContract(contract) {
  const results = [];
  for (const f of contract.canonicalFields || []) {
    if (!/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(f.path)) {
      results.push({ type: "field", obj: f, current: f.path });
    }
  }
  for (const s of contract.docxSlots || []) {
    if (!/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(s.slotId)) {
      results.push({ type: "slot", obj: s, current: s.slotId });
    }
  }
  for (const b of contract.renderBindings || []) {
    if (!/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(b.slotId)) {
      results.push({ type: "binding-slot", obj: b, current: b.slotId });
    }
    if (!/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(b.from)) {
      results.push({ type: "binding-from", obj: b, current: b.from });
    }
  }
  return results;
}

for (const code of ["BM-054", "BM-159"]) {
  console.log("\n=== " + code + " ===");
  const docxPath = path.join(DOCX_OUT, code, code + "_normalized.docx");

  // Step 1: Fix DOCX - replace malformed mustache with clean version
  let buf = fs.readFileSync(docxPath);
  let zip = new PizZip(buf);
  let xml = zip.file("word/document.xml")?.asText() || "";

  const fixes = code === "BM-054"
    ? { bad: "</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/><w:u w:val=\"none\"/></w:rPr><w:t>agency.name</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/></w:rPr><w:t>", good: "agency.name" }
    : { bad: "subordinat</w:t></w:r><w:bookmarkStart w:id=\"1\" w:name=\"_GoBack\"/><w:bookmarkEnd w:id=\"1\"/><w:r><w:rPr><w:rFonts w:hint=\"default\" w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t>eProcuracyTrialAssignment.article1Line", good: "subordinateProcuracyTrialAssignment.article1Line" };

  const badMustache = "{{" + fixes.bad + "}}";
  const goodMustache = "{{" + fixes.good + "}}";

  if (xml.includes(badMustache)) {
    xml = xml.split(badMustache).join(goodMustache);
    zip.file("word/document.xml", xml);
    fs.writeFileSync(docxPath, zip.generate({ type: "nodebuffer" }));
    console.log("DOCX: fixed malformed mustache");
  } else {
    console.log("WARNING: malformed pattern not in DOCX anymore (already fixed?)");
    // Check what's there
    const mustaches = [...xml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim()).filter(m => m.includes("<"));
    if (mustaches.length > 0) console.log("  Still has XML mustaches:", mustaches[0].slice(0, 80));
    else console.log("  No XML mustaches remaining in DOCX");
  }

  // Step 2: Fix contract
  const lockedFiles = fs.readdirSync(LOCKED_DIR)
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  if (lockedFiles.length === 0) continue;

  const contractPath = path.join(LOCKED_DIR, lockedFiles[0]);
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

  const malformed = findMalformedInContract(contract);
  console.log("Malformed entries in contract: " + malformed.length);

  // Replace all malformed entries with the clean path
  for (const entry of malformed) {
    const old = entry.current;
    console.log(`  FIX: ${entry.type} "${old.slice(0, 60)}..." -> "${fixes.good}"`);
    if (entry.type === "field") entry.obj.path = fixes.good;
    else if (entry.type === "slot") entry.obj.slotId = fixes.good;
    else if (entry.type === "binding-slot") entry.obj.slotId = fixes.good;
    else if (entry.type === "binding-from") entry.obj.from = fixes.good;
  }

  // Also ensure extensionPoints has date.issuePlaceDateLine if needed
  const needsExt = contract.renderBindings?.some(b =>
    b.transform === "date.issuePlaceDateLine" && b.slotId === fixes.good
  );
  if (needsExt && !contract.extensionPoints?.some(e => e.name === "date.issuePlaceDateLine")) {
    contract.extensionPoints = contract.extensionPoints || [];
    contract.extensionPoints.push({ id: "ext-date.issuePlaceDateLine", kind: "TRANSFORM", name: "date.issuePlaceDateLine" });
    console.log("  Added extensionPoint: date.issuePlaceDateLine");
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
    compiled.issues?.slice(0, 5).forEach(i => console.log("  ERR: " + i.code + ": " + i.message.slice(0, 100)));
  }
}
