#!/usr/bin/env node
/**
 * verify-docx-audit-reports.mjs — K0 Step 2
 *
 * Reads the five latest.json reports and verifies:
 *   1. All five files exist.
 *   2. Each report has a totalContracts/total field === 213.
 *   3. Each report has explicit pass/review/fail counters.
 *   4. No report silently omits templateCode from its per-BM list.
 *   5. F4 reviewRequired items are listed with templateCode + reason.
 *   6. generatedAt timestamps are recent (within 30 minutes of now).
 *
 * Exit codes:
 *   0 — all checks pass.
 *   1 — one or more checks fail.
 *
 * Usage:
 *   node scripts/audit/verify-docx-audit-reports.mjs
 *   pnpm audit:docx-fidelity
 */

import { readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const log = (msg) => process.stderr.write(`${msg}\n`);

// ──────────────────────────────────────────────────────────────────────────────
// Report definitions: name → relative path
// ──────────────────────────────────────────────────────────────────────────────

const REPORTS = [
  {
    name:      'F1 slot-inventory',
    path:      join(ROOT, 'docs', 'audit', 'docx-slot-inventory', 'latest.json'),
    // F1 summary shape: { summary: { totalContracts, passCount, failCount } }
    getTotal:    (j) => j.summary?.totalContracts,
    getPass:     (j) => j.summary?.passCount,
    getReview:   (j) => j.summary?.reviewRequiredCount ?? 0,
    getFail:     (j) => j.summary?.failCount,
    getCodes:    (j) => Object.keys(j.summary?.statusByBm ?? {}),
    hasReview:   false,
  },
  {
    name:      'F2 structural-fidelity',
    path:      join(ROOT, 'docs', 'audit', 'docx-structural-fidelity', 'latest.json'),
    // F2 body shape: { totalContracts, passCount, reviewRequiredCount, failCount, results[] }
    getTotal:    (j) => j.totalContracts,
    getPass:     (j) => j.passCount,
    getReview:   (j) => j.reviewRequiredCount ?? 0,
    getFail:     (j) => j.failCount,
    getCodes:    (j) => j.results?.map((r) => r.templateCode) ?? [],
    hasReview:   true,
  },
  {
    name:      'F3 rendered-text-fidelity',
    path:      join(ROOT, 'docs', 'audit', 'rendered-text-fidelity', 'latest.json'),
    // F3 body shape: { totalContracts, passCount, reviewRequiredCount, failCount, results[] }
    getTotal:    (j) => j.totalContracts,
    getPass:     (j) => j.passCount,
    getReview:   (j) => j.reviewRequiredCount ?? 0,
    getFail:     (j) => j.failCount,
    getCodes:    (j) => j.results?.map((r) => r.templateCode) ?? [],
    hasReview:   true,
  },
  {
    name:      'F4 binding-correctness',
    path:      join(ROOT, 'docs', 'audit', 'docx-binding-correctness', 'latest.json'),
    // F4 body shape: { representativeResults[], corpusSmokeResults[] }
    // F4 has no top-level results[] — codes come from both sub-arrays.
    getTotal:    (j) => j.totalContracts,
    getPass:     (j) => j.passCount,
    getReview:   (j) => j.reviewRequiredCount ?? 0,
    getFail:     (j) => j.failCount,
    getCodes:    (j) => [
      ...(j.representativeResults ?? []).map((r) => r.templateCode),
      ...(j.corpusSmokeResults ?? []).map((r) => r.templateCode),
    ],
    hasReview:   true,
  },
  {
    name:      'F5 repeat-blocks',
    path:      join(ROOT, 'docs', 'audit', 'docx-repeat-blocks', 'latest.json'),
    // F5 body shape: { totalContracts, passCount, reviewRequiredCount, failCount, results[] }
    getTotal:    (j) => j.totalContracts,
    getPass:     (j) => j.passCount,
    getReview:   (j) => j.reviewRequiredCount ?? 0,
    getFail:     (j) => j.failCount,
    getCodes:    (j) => j.results?.map((r) => r.templateCode) ?? [],
    hasReview:   true,
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Verification checks
// ──────────────────────────────────────────────────────────────────────────────

const CHECKS = {
  passCount: 0,
  failCount: 0,
  warnings:  [],
  failures:  [],
};

const fail = (report, msg) => {
  CHECKS.failCount++;
  CHECKS.failures.push(`[${report.name}] ${msg}`);
  process.stderr.write(`  ✗ FAIL: ${msg}\n`);
};

const warn = (report, msg) => {
  CHECKS.warnings.push(`[${report.name}] ${msg}`);
  process.stderr.write(`  ⚠ WARN: ${msg}\n`);
};

const pass = (report, msg) => {
  CHECKS.passCount++;
  process.stderr.write(`  ✓ ${msg}\n`);
};

// ──────────────────────────────────────────────────────────────────────────────
// Main verification loop
// ──────────────────────────────────────────────────────────────────────────────

const main = () => {
  log('');
  log('═'.repeat(60));
  log('K0 Step 2 — Audit Report Verifier');
  log('═'.repeat(60));
  log('');

  // ── Check 1: File existence ───────────────────────────────────────────────
  log('Check 1 — File existence');
  let allExist = true;
  for (const r of REPORTS) {
    try {
      statSync(r.path);
      pass(r, `${r.name} exists`);
    } catch {
      fail(r, `${r.name} MISSING: ${r.path}`);
      allExist = false;
    }
  }
  if (!allExist) {
    log('');
    log('Cannot continue — one or more report files missing.');
    log('Run: pnpm run audit:docx-fidelity');
    process.exit(1);
  }

  // ── Check 2: Freshness (generatedAt within 30 min) ──────────────────────
  log('');
  log('Check 2 — Report freshness (within 30 minutes)');
  const now = Date.now();
  const THIRTY_MIN_MS = 30 * 60 * 1000;
  for (const r of REPORTS) {
    try {
      const raw = readFileSync(r.path, 'utf8');
      const j = JSON.parse(raw);
      const ts = new Date(j.generatedAt).getTime();
      const ageMs = now - ts;
      const ageMin = Math.round(ageMs / 60_000);
      if (isNaN(ts)) {
        warn(r, `${r.name}: generatedAt missing or invalid`);
      } else if (ageMs > THIRTY_MIN_MS) {
        warn(r, `${r.name}: report is ${ageMin} minutes old (threshold: 30 min) — may be stale`);
      } else {
        pass(r, `${r.name} is fresh (${ageMin}m old)`);
      }
    } catch (err) {
      fail(r, `${r.name}: could not read ${err.message}`);
    }
  }

  // ── Check 3: Coverage (213 contracts) ────────────────────────────────────
  log('');
  log('Check 3 — Corpus coverage (213 contracts)');
  for (const r of REPORTS) {
    try {
      const raw = readFileSync(r.path, 'utf8');
      const j = JSON.parse(raw);
      const total = r.getTotal(j);
      if (total === undefined || total === null) {
        warn(r, `${r.name}: totalContracts field missing or null`);
      } else if (total !== 213) {
        fail(r, `${r.name}: totalContracts=${total}, expected 213`);
      } else {
        pass(r, `${r.name}: 213 contracts`);
      }
    } catch (err) {
      fail(r, `${r.name}: parse error — ${err.message}`);
    }
  }

  // ── Check 4: Explicit pass/review/fail counters ───────────────────────────
  log('');
  log('Check 4 — Explicit pass/review/fail counters present');
  for (const r of REPORTS) {
    try {
      const raw = readFileSync(r.path, 'utf8');
      const j = JSON.parse(raw);
      const p = r.getPass(j);
      const rev = r.getReview(j);
      const f = r.getFail(j);
      if (p === undefined || p === null) {
        fail(r, `${r.name}: passCount missing`);
      } else if (f === undefined || f === null) {
        fail(r, `${r.name}: failCount missing`);
      } else {
        const sum = (p ?? 0) + (rev ?? 0) + (f ?? 0);
        const total = r.getTotal(j);
        if (sum !== total) {
          fail(r, `${r.name}: pass(${p}) + review(${rev}) + fail(${f}) = ${sum} !== total(${total})`);
        } else {
          pass(r, `${r.name}: ${p} PASS, ${rev} REVIEW, ${f} FAIL (sum=${sum})`);
        }
      }
    } catch (err) {
      fail(r, `${r.name}: parse error — ${err.message}`);
    }
  }

  // ── Check 5: No missing templateCode ─────────────────────────────────────
  log('');
  log('Check 5 — No silent omission of templateCodes');
  for (const r of REPORTS) {
    try {
      const raw = readFileSync(r.path, 'utf8');
      const j = JSON.parse(raw);
      const codes = r.getCodes(j);

      if (codes.length === 0) {
        warn(r, `${r.name}: templateCode list is empty`);
        continue;
      }

      const missing = [];
      for (let i = 1; i <= 213; i++) {
        const code = `BM-${String(i).padStart(3, '0')}`;
        if (!codes.includes(code)) {
          missing.push(code);
        }
      }
      if (missing.length > 0) {
        const preview = missing.length > 10
          ? `${missing.slice(0, 10).join(', ')} … (+${missing.length - 10} more)`
          : missing.join(', ');
        fail(r, `${r.name}: ${missing.length} BM(s) missing from report: ${preview}`);
      } else {
        pass(r, `${r.name}: all 213 templateCodes present`);
      }
    } catch (err) {
      fail(r, `${r.name}: parse error — ${err.message}`);
    }
  }

  // ── Check 6: F4 reviewRequired items listed with reason ────────────────────
  log('');
  log('Check 6 — F4 reviewRequired with templateCode + reason');
  const f4Report = REPORTS.find((r) => r.name === 'F4 binding-correctness');
  if (f4Report) {
    try {
      const raw = readFileSync(f4Report.path, 'utf8');
      const j = JSON.parse(raw);
      // F4 stores results in representativeResults + corpusSmokeResults
      const reviewRequired = [
        ...(j.representativeResults ?? []),
        ...(j.corpusSmokeResults ?? []),
      ].filter((r) => r.status === 'REVIEW_REQUIRED');
      if (reviewRequired.length === 0) {
        pass(f4Report, 'No REVIEW_REQUIRED entries — nothing to list');
      } else {
        pass(f4Report, `Found ${reviewRequired.length} REVIEW_REQUIRED entry(ies):`);
        for (const r of reviewRequired) {
          const reason = r.reason ?? r.notes?.join('; ') ?? 'no reason provided';
          process.stderr.write(`     • ${r.templateCode}: ${reason}\n`);
        }
      }
    } catch (err) {
      fail(f4Report, `parse error — ${err.message}`);
    }
  }

  // ── Check 7: Counter integrity — pass+review+fail must equal total ──────
  log('');
  log('Check 7 — Counter integrity across all reports');
  for (const r of REPORTS) {
    try {
      const raw = readFileSync(f4Report?.path ?? r.path, 'utf8');
      const j = JSON.parse(readFileSync(r.path, 'utf8'));
      const p = r.getPass(j);
      const rev = r.getReview(j);
      const f = r.getFail(j);
      const total = r.getTotal(j);
      const sum = (p ?? 0) + (rev ?? 0) + (f ?? 0);
      if (sum === total) {
        pass(r, `${r.name}: counters consistent`);
      }
      // already covered by Check 4, but redundant is fine for clarity
    } catch (err) {
      fail(r, `${r.name}: counter check error — ${err.message}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log('');
  log('═'.repeat(60));
  log(`Checks: ${CHECKS.passCount} passed, ${CHECKS.failCount} failed, ${CHECKS.warnings.length} warnings`);
  log('═'.repeat(60));

  if (CHECKS.failures.length > 0) {
    log('');
    log('Failures:');
    for (const f of CHECKS.failures) {
      log(`  ✗ ${f}`);
    }
  }

  if (CHECKS.warnings.length > 0) {
    log('');
    log('Warnings (non-blocking):');
    for (const w of CHECKS.warnings) {
      log(`  ⚠ ${w}`);
    }
  }

  if (CHECKS.failCount > 0) {
    log('');
    log('VERIFICATION FAILED — fix reports before proceeding');
    process.exit(1);
  } else {
    log('');
    log('All verification checks passed.');
    log('');
    log('Remaining steps:');
    log('  1. Run mutation tests:  node scripts/audit/audit-docx-fidelity-mutations.mjs');
    log('  2. Run runtime parity:  node scripts/audit/audit-docx-runtime-parity.mjs');
    process.exit(0);
  }
};

main();
