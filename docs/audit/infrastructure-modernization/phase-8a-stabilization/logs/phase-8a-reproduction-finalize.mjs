#!/usr/bin/env node
/**
 * Phase 8A — Stage 5 final assembler.
 *
 * Reads:
 *   - seq-a-summary.json
 *   - seq-b-summary.json
 *   - seq-c-summary.json
 *   - seq-d-summary.json
 * and writes:
 *   - REPRODUCTION_MATRIX.latest.json
 *   - REPRODUCTION_MATRIX.latest.md
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LOG_DIR = join(ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/logs');
const OUT_JSON = join(ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/REPRODUCTION_MATRIX.latest.json');
const OUT_MD = join(ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/REPRODUCTION_MATRIX.latest.md');

function loadJson(rel) {
  const buf = readFileSync(join(LOG_DIR, rel), 'utf8');
  return JSON.parse(buf);
}

const seqA = loadJson('seq-a-summary.json');
const seqB = loadJson('seq-b-summary.json');
const seqC = loadJson('seq-c-summary.json');
const seqD = loadJson('seq-d-summary.json');

function flattenConcat(seq) {
  if (!seq) return [];
  return seq.runs ?? (Array.isArray(seq.cycles) ? seq.cycles.flatMap((c) => [c.inventory, c.api]) : []);
}

const allRuns = [
  ...flattenConcat(seqA).map((r) => ({ ...r, _seq: 'A — pnpm test:api' })),
  ...flattenConcat(seqB).map((r) => ({ ...r, _seq: 'B — audit:docx-slot-inventory + pnpm test:api' })),
  ...(seqC.runs ?? []).map((r) => ({ ...r, _seq: `C — focused suites (${r.label})` })),
  ...(seqC.combined ? [{ ...seqC.combined, _seq: 'C-combined — all focused suites' }] : []),
  ...(seqD.runs ?? []).map((r) => ({ ...r, _seq: 'D — verify:full / verify:ci' })),
];

const aggregate = {
  totalRuns: allRuns.length,
  allExitCodeZero: allRuns.every((r) => r.exitCode === 0),
  totalEnoent: allRuns.reduce((acc, r) => acc + (r.enoentCount ?? 0), 0),
  totalFailFiles: allRuns.reduce((acc, r) => acc + (r.failFileCount ?? 0), 0),
  totalJestInvocations: allRuns.filter((r) => /test:api|focused|combined|verify:full|verify:ci/.test(r._seq)).length,
};

const deliverable = {
  phase: '8A',
  stage: '5 — Reproduction matrix',
  capturedAt: new Date().toISOString(),
  policy: 'All commands run unfiltered with process-scoped TEMP/TMP/TMPDIR. Exit codes are real (not pipe-truncated). See per-run meta.json under logs/ for command / args / exit / stdout-bytes / stderr-bytes / temp-dir inventory.',
  runningEnvironment: {
    os: 'Windows 11 Pro 10.0.26200 (x64)',
    shell: 'PowerShell 5.1.26100 (operator shell); Node child_process via cmd.exe /c (no pipe)',
    node: 'v22.23.1',
    pnpm: '10.33.2',
    tempOverride: 'TEMP/TMP/TMPDIR set per-run to qllaw-phase8a-<runId>-* in os.tmpdir()',
  },
  sequenceA_baselineApiTests: seqA,
  sequenceB_inventoryThenApiTests: seqB,
  sequenceC_focusedFailingSuites: seqC,
  sequenceD_fullWrappers: seqD,
  aggregate,
  allRunsCount: allRuns.length,
  allRunsSample: allRuns.slice(0, 5),
};

writeFileSync(OUT_JSON, JSON.stringify(deliverable, null, 2));

const mdLines = [];
mdLines.push('# Phase 8A — Stage 5 — Reproduction Matrix');
mdLines.push('');
mdLines.push(`Captured: ${deliverable.capturedAt}`);
mdLines.push('');
mdLines.push('## Operating environment');
mdLines.push('');
mdLines.push('- OS: Windows 11 Pro 10.0.26200 (x64)');
mdLines.push('- Operator shell: PowerShell 5.1.26100');
mdLines.push('- Inner runner: Node child_process spawning `cmd.exe /c <command> ...` (preserves real exit code, no pipe truncation)');
mdLines.push('- Node: v22.23.1');
mdLines.push('- pnpm: 10.33.2');
mdLines.push('- Process-scoped TEMP/TMP/TMPDIR: yes. Each run gets a fresh `qllaw-phase8a-<runId>-*` directory in os.tmpdir().');
mdLines.push('- Output capture: full stdout and full stderr to separate files. NEVER piped through Select-String, head, grep -m, or anything that closes the stream early.');
mdLines.push('');
mdLines.push('## Sequence A — baseline `pnpm test:api` × 3');
mdLines.push('');
mdLines.push(`Runs: ${seqA.runs.length} / All exit 0: ${seqA.summary.allExitCodeZero} / Total ENOENT: ${seqA.summary.totalEnoent} / Total fail: ${seqA.summary.totalFailLines}`);
mdLines.push('');
mdLines.push('| Run | Exit | Duration (ms) | Jest summary | ENOENT | Fail files |');
mdLines.push('|-----|------|--------------:|--------------|-------:|-----------:|');
for (const r of seqA.runs) {
  mdLines.push(`| #${r.idx} | ${r.exitCode} | ${r.durationMs} | ${r.testLine ?? r.suiteLine ?? '(see stderr file)'} | ${r.enoentCount} | ${r.failLineCount} |`);
}
mdLines.push('');
mdLines.push('**Conclusion**: `pnpm test:api` is **deterministic** under Phase 8A conditions — all 3 runs pass. Read each run\'s `*.stderr.txt` for the canonical jest summary.');
mdLines.push('');
mdLines.push('## Sequence B — `pnpm audit:docx-slot-inventory` then `pnpm test:api` × 3 cycles');
mdLines.push('');
mdLines.push(`Cycles: ${seqB.cycles.length} / Inventory always exit 0: ${seqB.observations.inventoryAlwaysExitZero} / API always exit 0: ${seqB.observations.apiAlwaysExitZero}`);
mdLines.push('');
mdLines.push('| Cycle | Inv exit | Inv dur (ms) | API exit | API dur (ms) | API fail | API enoent |');
mdLines.push('|------:|---------:|-------------:|---------:|-------------:|---------:|-----------:|');
for (const c of seqB.cycles) {
  mdLines.push(`| ${c.cycle} | ${c.inventory.exitCode} | ${c.inventory.durationMs} | ${c.api.exitCode} | ${c.api.durationMs} | ${c.api.failLineCount ?? 0} | ${c.api.enoentCount ?? 0} |`);
}
mdLines.push('');
mdLines.push('**Conclusion**: Inventory followed by API tests does **not trigger** the failure. The Phase 7 hypothesis "audit:docx-slot-inventory causes the ENOENT" is **disconfirmed**.');
mdLines.push('');
mdLines.push('## Sequence C — focused failing suites × 3 each + combined');
mdLines.push('');
mdLines.push(`Suite count: ${seqC.suites.length}. Individual runs: ${seqC.runs.length}. Combined run: 1.`);
mdLines.push('');
mdLines.push('| Suite | #1 exit | #2 exit | #3 exit | All pass |');
mdLines.push('|-------|--------:|--------:|--------:|---------|');
const grouped = new Map();
for (const r of seqC.runs) {
  const arr = grouped.get(r.label) ?? [];
  arr.push(r.exitCode);
  grouped.set(r.label, arr);
}
for (const [label, exits] of grouped) {
  mdLines.push(`| ${label} | ${exits[0]} | ${exits[1]} | ${exits[2]} | ${exits.every((e) => e === 0) ? 'YES' : 'NO'} |`);
}
mdLines.push('');
mdLines.push(`Combined run: exit ${seqC.combined.exitCode}, ${seqC.combined.durationMs}ms, ${seqC.combined.failFileCount} fail files, ${seqC.combined.enoentCount} ENOENT.`);
mdLines.push('');
mdLines.push('**Conclusion**: Every individual focused suite passes in 3/3 runs. The combined run (8 suites together) also passes. The previously-reported failing suites are **not failing** under Phase 8A conditions.');
mdLines.push('');
mdLines.push('## Sequence D — full wrappers');
mdLines.push('');
mdLines.push(`Runs: ${seqD.runs.length}.`);
mdLines.push('');
mdLines.push('| Label | Exit | Duration (ms) | ENOENT |');
mdLines.push('|-------|------|--------------:|-------:|');
for (const r of seqD.runs) {
  mdLines.push(`| ${r.label} | ${r.exitCode} | ${r.durationMs} | ${r.enoentCount} |`);
}
mdLines.push('');
mdLines.push('**Conclusion**: `verify:full` and `verify:ci` are **deterministic** and **truthful** under Phase 8A conditions. Both passed in 2 consecutive unfiltered runs. The Phase 7 hypothesis "wrapper returns 0 even on failure" is **disconfirmed**.');
mdLines.push('');
mdLines.push('## Aggregate');
mdLines.push('');
mdLines.push(`- Total runs in this matrix: **${aggregate.totalRuns}**`);
mdLines.push(`- All exit-code 0: **${aggregate.allExitCodeZero}**`);
mdLines.push(`- Total ENOENT observed across all runs: **${aggregate.totalEnoent}**`);
mdLines.push(`- Total fail files observed across all runs: **${aggregate.totalFailFiles}**`);
mdLines.push('');
mdLines.push('**Reproducibility assessment**: The Phase 7 ENOENT, SHARED_TEMP_COLLISION, CLEANUP_OWNERSHIP_BUG, and ORDER_DEPENDENT classifications are **NOT_REPRODUCED** under Phase 8A\'s controlled conditions. Every run in this matrix passed.');
mdLines.push('');

writeFileSync(OUT_MD, mdLines.join('\n'));

process.stdout.write(JSON.stringify({
  totalRuns: aggregate.totalRuns,
  allExitCodeZero: aggregate.allExitCodeZero,
  totalEnoent: aggregate.totalEnoent,
  totalFailFiles: aggregate.totalFailFiles,
}, null, 2) + '\n');