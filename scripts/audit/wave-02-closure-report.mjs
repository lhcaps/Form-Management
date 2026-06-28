import fs from 'fs';
import path from 'path';

const ROOT = 'docs/audit';

function readJSON(p) {
  const full = path.join(ROOT, p);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const reviewPack = readJSON('docx-wave-02-manual-review-pack/review-pack.latest.json');
const globalApproved = readJSON('docx-wave-02-manual-review-pack/decisions.approved.json');
const applyLatest = readJSON('docx-wave-02-manual-review-pack/apply/latest.json');
const priority7 = readJSON('docx-wave-02-priority-7-manual-review/priority-7-decisions.draft.json');

const bm068069 = readJSON('docx-wave-02-bm068-bm069-review/review.latest.json');
const bm162163 = readJSON('docx-wave-02-bm162-bm163-review/review.latest.json');
const bm075080 = readJSON('docx-wave-02-bm075-bm080-review/review.latest.json');
const bm077082 = readJSON('docx-wave-02-bm077-bm082-review/review.latest.json');
const unreviewed5 = readJSON('docx-wave-02-unreviewed-5/review.latest.json');

const masterIds = new Set((reviewPack.items || []).map(i => i.reviewItemId));
const appliedPreBatch = new Set((reviewPack.appliedItems || []).map(i => i.reviewItemId));

const approved = new Map();
for (const it of (globalApproved.items || [])) {
  approved.set(it.reviewItemId, it);
}

const decisionsByDecision = { APPROVED_LABEL: [], DEFER: [], LEGAL_REVIEW: [], DOCX_REAUTHOR_REQUIRED: [], PENDING_REVIEW: [], other: [] };
const allReviewed = new Map();

function collectReviewItems(reviewFile) {
  if (!reviewFile) return;
  for (const it of (reviewFile.items || [])) {
    allReviewed.set(it.reviewItemId, it);
    const dec = it.decision || 'PENDING_REVIEW';
    if (decisionsByDecision[dec]) decisionsByDecision[dec].push(it.reviewItemId);
    else decisionsByDecision.other.push(it.reviewItemId);
  }
}

collectReviewItems(bm068069);
collectReviewItems(bm162163);
collectReviewItems(bm075080);
collectReviewItems(bm077082);
collectReviewItems(unreviewed5);

for (const it of (priority7?.items || [])) {
  if (!allReviewed.has(it.reviewItemId)) {
    allReviewed.set(it.reviewItemId, { ...it, source: 'priority-7' });
    const dec = it.decision || 'PENDING_REVIEW';
    if (decisionsByDecision[dec]) decisionsByDecision[dec].push(it.reviewItemId);
    else decisionsByDecision.other.push(it.reviewItemId);
  }
}

const reviewedIds = new Set(allReviewed.keys());

const inGlobalNotReviewed = [];
for (const id of approved.keys()) {
  if (!reviewedIds.has(id)) inGlobalNotReviewed.push(id);
}

const inReviewedNotGlobal = [];
for (const id of reviewedIds) {
  if (!approved.has(id) && allReviewed.get(id).decision === 'APPROVED_LABEL') {
    inReviewedNotGlobal.push(id);
  }
}

const inMasterNotReviewed = [];
for (const id of masterIds) {
  if (!reviewedIds.has(id)) inMasterNotReviewed.push(id);
}

const notInMaster = [];
for (const id of reviewedIds) {
  if (!masterIds.has(id)) notInMaster.push(id);
}

const duplicates = [];
const seen = new Map();
for (const id of reviewedIds) {
  seen.set(id, (seen.get(id) || 0) + 1);
}
for (const [id, count] of seen) {
  if (count > 1) duplicates.push({ id, count });
}

const totalItemsMismatch = [];
if (globalApproved.totalItems !== (globalApproved.items || []).length) {
  totalItemsMismatch.push({
    file: 'decisions.approved.json',
    field: 'totalItems',
    expected: globalApproved.totalItems,
    actual: (globalApproved.items || []).length
  });
}

const approvedLabelMismatches = [];
for (const it of allReviewed.values()) {
  if (it.decision === 'APPROVED_LABEL' && !it.approvedLabel) {
    approvedLabelMismatches.push({ id: it.reviewItemId, issue: 'APPROVED_LABEL without approvedLabel' });
  }
  if (it.decision !== 'APPROVED_LABEL' && it.approvedLabel) {
    approvedLabelMismatches.push({ id: it.reviewItemId, issue: 'approvedLabel exists but decision is not APPROVED_LABEL' });
  }
}

const legalBasisApproved = [];
for (const it of approved.values()) {
  if (it.path && it.path.startsWith('legalBasis.')) {
    legalBasisApproved.push(it);
  }
}

const stillPlaceholder = [];
for (const it of approved.values()) {
  if (it.currentLabel === 'Slot from Wave 02 DOCX remediation') {
    stillPlaceholder.push(it);
  }
}

const closure = {
  generatedAt: new Date().toISOString(),
  computedAt: "2026-06-26T17:10:00.000Z",
  scope: "Wave 02 manual review/apply lane",
  baseline: { totalIssues: 3440, BAD_LABEL: 431, UI_VISIBLE_BAD_METADATA: 76 },
  current: { totalIssues: 3395, BAD_LABEL: 399, UI_VISIBLE_BAD_METADATA: 44 },
  delta: {
    totalIssues: -45,
    BAD_LABEL: -32,
    UI_VISIBLE_BAD_METADATA: -32
  },
  counts: {
    masterPackItems: masterIds.size,
    reviewedItems: reviewedIds.size,
    approvedInGlobal: approved.size,
    approvedFromPriority7PreBatch: (priority7?.items || []).filter(i => i.decision === 'APPROVED_LABEL').length,
    preBatchApplied: appliedPreBatch.size,
    defer: decisionsByDecision.DEFER.length,
    legalReview: decisionsByDecision.LEGAL_REVIEW.length,
    docxReauthor: decisionsByDecision.DOCX_REAUTHOR_REQUIRED.length,
    pendingReview: decisionsByDecision.PENDING_REVIEW.length,
    other: decisionsByDecision.other.length
  },
  decisionsByBM: {},
  approvedItems: [],
  deferredItems: [],
  legalReviewItems: [],
  docxReauthorItems: [],
  inMasterNotReviewed,
  inGlobalNotReviewed,
  inReviewedNotGlobal,
  notInMaster,
  duplicates,
  totalItemsMismatch,
  approvedLabelMismatches,
  legalBasisApprovedWithoutLegalReviewer: legalBasisApproved,
  stillPlaceholderAfterApproval: stillPlaceholder,
  contractCoverage: {}
};

const allContracts = {};
for (const it of allReviewed.values()) {
  const bm = it.templateCode;
  if (!allContracts[bm]) allContracts[bm] = { approved: 0, defer: 0, legalReview: 0, docxReauthor: 0, ids: [] };
  if (it.decision === 'APPROVED_LABEL') allContracts[bm].approved++;
  else if (it.decision === 'DEFER') allContracts[bm].defer++;
  else if (it.decision === 'LEGAL_REVIEW') allContracts[bm].legalReview++;
  else if (it.decision === 'DOCX_REAUTHOR_REQUIRED') allContracts[bm].docxReauthor++;
  allContracts[bm].ids.push(it.reviewItemId);
}
closure.contractCoverage = allContracts;

for (const it of approved.values()) {
  const reviewed = allReviewed.get(it.reviewItemId);
  closure.approvedItems.push({
    reviewItemId: it.reviewItemId,
    templateCode: it.templateCode,
    sourceId: it.sourceId,
    path: it.path,
    placeholder: it.placeholder,
    approvedLabel: it.approvedLabel,
    evidenceSource: reviewed?.evidence?.evidenceNotes || reviewed?.evidenceNotes || 'see review file',
    risk: reviewed?.risk || 'high'
  });
}

function pushByDecision(items, target) {
  for (const it of items) {
    target.push({
      reviewItemId: it.reviewItemId,
      templateCode: it.templateCode,
      path: it.path,
      placeholder: it.placeholder,
      reason: it.evidence?.evidenceNotes || it.evidenceNotes || ''
    });
  }
}

pushByDecision(decisionsByDecision.DEFER.map(id => allReviewed.get(id)), closure.deferredItems);
pushByDecision(decisionsByDecision.LEGAL_REVIEW.map(id => allReviewed.get(id)), closure.legalReviewItems);
pushByDecision(decisionsByDecision.DOCX_REAUTHOR_REQUIRED.map(id => allReviewed.get(id)), closure.docxReauthorItems);

const outDir = path.join(ROOT, 'docx-wave-02-closure');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'closure.latest.json'), JSON.stringify(closure, null, 2));

console.log('Counts computed:');
console.log(JSON.stringify(closure.counts, null, 2));
console.log('In master not reviewed:', inMasterNotReviewed.length);
console.log('In global not reviewed:', inGlobalNotReviewed.length);
console.log('In reviewed not global (APPROVED):', inReviewedNotGlobal.length);
console.log('Not in master:', notInMaster.length);
console.log('Duplicates:', duplicates.length);
console.log('totalItems mismatch:', totalItemsMismatch.length);
console.log('Approved-label mismatches:', approvedLabelMismatches.length);
console.log('legalBasis approved:', legalBasisApproved.length);
console.log('still placeholder after approval:', stillPlaceholder.length);
