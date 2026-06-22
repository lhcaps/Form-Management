import PizZip from "pizzip";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCX_OUT = path.join(__dirname, "..", "storage/templates/normalized-docx");
const LOCKED_DIR = path.join(__dirname, "..", "docs/audit/docx/contracts/locked");

// Mapping: which malformed mustache → what it should be
const FIXES = {
  "BM-054": {
    "</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/><w:u w:val=\"none\"/></w:rPr><w:t>agency.name</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/></w:rPr><w:t>":
      "agency.name",
  },
  "BM-159": {
    "subordinat</w:t></w:r><w:bookmarkStart w:id=\"1\" w:name=\"_GoBack\"/><w:bookmarkEnd w:id=\"1\"/><w:r><w:rPr><w:rFonts w:hint=\"default\" w:ascii=\"Times New Roman\" w:hAnsi=\"Times New Roman\" w:eastAsia=\"SimSun\" w:cs=\"Times New Roman\"/><w:sz w:val=\"28\"/><w:szCs w:val=\"28\"/></w:rPr><w:t>eProcuracyTrialAssignment.article1Line":
      "subordinateProcuracyTrialAssignment.article1Line",
  },
};

let docxFixed = 0;
let contractFixed = 0;

for (const [code, fixes] of Object.entries(FIXES)) {
  const docxPath = path.join(DOCX_OUT, code, code + "_normalized.docx");
  if (!fs.existsSync(docxPath)) { console.log("MISSING: " + docxPath); continue; }

  let buf = fs.readFileSync(docxPath);
  const zip = new PizZip(buf);
  let xml = zip.file("word/document.xml")?.asText() || "";

  let changed = false;
  for (const [bad, good] of Object.entries(fixes)) {
    if (xml.includes("{{" + bad)) {
      xml = xml.split("{{" + bad + "}}").join("{{" + good + "}}");
      changed = true;
      console.log(`DOCX FIX: ${code}: {{${bad.slice(0, 40)}...}} -> {{${good}}}`);
    } else {
      console.log(`DOCX MISSING: ${code}: cannot find {{${bad.slice(0, 40)}...}}`);
    }
  }

  if (changed) {
    zip.file("word/document.xml", xml);
    fs.writeFileSync(docxPath, zip.generate({ type: "nodebuffer" }));
    docxFixed++;
    console.log(`  -> Saved DOCX: ${code}`);

    // Also fix the locked contract
    const lockedFiles = fs.readdirSync(LOCKED_DIR)
      .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
    if (lockedFiles.length > 0) {
      const contractPath = path.join(LOCKED_DIR, lockedFiles[0]);
      const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

      let contractChanged = false;
      for (const [bad, good] of Object.entries(fixes)) {
        // Extract the actual malformed path from the bad fragment
        // e.g., bad path was extracted by previous script - we need to use the DOCX fix
        // The contract canonicalFields might have the cleaned (garbage) version
        // We need to replace the bad path in contract with the good path
        const badPath = bad.match(/([a-zA-Z][a-zA-Z0-9._-]+)$/)?.[1] || bad;

        for (const field of contract.canonicalFields || []) {
          if (!/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(field.path)) {
            console.log(`  CONTRACT CLEAN: ${code} field.path=${field.path} -> ${good}`);
            field.path = good;
            contractChanged = true;
          }
        }
        for (const slot of contract.docxSlots || []) {
          if (!/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(slot.slotId)) {
            console.log(`  CONTRACT CLEAN slot: ${code} slotId=${slot.slotId} -> ${good}`);
            slot.slotId = good;
            contractChanged = true;
          }
        }
        for (const binding of contract.renderBindings || []) {
          if (binding.slotId === good || !/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(binding.slotId)) {
            // skip
          }
          if (binding.from === good || !/^[a-zA-Z][a-zA-Z0-9._-]+$/.test(binding.from)) {
            console.log(`  CONTRACT CLEAN binding.from: ${code} from=${binding.from} -> ${good}`);
            binding.from = good;
            contractChanged = true;
          }
        }
      }

      if (contractChanged) {
        fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2));
        contractFixed++;
        console.log(`  -> Saved contract: ${lockedFiles[0]}`);
      }
    }
  }
}

console.log(`\nTotal DOCX fixed: ${docxFixed}`);
console.log(`Total contracts fixed: ${contractFixed}`);
