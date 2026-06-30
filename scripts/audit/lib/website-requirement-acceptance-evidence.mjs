import { existsSync, readFileSync } from "fs";
import { join } from "path";

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

function readTextIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf-8");
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
      continue;
    }
    cell += char;
  }

  cells.push(cell);
  return cells;
}

export function parseCsvRecords(csvText) {
  const lines = String(csvText ?? "")
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function numberValue(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function check({
  id,
  requirement,
  status,
  evidence,
  severity = "HIGH",
  notes,
}) {
  return {
    id,
    group: "ACCEPTANCE",
    requirement,
    implementationLocation: "docs/audit/** current evidence",
    evidence,
    status,
    severity,
    notes,
  };
}

export function buildEvidenceGateChecks({
  sampleCoverage,
  fidelityRows,
  sotRebase,
  workflowEvidence,
}) {
  const sampleSummary = sampleCoverage?.summary ?? {};
  const totalManualFields = numberValue(sampleSummary.totalManualFields);
  const totalFilledFields = numberValue(sampleSummary.totalFilledFields);
  const partiallyCovered = numberValue(sampleSummary.partiallyCovered);
  const sampleComplete =
    totalManualFields > 0 &&
    totalFilledFields >= totalManualFields &&
    partiallyCovered === 0;

  const notFinalRows = (fidelityRows ?? []).filter(
    (row) => row["Completion status"] !== "READY_FOR_FINAL_REVIEW",
  );
  const contractRepairRows = (fidelityRows ?? []).filter(
    (row) => row["Quality state"] === "CONTRACT_REPAIR_REQUIRED",
  );
  const renderFailRows = (fidelityRows ?? []).filter(
    (row) => row["Render status"] !== "PASS",
  );
  const fidelityClean =
    (fidelityRows ?? []).length > 0 &&
    notFinalRows.length === 0 &&
    contractRepairRows.length === 0 &&
    renderFailRows.length === 0;

  const issueCounts = sotRebase?.issueCounts ?? sotRebase?.summary ?? {};
  const critical = numberValue(issueCounts.critical);
  const high = numberValue(issueCounts.high);
  const totalIssues = numberValue(issueCounts.total ?? issueCounts.totalIssues);
  const sotClean = critical === 0 && high === 0 && totalIssues === 0;

  const workflowPass =
    workflowEvidence?.status === "PASS" &&
    workflowEvidence?.exportedDocx?.hasUnresolvedPlaceholders === false &&
    workflowEvidence?.exportedDocx?.hasGenericBlankLabels === false &&
    workflowEvidence?.exportedDocx?.containsUserEnteredValue === true;

  return [
    check({
      id: "SAMPLE-DATA-FULL-FILL",
      requirement: "Generated sample/default data must cover every manual field or document an explicit non-manual reason.",
      status: sampleComplete ? "PASS" : "FAIL",
      evidence: `${totalFilledFields}/${totalManualFields} manual fields filled; ${partiallyCovered} partially-covered forms.`,
      notes: sampleComplete
        ? "All manual fields have generated values."
        : "No-blank acceptance cannot pass while manual fields still lack generated values.",
    }),
    check({
      id: "DOCX-SEMANTIC-FIDELITY",
      requirement: "All 213 DOCX forms must be semantically final-review-ready with clean render evidence.",
      status: fidelityClean ? "PASS" : "FAIL",
      evidence: `${notFinalRows.length} not final-review-ready; ${contractRepairRows.length} contract-repair-required; ${renderFailRows.length} render failures.`,
      notes: fidelityClean
        ? "Fidelity board has no remaining semantic/render blockers."
        : "Render PASS alone is not enough; completion, quality, and render columns must all be clean.",
    }),
    check({
      id: "SOT-SEMANTIC-ISSUES",
      requirement: "Source-of-truth audit must have zero critical/high semantic issues before READY_ABSOLUTE.",
      status: sotClean ? "PASS" : "FAIL",
      evidence: `${totalIssues} total SOT issues; ${critical} critical; ${high} high.`,
      notes: sotClean
        ? "SOT rebase audit is clean."
        : "Locked/compiled/runtime sync is insufficient when semantic SOT issues remain.",
    }),
    check({
      id: "E2E-PRIMARY-WORKFLOW",
      requirement: "A user can choose/open a form, enter data, save, export DOCX, and the DOCX has no unresolved placeholders or generic blank labels.",
      status: workflowPass ? "PASS" : "FAIL",
      evidence: workflowEvidence
        ? `Workflow evidence status=${workflowEvidence.status}; exportedDocx=${JSON.stringify(workflowEvidence.exportedDocx ?? {})}.`
        : "Missing docs/audit/website-requirement-acceptance-v1/workflow-e2e.latest.json.",
      notes: workflowPass
        ? "Primary user workflow evidence is present and clean."
        : "READY_ABSOLUTE requires a dedicated end-to-end workflow artifact, not only smoke tests.",
    }),
  ];
}

export function loadAcceptanceEvidence(projectRoot) {
  const sampleCoverage = readJsonIfExists(
    join(projectRoot, "docs", "audit", "sample-data-coverage-v1", "latest.json"),
  );
  const fidelityCsv = readTextIfExists(
    join(projectRoot, "docs", "audit", "213-docx-fidelity-board", "per-bm.csv"),
  );
  const sotRebase = readJsonIfExists(
    join(projectRoot, "docs", "audit", "sot-rebase-v1", "latest.json"),
  );
  const workflowEvidence = readJsonIfExists(
    join(projectRoot, "docs", "audit", "website-requirement-acceptance-v1", "workflow-e2e.latest.json"),
  );

  return {
    sampleCoverage,
    fidelityRows: fidelityCsv ? parseCsvRecords(fidelityCsv) : [],
    sotRebase,
    workflowEvidence,
  };
}
