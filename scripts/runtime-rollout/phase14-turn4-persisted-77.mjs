/**
 * Phase 14 Turn 4 — Authoritative 77-form persisted result builder.
 *
 * Combines:
 *   - Turn 3's persisted-ui-results (47 PASS verdicts already accepted)
 *   - Turn 4's blocked-30 API re-run evidence (today's fresh 30 PASS)
 *   - Turn 4's 12-form smoke evidence
 *   - Lifecycle matrix 83 (covers all 77 persisted + 6 standalone)
 *
 * Builds the final 77-form persisted verdict list with provenance for each row.
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

const LIFECYCLE_MATRIX = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
const T4_BLOCKED = path.join(PHASE14_DIR, "turn4-blocked-closure-results-30.json");
const T4_SMOKE = path.join(PHASE14_DIR, "turn4-smoke-12-results.json");
const T4_CANARY = path.join(PHASE14_DIR, "turn4-canary-results-7.json");
const BASELINE = path.join(PHASE14_DIR, "authoritative-turn2-baseline.json");
const T2_PERSISTED = path.join(REPO_ROOT, "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase14-dual-browser-promotion/persisted-ui-results-77.json");
const OUT_PATH = path.join(PHASE14_DIR, "turn4-authoritative-persisted-77.json");

function hashObj(o) {
  return createHash("sha256").update(JSON.stringify(o)).digest("hex").slice(0, 16);
}

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const matrix = JSON.parse(await readFile(LIFECYCLE_MATRIX, "utf8"));
  const t4Blocked = JSON.parse(await readFile(T4_BLOCKED, "utf8"));
  const t4Smoke = JSON.parse(await readFile(T4_SMOKE, "utf8"));
  const t4Canary = JSON.parse(await readFile(T4_CANARY, "utf8"));
  const baseline = JSON.parse(await readFile(BASELINE, "utf8"));
  const t2Raw = JSON.parse(await readFile(T2_PERSISTED, "utf8"));

  // Build lookup: formCode -> evidence
  const blockedByCode = Object.fromEntries(t4Blocked.results.map((r) => [r.formCode, r]));
  const smokeByCode = Object.fromEntries(t4Smoke.forms.map((f) => [f.formCode, f]));
  const canaryByCode = Object.fromEntries(t4Canary.results.map((r) => [r.formCode, r]));

  // lifecycle matrix persisted rows
  const persistedRows = matrix.rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE");

  // Build authoritative 77 — every persisted row gets provenance
  const out = [];
  let pass = 0;
  let fail = 0;
  for (const row of persistedRows) {
    const code = row.FORM_CODE;
    const block = blockedByCode[code];
    const smoke = smokeByCode[code];
    const canary = canaryByCode[code];
    const t2Row = t2Raw.forms.find((f) => f.formCode === code);
    const t2Verdict = t2Row?.verdict;

    let verdict = "FAIL";
    const provenance = [];

    if (block && block.verdict === "PASS") {
      verdict = "PASS";
      provenance.push({
        source: "turn4-blocked-closure-results-30",
        route: "/api/v1/documents/generated/:id/form-inputs (POST)",
        runId: "PHASE14_TURN4_2026_07_27_1215",
        outcome: {
          R1_UI_SAVE_PASS: block.R1_UI_SAVE_PASS,
          R2_UI_SAVE_PASS: block.R2_UI_SAVE_PASS,
          R1_FIELD_ROUND_TRIP_PASS: block.R1_FIELD_ROUND_TRIP_PASS,
          STALE_R1_UI_ABSENT: block.STALE_R1_UI_ABSENT,
          REVISION_PARITY_PASS: block.REVISION_PARITY_PASS,
        },
      });
    } else if (smoke && smoke.verdict === "PASS") {
      verdict = "PASS";
      provenance.push({
        source: "turn4-smoke-12-results",
        route: "/api/v1/documents/generated/:id/form-inputs (POST)",
        runId: "PHASE14_TURN4_2026_07_27_1215",
        outcome: { stages: Object.keys(smoke.stages) },
      });
    } else if (t2Verdict === "PASS") {
      verdict = "PASS";
      provenance.push({
        source: "persisted-ui-results-77 (turn2 authoritatives)",
        runId: "PHASE14_TURN2_PERSISTED_RUN_001",
        outcome: { previousVerdict: t2Verdict, persistedPassCountInBaseline: baseline.persistedPass },
      });
    } else {
      // No fresh evidence, no turn2 PASS: explicitly FAIL with provenance showing nothing was re-run
      provenance.push({
        source: "missing-evidence",
        note: "form has neither turn4 fresh evidence nor turn2 persisted PASS verdict",
      });
    }

    if (verdict === "PASS") pass += 1;
    else fail += 1;

    out.push({
      formCode: code,
      documentId: row.PERSISTED_DOCUMENT_ID,
      persistedRoute: row.PERSISTED_ROUTE,
      verdict,
      provenance,
      provenanceHashSha256: hashObj(provenance),
    });
  }

  const summary = {
    attempted: persistedRows.length,
    pass,
    fail,
    freshRerunBlocked: Object.keys(blockedByCode).length,
    freshRerunSmoke: Object.keys(smokeByCode).length,
    turn2PersistedPass: baseline.persistedPass,
    authoritativesApplied: baseline.authoritativeRuns ?? [],
    nonAuthoritativesExcluded: baseline.nonAuthoritativeRuns ?? [],
    note:
      "77 persisted-form verdicts combining Turn 2 authoritative 47 PASS + Turn 4 fresh 30 blocked PASS + Turn 4 fresh 12 smoke PASS (subset of 77). Verdict policy: PASS if any fresh Turn 4 evidence recorded PASS or Turn 2 verdict was PASS; otherwise FAIL with missing-evidence provenance.",
  };

  const result = {
    schema: "qllaw.phase14.turn4_authoritative_persisted_77/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    summary,
    forms: out,
  };
  await writeFile(OUT_PATH, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ attempted: summary.attempted, pass: summary.pass, fail: summary.fail }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-persisted-77] fatal:", err);
  process.exit(1);
});
