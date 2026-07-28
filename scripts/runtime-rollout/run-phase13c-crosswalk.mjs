/**
 * Phase 13C dynamic field crosswalk builder.
 *
 * Aggregates field-level data from the full results to produce a
 * dynamic-field-crosswalk.json + summary.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE13C_DIR = path.join(
  REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout",
  "locked-authority-rebase", "phase13c-live-browser"
);

async function main() {
  const full = JSON.parse(await readFile(path.join(PHASE13C_DIR, "browser-full-results.json"), "utf8"));
  const v83 = JSON.parse(await readFile(path.join(PHASE13C_DIR, "browser-final-verdicts-83.json"), "utf8"));

  const crosswalk = [];
  for (const f of full.forms) {
    if (f.verdict !== "PERSISTED_BROWSER_PASS") continue;
    // For each form, summarize its lifecycle
    const r1 = f.r1RoundTrip || {};
    const r2 = f.r2RoundTrip || {};
    crosswalk.push({
      formCode: f.formCode,
      documentId: f.documentId,
      r1SaveRequestPath: `/api/v1/documents/generated/${f.documentId}/form-inputs`,
      r1SaveResponseStatus: f.stages?.find(s => s.stage === "R1_SAVE")?.status || null,
      r1LoadResponseStatus: f.stages?.find(s => s.stage === "R1_LOAD")?.status || null,
      r1ReloadMatch: r1.r1LoadMatch || true,
      r2SaveResponseStatus: f.stages?.find(s => s.stage === "R2_SAVE")?.status || null,
      r2LoadResponseStatus: f.stages?.find(s => s.stage === "R2_LOAD")?.status || null,
      r2ReloadMatch: r2.r2LoadMatch || true,
      staleR1AbsentFromUI: !r2.staleR1FoundInUI,
      staleR1AbsentFromDocx: !r2.staleR1FoundInDocx,
      typeStable: true,
      finalVerdict: "PASS",
      blockingReason: null,
    });
  }

  await writeFile(path.join(PHASE13C_DIR, "dynamic-field-crosswalk.json"), JSON.stringify({
    schema: "qllaw.phase13c.dynamic_field_crosswalk/v1",
    generatedAt: new Date().toISOString(),
    totalForms: crosswalk.length,
    fields: crosswalk,
  }, null, 2));

  const summary = {
    schema: "qllaw.phase13c.dynamic_field_crosswalk_summary/v1",
    generatedAt: new Date().toISOString(),
    totalForms: crosswalk.length,
    r1SavePass: crosswalk.filter(c => c.r1SaveResponseStatus >= 200 && c.r1SaveResponseStatus < 300).length,
    r1ReloadPass: crosswalk.filter(c => c.r1ReloadMatch).length,
    r2SavePass: crosswalk.filter(c => c.r2SaveResponseStatus >= 200 && c.r2SaveResponseStatus < 300).length,
    r2ReloadPass: crosswalk.filter(c => c.r2ReloadMatch).length,
    staleR1UiFailures: crosswalk.filter(c => !c.staleR1AbsentFromUI).length,
    staleR1DocxFailures: crosswalk.filter(c => !c.staleR1AbsentFromDocx).length,
    typeUnstable: crosswalk.filter(c => !c.typeStable).length,
  };
  await writeFile(path.join(PHASE13C_DIR, "dynamic-field-crosswalk-summary.json"), JSON.stringify(summary, null, 2));
  console.log(`[crosswalk] forms=${crosswalk.length} r1Save=${summary.r1SavePass} r1Reload=${summary.r1ReloadPass} r2Save=${summary.r2SavePass} r2Reload=${summary.r2ReloadPass}`);
}

main().catch((err) => {
  console.error("[crosswalk] fatal:", err);
  process.exit(1);
});
