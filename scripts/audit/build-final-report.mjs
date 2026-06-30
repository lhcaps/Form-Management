import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', '..', 'docs', 'audit', 'ready-absolute-blocker-burn-down-v3');

// Load key files
const acceptance = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'docs', 'audit', 'website-requirement-acceptance-v1', 'latest.json'), 'utf8')
);
const sotRebase = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'docs', 'audit', 'sot-rebase-v1', 'latest.json'), 'utf8')
);
const sampleCoverage = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'docs', 'audit', 'sample-data-coverage-v1', 'latest.json'), 'utf8')
);
const fidelityBoard = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'docs', 'audit', '213-docx-fidelity-board', 'latest.json'), 'utf8')
);

// Parse fidelity CSV
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

const fidelityCsv = readFileSync(join(__dirname, '..', '..', 'docs', 'audit', '213-docx-fidelity-board', 'per-bm.csv'), 'utf8');
const fidelityLines = fidelityCsv.split('\n').slice(1).filter(l => l.trim());
const fidelityCsvHeader = parseCsvLine(fidelityCsv.split('\n')[0]);
const fidelityCsvRows = fidelityLines.map(line => {
  const cols = parseCsvLine(line);
  return Object.fromEntries(fidelityCsvHeader.map((header, index) => [header, cols[index] ?? '']));
});
const fidelityRows = fidelityBoard.rows || fidelityCsvRows.map(row => ({
  completionStatus: row['Completion status'],
  baseline: { qualityState: row['Quality state'] },
  renderEvidence: { status: row['Render status'], clean: row['Render status'] === 'PASS' },
  primaryLane: row['Primary lane'],
}));
const readyForms = fidelityRows.filter(row => row.completionStatus === 'READY_FOR_FINAL_REVIEW');
const notFinalRows = fidelityRows.filter(row => row.completionStatus !== 'READY_FOR_FINAL_REVIEW');
const contractRepairRows = fidelityRows.filter(row =>
  row.primaryLane === 'CONTRACT_REPAIR' ||
  row.baseline?.qualityState === 'CONTRACT_REPAIR_REQUIRED'
);
const renderFailureRows = fidelityRows.filter(row => row.renderEvidence?.clean !== true);
const sampleSummary = sampleCoverage.summary || {};
const docxStatus = notFinalRows.length === 0 && contractRepairRows.length === 0 && renderFailureRows.length === 0
  ? 'PASS'
  : 'FAIL';
const sotIssueCounts = sotRebase.issueCounts || {};
const sotStatus =
  (sotIssueCounts.total || 0) === 0 &&
  (sotIssueCounts.critical || 0) === 0 &&
  (sotIssueCounts.high || 0) === 0
    ? 'PASS'
    : 'FAIL';

// Gate results
const sampleGate = acceptance.checks.find(c => c.id === 'SAMPLE-DATA-FULL-FILL');
const docxGate = acceptance.checks.find(c => c.id === 'DOCX-SEMANTIC-FIDELITY');
const sotGate = acceptance.checks.find(c => c.id === 'SOT-SEMANTIC-ISSUES');

const humanReviewBlockers = [
  {
    blockerId: 'HRB-001',
    category: 'SOT_SEMANTIC',
    count: sotRebase.specificCounts?.oTrongAutoApproved ?? 0,
    issue: `OTRONG_AUTOAPPROVED (${sotRebase.specificCounts?.oTrongAutoApproved ?? 0} HIGH)`,
    description: `${sotRebase.specificCounts?.oTrongAutoApproved ?? 0} docxSlots have label "O trong" with reviewRequired=false, auto-approved without human review.`,
    requiresHumanDecision: true,
    affectedForms: '~80 forms',
    autoFixable: false,
  },
  {
    blockerId: 'HRB-002',
    category: 'SOT_SEMANTIC',
    count: sotRebase.specificCounts?.rawPatternMismatch ?? 0,
    issue: `RAW_PATTERN_MISMATCH (${sotRebase.specificCounts?.rawPatternMismatch ?? 0})`,
    description: `${sotRebase.specificCounts?.rawPatternMismatch ?? 0} fields have generic or non-matching rawPattern evidence.`,
    requiresHumanDecision: true,
    affectedForms: '~205 forms',
    autoFixable: false,
  },
  {
    blockerId: 'HRB-003',
    category: 'DOCX_SEMANTIC_FIDELITY',
    count: notFinalRows.length,
    issue: `${notFinalRows.length} NOT_READY_FOR_FINAL_REVIEW forms`,
    description: `${notFinalRows.length} forms have Completion status != READY_FOR_FINAL_REVIEW.`,
    requiresHumanDecision: true,
    affectedForms: `${notFinalRows.length} forms`,
    autoFixable: false,
  },
].filter(blocker => blocker.count > 0).map(({ count, ...blocker }) => blocker);

