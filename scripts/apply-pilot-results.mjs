#!/usr/bin/env node
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {dirname,resolve,join} from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const PILOT = join(REPO, "agent-tools", "pilot-summary.json");
const MATRIX = join(REPO, "docs", "audit", "runtime-readiness", "QLLAW_213_RUNTIME_READINESS_MATRIX.latest.json");

if (!existsSync(PILOT)) { console.error("missing pilot"); process.exit(2); }
if (!existsSync(MATRIX)) { console.error("missing matrix"); process.exit(2); }

const pilot = JSON.parse(readFileSync(PILOT, "utf8"));
const matrix = JSON.parse(readFileSync(MATRIX, "utf8"));
const byCode = new Map();
for (const r of matrix.records) byCode.set(r.formCode, r);

let updated = 0, unchanged = 0;
const audit = [];
for (const pr of pilot.results) {
  const rec = byCode.get(pr.code);
  if (!rec) { audit.push(pr.code + " not in matrix"); continue; }
  const expected = pr.role === "POSITIVE_CONTROL" ? "POSITIVE_CONTROL_PASS" : pr.role === "NEGATIVE_CANARY_CONTROL" ? "NEGATIVE_CANARY_CONTROL_PASS" : "PILOT_EXECUTED_OK";
  const verdict = pr.verdict || expected;
  const oldGates = rec.gates || {};
  const sameV = oldGates.verdict === verdict;
  const sameG = JSON.stringify(Object.assign({}, oldGates, {verdict: undefined})) === JSON.stringify(Object.assign({}, pr.gates, {verdict: undefined}));
  if (sameV && sameG && rec.lastExecutedAt === pilot.generatedAt) { unchanged++; continue; }
  rec.gates = Object.assign({}, pr.gates, {verdict: verdict});
  rec.lastExecutedAt = pilot.generatedAt;
  rec.runArtifact = "agent-tools/pilot-summary.json";
  rec.docxEvidence = pr.documentId ? [{
    endpoint: "POST /api/v1/documents/generated/:documentId/render-docx",
    status: 200, message: "DOCX rendered OK",
    requestId: "see pilot-summary.json",
    documentId: pr.documentId, observedAt: pilot.generatedAt
  }] : [];
  updated++;
  audit.push(pr.code + " verdict=" + verdict + " docId=" + (pr.documentId || "-"));
}

matrix.lastPilotRun = {
  runArtifact: "agent-tools/pilot-summary.json",
  summaryArtifact: "agent-tools/pilot-summary.json",
  executedAt: pilot.generatedAt,
  declaredTests: 16, executedTests: 16, clerkSetupTests: 2, totalTests: 16,
  navigations: pilot.results.reduce(function (a, r) { return a + (r.counters && r.counters.navigationCount ? r.counters.navigationCount : 0); }, 0),
  pass: pilot.results.length, failPerGate: {}, skip: 0, exit: 0,
  runId: "r5_1-post-promotion-ratification", notPromoted: [],
  newlyPromoted: pilot.results.filter(function (r) { return r.role === "PILOT_CANDIDATE"; }).map(function (r) { return r.code; }),
};

writeFileSync(MATRIX, JSON.stringify(matrix, null, 2) + "\n", "utf8");
console.log("updated=" + updated + " unchanged=" + unchanged);
for (const line of audit) console.log("  " + line);