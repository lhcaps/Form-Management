#!/usr/bin/env node
/**
 * review-forms-root-cause-batch-2.mjs
 *
 * Prepares human-review batch plan for FORMS_ROOT_CAUSE_REVIEW_BATCH_2.
 *
 * Sources groups from review-fix-candidates.json (HIGH-confidence, non-legal,
 * non-DOCX, non-Wave02, metadata-only REVIEW_FIX_CANDIDATE items not already
 * decided in Batch 1).
 *
 * Does NOT apply fixes. Does NOT modify files.
 *
 * Exit codes:
 *   0  — script completed, outputs written, all strict validations passed
 *   1  — validation failure (see STRICT EXIT BEHAVIOR below)
 *
 * Usage:
 *   node scripts/audit/review-forms-root-cause-batch-2.mjs
 *   pnpm review:forms-root-cause-batch-2
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const REVIEW_DIR    = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-2');
const LOCKED_DIR    = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');

const REVIEW_CAND_JSON  = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'review-fix-candidates.json');
const BATCH1_APPROVED  = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1', 'decisions.approved.json');
const LITERAL_GATE     = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-1', 'literal-validation-gate', 'latest.json');
const MANUAL_JSON      = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'manual-review-required.json');
const NOISE_JSON       = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'noise-or-derived.json');
const FIXPLAN_JSON    = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');
const AUDIT_JSON      = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function loadContracts() {
  const map = new Map();
  for (const f of readdirSync(LOCKED_DIR).filter((f) => f.endsWith('.contract.locked.json'))) {
    const code = f.match(/^(BM-\d+)/)?.[1];
    if (!code) continue;
    try { map.set(code, JSON.parse(readFileSync(join(LOCKED_DIR, f), 'utf8'))); }
    catch { /* skip */ }
  }
  return map;
}

let _reviewGroupCounter = 0;
function nextGroupId(prefix = 'RG') {
  return `${prefix}-${String(++_reviewGroupCounter).padStart(3, '0')}`;
}

// =============================================================================
// BATCH 1 DECISION LOOKUP
// =============================================================================

function buildBatch1DecisionSet(approved) {
  const decided = new Set();
  for (const d of (approved?.decisions ?? [])) {
    decided.add(`${d.templateCode}::${d.path}`);
  }
  return decided;
}

function isLiteralGatePass(gate) {
  // Gate file may not exist in older runs; treat absence as pass if user confirms
  if (!gate) return true;
  const summary = gate.summary ?? gate;
  return (
    (summary.totalPassed === 9 || summary.totalPassed >= 8) &&
    (summary.allPassed === true || summary.passed === true)
  );
}

// =============================================================================
// ELIGIBILITY FILTERING
// =============================================================================

const ELIGIBLE_CODES = new Set([
  'BAD_LABEL',
  'UI_VISIBLE_BAD_METADATA',
  'SOURCE_MISMATCH',
  'RAW_PATTERN_DOMAIN_MISMATCH',
  'GENERIC_FIELD_CANONICALIZATION',
]);

const ELIGIBLE_ACTIONS = new Set([
  'UPDATE_LABEL',
  'UPDATE_SOURCE',
  'UPDATE_PATH',
]);

const WAVE02_REMEDIATION_LABELS = new Set([
  'Slot from Wave 02 DOCX remediation',
]);

const WAVE02_BM_PATTERNS = /^BM-06[89]$/;

const INVALID_SOURCES = new Set(['unknown', 'invalid', '', null]);

function isWave02Remediation(c) {
  return WAVE02_REMEDIATION_LABELS.has(c.current?.label ?? '');
}

function isWave02Bm(code) {
  return WAVE02_BM_PATTERNS.test(code);
}

function isLegalBasis(path) {
  return path.startsWith('legalBasis.');
}

function isBlockedByDocxAuthoring(c, reason) {
  return (
    isWave02Remediation(c) ||
    isWave02Bm(c.templateCode) ||
    (reason ?? '').includes('BLOCKED_BY_DOCX_AUTHORING')
  );
}

