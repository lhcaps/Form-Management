#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTRACT_DIR = path.join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const ROOT_CAUSE_JSON = path.join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json');
const FIX_PLAN_JSON = path.join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'latest.json');
const SAFE_LABEL_PLAN_JSON = path.join(
  ROOT,
  'docs',
  'audit',
  'per-form-render-accurate',
  'batches',
  'safe-label-only-batch-1',
  'plan.latest.json',
);
const RUNTIME_JSON = path.join(ROOT, 'docs', 'audit', 'runtime-contract-stack', 'latest.json');
const CLOSURE_JSON = path.join(
  ROOT,
  'docs',
  'audit',
  'docx-path-binding-combined-destructive-closure',
  'closure.latest.json',
);
const OUT_DIR = path.join(ROOT, 'docs', 'audit', '213-bm-remediation-master-plan');
const OUT_JSON = path.join(OUT_DIR, 'latest.json');
const OUT_MD = path.join(OUT_DIR, 'latest.md');
const OUT_CSV = path.join(OUT_DIR, 'per-bm.csv');

const ISSUE_ORDER = [
  'BAD_LABEL',
  'UI_VISIBLE_BAD_METADATA',
  'GENERIC_FIELD_CANONICALIZATION',
  'RAW_PATTERN_DOMAIN_MISMATCH',
  'SOURCE_MISMATCH',
  'SHOULD_BE_READONLY',
  'REQUIRED_SUSPICIOUS',
  'COMPILED_DRIFT',
  'REMEDIATION_LEAK',
  'WEAK_EVIDENCE_AUTO_LOCKED',
];

const LANE_DEFINITIONS = {
  VERIFY_ONLY: 'No current root-cause issues; keep under compile, DB, and render gates.',
  SAFE_LABEL_ONLY_REVIEW: 'Label-only lane after field-level approval. Current Batch 1 has zero auto-safe fields.',
  PATH_DOMAIN_BINDING: 'Fix canonical path/domain/source mismatches against the actual DOCX raw pattern and visible context.',
  SOURCE_POLICY: 'Resolve readonly, required, system/computed/manual source policy and compiled source-kind drift.',
  REMEDIATION_LEAK: 'Remove placeholder labels/fields introduced by prior remediation waves, with DOCX evidence.',
  EVIDENCE_REVIEW: 'Strengthen weak auto-locked evidence before mutating contracts.',
  DOCX_AUTHORING: 'DOCX/source authoring ambiguity must be resolved before contract mutation.',
  LEGAL_REVIEW: 'Legal/procedural content needs reviewer approval and dated decision evidence.',
  KEEP_DEFERRED_REVIEW: 'Previously deferred path/header/body issue; do not include in fast label-only batches.',
  RUNTIME_DB_SYNC: 'Publish and verify DB contract versions after file-level contract/compiled artifacts are clean.',
};

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
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

