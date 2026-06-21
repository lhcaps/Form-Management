#!/usr/bin/env node

import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

import {
  formatRefinementEvidenceMarkdown,
  parseSelectedCodes,
  prepareContractRefinement,
  renderRefinementPreview,
  resolveRepoRoot,
  writeRefinementPreviewArtifact,
} from "./form-refinement/normalized-contract-refinement.mjs";

const repoRoot = resolveRepoRoot();
const codes = parseSelectedCodes(process.argv.slice(2));

if (codes.length === 0) {
  throw new Error("No BM codes selected. Use --codes BM-005,BM-006.");
}

const requireFromContracts = createRequire(
  join(repoRoot, "packages", "form-contracts", "package.json"),
);
const { adaptV1Contract, compileContract } =
  requireFromContracts("@qllaw/form-contracts");

const suffix = codes.join("-");
const previewOutputRoot = join(
  repoRoot,
  "storage",
  "form-preview",
  "form-refinement",
);

const results = codes.map((code) => {
  const prepared = prepareContractRefinement(repoRoot, code);
  const preview = renderRefinementPreview({
    repoRoot,
    code,
    profile: prepared.profile,
  });
  const adapted = adaptV1Contract(prepared.refined);
  adapted.templateHash = prepared.discovery.sha256;
  adapted.normalizedDocxPath = prepared.discovery.relativePath;
  const compiled = compileContract(adapted);
  const artifact = writeRefinementPreviewArtifact({
    repoRoot,
    outputRoot: previewOutputRoot,
    batchName: suffix,
    code,
    renderedBuffer: preview.renderedBuffer,
  });
  const previewArtifact = {
    relativePath: artifact.relativePath,
    sha256: artifact.sha256,
    byteSize: artifact.byteSize,
  };
  const status =
    compiled.ok &&
    preview.packageIntegrity.status === "pass" &&
    preview.unresolvedPlaceholders.length === 0 &&
    preview.missingSampleValues.length === 0 &&
    preview.literalLeakage.length === 0
      ? "PASS"
      : "FAIL";

  return {
    code,
    status,
    normalizedDocxPath: prepared.discovery.relativePath,
    normalizedDocxSha256: prepared.discovery.sha256,
    previewArtifact,
    fields: prepared.refined.canonicalFields.length,
    bindings: prepared.refined.renderBindings.length,
    compile: {
      ok: compiled.ok,
      issues: compiled.issues,
    },
    packageIntegrity: preview.packageIntegrity,
    unresolvedPlaceholders: preview.unresolvedPlaceholders,
    missingSampleValues: preview.missingSampleValues,
    literalLeakage: preview.literalLeakage,
  };
});

const outputDir = join(
  repoRoot,
  "docs",
  "audit",
  "form-authoring-baselines",
);
const jsonPath = join(outputDir, `refinement-${suffix}.json`);
const mdPath = join(outputDir, `refinement-${suffix}.md`);
const overallStatus = results.every((result) => result.status === "PASS")
  ? "PASS"
  : "FAIL";
const evidence = {
  generatedAt: new Date().toISOString(),
  scope: codes,
  status: overallStatus,
  visualQa: {
    status: "NOT_RUN",
    reason:
      "LibreOffice/soffice is unavailable; this automated report covers structural DOCX render and package-integrity QA. Any Microsoft Word visual inspection is recorded separately.",
  },
  results,
};
const markdown = formatRefinementEvidenceMarkdown({
  codes,
  overallStatus,
  results,
});

mkdirSync(dirname(jsonPath), { recursive: true });
writeFileSync(jsonPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
writeFileSync(mdPath, markdown, "utf8");

console.log(`Refinement smoke: ${overallStatus}`);
console.log(`Evidence: ${relative(repoRoot, mdPath)}`);
if (overallStatus !== "PASS") process.exitCode = 1;
