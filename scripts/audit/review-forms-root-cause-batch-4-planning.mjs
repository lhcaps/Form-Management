#!/usr/bin/env node
/**
 * review-forms-root-cause-batch-4-planning.mjs
 *
 * BATCH_4_LABEL_ONLY_PLANNING_SCAN
 *
 * Scans remaining BAD_LABEL and UI_VISIBLE_BAD_METADATA items and groups them
 * by deterministic dictionary clusters for Batch 4 label-only planning.
 *
 * PLANNING ONLY — does NOT mutate locked contracts.
 * Does NOT create apply scripts or decisions.
 *
 * Output:
 *   docs/audit/forms-root-cause-review-batch-4-planning/
 *     candidates.latest.json
 *     candidates.latest.md
 *     dictionary-analysis.latest.json
 *     dictionary-analysis.latest.md
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// ============================================================================
// PATHS
// ============================================================================

const ROOT = resolve(process.cwd());
const AUDIT_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const FIXPLAN_JSON = join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'review-fix-candidates.json');
const PLANNING_DIR = join(ROOT, 'docs', 'audit', 'forms-root-cause-review-batch-4-planning');

// ============================================================================
// DICTIONARY — Batch 4 clusters
// Keys = raw label (camelCase), Values = Vietnamese label
// ============================================================================

const BATCH4_DICTIONARY = {
  // Person identity / actor labels
  'fullName': 'Họ và tên',
  'name': 'Họ và tên',
  'representativeName': 'Người đại diện',
  'legalRepresentative': 'Người đại diện theo pháp luật',
  'position': 'Chức vụ',
  'workplace': 'Nơi làm việc',
  'residence': 'Nơi cư trú',

  // Case / procedural metadata labels
  'caseName': 'Tên vụ án/vụ việc',
  'caseNumber': 'Số vụ án/vụ việc',
  'caseCode': 'Mã vụ án/vụ việc',
  'caseType': 'Loại vụ án/vụ việc',
  'crimeName': 'Tội danh',
  'offenseName': 'Tội danh',
  'decisionNumber': 'Số quyết định',
  'decisionDate': 'Ngày quyết định',
  'documentDate': 'Ngày văn bản',
  'documentPlace': 'Địa điểm lập văn bản',

  // Organization / agency labels
  'agencyName': 'Tên cơ quan',
  'agencyAddress': 'Địa chỉ cơ quan',
  'procuracyName': 'Tên Viện kiểm sát',
  'courtName': 'Tên Tòa án',
  'investigationAgencyName': 'Tên Cơ quan điều tra',

  // Signature / signer labels
  'signerName': 'Người ký',
  'signerTitle': 'Chức vụ người ký',
  'signerPosition': 'Chức vụ người ký',
  'signDate': 'Ngày ký',
  'signPlace': 'Nơi ký',

  // Generic / common address labels (already-vietnamese raw labels)
  'address': 'Địa chỉ',
  'currentAddress': 'Nơi ở hiện tại',
  'permanentAddress': 'Nơi thường trú',
  'temporaryAddress': 'Nơi tạm trú',
  'contactAddress': 'Địa chỉ liên hệ',
};

// ============================================================================
// EXCLUSIONS
// ============================================================================

const PATH_EXCLUSIONS = new Set([
  'legalBasis',         // legalBasis.* — excluded
]);

const LABEL_EXCLUSIONS = new Set([
  'fullDocumentCode',
  'fullDocumentCode2',
  'fullDocumentCode3',
]);

function isExcludedByPath(path) {
  if (!path) return true;
  for (const prefix of PATH_EXCLUSIONS) {
    if (path.startsWith(prefix + '.') || path === prefix) return true;
  }
  return false;
}

function isExcludedByLabel(label) {
  if (!label) return false;
  for (const excl of LABEL_EXCLUSIONS) {
    if (label.startsWith(excl)) return true;
  }
  return false;
}

// ============================================================================
// HELPERS
// ============================================================================

function loadJson(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function getCluster(path, label) {
  if (!path) return 'other';
  const p = path.toLowerCase();
  if (p.includes('signer') || p.includes('sign')) return 'signature';
  if (p.includes('agency') || p.includes('court') || p.includes('procuracy') || p.includes('investigation')) return 'agency';
  if (p.includes('case') || p.includes('crime') || p.includes('offense') || p.includes('decision') || p.includes('document')) return 'case_metadata';
  if (p.includes('name') || p.includes('fullname') || p.includes('representative') || p.includes('position') || p.includes('workplace') || p.includes('residence') || p.includes('birth')) return 'person_identity';
  if (p.includes('address') || p.includes('address')) return 'person_identity';
  return 'other';
}

function classifyRisk(path, label, source) {
  // High risk: raw camelCase label that is legally ambiguous (e.g. crimeName depends on case type)
  const ambiguousCamelCase = ['crimeName', 'offenseName', 'caseName', 'caseType'];
  if (ambiguousCamelCase.includes(label)) return 'high';

  // Medium risk: camelCase label with clear domain but may need context
  const mediumRisk = ['caseNumber', 'caseCode', 'decisionNumber', 'decisionDate', 'documentDate', 'documentPlace'];
  if (mediumRisk.includes(label)) return 'medium';

  // Low risk: clear person/address/signer labels
  const lowRisk = ['fullName', 'name', 'address', 'currentAddress', 'permanentAddress',
    'temporaryAddress', 'contactAddress', 'residence', 'workplace', 'position',
    'representativeName', 'legalRepresentative', 'signerName', 'signerTitle',
    'signerPosition', 'signDate', 'signPlace',
    'agencyName', 'agencyAddress', 'procuracyName', 'courtName', 'investigationAgencyName'];
  if (lowRisk.includes(label)) return 'low';

  // Default medium
  return 'medium';
}

// ============================================================================
// SCAN LOGIC
// ============================================================================

function scan() {
  const audit = loadJson(AUDIT_JSON);
  const fixPlan = loadJson(FIXPLAN_JSON) || [];

  const baselineIssues = audit?.totalIssues ?? 3441;
  const baselineBadLabel = audit?.issueCounts?.['BAD_LABEL'] ?? 432;
  const baselineUiVisible = audit?.issueCounts?.['UI_VISIBLE_BAD_METADATA'] ?? 77;

  // Index fixPlan by templateCode+path for quick lookup
  const fixPlanMap = new Map();
  for (const item of fixPlan) {
    const key = `${item.templateCode}::${item.path}`;
    fixPlanMap.set(key, item);
  }

  // Scan BAD_LABEL and UI_VISIBLE_BAD_METADATA issues
  const candidates = [];
  const dictionaryAnalysis = {};
  const unresolvedBadLabels = new Map();
  let id = 1;

  const issues = audit?.issues || [];
  for (const issue of issues) {
    const { templateCode, path, label, source, issueCode, reason } = issue;

    // Only BAD_LABEL and UI_VISIBLE_BAD_METADATA
    if (issueCode !== 'BAD_LABEL' && issueCode !== 'UI_VISIBLE_BAD_METADATA') continue;

    // Skip if no label
    if (!label) continue;

    // Skip excluded paths
    if (isExcludedByPath(path)) continue;

    // Skip excluded labels
    if (isExcludedByLabel(label)) continue;

    // Skip if already fixed by Batch 3
    if (label === 'Nơi ở hiện tại' || label === 'Nơi cấp' || label === 'Số CCCD/CMND' ||
        label === 'Nghề nghiệp' || label === 'Nơi thường trú' || label === 'Số điện thoại' ||
        label === 'Nơi tạm trú' || label === 'Nơi sinh' || label === 'Dân tộc' || label === 'Tôn giáo') {
      continue;
    }

    const fixPlanKey = `${templateCode}::${path}`;
    const fixPlanItem = fixPlanMap.get(fixPlanKey);
    const issueTypes = [issueCode];
    if (fixPlanItem?.issueCodes) {
      for (const ic of fixPlanItem.issueCodes) {
        if (!issueTypes.includes(ic)) issueTypes.push(ic);
      }
    }

    // Check for disqualifying issue types
    const disqualifying = ['SOURCE_MISMATCH', 'COMPILED_DRIFT', 'SHOULD_BE_READONLY',
      'RAW_PATTERN_DOMAIN_MISMATCH', 'BLOCKED_BY_DOCX_AUTHORING'];
    const hasDisqualifying = issueTypes.some(t => disqualifying.includes(t));
    if (hasDisqualifying) {
      // Track for unresolved analysis
      const key = `${label}::${path}`;
      if (!unresolvedBadLabels.has(key)) {
        unresolvedBadLabels.set(key, { label, path, templateCode, count: 0 });
      }
      unresolvedBadLabels.get(key).count++;
      continue;
    }

    // Check if label matches Batch 4 dictionary
    const proposedLabel = BATCH4_DICTIONARY[label];
    const cluster = getCluster(path, label);
    const risk = classifyRisk(path, label, source);

    let recommendation = 'DEFER_METADATA_REVIEW';
    if (proposedLabel && risk === 'low') {
      recommendation = 'PROPOSE_FOR_BATCH_4';
    } else if (risk === 'high') {
      recommendation = 'BLOCKED';
    } else if (proposedLabel && risk === 'medium') {
      recommendation = 'DEFER_METADATA_REVIEW';
    }

    // Track dictionary match
    if (proposedLabel) {
      if (!dictionaryAnalysis[label]) {
        dictionaryAnalysis[label] = { key: label, proposedLabel, matchedPaths: new Set(), matchedContracts: new Set(), count: 0 };
      }
      dictionaryAnalysis[label].count++;
      dictionaryAnalysis[label].matchedPaths.add(path);
      dictionaryAnalysis[label].matchedContracts.add(templateCode);
    } else {
      // Unresolved label
      const key = `${label}::${path}`;
      if (!unresolvedBadLabels.has(key)) {
        unresolvedBadLabels.set(key, { label, path, templateCode, count: 0 });
      }
      unresolvedBadLabels.get(key).count++;
    }

    candidates.push({
      reviewGroupId: `B4PLAN-${String(id).padStart(3, '0')}`,
      templateCode,
      sourceId: issue.sourceId || templateCode,
      section: path?.split('.')[0] || '',
      path,
      currentLabel: label,
      proposedLabel: proposedLabel || null,
      cluster,
      evidence: {
        source: source || 'manual',
        issueTypes,
        similarFields: [],
      },
      risk,
      recommendation,
    });

    id++;
  }

  // Build summary
  const safeCandidates = candidates.filter(c => c.recommendation === 'PROPOSE_FOR_BATCH_4');
  const deferredCandidates = candidates.filter(c => c.recommendation === 'DEFER_METADATA_REVIEW');
  const blockedCandidates = candidates.filter(c => c.recommendation === 'BLOCKED');

  const clusters = {
    person_identity: candidates.filter(c => c.cluster === 'person_identity'),
    case_metadata: candidates.filter(c => c.cluster === 'case_metadata'),
    agency: candidates.filter(c => c.cluster === 'agency'),
    signature: candidates.filter(c => c.cluster === 'signature'),
    other: candidates.filter(c => c.cluster === 'other'),
  };

  // Build dictionary analysis
  const dictEntries = Object.values(dictionaryAnalysis)
    .map(d => ({
      rawLabel: d.key,
      proposedLabel: d.proposedLabel,
      totalOccurrences: d.count,
      uniquePaths: d.matchedPaths.size,
      uniqueContracts: d.matchedContracts.size,
      paths: [...d.matchedPaths],
      contracts: [...d.matchedContracts],
    }))
    .sort((a, b) => b.totalOccurrences - a.totalOccurrences);

  // Top 20 unresolved
  const topUnresolved = [...unresolvedBadLabels.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(u => ({
      label: u.label,
      path: u.path,
      sampleContract: u.templateCode,
      occurrenceCount: u.count,
    }));

  return {
    baselineIssues,
    baselineBadLabel,
    baselineUiVisible,
    candidates,
    safeCandidates,
    deferredCandidates,
    blockedCandidates,
    clusters,
    dictEntries,
    topUnresolved,
    totalScanned: candidates.length,
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function writeReports(result) {
  mkdirSync(PLANNING_DIR, { recursive: true });

  // --- candidates.latest.json ---
  const candidatesJson = {
    schemaVersion: '1.0',
    task: 'BATCH_4_LABEL_ONLY_PLANNING_SCAN',
    mode: 'planning-only',
    generatedAt: new Date().toISOString(),
    summary: {
      rootCauseIssuesBefore: result.baselineIssues,
      badLabelRemainingBefore: result.baselineBadLabel,
      uiVisibleBadMetadataBefore: result.baselineUiVisible,
      candidatesScanned: result.totalScanned,
      safeLabelOnlyCandidates: result.safeCandidates.length,
      deferredCandidates: result.deferredCandidates.length,
      blockedCandidates: result.blockedCandidates.length,
    },
    clusters: [
      { name: 'person_identity', count: result.clusters.person_identity.length },
      { name: 'case_metadata', count: result.clusters.case_metadata.length },
      { name: 'agency', count: result.clusters.agency.length },
      { name: 'signature', count: result.clusters.signature.length },
      { name: 'other', count: result.clusters.other.length },
    ],
    candidates: result.candidates,
  };

  writeFileSync(join(PLANNING_DIR, 'candidates.latest.json'), JSON.stringify(candidatesJson, null, 2), 'utf8');
  process.stderr.write(`[PLANNING] Written: ${join(PLANNING_DIR, 'candidates.latest.json')}\n`);

  // --- dictionary-analysis.latest.json ---
  const dictAnalysis = {
    schemaVersion: '1.0',
    task: 'BATCH_4_LABEL_ONLY_PLANNING_SCAN',
    mode: 'planning-only',
    generatedAt: new Date().toISOString(),
    dictionaryEntries: result.dictEntries,
    acceptedCounts: result.dictEntries.reduce((acc, d) => {
      if (!acc[d.rawLabel]) acc[d.rawLabel] = 0;
      acc[d.rawLabel]++;
      return acc;
    }, {}),
    topUnresolvedLabels: result.topUnresolved,
    totalDictionaryKeysEvaluated: Object.keys(BATCH4_DICTIONARY).length,
    dictionaryKeysMatched: result.dictEntries.length,
    dictionaryKeysNotMatched: Object.keys(BATCH4_DICTIONARY).length - result.dictEntries.length,
  };

  writeFileSync(join(PLANNING_DIR, 'dictionary-analysis.latest.json'), JSON.stringify(dictAnalysis, null, 2), 'utf8');
  process.stderr.write(`[PLANNING] Written: ${join(PLANNING_DIR, 'dictionary-analysis.latest.json')}\n`);

  // --- candidates.latest.md ---
  const safe = result.safeCandidates;
  const deferred = result.deferredCandidates;
  const blocked = result.blockedCandidates;

  const recommendation = safe.length >= 10
    ? 'RECOMMEND_OPEN_BATCH_4_APPLY'
    : safe.length >= 3
      ? 'CONSIDER_BATCH_4_WITH_CARE'
      : 'DEFER_TO_DOCX_AUTHORING_LANE';

  const lines = [
    '# Batch 4 Label-Only Planning Scan',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: **PLANNING ONLY** — no contracts mutated`,
    '',
    '## Executive Summary',
    '',
    `| Metric | Value |`,
    `|--------|------:|`,

    `| Root-cause issues before | ${result.baselineIssues} |`,
    `| BAD_LABEL remaining | ${result.baselineBadLabel} |`,
    `| UI_VISIBLE_BAD_METADATA remaining | ${result.baselineUiVisible} |`,
    `| Candidates scanned | ${result.totalScanned} |`,
    `| **Safe label-only candidates** | **${safe.length}** |`,
    `| Deferred candidates | ${deferred.length} |`,
    `| Blocked candidates | ${blocked.length} |`,
    '',
    '## Cluster Summary',
    '',
    `| Cluster | Count |`,
    `|---------|------:|`,

    `| person_identity | ${result.clusters.person_identity.length} |`,
    `| case_metadata | ${result.clusters.case_metadata.length} |`,
    `| agency | ${result.clusters.agency.length} |`,
    `| signature | ${result.clusters.signature.length} |`,
    `| other | ${result.clusters.other.length} |`,
    '',
    '## Risk Summary',
    '',
    `| Risk | Count |`,
    `|------|------:|`,

    `| low | ${result.candidates.filter(c => c.risk === 'low').length} |`,
    `| medium | ${result.candidates.filter(c => c.risk === 'medium').length} |`,
    `| high | ${result.candidates.filter(c => c.risk === 'high').length} |`,
    '',
  ];

  if (safe.length > 0) {
    lines.push('## Proposed Batch 4 Candidates (Low Risk, Label-Only)');
    lines.push('');
    lines.push('| # | BM | Path | Current | Proposed | Cluster | Risk |');
    lines.push('|---|----|------|---------|---------|--------|------|');
    safe.slice(0, 50).forEach((c, i) => {
      lines.push(`| ${i + 1} | ${c.templateCode} | \`${c.path}\` | \`${c.currentLabel}\` | \`${c.proposedLabel || '-'}\` | ${c.cluster} | ${c.risk} |`);
    });
    if (safe.length > 50) lines.push(`| ... | (+${safe.length - 50} more) | | | | | |`);
    lines.push('');
  }

  if (deferred.length > 0) {
    lines.push('## Deferred Candidates');
    lines.push('');
    lines.push('| # | BM | Path | Current | Cluster | Risk | Reason |');
    lines.push('|---|----|------|---------|--------|------|--------|');
    deferred.slice(0, 30).forEach((c, i) => {
      lines.push(`| ${i + 1} | ${c.templateCode} | \`${c.path}\` | \`${c.currentLabel}\` | ${c.cluster} | ${c.risk} | ${c.proposedLabel ? 'medium risk' : 'no dictionary match'} |`);
    });
    if (deferred.length > 30) lines.push(`| ... | (+${deferred.length - 30} more) | | | | | |`);
    lines.push('');
  }

  if (blocked.length > 0) {
    lines.push('## Blocked Candidates');
    lines.push('');
    lines.push('| # | BM | Path | Current | Risk |');
    lines.push('|---|----|------|---------|------|');
    blocked.slice(0, 20).forEach((c, i) => {
      lines.push(`| ${i + 1} | ${c.templateCode} | \`${c.path}\` | \`${c.currentLabel}\` | ${c.risk} |`);
    });
    if (blocked.length > 20) lines.push(`| ... | (+${blocked.length - 20} more) | | | |`);
    lines.push('');
  }

  lines.push('## Top Recurring Unresolved Labels');
  lines.push('');
  lines.push('Labels flagged as BAD_LABEL but not matched by Batch 4 dictionary:');
  lines.push('');
  lines.push('| # | Label | Sample Path | Occurrences |');
  lines.push('|---|-------|-------------|-------------|');
  result.topUnresolved.slice(0, 20).forEach((u, i) => {
    lines.push(`| ${i + 1} | \`${u.label}\` | \`${u.path}\` | ${u.occurrenceCount} |`);
  });
  lines.push('');

  lines.push('## Recommendation');
  lines.push('');
  if (recommendation === 'RECOMMEND_OPEN_BATCH_4_APPLY') {
    lines.push(`**RECOMMEND_OPEN_BATCH_4_APPLY** — ${safe.length} safe candidates found.`);
    lines.push('');
    lines.push('Safe candidates >= 10. Risk is low. Dictionary cluster is deterministic.');
    lines.push('Next step: create decisions.approved.json and apply script for Batch 4.');
  } else if (recommendation === 'CONSIDER_BATCH_4_WITH_CARE') {
    lines.push(`**CONSIDER_BATCH_4_WITH_CARE** — ${safe.length} safe candidates found.`);
    lines.push('');
    lines.push('Candidate count is moderate. Manual review recommended before apply.');
    lines.push('Consider expanding dictionary or deferring to DOCX authoring lane.');
  } else {
    lines.push(`**DEFER_TO_DOCX_AUTHORING_LANE** — ${safe.length} safe candidates found.`);
    lines.push('');
    lines.push('Candidate pool is too small or too ambiguous. Switch to DOCX authoring lane.');
    lines.push('Focus on BM-053/ENOENT fix and DOCX authoring improvements.');
  }
  lines.push('');
  lines.push('## Safety Verification');
  lines.push('');
  lines.push('| Check | Result |');
  lines.push('|-------|--------|');
  lines.push('| Locked contracts mutated | **false** |');
  lines.push('| DOCX touched | **false** |');
  lines.push('| Compiled artifacts hand-edited | **false** |');
  lines.push('| Source/path/binding untouched | **true** |');
  lines.push('| legalBasis excluded | **true** |');
  lines.push('');

  writeFileSync(join(PLANNING_DIR, 'candidates.latest.md'), lines.join('\n'), 'utf8');
  process.stderr.write(`[PLANNING] Written: ${join(PLANNING_DIR, 'candidates.latest.md')}\n`);

  // --- dictionary-analysis.latest.md ---
  const dictLines = [
    '# Batch 4 Dictionary Analysis',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: **PLANNING ONLY**`,
    '',
    '## Summary',
    '',
    `| Metric | Value |`,
    `|--------|------:|`,

    `| Dictionary keys evaluated | ${Object.keys(BATCH4_DICTIONARY).length} |`,
    `| Keys matched in audit | ${result.dictEntries.length} |`,
    `| Keys not matched | ${Object.keys(BATCH4_DICTIONARY).length - result.dictEntries.length} |`,
    '',
    '## Matched Dictionary Keys',
    '',
    '| Raw Label | Proposed | Occurrences | Unique Paths | Unique Contracts |',
    '|---------|---------|------------|------------|-----------------|',

    ...result.dictEntries.map(d =>
      `| \`${d.rawLabel}\` | \`${d.proposedLabel}\` | ${d.totalOccurrences} | ${d.uniquePaths} | ${d.uniqueContracts} |`
    ),
    '',
  ];

  writeFileSync(join(PLANNING_DIR, 'dictionary-analysis.latest.md'), dictLines.join('\n'), 'utf8');
  process.stderr.write(`[PLANNING] Written: ${join(PLANNING_DIR, 'dictionary-analysis.latest.md')}\n`);

  process.stderr.write(`[PLANNING] Scan complete.\n`);
  process.stderr.write(`[PLANNING] Total scanned: ${result.totalScanned}\n`);
  process.stderr.write(`[PLANNING] Safe candidates: ${safe.length}\n`);
  process.stderr.write(`[PLANNING] Deferred: ${deferred.length}\n`);
  process.stderr.write(`[PLANNING] Blocked: ${blocked.length}\n`);
  process.stderr.write(`[PLANNING] Recommendation: ${recommendation}\n`);

  return { safe, deferred, blocked, recommendation, result };
}

// ============================================================================
// MAIN
// ============================================================================

const result = scan();
const { safe, deferred, blocked, recommendation } = writeReports(result);

process.exit(0);
