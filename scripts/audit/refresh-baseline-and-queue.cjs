const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const CONTRACT_DIR = path.join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const CLOSURE_PATH = path.join(
  ROOT,
  'docs',
  'audit',
  'docx-path-binding-combined-destructive-closure',
  'closure.latest.json',
);
const OUT_BASE = path.join(ROOT, 'docs', 'audit', 'per-form-render-accurate');
const BATCH_DIR = path.join(OUT_BASE, 'batches', 'safe-label-only-batch-1');

const CLOSED_BMS = ['BM-002', 'BM-001'];
const LABEL_ISSUE_CODES = new Set(['BAD_LABEL', 'UI_VISIBLE_BAD_METADATA']);
const BLOCKING_CODES = new Set([
  'RAW_PATTERN_DOMAIN_MISMATCH',
  'SOURCE_MISMATCH',
  'COMPILED_DRIFT',
  'REMEDIATION_LEAK',
  'GENERIC_FIELD_CANONICALIZATION',
]);
const REVIEW_CODES = new Set(['SHOULD_BE_READONLY', 'REQUIRED_SUSPICIOUS']);
const REVIEW_PATH_RE =
  /(^|\.)(legalBasis|signature|recipients)\b|(^|\.)(issuePlaceAndDateLine|issuePlaceDateLine|issueDateLine|archiveLine|primaryLine|dieu\d*|article|clause|canCu|nguoiKy|chucVu|noiNhan|luuHo|diaDanh|ngayBan|fullDocumentCode)$/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`);
}

function md(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function html(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function codeBlock(value) {
  return `\`${String(value ?? '').replace(/`/g, '\\`')}\``;
}

function loadLockedContracts() {
  const byTemplate = new Map();
  const files = fs.existsSync(CONTRACT_DIR)
    ? fs.readdirSync(CONTRACT_DIR).filter(file => file.endsWith('.contract.locked.json'))
    : [];

  for (const file of files) {
    const contractPath = path.join(CONTRACT_DIR, file);
    const contract = readJson(contractPath);
    const canonicalFields = Array.isArray(contract.canonicalFields) ? contract.canonicalFields : [];
    const fieldsByPath = new Map();
    canonicalFields.forEach((field, index) => {
      if (field?.path) fieldsByPath.set(field.path, { ...field, canonicalFieldIndex: index });
    });

    byTemplate.set(contract.templateCode, {
      file,
      contract,
      sourceId: contract.sourceId,
      fieldsByPath,
      counts: {
        canonicalFields: canonicalFields.length,
        docxSlots: Array.isArray(contract.docxSlots) ? contract.docxSlots.length : 0,
        renderBindings: Array.isArray(contract.renderBindings) ? contract.renderBindings.length : 0,
      },
    });
  }

  return byTemplate;
}

function loadDeferredTracking() {
  const fallbackItems = [
    { templateCode: 'BM-069', path: 'document.fullDocumentCode', reason: 'FALSE_HEADER_SLOT without replacement' },
    { templateCode: 'BM-075', path: 'document.fullDocumentCode', reason: 'FALSE_HEADER_SLOT without replacement' },
    { templateCode: 'BM-077', path: 'document.fullDocumentCode', reason: 'FALSE_HEADER_SLOT without replacement' },
    { templateCode: 'BM-082', path: 'document.fullDocumentCode', reason: 'FALSE_HEADER_SLOT without replacement' },
    { templateCode: 'BM-063', path: 'recipients.personLine5', reason: 'Body continuation, KEEP_DEFERRED' },
    { templateCode: 'BM-065', path: 'recipients.personLine3', reason: 'Body continuation, KEEP_DEFERRED' },
    { templateCode: 'BM-061', path: 'recipients.personLine3', reason: 'Body continuation, KEEP_DEFERRED' },
    { templateCode: 'BM-067', path: 'recipients.personLine3', reason: 'Body continuation, KEEP_DEFERRED' },
  ];
  const closure = fs.existsSync(CLOSURE_PATH) ? readJson(CLOSURE_PATH) : {};
  const items = Array.isArray(closure.deferredTracking?.items)
    ? closure.deferredTracking.items
    : fallbackItems;

  return {
    source: fs.existsSync(CLOSURE_PATH) ? path.relative(ROOT, CLOSURE_PATH) : 'fallback',
    items,
    bmSet: new Set(items.map(item => item.templateCode).filter(Boolean)),
    pathSet: new Set(items.map(item => `${item.templateCode}|${item.path}`).filter(Boolean)),
  };
}

