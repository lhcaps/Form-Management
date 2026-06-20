import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const contractsRoot = join(repoRoot, "docs", "audit", "docx", "contracts");
const lockedRoot = join(contractsRoot, "locked");
const reportPath = join(
  repoRoot,
  "docs",
  "audit",
  "docx",
  "reports",
  "slot-coverage-summary.json",
);
const markdownReportPath = join(
  repoRoot,
  "docs",
  "audit",
  "docx",
  "reports",
  "SLOT-COVERAGE-SUMMARY.md",
);

test("DOCX verification report includes checked-in locked contracts", () => {
  const selectedBySourceId = new Map();
  const candidates = [
    ...readdirSync(contractsRoot)
      .filter((fileName) => fileName.endsWith(".contract.draft.json"))
      .map((fileName) => join(contractsRoot, fileName)),
    ...readdirSync(lockedRoot)
      .filter((fileName) => fileName.endsWith(".contract.locked.json"))
      .map((fileName) => join(lockedRoot, fileName)),
  ];
  for (const filePath of candidates) {
    const contract = JSON.parse(readFileSync(filePath, "utf8"));
    const existing = selectedBySourceId.get(contract.sourceId);
    if (!existing || contract.status === "locked") {
      selectedBySourceId.set(contract.sourceId, contract);
    }
  }
  const contracts = [...selectedBySourceId.values()];
  const lockedCount = contracts.filter(
    (contract) => contract.status === "locked",
  ).length;
  const draftCount = contracts.filter(
    (contract) => contract.status === "draft",
  ).length;
  const report = JSON.parse(readFileSync(reportPath, "utf8"));

  assert.ok(lockedCount > 0);
  assert.equal(report.summary.totalLocked, lockedCount);
  assert.equal(report.summary.totalDraft, draftCount);
});

test("DOCX verification wording distinguishes locked from review-required drafts", () => {
  const markdown = readFileSync(markdownReportPath, "utf8");

  assert.doesNotMatch(markdown, /100% canonicalField/u);
  assert.match(markdown, /Locked contract count/u);
  assert.match(markdown, /draft \+ locked/u);
});
