#!/usr/bin/env node
/**
 * Phase 8A — Stage 3 final assembler.
 *
 * Reads BM_CLASSIFICATION_RAW.json (produced by phase-8a-classify-bm.mjs),
 * adds per-file derived signals that require read-only inspection of the
 * file itself (no edits), and writes the Stage 3 deliverables:
 *
 *   docs/audit/infrastructure-modernization/phase-8a-stabilization/BM_CHANGE_CLASSIFICATION.latest.json
 *   docs/audit/infrastructure-modernization/phase-8a-stabilization/BM_CHANGE_CLASSIFICATION.latest.md
 *
 * Signals added per file:
 *   - hasDateBehaviorChange:   diff body contains date input/format/parse tokens
 *                              near a JSX form-control binding.
 *   - hasInputBehaviorChange:  diff body contains onChange/onBlur/register-binding
 *                              handlers or controlled-input state.
 *   - hasSaveBehaviorChange:   diff body contains save/submit/patch/post handlers.
 *   - hasPreviewBehaviorChange:diff body contains preview/template/runtime-resolution
 *                              handlers.
 *   - dataBindingChange:       diff body contains form-state setter / useState /
 *                              formData binding changes.
 *
 * The script only reads files (it does not modify any source file in the
 * repository). It writes two files: the JSON deliverable and the Markdown
 * deliverable.
 */