function csv(value) {
  const text = String(value ?? '');
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function loadContracts() {
  return fs.readdirSync(CONTRACT_DIR)
    .filter(file => file.endsWith('.contract.locked.json'))
    .map(file => {
      const contract = readJson(path.join(CONTRACT_DIR, file));
      return {
        file,
        templateCode: contract.templateCode,
        sourceId: contract.sourceId,
        title: contract.templateTitle || contract.docx?.title || contract.templateCode,
        status: contract.status,
        reviewKind: contract.reviewKind,
        canonicalFieldCount: Array.isArray(contract.canonicalFields) ? contract.canonicalFields.length : 0,
        docxSlotCount: Array.isArray(contract.docxSlots) ? contract.docxSlots.length : 0,
        renderBindingCount: Array.isArray(contract.renderBindings) ? contract.renderBindings.length : 0,
      };
    })
    .sort((a, b) => a.templateCode.localeCompare(b.templateCode));
}

function loadDeferredTracking() {
  const closure = readJson(CLOSURE_JSON, {});
  const items = Array.isArray(closure.deferredTracking?.items) ? closure.deferredTracking.items : [];
  return {
    items,
    bmSet: new Set(items.map(item => item.templateCode).filter(Boolean)),
    byBm: items.reduce((acc, item) => {
      if (!item.templateCode) return acc;
      if (!acc[item.templateCode]) acc[item.templateCode] = [];
      acc[item.templateCode].push(item);
      return acc;
    }, {}),
  };
}

function buildSafeLabelByBm(safeLabelPlan) {
  const byBm = {};
  for (const [section, entries] of Object.entries(safeLabelPlan?.sections ?? {})) {
    for (const entry of entries) {
      if (!byBm[entry.bm]) {
        byBm[entry.bm] = {
          autoSafe: 0,
          reviewNeeded: 0,
          blocked: 0,
          excludedClosed: 0,
          excludedKeepDeferred: 0,
        };
      }
      if (section === 'AUTO_SAFE_APPROVABLE') byBm[entry.bm].autoSafe += 1;
      if (section === 'REVIEW_NEEDED') byBm[entry.bm].reviewNeeded += 1;
      if (section === 'BLOCKED') byBm[entry.bm].blocked += 1;
      if (section === 'EXCLUDED_CLOSED') byBm[entry.bm].excludedClosed += 1;
      if (section === 'EXCLUDED_KEEP_DEFERRED') byBm[entry.bm].excludedKeepDeferred += 1;
    }
  }
  return byBm;
}

function primaryLane(issueCounts, fixCounts, safeCounts, isKeepDeferred) {
  if (isKeepDeferred) return 'KEEP_DEFERRED_REVIEW';
  if ((issueCounts.REMEDIATION_LEAK ?? 0) > 0) return 'REMEDIATION_LEAK';
  if ((fixCounts.BLOCKED_BY_DOCX_AUTHORING ?? 0) > 0) return 'DOCX_AUTHORING';
  if (
    (issueCounts.RAW_PATTERN_DOMAIN_MISMATCH ?? 0) > 0 ||
    (issueCounts.SOURCE_MISMATCH ?? 0) > 0 ||
    (issueCounts.GENERIC_FIELD_CANONICALIZATION ?? 0) > 0
  ) {
    return 'PATH_DOMAIN_BINDING';
  }
  if (
    (issueCounts.SHOULD_BE_READONLY ?? 0) > 0 ||
    (issueCounts.REQUIRED_SUSPICIOUS ?? 0) > 0 ||
    (issueCounts.COMPILED_DRIFT ?? 0) > 0
  ) {
    return 'SOURCE_POLICY';
  }
  if ((fixCounts.MANUAL_LEGAL_REVIEW ?? 0) > 0) return 'LEGAL_REVIEW';
  if ((issueCounts.WEAK_EVIDENCE_AUTO_LOCKED ?? 0) > 0) return 'EVIDENCE_REVIEW';
  if ((safeCounts.autoSafe ?? 0) > 0) return 'SAFE_LABEL_ONLY_REVIEW';
  if ((issueCounts.BAD_LABEL ?? 0) > 0 || (issueCounts.UI_VISIBLE_BAD_METADATA ?? 0) > 0) {
    return 'SAFE_LABEL_ONLY_REVIEW';
  }
  return 'VERIFY_ONLY';
}

function allLanes(issueCounts, fixCounts, safeCounts, isKeepDeferred) {
  const lanes = new Set();
  if (isKeepDeferred) lanes.add('KEEP_DEFERRED_REVIEW');
  if ((safeCounts.autoSafe ?? 0) > 0) lanes.add('SAFE_LABEL_ONLY_REVIEW');
  if (
    (issueCounts.RAW_PATTERN_DOMAIN_MISMATCH ?? 0) > 0 ||
    (issueCounts.SOURCE_MISMATCH ?? 0) > 0 ||
    (issueCounts.GENERIC_FIELD_CANONICALIZATION ?? 0) > 0
  ) lanes.add('PATH_DOMAIN_BINDING');
  if (
    (issueCounts.SHOULD_BE_READONLY ?? 0) > 0 ||
    (issueCounts.REQUIRED_SUSPICIOUS ?? 0) > 0 ||
    (issueCounts.COMPILED_DRIFT ?? 0) > 0
  ) lanes.add('SOURCE_POLICY');
  if ((issueCounts.REMEDIATION_LEAK ?? 0) > 0) lanes.add('REMEDIATION_LEAK');
  if ((issueCounts.WEAK_EVIDENCE_AUTO_LOCKED ?? 0) > 0) lanes.add('EVIDENCE_REVIEW');
  if ((fixCounts.BLOCKED_BY_DOCX_AUTHORING ?? 0) > 0) lanes.add('DOCX_AUTHORING');
  if ((fixCounts.MANUAL_LEGAL_REVIEW ?? 0) > 0) lanes.add('LEGAL_REVIEW');
  if (lanes.size === 0) lanes.add('VERIFY_ONLY');
  return [...lanes];
}

function nextAction(lane, issueCounts) {
  switch (lane) {
    case 'KEEP_DEFERRED_REVIEW':
      return 'Resolve deferred header/body/path finding first; do not run fast label-only approval.';
    case 'REMEDIATION_LEAK':
      return 'Inspect remediation placeholder fields against source DOCX and close leak with reviewed decision pack.';
    case 'DOCX_AUTHORING':
      return 'Return to normalized/source DOCX evidence; reauthor or remap before contract mutation.';
    case 'PATH_DOMAIN_BINDING':
      return 'Compare rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value per field.';
    case 'SOURCE_POLICY':
      return 'Decide source kind and readonly/required policy; recompile and verify source-kind parity.';
    case 'LEGAL_REVIEW':
      return 'Prepare reviewer packet with legal/procedural context and dated approval before mutation.';
    case 'EVIDENCE_REVIEW':
      return 'Strengthen evidence for auto-locked fields or downgrade to manual review.';
    case 'SAFE_LABEL_ONLY_REVIEW':
      return (issueCounts.BAD_LABEL ?? 0) > 0
        ? 'Regenerate safe-label plan after blockers are cleared; apply only field-level approved labels.'
        : 'No immediate label action.';
    case 'VERIFY_ONLY':
      return 'Keep in verification-only track: contract validate, compile sync, DB sync, and render smoke.';
    default:
      return 'Review current audit evidence.';
  }
}

function risk(issueCount, lane, fixCounts) {
  if (lane === 'KEEP_DEFERRED_REVIEW' || lane === 'DOCX_AUTHORING') return 'HIGH';
  if ((fixCounts.MANUAL_LEGAL_REVIEW ?? 0) > 0) return 'HIGH';
  if (issueCount >= 20) return 'HIGH';
  if (issueCount > 0) return 'MEDIUM';
  return 'LOW';
}

function buildPerBmRows(contracts, rootCause, fixPlan, safeLabelPlan, deferred) {
  const rootByTemplate = new Map((rootCause.byTemplate ?? []).map(entry => [entry.templateCode, entry]));
  const allIssuesByTemplate = {};
  for (const issue of rootCause.issues ?? []) {
    if (!allIssuesByTemplate[issue.templateCode]) allIssuesByTemplate[issue.templateCode] = [];
    allIssuesByTemplate[issue.templateCode].push(issue);
  }
  const fixByTemplate = new Map((fixPlan.byTemplate ?? []).map(entry => [entry.templateCode, entry]));
  const safeByBm = buildSafeLabelByBm(safeLabelPlan);

  return contracts.map(contract => {
    const rootEntry = rootByTemplate.get(contract.templateCode);
    const issues = allIssuesByTemplate[contract.templateCode] ?? [];
    const issueCounts = countBy(issues, issue => issue.issueCode);
    const fixCounts = fixByTemplate.get(contract.templateCode)?.classificationCounts ?? {};
    const safeCounts = safeByBm[contract.templateCode] ?? {
      autoSafe: 0,
      reviewNeeded: 0,
      blocked: 0,
      excludedClosed: 0,
      excludedKeepDeferred: 0,
    };
    const isKeepDeferred = deferred.bmSet.has(contract.templateCode);
    const lane = primaryLane(issueCounts, fixCounts, safeCounts, isKeepDeferred);
    const lanes = allLanes(issueCounts, fixCounts, safeCounts, isKeepDeferred);

    return {
      templateCode: contract.templateCode,
      sourceId: contract.sourceId,
      title: contract.title,
      contractStatus: contract.status,
      reviewKind: contract.reviewKind,
      counts: {
        canonicalFields: contract.canonicalFieldCount,
        docxSlots: contract.docxSlotCount,
        renderBindings: contract.renderBindingCount,
      },
      issueCount: rootEntry?.issueCount ?? issues.length,
      failCount: rootEntry?.failCount ?? issues.filter(issue => issue.severity === 'FAIL').length,
      reviewCount: rootEntry?.reviewCount ?? issues.filter(issue => issue.severity === 'REVIEW').length,
      issueCounts,
      fixPlanClassificationCounts: fixCounts,
      safeLabelBatchCounts: safeCounts,
      keepDeferred: isKeepDeferred,
      deferredItems: deferred.byBm[contract.templateCode] ?? [],
      primaryLane: lane,
      lanes,
      risk: risk(rootEntry?.issueCount ?? issues.length, lane, fixCounts),
      nextAction: nextAction(lane, issueCounts),
    };
  });
}

function buildGlobalLaneCounts(rows) {
  const counts = {};
  for (const row of rows) {
    counts[row.primaryLane] = (counts[row.primaryLane] ?? 0) + 1;
  }
  return counts;
}

function topByIssue(rows, limit = 25) {
  return [...rows]
    .filter(row => row.issueCount > 0)
    .sort((a, b) => b.issueCount - a.issueCount || a.templateCode.localeCompare(b.templateCode))
    .slice(0, limit)
    .map(row => ({
      templateCode: row.templateCode,
      issueCount: row.issueCount,
      primaryLane: row.primaryLane,
      risk: row.risk,
      issueCounts: row.issueCounts,
    }));
}

function buildMarkdown(report) {
  const lines = [
    '# 213 BM Remediation Master Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Executive Decision',
    '',
    '- The old safe-label Batch 1 is superseded.',
    '- The current field-level safe-label Batch 1 has no auto-approvable fields.',
    '- Remaining BM work must proceed by lane: path/domain, source policy, remediation leak, DOCX evidence, legal review, then DB/runtime sync.',
    '',
    '## Global Snapshot',
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Contracts | ${report.global.totalContracts} |`,
    `| Fields | ${report.global.totalFields} |`,
    `| Total issues | ${report.global.totalIssues} |`,
    `| FAIL | ${report.global.failCount} |`,
    `| REVIEW | ${report.global.reviewCount} |`,
    `| Safe-label AUTO_SAFE_APPROVABLE fields | ${report.safeLabel.summary.autoSafeFieldCount} |`,
    `| Safe-label approval command | ${report.safeLabel.approvalCommand ?? 'none'} |`,
    '',
    '## Issue Counts',
    '',
    '| Issue | Count |',
    '|-------|-------|',
  ];

  for (const code of ISSUE_ORDER) {
    lines.push(`| ${code} | ${report.global.issueCounts[code] ?? 0} |`);
  }

  lines.push('', '## Primary Lane Counts', '', '| Lane | BMs |', '|------|-----|');
  for (const [lane, count] of Object.entries(report.primaryLaneCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${lane} | ${count} |`);
  }

  lines.push('', '## Runtime/Docker/SQL Evidence', '', '| Check | Current evidence |', '|-------|------------------|');
  lines.push(`| Docker daemon | ${report.runtime.summary?.dockerDaemonAvailable ? 'reachable' : 'not reachable'} |`);
  lines.push(`| Dev compose config | ${report.runtime.summary?.devComposeConfigOk ? 'valid' : 'not valid or not probed'} |`);
  lines.push(`| Prod compose config | ${report.runtime.summary?.prodComposeConfigOk ? 'valid' : 'not valid or not probed'} |`);
  lines.push(`| DB TCP | ${report.runtime.summary?.databaseTcpOpen ? 'open' : 'closed/unreachable'} |`);
  lines.push(`| Prisma migrate status | ${report.runtime.summary?.prismaMigrateStatusOk ? 'pass' : 'fail/unverified'} |`);
  lines.push(`| Contract sync | ${md(report.runtime.summary?.contractSyncReason ?? 'not probed')} |`);
  lines.push(`| Publish forms DB plan | ${report.runtime.summary?.publishPlanOk ? 'pass' : 'fail/unverified'}: ${md(report.runtime.summary?.publishPlanReason ?? 'not probed')} |`);

  lines.push('', '## Root Cause Findings', '');
  for (const finding of report.rootCauseFindings) {
    lines.push(`- ${finding}`);
  }

  lines.push('', '## Execution Order', '');
  report.executionOrder.forEach((step, index) => {
    lines.push(`${index + 1}. ${step}`);
  });

  lines.push('', '## Top Issue BMs', '', '| Rank | BM | Issues | Lane | Risk | Key counts |', '|------|----|--------|------|------|------------|');
  report.priorityQueues.topIssueBms.forEach((row, index) => {
    lines.push(`| ${index + 1} | ${row.templateCode} | ${row.issueCount} | ${row.primaryLane} | ${row.risk} | ${md(formatIssueCounts(row.issueCounts))} |`);
  });

  lines.push('', '## Per-BM Ledger', '', '| BM | Issues | Primary lane | Risk | BAD_LABEL | PATH | SOURCE | READONLY | WEAK | REMEDIATION | Next action |', '|----|--------|--------------|------|-----------|------|--------|----------|------|-------------|-------------|');
  for (const row of report.bms) {
    lines.push([
      row.templateCode,
      row.issueCount,
      row.primaryLane,
      row.risk,
      row.issueCounts.BAD_LABEL ?? 0,
      row.issueCounts.RAW_PATTERN_DOMAIN_MISMATCH ?? 0,
      row.issueCounts.SOURCE_MISMATCH ?? 0,
      row.issueCounts.SHOULD_BE_READONLY ?? 0,
      row.issueCounts.WEAK_EVIDENCE_AUTO_LOCKED ?? 0,
      row.issueCounts.REMEDIATION_LEAK ?? 0,
      md(row.nextAction),
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }

  lines.push('', '## Completion Gate For Each BM', '');
  for (const gate of report.completionGate) {
    lines.push(`- ${gate}`);
  }

  return lines.join('\n');
}

function formatIssueCounts(counts) {
  return ISSUE_ORDER
    .filter(code => (counts[code] ?? 0) > 0)
    .map(code => `${code}=${counts[code]}`)
    .join(', ');
}

function buildCsv(rows) {
  const header = [
    'templateCode',
    'sourceId',
    'title',
    'issueCount',
    'failCount',
    'reviewCount',
    'primaryLane',
    'risk',
    'keepDeferred',
    ...ISSUE_ORDER,
    'nextAction',
  ];
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push([
      row.templateCode,
      row.sourceId,
      row.title,
      row.issueCount,
      row.failCount,
      row.reviewCount,
      row.primaryLane,
      row.risk,
      row.keepDeferred,
      ...ISSUE_ORDER.map(code => row.issueCounts[code] ?? 0),
      row.nextAction,
    ].map(csv).join(','));
  }
  return lines.join('\n');
}

function main() {
  const rootCause = readJson(ROOT_CAUSE_JSON);
  const fixPlan = readJson(FIX_PLAN_JSON, { byTemplate: [], classificationCounts: {} });
  const safeLabelPlan = readJson(SAFE_LABEL_PLAN_JSON, { summary: {}, sections: {} });
  const runtime = readJson(RUNTIME_JSON, {
    summary: {
      dockerDaemonAvailable: false,
      devComposeConfigOk: false,
      prodComposeConfigOk: false,
      databaseTcpOpen: false,
      prismaMigrateStatusOk: false,
      contractSyncReason: 'runtime probe not generated',
    },
  });
  const contracts = loadContracts();
  const deferred = loadDeferredTracking();
  const bms = buildPerBmRows(contracts, rootCause, fixPlan, safeLabelPlan, deferred);
  const runtimeSummary = runtime.summary ?? {};
  const contractSync = runtime.parsed?.contractSync ?? {};
  const contractSyncStrategy = contractSync.strategy ?? null;
  const runtimeDbFinding =
    contractSyncStrategy === 'DB_COMPARE' && (contractSync.stale ?? 0) === 0 && (contractSync.missingInDb ?? 0) === 0
      ? 'Runtime DB contract-sync was verified against form_contract_versions with no missing or stale records.'
      : contractSyncStrategy === 'DB_COMPARE'
        ? `Runtime DB contract-sync reached form_contract_versions but found drift: matched=${contractSync.matched ?? 'unknown'}, missing=${contractSync.missingInDb ?? 'unknown'}, stale=${contractSync.stale ?? 'unknown'}.`
      : `Docker/DB probes are ${runtimeSummary.dockerDaemonAvailable && runtimeSummary.databaseTcpOpen && runtimeSummary.prismaMigrateStatusOk ? 'reachable' : 'not fully reachable'}, but contract-sync is ${contractSyncStrategy ?? 'unknown'}; DB published compiled_json hashes are not yet proven.`;

  const report = {
    schemaVersion: '1.0',
    task: 'PLAN_213_BM_REMEDIATION_MASTER',
    generatedAt: new Date().toISOString(),
    sourceReports: {
      rootCause: path.relative(ROOT, ROOT_CAUSE_JSON),
      fixPlan: path.relative(ROOT, FIX_PLAN_JSON),
      safeLabelPlan: path.relative(ROOT, SAFE_LABEL_PLAN_JSON),
      runtimeProbe: fs.existsSync(RUNTIME_JSON) ? path.relative(ROOT, RUNTIME_JSON) : null,
      deferredClosure: fs.existsSync(CLOSURE_JSON) ? path.relative(ROOT, CLOSURE_JSON) : null,
    },
    global: {
      totalContracts: rootCause.totalContracts,
      totalFields: rootCause.totalFields,
      totalIssues: rootCause.totalIssues,
      failCount: rootCause.failCount,
      reviewCount: rootCause.reviewCount,
      issueCounts: rootCause.issueCounts,
      fixPlanClassificationCounts: fixPlan.classificationCounts,
    },
    safeLabel: {
      summary: safeLabelPlan.summary ?? {},
      checks: safeLabelPlan.checks ?? {},
      approvalCommand: safeLabelPlan.approvalCommand ?? null,
      expectedDeltaIfAutoSafeOnlyApproved: safeLabelPlan.expectedDeltaIfAutoSafeOnlyApproved ?? null,
    },
    runtime: {
      summary: runtime.summary ?? {},
      database: runtime.database ?? {},
      parsed: runtime.parsed ?? {},
    },
    laneDefinitions: LANE_DEFINITIONS,
    primaryLaneCounts: buildGlobalLaneCounts(bms),
    rootCauseFindings: [
      'The >3000-count symptom was a mixed report, not one label bug: label, path/domain, source policy, weak evidence, remediation, compiled drift, and runtime DB evidence were mixed together.',
      'Compiled artifacts were stale/noisy earlier; official contract compilation and enum normalization reduced COMPILED_DRIFT noise, leaving true source-policy drift.',
      'The V1 adapter previously allowed docxSlots labels to override canonical field labels in compiled/UI output; canonicalFields labels are now the UI source of truth.',
      'The old Batch 1 was BM-level and stale; the regenerated field-level safe-label plan has zero AUTO_SAFE fields because current label issues co-occur with blockers/review/deferred tracks.',
      runtimeDbFinding,
    ],
    executionOrder: [
      'Keep safe-label batch disabled until AUTO_SAFE_APPROVABLE is non-empty under field-level gates.',
      'Clear KEEP_DEFERRED and REMEDIATION_LEAK forms with DOCX evidence and reviewed decision packs.',
      'Process PATH_DOMAIN_BINDING forms by comparing rawPattern, canonical path, renderBinding, visible DOCX context, and rendered value.',
      'Process SOURCE_POLICY forms by deciding manual/case/agency/official/system/computed source kind and readonly/required semantics.',
      'Process WEAK_EVIDENCE and LEGAL_REVIEW forms with reviewer-led evidence packets.',
      'Regenerate contracts through official paths, then run contract validate, compile, compile-sync, root-cause audit, and safe-label plan refresh.',
      'After file artifacts are clean, start Docker/DB, run migrations, publish forms to DB, and run DB contract-sync.',
      'Run runtime smoke for Form Studio, documents, and DOCX rendering before marking any BM complete.',
    ],
    completionGate: [
      'Locked contract is reviewed and matches the source DOCX evidence for that BM.',
      'canonicalFields, docxSlots, renderBindings, and paths have no unresolved audit issues unless accepted in a dated review ledger.',
      'compiled-v2 is regenerated by pnpm contract:compile and passes pnpm audit:contract-compile:sync.',
      'Root-cause audit has zero FAIL for the BM, or remaining REVIEW items are explicitly accepted with reviewer/date/reason.',
      'DB form_contract_versions compiled_json hash matches file compiled artifact after publish.',
      'Runtime form UI and document render smoke pass for the BM.',
      'Renderer active mode remains explicit allow-list only; no wildcard cutover.',
    ],
    priorityQueues: {
      topIssueBms: topByIssue(bms),
      keepDeferredBms: bms.filter(row => row.keepDeferred).map(row => row.templateCode),
      highRiskBms: bms.filter(row => row.risk === 'HIGH').map(row => row.templateCode),
    },
    bms,
  };

  writeJson(OUT_JSON, report);
  writeText(OUT_MD, buildMarkdown(report));
  writeText(OUT_CSV, buildCsv(bms));

  console.log(`Written: ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Written: ${path.relative(ROOT, OUT_MD)}`);
  console.log(`Written: ${path.relative(ROOT, OUT_CSV)}`);
  console.log(`Contracts: ${report.global.totalContracts}`);
  console.log(`Issues: ${report.global.totalIssues}`);
  console.log(`AUTO_SAFE_APPROVABLE fields: ${report.safeLabel.summary.autoSafeFieldCount ?? 0}`);
  console.log(`Primary lanes: ${JSON.stringify(report.primaryLaneCounts)}`);
}

main();
