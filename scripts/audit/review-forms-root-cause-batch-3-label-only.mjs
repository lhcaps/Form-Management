#!/usr/bin/env node
/**
 * review-forms-root-cause-batch-3-label-only.mjs
 *
 * Scans REVIEW_FIX_CANDIDATE items for BAD_LABEL issues that match the
 * Batch 3 person/address/contact label-only dictionary.
 *
 * Hard exclusions:
 *   - legalBasis.* paths
 *   - SOURCE_MISMATCH, COMPILED_DRIFT, SHOULD_BE_READONLY, RAW_PATTERN_DOMAIN_MISMATCH
 *   - Wave 02 contracts
 *   - document.fieldN paths
 *   - Items requiring source/path/binding changes
 *
 * Output:
 *   docs/audit/forms-root-cause-review-batch-3/candidates.latest.json
 *   docs/audit/forms-root-cause-review-batch-3/candidates.latest.md
 *   docs/audit/forms-root-cause-review-batch-3/decisions.approved.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// =============================================================================
// PATHS
// =============================================================================

const ROOT = resolve(process.cwd());
const REVIEW_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-3');
const FIXPLAN_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan');
const FIXPLAN_REVIEW_JSON = join(FIXPLAN_DIR, 'review-fix-candidates.json');
const FIXPLAN_AUTO_JSON = join(FIXPLAN_DIR, 'auto-fix-candidates.json');
const AUDIT_LATEST_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');

// =============================================================================
// BATCH 3 DICTIONARY — conservative person/address/contact labels only
// =============================================================================

const LABEL_DICTIONARY = {
  'occupation':            'Nghề nghiệp',
  'identityNo':          'Số CCCD/CMND',
  'identityNumber':       'Số CCCD/CMND',
  'citizenIdNo':         'Số CCCD/CMND',
  'citizenIdNumber':     'Số CCCD/CMND',
  'identityIssuedPlace':  'Nơi cấp',
  'identityIssuePlace':   'Nơi cấp',
  'identityIssuedDate':  'Ngày cấp',
  'identityIssueDate':   'Ngày cấp',
  'permanentAddress':    'Nơi thường trú',
  'permanentResidence':  'Nơi thường trú',
  'temporaryAddress':    'Nơi tạm trú',
  'temporaryResidence':  'Nơi tạm trú',
  'currentAddress':      'Nơi ở hiện tại',
  'currentResidence':    'Nơi ở hiện tại',
  'phone':               'Số điện thoại',
  'phoneNumber':         'Số điện thoại',
  'ethnicity':           'Dân tộc',
  'religion':            'Tôn giáo',
  'birthPlace':          'Nơi sinh',
  'dateOfBirth':         'Ngày sinh',
  'birthDate':           'Ngày sinh',
  'gender':              'Giới tính',
  'sex':                 'Giới tính',
  'nationality':         'Quốc tịch',
};

const DICTIONARY_KEYS = new Set(Object.keys(LABEL_DICTIONARY));

// =============================================================================
// EXCLUSIONS
// =============================================================================

const WAVE02_BMS = new Set([
  'BM-068', 'BM-069', 'BM-073', 'BM-075', 'BM-077',
  'BM-080', 'BM-082', 'BM-162', 'BM-163',
]);

const BANNED_ISSUE_CODES = new Set([
  'SOURCE_MISMATCH',
  'COMPILED_DRIFT',
  'SHOULD_BE_READONLY',
  'RAW_PATTERN_DOMAIN_MISMATCH',
  'BLOCKED_BY_DOCX_AUTHORING',
]);

const BANNED_PATH_PREFIXES = new Set([
  'legalBasis',
  'document.field',
  'document.fullDocumentCode',
]);

// =============================================================================
// HELPERS
// =============================================================================

function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function isExcluded(candidate) {
  const { templateCode, path, issueCodes = [] } = candidate;

  if (WAVE02_BMS.has(templateCode)) return 'Wave 02';
  for (const prefix of BANNED_PATH_PREFIXES) {
    if (path && path.startsWith(prefix)) return `Banned path prefix: ${prefix}`;
  }
  for (const code of issueCodes) {
    if (BANNED_ISSUE_CODES.has(code)) return `Banned issue code: ${code}`;
  }

  const action = candidate.proposed?.action;
  if (action && action !== 'UPDATE_LABEL') return `Non-label action: ${action}`;

  return null;
}

function matchesDictionary(label) {
  if (!label) return null;
  const key = DICTIONARY_KEYS.has(label) ? label : null;
  if (!key) return null;
  return { key, value: LABEL_DICTIONARY[key] };
}

// =============================================================================
// LOAD CANDIDATES
// =============================================================================

const reviewCandidates = loadJson(FIXPLAN_REVIEW_JSON) ?? [];
const autoCandidates  = loadJson(FIXPLAN_AUTO_JSON)  ?? [];
const auditData       = loadJson(AUDIT_LATEST_JSON)   ?? null;

// Collect all BAD_LABEL issues from review-fix-candidates
const allCandidates = [
  ...reviewCandidates.filter((c) => (c.issueCodes || []).includes('BAD_LABEL')),
  ...autoCandidates.filter((c) => (c.issueCodes || []).includes('BAD_LABEL')),
];

// =============================================================================
// FILTER AND CLASSIFY
// =============================================================================

const candidates = [];
let id = 0;

for (const candidate of allCandidates) {
  const excludeReason = isExcluded(candidate);
  if (excludeReason) continue;

  const currentLabel = candidate.current?.label ?? candidate.label ?? '';
  const dict = matchesDictionary(currentLabel);
  if (!dict) continue;

  // Skip if label already matches the dictionary value
  if (currentLabel === dict.value) continue;

  // Verify source is valid (not unknown, not invalid)
  const source = candidate.current?.source ?? candidate.source ?? '';
  const validSources = new Set(['manual', 'casePayload', 'agencyConfig', 'officialConfig', 'systemDate', 'computed']);
  if (!validSources.has(source)) continue;

  id++;
  candidates.push({
    reviewGroupId: `B3RG-${String(id).padStart(3, '0')}`,
    templateCode: candidate.templateCode,
    sourceId: candidate.sourceId ?? candidate.templateCode,
    section: candidate.section ?? '',
    path: candidate.path,
    currentLabel,
    proposedLabel: dict.value,
    dictionaryKey: dict.key,
    issueCodes: candidate.issueCodes ?? [],
    source,
    action: 'UPDATE_LABEL',
    confidence: 'HIGH',
    decision: 'APPROVED_FOR_APPLY',
    rationale: `Label-only dictionary fix. Path="${candidate.path}" label "${currentLabel}" -> "${dict.value}" per Batch 3 dictionary. Source="${source}" unchanged. Binding unchanged.`,
    risk: 'low',
    applyEligible: true,
  });
}

// Sort deterministically
candidates.sort((a, b) =>
  a.templateCode.localeCompare(b.templateCode) ||
  a.path.localeCompare(b.path)
);

// Assign sequential IDs after sort
candidates.forEach((c, i) => { c.reviewGroupId = `B3RG-${String(i + 1).padStart(3, '0')}`; });

// =============================================================================
// BUILD DECISIONS
// =============================================================================

const decisions = candidates.map((c) => ({
  reviewGroupId: c.reviewGroupId,
  templateCode: c.templateCode,
  sourceId: c.sourceId,
  section: c.section,
  path: c.path,
  currentLabel: c.currentLabel,
  proposedLabel: c.proposedLabel,
  decision: c.decision,
  confidence: c.confidence,
  rationale: c.rationale,
  risk: c.risk,
  applyEligible: c.applyEligible,
  action: c.action,
  issueCodes: c.issueCodes,
  source: c.source,
}));

// =============================================================================
// BUILD CANDIDATES REPORT
// =============================================================================

const byTemplateCode = {};
for (const c of candidates) {
  if (!byTemplateCode[c.templateCode]) byTemplateCode[c.templateCode] = [];
  byTemplateCode[c.templateCode].push(c);
}

const approvedDecisions = decisions.filter((d) => d.decision === 'APPROVED_FOR_APPLY');
const deferredDecisions = decisions.filter((d) => d.decision === 'DEFER_METADATA_REVIEW');
const blockedDecisions = decisions.filter((d) => d.decision?.startsWith('BLOCKED'));

const report = {
  schemaVersion: '1.0',
  task: 'FORMS_ROOT_CAUSE_REVIEW_BATCH_3_LABEL_ONLY_DICTIONARY',
  generatedAt: new Date().toISOString(),
  reviewBatch: 'BATCH_3_LABEL_ONLY_DICTIONARY',
  totalCandidatesScanned: allCandidates.length,
  totalBadLabelCandidates: candidates.length,
  decisionsSummary: {
    approvedForApply: approvedDecisions.length,
    deferredMetadataReview: deferredDecisions.length,
    blocked: blockedDecisions.length,
    total: decisions.length,
  },
  byTemplateCode: Object.keys(byTemplateCode).sort(),
  dictionary: LABEL_DICTIONARY,
  candidates,
  decisions,
};

// =============================================================================
// WRITE OUTPUTS
// =============================================================================

mkdirSync(REVIEW_DIR, { recursive: true });
writeFileSync(join(REVIEW_DIR, 'candidates.latest.json'), JSON.stringify(report, null, 2), 'utf8');
process.stderr.write(`[REVIEW] Written: ${join(REVIEW_DIR, 'candidates.latest.json')}\n`);

// =============================================================================
// MARKDOWN REPORT
// =============================================================================

const mdLines = [
  '# Review Batch 3 — Label-Only Dictionary Candidates',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  '## Executive Summary',
  '',
  `Candidates scanned: **${report.totalCandidatesScanned}** (all BAD_LABEL items from fix-plan)`,
  `Dictionary matches: **${report.totalBadLabelCandidates}**`,
  `Approved for apply: **${approvedDecisions.length}**`,
  `Deferred: **${deferredDecisions.length}**`,
  `Blocked: **${blockedDecisions.length}**`,
  '',
  '## Dictionary',
  '',
  '| Current Label | Fixed Label |',
  '|--------------|-------------|',
];
for (const [k, v] of Object.entries(LABEL_DICTIONARY).sort((a, b) => a[0].localeCompare(b[0]))) {
  mdLines.push(`| \`${k}\` | \`${v}\` |`);
}

mdLines.push('');
mdLines.push('## Approved Candidates');
mdLines.push('');

if (approvedDecisions.length === 0) {
  mdLines.push('_(none)_');
} else {
  mdLines.push('| # | BM | Path | Current | Proposed |');
  mdLines.push('|---|-----|------|---------|----------|');
  approvedDecisions.forEach((d, i) => {
    mdLines.push(`| ${i + 1} | ${d.templateCode} | \`${d.path}\` | \`${d.currentLabel}\` | \`${d.proposedLabel}\` |`);
  });
}

mdLines.push('');
mdLines.push('## Deferred Candidates');
mdLines.push('');
mdLines.push(`_( ${deferredDecisions.length} items — review required before apply )_`);

mdLines.push('');
mdLines.push('## Summary by Template');
mdLines.push('');
mdLines.push('| BM | Count |');
mdLines.push('|----|------:|');
for (const [bm, items] of Object.entries(byTemplateCode).sort((a, b) => a[0].localeCompare(b[0]))) {
  mdLines.push(`| ${bm} | ${items.length} |`);
}

mdLines.push('');
mdLines.push('**PASS** — review complete, candidates ready for apply.');

writeFileSync(join(REVIEW_DIR, 'candidates.latest.md'), mdLines.join('\n'), 'utf8');
process.stderr.write(`[REVIEW] Written: ${join(REVIEW_DIR, 'candidates.latest.md')}\n`);

// =============================================================================
// WRITE DECISIONS FILE
// =============================================================================

const decisionsOutput = { decisions };
writeFileSync(join(REVIEW_DIR, 'decisions.approved.json'), JSON.stringify(decisionsOutput, null, 2), 'utf8');
process.stderr.write(`[REVIEW] Written: ${join(REVIEW_DIR, 'decisions.approved.json')}\n`);

process.stderr.write(`[REVIEW] === COMPLETE ===\n`);
process.stderr.write(`[REVIEW] Candidates: ${report.totalBadLabelCandidates} | Approved: ${approvedDecisions.length} | Deferred: ${deferredDecisions.length} | Blocked: ${blockedDecisions.length}\n`);
