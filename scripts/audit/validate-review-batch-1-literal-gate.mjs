#!/usr/bin/env node
/**
 * validate-review-batch-1-literal-gate.mjs
 *
 * Literal-only validation gate for FORMS_ROOT_CAUSE_REVIEW_BATCH_1.
 *
 * Rules:
 * - Runs exactly the specified literal commands via execFileSync(command, args).
 * - No aliases. No truncation. No mapping. No substitution.
 * - No downgrade of failures to INFO.
 * - Strict exit 1 on any non-zero exit code.
 * - No dependency on apply-forms-root-cause-review-batch-1-approved.mjs.
 *
 * Required commands:
 *   pnpm contract         (slot 1)
 *   pnpm contract         (slot 2)
 *   pnpm gate:forms:213  (slot 3)
 *   pnpm audit            (slot 4)
 *   pnpm plan             (slot 5)
 *   pnpm audit            (slot 6)
 *   pnpm audit            (slot 7)
 *   pnpm --filter @qllaw/form-contracts test  (slot 8)
 *   pnpm typecheck        (slot 9)
 */

import { platform } from 'node:os';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync, execSync } from 'node:child_process';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const APPLY_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1', 'apply-approved');
const LITERAL_DIR = join(APPLY_DIR, 'literal-validation-gate');
const DECISIONS_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1', 'decisions.approved.json');
const AUDIT_LATEST_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const FIXPLAN_LATEST_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

// Baseline from post-FORMS_ROOT_CAUSE_APPLY_SAFE_FIXES_POSTCHECK
const BASELINE = {
  totalIssues: 3460,
  BAD_LABEL: 453,
  UI_VISIBLE_BAD_METADATA: 96,
};

// =============================================================================
// REQUIRED COMMANDS — exact literal spec, no substitution
// =============================================================================

/**
 * Each entry: [command, args[]].
 * Literal meaning: the command string and args are exactly what the user specified.
 * No truncation. No renaming. No mapping.
 */
const REQUIRED_COMMANDS = [
  { index: 0, command: 'pnpm', args: ['contract'],           literal: 'pnpm contract' },
  { index: 1, command: 'pnpm', args: ['contract'],           literal: 'pnpm contract' },
  { index: 2, command: 'pnpm', args: ['gate:forms:213'],    literal: 'pnpm gate:forms:213' },
  { index: 3, command: 'pnpm', args: ['audit'],              literal: 'pnpm audit' },
  { index: 4, command: 'pnpm', args: ['plan'],               literal: 'pnpm plan' },
  { index: 5, command: 'pnpm', args: ['audit'],              literal: 'pnpm audit' },
  { index: 6, command: 'pnpm', args: ['audit'],              literal: 'pnpm audit' },
  { index: 7, command: 'pnpm', args: ['--filter', '@qllaw/form-contracts', 'test'], literal: 'pnpm --filter @qllaw/form-contracts test' },
  { index: 8, command: 'pnpm', args: ['typecheck'],          literal: 'pnpm typecheck' },
];

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function tail(str, n = 500) {
  if (!str || typeof str !== 'string') return '';
  const lines = str.split('\n');
  return lines.slice(-n).join('\n');
}

function loadLockedContract(bm) {
  try {
    const files = readdirSync(LOCKED_DIR).filter((f) => f.startsWith(bm) && f.endsWith('.contract.locked.json'));
    if (files.length === 0) return null;
    return JSON.parse(readFileSync(join(LOCKED_DIR, files[0]), 'utf8'));
  } catch { return null; }
}

// =============================================================================
// COMMAND RUNNER — literal execFileSync, no substitution
// =============================================================================

/**
 * Run a single literal command using execFileSync.
 * Never substitutes. Never remaps. Strict: any non-zero is FAIL.
 *
 * @param {{ command: string, args: string[], literal: string }} cmd
 * @param {number} timeoutMs
 * @returns {{ index, literal, exitCode, status, durationMs, stdoutTail, stderrTail }}
 */
