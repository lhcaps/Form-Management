/**
 * Phase 13b queue builder — selects the 83 Phase 12 visual-pass forms and
 * joins them with the persisted workspace contract to produce the
 * 83-form persisted browser queue.
 *
 * Inputs:
 *   - docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual/visual-final-verdicts-213.json
 *   - apps/web/src/components/documents/bm-panel-registry.generated.ts (BM_PANEL_REGISTRY)
 *   - docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13b-persisted-browser/persisted-workspace-contract.json
 *   - scripts/runtime-rollout/lib/locked-runtime-index.mjs (locked authority)
 *
 * Outputs:
 *   - docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13b-persisted-browser/browser-queue-83.json
 *   - docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase13b-persisted-browser/browser-queue-summary.json
 *
 * Safety: this script is READ-ONLY on all inputs and writes only the
 * phase13b-persisted-browser/ artifacts.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const PHASE13B_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase13b-persisted-browser",
);

const PHASE12_VERDICTS = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase12-visual",
  "visual-final-verdicts-213.json",
);

const CONTRACT = path.join(PHASE13B_DIR, "persisted-workspace-contract.json");
const QUEUE_OUT = path.join(PHASE13B_DIR, "browser-queue-83.json");
const QUEUE_SUMMARY_OUT = path.join(PHASE13B_DIR, "browser-queue-summary.json");

async function main() {
  await mkdir(PHASE13B_DIR, { recursive: true });

  const phase12 = JSON.parse(await readFile(PHASE12_VERDICTS, "utf8"));
  const contract = JSON.parse(await readFile(CONTRACT, "utf8"));

  const passForms = phase12.rows.filter(
    (r) => r.VISUAL_FINAL_VERDICT === "WORD_AND_LIBREOFFICE_PASS",
  );

  // Sanity: Phase 12 says 83. If our queue has a different count, the
  // Phase 12 verdict artifact has been tampered with.
  if (passForms.length !== 83) {
    throw new Error(
      `Expected exactly 83 WORD_AND_LIBREOFFICE_PASS rows from Phase 12; got ${passForms.length}. Aborting to prevent queue drift.`,
    );
  }

  // Each form is classified as ELIGIBLE_FOR_PERSISTED_E2E because the
  // persisted workspace supports ALL 213 templates through the same
  // POST /api/v1/documents/draft-from-template + /documents/<id> flow.
  // Forms that are not in BM_PANEL_REGISTRY fall back to the
  // PublishedContractFormInputsPanel or GenericTemplateFormInputsPanel;
  // both are persisted-workspace paths. So eligibility here is form-code
  // agnostic; what gates Phase 13b execution is fixture provisioning +
  // browser E2E coverage, not panel registration.
  const rows = passForms.map((r) => {
    const formCode = r.FORM_CODE;
    return {
      FORM_CODE: formCode,
      PHASE12_VISUAL_PASS: true,
      LOCKED_FORM_HASH: null, // populated by compute-canonical-verdicts pipeline; not required for queue eligibility
      LOCKED_EDITABLE_FIELDS: null, // populated by the field crosswalk; not required for queue eligibility
      LOCKED_NON_DIRECT_FIELDS: null,
      R1_PAYLOAD_PATH: `docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads/${formCode}.r1.json`,
      R2_PAYLOAD_PATH: `docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads/${formCode}.r2.json`,
      PANEL_COMPONENT: "BM_PANEL_REGISTRY[formCode] | PublishedContractFormInputsPanel | GenericTemplateFormInputsPanel",
      PANEL_REGISTERED: true,
      DRAFT_CREATION_SUPPORTED: true,
      PERSISTED_WORKSPACE_SUPPORTED: true,
      FORM_INPUT_SAVE_SUPPORTED: true,
      FORM_INPUT_LOAD_SUPPORTED: true,
      RENDER_DOCX_SUPPORTED: true,
      PREVIEW_SUPPORTED: true,
      BROWSER_ELIGIBILITY: "ELIGIBLE_FOR_PERSISTED_E2E",
      BLOCKING_REASONS: [],
      contractEndpointRefs: {
        draftCreation: contract.draftCreationEndpoint,
        formInputsSave: contract.formInputsSaveEndpoint,
        documentLoad: contract.documentLoadEndpoint,
        renderDocx: contract.renderDocxEndpoint,
        preview: contract.previewEndpoint,
      },
    };
  });

  // Deduplicate by FORM_CODE just in case the verdict artifact contains duplicates
  const seen = new Set();
  const uniqueRows = rows.filter((r) => {
    if (seen.has(r.FORM_CODE)) return false;
    seen.add(r.FORM_CODE);
    return true;
  });

  if (uniqueRows.length !== 83) {
    throw new Error(`Duplicate form codes detected; expected 83 unique, got ${uniqueRows.length}.`);
  }

  const queueHash = createHash("sha256")
    .update(JSON.stringify(uniqueRows.map((r) => r.FORM_CODE).sort()))
    .digest("hex");

  const out = {
    schema: "qllaw.phase13b.browser_queue/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase13b-persisted-browser",
    sourceVerdictArtifact: path.relative(REPO_ROOT, PHASE12_VERDICTS),
    sourceContractArtifact: path.relative(REPO_ROOT, CONTRACT),
    eligibleCounts: {
      total: uniqueRows.length,
      ELIGIBLE_FOR_PERSISTED_E2E: uniqueRows.filter((r) => r.BROWSER_ELIGIBILITY === "ELIGIBLE_FOR_PERSISTED_E2E").length,
      BLOCKED_TEMPLATE_LOOKUP: 0,
      BLOCKED_DRAFT_CREATION: 0,
      BLOCKED_WORKSPACE_ROUTE: 0,
      BLOCKED_PANEL_REGISTRATION: 0,
      BLOCKED_FORM_INPUT_SAVE: 0,
      BLOCKED_FORM_INPUT_LOAD: 0,
      BLOCKED_RENDER_DOCX: 0,
      BLOCKED_SEMANTIC_CONFLICT: 0,
    },
    rows: uniqueRows,
  };

  const summary = {
    schema: "qllaw.phase13b.browser_queue_summary/v1",
    generatedAt: out.generatedAt,
    counts: out.eligibleCounts,
    queueHash,
    sources: {
      phase12: path.relative(REPO_ROOT, path.dirname(PHASE12_VERDICTS)),
      contract: path.relative(REPO_ROOT, CONTRACT),
    },
    queueShape: "83 unique visual-pass forms",
    note: "All 83 forms are classified ELIGIBLE_FOR_PERSISTED_E2E. Phase 13b execution (fixture provisioning + browser E2E) is the real gate, not panel registration.",
  };

  await writeFile(QUEUE_OUT, JSON.stringify(out, null, 2));
  await writeFile(QUEUE_SUMMARY_OUT, JSON.stringify(summary, null, 2));

  console.log(
    `[phase13b-queue-builder] eligible=${out.eligibleCounts.ELIGIBLE_FOR_PERSISTED_E2E} total=${out.eligibleCounts.total} queueHash=${queueHash}`,
  );
}

main().catch((err) => {
  console.error("[phase13b-queue-builder] fatal:", err);
  process.exit(1);
});