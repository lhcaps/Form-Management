#!/usr/bin/env node
/**
 * validate-review-batch-1-literal-gate.mjs
 *
 * Independent literal validation gate for FORMS_ROOT_CAUSE_REVIEW_BATCH_1.
 *
 * Rules:
 * - Runs exactly the script names that exist in package.json.
 * - Uses execFileSync(pnpmBin, args) — no shell string construction.
 * - No downgrade of failures. Any non-zero = FAIL, exit 1.
 * - No dependency on apply-forms-root-cause-review-batch-1-approved.mjs.
 *
 * Command slots:
 *   [1] contract:validate     — pre-plan contract validation
 *   [2] contract:compile     — pre-plan contract compilation
 *   [3] gate:forms:213      — form gate
 *   [4] audit:forms-root-cause  — pre-plan root-cause audit
 *   [5] plan:forms-root-cause-fixes  — fix-plan regeneration
 *   [6] audit:docx-fidelity    — post-plan DOCX fidelity
 *   [7] audit:contract-sync    — post-plan contract sync
 *   [8] --filter test         — contract test suite
 *   [9] typecheck             — type check
 */

import { platform } from 'node:os';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync, execSync } from 'node:child_process';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const STRICT_MODE = process.argv.includes('--strict');
const APPLY_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1', 'apply-approved');
const LITERAL_DIR = join(APPLY_DIR, 'literal-validation-gate');
const DECISIONS_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1', 'decisions.approved.json');
const AUDIT_LATEST_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const FIXPLAN_LATEST_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

const BASELINE = {
  totalIssues: 3460,
  BAD_LABEL: 453,
  UI_VISIBLE_BAD_METADATA: 96,
};

// =============================================================================
// REQUIRED COMMANDS — exact script names from package.json
// =============================================================================

const REQUIRED_COMMANDS = [
  { index: 0, command: 'pnpm', args: ['contract:validate'],           literal: 'pnpm contract:validate' },
  { index: 1, command: 'pnpm', args: ['contract:compile'],           literal: 'pnpm contract:compile' },
  { index: 2, command: 'pnpm', args: ['gate:forms:213'],            literal: 'pnpm gate:forms:213' },
  { index: 3, command: 'pnpm', args: ['audit:forms-root-cause'],    literal: 'pnpm audit:forms-root-cause' },
  { index: 4, command: 'pnpm', args: ['plan:forms-root-cause-fixes'], literal: 'pnpm plan:forms-root-cause-fixes' },
  { index: 5, command: 'pnpm', args: ['audit:docx-fidelity'],       literal: 'pnpm audit:docx-fidelity' },
  { index: 6, command: 'pnpm', args: ['audit:contract-sync'],         literal: 'pnpm audit:contract-sync' },
  { index: 7, command: 'pnpm', args: ['--filter', '@qllaw/form-contracts', 'test'], literal: 'pnpm --filter @qllaw/form-contracts test' },
  { index: 8, command: 'pnpm', args: ['typecheck'],                  literal: 'pnpm typecheck' },
];

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function tail(str, n = 200) {
  if (!str || typeof str !== 'string') return '';
  const lines = str.split('\n');
  return lines.slice(-n).join('\n');
}