function runLiteralCommand(cmd, timeoutMs = 180000) {
  const start = Date.now();
  // On Windows, pnpm scripts are .cmd/.bat files that need shell execution.
  // Use execSync with shell:true on Windows, execFileSync on Unix.
  if (platform() === 'win32') {
    try {
      const fullCmd = `${cmd.command} ${cmd.args.join(' ')}`;
      const stdout = execSync(fullCmd, {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 100 * 1024 * 1024,
        shell: true,
      });
      return {
        index: cmd.index,
        literal: cmd.literal,
        exitCode: 0,
        status: 'PASS',
        durationMs: Date.now() - start,
        stdoutTail: tail(stdout, 50),
        stderrTail: '',
      };
    } catch (err) {
      return {
        index: cmd.index,
        literal: cmd.literal,
        exitCode: err.status ?? 1,
        status: 'FAIL',
        durationMs: Date.now() - start,
        stdoutTail: tail(err.stdout, 50),
        stderrTail: tail(err.stderr, 50),
      };
    }
  } else {
    try {
      const stdout = execFileSync(cmd.command, cmd.args, {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 100 * 1024 * 1024,
      });
      return {
        index: cmd.index,
        literal: cmd.literal,
        exitCode: 0,
        status: 'PASS',
        durationMs: Date.now() - start,
        stdoutTail: tail(stdout, 50),
        stderrTail: '',
      };
    } catch (err) {
      return {
        index: cmd.index,
        literal: cmd.literal,
        exitCode: err.status ?? 1,
        status: 'FAIL',
        durationMs: Date.now() - start,
        stdoutTail: tail(err.stdout, 50),
        stderrTail: tail(err.stderr, 50),
      };
    }
  }
}

// =============================================================================
// ISSUE PARSING
// =============================================================================

function parseAuditIssueCounts() {
  const data = loadJson(AUDIT_LATEST_JSON);
  if (!data) return null;
  const byCode = data.issueCounts ?? {};
  return {
    totalIssues: data.totalIssues ?? 0,
    BAD_LABEL: byCode['BAD_LABEL'] ?? 0,
    UI_VISIBLE_BAD_METADATA: byCode['UI_VISIBLE_BAD_METADATA'] ?? 0,
  };
}

function parseFixPlanCounts() {
  const data = loadJson(FIXPLAN_LATEST_JSON);
  if (!data) return null;
  const cc = data.classificationCounts ?? {};
  return {
    AUTO_FIX_CANDIDATE: cc['AUTO_FIX_CANDIDATE'] ?? 0,
    REVIEW_FIX_CANDIDATE: cc['REVIEW_FIX_CANDIDATE'] ?? 0,
    MANUAL_LEGAL_REVIEW: cc['MANUAL_LEGAL_REVIEW'] ?? 0,
    BLOCKED_BY_DOCX_AUTHORING: cc['BLOCKED_BY_DOCX_AUTHORING'] ?? 0,
    DO_NOT_FIX_NOISE_OR_DERIVED: cc['DO_NOT_FIX_NOISE_OR_DERIVED'] ?? 0,
  };
}

// =============================================================================
// DECISIONS VERIFICATION
// =============================================================================