function hasAny(set, candidates) {
  return candidates.some(candidate => set.has(candidate));
}

function looksRawCamelCase(label, fieldPath) {
  const value = String(label ?? '').trim();
  const tail = String(fieldPath ?? '').split('.').pop();
  return Boolean(
    value &&
      (value === tail ||
        /^[a-z][A-Za-z0-9]*$/.test(value) ||
        /[a-z][A-Z]/.test(value)),
  );
}

function looksGenericOldLabel(label, fieldPath) {
  const value = String(label ?? '').trim();
  const lower = value.toLowerCase();
  return Boolean(
    value === 'Ô trống' ||
      value === 'O trong' ||
      lower.includes('slot from wave') ||
      lower.includes('docx remediation') ||
      lower.startsWith('slot ') ||
      looksRawCamelCase(value, fieldPath),
  );
}

function summarizeIssues(issues) {
  return [...new Set(issues.map(issue => issue.issueCode).filter(Boolean))].sort();
}

function issueGroupKey(issue) {
  return `${issue.templateCode}|${issue.path}`;
}

function buildIssueGroups(report) {
  const groups = new Map();
  for (const issue of report.issues ?? []) {
    if (!issue.templateCode || !issue.path) continue;
    const key = issueGroupKey(issue);
    if (!groups.has(key)) {
      groups.set(key, {
        templateCode: issue.templateCode,
        sourceId: issue.sourceId,
        path: issue.path,
        issues: [],
      });
    }
    groups.get(key).issues.push(issue);
  }

  return [...groups.values()].filter(group =>
    group.issues.some(issue => LABEL_ISSUE_CODES.has(issue.issueCode)),
  );
}