// On Windows, pnpm.cmd requires shell execution because pnpm is a batch file.
// We hardcode 'pnpm.cmd' — never from user input — so shell injection is not a risk.
// On Unix, use execFileSync for proper process separation.
function pnpmBin() {
  return platform() === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

function runCommand(entry, timeoutMs = TIMEOUT.default) {
  const start = Date.now();
  const bin = pnpmBin();
  const shellCmd = `${bin} ${entry.args.join(' ')}`;
  if (platform() === 'win32') {
    try {
      const stdout = execSync(shellCmd, {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 100 * 1024 * 1024,
        shell: true,
      });
      return { index: entry.index, literal: entry.literal, exitCode: 0, status: 'PASS', durationMs: Date.now() - start, stdoutTail: tail(stdout, 50), stderrTail: '' };
    } catch (err) {
      const exitCode = err.status ?? (err.signal ? 124 : 1);
      return { index: entry.index, literal: entry.literal, exitCode, status: 'FAIL', durationMs: Date.now() - start, stdoutTail: tail(err.stdout, 50), stderrTail: tail(err.stderr, 50) };
    }
  } else {
    try {
      const stdout = execFileSync(bin, entry.args, {
        cwd: ROOT,
        encoding: 'utf8',
        timeout: timeoutMs,
        maxBuffer: 100 * 1024 * 1024,
      });
      return { index: entry.index, literal: entry.literal, exitCode: 0, status: 'PASS', durationMs: Date.now() - start, stdoutTail: tail(stdout, 50), stderrTail: '' };
    } catch (err) {
      const exitCode = err.status ?? (err.signal ? 124 : 1);
      return { index: entry.index, literal: entry.literal, exitCode, status: 'FAIL', durationMs: Date.now() - start, stdoutTail: tail(err.stdout, 50), stderrTail: tail(err.stderr, 50) };
    }
  }
}

const TIMEOUT = {
  default: 180000,
  contract: 300000,
  audit: 900000,
};

// =============================================================================
// PRE-FLIGHT CHECKS
// =============================================================================

function verifyDecisions() {
  const raw = loadJson(DECISIONS_JSON);
  if (!raw) return { error: 'decisions.approved.json not found', errors: ['decisions.approved.json not found'] };
  const decisions = raw.decisions ?? [];
  const errors = [];

  if (decisions.length !== 24) errors.push(`decisions count ${decisions.length} != 24`);
  const approved = decisions.filter((d) => d.decision === 'APPROVED_FOR_APPLY');
  if (approved.length !== 2) errors.push(`approvedForApply ${approved.length} != 2`);
  const approvedIds = approved.map((d) => d.reviewGroupId).sort();
  if (JSON.stringify(approvedIds) !== JSON.stringify(['RG-001', 'RG-002'])) {
    errors.push(`approved groups ${JSON.stringify(approvedIds)} != ["RG-001","RG-002"]`);
  }

  const wave02 = new Set(['BM-068', 'BM-069', 'BM-073', 'BM-075', 'BM-077', 'BM-080', 'BM-082', 'BM-162', 'BM-163']);
  const wave02Approved = decisions.filter((d) => wave02.has(d.templateCode) && d.applyEligible === true);
  if (wave02Approved.length > 0) errors.push(`Wave 02 with applyEligible: ${wave02Approved.map((d) => d.reviewGroupId).join(',')}`);

  const legalApproved = decisions.filter((d) => d.path.startsWith('legalBasis.') && d.applyEligible === true);
  if (legalApproved.length > 0) errors.push(`legalBasis with applyEligible: ${legalApproved.map((d) => d.reviewGroupId).join(',')}`);

  const rejectedApproved = decisions.filter((d) => d.decision === 'REJECTED_NO_OP' && d.applyEligible === true);
  if (rejectedApproved.length > 0) errors.push(`REJECTED_NO_OP with applyEligible: ${rejectedApproved.map((d) => d.reviewGroupId).join(',')}`);

  return { decisionsCount: decisions.length, approvedForApply: approved.length, errors };
}

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
// ISSUE PARSING
// =============================================================================

function parseIssueCounts() {
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
// REPORT
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
    '## Required Commands (exact package.json script names)',
    '',
    '| # | Literal Command | Exit | Status | Duration |',
    '|---|----------------|------|--------|---------|',
  ];

  for (const r of report.results) {
    const badge = r.status === 'PASS' ? 'PASS' : `**${r.status}**`;
    lines.push(`| ${r.index + 1} | \`${r.literal}\` | ${r.exitCode} | ${badge} | ${r.durationMs}ms |`);
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
    lines.push(`- BM-002 document.documentCode: \`"${report.contractVerification.bm002DocumentCodeLabel}"\` ${report.contractVerification.bm002Match ? 'PASS' : 'FAIL'}`);
    lines.push(`- BM-003 document.documentCode: \`"${report.contractVerification.bm003DocumentCodeLabel}"\` ${report.contractVerification.bm003Match ? 'PASS' : 'FAIL'}`);
    lines.push('');
  }

  if (report.decisionsVerification && report.decisionsVerification.errors.length > 0) {
    lines.push('## Decisions Verification — ERRORS');
    lines.push('');
    for (const e of report.decisionsVerification.errors) lines.push(`- **${e}**`);
    lines.push('');
  } else if (report.decisionsVerification) {
    lines.push('## Decisions Verification — PASS');
    lines.push(`- Decisions: ${report.decisionsVerification.decisionsCount} | Approved: ${report.decisionsVerification.approvedForApply}`);
    lines.push('');
  }

  if (report.failingCommands && report.failingCommands.length > 0) {
    lines.push('## Failing Commands');
    lines.push('');
    for (const f of report.failingCommands) {
      lines.push(`### [${f.index + 1}] ${f.literal}`);
      lines.push(`Exit: **${f.exitCode}** | Duration: ${f.durationMs}ms`);
      if (f.stderrTail) {
        lines.push('');
        lines.push('```');
        lines.push('[stderr]');
        lines.push(f.stderrTail);
        lines.push('```');
      }
      lines.push('');
    }
  }

  lines.push(`**Verdict: ${report.verdict}**`);
  writeFileSync(join(LITERAL_DIR, 'latest.md'), lines.join('\n'), 'utf8');
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write(`[LITERAL-GATE] === Literal Validation Gate ===\n`);
  process.stderr.write(`[LITERAL-GATE] Strict mode: ${STRICT_MODE}\n`);

  // Pre-flight checks
  const decisionsCheck = verifyDecisions();
  if (decisionsCheck.errors.length > 0) {
    process.stderr.write(`[LITERAL-GATE] DECISIONS FAILED:\n`);
    decisionsCheck.errors.forEach((e) => process.stderr.write(`  - ${e}\n`));
    process.exit(1);
  }
  process.stderr.write(`[LITERAL-GATE] Decisions: PASS (${decisionsCheck.decisionsCount} decisions, ${decisionsCheck.approvedForApply} approved)\n`);

  const contractsCheck = verifyContracts();
  process.stderr.write(`[LITERAL-GATE] BM-002: "${contractsCheck.bm002Label}" ${contractsCheck.bm002Match ? 'PASS' : 'FAIL'}\n`);
  process.stderr.write(`[LITERAL-GATE] BM-003: "${contractsCheck.bm003Label}" ${contractsCheck.bm003Match ? 'PASS' : 'FAIL'}\n`);

  // Parse baseline issue counts (before running commands)
  const issueCountsBefore = parseIssueCounts();
  process.stderr.write(`[LITERAL-GATE] Baseline issues: ${issueCountsBefore?.totalIssues ?? 'unknown'}\n`);

  // Run commands in order
  const results = [];
  for (const entry of REQUIRED_COMMANDS) {
    const isContract = entry.args[0].startsWith('contract:');
    const isAudit = entry.args[0].startsWith('audit:');
    const timeout = isContract ? TIMEOUT.contract : isAudit ? TIMEOUT.audit : TIMEOUT.default;

    process.stderr.write(`[LITERAL-GATE] [${entry.index + 1}/9] Running: ${entry.literal}\n`);
    const result = runCommand(entry, timeout);
    results.push(result);

    const icon = result.status === 'PASS' ? 'PASS' : 'FAIL';
    process.stderr.write(`[LITERAL-GATE] [${entry.index + 1}/9] ${icon}: ${entry.literal} (exit ${result.exitCode}, ${result.durationMs}ms)\n`);

    if (result.status === 'FAIL') {
      if (result.stderrTail) {
        process.stderr.write(`[LITERAL-GATE]   stderr: ${result.stderrTail.split('\n').slice(0, 5).join(' | ')}\n`);
      }
    }
  }

  // Parse post-command issue counts
  const issueCountsAfter = parseIssueCounts();
  const fixPlanCounts = parseFixPlanCounts();

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

  // Strict checks
  const failing = results.filter((r) => r.status === 'FAIL');
  let deltaFailed = false;
  if (issueDelta) {
    if (issueDelta.current.totalIssues > issueDelta.baseline.totalIssues) {
      process.stderr.write(`[LITERAL-GATE] DELTA: totalIssues ${issueDelta.current.totalIssues} > baseline ${issueDelta.baseline.totalIssues}\n`);
      deltaFailed = true;
    }
    if (issueDelta.current.BAD_LABEL > issueDelta.baseline.BAD_LABEL) {
      process.stderr.write(`[LITERAL-GATE] DELTA: BAD_LABEL ${issueDelta.current.BAD_LABEL} > baseline ${issueDelta.baseline.BAD_LABEL}\n`);
      deltaFailed = true;
    }
    if (issueDelta.current.UI_VISIBLE_BAD_METADATA > issueDelta.baseline.UI_VISIBLE_BAD_METADATA) {
      process.stderr.write(`[LITERAL-GATE] DELTA: UI_VISIBLE_BAD_METADATA ${issueDelta.current.UI_VISIBLE_BAD_METADATA} > baseline ${issueDelta.baseline.UI_VISIBLE_BAD_METADATA}\n`);
      deltaFailed = true;
    }
  }

  const verdict = (failing.length === 0 && !deltaFailed && contractsCheck.bm002Match && contractsCheck.bm003Match) ? 'PASS' : 'FAIL';

  process.stderr.write(`[LITERAL-GATE] Verdict: ${verdict}\n`);
  if (failing.length > 0) {
    process.stderr.write(`[LITERAL-GATE] Failing commands: ${failing.map((f) => f.literal).join(', ')}\n`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    strictMode: STRICT_MODE,
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
  process.stderr.write(`[LITERAL-GATE] Report: ${join(LITERAL_DIR, 'latest.json')}\n`);

  if (verdict === 'FAIL') {
    process.stderr.write(`[LITERAL-GATE] EXIT 1\n`);
    process.exit(1);
  }

  process.stderr.write(`[LITERAL-GATE] === COMPLETE ===\n`);
  process.exit(0);
}

main();