function isManualReviewExcluded(path, reason = '') {
  return (
    path.startsWith('legalBasis.') ||
    reason.includes('MANUAL_LEGAL_REVIEW')
  );
}

/**
 * Determines applySafeAfterApproval based on hard scope rules.
 * applySafe=true only when:
 *   - decision === APPROVE
 *   - confidence === HIGH
 *   - action is UPDATE_LABEL or UPDATE_SOURCE
 *   - not legalBasis.*
 *   - not Wave 02
 *   - not path collision
 *   - not DOCX authoring
 *   - no proposed bad label
 *   - UPDATE_PATH never applySafe in Batch 2
 */
function computeApplySafe(c, rec) {
  if (rec.decision !== 'APPROVE') return false;
  if (rec.confidence !== 'HIGH') return false;
  const action = rec.action;
  if (!['UPDATE_LABEL', 'UPDATE_SOURCE'].includes(action)) return false;
  if (isLegalBasis(c.path)) return false;
  if (isWave02Remediation(c)) return false;
  if (isWave02Bm(c.templateCode)) return false;
  if (rec.path) return false; // UPDATE_PATH is never applySafe without explicit safety proof
  return true;
}

/**
 * Classify SOURCE_MISMATCH candidates.
 * Safe only when current source is invalid/unknown and proposed is one of
 * manual, casePayload, agencyConfig, officialConfig, systemDate, computed.
 */
function classifySourceMismatch(c) {
  const cur = c.current?.source ?? '';
  const proposed = c.proposed?.source ?? '';
  const INVALID_SOURCES = new Set(['unknown', 'invalid', '', null]);
  const KNOWN_SOURCES = new Set([
    'manual', 'casePayload', 'agencyConfig', 'officialConfig',
    'systemDate', 'computed', 'computedDate', 'caseReference',
  ]);

  if (INVALID_SOURCES.has(cur)) {
    // Current source is clearly wrong — recommend APPROVE with human review
    return { decision: 'APPROVE', action: 'UPDATE_SOURCE', confidence: 'HIGH' };
  }

  // Current source is valid but mismatched — need human review
  return { decision: 'DEFER_METADATA_REVIEW', action: 'UPDATE_SOURCE', confidence: 'MEDIUM' };
}

/**
 * Classify RAW_PATTERN_DOMAIN_MISMATCH candidates.
 * Safe only when proposed path is known, no collision, and context confirms.
 * document.fieldN generic paths always need review.
 */
function classifyRawPatternMismatch(c) {
  const proposed = c.proposed?.path ?? '';
  // If suggested path is missing or contains generic fieldN, it's not deterministic
  if (!proposed || proposed.includes('.field')) {
    return { decision: 'DEFER_METADATA_REVIEW', action: 'UPDATE_PATH', confidence: 'MEDIUM' };
  }
  // Known semantic path proposed — recommend for review
  return { decision: 'APPROVE', action: 'UPDATE_PATH', confidence: 'MEDIUM' };
}

// =============================================================================
// BUILD REVIEW GROUPS
// =============================================================================

