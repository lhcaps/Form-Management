#!/usr/bin/env node
/**
 * Read-only gate for deciding whether broad 213-BM semantic remediation may start.
 *
 * This script intentionally does not compile, publish, repair, or write reports.
 * It aggregates the live repo state plus the existing SOT/runtime gates into one
 * executable readiness verdict.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const RENDER_ATLAS_PATH = path.join(
  ROOT,
  "docs",
  "audit",
  "docx-atlas-v1",
  "render-atlas.latest.json",
);
const DECISION_GATE_PATH = path.join(
  ROOT,
  "docs",
  "audit",
  "repo-clean-to-zero-v1",
  "active-decision-gate.latest.json",
);

function stripAnsi(value) {
  return String(value ?? "").replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

function runCommand(label, command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    windowsHide: true,
  });

  return {
    label,
    command: [command, ...args].join(" "),
    exitCode: typeof result.status === "number" ? result.status : 2,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? result.error.message : null,
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function parseContractSyncOutput(output) {
  const clean = stripAnsi(output);
  const stale = [];
  const missing = [];
  let section = null;

  for (const rawLine of clean.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (/Stale contracts/i.test(line)) {
      section = "stale";
      continue;
    }
    if (/Missing/i.test(line) && /DB/i.test(line)) {
      section = "missing";
      continue;
    }
    if (/^(CI Gate|To fix|Strategy|Total locked contracts|Matched|Missing in DB|Stale)/i.test(line)) {
      if (!/^-\s*BM-\d{3}/.test(line)) section = null;
    }

    const match = line.match(/^-\s*(BM-\d{3})\b/);
    if (!match || !section) continue;
    if (section === "stale") stale.push(match[1]);
    if (section === "missing") missing.push(match[1]);
  }

  return { stale, missing };
}

export function summarizeRenderAtlas(atlas) {
  const rows = Array.isArray(atlas?.rows) ? atlas.rows : [];
  const summary = {
    total: rows.length,
    pass: 0,
    fail: 0,
    error: 0,
    missing: 0,
    failingTemplates: [],
  };

  for (const row of rows) {
    const status = String(row.status ?? "").toUpperCase();
    if (status === "PASS") summary.pass++;
    else if (status === "FAIL") {
      summary.fail++;
      summary.failingTemplates.push(row.templateCode);
    } else if (status === "ERROR") {
      summary.error++;
      summary.failingTemplates.push(row.templateCode);
    } else if (status === "MISSING") {
      summary.missing++;
      summary.failingTemplates.push(row.templateCode);
    }
  }

  return summary;
}

export function evaluateReadiness(input) {
  const blockers = [];
  const warnings = [];

  if (input.gitStatusShort.trim().length > 0) {
    blockers.push({
      code: "GIT_STATUS_DIRTY",
      message: "git status --short is not empty",
    });
  }

  if (input.c3.exitCode !== 0) {
    blockers.push({
      code: "C3_LOCKED_COMPILED_FAILED",
      message: "locked contract to compiled-v2 consistency gate failed",
    });
  }

  if (input.c2.exitCode !== 0) {
    const parsed = parseContractSyncOutput(`${input.c2.stdout}\n${input.c2.stderr}`);
    blockers.push({
      code: "C2_CONTRACT_DB_SYNC_FAILED",
      message: "compiled-v2 to DB contract sync gate failed",
      stale: parsed.stale,
      missing: parsed.missing,
    });
  }

  if (!input.renderAtlas.exists) {
    blockers.push({
      code: "RENDER_ATLAS_MISSING",
      message: "render-atlas.latest.json is missing",
    });
  } else if (
    input.renderAtlas.summary.fail > 0 ||
    input.renderAtlas.summary.error > 0 ||
    input.renderAtlas.summary.missing > 0
  ) {
    blockers.push({
      code: "RENDER_ATLAS_NOT_CLEAN",
      message: "render atlas contains non-PASS templates",
      summary: input.renderAtlas.summary,
    });
  }

  if (!input.decisionGate.exists) {
    blockers.push({
      code: "ACTIVE_DECISION_GATE_MISSING",
      message: "active decision gate artifact is missing",
    });
  } else if (input.decisionGate.canStart213SemanticRemediation !== true) {
    blockers.push({
      code: "ACTIVE_DECISION_GATE_BLOCKED",
      message: "active decision gate says broad 213 semantic remediation may not start",
      blockingTemplates: (input.decisionGate.blockingDecisions ?? []).flatMap(
        (item) => item.templates ?? [],
      ),
    });
  }

  if (
    input.decisionGate.exists &&
    input.decisionGate.head &&
    input.head &&
    input.decisionGate.head !== input.head
  ) {
    warnings.push({
      code: "DECISION_GATE_HEAD_DIFFERS",
      message: `decision gate was generated at ${input.decisionGate.head}, current HEAD is ${input.head}`,
    });
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
  };
}

function collectState(options) {
  const head = runCommand("git-head", "git", ["rev-parse", "--short", "HEAD"]);
  const gitStatus = runCommand("git-status", "git", ["status", "--short"]);

  const c3 = options.skipCommandGates
    ? { label: "c3", command: "skipped", exitCode: 0, stdout: "", stderr: "", error: null }
    : runCommand("c3", process.execPath, [
        "scripts/audit/audit-locked-compiled-consistency.mjs",
        "--strict",
      ]);
  const c2 = options.skipCommandGates
    ? { label: "c2", command: "skipped", exitCode: 0, stdout: "", stderr: "", error: null }
    : runCommand("c2", process.execPath, ["scripts/audit/audit-contract-sync.mjs"]);

  const renderAtlas = fs.existsSync(RENDER_ATLAS_PATH)
    ? { exists: true, summary: summarizeRenderAtlas(readJson(RENDER_ATLAS_PATH)) }
    : { exists: false, summary: null };
  const decisionGate = fs.existsSync(DECISION_GATE_PATH)
    ? { exists: true, ...readJson(DECISION_GATE_PATH) }
    : { exists: false };

  return {
    generatedAt: new Date().toISOString(),
    head: head.stdout.trim(),
    gitStatusShort: gitStatus.stdout,
    commands: { head, gitStatus, c3, c2 },
    c3,
    c2,
    renderAtlas,
    decisionGate,
  };
}

function printText(report) {
  console.log("213 Remediation Readiness");
  console.log("=========================");
  console.log(`Ready: ${report.verdict.ready ? "YES" : "NO"}`);
  console.log(`HEAD: ${report.state.head}`);
  console.log(`Git clean: ${report.state.gitStatusShort.trim() ? "NO" : "YES"}`);
  console.log(`C3 exit: ${report.state.c3.exitCode}`);
  console.log(`C2 exit: ${report.state.c2.exitCode}`);
  if (report.state.renderAtlas.exists) {
    const r = report.state.renderAtlas.summary;
    console.log(
      `Render atlas: ${r.pass} PASS, ${r.fail} FAIL, ${r.error} ERROR, ${r.missing} MISSING`,
    );
  } else {
    console.log("Render atlas: missing");
  }
  console.log(
    `Decision gate: ${
      report.state.decisionGate.exists
        ? report.state.decisionGate.canStart213SemanticRemediation
          ? "ALLOW"
          : "BLOCK"
        : "missing"
    }`,
  );

  if (report.verdict.blockers.length) {
    console.log("");
    console.log("Blockers:");
    for (const blocker of report.verdict.blockers) {
      const extra = blocker.stale?.length
        ? ` stale=${blocker.stale.join(",")}`
        : blocker.summary?.failingTemplates?.length
          ? ` templates=${blocker.summary.failingTemplates.join(",")}`
          : blocker.blockingTemplates?.length
            ? ` templates=${[...new Set(blocker.blockingTemplates)].join(",")}`
            : "";
      console.log(`- ${blocker.code}: ${blocker.message}${extra}`);
    }
  }

  if (report.verdict.warnings.length) {
    console.log("");
    console.log("Warnings:");
    for (const warning of report.verdict.warnings) {
      console.log(`- ${warning.code}: ${warning.message}`);
    }
  }
}

function parseArgs(argv) {
  return {
    json: argv.includes("--json"),
    skipCommandGates: argv.includes("--skip-command-gates"),
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const state = collectState(options);
  const verdict = evaluateReadiness(state);
  const report = { state, verdict };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report);
  }

  process.exit(verdict.ready ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error?.stack ?? error);
    process.exit(2);
  });
}