function classifyLabelGroup(group, lockedContracts, deferredTracking) {
  const issueCodes = summarizeIssues(group.issues);
  const primary = group.issues.find(issue => issue.issueCode === 'BAD_LABEL') ?? group.issues[0];
  const suggestedLabel =
    group.issues.find(issue => typeof issue.suggestedLabel === 'string' && issue.suggestedLabel.trim())
      ?.suggestedLabel ?? null;
  const suggestedPath =
    group.issues.find(issue => typeof issue.suggestedPath === 'string' && issue.suggestedPath.trim())
      ?.suggestedPath ?? null;
  const contractEntry = lockedContracts.get(group.templateCode);
  const canonicalField = contractEntry?.fieldsByPath.get(group.path);
  const oldLabel = canonicalField?.label ?? primary.label ?? null;
  const reasons = [];
  let classification = 'AUTO_SAFE';

  if (CLOSED_BMS.includes(group.templateCode)) {
    return {
      classification: 'EXCLUDED_CLOSED',
      reasons: ['BM already closed in the safe-label-only lane'],
      primary,
      suggestedLabel,
      suggestedPath,
      oldLabel,
      canonicalField,
      contractEntry,
      issueCodes,
    };
  }

  if (deferredTracking.bmSet.has(group.templateCode) || deferredTracking.pathSet.has(`${group.templateCode}|${group.path}`)) {
    return {
      classification: 'EXCLUDED_KEEP_DEFERRED',
      reasons: ['BM/path is on KEEP_DEFERRED closure track'],
      primary,
      suggestedLabel,
      suggestedPath,
      oldLabel,
      canonicalField,
      contractEntry,
      issueCodes,
    };
  }

  if (!contractEntry) {
    classification = 'BLOCKED';
    reasons.push('locked contract not found');
  }
  if (!canonicalField) {
    classification = 'BLOCKED';
    reasons.push('canonical field path not found in locked contract');
  }
  if (suggestedPath) {
    classification = 'BLOCKED';
    reasons.push('root-cause audit suggests a path change, not label-only');
  }
  if (hasAny(BLOCKING_CODES, issueCodes)) {
    classification = 'BLOCKED';
    reasons.push(`co-occurring blocker issue(s): ${issueCodes.filter(code => BLOCKING_CODES.has(code)).join(', ')}`);
  }

  if (classification !== 'BLOCKED') {
    const reviewReasons = [];
    if (hasAny(REVIEW_CODES, issueCodes)) {
      reviewReasons.push(`co-occurring review issue(s): ${issueCodes.filter(code => REVIEW_CODES.has(code)).join(', ')}`);
    }
    if (group.issues.some(issue => issue.requiresHumanReview)) {
      reviewReasons.push('root-cause audit requires human review');
    }
    if (!suggestedLabel) {
      reviewReasons.push('no audited suggestedLabel is available');
    }
    if (suggestedLabel && String(suggestedLabel).trim() === String(oldLabel ?? '').trim()) {
      reviewReasons.push('suggestedLabel is a no-op against the locked contract label');
    }
    if (canonicalField?.reviewRequired) {
      reviewReasons.push('locked contract marks canonical field as reviewRequired');
    }
    if (REVIEW_PATH_RE.test(group.path)) {
      reviewReasons.push('path is legal/signature/recipient/date/header sensitive');
    }
    if (!looksGenericOldLabel(oldLabel, group.path)) {
      reviewReasons.push('old label is not a known generic/raw placeholder');
    }

    if (reviewReasons.length > 0) {
      classification = 'REVIEW_NEEDED';
      reasons.push(...reviewReasons);
    }
  }

  if (classification === 'AUTO_SAFE') {
    reasons.push('label-only issue with audited suggestedLabel, stable path, and generic/raw old label');
  }

  return {
    classification,
    reasons,
    primary,
    suggestedLabel,
    suggestedPath,
    oldLabel,
    canonicalField,
    contractEntry,
    issueCodes,
  };
}

function buildFieldEntry(group, classificationResult) {
  const { canonicalField, contractEntry, primary } = classificationResult;
  const issueCodes = classificationResult.issueCodes;
  return {
    bm: group.templateCode,
    sourceId: contractEntry?.sourceId ?? group.sourceId ?? null,
    path: group.path,
    canonicalFieldIndex: canonicalField?.canonicalFieldIndex ?? null,
    target:
      canonicalField?.canonicalFieldIndex !== undefined
        ? `canonicalFields[${canonicalField.canonicalFieldIndex}].label`
        : null,
    oldLabel: classificationResult.oldLabel,
    newLabel: classificationResult.suggestedLabel,
    issueCodes,
    severity: primary.severity ?? null,
    confidence: primary.confidence ?? null,
    reasons: classificationResult.reasons,
    counts: contractEntry?.counts ?? null,
    expectedBadLabelDelta: issueCodes.includes('BAD_LABEL') ? -1 : 0,
    expectedUiVisibleDelta: issueCodes.includes('UI_VISIBLE_BAD_METADATA') ? -1 : 0,
  };
}

function sortEntries(entries) {
  return entries.sort((a, b) =>
    a.bm.localeCompare(b.bm) ||
    String(a.path).localeCompare(String(b.path)),
  );
}

