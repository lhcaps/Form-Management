import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const componentPath = join(dirname(fileURLToPath(import.meta.url)), "case-detail-workspace.tsx");
const routePath = resolve(dirname(fileURLToPath(import.meta.url)), "../../app/cases/[caseId]/page.tsx");

const source = readFileSync(componentPath, "utf8");
const routeSource = readFileSync(routePath, "utf8");
const rawButtonPattern = new RegExp("<" + "button\\b");
const rawTablePattern = new RegExp("<" + "table\\b");
const rawSvgPattern = new RegExp("<" + "svg\\b");
const legacyTonePattern = new RegExp(
  [
    "bg-blue-50 " + "text-blue-700",
    "bg-indigo-50 " + "text-indigo-700",
    "bg-amber-50 " + "text-amber-700",
    "bg-emerald-50 " + "text-emerald-700",
    "bg-rose-50 " + "text-rose-700",
  ].join("|"),
);

test("case detail workspace uses shared page, status, and shadcn primitives", () => {
  assert.match(source, /@\/components\/common\/page-shell/);
  assert.match(source, /@\/components\/common\/status-badge/);
  assert.match(source, /@\/components\/common\/error-banner/);
  assert.match(source, /@\/components\/ui\/button/);
  assert.match(source, /@\/components\/ui\/input/);
  assert.match(source, /@\/components\/ui\/select/);
  assert.match(source, /@\/components\/ui\/table/);
  assert.match(source, /@\/components\/ui\/tabs/);
  assert.match(source, /@\/components\/ui\/textarea/);
});

test("case detail workspace removes hand-built buttons, tables, and status tone pairs", () => {
  assert.doesNotMatch(source, rawButtonPattern);
  assert.doesNotMatch(source, rawTablePattern);
  assert.doesNotMatch(source, rawSvgPattern);
  assert.doesNotMatch(source, legacyTonePattern);
});

test("case detail workspace keeps only the explicit primary-person checkbox as raw input", () => {
  const rawInputs = source.match(/<input\b/g) ?? [];

  assert.equal(rawInputs.length, 1);
  assert.match(source, /type="checkbox"/);
  assert.doesNotMatch(source, /<select\b/);
  assert.doesNotMatch(source, /<textarea\b/);
});

test("case detail route and API workflow contracts stay wired to the same helpers", () => {
  assert.match(routeSource, /params: Promise<\{/);
  assert.match(routeSource, /const \{ caseId \} = await params/);
  assert.match(routeSource, /<CaseDetailWorkspace caseId=\{caseId\} \/>/);

  assert.match(source, /getCaseDetail\(caseId\)/);
  assert.match(source, /listCasePeople\(caseId\)/);
  assert.match(source, /addCasePerson\(caseId, payload\)/);
  assert.match(source, /updateCasePerson\(caseId, editing\.id, payload\)/);
  assert.match(source, /listCaseOffenses\(caseId\)/);
  assert.match(source, /addCaseOffense\(caseId, payload\)/);
  assert.match(source, /listCaseAssignments\(caseId\)/);
  assert.match(source, /fetchOfficials\(\)\.catch/);
  assert.match(source, /listCaseEvidence\(caseId\)/);
  assert.match(source, /addCaseEvidence\(caseId, payload\)/);
  assert.match(source, /href=\{`\/documents\/\$\{doc\.id\}`\}/);
});