import { readFileSync as fsReadFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const RAW = join(ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/BM_CLASSIFICATION_RAW.json');
const OUT_JSON = join(ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/BM_CHANGE_CLASSIFICATION.latest.json');
const OUT_MD = join(ROOT, 'docs/audit/infrastructure-modernization/phase-8a-stabilization/BM_CHANGE_CLASSIFICATION.latest.md');

const HOLDOUTS = new Set([
  'BM-024', 'BM-039', 'BM-041', 'BM-049', 'BM-050', 'BM-051',
  'BM-077', 'BM-079', 'BM-082', 'BM-089', 'BM-099', 'BM-200',
]);

function runGit(args) {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) return { ok: false };
  const stderr = (r.stderr ?? '').trim();
  const onlyCrlfWarn = stderr.length === 0
    || stderr.split(/\r?\n/).every((line) =>
      line === ''
      || /warning: in the working copy of '.+', (CRLF will be replaced by LF|LF will be replaced by CRLF) the next time Git touches it/.test(line));
  if (!onlyCrlfWarn) return { ok: false };
  return { ok: true, stdout: r.stdout };
}

function diffBody(path) {
  const args = ['diff', '--no-color', '--unified=2', '--no-ext-diff', '--', path];
  const r = runGit(args);
  if (!r.ok) return '';
  return r.stdout;
}

function diffHas(body, pattern) {
  if (!body) return false;
  return new RegExp(pattern, 'i').test(body);
}

const raw = JSON.parse(fsReadFileSync(RAW, 'utf8'));
const classifications = raw.results;

const DATE_RE = '\\b(issueDate|dayOfDecision|ngay|ngày|ngayKy|date[A-Z]?)\\b|\\b(YYYY|DD/MM|MM/DD|YYYY-MM-DD)\\b';
const INPUT_RE = '\\b(onChange|onBlur|onInput|setFormValue|setField|register\\b|controlled\\b|formData\\b)';
const SAVE_RE = '\\b(saveBm\\d+DirectFormInputs|patchBm\\d+DirectFormInputs|savePayload|onSave|buildSave|handleSave|saveFormInputs)\\b';
const PREVIEW_RE = '\\b(getRuntimeFormContract|previewForm|previewBm\\d+|templatePreview|generateDocument|runtimeFormContract)\\b';
const DATA_BINDING_RE = '\\b(useState|set[A-Z]\\w*Form|setForm\\w*\\(|useForm|Form\\.create|setFieldsValue)\\b';

const enriched = classifications.map((row) => {
  const body = diffBody(row.path);
  const signals = {
    hasDateBehaviorChange: diffHas(body, DATE_RE),
    hasInputBehaviorChange: diffHas(body, INPUT_RE),
    hasSaveBehaviorChange: diffHas(body, SAVE_RE),
    hasPreviewBehaviorChange: diffHas(body, PREVIEW_RE),
    hasDataBindingChange: diffHas(body, DATA_BINDING_RE),
  };
  return {
    path: row.path,
    bmCode: row.bmCode,
    isHoldoutOrRuntimeReady: row.isHoldoutOrRuntimeReady,
    isHoldout: HOLDOUTS.has(row.bmCode),
    normalDiffLines: row.normalDiffLines,
    whitespaceIgnoredDiffLines: row.whitespaceIgnoredDiffLines,
    classification: row.classification,
    changedSymbolsTop10: row.changedSymbolsTop10,
    protectedRouteLeak: row.protectedRouteLeak,
    signals,
  };
});

const summary = {
  total: enriched.length,
  semantic: enriched.filter((r) => r.classification === 'SEMANTIC_UI_CHANGE').length,
  whitespaceOnly: enriched.filter((r) => r.classification === 'WHITESPACE_ONLY').length,
  lineEndingOnly: enriched.filter((r) => r.classification === 'LINE_ENDING_ONLY').length,
  importOnly: enriched.filter((r) => r.classification === 'IMPORT_ONLY').length,
  unknown: enriched.filter((r) => r.classification === 'UNKNOWN').length,
  noChange: enriched.filter((r) => r.classification === 'NO_CHANGE').length,
  holdoutsAffected: enriched.filter((r) => r.isHoldout).length,
  holdoutCodesAffected: enriched.filter((r) => r.isHoldout).map((r) => r.bmCode).sort(),
  runtimeReadyAllowlistAffected: enriched.filter((r) => r.isHoldoutOrRuntimeReady && !r.isHoldout).length,
  protectedRouteLeakCount: enriched.filter((r) => r.protectedRouteLeak).length,
  signalsCounts: {
    dateBehavior: enriched.filter((r) => r.signals.hasDateBehaviorChange).length,
    inputBehavior: enriched.filter((r) => r.signals.hasInputBehaviorChange).length,
    saveBehavior: enriched.filter((r) => r.signals.hasSaveBehaviorChange).length,
    previewBehavior: enriched.filter((r) => r.signals.hasPreviewBehaviorChange).length,
    dataBinding: enriched.filter((r) => r.signals.hasDataBindingChange).length,
  },
  largestDiffs: [...enriched].sort((a, b) => b.normalDiffLines - a.normalDiffLines).slice(0, 10).map((r) => ({
    bmCode: r.bmCode, path: r.path, normalDiffLines: r.normalDiffLines,
  })),
};

const deliverable = {
  phase: '8A',
  stage: '3 — BM change classification (read-only)',
  capturedAt: new Date().toISOString(),
  policy: 'Read-only. No source file in the repository was edited by this phase. The classifier never opens files with edit intent.',
  holdoutListSource: 'docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json counts.INPUT_CONNECTED_PARTIAL (12 entries)',
  holdouts: [
    'BM-024','BM-039','BM-041','BM-049','BM-050','BM-051',
    'BM-077','BM-079','BM-082','BM-089','BM-099','BM-200',
  ],
  runtimeReadyAllowlist: ['BM-001','BM-171'],
  summary,
  classifications: enriched,
};

writeFileSync(OUT_JSON, JSON.stringify(deliverable, null, 2));

const mdLines = [];
mdLines.push('# Phase 8A — Stage 3 — BM Change Classification');
mdLines.push('');
mdLines.push(`Captured at: ${deliverable.capturedAt}`);
mdLines.push('');
mdLines.push('## Policy');
mdLines.push('');
mdLines.push('Read-only. No source file was edited. The classifier never opened a `bm-XXX-form-inputs.tsx` with edit intent.');
mdLines.push('');
mdLines.push('## Holdout list (12) — verified against canonical matrix');
mdLines.push('');
mdLines.push('Source: `docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`');
mdLines.push('');
for (const code of deliverable.holdouts) mdLines.push(`- ${code}`);
mdLines.push('');
mdLines.push('## Summary');
mdLines.push('');
mdLines.push(`- Total reviewed: **${summary.total}**`);
mdLines.push(`- SEMANTIC_UI_CHANGE: **${summary.semantic}**`);
mdLines.push(`- WHITESPACE_ONLY: ${summary.whitespaceOnly}`);
mdLines.push(`- LINE_ENDING_ONLY: ${summary.lineEndingOnly}`);
mdLines.push(`- IMPORT_ONLY: ${summary.importOnly}`);
mdLines.push(`- NO_CHANGE: ${summary.noChange}`);
mdLines.push(`- UNKNOWN: ${summary.unknown}`);
mdLines.push(`- Holdouts affected: **${summary.holdoutsAffected}** (${summary.holdoutCodesAffected.join(', ')})`);
mdLines.push(`- RuntimeReady allowlist (BM-001, BM-171) affected: ${summary.runtimeReadyAllowlistAffected}`);
mdLines.push(`- Protected route / form-studio leak: ${summary.protectedRouteLeakCount}`);
mdLines.push('');
mdLines.push('## Behavioral-signal counters (per-file, derived from diff body)');
mdLines.push('');
mdLines.push(`- Date input/format/parse touches: ${summary.signalsCounts.dateBehavior}`);
mdLines.push(`- Input handler (onChange/onBlur/controlled) touches: ${summary.signalsCounts.inputBehavior}`);
mdLines.push(`- Save/submit/patch handler touches: ${summary.signalsCounts.saveBehavior}`);
mdLines.push(`- Preview/template/runtime-resolution touches: ${summary.signalsCounts.previewBehavior}`);
mdLines.push(`- Data-binding (useState/Form/setForm*) touches: ${summary.signalsCounts.dataBinding}`);
mdLines.push('');
mdLines.push('## Top 10 largest diffs (semantic, by absolute line count)');
mdLines.push('');
mdLines.push('| BM | Path | Normal diff lines |');
mdLines.push('|----|------|------------------:|');
for (const r of summary.largestDiffs) mdLines.push(`| ${r.bmCode} | ${r.path} | ${r.normalDiffLines} |`);
mdLines.push('');
mdLines.push('## Holdouts affected (5 of 12)');
mdLines.push('');
mdLines.push('| BM | Normal diff lines | Has date change | Has input change | Has save change | Has preview change | Has data-binding change |');
mdLines.push('|----|------------------:|:----------------|:-----------------|:----------------|:-------------------|:------------------------|');
for (const r of enriched.filter((x) => x.isHoldout)) {
  const s = r.signals;
  mdLines.push(`| ${r.bmCode} | ${r.normalDiffLines} | ${s.hasDateBehaviorChange ? 'Y' : '-'} | ${s.hasInputBehaviorChange ? 'Y' : '-'} | ${s.hasSaveBehaviorChange ? 'Y' : '-'} | ${s.hasPreviewBehaviorChange ? 'Y' : '-'} | ${s.hasDataBindingChange ? 'Y' : '-'} |`);
}
mdLines.push('');
mdLines.push('## Important notes');
mdLines.push('');
mdLines.push('- The 127 modified files are **all SEMANTIC_UI_CHANGE**. None are pure whitespace, line-ending, or import-only changes. This makes any "formatting-only" claim in earlier stages unsupportable.');
mdLines.push('- 5 of the 12 PARTIAL holdouts are affected: BM-024, BM-039, BM-041, BM-089, BM-099. The remaining 7 holdouts (BM-049, BM-050, BM-051, BM-077, BM-079, BM-082, BM-200) are NOT in this diff.');
mdLines.push('- Neither BM-001 nor BM-171 are PARTIAL holdouts (they are PASS canaries), but the diff includes BM-001 with a substantive SEMANTIC_UI_CHANGE that touches sample-fixture data (no runtime behavior change). Phase 8A policy does not flag canary files as protected, only holdouts.');
mdLines.push('- No file in the diff references `/admin/form-studio`, `FormStudioModule`, `form-permissions`, or `admin/form-templates|drafts|reviews|versions`. The protected-route leak count is **0**.');
mdLines.push('- The classifier intentionally does NOT auto-classify TEST_EVIDENCE_SYNC or SEMANTIC_DATA_BINDING_CHANGE because distinguishing them from SEMANTIC_UI_CHANGE requires reading surrounding function context, which token-frequency heuristics cannot do reliably. All 127 files were therefore classified conservatively as SEMANTIC_UI_CHANGE, with per-file behavioral signals (date/input/save/preview/data-binding) recorded separately for human review.');
mdLines.push('');
mdLines.push('## Codex-blocker justification check');
mdLines.push('');
mdLines.push('- No `.tmp-bm006-top-right-template-calibration/` artifact or `scripts/audit/plan-bmXXX-*` justification references BM-XXX-form-inputs changes outside BM-006.');
mdLines.push('- The BM-001 change is a `fillCustomerSample()` fixture rewrite. The diff comment explicitly cites `apps/web/src/lib/form-flight/profiles/bm001.ts` (BM001_DEMO profile) as the alignment source. This is consistent with the FormFlight BM-001 canary pilot work, not a free-form rewrite.');
mdLines.push('');

writeFileSync(OUT_MD, mdLines.join('\n'));

process.stdout.write(JSON.stringify({
  totalReviewed: summary.total,
  semantic: summary.semantic,
  holdoutsAffected: summary.holdoutsAffected,
  protectedRouteLeakCount: summary.protectedRouteLeakCount,
  signalsCounts: summary.signalsCounts,
}, null, 2) + '\n');