function buildSafeLabelBatchPlan(report, lockedContracts, deferredTracking) {
  const groups = buildIssueGroups(report);
  const buckets = {
    AUTO_SAFE_APPROVABLE: [],
    REVIEW_NEEDED: [],
    BLOCKED: [],
    EXCLUDED_CLOSED: [],
    EXCLUDED_KEEP_DEFERRED: [],
  };

  for (const group of groups) {
    const classification = classifyLabelGroup(group, lockedContracts, deferredTracking);
    const entry = buildFieldEntry(group, classification);
    buckets[classification.classification].push(entry);
  }

  for (const key of Object.keys(buckets)) sortEntries(buckets[key]);

  const auto = buckets.AUTO_SAFE_APPROVABLE;
  const autoBms = [...new Set(auto.map(entry => entry.bm))].sort();
  const runnerPath = path.join(ROOT, 'scripts', 'audit', 'apply-safe-label-only.mjs');
  const runnerSource = fs.existsSync(runnerPath) ? fs.readFileSync(runnerPath, 'utf8') : '';
  const checks = {
    noKeepDeferredInAutoSafe: auto.every(entry => !deferredTracking.bmSet.has(entry.bm)),
    noReviewNeededInAutoSafe: auto.every(entry => !hasAny(REVIEW_CODES, entry.issueCodes)),
    noBlockedIssueCodeInAutoSafe: auto.every(entry => !hasAny(BLOCKING_CODES, entry.issueCodes)),
    allAutoSafeTargetsCanonicalLabels: auto.every(entry => /^canonicalFields\[\d+\]\.label$/.test(entry.target ?? '')),
    allAutoSafeHaveExactOldAndNewLabels: auto.every(entry =>
      typeof entry.oldLabel === 'string' &&
      entry.oldLabel.length > 0 &&
      typeof entry.newLabel === 'string' &&
      entry.newLabel.length > 0 &&
      entry.oldLabel !== entry.newLabel,
    ),
    runnerDeepDiffGuardPresent:
      runnerSource.includes('collectJsonDiffs') &&
      runnerSource.includes('deepDiffAllowedOnly') &&
      runnerSource.includes('changedJsonPaths'),
  };
  checks.clean = Object.values(checks).every(Boolean);

  const expectedDelta = {
    BAD_LABEL: auto.reduce((sum, entry) => sum + entry.expectedBadLabelDelta, 0),
    UI_VISIBLE_BAD_METADATA: auto.reduce((sum, entry) => sum + entry.expectedUiVisibleDelta, 0),
  };

  return {
    schemaVersion: '2.0',
    task: 'SAFE_LABEL_ONLY_BATCH_1_FIELD_LEVEL_PLAN',
    generatedAt: new Date().toISOString(),
    sourceAudit: path.relative(ROOT, REPORT_PATH),
    closureSource: deferredTracking.source,
    scope: 'Plan only. No contract write/apply performed. AUTO_SAFE_APPROVABLE means canonicalFields[index].label only.',
    closedBms: CLOSED_BMS,
    keepDeferred: {
      total: deferredTracking.items.length,
      bms: [...deferredTracking.bmSet].sort(),
      items: deferredTracking.items,
    },
    globalBaselineAfterCurrentAudit: {
      totalIssues: report.totalIssues,
      failCount: report.failCount,
      reviewCount: report.reviewCount,
      BAD_LABEL: report.issueCounts?.BAD_LABEL ?? 0,
      UI_VISIBLE_BAD_METADATA: report.issueCounts?.UI_VISIBLE_BAD_METADATA ?? 0,
    },
    classificationRules: {
      AUTO_SAFE_APPROVABLE: [
        'field has BAD_LABEL/UI_VISIBLE_BAD_METADATA only in label lane',
        'locked contract path exists and target is canonicalFields[index].label',
        'old label is a known placeholder or raw camelCase label',
        'audited suggestedLabel exists and is not a no-op',
        'no path/source/generic/remediation/compiled drift blockers',
        'no legal/signature/recipient/date/header-sensitive path',
        'not closed and not KEEP_DEFERRED',
      ],
      REVIEW_NEEDED: [
        'human review flag, readonly/required-suspicious issue, sensitive path, missing suggestedLabel, or non-placeholder old label',
      ],
      BLOCKED: [
        'path/source/generic/remediation/compiled drift issue, suggestedPath, missing locked contract, or missing canonical field',
      ],
      EXCLUDED: ['already closed BM or KEEP_DEFERRED BM/path'],
    },
    checks,
    approvalCommand:
      checks.clean && auto.length > 0 ? 'APPROVE_SAFE_LABEL_ONLY_BATCH_1_AUTO_SAFE_ONLY' : null,
    applyMode:
      'After approval, create per-BM decisions.approved.json from AUTO_SAFE_APPROVABLE only, dry-run each BM, then apply one BM at a time.',
    expectedDeltaIfAutoSafeOnlyApproved: expectedDelta,
    summary: {
      labelIssueFields: groups.length,
      autoSafeFieldCount: auto.length,
      autoSafeBmCount: autoBms.length,
      reviewNeededFieldCount: buckets.REVIEW_NEEDED.length,
      blockedFieldCount: buckets.BLOCKED.length,
      excludedClosedFieldCount: buckets.EXCLUDED_CLOSED.length,
      excludedKeepDeferredFieldCount: buckets.EXCLUDED_KEEP_DEFERRED.length,
    },
    autoSafeBms: autoBms,
    sections: buckets,
  };
}

