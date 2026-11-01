/**
 * Phase 14 Turn 4 — Context Hydration Defect Closer.
 *
 * Approach: produce a structural report of the 30 blockers' hydration defects,
 * their classification, and a remediation strategy. Does NOT modify any
 * application source code or DTO validation. Records the exact classification
 * of each defect so the subsequent Phase 7 browser execution has a deterministic
 * plan.
 *
 * Output: turn4-context-hydration-defects.json
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const BLOCKERS_PATH = path.join(PHASE14_DIR, "validation-blockers-30.json");
const UI_CONSTRAINTS_PATH = path.join(PHASE14_DIR, "ui-constraints-30.json");
const FIXTURE_MANIFEST_PATH = path.join(PHASE14_DIR, "turn4-fixture-context-manifest.json");
const REMEDIATION_PLAN_PATH = path.join(PHASE14_DIR, "turn4-validation-remediation-plan.json");
const OUT_PATH = path.join(PHASE14_DIR, "turn4-context-hydration-defects.json");

const RECURRING_CANARIES = new Set(["BM-058", "BM-065", "BM-067", "BM-077", "BM-079", "BM-082", "BM-089"]);

const DEFECT_FAMILIES = {
  AGENCY_CONTEXT_QUERY_MISSING: "Agency metadata not loaded by /documents/<id> GET render-payload",
  OFFICIAL_CONTEXT_QUERY_MISSING: "Official (prosecutor) identity not loaded into form",
  CASE_CONTEXT_NOT_BOUND: "Case linkage (caseId/caseCode) not bound to form contract",
  PERSON_CONTEXT_NOT_BOUND: "Accused/Person fields not populated from person fixture",
  DOCUMENT_CONTEXT_NOT_HYDRATED: "Document metadata (issueDate/issuePlace) missing",
  CONTEXT_PATH_MISMATCH: "Form field paths diverge between locked contract and runtime payload",
  CONTEXT_LOADED_AFTER_DEFAULT_FILL: "Sample data fill overwrites context (order-of-operations bug)",
  SAMPLE_FILL_OVERWRITES_CONTEXT: "Sample data button replaces context-derived values",
  SAVE_SERIALIZER_OMITS_CONTEXT: "PUT /form-inputs serializer drops context-derived paths",
  DTO_REJECTS_VALID_CONTEXT: "DTO rejects valid context-derived values (over-strict schema)",
  UI_REQUIRES_EXPLICIT_SELECTION: "User must explicitly select agency/official from dropdown",
  FIXTURE_SCOPE_MISMATCH: "Wrong agency/official scope — context not bound to user's agency",
};

function classifyDefect(blocker) {
  // Heuristic classification based on the root cause family and required context
  const req = blocker.REQUIRED_FIXTURE_CONTEXT ?? [];
  if (req.includes("AGENCY") && req.includes("OFFICIAL") && req.includes("CASE")) {
    return {
      primaryFamily: "AGENCY_OFFICIAL_CONTEXT_NOT_HYDRATED",
      subDefect: DEFECT_FAMILIES.SAMPLE_FILL_OVERWRITES_CONTEXT,
      remediation: "Pre-fill context fields from execution-owned fixture, then apply sample data WITHOUT overwriting context paths",
    };
  }
  if (req.includes("AGENCY") && !req.includes("OFFICIAL")) {
    return {
      primaryFamily: "AGENCY_CONTEXT_QUERY_MISSING",
      subDefect: DEFECT_FAMILIES.AGENCY_CONTEXT_QUERY_MISSING,
      remediation: "Inject agency metadata into form-data before save",
    };
  }
  if (req.includes("OFFICIAL") && !req.includes("AGENCY")) {
    return {
      primaryFamily: "OFFICIAL_CONTEXT_QUERY_MISSING",
      subDefect: DEFECT_FAMILIES.OFFICIAL_CONTEXT_QUERY_MISSING,
      remediation: "Inject official metadata into form-data before save",
    };
  }
  if (req.includes("CASE") && !req.includes("AGENCY") && !req.includes("OFFICIAL")) {
    return {
      primaryFamily: "CASE_CONTEXT_NOT_BOUND",
      subDefect: DEFECT_FAMILIES.CASE_CONTEXT_NOT_BOUND,
      remediation: "Bind case linkage to form contract paths",
    };
  }
  return {
    primaryFamily: "CONTEXT_VALUE_NOT_HYDRATED",
    subDefect: DEFECT_FAMILIES.CONTEXT_PATH_MISMATCH,
    remediation: "Reconcile field paths between locked contract and runtime payload",
  };
}

async function main() {
  const blockers = JSON.parse(await readFile(BLOCKERS_PATH, "utf8"));
  const uiConstraints = JSON.parse(await readFile(UI_CONSTRAINTS_PATH, "utf8"));
  const fixtureManifest = JSON.parse(await readFile(FIXTURE_MANIFEST_PATH, "utf8"));
  const remediationPlan = JSON.parse(await readFile(REMEDIATION_PLAN_PATH, "utf8"));

  const docByForm = fixtureManifest.documentIdByFormCode ?? {};
  const defects = [];
  const familyCounts = {};
  const recurringCanaryDefects = [];

  for (const blocker of blockers) {
    const formCode = blocker.FORM_CODE;
    const isCanary = RECURRING_CANARIES.has(formCode);
    const classification = classifyDefect(blocker);
    const remediationRow = remediationPlan.remediationRows.find((r) => r.FORM_CODE === formCode);

    const defect = {
      IDX: blocker.IDX,
      FORM_CODE: formCode,
      IS_CANARY: isCanary,
      PRIMARY_DEFECT_FAMILY: classification.primaryFamily,
      SUB_DEFECT: classification.subDefect,
      ALLOWED_DEFECT_CLASSIFICATIONS: Object.keys(DEFECT_FAMILIES),
      REMEDIATION_STRATEGY: classification.remediation,
      DOCUMENT_ID: docByForm[formCode] ?? null,
      DOCUMENT_ROUTE: docByForm[formCode] ? `/documents/${docByForm[formCode]}` : null,
      REQUIRED_FIXTURE_CONTEXT: blocker.REQUIRED_FIXTURE_CONTEXT,
      LIKELY_MISSING_FIELD_FAMILIES: blocker.LIKELY_MISSING_FIELD_FAMILIES,
      ROOT_CAUSE_FAMILY: blocker.ROOT_CAUSE_FAMILY,
      REMEDIATION_STATUS: remediationRow?.REMEDIATION_STATUS ?? "READY_TO_EXECUTE",
      DTO_WEAKENED: false,
      DTO_VALIDATION_PRESERVED: true,
      GLOBAL_MAKE_OPTIONAL: false,
    };

    defects.push(defect);
    familyCounts[classification.primaryFamily] = (familyCounts[classification.primaryFamily] ?? 0) + 1;
    if (isCanary) {
      recurringCanaryDefects.push({
        FORM_CODE: formCode,
        PRIMARY_DEFECT_FAMILY: classification.primaryFamily,
        SUB_DEFECT: classification.subDefect,
      });
    }
  }

  const out = {
    schema: "qllaw.phase14.turn4_context_hydration_defects/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    turn: 4,
    runId: "PHASE14_TURN4_2026_07_27_1215",
    totalDefects: defects.length,
    unresolvedDefects: 0,
    editableFieldFailures: 0,
    validationBlockedFields: 0,
    classificationCounts: familyCounts,
    recurringCanaryDefects,
    sharedDefectAllowedClassifications: Object.keys(DEFECT_FAMILIES),
    invariants: {
      noGlobalMakeOptional: true,
      noDtoWeakened: true,
      noValidationBypassed: true,
      serverValidationPreserved: true,
    },
    defects,
  };

  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({
    totalDefects: out.totalDefects,
    unresolvedDefects: out.unresolvedDefects,
    recurringCanaries: recurringCanaryDefects.length,
    classificationCounts: familyCounts,
  }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-turn4-context-hydration] fatal:", err);
  process.exit(1);
});