const report = {
  generatedAt: new Date().toISOString(),
  phase: 'FINAL',
  overallStatus: acceptance.overall,
  
  gateSummary: {
    total: acceptance.total,
    pass: acceptance.checks.filter(c => c.status === 'PASS').length,
    fail: acceptance.checks.filter(c => c.status === 'FAIL').length,
    partial: acceptance.checks.filter(c => c.status === 'PARTIAL').length,
    notDetectable: acceptance.checks.filter(c => c.status === 'NOT_DETECTABLE').length,
  },
  
  blockerStatus: {
    sampleData: {
      status: sampleGate?.status,
      coverage: sampleSummary.overallCoverage ?? 'N/A',
      filled: sampleSummary.totalFilledFields ?? 'N/A',
      total: sampleSummary.totalManualFields ?? 'N/A',
      partialForms: sampleSummary.partiallyCovered ?? 'N/A',
    },
    docxFidelity: {
      status: docxStatus,
      notFinalReviewReady: notFinalRows.length,
      contractRepairRequired: contractRepairRows.length,
      renderFailures: renderFailureRows.length,
      readyForms: readyForms.length,
      notReadyForms: notFinalRows.length,
      rootCauseIssues: fidelityBoard.summary?.rootCause?.totalIssues ?? 'N/A',
    },
    sotSemantic: {
      status: sotStatus,
      total: sotIssueCounts.total,
      critical: sotIssueCounts.critical,
      high: sotIssueCounts.high,
      medium: sotIssueCounts.medium,
      byType: sotRebase?.specificCounts,
    },
  },
  
  beforeAfter: {
    sampleData: {
      before: { filled: 1576, total: 1735, partial: 96 },
      after: {
        filled: sampleSummary.totalFilledFields ?? 0,
        total: sampleSummary.totalManualFields ?? 0,
        partial: sampleSummary.partiallyCovered ?? 0,
      },
    },
    docxFidelity: {
      before: { notFinal: 200, contractRepair: 22, renderFail: 2 },
      after: {
        notFinal: notFinalRows.length,
        contractRepair: contractRepairRows.length,
        renderFail: renderFailureRows.length,
      },
    },
    sotSemantic: {
      before: { total: 4500, critical: 3, high: 2734 },
      after: {
        total: sotIssueCounts.total ?? 0,
        critical: sotIssueCounts.critical ?? 0,
        high: sotIssueCounts.high ?? 0,
        medium: sotIssueCounts.medium ?? 0,
      },
    },
  },
  
  humanReviewBlockers,
  inactiveHistoricalHumanReviewBlockers: [
    {
      blockerId: 'HRB-001',
      category: 'SOT_SEMANTIC',
      issue: `OTRONG_AUTOAPPROVED (${sotRebase.specificCounts?.oTrongAutoApproved ?? 0} HIGH)`,
      description: `${sotRebase.specificCounts?.oTrongAutoApproved ?? 0} docxSlots have label "Ô trống" with reviewRequired=false, auto-approved without human review. Each slot needs either a proper Vietnamese label (if DOCX context is clear) or explicit human review to confirm the blank is intentional.`,
      requiresHumanDecision: true,
      affectedForms: '~80 forms',
      autoFixable: false,
    },
    {
      blockerId: 'HRB-002',
      category: 'SOT_SEMANTIC',
      issue: `RAW_PATTERN_MISMATCH (${sotRebase.specificCounts?.rawPatternMismatch ?? 0})`,
      description: `${sotRebase.specificCounts?.rawPatternMismatch ?? 0} fields have generic or non-matching rawPattern evidence. These represent a structural comparison between semanticized slotId and actual DOCX token. Each mismatch needs evidence review to determine if the DOCX token should be updated or if the semanticization is incorrect.`,
      requiresHumanDecision: true,
      affectedForms: '~205 forms',
      autoFixable: false,
    },
    {
      blockerId: 'HRB-003',
      category: 'DOCX_SEMANTIC_FIDELITY',
      issue: `${notFinalRows.length} NOT_READY_FOR_FINAL_REVIEW forms`,
      description: `${notFinalRows.length} forms have Completion status != READY_FOR_FINAL_REVIEW. Current lanes: ${JSON.stringify(fidelityBoard.summary?.laneCounts ?? {})}. PATH_DOMAIN_BINDING forms have root causes in domain binding vs canonical path alignment; SOURCE_POLICY forms require source/required/readonly policy review.`,
      requiresHumanDecision: true,
      affectedForms: `${notFinalRows.length} forms across ${Object.keys(fidelityBoard.summary?.laneCounts ?? {}).filter(lane => lane !== 'VERIFY_ONLY' && (fidelityBoard.summary?.laneCounts?.[lane] ?? 0) > 0).length} lanes`,
      autoFixable: false,
    },
  ],
  
  autoFixesApplied: [
    {
      fix: 'Removed 1170 stale formInputHints.suggestedControls',
      description: 'Fixed BLK-008 by removing generic document.fieldN references from formInputHints in 149 locked contracts. These were UI metadata hints that had become stale after semanticization. The fix reduced formInputHintsStale from 1130 to 0.',
      artifacts: [
        'scripts/audit/fix-stale-form-input-hints.mjs',
        'docs/audit/ready-absolute-blocker-burn-down-v3/stale-hints-fix.latest.json',
      ],
      netEffect: { formInputHintsStale: '1130 → 0', highIssues: 'unchanged (hints are UI metadata only)' },
    },
  ],
  
  gates: [
    {
      id: 'SAMPLE-DATA-FULL-FILL',
      status: sampleGate?.status,
      reason: `${sampleSummary.totalFilledFields}/${sampleSummary.totalManualFields} manual fields filled`,
    },
    {
      id: 'DOCX-SEMANTIC-FIDELITY',
      status: docxStatus,
      reason: `${notFinalRows.length} not final-review-ready`,
    },
    {
      id: 'SOT-SEMANTIC-ISSUES',
      status: sotStatus,
      reason: `${sotIssueCounts.high ?? 0} HIGH issues remain`,
    },
  ],
};

writeFileSync(
  join(OUTPUT_DIR, 'final-report.latest.json'),
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('Final report written:', join(OUTPUT_DIR, 'final-report.latest.json'));
console.log(JSON.stringify(report, null, 2));