function makeBatchPlanMd(plan) {
  const lines = [
    '# Safe Label Only Batch 1 - Field-Level Plan',
    '',
    `Generated: ${plan.generatedAt}`,
    '',
    '## Decision',
    '',
    plan.approvalCommand
      ? `Approval token: ${codeBlock(plan.approvalCommand)}`
      : 'Approval token: none. No AUTO_SAFE_APPROVABLE changes should be applied from this plan.',
    '',
    'No apply was performed by this refresh script.',
    '',
    '## Current Baseline',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Total issues | ${plan.globalBaselineAfterCurrentAudit.totalIssues} |`,
    `| FAIL | ${plan.globalBaselineAfterCurrentAudit.failCount} |`,
    `| REVIEW | ${plan.globalBaselineAfterCurrentAudit.reviewCount} |`,
    `| BAD_LABEL | ${plan.globalBaselineAfterCurrentAudit.BAD_LABEL} |`,
    `| UI_VISIBLE_BAD_METADATA | ${plan.globalBaselineAfterCurrentAudit.UI_VISIBLE_BAD_METADATA} |`,
    '',
    '## Summary',
    '',
    '| Bucket | Fields |',
    '|--------|--------|',
    `| AUTO_SAFE_APPROVABLE | ${plan.summary.autoSafeFieldCount} |`,
    `| REVIEW_NEEDED | ${plan.summary.reviewNeededFieldCount} |`,
    `| BLOCKED | ${plan.summary.blockedFieldCount} |`,
    `| EXCLUDED_CLOSED | ${plan.summary.excludedClosedFieldCount} |`,
    `| EXCLUDED_KEEP_DEFERRED | ${plan.summary.excludedKeepDeferredFieldCount} |`,
    '',
    '## Expected Delta If AUTO_SAFE Only Is Approved',
    '',
    '| Issue | Delta |',
    '|-------|-------|',
    `| BAD_LABEL | ${plan.expectedDeltaIfAutoSafeOnlyApproved.BAD_LABEL} |`,
    `| UI_VISIBLE_BAD_METADATA | ${plan.expectedDeltaIfAutoSafeOnlyApproved.UI_VISIBLE_BAD_METADATA} |`,
    '',
    '## Guard Checks',
    '',
    '| Check | Pass |',
    '|-------|------|',
  ];

  for (const [key, value] of Object.entries(plan.checks)) {
    lines.push(`| ${md(key)} | ${value ? 'YES' : 'NO'} |`);
  }

  lines.push('', '## AUTO_SAFE_APPROVABLE', '');
  if (plan.sections.AUTO_SAFE_APPROVABLE.length === 0) {
    lines.push('No fields currently qualify under the conservative field-level guard.');
  } else {
    lines.push('| BM | Path | Target | Old label | New label | Issues |');
    lines.push('|----|------|--------|-----------|-----------|--------|');
    for (const entry of plan.sections.AUTO_SAFE_APPROVABLE) {
      lines.push(
        `| ${entry.bm} | ${codeBlock(entry.path)} | ${codeBlock(entry.target)} | ${md(entry.oldLabel)} | ${md(entry.newLabel)} | ${md(entry.issueCodes.join(', '))} |`,
      );
    }
  }

  for (const section of ['REVIEW_NEEDED', 'BLOCKED', 'EXCLUDED_KEEP_DEFERRED', 'EXCLUDED_CLOSED']) {
    lines.push('', `## ${section}`, '');
    const entries = plan.sections[section];
    if (entries.length === 0) {
      lines.push('None.');
      continue;
    }
    lines.push('| BM | Path | Old label | Suggested label | Issues | Reason |');
    lines.push('|----|------|-----------|-----------------|--------|--------|');
    for (const entry of entries.slice(0, 80)) {
      lines.push(
        `| ${entry.bm} | ${codeBlock(entry.path)} | ${md(entry.oldLabel)} | ${md(entry.newLabel)} | ${md(entry.issueCodes.join(', '))} | ${md(entry.reasons.join('; '))} |`,
      );
    }
    if (entries.length > 80) {
      lines.push(`| ... | ... | ... | ... | ... | ${entries.length - 80} more in JSON |`);
    }
  }

  return lines.join('\n');
}

