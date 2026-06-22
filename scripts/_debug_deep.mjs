import fs from "node:fs";
import PizZip from "pizzip";

// Deep analysis of each problematic BM category

// Category 1: Malformed XML in mustache (BM-054, BM-159)
function checkMalformed(code) {
  const normFile = `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/${code}/${code}_normalized.docx`;
  const buf = fs.readFileSync(normFile);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();

  // Find all mustache-like patterns including malformed ones
  // Look for {{ that is NOT inside a < > tag boundary
  const malformed = [...docXml.matchAll(/\{\{([^}]{3,300})\}\}/g)].filter(m => m[1].includes("<"));
  console.log(code + " malformed mustaches: " + malformed.length);
  malformed.forEach(m => console.log("  MALFORMED: {{" + m[1].slice(0, 200) + "}}"));

  // Also find what should be the correct semantic name
  const orphanedMustaches = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].filter(m => !m[1].includes("<"));
  console.log("  Total valid: " + orphanedMustaches.length);
}

// Category 2: Semantic mismatch (BM-021, BM-031, BM-036, BM-044, BM-139)
function checkSemantic(code) {
  const normFile = `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/${code}/${code}_normalized.docx`;
  const buf = fs.readFileSync(normFile);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();
  const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());

  const lockedFiles = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked")
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked/" + lockedFiles[0], "utf8"));
  const slotIds = (c.docxSlots || []).map(s => s.slotId);

  // Find orphaned in contract (slots not in DOCX)
  const orphanedContract = slotIds.filter(s => !musts.includes(s));
  if (orphanedContract.length > 0) {
    console.log("\n" + code + " orphaned in contract (" + orphanedContract.length + "):");
    orphanedContract.forEach(s => console.log("  " + s));
    // Find the context for these slots in the original draft
    const draftFiles = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts")
      .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.draft.json"));
    if (draftFiles.length > 0) {
      const draft = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/" + draftFiles[0], "utf8"));
      orphanedContract.forEach(s => {
        const slot = draft.docxSlots?.find(sl => sl.slotId === s);
        console.log("    context: " + (slot?.evidence?.textBefore || slot?.context || "").slice(0, 80));
      });
    }
  }

  // Find orphaned in DOCX (mustaches not in contract)
  const orphanedDocx = musts.filter(m => !slotIds.includes(m));
  if (orphanedDocx.length > 0) {
    console.log("  orphaned in DOCX (" + orphanedDocx.length + "):");
    orphanedDocx.forEach(m => console.log("    {{" + m + "}}"));
  }
}

// Category 3: Duplicate mustaches (BM-002, BM-004, BM-005, BM-006, BM-008, BM-010, BM-012, BM-018, BM-019, BM-022, BM-023, BM-024, BM-026, BM-034, BM-035, BM-039, BM-041, BM-053, BM-070, BM-071, BM-072, BM-103, BM-134, BM-135, BM-184, BM-190, BM-199)
function checkDuplicates(code) {
  const normFile = `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/${code}/${code}_normalized.docx`;
  const buf = fs.readFileSync(normFile);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();
  const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());

  const lockedFiles = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked")
    .filter(f => f.startsWith(code + "__") && f.endsWith(".contract.locked.json"));
  const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked/" + lockedFiles[0], "utf8"));
  const slotIds = (c.docxSlots || []).map(s => s.slotId);

  const uniqueMusts = [...new Set(musts)];
  const dupCount = musts.length - uniqueMusts.length;
  const orphanedContract = slotIds.filter(s => !musts.includes(s));
  const orphanedDocx = musts.filter(m => !slotIds.includes(m));

  if (dupCount > 0 || orphanedContract.length > 0 || orphanedDocx.length > 0) {
    console.log(code + ": total=" + musts.length + " unique=" + uniqueMusts.length + " slots=" + slotIds.length + " dup=" + dupCount + " orphan_contract=" + orphanedContract.length + " orphan_docx=" + orphanedDocx.length);
    if (orphanedContract.length > 0) console.log("  IN CONTRACT NOT DOCX: " + orphanedContract.join(", "));
    if (orphanedDocx.length > 0) console.log("  IN DOCX NOT CONTRACT: " + orphanedDocx.slice(0, 5).join(", ") + (orphanedDocx.length > 5 ? " ..." : ""));
  }
}

// Category 4: BM-156 - many orphaned contract slots
function check156() {
  const normFile = `D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-156/BM-156_normalized.docx`;
  const buf = fs.readFileSync(normFile);
  const zip = new PizZip(buf);
  const docXml = zip.file("word/document.xml").asText();
  const musts = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1].trim());

  const lockedFiles = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked")
    .filter(f => f.startsWith("BM-156__") && f.endsWith(".contract.locked.json"));
  const c = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/locked/" + lockedFiles[0], "utf8"));
  const slotIds = (c.docxSlots || []).map(s => s.slotId);
  const orphanedContract = slotIds.filter(s => !musts.includes(s));
  console.log("BM-156: total=" + musts.length + " slots=" + slotIds.length);
  console.log("IN CONTRACT NOT DOCX: " + orphanedContract.slice(0, 5).join(", "));

  // Check draft contract for these orphaned slots
  const draftFiles = fs.readdirSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts")
    .filter(f => f.startsWith("BM-156__") && f.endsWith(".contract.draft.json"));
  if (draftFiles.length > 0) {
    const draft = JSON.parse(fs.readFileSync("D:/Study/Project/QLLaw-main/docs/audit/docx/contracts/" + draftFiles[0], "utf8"));
    orphanedContract.forEach(s => {
      const slot = draft.docxSlots?.find(sl => sl.slotId === s);
      console.log("  " + s + " | " + (slot?.evidence?.textBefore || "").slice(0, 80));
    });
  }
}

console.log("=== MALFORMED XML ===");
checkMalformed("BM-054");
checkMalformed("BM-159");

console.log("\n=== SEMANTIC MISMATCH ===");
checkSemantic("BM-021");
checkSemantic("BM-031");
checkSemantic("BM-036");
checkSemantic("BM-044");
checkSemantic("BM-139");

console.log("\n=== DUPLICATE MUSTACHES ===");
["BM-002","BM-004","BM-005","BM-006","BM-008","BM-010","BM-012","BM-018","BM-019","BM-022","BM-023","BM-024","BM-026","BM-034","BM-035","BM-039","BM-041","BM-053","BM-070","BM-071","BM-072","BM-103","BM-134","BM-135","BM-184","BM-190","BM-199"].forEach(checkDuplicates);

console.log("\n=== BM-156 ===");
check156();
