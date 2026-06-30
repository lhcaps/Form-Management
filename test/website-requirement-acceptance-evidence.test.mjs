import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEvidenceGateChecks,
  parseCsvRecords,
} from "../scripts/audit/lib/website-requirement-acceptance-evidence.mjs";

test("parseCsvRecords handles quoted commas in fidelity board rows", () => {
  const csv = [
    "BM,Title,Completion status,Render status",
    'BM-003,"QĐ phân công THQCT, KS việc tiếp nhận",NEEDS_REMEDIATION,PASS',
  ].join("\n");

  assert.deepEqual(parseCsvRecords(csv), [
    {
      BM: "BM-003",
      Title: "QĐ phân công THQCT, KS việc tiếp nhận",
      "Completion status": "NEEDS_REMEDIATION",
      "Render status": "PASS",
    },
  ]);
});

test("buildEvidenceGateChecks fails when semantic fidelity or workflow evidence is incomplete", () => {
  const checks = buildEvidenceGateChecks({
    sampleCoverage: {
      summary: {
        totalManualFields: 10,
        totalFilledFields: 9,
        fullyCovered: 1,
        partiallyCovered: 1,
        zeroCoverage: 0,
      },
    },
    fidelityRows: [
      {
        BM: "BM-001",
        "Completion status": "NEEDS_REMEDIATION",
        "Quality state": "CONTRACT_REPAIR_REQUIRED",
        "Render status": "PASS",
      },
      {
        BM: "BM-063",
        "Completion status": "BLOCKED_BY_HUMAN_DOCX_REVIEW",
        "Quality state": "CONTRACT_REPAIR_REQUIRED",
        "Render status": "FAIL",
      },
    ],
    sotRebase: {
      summary: { totalIssues: 12, critical: 1, high: 2 },
    },
    workflowEvidence: null,
  });

  assert.equal(checks.every((check) => check.status === "FAIL"), true);
  assert.match(
    checks.find((check) => check.id === "DOCX-SEMANTIC-FIDELITY")?.evidence ?? "",
    /2 not final-review-ready/,
  );
  assert.match(
    checks.find((check) => check.id === "E2E-PRIMARY-WORKFLOW")?.evidence ?? "",
    /Missing/,
  );
});

test("buildEvidenceGateChecks rejects workflow evidence without exported user-entered data", () => {
  const checks = buildEvidenceGateChecks({
    sampleCoverage: {
      summary: {
        totalManualFields: 10,
        totalFilledFields: 10,
        partiallyCovered: 0,
      },
    },
    fidelityRows: [
      {
        BM: "BM-001",
        "Completion status": "READY_FOR_FINAL_REVIEW",
        "Quality state": "VERIFIED",
        "Render status": "PASS",
      },
    ],
    sotRebase: {
      summary: { totalIssues: 0, critical: 0, high: 0 },
    },
    workflowEvidence: {
      status: "PASS",
      exportedDocx: {
        hasUnresolvedPlaceholders: false,
        hasGenericBlankLabels: false,
        containsUserEnteredValue: false,
      },
    },
  });

  assert.equal(
    checks.find((check) => check.id === "E2E-PRIMARY-WORKFLOW")?.status,
    "FAIL",
  );
});

test("buildEvidenceGateChecks passes only with complete evidence", () => {
  const checks = buildEvidenceGateChecks({
    sampleCoverage: {
      summary: {
        totalManualFields: 10,
        totalFilledFields: 10,
        fullyCovered: 2,
        partiallyCovered: 0,
        zeroCoverage: 0,
      },
    },
    fidelityRows: [
      {
        BM: "BM-001",
        "Completion status": "READY_FOR_FINAL_REVIEW",
        "Quality state": "VERIFIED",
        "Render status": "PASS",
      },
    ],
    sotRebase: {
      summary: { totalIssues: 0, critical: 0, high: 0 },
    },
    workflowEvidence: {
      status: "PASS",
      exportedDocx: {
        hasUnresolvedPlaceholders: false,
        hasGenericBlankLabels: false,
        containsUserEnteredValue: true,
      },
    },
  });

  assert.equal(checks.every((check) => check.status === "PASS"), true);
});