function makeDashboardHtml(plan) {
  function rows(entries) {
    if (entries.length === 0) {
      return '<tr><td colspan="6" class="muted">None</td></tr>';
    }
    return entries.map(entry => `
      <tr>
        <td>${html(entry.bm)}</td>
        <td><code>${html(entry.path)}</code></td>
        <td>${html(entry.oldLabel)}</td>
        <td>${html(entry.newLabel)}</td>
        <td>${html(entry.issueCodes.join(', '))}</td>
        <td>${html(entry.reasons.join('; '))}</td>
      </tr>`).join('');
  }

  const sections = Object.entries(plan.sections).map(([name, entries]) => `
    <section>
      <h2>${html(name)} <span>${entries.length}</span></h2>
      <table>
        <thead>
          <tr><th>BM</th><th>Path</th><th>Old label</th><th>Suggested label</th><th>Issues</th><th>Reason</th></tr>
        </thead>
        <tbody>${rows(entries)}</tbody>
      </table>
    </section>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Safe Label Only Batch 1</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #18202a; background: #f7f8fa; }
    header, section { background: #fff; border: 1px solid #d9dee7; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    h1, h2 { margin: 0 0 12px; }
    h2 span { color: #5d6675; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .metric { border: 1px solid #d9dee7; border-radius: 6px; padding: 12px; background: #fbfcfd; }
    .metric strong { display: block; font-size: 20px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #e7ebf1; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f1f4f8; }
    code { white-space: nowrap; }
    .muted { color: #697386; }
  </style>
</head>
<body>
  <header>
    <h1>Safe Label Only Batch 1</h1>
    <p>Generated: ${html(plan.generatedAt)}</p>
    <p>Approval: ${plan.approvalCommand ? `<code>${html(plan.approvalCommand)}</code>` : '<span class="muted">none</span>'}</p>
    <div class="grid">
      <div class="metric">AUTO_SAFE_APPROVABLE<strong>${plan.summary.autoSafeFieldCount}</strong></div>
      <div class="metric">REVIEW_NEEDED<strong>${plan.summary.reviewNeededFieldCount}</strong></div>
      <div class="metric">BLOCKED<strong>${plan.summary.blockedFieldCount}</strong></div>
      <div class="metric">EXCLUDED_KEEP_DEFERRED<strong>${plan.summary.excludedKeepDeferredFieldCount}</strong></div>
      <div class="metric">BAD_LABEL delta<strong>${plan.expectedDeltaIfAutoSafeOnlyApproved.BAD_LABEL}</strong></div>
      <div class="metric">UI_VISIBLE delta<strong>${plan.expectedDeltaIfAutoSafeOnlyApproved.UI_VISIBLE_BAD_METADATA}</strong></div>
    </div>
  </header>
  ${sections}
</body>
</html>`;
}

function writeSafeLabelBatchPlan(plan) {
  writeJson(path.join(BATCH_DIR, 'plan.latest.json'), plan);
  writeText(path.join(BATCH_DIR, 'plan.latest.md'), makeBatchPlanMd(plan));
  writeText(path.join(BATCH_DIR, 'review-dashboard', 'index.html'), makeDashboardHtml(plan));
}

function main() {
  const report = readJson(REPORT_PATH);
  const byTemplate = Array.isArray(report.byTemplate)
    ? report.byTemplate
    : Object.values(report.byTemplate || {});

  const bmMetrics = byTemplate.map(entry => {
    const allIssues = entry.allIssues || [];
    const badLabel = allIssues.filter(i => i.issueCode === 'BAD_LABEL').length;
    const uiVisible = allIssues.filter(i => i.issueCode === 'UI_VISIBLE_BAD_METADATA').length;
    return {
      templateCode: entry.templateCode,
      sourceId: allIssues[0]?.sourceId || null,
      title: entry.title,
      fieldCount: entry.fieldCount,
      issueCount: entry.issueCount,
      badLabel,
      uiVisible,
      score: badLabel + uiVisible,
      status: badLabel > 0 || uiVisible > 0 ? 'READY_FOR_RENDER_REVIEW' : 'OK',
    };
  }).filter(b => b.templateCode);

  bmMetrics.sort((a, b) => b.score - a.score || a.templateCode.localeCompare(b.templateCode));

  const baseline = {
    schemaVersion: '1.1',
    task: 'PER_FORM_RENDER_ACCURATE_BASELINE_REFRESH',
    generatedAt: new Date().toISOString(),
    closureContext: {
      previousLane: 'per-form-render-accurate',
      previousClosed: CLOSED_BMS,
      previousDeltas: {
        BM002: { BAD_LABEL: -10, UI_VISIBLE_BAD_METADATA: -9 },
        BM001: { BAD_LABEL: -5, UI_VISIBLE_BAD_METADATA: -5 },
      },
    },
    globalMetrics: {
      totalContracts: report.totalContracts,
      totalFields: report.totalFields,
      totalIssues: report.totalIssues,
      failCount: report.failCount,
      reviewCount: report.reviewCount,
      BAD_LABEL: report.issueCounts?.BAD_LABEL ?? 0,
      UI_VISIBLE_BAD_METADATA: report.issueCounts?.UI_VISIBLE_BAD_METADATA ?? 0,
      REMEDIATED: {
        BAD_LABEL_REMOVED_BY_CLOSED: 15,
        UI_VISIBLE_REMOVED_BY_CLOSED: 14,
      },
    },
    bmMetrics,
    summary: {
      totalBms: bmMetrics.length,
      readyForRenderReview: bmMetrics.filter(b => b.status === 'READY_FOR_RENDER_REVIEW').length,
      ok: bmMetrics.filter(b => b.status === 'OK').length,
      topBadLabel: bmMetrics.filter(b => b.badLabel > 0).length,
      topUiVisible: bmMetrics.filter(b => b.uiVisible > 0).length,
    },
  };

  writeJson(path.join(OUT_BASE, 'baseline', 'current.latest.json'), baseline);

  const baselineMd = [
    '# Per-Form Render Accurate - Current Baseline',
    '',
    `Generated: ${baseline.generatedAt}`,
    `Lane: per-form-render-accurate | Closed: ${CLOSED_BMS.join(', ')}`,
    '',
    '## Global Metrics',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Total contracts | ${report.totalContracts} |`,
    `| Total fields | ${report.totalFields} |`,
    `| Total issues | ${report.totalIssues} |`,
    `| FAIL | ${report.failCount} |`,
    `| REVIEW | ${report.reviewCount} |`,
    `| BAD_LABEL | ${report.issueCounts?.BAD_LABEL ?? 0} |`,
    `| UI_VISIBLE_BAD_METADATA | ${report.issueCounts?.UI_VISIBLE_BAD_METADATA ?? 0} |`,
    '',
    '## Remediated by Closed BMs',
    '',
    '| BM | BAD_LABEL delta | UI_VISIBLE delta |',
    '|----|-----------------|------------------|',
    '| BM-002 | -10 | -9 |',
    '| BM-001 | -5 | -5 |',
    '| Total | -15 | -14 |',
    '',
    '## Summary',
    '',
    '| Status | Count |',
    '|--------|-------|',
    `| READY_FOR_RENDER_REVIEW | ${baseline.summary.readyForRenderReview} |`,
    `| OK | ${baseline.summary.ok} |`,
    '',
    '_Baseline auto-generated._',
  ].join('\n');

  writeText(path.join(OUT_BASE, 'baseline', 'current.latest.md'), baselineMd);

  const queue = {
    schemaVersion: '1.1',
    task: 'PER_FORM_RENDER_ACCURATE_PRIORITY_QUEUE',
    generatedAt: baseline.generatedAt,
    queue: bmMetrics,
  };
  writeJson(path.join(OUT_BASE, 'priority-queue', 'full-queue.json'), queue);
  writeJson(path.join(OUT_BASE, 'priority-queue', 'latest.json'), queue);

  const top10 = bmMetrics.slice(0, 10);
  const queueMd = [
    '# Per-Form Render Accurate - Priority Queue',
    '',
    `Generated: ${baseline.generatedAt}`,
    '',
    '## Top 10 Candidates',
    '',
    '| Rank | BM | Title | BAD_LABEL | UI_VISIBLE | Score | Status |',
    '|------|----|-------|-----------|------------|-------|--------|',
    ...top10.map((b, i) =>
      `| ${i + 1} | ${b.templateCode} | ${md(b.title)} | ${b.badLabel} | ${b.uiVisible} | ${b.score} | ${b.status} |`,
    ),
    '',
    '_Auto-generated._',
  ].join('\n');
  writeText(path.join(OUT_BASE, 'priority-queue', 'full-queue.md'), queueMd);
  writeText(path.join(OUT_BASE, 'priority-queue', 'latest.md'), queueMd);

  const lockedContracts = loadLockedContracts();
  const deferredTracking = loadDeferredTracking();
  const batchPlan = buildSafeLabelBatchPlan(report, lockedContracts, deferredTracking);
  writeSafeLabelBatchPlan(batchPlan);

  console.log('Baseline, queue, and field-level safe-label Batch 1 plan written.');
  console.log('Top 10 candidates:');
  top10.forEach((b, i) =>
    console.log(`  ${i + 1}. ${b.templateCode}: BAD_LABEL=${b.badLabel}, UI_VISIBLE=${b.uiVisible}, score=${b.score}`),
  );
  console.log('Batch 1 summary:');
  console.log(`  AUTO_SAFE_APPROVABLE=${batchPlan.summary.autoSafeFieldCount}`);
  console.log(`  REVIEW_NEEDED=${batchPlan.summary.reviewNeededFieldCount}`);
  console.log(`  BLOCKED=${batchPlan.summary.blockedFieldCount}`);
  console.log(`  EXCLUDED_KEEP_DEFERRED=${batchPlan.summary.excludedKeepDeferredFieldCount}`);
  console.log(`  approvalCommand=${batchPlan.approvalCommand ?? 'NONE'}`);
}

main();