function verifyDecisions() {
  const raw = loadJson(DECISIONS_JSON);
  if (!raw) return { error: 'decisions file not found' };
  const decisions = raw.decisions ?? [];

  const errors = [];

  if (decisions.length !== 24) {
    errors.push(`decisions count ${decisions.length} != 24`);
  }

  const approved = decisions.filter((d) => d.decision === 'APPROVED_FOR_APPLY');
  if (approved.length !== 2) {
    errors.push(`approvedForApply ${approved.length} != 2`);
  }

  const approvedIds = approved.map((d) => d.reviewGroupId).sort();
  if (JSON.stringify(approvedIds) !== JSON.stringify(['RG-001', 'RG-002'])) {
    errors.push(`approved groups ${JSON.stringify(approvedIds)} != ["RG-001","RG-002"]`);
  }

  const wave02 = new Set(['BM-068', 'BM-069', 'BM-073', 'BM-075', 'BM-077', 'BM-080', 'BM-082', 'BM-162', 'BM-163']);
  const wave02Approved = decisions.filter((d) => wave02.has(d.templateCode) && d.applyEligible === true);
  if (wave02Approved.length > 0) {
    errors.push(`Wave 02 groups with applyEligible: ${wave02Approved.map((d) => d.reviewGroupId).join(',')}`);
  }

  const legalBasisApproved = decisions.filter((d) => d.path.startsWith('legalBasis.') && d.applyEligible === true);
  if (legalBasisApproved.length > 0) {
    errors.push(`legalBasis groups with applyEligible: ${legalBasisApproved.map((d) => d.reviewGroupId).join(',')}`);
  }

  const rejectedApproved = decisions.filter((d) => d.decision === 'REJECTED_NO_OP' && d.applyEligible === true);
  if (rejectedApproved.length > 0) {
    errors.push(`REJECTED_NO_OP groups with applyEligible: ${rejectedApproved.map((d) => d.reviewGroupId).join(',')}`);
  }

  return { decisionsCount: decisions.length, approvedForApply: approved.length, errors };
}

// =============================================================================
// CONTRACT VERIFICATION
// =============================================================================

function verifyContracts() {
  function loadContract(bm) {
    try {
      const files = readdirSync(LOCKED_DIR).filter((f) => f.startsWith(bm) && f.endsWith('.contract.locked.json'));
      if (files.length === 0) return null;
      return JSON.parse(readFileSync(join(LOCKED_DIR, files[0]), 'utf8'));
    } catch { return null; }
  }

  const bm002 = loadContract('BM-002');
  const bm003 = loadContract('BM-003');

  const bm002Label = bm002?.canonicalFields?.find((f) => f.path === 'document.documentCode')?.label ?? null;
  const bm003Label = bm003?.canonicalFields?.find((f) => f.path === 'document.documentCode')?.label ?? null;

  return {
    bm002Label,
    bm003Label,
    bm002Match: bm002Label === 'Số văn bản',
    bm003Match: bm003Label === 'Số văn bản',
  };
}

// =============================================================================
// REPORT WRITING
// =============================================================================

