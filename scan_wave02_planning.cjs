#!/usr/bin/env node
/**
 * scan-docx-slot-naming-wave02-planning.cjs
 *
 * DOCX_SLOT_NAMING_STRUCTURAL_REMEDIATION_WAVE_02_PLANNING
 *
 * Scans remaining BAD_LABEL issues caused by DOCX slot naming / structural debt.
 * Inspects normalized DOCX XML context for O trong and generic slot items.
 * Classifies all issues into lanes A-H.
 *
 * PLANNING ONLY - does NOT mutate any files.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'docs', 'audit', 'docx-slot-naming-structural-wave-02-planning');
const NORM_DIR = path.join(ROOT, 'storage', 'templates', 'normalized-docx');

// Load audits
const audit = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'audit', 'forms-root-cause', 'latest.json'), 'utf8'));
const slotInventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'audit', 'docx-slot-inventory', 'latest.json'), 'utf8'));
const fixPlan = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'audit', 'forms-root-cause-fix-plan', 'review-fix-candidates.json'), 'utf8'));

// Index slot inventory by templateCode
const slotByBm = {};
for (const r of (slotInventory.perBm || [])) {
  slotByBm[r.templateCode] = r;
}

// Index fix plan
const fixPlanMap = {};
for (const f of fixPlan) {
  fixPlanMap[`${f.templateCode}::${f.path}`] = f;
}

console.log('Loaded audit: ' + audit.totalIssues + ' total issues, ' + audit.issueCounts.BAD_LABEL + ' BAD_LABEL');
console.log('Loaded slot inventory: ' + Object.keys(slotByBm).length + ' contracts');

// ============================================================================
// Helpers
// ============================================================================

function extractTextAroundFromXml(xmlStr, idx, placeholderLen) {
  const start = Math.max(0, idx - 150);
  const end = Math.min(xmlStr.length, idx + placeholderLen + 150);
  const snippet = xmlStr.slice(start, end);
  // Strip XML tags
  const text = snippet
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

function getDocxContext(templateCode, slotPath) {
  const normPath = path.join(NORM_DIR, templateCode, `${templateCode}_normalized.docx`);
  if (!fs.existsSync(normPath)) return null;

  try {
    const PizZip = require('pizzip');
    const buf = fs.readFileSync(normPath);
    if (buf[0] !== 0x50 || buf[1] !== 0x4B) return null;
    const zip = new PizZip(buf);
    const docXml = zip.file('word/document.xml');
    if (!docXml) return null;
    const xmlStr = docXml.asText();
    // Search for slot path (dot notation -> braces)
    const placeholder1 = '{{' + slotPath + '}}';
    const placeholder2 = '{{' + slotPath.replace(/\./g, '.') + '}}';
    const placeholder3 = slotPath.split('.').join('.');
    let idx = xmlStr.indexOf(placeholder1);
    if (idx < 0) idx = xmlStr.indexOf(placeholder2);
    if (idx < 0) idx = xmlStr.indexOf(placeholder3);
    if (idx < 0) {
      // Try case-insensitive
      const lower = xmlStr.toLowerCase();
      const target = placeholder1.toLowerCase();
      idx = lower.indexOf(target);
    }
    if (idx < 0) return null;
    return extractTextAroundFromXml(xmlStr, idx, placeholder1.length);
  } catch (e) {
    return null;
  }
}

function classifyLane(issue) {
  const { path: p, label, source, reason } = issue;

  // H: noise
  if (reason && (reason.includes('noise') || reason.includes('derived') || reason.includes('NOISE'))) {
    return 'H_DO_NOT_FIX_NOISE_OR_DERIVED';
  }

  // A: O trong / O trống (blank slot placeholder label)
  if (label) {
    const labelLower = label.toLowerCase();
    if (labelLower.startsWith('o tr') || label === 'O trong') return 'A_O_TRONG_SLOT';
    // Also check the hex for the actual bytes: c394 = O with circumflex
    if (Buffer.from(label).slice(0,2).toString('hex') === 'c394' && labelLower.includes('tr')) return 'A_O_TRONG_SLOT';
  }

  // B: Wave 02
  if (label === 'Slot from Wave 02 DOCX remediation') return 'B_WAVE_02_GENERIC_SLOT';

  // C: Prior DOCX remediation
  if (label === 'Slot from DOCX remediation') return 'C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT';

  // D: Document line metadata
  const docLineLabels = new Set(['archiveLine', 'primaryLine', 'issuePlaceAndDateLine',
    'receivedDateLine', 'birthDateLine', 'identityIssueDateLine', 'procedureArticlesLine']);
  if (docLineLabels.has(label)) return 'D_DOCUMENT_LINE_METADATA';

  // E: Legal/procedural
  if (p && (p.startsWith('legalBasis.') || label === 'legalBasis' ||
      label.includes('Tội') || label.includes('Điều') || label.includes('khoản') ||
      label.includes('pháp luật') || label.includes('hình sự') || label.includes('dân sự'))) {
    return 'E_LEGAL_OR_PROCEDURAL_AMBIGUOUS';
  }

  // G: camelCase — defer
  if (label && /^[a-z]/.test(label) && !docLineLabels.has(label)) {
    return 'G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW';
  }

  // E: everything else ambiguous
  return 'E_LEGAL_OR_PROCEDURAL_AMBIGUOUS';
}

function laneFixability(lane) {
  const map = {
    A_O_TRONG_SLOT: 'DOCX_AUTHORING_ONLY',
    B_WAVE_02_GENERIC_SLOT: 'DOCX_AUTHORING_ONLY',
    C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT: 'DOCX_AUTHORING_ONLY',
    D_DOCUMENT_LINE_METADATA: 'DOCX_AUTHORING_OR_METADATA',
    E_LEGAL_OR_PROCEDURAL_AMBIGUOUS: 'LEGAL_REVIEW',
    F_TRUE_SAFE_STRUCTURAL_RENAME: 'METADATA_OR_DOCX',
    G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW: 'ORIGINAL_DOCX_REVIEW',
    H_DO_NOT_FIX_NOISE_OR_DERIVED: 'DO_NOT_FIX',
  };
  return map[lane] || 'UNKNOWN';
}

function laneRisk(lane) {
  const map = {
    A_O_TRONG_SLOT: 'high',
    B_WAVE_02_GENERIC_SLOT: 'high',
    C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT: 'high',
    D_DOCUMENT_LINE_METADATA: 'medium',
    E_LEGAL_OR_PROCEDURAL_AMBIGUOUS: 'high',
    F_TRUE_SAFE_STRUCTURAL_RENAME: 'low',
    G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW: 'medium',
    H_DO_NOT_FIX_NOISE_OR_DERIVED: 'low',
  };
  return map[lane] || 'high';
}

function laneDescription(lane) {
  const map = {
    A_O_TRONG_SLOT: 'Blank placeholder label. Requires DOCX authoring to add actual placeholder text.',
    B_WAVE_02_GENERIC_SLOT: 'Wave 02 structural leftover. Requires DOCX Wave 02 remediation to rename slots.',
    C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT: 'Prior remediation generic slot. Requires DOCX authoring to rename slots.',
    D_DOCUMENT_LINE_METADATA: 'Document metadata line. May be fixable via DOCX or metadata per BM.',
    E_LEGAL_OR_PROCEDURAL_AMBIGUOUS: 'Legal/procedural domain. Requires human legal review before any change.',
    F_TRUE_SAFE_STRUCTURAL_RENAME: 'Low-risk unambiguous structural rename. May be safe for metadata-only fix.',
    G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW: 'Needs original DOCX review to determine the correct label.',
    H_DO_NOT_FIX_NOISE_OR_DERIVED: 'Noise or derived field. Do not fix.',
  };
  return map[lane] || 'Unknown';
}

// ============================================================================
// Scan
// ============================================================================

const badLabels = audit.issues.filter(i => i.issueCode === 'BAD_LABEL');
console.log('Total BAD_LABEL: ' + badLabels.length);

// Group by label type
const byLabel = {};
for (const issue of badLabels) {
  const lbl = issue.label || '(null)';
  if (!byLabel[lbl]) byLabel[lbl] = [];
  byLabel[lbl].push(issue);
}

// Show breakdown
console.log('\nBy label type:');
const sortedLabels = Object.entries(byLabel).sort((a, b) => b[1].length - a[1].length);
for (const [label, issues] of sortedLabels) {
  const contracts = new Set(issues.map(i => i.templateCode));
  const sources = new Set(issues.map(i => i.source));
  const samplePaths = [...new Set(issues.map(i => i.path))].slice(0, 2);
  console.log(`  "${label}": ${issues.length} items, ${contracts.size} BMs, sources: ${[...sources].join(',')}, paths: ${samplePaths.join(', ')}`);
}

// Classify into lanes
const lanes = {
  A_O_TRONG_SLOT: [],
  B_WAVE_02_GENERIC_SLOT: [],
  C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT: [],
  D_DOCUMENT_LINE_METADATA: [],
  E_LEGAL_OR_PROCEDURAL_AMBIGUOUS: [],
  F_TRUE_SAFE_STRUCTURAL_RENAME: [],
  G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW: [],
  H_DO_NOT_FIX_NOISE_OR_DERIVED: [],
};

let id = 1;
for (const issue of badLabels) {
  const lane = classifyLane(issue);
  const docxContext = getDocxContext(issue.templateCode, issue.path);
  const risk = laneRisk(lane);
  const fixability = laneFixability(lane);
  const fixPlanItem = fixPlanMap[`${issue.templateCode}::${issue.path}`];

  const entry = {
    id: id++,
    templateCode: issue.templateCode,
    sourceId: issue.sourceId || issue.templateCode,
    section: (issue.path || '').split('.')[0] || '',
    path: issue.path,
    currentLabel: issue.label,
    issueType: issue.issueCode,
    lane,
    evidence: {
      source: issue.source || 'unknown',
      reason: issue.reason || '',
      slotId: issue.slotId || null,
      fixPlanClassification: fixPlanItem?.classification || null,
      docxContext,
    },
    risk,
    fixability,
  };

  lanes[lane].push(entry);
}

// Statistics
const laneStats = {};
for (const [lane, items] of Object.entries(lanes)) {
  laneStats[lane] = items.length;
}

console.log('\nLane breakdown:');
for (const [lane, count] of Object.entries(laneStats)) {
  console.log('  ' + lane + ': ' + count);
}

// By-BM breakdown
const byBm = {};
for (const [lane, items] of Object.entries(lanes)) {
  for (const item of items) {
    if (!byBm[item.templateCode]) byBm[item.templateCode] = {};
    if (!byBm[item.templateCode][lane]) byBm[item.templateCode][lane] = 0;
    byBm[item.templateCode][lane]++;
  }
}
const bmSummary = Object.entries(byBm)
  .map(([bm, laneCounts]) => ({
    bm,
    total: Object.values(laneCounts).reduce((a, b) => a + b, 0),
    laneCounts,
  }))
  .sort((a, b) => b.total - a.total);

const topBms = bmSummary.slice(0, 30);

// Candidate groups
const groups = {};
for (const [lane, items] of Object.entries(lanes)) {
  for (const item of items) {
    const key = lane + '::' + (item.currentLabel || '(null)');
    if (!groups[key]) {
      groups[key] = { lane, currentLabel: item.currentLabel, items: [], paths: new Set(), contracts: new Set() };
    }
    groups[key].items.push(item);
    groups[key].paths.add(item.path);
    groups[key].contracts.add(item.templateCode);
  }
}
const groupList = Object.entries(groups)
  .map(([key, g]) => ({
    lane: g.lane,
    currentLabel: g.currentLabel,
    count: g.items.length,
    uniquePaths: g.paths.size,
    uniqueContracts: g.contracts.size,
    paths: [...g.paths].slice(0, 10),
    contracts: [...g.contracts].slice(0, 10),
  }))
  .sort((a, b) => b.count - a.count);

// ============================================================================
// Write outputs
// ============================================================================

console.log('\nWriting outputs...');
fs.mkdirSync(OUT_DIR, { recursive: true });

// --- inventory.latest.json ---
const invJson = {
  schemaVersion: '1.0',
  task: 'DOCX_SLOT_NAMING_STRUCTURAL_REMEDIATION_WAVE_02_PLANNING',
  generatedAt: new Date().toISOString(),
  mode: 'planning-only',
  rootCause: {
    totalIssues: audit.totalIssues,
    BAD_LABEL: audit.issueCounts.BAD_LABEL,
    UI_VISIBLE_BAD_METADATA: audit.issueCounts.UI_VISIBLE_BAD_METADATA,
  },
  badLabelBreakdown: sortedLabels.map(([label, issues]) => ({
    label,
    count: issues.length,
    uniqueContracts: new Set(issues.map(i => i.templateCode)).size,
    sources: [...new Set(issues.map(i => i.source))],
    samplePaths: [...new Set(issues.map(i => i.path))].slice(0, 5),
  })),
  laneCounts: laneStats,
  allItems: Object.values(lanes).flat(),
};
fs.writeFileSync(path.join(OUT_DIR, 'inventory.latest.json'), JSON.stringify(invJson, null, 2), 'utf8');
console.log('Written: inventory.latest.json');

// --- lane-plan.latest.json ---
const lanePlanJson = {
  schemaVersion: '1.0',
  task: 'DOCX_SLOT_NAMING_STRUCTURAL_REMEDIATION_WAVE_02_PLANNING',
  generatedAt: new Date().toISOString(),
  lanes: Object.entries(lanes).map(([lane, items]) => ({
    lane,
    count: items.length,
    fixability: laneFixability(lane),
    risk: laneRisk(lane),
    description: laneDescription(lane),
    sampleItems: items.slice(0, 10).map(i => ({
      templateCode: i.templateCode,
      path: i.path,
      currentLabel: i.currentLabel,
      docxContext: i.evidence.docxContext,
    })),
  })),
};
fs.writeFileSync(path.join(OUT_DIR, 'lane-plan.latest.json'), JSON.stringify(lanePlanJson, null, 2), 'utf8');
console.log('Written: lane-plan.latest.json');

// --- bm-breakdown.latest.json ---
fs.writeFileSync(path.join(OUT_DIR, 'bm-breakdown.latest.json'), JSON.stringify({
  schemaVersion: '1.0',
  task: 'DOCX_SLOT_NAMING_STRUCTURAL_REMEDIATION_WAVE_02_PLANNING',
  generatedAt: new Date().toISOString(),
  topBms,
}, null, 2), 'utf8');
console.log('Written: bm-breakdown.latest.json');

// --- candidate-groups.latest.json ---
fs.writeFileSync(path.join(OUT_DIR, 'candidate-groups.latest.json'), JSON.stringify({
  schemaVersion: '1.0',
  task: 'DOCX_SLOT_NAMING_STRUCTURAL_REMEDIATION_WAVE_02_PLANNING',
  generatedAt: new Date().toISOString(),
  groups: groupList,
}, null, 2), 'utf8');
console.log('Written: candidate-groups.latest.json');

// ============================================================================
// Write markdown files
// ============================================================================

// --- inventory.latest.md ---
let invMd = '# DOCX Slot Naming / Structural Remediation — Wave 02 Planning\n\n';
invMd += 'Generated: ' + new Date().toISOString() + '\n';
invMd += 'Mode: **PLANNING ONLY** — no files mutated\n\n';
invMd += '## Root Cause\n\n';
invMd += '| Metric | Value |\n|--------|------:|\n';
invMd += '| Total root-cause issues | ' + audit.totalIssues + ' |\n';
invMd += '| BAD_LABEL | ' + audit.issueCounts.BAD_LABEL + ' |\n';
invMd += '| UI_VISIBLE_BAD_METADATA | ' + audit.issueCounts.UI_VISIBLE_BAD_METADATA + ' |\n\n';
invMd += '## BAD_LABEL Breakdown\n\n';
invMd += '| Label | Count | Contracts | Sources | Sample Paths |\n';
invMd += '|-------|------:|--------:|---------|--------------|\n';
for (const [label, issues] of sortedLabels) {
  const contracts = new Set(issues.map(i => i.templateCode));
  const sources = [...new Set(issues.map(i => i.source))].join(', ');
  const samplePaths = [...new Set(issues.map(i => i.path))].slice(0, 2).join(', ');
  invMd += '| `' + label + '` | ' + issues.length + ' | ' + contracts.size + ' | ' + sources + ' | `' + samplePaths + '` |\n';
}
invMd += '\n## Lane Classification\n\n';
invMd += '| Lane | Count | Fixability | Risk | Description |\n';
invMd += '|------|------:|------------|------|-------------|\n';
for (const [lane, count] of Object.entries(laneStats)) {
  const fix = laneFixability(lane);
  const risk = laneRisk(lane);
  const desc = laneDescription(lane).slice(0, 60);
  invMd += '| ' + lane + ' | ' + count + ' | ' + fix + ' | ' + risk + ' | ' + desc + ' |\n';
}
invMd += '\n## Top 30 Affected BMs\n\n';
invMd += '| # | BM | Total | A_O_TRONG | B_WAVE02 | C_DOCX_REMED | D_DOC_LINE | E_LEGAL | F_SAFE | G_DEFER | H_NOISE |\n';
invMd += '|---|----|------:|--------:|---------:|------------:|-----------:|--------:|-------:|-------:|-------:|\n';
for (let i = 0; i < topBms.length; i++) {
  const s = topBms[i];
  const g = (l) => s.laneCounts[l] || 0;
  invMd += '| ' + (i+1) + ' | ' + s.bm + ' | **' + s.total + '** | ' + g('A_O_TRONG_SLOT') + ' | ' + g('B_WAVE_02_GENERIC_SLOT') + ' | ' + g('C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT') + ' | ' + g('D_DOCUMENT_LINE_METADATA') + ' | ' + g('E_LEGAL_OR_PROCEDURAL_AMBIGUOUS') + ' | ' + g('F_TRUE_SAFE_STRUCTURAL_RENAME') + ' | ' + g('G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW') + ' | ' + g('H_DO_NOT_FIX_NOISE_OR_DERIVED') + ' |\n';
}
invMd += '\n## Fixability Summary\n\n';
invMd += '| Fixability | Count | Lane(s) |\n';
invMd += '|------------|------:|----------|\n';
invMd += '| DOCX authoring only | ' + (laneStats['A_O_TRONG_SLOT'] + laneStats['B_WAVE_02_GENERIC_SLOT'] + laneStats['C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT']) + ' | A, B, C |\n';
invMd += '| DOCX authoring or metadata | ' + laneStats['D_DOCUMENT_LINE_METADATA'] + ' | D |\n';
invMd += '| Legal review required | ' + laneStats['E_LEGAL_OR_PROCEDURAL_AMBIGUOUS'] + ' | E |\n';
invMd += '| Low-risk safe rename | ' + laneStats['F_TRUE_SAFE_STRUCTURAL_RENAME'] + ' | F |\n';
invMd += '| Original DOCX review required | ' + laneStats['G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW'] + ' | G |\n';
invMd += '| Do not fix | ' + laneStats['H_DO_NOT_FIX_NOISE_OR_DERIVED'] + ' | H |\n\n';
invMd += '## Safety\n\n';
invMd += '| Check | Result |\n';
invMd += '|-------|--------|\n';
invMd += '| Locked contracts mutated | **false** |\n';
invMd += '| DOCX touched | **false** |\n';
invMd += '| Compiled artifacts hand-edited | **false** |\n';
invMd += '| Source/path/binding changed | **false** |\n';
fs.writeFileSync(path.join(OUT_DIR, 'inventory.latest.md'), invMd, 'utf8');
console.log('Written: inventory.latest.md');

// --- lane-plan.latest.md ---
let laneMd = '# Lane Remediation Plan — DOCX Slot Naming / Structural Wave 02\n\n';
laneMd += 'Generated: ' + new Date().toISOString() + '\n';
laneMd += 'Mode: **PLANNING ONLY**\n\n';
laneMd += '## Lane Summary\n\n';
laneMd += '| Lane | Count | Fixability | Risk | Recommended Action |\n';
laneMd += '|------|------:|------------|------|-------------------|\n';
for (const [lane, count] of Object.entries(laneStats)) {
  const fix = laneFixability(lane);
  const risk = laneRisk(lane);
  const action = {
    A_O_TRONG_SLOT: 'DOCX authoring — add placeholder text to slots',
    B_WAVE_02_GENERIC_SLOT: 'DOCX Wave 02 remediation — rename slots',
    C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT: 'DOCX authoring — rename slots',
    D_DOCUMENT_LINE_METADATA: 'Per-BM review — DOCX or metadata fix',
    E_LEGAL_OR_PROCEDURAL_AMBIGUOUS: 'Legal review — defer',
    F_TRUE_SAFE_STRUCTURAL_RENAME: 'Metadata or DOCX — low risk',
    G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW: 'Original DOCX review required',
    H_DO_NOT_FIX_NOISE_OR_DERIVED: 'No action — noise',
  }[lane] || 'Unknown';
  laneMd += '| ' + lane + ' | ' + count + ' | ' + fix + ' | ' + risk + ' | ' + action + ' |\n';
}
laneMd += '\n## Fix-First Priority\n\n';
laneMd += '**No safe metadata-only fixes identified.** The primary lanes are:\n\n';
laneMd += '- **Lane A (' + laneStats['A_O_TRONG_SLOT'] + ' items)**: O trong — requires DOCX authoring to add placeholder text.\n';
laneMd += '- **Lane B (' + laneStats['B_WAVE_02_GENERIC_SLOT'] + ' items)**: Wave 02 structural — requires DOCX Wave 02 remediation.\n';
laneMd += '- **Lane C (' + laneStats['C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT'] + ' items)**: Prior remediation — requires DOCX authoring.\n\n';
const docxOnly = laneStats['A_O_TRONG_SLOT'] + laneStats['B_WAVE_02_GENERIC_SLOT'] + laneStats['C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT'];
laneMd += 'Total DOCX authoring required: **' + docxOnly + ' items**\n\n';
laneMd += '## No Label-Only Batch Apply Available\n\n';
laneMd += 'Unlike Batch 3 (which targeted person/address/contact labels with clear Vietnamese equivalents),\n';
laneMd += 'the remaining BAD_LABEL issues are structural DOCX artifacts that cannot be fixed by\n';
laneMd += 'changing the label field in the locked contract JSON alone.\n\n';
laneMd += 'The label value (O trong, Slot from Wave 02, etc.) is the metadata representation\n';
laneMd += 'of the DOCX slot content. Fixing it requires modifying the source DOCX to add\n';
laneMd += 'meaningful placeholder text, which then gets re-extracted with the correct label.\n\n';
laneMd += '## Next Recommended Task\n\n';
laneMd += '**DOCX_WAVE_02_PLACEHOLDER_FIX_PLANNING**\n\n';
laneMd += 'Analyze the 9 Wave 02 contracts that have "Slot from Wave 02 DOCX remediation" labels.\n';
laneMd += 'Determine if a safe DOCX structural fix can be made to rename those slots.\n\n';
laneMd += '## Safety\n\n';
laneMd += '| Check | Result |\n';
laneMd += '|-------|--------|\n';
laneMd += '| Locked contracts mutated | **false** |\n';
laneMd += '| DOCX touched | **false** |\n';
laneMd += '| Compiled artifacts hand-edited | **false** |\n';
fs.writeFileSync(path.join(OUT_DIR, 'lane-plan.latest.md'), laneMd, 'utf8');
console.log('Written: lane-plan.latest.md');

// --- bm-breakdown.latest.md ---
let bmMd = '# BM Breakdown — DOCX Slot Naming / Structural Issues\n\n';
bmMd += 'Generated: ' + new Date().toISOString() + '\n\n';
bmMd += '## Top 30 Affected BMs by BAD_LABEL Count\n\n';
bmMd += '| # | BM | Total | A_O_TRONG | B_WAVE02 | C_DOCX_REMED | D_DOC_LINE | E_LEGAL | F_SAFE | G_DEFER | H_NOISE |\n';
bmMd += '|---|----|------:|--------:|---------:|------------:|-----------:|--------:|-------:|-------:|-------:|\n';
for (let i = 0; i < topBms.length; i++) {
  const s = topBms[i];
  const g = (l) => s.laneCounts[l] || 0;
  bmMd += '| ' + (i+1) + ' | ' + s.bm + ' | **' + s.total + '** | ' + g('A_O_TRONG_SLOT') + ' | ' + g('B_WAVE_02_GENERIC_SLOT') + ' | ' + g('C_PRIOR_DOCX_REMEDIATION_GENERIC_SLOT') + ' | ' + g('D_DOCUMENT_LINE_METADATA') + ' | ' + g('E_LEGAL_OR_PROCEDURAL_AMBIGUOUS') + ' | ' + g('F_TRUE_SAFE_STRUCTURAL_RENAME') + ' | ' + g('G_DEFER_REQUIRES_ORIGINAL_DOCX_REVIEW') + ' | ' + g('H_DO_NOT_FIX_NOISE_OR_DERIVED') + ' |\n';
}
fs.writeFileSync(path.join(OUT_DIR, 'bm-breakdown.latest.md'), bmMd, 'utf8');
console.log('Written: bm-breakdown.latest.md');

// --- candidate-groups.latest.md ---
let cgMd = '# Candidate Groups — DOCX Slot Naming / Structural Issues\n\n';
cgMd += 'Generated: ' + new Date().toISOString() + '\n\n';
cgMd += '## Grouped by Label + Lane\n\n';
cgMd += '| # | Label | Lane | Count | Contracts | Paths |\n';
cgMd += '|---|-------|------|------:|---------:|------|\n';
for (let i = 0; i < Math.min(groupList.length, 40); i++) {
  const g = groupList[i];
  cgMd += '| ' + (i+1) + ' | `' + (g.currentLabel || '(null)') + '` | ' + g.lane + ' | ' + g.count + ' | ' + g.uniqueContracts + ' | ' + g.uniquePaths + ' |\n';
}
cgMd += '\nTotal groups: ' + groupList.length + '\n\n';
cgMd += '## Top Groups by Count\n\n';
for (let i = 0; i < Math.min(groupList.length, 10); i++) {
  const g = groupList[i];
  cgMd += (i+1) + '. **`' + (g.currentLabel || '(null)') + '`** (' + g.lane + '): ' + g.count + ' items across ' + g.uniqueContracts + ' BMs\n';
}
fs.writeFileSync(path.join(OUT_DIR, 'candidate-groups.latest.md'), cgMd, 'utf8');
console.log('Written: candidate-groups.latest.md');

console.log('\nDone. Output: ' + OUT_DIR);
