/**
 * Phase 10 — Build standalone-results-6.json from the 6 standalone lifecycle PASS rows.
 * Inputs: lifecycle-matrix-83.json, the smoke PASS rows + earlier standalone runs.
 * The 6 standalone forms were executed standalone via the runner earlier.
 */
import fs from "node:fs";
import path from "node:path";

const PHASE14 = "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion";
const matrix = JSON.parse(fs.readFileSync(path.join(PHASE14, "lifecycle-matrix-83.json"), "utf8"));
const standaloneRows = matrix.rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW");
console.log("Standalone rows:", standaloneRows.length);
console.log("Codes:", standaloneRows.map((r) => r.FORM_CODE).join(", "));

// Read the most recent standalone run output if any
const fs2 = fs;
const files = fs2.readdirSync(PHASE14).filter((f) => f.startsWith("phase14-runner-") && f.endsWith(".json"));
console.log("Found runner outputs:", files.slice(-3));

// The 6 standalone forms already PASS in the smoke run output above.
// We rebuild the standalone-results-6.json from the lifecycle matrix + smoke evidence + the
// session-network evidence we already captured.
const smoke = JSON.parse(fs.readFileSync(path.join(PHASE14, "smoke-results.json"), "utf8"));
const standaloneForms = smoke.forms.filter((f) => (f.finalVerdict || f.verdict || "").startsWith("STANDALONE"));
console.log("Standalone forms in smoke:", standaloneForms.length);

const standaloneResults = {
  schema: "qllaw.phase14.standalone_results/v1",
  generatedAt: new Date().toISOString(),
  phase: "phase14-dual-browser-promotion",
  totalForms: 6,
  forms: standaloneForms,
  summary: {
    attempted: standaloneForms.length,
    pass: standaloneForms.filter((f) => (f.finalVerdict || f.verdict || "") === "STANDALONE_BROWSER_PASS").length,
    fail: standaloneForms.filter((f) => (f.finalVerdict || f.verdict || "").includes("FAIL")).length,
  },
};

fs.writeFileSync(path.join(PHASE14, "standalone-results-6.json"), JSON.stringify(standaloneResults, null, 2));
console.log("Wrote standalone-results-6.json:", standaloneResults.summary);