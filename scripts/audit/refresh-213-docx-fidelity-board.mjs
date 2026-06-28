#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';

const ROOT = process.cwd();
const LOCKED_DIR = join(ROOT, 'docs', 'audit', 'docx', 'contracts', 'locked');
const ROOT_CAUSE_JSON = join(
  ROOT,
  'docs',
  'audit',
  'forms-root-cause',
  'latest.json',
);
const BASELINE_CSV = join(
  ROOT,
  'docs',
  'audit',
  'form-authoring-baselines',
  'matrix.csv',
);
const RENDER_EVIDENCE_DIR = join(
  ROOT,
  'docs',
  'audit',
  'per-form-render-accurate',
);
const OUT_DIR = join(ROOT, 'docs', 'audit', '213-docx-fidelity-board');
const OUT_JSON = join(OUT_DIR, 'latest.json');
const OUT_MD = join(OUT_DIR, 'latest.md');
const OUT_CSV = join(OUT_DIR, 'per-bm.csv');
const CONTRACT_REPAIR_BATCH_JSON = join(
  OUT_DIR,
  'contract-repair-batch-1.latest.json',
);
const CONTRACT_REPAIR_BATCH_MD = join(
  OUT_DIR,
  'contract-repair-batch-1.latest.md',
);

const LANES = [
  'CONTRACT_REPAIR',
  'PATH_DOMAIN_BINDING',
  'SOURCE_POLICY',
  'REMEDIATION_LEAK',
  'WEAK_EVIDENCE_REVIEW',
  'RENDER_FIDELITY',
  'LEGAL_REVIEW',
  'VERIFY_ONLY',
];

const CONTRACT_REPAIR_FINDINGS = new Set([
  'TEMPLATE_PLACEHOLDER_WITHOUT_SLOT',
  'CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER',
  'BINDING_WITHOUT_TEMPLATE_PLACEHOLDER',
  'REVIEW_REQUIRED_REMAINS',
  'LEGACY_RENDERER_MANIFEST_STALE',
  'UNKNOWN_FIELD_SOURCE',
]);

const STRUCTURAL_CONTRACT_REPAIR_FINDINGS = new Set([
  'TEMPLATE_PLACEHOLDER_WITHOUT_SLOT',
  'CONTRACT_SLOT_WITHOUT_TEMPLATE_PLACEHOLDER',
  'BINDING_WITHOUT_TEMPLATE_PLACEHOLDER',
  'LEGACY_RENDERER_MANIFEST_STALE',
]);

const PATH_DOMAIN_ISSUES = [
  'RAW_PATTERN_DOMAIN_MISMATCH',
  'SOURCE_MISMATCH',
  'GENERIC_FIELD_CANONICALIZATION',
  'BAD_LABEL',
  'UI_VISIBLE_BAD_METADATA',
];

const SOURCE_POLICY_ISSUES = [
  'SHOULD_BE_READONLY',
  'REQUIRED_SUSPICIOUS',
  'COMPILED_DRIFT',
];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function codeNumber(code) {
  return Number(/^BM-(\d{3})$/.exec(code)?.[1] ?? 0);
}

function compareCode(a, b) {
  return codeNumber(a).valueOf() - codeNumber(b).valueOf();
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i += 1;
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += ch;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((candidate) =>
    candidate.some((cell) => cell.trim().length > 0),
  );
  if (!header) return [];

  return body.map((cells) =>
    Object.fromEntries(header.map((name, index) => [name, cells[index] ?? ''])),
  );
}