function writeReport(report) {
  mkdirSync(LITERAL_DIR, { recursive: true });
  writeFileSync(join(LITERAL_DIR, 'latest.json'), JSON.stringify(report, null, 2), 'utf8');

  const lines = [
    '# Review Batch 1 — Literal Validation Gate',
    '',
    `Generated: ${report.generatedAt}`,
    `Verdict: **${report.verdict}**`,
    '',
    '## Required Commands (exact literal spec)',
    '',
    '| # | Literal Command | Exit | Status | Duration |',
    '|---|----------------|------|--------|---------|',
  ];

  for (const r of report.results) {
    lines.push(`| ${r.index + 1} | \`${r.literal}\` | ${r.exitCode} | **${r.status}** | ${r.durationMs}ms |`);
  }
  lines.push('');

  if (report.issueDelta) {
    lines.push('## Issue Delta');
    lines.push('');
    lines.push('| Metric | Baseline | Current | Delta |');
    lines.push('|--------|----------|---------|------:|');
    lines.push(`| totalIssues | ${report.issueDelta.baseline.totalIssues} | ${report.issueDelta.current.totalIssues} | ${report.issueDelta.delta.totalIssues >= 0 ? '+' : ''}${report.issueDelta.delta.totalIssues} |`);
    lines.push(`| BAD_LABEL | ${report.issueDelta.baseline.BAD_LABEL} | ${report.issueDelta.current.BAD_LABEL} | ${report.issueDelta.delta.BAD_LABEL >= 0 ? '+' : ''}${report.issueDelta.delta.BAD_LABEL} |`);
    lines.push(`| UI_VISIBLE_BAD_METADATA | ${report.issueDelta.baseline.UI_VISIBLE_BAD_METADATA} | ${report.issueDelta.current.UI_VISIBLE_BAD_METADATA} | ${report.issueDelta.delta.UI_VISIBLE_BAD_METADATA >= 0 ? '+' : ''}${report.issueDelta.delta.UI_VISIBLE_BAD_METADATA} |`);
    lines.push('');
  }

  if (report.contractVerification) {
    lines.push('## Contract Verification');
    lines.push('');
    lines.push(`- BM-002 document.documentCode: \`"${report.contractVerification.bm002DocumentCodeLabel}"\` ${report.contractVerification.bm002Match ? '✓' : '✗'}`);
    lines.push(`- BM-003 document.documentCode: \`"${report.contractVerification.bm003DocumentCodeLabel}"\` ${report.contractVerification.bm003Match ? '✓' : '✗'}`);
    lines.push('');
  }

  if (report.decisionsVerification && report.decisionsVerification.errors.length > 0) {
    lines.push('## Decisions Verification — ERRORS');
    lines.push('');
    for (const e of report.decisionsVerification.errors) {
      lines.push(`- **${e}**`);
    }
    lines.push('');
  } else if (report.decisionsVerification) {
    lines.push('## Decisions Verification — PASS');
    lines.push('');
    lines.push(`- Decisions count: ${report.decisionsVerification.decisionsCount}`);
    lines.push(`- Approved for apply: ${report.decisionsVerification.approvedForApply}`);
    lines.push('');
  }

  if (report.failingCommands && report.failingCommands.length > 0) {
    lines.push('## Failing Commands');
    lines.push('');
    for (const f of report.failingCommands) {
      lines.push(`### [${f.index + 1}] ${f.literal}`);
      lines.push(`Exit code: **${f.exitCode}**`);
      lines.push('');
      lines.push('```');
      lines.push('[stderr]');
      lines.push(f.stderrTail || '(empty)');
      lines.push('```');
      lines.push('');
    }
  }

  lines.push(`**Verdict: ${report.verdict}**`);
  lines.push('');

  writeFileSync(join(LITERAL_DIR, 'latest.md'), lines.join('\n'), 'utf8');
  process.stderr.write(`[LITERAL-GATE] Written: ${join(LITERAL_DIR, 'latest.json')}\n`);
  process.stderr.write(`[LITERAL-GATE] Written: ${join(LITERAL_DIR, 'latest.md')}\n`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write(`[LITERAL-GATE] === Literal Validation Gate ===\n`);
  process.stderr.write(`[LITERAL-GATE] Required commands: ${REQUIRED_COMMANDS.length}\n`);

  // Pre-flight: verify decisions file
  const decisionsCheck = verifyDecisions();
  if (decisionsCheck.errors.length > 0) {
    process.stderr.write(`[LITERAL-GATE] DECISIONS CHECK FAILED:\n`);
    decisionsCheck.errors.forEach((e) => process.stderr.write(`  - ${e}\n`));
    process.exit(1);
  }
  process.stderr.write(`[LITERAL-GATE] Decisions check: PASS (${decisionsCheck.decisionsCount} decisions, ${decisionsCheck.approvedForApply} approved)\n`);

  // Pre-flight: verify contracts
  const contractsCheck = verifyContracts();
  process.stderr.write(`[LITERAL-GATE] BM-002 label: "${contractsCheck.bm002Label}" ${contractsCheck.bm002Match ? '✓' : '✗'}\n`);
  process.stderr.write(`[LITERAL-GATE] BM-003 label: "${contractsCheck.bm003Label}" ${contractsCheck.bm003Match ? '✓' : '✗'}\n`);

  // Parse issue counts BEFORE running any commands (baseline reference)
  const issueCountsBefore = parseAuditIssueCounts();
  const fixPlanCounts = parseFixPlanCounts();

  // Run commands in order, with appropriate timeouts
  // audit:docx-fidelity can take up to 10 minutes
  const results = [];
  const TIMEOUT_DEFAULT = 180000;
  const TIMEOUT_LONG = 600000; // 10 minutes for fidelity checks

  for (const cmd of REQUIRED_COMMANDS) {
    process.stderr.write(`[LITERAL-GATE] Running: ${cmd.literal}\n`);
    const timeout = cmd.args.includes('audit') ? TIMEOUT_LONG : TIMEOUT_DEFAULT;
    const result = runLiteralCommand(cmd, timeout);
    results.push(result);
    process.stderr.write(`[LITERAL-GATE]   -> ${result.status} (exit ${result.exitCode}, ${result.durationMs}ms)\n`);

    // If any command fails, strict exit 1 immediately
    if (result.status === 'FAIL') {
      process.stderr.write(`[LITERAL-GATE] STRICT FAIL: "${cmd.literal}" exited ${result.exitCode}\n`);
      if (result.stderrTail) {
        process.stderr.write(`[LITERAL-GATE] stderr: ${result.stderrTail.slice(0, 500)}\n`);
      }
    }
  }

  // Check for any failures
  const failing = results.filter((r) => r.status === 'FAIL');
  const allPass = failing.length === 0;

  // Parse issue counts AFTER commands 4 and 5 (the audit+plan cycle)
  const issueCountsAfter = parseAuditIssueCounts();

  // Compute delta
  const issueDelta = issueCountsAfter ? {
    baseline: BASELINE,
    current: issueCountsAfter,
    delta: {
      totalIssues: issueCountsAfter.totalIssues - BASELINE.totalIssues,
      BAD_LABEL: issueCountsAfter.BAD_LABEL - BASELINE.BAD_LABEL,
      UI_VISIBLE_BAD_METADATA: issueCountsAfter.UI_VISIBLE_BAD_METADATA - BASELINE.UI_VISIBLE_BAD_METADATA,
    },
  } : null;

  // Strict delta checks
  let deltaFailed = false;
  if (issueDelta) {
    if (issueDelta.current.totalIssues > issueDelta.baseline.totalIssues) {
      process.stderr.write(`[LITERAL-GATE] DELTA FAIL: totalIssues ${issueDelta.current.totalIssues} > baseline ${issueDelta.baseline.totalIssues}\n`);
      deltaFailed = true;
    }
    if (issueDelta.current.BAD_LABEL > issueDelta.baseline.BAD_LABEL) {
      process.stderr.write(`[LITERAL-GATE] DELTA FAIL: BAD_LABEL ${issueDelta.current.BAD_LABEL} > baseline ${issueDelta.baseline.BAD_LABEL}\n`);
      deltaFailed = true;
    }
    if (issueDelta.current.UI_VISIBLE_BAD_METADATA > issueDelta.baseline.UI_VISIBLE_BAD_METADATA) {
      process.stderr.write(`[LITERAL-GATE] DELTA FAIL: UI_VISIBLE_BAD_METADATA ${issueDelta.current.UI_VISIBLE_BAD_METADATA} > baseline ${issueDelta.baseline.UI_VISIBLE_BAD_METADATA}\n`);
      deltaFailed = true;
    }
  }

  // Determine verdict
  const verdict = (allPass && !deltaFailed && contractsCheck.bm002Match && contractsCheck.bm003Match) ? 'PASS' : 'FAIL';

  process.stderr.write(`[LITERAL-GATE] Verdict: ${verdict}\n`);

  // Build report
  const report = {
    generatedAt: new Date().toISOString(),
    requiredCommands: REQUIRED_COMMANDS.map((c) => ({ index: c.index, command: c.command, args: c.args, literal: c.literal })),
    results,
    issueDelta,
    fixPlanClassificationCounts: fixPlanCounts,
    contractVerification: {
      bm002DocumentCodeLabel: contractsCheck.bm002Label,
      bm003DocumentCodeLabel: contractsCheck.bm003Label,
      approvedLabelsPresent: contractsCheck.bm002Match && contractsCheck.bm003Match,
    },
    decisionsVerification: decisionsCheck,
    failingCommands: failing,
    verdict,
  };

  writeReport(report);

  if (verdict === 'FAIL') {
    process.stderr.write(`[LITERAL-GATE] STRICT EXIT: verdict=FALL, exiting 1\n`);
    process.exit(1);
  }

  process.stderr.write(`[LITERAL-GATE] === COMPLETE ===\n`);
  process.exit(0);
}

main();