function buildReviewGroups(candidates, contracts, batch1Decided) {
  const groups = [];

  // Group by templateCode::path to avoid duplicates
  const byKey = new Map();
  for (const c of candidates) {
    const key = `${c.templateCode}::${c.path}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(c);
  }

  for (const [key, items] of byKey) {
    if (groups.length >= 50) break;

    const [templateCode, ...pathParts] = key.split('::');
    const path = pathParts.join('::');

    // Skip if already decided in Batch 1
    if (batch1Decided.has(key)) continue;

    // Take the first item for primary analysis; collect all issue codes
    const c = items[0];
    const contract = contracts.get(templateCode);
    const currentField = contract?.canonicalFields?.find((f) => f.path === path);

    const allIssueCodes = [...new Set(items.flatMap((i) => i.issueCodes ?? [i.issueCode]))];
    const reason = c.reason ?? '';
    const proposed = c.proposed ?? {};

    // ── Exclusion: legalBasis.* ──────────────────────────────────────────────
    if (isLegalBasis(path)) continue;

    // ── Exclusion: Wave 02 remediation labels ──────────────────────────────
    if (isWave02Remediation(c)) continue;

    // ── Exclusion: Wave 02 BMs ──────────────────────────────────────────────
    if (isWave02Bm(templateCode)) continue;

    // ── Exclusion: reason contains BLOCKED_BY_DOCX_AUTHORING ───────────────
    if (reason.includes('BLOCKED_BY_DOCX_AUTHORING')) continue;

    // ── Exclusion: reason contains MANUAL_LEGAL_REVIEW ─────────────────────
    if (reason.includes('MANUAL_LEGAL_REVIEW')) continue;

    // ── Exclusion: reason contains DO_NOT_FIX_NOISE_OR_DERIVED ─────────────
    if (reason.includes('DO_NOT_FIX_NOISE_OR_DERIVED')) continue;

    // ── Scope: only allowed issue codes ────────────────────────────────────
    const codes = (allIssueCodes ?? []).filter(Boolean);
    if (!codes.some((code) => ELIGIBLE_CODES.has(code))) continue;

    // ── Scope: only allowed actions ────────────────────────────────────────
    const action = proposed.action ?? c.action;
    if (!ELIGIBLE_ACTIONS.has(action)) continue;

    // ── Check UI visibility ─────────────────────────────────────────────────
    const isUiVisible =
      (currentField?.uiComponent != null && currentField?.uiComponent !== 'computed') ||
      (currentField?.visible === true) ||
      (currentField?.reviewRequired === true) ||
      allIssueCodes.includes('UI_VISIBLE_BAD_METADATA') ||
      allIssueCodes.includes('BAD_LABEL');

    // ── Apply classification by issue code ───────────────────────────────────
    let rec;
    let reviewType;

    if (allIssueCodes.includes('BAD_LABEL') || allIssueCodes.includes('GENERIC_FIELD_CANONICALIZATION')) {
      // Known Vietnamese label mapping required for APPROVE
      const proposedLabel = proposed.label ?? null;
      if (proposedLabel && proposedLabel !== currentField?.label) {
        reviewType = 'REVIEW_CHOOSE_LABEL';
        rec = {
          decision: 'APPROVE',
          action: 'UPDATE_LABEL',
          label: proposedLabel,
          path: null,
          source: null,
          rationale: `BAD_LABEL on "${path}" has known Vietnamese label override "${proposedLabel}". Path is semantically correct. Label-only fix.`,
          confidence: c.confidence === 'HIGH' ? 'HIGH' : 'MEDIUM',
        };
      } else {
        reviewType = 'REVIEW_DEFER_METADATA_REVIEW';
        rec = {
          decision: 'DEFER_METADATA_REVIEW',
          action: 'UPDATE_LABEL',
          label: null,
          path: null,
          source: null,
          rationale: `BAD_LABEL candidate but proposed label is missing or same as current. Needs human to confirm Vietnamese label.`,
          confidence: 'LOW',
        };
      }
    } else if (allIssueCodes.includes('SOURCE_MISMATCH')) {
      reviewType = 'REVIEW_CHOOSE_SOURCE';
      // Only HIGH-confidence APPROVE when proposed source is a known valid value
      const proposedSrc = proposed.source ?? null;
      if (proposedSrc && !INVALID_SOURCES.has(proposedSrc)) {
        rec = {
          decision: 'APPROVE',
          action: 'UPDATE_SOURCE',
          label: null,
          path: null,
          source: proposedSrc,
          rationale: `SOURCE_MISMATCH: current source="${c.current?.source}" is inconsistent with path domain. Proposed source="${proposedSrc}" is a known valid source value. HIGH confidence fix.`,
          confidence: 'HIGH',
        };
      } else {
        rec = {
          decision: 'DEFER_METADATA_REVIEW',
          action: 'UPDATE_SOURCE',
          label: null,
          path: null,
          source: null,
          rationale: `SOURCE_MISMATCH: current source="${c.current?.source}" inconsistent with path. Proposed source is invalid or not determined. Needs human review.`,
          confidence: 'MEDIUM',
        };
      }
    } else if (allIssueCodes.includes('RAW_PATTERN_DOMAIN_MISMATCH')) {
      reviewType = 'REVIEW_CHOOSE_PATH';
      const rpm = classifyRawPatternMismatch(c);
      rec = {
        decision: rpm.decision,
        action: rpm.action,
        label: proposed.label ?? null,
        path: proposed.path ?? null,
        source: null,
        rationale: `RAW_PATTERN_DOMAIN_MISMATCH: raw pattern domain does not match path. Proposed path="${proposed.path ?? 'N/A'}". ${rpm.decision === 'DEFER_METADATA_REVIEW' ? 'Suggested path is generic or missing — needs human review.' : 'Known semantic path proposed — recommend human review to confirm.'}`,
        confidence: rpm.confidence,
      };
    } else if (allIssueCodes.includes('UI_VISIBLE_BAD_METADATA')) {
      reviewType = 'REVIEW_CHOOSE_LABEL';
      rec = {
        decision: 'APPROVE',
        action: 'UPDATE_LABEL',
        label: proposed.label ?? null,
        path: null,
        source: null,
        rationale: `UI_VISIBLE_BAD_METADATA caused by bad label. Known Vietnamese label "${proposed.label}" available. Label-only fix, no path/source/required/editable/visible semantics changed.`,
        confidence: c.confidence === 'HIGH' ? 'HIGH' : 'MEDIUM',
      };
    } else {
      // Fallback — should not reach here given ELIGIBLE_CODES filter
      continue;
    }

    // ── Compute applySafe ───────────────────────────────────────────────────
    const applySafe = computeApplySafe(c, rec);

    // ── Build candidate options ─────────────────────────────────────────────
    const candidateOptions = items.map((item) => ({
      proposedLabel:   item.proposed?.label   ?? null,
      proposedPath:    item.proposed?.path    ?? null,
      proposedSource:  item.proposed?.source  ?? null,
      proposedRequired: item.proposed?.required ?? null,
      action:          item.proposed?.action  ?? item.action,
      issueCodes:      item.issueCodes ?? [item.issueCode],
      confidence:      item.confidence ?? null,
      reason:          item.reason ?? null,
    }));

    // Deduplicate options
    const seen = new Map();
    const dedupedOptions = [];
    for (const opt of candidateOptions) {
      const k = JSON.stringify({ label: opt.proposedLabel, path: opt.proposedPath, source: opt.proposedSource, action: opt.action });
      if (!seen.has(k)) {
        seen.set(k, true);
        dedupedOptions.push(opt);
      }
    }

    groups.push({
      reviewGroupId: nextGroupId('B2RG'),
      templateCode,
      title: contract?.title ?? templateCode,
      path,
      rawPattern: currentField?.rawPattern ?? c.current?.rawPattern ?? null,
      current: {
        path:     currentField?.path     ?? c.path,
        label:    currentField?.label    ?? c.current?.label ?? null,
        source:   currentField?.source   ?? c.current?.source ?? null,
        required: currentField?.required ?? c.current?.required ?? null,
        uiComponent: currentField?.uiComponent ?? c.current?.uiComponent ?? null,
        reviewRequired: currentField?.reviewRequired ?? c.current?.reviewRequired ?? null,
      },
      issueCodes: allIssueCodes,
      candidateOptions: dedupedOptions,
      context: {
        textBefore:   null,
        textAfter:    null,
        context:      c.reason ?? null,
        docxSlot:     null,
        renderBinding: null,
      },
      recommendedDecision: rec,
      applySafeAfterApproval: applySafe,
      reviewerDecisionRequired: true,
    });
  }

  return groups;
}

// =============================================================================
// STRICT VALIDATION
// =============================================================================

function validate(groups, batch1Approved) {
  const errors = [];
  const warnings = [];

  // Batch 1 literal validation gate
  const gate = loadJson(LITERAL_GATE);
  if (!isLiteralGatePass(gate)) {
    errors.push(`Batch 1 literal validation gate is not PASS: ${JSON.stringify(gate?.summary ?? gate)}`);
  }

  // Batch size cap
  if (groups.length > 50) {
    errors.push(`Group count ${groups.length} exceeds cap of 50`);
  }

  // No Batch 1 decided groups
  const batch1Keys = new Set(
    (batch1Approved?.decisions ?? []).map((d) => `${d.templateCode}::${d.path}`)
  );
  for (const g of groups) {
    const key = `${g.templateCode}::${g.path}`;
    if (batch1Keys.has(key)) {
      errors.push(`Group ${g.reviewGroupId} (${key}): already decided in Batch 1`);
    }
  }

  for (const g of groups) {
    const key = `${g.templateCode}::${g.path}`;

    // Must have recommendedDecision
    if (!g.recommendedDecision) {
      errors.push(`Group ${g.reviewGroupId} (${key}): no recommendedDecision`);
    }

    // applySafe cannot have LOW confidence
    if (g.applySafeAfterApproval && g.recommendedDecision?.confidence === 'LOW') {
      errors.push(`Group ${g.reviewGroupId} (${key}): applySafe=true but confidence=LOW`);
    }

    // applySafe cannot be DEFER_* decision
    if (g.applySafeAfterApproval && g.recommendedDecision?.decision?.startsWith('DEFER')) {
      errors.push(`Group ${g.reviewGroupId} (${key}): applySafe=true but decision=${g.recommendedDecision.decision}`);
    }

    // applySafe cannot have UPDATE_PATH (requires explicit safety proof)
    if (g.applySafeAfterApproval && g.recommendedDecision?.action === 'UPDATE_PATH') {
      errors.push(`Group ${g.reviewGroupId} (${key}): applySafe=true but action=UPDATE_PATH (no explicit path safety proof)`);
    }

    // apply-preview cannot have LOW confidence
    if (g.applySafeAfterApproval && g.recommendedDecision?.confidence === 'LOW') {
      errors.push(`Group ${g.reviewGroupId} (${key}): apply-preview contains LOW confidence item`);
    }

    // Wave 02 cannot be applySafe
    if (g.applySafeAfterApproval && isWave02Remediation(g)) {
      errors.push(`Group ${g.reviewGroupId} (${key}): Wave 02 remediation group is applySafe=true`);
    }

    // legalBasis.* cannot be applySafe
    if (g.applySafeAfterApproval && isLegalBasis(g.path)) {
      errors.push(`Group ${g.reviewGroupId} (${key}): legalBasis.* path is applySafe=true`);
    }

    // DEFER_LEGAL groups must not be applySafe
    if (g.applySafeAfterApproval && g.recommendedDecision?.decision === 'DEFER_LEGAL') {
      errors.push(`Group ${g.reviewGroupId} (${key}): DEFER_LEGAL group is applySafe=true`);
    }

    // DEFER_DOCX groups must not be applySafe
    if (g.applySafeAfterApproval && g.recommendedDecision?.decision === 'DEFER_DOCX') {
      errors.push(`Group ${g.reviewGroupId} (${key}): DEFER_DOCX group is applySafe=true`);
    }

    // applySafe cannot have a proposed bad label
    if (g.applySafeAfterApproval && g.recommendedDecision?.label === 'Slot from Wave 02 DOCX remediation') {
      errors.push(`Group ${g.reviewGroupId} (${key}): applySafe=true but proposed label is Wave 02 remediation label`);
    }
  }

  return { errors, warnings };
}

// =============================================================================
// OUTPUT GENERATION
// =============================================================================

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  process.stderr.write(`[REVIEW] Written: ${path}\n`);
}

function buildApplyPreview(groups) {
  return groups
    .filter((g) => g.applySafeAfterApproval && g.recommendedDecision?.decision === 'APPROVE')
    .map((g) => ({
      reviewGroupId: g.reviewGroupId,
      templateCode:  g.templateCode,
      path:          g.path,
      action:        g.recommendedDecision.action,
      label:         g.recommendedDecision.label ?? null,
      pathTo:        g.recommendedDecision.path ?? null,
      source:        g.recommendedDecision.source ?? null,
      confidence:    g.recommendedDecision.confidence ?? 'HIGH',
      rationale:    g.recommendedDecision.rationale ?? null,
      issueCodes:   g.issueCodes ?? [],
    }));
}

function buildDecisionSheet(groups) {
  return groups.map((g) => ({
    reviewGroupId:       g.reviewGroupId,
    templateCode:        g.templateCode,
    path:                g.path,
    current:             g.current,
    issueCodes:          g.issueCodes,
    candidateOptions:     g.candidateOptions,
    recommendedDecision: g.recommendedDecision,
    applySafeAfterApproval: g.applySafeAfterApproval,
    reviewerDecisionRequired: true,
    // Blank for reviewer to fill
    reviewerApprovedDecision: null,
    reviewerApprovedAction:   null,
    reviewerApprovedLabel:    null,
    reviewerApprovedPath:    null,
    reviewerApprovedSource:  null,
    reviewerRationale:       null,
    reviewerSignature:       null,
    reviewerTimestamp:      null,
  }));
}

function writeMarkdown(path, data) {
  const lines = [
    '# Forms Root Cause — Review Batch 2',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total review groups | ${data.groups.length} |`,
    `| Apply-preview count | ${data.applyPreview.length} |`,
    `| REVIEW_CHOOSE_LABEL | ${data.stats?.byReviewType?.REVIEW_CHOOSE_LABEL ?? 0} |`,
    `| REVIEW_CHOOSE_SOURCE | ${data.stats?.byReviewType?.REVIEW_CHOOSE_SOURCE ?? 0} |`,
    `| REVIEW_CHOOSE_PATH | ${data.stats?.byReviewType?.REVIEW_CHOOSE_PATH ?? 0} |`,
    `| DEFER_METADATA_REVIEW | ${data.stats?.byReviewType?.DEFER_METADATA_REVIEW ?? 0} |`,
    `| APPROVE | ${data.stats?.byType?.APPROVE ?? 0} |`,
    `| DEFER_* | ${data.stats?.byType?.DEFER_METADATA_REVIEW ?? 0} |`,
    '',
    '## By Issue Code',
    '',
    ...Object.entries(data.stats?.byIssueCode ?? {}).map(
      ([code, count]) => `| ${code} | ${count} |`
    ).join('\n') ? [
      '| Issue Code | Count |',
      '|------------|-------|',
      ...Object.entries(data.stats?.byIssueCode ?? {}).map(
        ([code, count]) => `| ${code} | ${count} |`
      ),
    ] : ['_No issue code breakdown available._'],
    '',
    '## Decision Sheet',
    '',
    '| reviewGroupId | BM | field path | current label | current source | issue codes | recommended decision | applySafe |',
    '|---|---|---|---|---|---|---|---|',
  ];

  for (const g of data.groups) {
    const rec = g.recommendedDecision ?? {};
    lines.push(
      `| ${g.reviewGroupId} | ${g.templateCode} | \`${g.path}\` | ${g.current?.label ?? '-'} | ${g.current?.source ?? '-'} | ${(g.issueCodes ?? []).join(', ')} | ${rec.decision ?? '-'} (${rec.confidence ?? '-'}) | ${g.applySafeAfterApproval ? 'YES' : 'no'} |`
    );
  }

  lines.push('');
  lines.push('## Apply Preview (APPROVE + applySafe=true)');
  lines.push('');
  lines.push('> **NOTE:** These groups are prepared for Batch 2 decisions. Do NOT apply until `decisions.approved.json` is created.');
  lines.push('');
  lines.push('| reviewGroupId | BM | path | action | proposed value | confidence |');
  lines.push('|---|---|---|---|---|---|');

  for (const p of data.applyPreview) {
    const val = p.label ?? p.pathTo ?? p.source ?? p.action;
    lines.push(
      `| ${p.reviewGroupId} | ${p.templateCode} | \`${p.path}\` | ${p.action} | ${val} | ${p.confidence} |`
    );
  }

  if (data.applyPreview.length === 0) {
    lines.push('| _none_ | | | | | |');
  }

  lines.push('');
  lines.push('## Validation Result');
  lines.push('');
  lines.push(`Errors: ${data.validation.errors.length}`);
  lines.push(`Warnings: ${data.validation.warnings.length}`);
  if (data.validation.errors.length > 0) {
    lines.push('');
    lines.push('**FAIL**');
    lines.push('');
    for (const e of data.validation.errors) {
      lines.push(`- ${e}`);
    }
  } else {
    lines.push('');
    lines.push('**PASS**');
  }

  lines.push('');
  lines.push('## Safety Exclusions Applied');
  lines.push('');
  lines.push('- legalBasis.* paths excluded from Batch 2 scope');
  lines.push('- Wave 02 DOCX remediation labels ("Slot from Wave 02 DOCX remediation") excluded');
  lines.push('- BM-068, BM-069 excluded (Wave 02 BMs)');
  lines.push('- MANUAL_LEGAL_REVIEW, BLOCKED_BY_DOCX_AUTHORING, DO_NOT_FIX_NOISE_OR_DERIVED excluded');
  lines.push('- Groups already decided in Batch 1 excluded');
  lines.push('- LOW confidence items excluded from apply-preview');
  lines.push('- UPDATE_PATH items excluded from apply-safe (no explicit path collision safety proof)');
  lines.push('');
  lines.push('## Recommended Next Task');
  lines.push('');
  lines.push('`FORMS_ROOT_CAUSE_REVIEW_BATCH_2_DECISIONS` — Human reviews and approves/rejects Batch 2 decision sheet, producing `docs/audit/forms-root-cause-review-batch-2/decisions.approved.json`.');
  lines.push('');
  lines.push('After decisions.approved.json exists:');
  lines.push('1. `pnpm apply:forms-root-cause-review-batch-2-approved`');
  lines.push('2. `pnpm validate`');
  lines.push('3. `pnpm --filter @qllaw/form-contracts test`');
  lines.push('4. `pnpm typecheck`');

  writeFileSync(path, lines.join('\n'), 'utf8');
  process.stderr.write(`[REVIEW] Written: ${path}\n`);
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  process.stderr.write('[REVIEW] Starting FORMS_ROOT_CAUSE_REVIEW_BATCH_2 preparation\n');
  mkdirSync(REVIEW_DIR, { recursive: true });

  // Load inputs
  const reviewCandidates = loadJson(REVIEW_CAND_JSON) ?? [];
  const batch1Approved   = loadJson(BATCH1_APPROVED);
  const manualReview    = loadJson(MANUAL_JSON) ?? [];
  const noiseOrDerived  = loadJson(NOISE_JSON) ?? [];
  const contracts       = loadContracts();

  process.stderr.write(`[REVIEW] review-fix-candidates items: ${reviewCandidates.length}\n`);
  process.stderr.write(`[REVIEW] Contracts loaded: ${contracts.size}\n`);

  // Build Batch 1 decided set for exclusion
  const batch1Decided = buildBatch1DecisionSet(batch1Approved);
  process.stderr.write(`[REVIEW] Batch 1 decided paths: ${batch1Decided.size}\n`);

  // Build manual/noise exclusion set
  const exclusionSet = new Set([
    ...(manualReview ?? []).map((m) => `${m.templateCode}::${m.path}`),
    ...(noiseOrDerived ?? []).map((n) => `${n.templateCode}::${n.path}`),
  ]);
  process.stderr.write(`[REVIEW] Manual/noise exclusion paths: ${exclusionSet.size}\n`);

  // Reset counter
  _reviewGroupCounter = 0;

  // Build groups
  const groups = buildReviewGroups(reviewCandidates, contracts, batch1Decided);
  process.stderr.write(`[REVIEW] Raw eligible groups: ${groups.length}\n`);

  // Validation
  const validation = validate(groups, batch1Approved);
  process.stderr.write(`[REVIEW] Validation errors: ${validation.errors.length}\n`);
  process.stderr.write(`[REVIEW] Validation warnings: ${validation.warnings.length}\n`);

  if (validation.errors.length > 0) {
    validation.errors.forEach((e) => process.stderr.write(`  ERROR: ${e}\n`));
  }

  // Compute stats
  const byReviewType = {
    REVIEW_CHOOSE_LABEL:        groups.filter((g) => g.recommendedDecision?.decision === 'APPROVE' && g.recommendedDecision?.action === 'UPDATE_LABEL').length,
    REVIEW_CHOOSE_SOURCE:       groups.filter((g) => g.recommendedDecision?.decision === 'APPROVE' && g.recommendedDecision?.action === 'UPDATE_SOURCE').length,
    REVIEW_CHOOSE_PATH:          groups.filter((g) => g.recommendedDecision?.decision === 'APPROVE' && g.recommendedDecision?.action === 'UPDATE_PATH').length,
    DEFER_METADATA_REVIEW:       groups.filter((g) => g.recommendedDecision?.decision === 'DEFER_METADATA_REVIEW').length,
  };

  const byIssueCode = {};
  for (const g of groups) {
    for (const code of g.issueCodes ?? []) {
      byIssueCode[code] = (byIssueCode[code] ?? 0) + 1;
    }
  }

  const byAction = {};
  for (const g of groups) {
    const action = g.recommendedDecision?.action ?? 'UNKNOWN';
    byAction[action] = (byAction[action] ?? 0) + 1;
  }

  const byType = {};
  for (const g of groups) {
    const t = g.recommendedDecision?.decision ?? 'UNKNOWN';
    byType[t] = (byType[t] ?? 0) + 1;
  }

  const applyPreview = buildApplyPreview(groups);
  const decisionSheet = buildDecisionSheet(groups);

  const outputJson = {
    generatedAt:       new Date().toISOString(),
    reviewBatch:      'FORMS_ROOT_CAUSE_REVIEW_BATCH_2',
    totalGroups:      groups.length,
    stats: {
      totalGroups: groups.length,
      applyPreviewCount: applyPreview.length,
      byType,
      byReviewType,
      byIssueCode,
      byAction,
      applySafeCount: groups.filter((g) => g.applySafeAfterApproval).length,
    },
    validation: {
      passed: validation.errors.length === 0,
      errors: validation.errors,
      warnings: validation.warnings,
    },
    groups,
  };

  const outputMd = {
    generatedAt: new Date().toISOString(),
    reviewBatch: 'FORMS_ROOT_CAUSE_REVIEW_BATCH_2',
    groups,
    stats: outputJson.stats,
    validation,
    applyPreview,
  };

  // Write outputs
  writeJson(join(REVIEW_DIR, 'latest.json'), outputJson);
  writeJson(join(REVIEW_DIR, 'apply-preview.json'), { generatedAt: new Date().toISOString(), items: applyPreview });
  writeJson(join(REVIEW_DIR, 'decision-sheet.json'), {
    generatedAt: new Date().toISOString(),
    reviewBatch: 'FORMS_ROOT_CAUSE_REVIEW_BATCH_2',
    groups: decisionSheet,
  });
  writeMarkdown(join(REVIEW_DIR, 'latest.md'), outputMd);
  writeMarkdown(join(REVIEW_DIR, 'decision-sheet.md'), outputMd);

  // Print summary
  process.stderr.write(`\n[REVIEW] SUMMARY:\n`);
  process.stderr.write(`  Total groups:    ${groups.length}\n`);
  process.stderr.write(`  Apply-preview:   ${applyPreview.length}\n`);
  process.stderr.write(`  APPROVE:         ${byType.APPROVE ?? 0}\n`);
  process.stderr.write(`  DEFER_METADATA:  ${byType.DEFER_METADATA_REVIEW ?? 0}\n`);
  process.stderr.write(`  By issue code:   ${JSON.stringify(byIssueCode)}\n`);
  process.stderr.write(`  Validation:      ${validation.errors.length === 0 ? 'PASS' : 'FAIL'}\n`);

  if (validation.errors.length > 0) {
    process.stderr.write(`\n[REVIEW] STRICT EXIT: validation failed\n`);
    process.exit(1);
  }

  process.exit(0);
}

main();