function splitFindings(value) {
  return String(value ?? '')
    .split(/\s*[,;|]\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
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

function sumIssueCounts(counts, names) {
  return names.reduce((sum, name) => sum + (counts[name] ?? 0), 0);
}

function loadLockedContracts() {
  if (!existsSync(LOCKED_DIR)) {
    throw new Error(`Missing locked contracts directory: ${LOCKED_DIR}`);
  }

  return readdirSync(LOCKED_DIR)
    .filter((file) => file.endsWith('.contract.locked.json'))
    .map((file) => {
      const fullPath = join(LOCKED_DIR, file);
      const contract = readJson(fullPath);
      const templateCode =
        contract.templateCode ?? basename(file).match(/^(BM-\d{3})/)?.[1];

      return {
        templateCode,
        title:
          contract.templateTitle ??
          contract.docx?.title ??
          contract.title ??
          templateCode,
        sourceId: contract.sourceId ?? basename(file, '.json'),
        file: fullPath,
        status: contract.status ?? null,
        reviewKind: contract.reviewKind ?? null,
        fieldCount: Array.isArray(contract.canonicalFields)
          ? contract.canonicalFields.length
          : 0,
        slotCount: Array.isArray(contract.docxSlots)
          ? contract.docxSlots.length
          : 0,
        bindingCount: Array.isArray(contract.renderBindings)
          ? contract.renderBindings.length
          : 0,
      };
    })
    .filter((contract) => /^BM-\d{3}$/.test(contract.templateCode))
    .sort((a, b) => compareCode(a.templateCode, b.templateCode));
}

function loadBaselineRows() {
  if (!existsSync(BASELINE_CSV)) {
    throw new Error(`Missing baseline matrix: ${BASELINE_CSV}`);
  }

  const rows = parseCsv(readFileSync(BASELINE_CSV, 'utf8'));
  return new Map(
    rows.map((row) => [
      row.BM,
      {
        docx: row.DOCX,
        baseGrade: row['Base grade'],
        qualityState: row['Quality state'],
        fields: Number(row.Fields || 0),
        bindings: Number(row.Bindings || 0),
        unknown: Number(row.Unknown || 0),
        reviewRequired: Number(row['Review required'] || 0),
        rendererKind: row['Bespoke/Generic'],
        agencyStatus: row['Agency status'],
        runtimeSource: row['Runtime source'],
        sourceId: row['Source ID'],
        alternateSources: row['Alternate sources'],
        warnings: splitFindings(row.Warnings),
        findings: splitFindings(row.Issues),
      },
    ]),
  );
}

function loadRootCause() {
  if (!existsSync(ROOT_CAUSE_JSON)) {
    throw new Error(`Missing root-cause audit: ${ROOT_CAUSE_JSON}`);
  }

  const rootCause = readJson(ROOT_CAUSE_JSON);
  const byTemplate = new Map(
    (rootCause.byTemplate ?? []).map((entry) => [entry.templateCode, entry]),
  );
  const issueGroups = new Map();

  for (const issue of rootCause.issues ?? []) {
    if (!issueGroups.has(issue.templateCode)) {
      issueGroups.set(issue.templateCode, []);
    }
    issueGroups.get(issue.templateCode).push(issue);
  }

  return { rootCause, byTemplate, issueGroups };
}

function inspectRenderEvidence(templateCode) {
  const filePath = join(
    RENDER_EVIDENCE_DIR,
    templateCode,
    'render-diff.latest.json',
  );

  if (!existsSync(filePath)) {
    return { available: false, clean: false, status: 'MISSING', file: null };
  }

  try {
    const data = readJson(filePath);
    const status =
      data.status ??
      data.verdict ??
      data.summary?.status ??
      data.renderAuditResult ??
      (data.ok === true || data.pass === true ? 'PASS' : 'UNKNOWN');
    const clean = ['PASS', 'PASSED', 'OK', 'CLEAN'].includes(
      String(status).toUpperCase(),
    );

    return { available: true, clean, status: String(status), file: filePath };
  } catch (error) {
    return {
      available: true,
      clean: false,
      status: `PARSE_ERROR: ${error.message}`,
      file: filePath,
    };
  }
}

function hasContractRepair(baseline) {
  if (!baseline) return true;
  if (baseline.qualityState === 'CONTRACT_REPAIR_REQUIRED') return true;
  return baseline.findings.some((finding) =>
    CONTRACT_REPAIR_FINDINGS.has(finding),
  );
}

function primaryLane({ baseline, issueCounts, renderEvidence }) {
  if (hasContractRepair(baseline)) return 'CONTRACT_REPAIR';
  if ((issueCounts.REMEDIATION_LEAK ?? 0) > 0) return 'REMEDIATION_LEAK';
  if (sumIssueCounts(issueCounts, PATH_DOMAIN_ISSUES) > 0) {
    return 'PATH_DOMAIN_BINDING';
  }
  if (sumIssueCounts(issueCounts, SOURCE_POLICY_ISSUES) > 0) {
    return 'SOURCE_POLICY';
  }
  if ((issueCounts.WEAK_EVIDENCE_AUTO_LOCKED ?? 0) > 0) {
    return 'WEAK_EVIDENCE_REVIEW';
  }
  if (!renderEvidence.clean) return 'RENDER_FIDELITY';
  return 'VERIFY_ONLY';
}

function riskLevel(row) {
  if (row.primaryLane === 'CONTRACT_REPAIR') return 'HIGH';
  if (row.primaryLane === 'LEGAL_REVIEW') return 'HIGH';
  if (row.rootCause.issueCount >= 20) return 'HIGH';
  if (row.rootCause.failCount > 0) return 'MEDIUM';
  if (row.rootCause.reviewCount > 0) return 'MEDIUM';
  if (row.primaryLane === 'RENDER_FIDELITY') return 'MEDIUM';
  return 'LOW';
}

function nextAction(row) {
  switch (row.primaryLane) {
    case 'CONTRACT_REPAIR':
      return 'Repair same-BM DOCX placeholder, slot, binding, and reviewRequired mismatches before semantic field work.';
    case 'REMEDIATION_LEAK':
      return 'Build an evidence-only packet for remediation leak fields, then apply only same-BM reviewed decisions.';
    case 'PATH_DOMAIN_BINDING':
      return 'Compare rawPattern, canonical path, slot id, binding source, and visible DOCX context for each failing field.';
    case 'SOURCE_POLICY':
      return 'Review source kind, readonly, required, and compiled drift policy before changing contract metadata.';
    case 'WEAK_EVIDENCE_REVIEW':
      return 'Strengthen direct DOCX evidence or downgrade weak auto-locked fields to manual review.';
    case 'RENDER_FIDELITY':
      return 'Generate or refresh render-diff evidence and verify DOCX text, layout, placeholders, and package integrity.';
    case 'LEGAL_REVIEW':
      return 'Prepare a dated legal/form-review packet before any mutation.';
    case 'VERIFY_ONLY':
      return 'Keep under final verification: validate, compile, render, publish, and DB sync.';
    default:
      return 'Review board data before selecting the next action.';
  }
}

function completionStatus(row) {
  // Preserve already-blocked LEGAL_REVIEW rows from being reset.
  if (row.completionStatus === 'BLOCKED_BY_HUMAN_DOCX_REVIEW') return row.completionStatus;
  if (row.primaryLane === 'VERIFY_ONLY') return 'READY_FOR_FINAL_REVIEW';
  if (row.primaryLane === 'RENDER_FIDELITY') return 'PENDING_RENDER_FIDELITY';
  return 'NEEDS_REMEDIATION';
}

function applyHumanReviewBlockerLedgers(rows) {
  // Read all human-review-blocker ledgers and patch board rows accordingly.
  // This prevents the board generator from overwriting valid blocker states.
  const LEDGER_GLOB = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization', 'BM-*', 'human-review-blocker.latest.json');
  const ledgers = [];

  const auditDir = join(ROOT, 'docs', 'audit', 'docx-placeholder-renormalization');
  if (existsSync(auditDir)) {
    for (const bmDir of readdirSync(auditDir)) {
      const ledgerPath = join(auditDir, bmDir, 'human-review-blocker.latest.json');
      if (existsSync(ledgerPath)) {
        try {
          const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
          if (ledger.status === 'BLOCKED_BY_HUMAN_DOCX_REVIEW') {
            ledgers.push(ledger);
          }
        } catch {
          // Skip invalid ledger files silently.
        }
      }
    }
  }

  if (ledgers.length === 0) return rows;

  let patched = 0;
  for (const ledger of ledgers) {
    const row = rows.find((r) => r.templateCode === ledger.templateCode);
    if (!row) continue;
    row.primaryLane = 'LEGAL_REVIEW';
    row.completionStatus = 'BLOCKED_BY_HUMAN_DOCX_REVIEW';
    // blockedPlaceholders may be:
    // - summary items: [{placeholder, count, ...}]
    // - per-occurrence items: [{placeholder, occurrenceIndex, ...}]
    // - undefined
    const bps = ledger.blockedPlaceholders || [];
    if (bps.length > 0 && 'count' in bps[0]) {
      // Summary format: [{placeholder, count, ...}]
      row.nextAction = `BLOCKED: Human DOCX/legal review required for ${bps.map((b) => `${b.count}x ${b.placeholder}`).join(', ')}.`;
    } else if (bps.length > 0 && 'occurrenceIndex' in bps[0]) {
      // Per-occurrence format: group by placeholder.
      const byPlaceholder = {};
      for (const item of bps) {
        byPlaceholder[item.placeholder] = (byPlaceholder[item.placeholder] || 0) + 1;
      }
      const summary = Object.entries(byPlaceholder).map(([ph, cnt]) => `${cnt}x ${ph}`).join(', ');
      row.nextAction = `BLOCKED: Human DOCX/legal review required for ${summary}.`;
    } else {
      row.nextAction = `BLOCKED: Human DOCX/legal review required.`;
    }
    patched += 1;
  }

  if (patched > 0) {
    process.stderr.write(`[blocker-ledgers] Patched ${patched} row(s) from human-review-blocker ledgers.\n`);
  }

  return rows;
}

function buildRows() {
  const contracts = loadLockedContracts();
  const baselineRows = loadBaselineRows();
  const { rootCause, byTemplate, issueGroups } = loadRootCause();

  const rows = contracts.map((contract) => {
    const baseline = baselineRows.get(contract.templateCode) ?? null;
    const rootEntry = byTemplate.get(contract.templateCode) ?? {
      issueCount: 0,
      failCount: 0,
      reviewCount: 0,
      fieldCount: contract.fieldCount,
      allIssues: [],
    };
    const issues = issueGroups.get(contract.templateCode) ?? [];
    const issueCounts = countBy(issues, (issue) => issue.issueCode);
    const renderEvidence = inspectRenderEvidence(contract.templateCode);
    const lane = primaryLane({ baseline, issueCounts, renderEvidence });

    const row = {
      templateCode: contract.templateCode,
      title: contract.title || rootEntry.title || contract.templateCode,
      sourceId: baseline?.sourceId || contract.sourceId,
      contract: {
        status: contract.status,
        reviewKind: contract.reviewKind,
        fieldCount: contract.fieldCount,
        slotCount: contract.slotCount,
        bindingCount: contract.bindingCount,
      },
      baseline: baseline ?? {
        docx: null,
        baseGrade: 'MISSING_BASELINE',
        qualityState: 'CONTRACT_REPAIR_REQUIRED',
        fields: 0,
        bindings: 0,
        unknown: 0,
        reviewRequired: 0,
        rendererKind: null,
        agencyStatus: null,
        runtimeSource: null,
        sourceId: contract.sourceId,
        alternateSources: '',
        warnings: [],
        findings: ['MISSING_BASELINE_ROW'],
      },
      rootCause: {
        fieldCount: rootEntry.fieldCount ?? contract.fieldCount,
        issueCount: rootEntry.issueCount ?? issues.length,
        failCount: rootEntry.failCount ?? 0,
        reviewCount: rootEntry.reviewCount ?? 0,
        issueCounts,
      },
      renderEvidence,
      primaryLane: lane,
      risk: null,
      nextAction: null,
      completionStatus: null,
    };

    row.risk = riskLevel(row);
    row.nextAction = nextAction(row);
    row.completionStatus = completionStatus(row);
    return row;
  });

  // Apply human-review-blocker ledgers after fresh row generation.
  // This is the durable fix that prevents board refresh from overwriting
  // legitimate BLOCKED_BY_HUMAN_DOCX_REVIEW rows.
  const patchedRows = applyHumanReviewBlockerLedgers(rows);

  return { rows: patchedRows, rootCause };
}

function buildSummary(rows, rootCause) {
  const laneCounts = Object.fromEntries(LANES.map((lane) => [lane, 0]));
  const riskCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };

  for (const row of rows) {
    laneCounts[row.primaryLane] = (laneCounts[row.primaryLane] ?? 0) + 1;
    riskCounts[row.risk] = (riskCounts[row.risk] ?? 0) + 1;
  }

  return {
    totalRows: rows.length,
    laneCounts,
    riskCounts,
    baseline: {
      lockedVerified: rows.filter(
        (row) => row.baseline.baseGrade === 'LOCKED_VERIFIED',
      ).length,
      extractedNeedsReview: rows.filter(
        (row) => row.baseline.baseGrade === 'EXTRACTED_NEEDS_REVIEW',
      ).length,
      genericFallback: rows.filter(
        (row) => row.baseline.baseGrade === 'GENERIC_FALLBACK',
      ).length,
      contractRepairRequired: rows.filter(
        (row) => row.baseline.qualityState === 'CONTRACT_REPAIR_REQUIRED',
      ).length,
    },
    rootCause: {
      totalIssues: rootCause.totalIssues ?? 0,
      failCount: rootCause.failCount ?? 0,
      reviewCount: rootCause.reviewCount ?? 0,
      issueCounts: rootCause.issueCounts ?? {},
    },
    renderEvidence: {
      available: rows.filter((row) => row.renderEvidence.available).length,
      clean: rows.filter((row) => row.renderEvidence.clean).length,
      missing: rows.filter((row) => !row.renderEvidence.available).length,
    },
  };
}

function buildBoard() {
  const { rows, rootCause } = buildRows();
  const summary = buildSummary(rows, rootCause);
  const nextCandidates = [...rows]
    .filter((row) =>
      row.primaryLane !== 'VERIFY_ONLY' &&
      row.completionStatus !== 'BLOCKED_BY_HUMAN_DOCX_REVIEW'
    )
    .sort((a, b) => {
      const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (
        riskOrder[a.risk] - riskOrder[b.risk] ||
        b.rootCause.issueCount - a.rootCause.issueCount ||
        compareCode(a.templateCode, b.templateCode)
      );
    })
    .slice(0, 25)
    .map((row) => ({
      templateCode: row.templateCode,
      title: row.title,
      primaryLane: row.primaryLane,
      risk: row.risk,
      issueCount: row.rootCause.issueCount,
      baselineFindings: row.baseline.findings,
      nextAction: row.nextAction,
    }));

  return {
    schemaVersion: 1,
    scope: 'BM-001..BM-213',
    snapshot: 'deterministic from current repository state',
    generatedBy: 'scripts/audit/refresh-213-docx-fidelity-board.mjs',
    sourceReports: {
      rootCause: 'docs/audit/forms-root-cause/latest.json',
      baseline: 'docs/audit/form-authoring-baselines/matrix.csv',
      lockedContracts: 'docs/audit/docx/contracts/locked',
      renderEvidence: 'docs/audit/per-form-render-accurate/<BM_CODE>/render-diff.latest.json',
    },
    summary,
    nextCandidates,
    rows,
  };
}

function markdownTable(rows) {
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  const separator = header.map(() => '---');

  return [header, separator, ...body]
    .map(
      (cells) =>
        `| ${cells.map((cell) => String(cell ?? '').replace(/\|/g, '\\|')).join(' | ')} |`,
    )
    .join('\n');
}

function formatMarkdown(board) {
  const lines = [
    '# 213 DOCX Fidelity Board',
    '',
    `Snapshot: ${board.snapshot}`,
    '',
    '## Summary',
    '',
    markdownTable([
      ['Metric', 'Value'],
      ['Rows', board.summary.totalRows],
      ['Root-cause issues', board.summary.rootCause.totalIssues],
      ['Root-cause FAIL', board.summary.rootCause.failCount],
      ['Root-cause REVIEW', board.summary.rootCause.reviewCount],
      ['Contract repair required', board.summary.baseline.contractRepairRequired],
      ['Render evidence clean', board.summary.renderEvidence.clean],
      ['Render evidence missing', board.summary.renderEvidence.missing],
    ]),
    '',
    '## Lane Counts',
    '',
    markdownTable([
      ['Lane', 'Count'],
      ...LANES.map((lane) => [lane, board.summary.laneCounts[lane] ?? 0]),
    ]),
    '',
    '## Next Candidates',
    '',
    markdownTable([
      ['BM', 'Lane', 'Risk', 'Issues', 'Baseline findings', 'Next action'],
      ...board.nextCandidates.map((row) => [
        row.templateCode,
        row.primaryLane,
        row.risk,
        row.issueCount,
        row.baselineFindings.join(', '),
        row.nextAction,
      ]),
    ]),
    '',
    '## Per-BM Board',
    '',
    markdownTable([
      ['BM', 'Lane', 'Risk', 'Root issues', 'FAIL', 'REVIEW', 'Quality', 'Findings'],
      ...board.rows.map((row) => [
        row.templateCode,
        row.primaryLane,
        row.risk,
        row.rootCause.issueCount,
        row.rootCause.failCount,
        row.rootCause.reviewCount,
        row.baseline.qualityState,
        row.baseline.findings.join(', '),
      ]),
    ]),
    '',
  ];

  return lines.join('\n');
}

function formatCsv(board) {
  const header = [
    'BM',
    'Title',
    'Primary lane',
    'Risk',
    'Completion status',
    'Root issues',
    'FAIL',
    'REVIEW',
    'Quality state',
    'Baseline findings',
    'Render status',
    'Next action',
  ];
  const rows = board.rows.map((row) => [
    row.templateCode,
    row.title,
    row.primaryLane,
    row.risk,
    row.completionStatus,
    row.rootCause.issueCount,
    row.rootCause.failCount,
    row.rootCause.reviewCount,
    row.baseline.qualityState,
    row.baseline.findings.join('; '),
    row.renderEvidence.status,
    row.nextAction,
  ]);

  return [header, ...rows]
    .map((row) => row.map(csvEscape).join(','))
    .join('\n');
}

function evidenceTargets(templateCode) {
  const base = `docs/audit/per-form-render-accurate/${templateCode}`;
  return {
    evidenceJson: `${base}/evidence.latest.json`,
    evidenceMd: `${base}/evidence.latest.md`,
    patchPlanJson: `${base}/patch-plan.latest.json`,
    patchPlanMd: `${base}/patch-plan.latest.md`,
    renderDiffJson: `${base}/render-diff.latest.json`,
    renderDiffMd: `${base}/render-diff.latest.md`,
  };
}

function buildContractRepairBatch(board) {
  const items = board.rows
    .filter((row) => row.primaryLane === 'CONTRACT_REPAIR')
    .filter((row) =>
      row.baseline.findings.some((finding) =>
        STRUCTURAL_CONTRACT_REPAIR_FINDINGS.has(finding),
      ),
    )
    .sort(
      (a, b) =>
        b.rootCause.issueCount - a.rootCause.issueCount ||
        compareCode(a.templateCode, b.templateCode),
    )
    .slice(0, 5)
    .map((row) => ({
      templateCode: row.templateCode,
      title: row.title,
      primaryLane: row.primaryLane,
      risk: row.risk,
      rootCause: row.rootCause,
      baselineQualityState: row.baseline.qualityState,
      baselineFindings: row.baseline.findings,
      evidenceTargets: evidenceTargets(row.templateCode),
      requiredEvidence: [
        'same-BM normalized DOCX placeholder inventory',
        'locked contract docxSlots/canonicalFields/renderBindings comparison',
        'proposed patch plan with no approved decisions',
        'render-diff after any approved structural repair',
      ],
      nextAction: row.nextAction,
    }));

  return {
    schemaVersion: 1,
    mode: 'EVIDENCE_SELECTION_ONLY',
    sourceBoard: 'docs/audit/213-docx-fidelity-board/latest.json',
    canApplyRunNow: false,
    safetyAssertions: {
      noContractMutation: true,
      noCompiledMutation: true,
      noDbPublish: true,
      noApprovedDecisions: true,
      sameBmEvidenceRequired: true,
    },
    selectionRules: {
      lane: 'CONTRACT_REPAIR',
      maxItems: 5,
      requiredFindings: [...STRUCTURAL_CONTRACT_REPAIR_FINDINGS],
      sort: 'rootCause.issueCount desc, templateCode asc',
    },
    items,
  };
}

function formatContractRepairBatchMarkdown(batch) {
  const lines = [
    '# Contract Repair Batch 1',
    '',
    'Mode: EVIDENCE_SELECTION_ONLY',
    '',
    'This batch selects structural contract-repair candidates only. It does not approve or apply mutations.',
    '',
    '## Safety',
    '',
    markdownTable([
      ['Assertion', 'Value'],
      ...Object.entries(batch.safetyAssertions).map(([key, value]) => [
        key,
        value,
      ]),
    ]),
    '',
    '## Items',
    '',
    markdownTable([
      ['BM', 'Risk', 'Issues', 'Findings', 'Evidence target'],
      ...batch.items.map((item) => [
        item.templateCode,
        item.risk,
        item.rootCause.issueCount,
        item.baselineFindings.join(', '),
        item.evidenceTargets.evidenceJson,
      ]),
    ]),
    '',
    '## Required Evidence Per BM',
    '',
    ...batch.items.flatMap((item) => [
      `### ${item.templateCode}`,
      '',
      ...item.requiredEvidence.map((entry) => `- ${entry}`),
      '',
      `Evidence JSON: \`${item.evidenceTargets.evidenceJson}\``,
      `Patch plan JSON: \`${item.evidenceTargets.patchPlanJson}\``,
      '',
    ]),
  ];

  return lines.join('\n');
}

function main() {
  const board = buildBoard();
  const contractRepairBatch = buildContractRepairBatch(board);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_JSON, `${JSON.stringify(board, null, 2)}\n`, 'utf8');
  writeFileSync(OUT_MD, formatMarkdown(board), 'utf8');
  writeFileSync(OUT_CSV, `${formatCsv(board)}\n`, 'utf8');
  writeFileSync(
    CONTRACT_REPAIR_BATCH_JSON,
    `${JSON.stringify(contractRepairBatch, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    CONTRACT_REPAIR_BATCH_MD,
    formatContractRepairBatchMarkdown(contractRepairBatch),
    'utf8',
  );

  console.log('=== refresh:213-docx-fidelity-board ===');
  console.log(`Rows: ${board.summary.totalRows}`);
  console.log(`Root-cause issues: ${board.summary.rootCause.totalIssues}`);
  console.log(`Contract repair required: ${board.summary.baseline.contractRepairRequired}`);
  console.log(`Contract repair batch items: ${contractRepairBatch.items.length}`);
  console.log(`Report: ${OUT_MD}`);
  console.log(`CSV: ${OUT_CSV}`);
}

main();
