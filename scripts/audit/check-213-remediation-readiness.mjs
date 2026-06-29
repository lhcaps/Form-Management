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
const BLOCKER_PACK_PATH = path.join(
  ROOT,
  "docs",
  "audit",
  "repo-clean-to-zero-v1",
  "active-remediation-blocker-pack.latest.json",
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

/**
 * Extract active render-blocker template codes from the blocker pack.
 * Only blockers with status === "FAIL" and humanReviewBlockerPath present
 * are considered confirmed active blockers that can be excluded.
 */
export function extractActiveRenderBlockers(blockerPack) {
  if (!blockerPack) return [];
  const blockers = blockerPack.renderBlockers ?? [];
  return blockers
    .filter((b) => b.status === "FAIL" && b.humanReviewBlockerPath)
    .map((b) => b.templateCode);
}

/**
 * Determine whether remediation may start, distinguishing full-213 scope
 * from non-blocked scope when active render blockers are explicitly supplied.
 *
 * Policy:
 *   - Structural blockers (git/C3/C2/decision-gate-missing) block BOTH scopes.
 *   - Decision-gate blockers (ACTIVE_DECISION_GATE_BLOCKED) block ONLY full-213.
 *   - Render atlas blockers block full-213 always; block non-blocked only when
 *     the failing templates include an UNKNOWN template.
 *   - Known active render blockers are excluded from non-blocked
 *     remediation but still block full-213.
 *
 * @param {object} input - readiness gate state
 * @param {string[]} [options.knownActiveBlockers] - template codes known to be
 *   active human-review blockers; defaults to [] after render atlas is clean.
 * @returns {object} readiness verdict with both scopes evaluated
 */
export function evaluateRemediationReadiness(input, options = {}) {
  const blockers = []; // ALL blockers for reporting
  const warnings = [];
  const knownActiveBlockers = new Set(
    options.knownActiveBlockers ?? [],
  );

  // --- Step 1: Structural blockers (block both scopes) ---
  if (input.c3.exitCode !== 0) {
    blockers.push({ code: "C3_LOCKED_COMPILED_FAILED", message: "locked contract to compiled-v2 consistency gate failed" });
  }
  if (input.c2.exitCode !== 0) {
    const parsed = parseContractSyncOutput(`${input.c2.stdout}\n${input.c2.stderr}`);
    blockers.push({ code: "C2_CONTRACT_DB_SYNC_FAILED", message: "compiled-v2 to DB contract sync gate failed", stale: parsed.stale, missing: parsed.missing });
  }
  if (!input.decisionGate.exists) {
    blockers.push({ code: "ACTIVE_DECISION_GATE_MISSING", message: "active decision gate artifact is missing" });
  }

  // --- Step 2: Render atlas blockers ---
  let renderAtlasBlocker = null;
  if (!input.renderAtlas.exists) {
    renderAtlasBlocker = { code: "RENDER_ATLAS_MISSING", message: "render-atlas.latest.json is missing" };
    blockers.push(renderAtlasBlocker);
  } else {
    const summary = input.renderAtlas.summary;
    if (summary.fail > 0 || summary.error > 0 || summary.missing > 0) {
      renderAtlasBlocker = { code: "RENDER_ATLAS_NOT_CLEAN", message: "render atlas contains non-PASS templates", summary, failingTemplates: summary.failingTemplates };
    }
  }

  // --- Step 3: Git status cleanliness ---
  // Two separate concepts:
  //   rawGitClean  — does git status --short have ANY modified files?
  //   worktreeAcceptableForActiveBatch — are all dirty paths expected/allowlisted for the current batch?
  //
  // We NEVER say "Git clean" when files are modified. These are separate signals.
  const gitLines = input.gitStatusShort.trim().split(/\r?\n/).filter(Boolean);
  const rawGitDirtyLines = gitLines.map((line) => line.trimStart()).filter(Boolean);
  const rawGitClean = rawGitDirtyLines.length === 0;
  const rawGitStatusCount = rawGitDirtyLines.length;

  // Categorize dirty paths for auditability
  const knownExpectedDirtyPrefixes = [
    "?? docs/audit/",
    "?? docs/Biểu mẫu/",
    "M scripts/",
    "M test/",
    // Phase B metadata batch: locked contracts modified by reviewRequired-only apply
    "M docs/audit/docx/contracts/locked/",
    // Phase C recompile: compiled artifacts regenerated by official compiler
    "?? docs/audit/docx/compiled-v2/",
    "?? docs/audit/docx/contracts/locked/",
    // Phase D: forms-root-cause CI artifacts regenerated by audit run
    "M docs/audit/forms-root-cause/",
    // Gate outputs regenerated by C3/C2 and readiness audit runs
    "M docs/audit/sot-gates-v1/",
    "M docs/audit/repo-clean-to-zero-v1/",
  ];
  const unexpectedDirtyLines = rawGitDirtyLines.filter(
    (line) => !knownExpectedDirtyPrefixes.some((prefix) => line.startsWith(prefix)),
  );

  const rawGitDirtyPathsSummary = rawGitDirtyLines.length > 0
    ? rawGitDirtyLines.reduce((acc, line) => {
        const prefix = line.replace(/\s+.*$/, ""); // status code
        const path = line.replace(/^[A-Z]\s+/, "");
        acc[prefix] = acc[prefix] || [];
        acc[prefix].push(path);
        return acc;
      }, {})
    : {};

  const ignoredExpectedDirtyPaths = rawGitDirtyLines
    .filter((line) => knownExpectedDirtyPrefixes.some((p) => line.startsWith(p)))
    .reduce((acc, line) => {
      const path = line.replace(/^[A-Z]\s+/, "");
      acc.push(path);
      return acc;
    }, []);

  const worktreeAcceptableForActiveBatch = unexpectedDirtyLines.length === 0;

  // Only add a blocker for genuinely unexpected dirty paths
  if (unexpectedDirtyLines.length > 0) {
    blockers.push({
      code: "GIT_STATUS_UNEXPECTED_DIRTY",
      message: `git status --short has ${unexpectedDirtyLines.length} unexpected change(s)`,
      unexpectedPaths: unexpectedDirtyLines,
    });
  }

  // Decision gate blockers: decision gate says canStart213 = false.
  // These block ONLY full-213; they do not block non-blocked remediation.
  // They are added later in Step 4 after computing the verdict flags.

  if (input.decisionGate.exists && input.decisionGate.head && input.head && input.decisionGate.head !== input.head) {
    warnings.push({ code: "DECISION_GATE_HEAD_DIFFERS", message: `decision gate was generated at ${input.decisionGate.head}, current HEAD is ${input.head}` });
  }

  // --- Step 4: Compute verdicts ---
  //
  // Non-blocked remediation is blocked ONLY by:
  //   - C3/C2/ACTIVE_DECISION_GATE_MISSING structural failures
  //   - Missing render atlas
  //   - Unknown render fails (templates not in knownActiveBlockers)
  // Git status and decision gate do NOT block non-blocked remediation.
  //
  // Full-213 remediation is blocked by:
  //   - All structural blockers
  //   - git dirty
  //   - render atlas blockers
  //   - decision gate blockers (only when unresolved templates exist)

  // --- Non-blocked verdict ---
  let canStartNonBlockedRemediation = false;
  let requiredExclusions = [];

  if (input.c3.exitCode !== 0) {
    canStartNonBlockedRemediation = false;
  } else if (input.c2.exitCode !== 0) {
    canStartNonBlockedRemediation = false;
  } else if (!input.decisionGate.exists) {
    canStartNonBlockedRemediation = false;
  } else if (!input.renderAtlas.exists) {
    canStartNonBlockedRemediation = false;
  } else {
    const summary = input.renderAtlas.summary;
    const hasFails = summary && (summary.fail > 0 || summary.error > 0 || summary.missing > 0);
    if (!hasFails) {
      canStartNonBlockedRemediation = true;
    } else {
      const failingSet = new Set(summary?.failingTemplates ?? []);
      const allKnown = [...failingSet].every((t) => knownActiveBlockers.has(t));
      if (allKnown && failingSet.size > 0) {
        canStartNonBlockedRemediation = true;
      }
    }
  }

  // --- Full-213 verdict ---
  let canStartFull213Remediation = false;

  // Decision gate blockers: the decision gate may contain stale entries (BM-052, BM-062)
  // from before the C2 runtime sync resolved them. These are only meaningful when C2
  // is actively failing. When C2 is clean, the stale entries are pre-resolution noise.
  // For a clean decision gate, we filter out known-active blockers and structural blockers.
  const decisionTemplates = (input.decisionGate?.blockingDecisions ?? []).flatMap((d) => d.templates ?? []);
  const c2Failing = input.c2.exitCode !== 0;
  const structuralC2Templates = c2Failing
    ? new Set(parseContractSyncOutput(`${input.c2.stdout}\n${input.c2.stderr}`).stale ?? [])
    : new Set();
  const renderFailingTemplateSet = new Set(input.renderAtlas?.summary?.failingTemplates ?? []);
  const alreadyBlockedTemplates = new Set([
    ...structuralC2Templates,
    ...renderFailingTemplateSet,
    ...knownActiveBlockers,
  ]);
  const decisionGateUnresolvedTemplates = decisionTemplates.filter(
    (t) => !alreadyBlockedTemplates.has(t),
  );

  if (
    input.c3.exitCode === 0 &&
    input.c2.exitCode === 0 &&
    input.decisionGate?.exists &&
    worktreeAcceptableForActiveBatch &&
    decisionGateUnresolvedTemplates.length === 0 &&
    input.renderAtlas?.exists &&
    !(
      (input.renderAtlas.summary?.fail > 0 ||
        input.renderAtlas.summary?.error > 0 ||
        input.renderAtlas.summary?.missing > 0)
    )
  ) {
    canStartFull213Remediation = true;
  }

  // Only add ACTIVE_DECISION_GATE_BLOCKED if there are genuinely unresolved templates
  // AND (C2 is actively failing OR the unresolved templates include new ones).
  // When C2 is clean, stale decision gate entries (BM-052/BM-062) are pre-resolution noise.
  const c2StaleTemplates = input.c2.exitCode === 0
    ? []
    : parseContractSyncOutput(`${input.c2.stdout}\n${input.c2.stderr}`).stale ?? [];
  const staleSet = new Set(c2StaleTemplates);
  const hasNewUnresolved = decisionGateUnresolvedTemplates.some((t) => !staleSet.has(t));
  if (decisionGateUnresolvedTemplates.length > 0 && (hasNewUnresolved || input.c2.exitCode !== 0)) {
    blockers.push({
      code: "ACTIVE_DECISION_GATE_BLOCKED",
      message: "active decision gate blocks full-213 remediation",
      blockingTemplates: [...new Set(decisionGateUnresolvedTemplates)],
    });
  }

  if (canStartNonBlockedRemediation) {
    requiredExclusions = [...knownActiveBlockers];
  }

  return {
    ready: canStartFull213Remediation,
    blockers,
    warnings,
    git: {
      rawGitClean,
      rawGitStatusCount,
      rawGitDirtyPathsSummary,
      worktreeAcceptableForActiveBatch,
      ignoredExpectedDirtyPaths,
    },
    remediationScope: {
      canStartFull213Remediation,
      canStartNonBlockedRemediation,
      blockedBms: [...knownActiveBlockers],
      allowedRemediationScope: canStartNonBlockedRemediation
        ? knownActiveBlockers.size > 0
          ? `${Math.max(0, 213 - knownActiveBlockers.size)} BMs (excluding active blockers)`
          : "213 BMs"
        : "none",
      requiredExclusions,
    },
  };
}

/**
 * @deprecated Use evaluateRemediationReadiness() directly for new callers.
 *            This wrapper preserves the old {ready, blockers, warnings} API for
 *            backward compatibility with existing test files.
 */
export function evaluateReadiness(input) {
  const verdict = evaluateRemediationReadiness(input);
  return {
    ready: verdict.ready,
    blockers: verdict.blockers,
    warnings: verdict.warnings,
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
  const blockerPack = fs.existsSync(BLOCKER_PACK_PATH)
    ? { exists: true, ...readJson(BLOCKER_PACK_PATH) }
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
    blockerPack,
  };
}

function printText(report) {
  console.log("213 Remediation Readiness");
  console.log("=========================");
  console.log(`Ready: ${report.verdict.ready ? "YES" : "NO"}`);
  console.log(`HEAD: ${report.state.head}`);
  console.log(`Git raw: ${report.verdict.git?.rawGitClean ? "CLEAN" : `DIRTY (${report.verdict.git?.rawGitStatusCount} paths)`}`);
  console.log(
    `Worktree acceptable: ${report.verdict.git?.worktreeAcceptableForActiveBatch ? "YES" : "NO"}`,
  );
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
  const scope = report.verdict.remediationScope;
  console.log(
    `canStartNonBlockedRemediation: ${scope.canStartNonBlockedRemediation ? "YES" : "NO"}`,
  );
  console.log(
    `canStartFull213Remediation: ${scope.canStartFull213Remediation ? "YES" : "NO"}`,
  );
  if (scope.blockedBms?.length) {
    console.log(`blockedBms: ${scope.blockedBms.join(", ")}`);
  }
  if (scope.requiredExclusions?.length) {
    console.log(`requiredExclusions: ${scope.requiredExclusions.join(", ")}`);
  }

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
  const verdict = evaluateRemediationReadiness(state);
  const report = { state, verdict };

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report);
  }

  // Exit 0 when non-blocked remediation is allowed; exit 1 when nothing is allowed
  process.exit(verdict.ready || verdict.remediationScope?.canStartNonBlockedRemediation ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error?.stack ?? error);
    process.exit(2);
  });
}
