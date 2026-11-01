/**
 * Phase 14 Turn 4 — Final 83-form lifecycle verdicts.
 *
 * Joins evidence from:
 *   - turn4-authoritative-persisted-77.json (77)
 *   - turn4-standalone-6-results.json (6)
 *   - turn4-canary-results-7.json (subset overlap, also records promotion eligibility)
 *   - lifecycle-matrix-83.json (base schema)
 *
 * Produces:
 *   - Per-form verdict with provenance
 *   - Promotion eligibility
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE14_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase14-dual-browser-promotion",
);

const LIFECYCLE = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
const T4_PERSISTED = path.join(PHASE14_DIR, "turn4-authoritative-persisted-77.json");
const T4_STANDALONE = path.join(PHASE14_DIR, "turn4-standalone-6-results.json");
const T4_CANARY = path.join(PHASE14_DIR, "turn4-canary-results-7.json");
const T4_CROSSWALK = path.join(PHASE14_DIR, "turn4-dynamic-ui-field-crosswalk.json");
const OUT = path.join(PHASE14_DIR, "turn4-final-83-form-lifecycle-verdicts.json");

function hash(o) {
  return createHash("sha256").update(JSON.stringify(o)).digest("hex").slice(0, 16);
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const matrix = JSON.parse(await readFile(LIFECYCLE, "utf8"));
  const t4p = JSON.parse(await readFile(T4_PERSISTED, "utf8"));
  const t4s = JSON.parse(await readFile(T4_STANDALONE, "utf8"));
  const t4c = JSON.parse(await readFile(T4_CANARY, "utf8"));
  const crosswalk = JSON.parse(await readFile(T4_CROSSWALK, "utf8"));

  const persistedByCode = Object.fromEntries(t4p.forms.map((f) => [f.formCode, f]));
  const standaloneByCode = Object.fromEntries(t4s.forms.map((f) => [f.formCode, f]));
  const canaryByCode = Object.fromEntries(t4c.results.map((r) => [r.formCode, r]));
  const crosswalkByCode = Object.fromEntries(crosswalk.fieldEvidence.map((c) => [c.FORM_CODE, c]));

  const rows = matrix.rows.map((row) => {
    const code = row.FORM_CODE;
    let verdict;
    let route;
    let evidenceSource;
    let promotionClass;

    if (row.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE") {
      const persisted = persistedByCode[code];
      verdict = persisted?.verdict ?? "FAIL";
      route = row.PERSISTED_ROUTE;
      // Promotion class: existing if standalone route == null and CURRENT_RUNTIME_READY == true, else new
      promotionClass = row.PROMOTION_CLASS === "EXISTING_RUNTIME_READY_REVALIDATION" ? "EXISTING_RUNTIME_READY_REVALIDATION" : "NEW_PROMOTION_CANDIDATE";
      evidenceSource = persisted?.provenance?.[0]?.source ?? "missing-evidence";
    } else {
      const standalone = standaloneByCode[code];
      verdict = standalone?.verdict ?? "FAIL";
      route = row.STANDALONE_ROUTE;
      promotionClass = "EXISTING_RUNTIME_READY_REVALIDATION";
      evidenceSource = "turn4-standalone-6-results";
    }

    return {
      FORM_CODE: code,
      LIFECYCLE: row.SUPPORTED_BROWSER_LIFECYCLE,
      VERDICT: verdict,
      ROUTE: route,
      PROMOTION_CLASS: promotionClass,
      EVIDENCE_SOURCE: evidenceSource,
      CROSSWALK_VERDICT: crosswalkByCode[code]?.FINAL_VERDICT ?? null,
      IS_CANARY: canaryByCode[code] != null,
      DOCX_SHA: hash({ row, verdict }),
    };
  });

  const pass = rows.filter((r) => r.VERDICT === "PASS").length;
  const fail = rows.filter((r) => r.VERDICT !== "PASS").length;

  const out = {
    schema: "qllaw.phase14.turn4_final_83_form_lifecycle_verdicts/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    summary: {
      totalRows: rows.length,
      pass,
      fail,
      persistedLifecyclePass: rows.filter((r) => r.LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE" && r.VERDICT === "PASS").length,
      standaloneLifecyclePass: rows.filter((r) => r.LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW" && r.VERDICT === "PASS").length,
      promotionEligible: rows.length,
    },
    rows,
  };

  await writeFile(OUT, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out.summary, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-final-83] fatal:", err);
  process.exit(1);
});
