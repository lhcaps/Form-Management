import { existsSync, readFileSync } from "node:fs";

export const HOLDOUT_PARTIAL_CODES = [
  "BM-024", "BM-039", "BM-041", "BM-049", "BM-050", "BM-051",
  "BM-077", "BM-079", "BM-082", "BM-089", "BM-099", "BM-200",
];

export function validateHoldoutRuntimeEvidence(outDir) {
  const artifactPath = `${outDir}/QLLAW_HOLDOUT_12_RUNTIME_EVIDENCE.latest.json`;
  if (!existsSync(artifactPath)) {
    throw new Error(`missing required artifact: holdout runtime evidence artifact (${artifactPath})`);
  }

  let artifact;
  try {
    artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
  } catch (error) {
    throw new Error(`invalid JSON in holdout runtime evidence artifact: ${error.message}`);
  }

  const expected = new Set(HOLDOUT_PARTIAL_CODES);
  const actualCodes = artifact.holdoutCodes || [];
  if (
    artifact.status !== "PASS" ||
    artifact.totalForms !== expected.size ||
    artifact.passed !== expected.size ||
    artifact.failed !== 0 ||
    actualCodes.length !== expected.size ||
    actualCodes.some((code) => !expected.has(code)) ||
    artifact.formFlightRuntimeReadyPromoted !== 0 ||
    artifact.visualHumanReviewPromoted !== 0
  ) {
    throw new Error("holdout runtime evidence artifact is incomplete or makes a forbidden readiness promotion");
  }

  const approved = new Set();
  for (const form of artifact.forms || []) {
    if (!expected.has(form.templateCode)) continue;
    if (
      form.status === "PASS" &&
      form.browserVerified === true &&
      form.demoClickVerified === true &&
      form.previewClickVerified === true &&
      form.docxDownloadVerified === true &&
      form.pdfExportVerified === true &&
      form.persisted === false
    ) {
      approved.add(form.templateCode);
    }
  }
  if (approved.size !== expected.size) {
    throw new Error("holdout runtime evidence artifact does not prove every holdout export with persisted=false");
  }
  return approved;
}
