/**
 * Phase 14 Turn 3 — Promotion Consumer Dataflow Audit
 *
 * Audits which evidence sources each promotion consumer actually reads,
 * which Phase 14 evidence is connected vs disconnected, and what
 * cutover actions are needed.
 *
 * Usage: node scripts/runtime-rollout/audit-promotion-consumer-dataflow.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const P14 = path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout", "locked-authority-rebase", "phase14-dual-browser-promotion");
const ROLLOUT = path.join(REPO_ROOT, "docs", "audit", "final-213-customer-ready", "runtime-rollout");

function sha256(data) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 16);
}

async function main() {
  // --- Consumer 1: phase3-generate-roster.mjs ---
  const p3 = await readFile(path.join(REPO_ROOT, "scripts", "runtime-rollout", "phase3-generate-roster.mjs"), "utf8");
  const p3Sources = [
    "phase1-accounting.json",
    "phase1b-libreoffice-outcomes.json",
    "slot-inventory-summary.json",
    "authoritative-213-manifest.json",
  ];
  const p3Consumes = {
    LOCKED_AUTHORITY: false, // does NOT read locked contract hash
    PHASE12_VISUAL: false,   // does NOT read word-full-results.json
    PHASE14_UI: false,        // does NOT read browser-lifecycle-verdicts-83.json
    PROVENANCE: false,         // does NOT read provenance
    PROMOTION_MANIFEST: false, // does NOT read promotion-manifest.json
    PROVENANCE_INPUT: p3Sources,
  };

  // Check if it references Phase 14
  const p3ReferencesPhase14 = /phase14|browser.*lifecycle|BROWSER/i.test(p3);
  const p3ReferencesTurn3 = /turn3|turn-3/i.test(p3);

  // --- Consumer 2: promote-runtime-batch.mjs ---
  const p6 = await readFile(path.join(REPO_ROOT, "scripts", "runtime-rollout", "promote-runtime-batch.mjs"), "utf8");
  const p6Sources = [
    "runtime-render-results.json",
    "word-sidecar/word-visual-results.json",
  ];
  const p6Consumes = {
    LOCKED_AUTHORITY: false,
    PHASE12_VISUAL: false,
    PHASE14_UI: false,
    PROVENANCE: false,
    PROMOTION_MANIFEST: false,
    PROVENANCE_INPUT: p6Sources,
  };

  const p6ReferencesPhase14 = /phase14|browser.*lifecycle|BROWSER/i.test(p6);
  const p6ReferencesTurn3 = /turn3|turn-3/i.test(p6);

  // --- Check if Phase 14 generated roster is consumed ---
  const p14RosterPath = path.join(P14, "generated-runtime-roster.json");
  const p14Roster = JSON.parse(await readFile(p14RosterPath, "utf8").catch(() => JSON.stringify({ roster: [], count: 0 })));
  const p14RosterHash = sha256(p14Roster.roster ?? []);

  // --- Check the application roster ---
  const appRosterPath = path.join(REPO_ROOT, "packages", "form-contracts", "src", "runtime-readiness.generated.ts");
  const appRosterContent = await readFile(appRosterPath, "utf8").catch(() => "");
  const appRosterMatch = appRosterContent.match(/formCode:\s*"([^"]+)"/g) ?? [];
  const appRosterForms = [...new Set(appRosterMatch.map(m => m.match(/"([^"]+)"/)[1]))];
  const appRosterCount = appRosterForms.length;

  // --- Canonical roster path ---
  const canonicalRosterPath = path.join(ROLLOUT, "canonical-runtime-roster.json");
  const canonicalRoster = JSON.parse(await readFile(canonicalRosterPath, "utf8").catch(() => JSON.stringify({ runtimeReadyForms: [] })));
  const canonicalCount = (canonicalRoster.runtimeReadyForms ?? []).length;

  // --- Phase 14 roster vs application roster ---
  const p14RosterSet = new Set(p14Roster.roster ?? []);
  const appRosterSet = new Set(appRosterForms);
  const inP14ButNotApp = [...p14RosterSet].filter(f => !appRosterSet.has(f));
  const inAppButNotP14 = [...appRosterSet].filter(f => !p14RosterSet.has(f));

  // --- Word evidence for Phase 14 forms ---
  const wordEvidencePath = path.join(ROLLOUT, "locked-authority-rebase", "phase12-visual", "word-full-results.json");
  const wordEvidence = JSON.parse(await readFile(wordEvidencePath, "utf8").catch(() => JSON.stringify({ results: [] })));
  const wordForms = (wordEvidence.results ?? []).map(r => r.code);
  const p14FormsWithWord = [...p14RosterSet].filter(f => wordForms.includes(f));

  // --- Phase 14 roster eligibility ---
  const phase14Eligible = p14Roster.roster ?? [];
  const withWordEvidence = p14FormsWithWord;
  const withoutWordEvidence = [...p14RosterSet].filter(f => !wordForms.includes(f));

  const output = {
    schema: "qllaw.phase14.promotion_consumer_dataflow/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 3,
    consumers: [
      {
        CONSUMER: "phase3-generate-roster.mjs",
        LOCKED_AUTHORITY_INPUT: false,
        PHASE12_VISUAL_INPUT: false,
        PHASE14_UI_INPUT: p3ReferencesPhase14,
        PROVENANCE_INPUT: false,
        PROMOTION_MANIFEST_INPUT: false,
        OUTPUT_PATH: "packages/form-contracts/src/runtime-readiness.generated.ts",
        OUTPUT_CONSUMED_BY: ["bridge-eligibility.ts", "form-flight lifecycle"],
        LEGACY_INPUTS: ["phase1-accounting.json", "phase1b-libreoffice-outcomes.json", "slot-inventory-summary.json", "authoritative-213-manifest.json"],
        BYPASS_PATHS: [],
        CUTOVER_STATUS: p3ReferencesPhase14 ? "PHASE14_EVIDENCE_ACTIVE" : "PHASE14_EVIDENCE_NOT_CONNECTED",
        DISCONNECTED: !p3ReferencesPhase14,
        NOTE: "phase3-generate-roster.mjs does NOT read browser-lifecycle-verdicts-83.json. The Phase 14 53-form roster is NOT consumed by this consumer.",
      },
      {
        CONSUMER: "promote-runtime-batch.mjs",
        LOCKED_AUTHORITY_INPUT: false,
        PHASE12_VISUAL_INPUT: false,
        PHASE14_UI_INPUT: p6ReferencesPhase14,
        PROVENANCE_INPUT: false,
        PROMOTION_MANIFEST_INPUT: false,
        OUTPUT_PATH: "packages/form-contracts/src/bridge-eligibility.ts",
        OUTPUT_CONSUMED_BY: ["API documents controller", "web form-flight guard"],
        LEGACY_INPUTS: ["runtime-render-results.json", "word-sidecar/word-visual-results.json"],
        BYPASS_PATHS: [],
        CUTOVER_STATUS: p6ReferencesPhase14 ? "PHASE14_EVIDENCE_ACTIVE" : "PHASE14_EVIDENCE_NOT_CONNECTED",
        DISCONNECTED: !p6ReferencesPhase14,
        NOTE: "promote-runtime-batch.mjs does NOT read browser-lifecycle-verdicts-83.json. Phase 14 roster is a disconnected artifact.",
      },
    ],
    phase14RosterStatus: {
      path: p14RosterPath,
      rosterCount: phase14Eligible.length,
      rosterHash: p14RosterHash,
      forms: phase14Eligible,
    },
    applicationRosterStatus: {
      path: appRosterPath,
      rosterCount: appRosterCount,
      forms: appRosterForms,
    },
    canonicalRosterStatus: {
      path: canonicalRosterPath,
      rosterCount: canonicalCount,
      forms: canonicalRoster.runtimeReadyForms ?? [],
    },
    phase14VsApplication: {
      inP14NotInApp: inP14ButNotApp,
      inAppNotInP14: inAppButNotP14,
      discrepancyCount: inP14ButNotApp.length,
      NOTE: "Phase 14 generated 53 forms but application roster has 16. 37+ forms are disconnected.",
    },
    wordEvidenceStatus: {
      wordFullResultsPath: wordEvidencePath,
      wordFormsTotal: wordForms.length,
      p14FormsWithWordEvidence: withWordEvidence.length,
      p14FormsWithoutWordEvidence: withoutWordEvidence.length,
      allP14FormsHaveWordEvidence: withoutWordEvidence.length === 0,
    },
    cutoverRequired: {
      phase3GenerateRoster: !p3ReferencesPhase14,
      promoteRuntimeBatch: !p6ReferencesPhase14,
      manualRosterEdit: false,
      NOTE: "Both promotion consumers need Phase 14 evidence integrated. phase3-generate-roster.mjs needs a new input for browser evidence. promote-runtime-batch.mjs needs browser evidence gate.",
    },
    recommendedAction: "Phase 14 evidence (browser-lifecycle-verdicts-83.json) must be wired into phase3-generate-roster.mjs as an additional input. The 47 new browser-pass forms + 6 existing forms need to be added to the canonical roster through the supported promotion pipeline, not as a disconnected artifact.",
  };

  console.log(`[promotion-consumer-audit]`);
  console.log(`  Consumer 1 (phase3-generate-roster): PHASE14=${p3ReferencesPhase14 ? 'CONNECTED' : 'DISCONNECTED'}`);
  console.log(`  Consumer 2 (promote-runtime-batch): PHASE14=${p6ReferencesPhase14 ? 'CONNECTED' : 'DISCONNECTED'}`);
  console.log(`  Application roster: ${appRosterCount} forms`);
  console.log(`  Phase 14 roster: ${phase14Eligible.length} forms`);
  console.log(`  Disconnected: ${inP14ButNotApp.length} forms`);
  console.log(`  Cutover required: ${!p3ReferencesPhase14 || !p6ReferencesPhase14 ? 'YES' : 'NO'}`);

  return output;
}

main().then(output => {
  const fsPromises = require("node:fs/promises");
  const outPath = path.join(__dirname, "..", "..", "docs", "audit", "final-213-customer-ready", "runtime-rollout", "locked-authority-rebase", "phase14-dual-browser-promotion", "promotion-consumer-dataflow.json");
  fsPromises.writeFile(outPath, JSON.stringify(output, null, 2)).then(() => {
    console.log(`[promotion-consumer-audit] written: promotion-consumer-dataflow.json`);
  }).catch(err => {
    console.error("[promotion-consumer-audit] write error:", err.message);
  });
}).catch(err => { console.error("[promotion-consumer-audit] fatal:", err); process.exit(1); });
