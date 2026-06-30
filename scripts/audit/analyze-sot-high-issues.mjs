import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseDir = join(__dirname, '..', '..', 'docs', 'audit', 'sot-rebase-v1');

function numberValue(v) {
  if (v === undefined || v === null || v === '') return 0;
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

// Load latest.json for summary
const latest = JSON.parse(readFileSync(join(baseDir, 'latest.json'), 'utf8'));
console.log('=== SOT REBASE SUMMARY ===');
console.log('Total:', latest.issueCounts.total ?? latest.issueCounts.totalIssues);
console.log('Critical:', latest.issueCounts.critical);
console.log('High:', latest.issueCounts.high);
console.log('Medium:', latest.issueCounts.medium);
console.log('Low:', latest.issueCounts.low);
console.log();

// Load individual issue files
const otrongAuto = JSON.parse(readFileSync(join(baseDir, 'otrong-autoapproved.latest.json'), 'utf8'));
const rawMismatch = JSON.parse(readFileSync(join(baseDir, 'raw-pattern-mismatch.latest.json'), 'utf8'));
const hintsStale = JSON.parse(readFileSync(join(baseDir, 'form-input-hints-stale.latest.json'), 'utf8'));
const autoGen = JSON.parse(readFileSync(join(baseDir, 'auto-generated-autoapproved.latest.json'), 'utf8'));
const topCrit = JSON.parse(readFileSync(join(baseDir, 'top-critical.latest.json'), 'utf8'));

console.log('=== ISSUE BREAKDOWN ===');
console.log('OTRONG_AUTOAPPROVED:', (otrongAuto.issues || []).length, '(was auto-approved without human review)');
console.log('RAW_PATTERN_MISMATCH:', (rawMismatch.issues || []).length, '(rawPattern does not match slotId)');
console.log('FORM_INPUT_HINTS_STALE:', (hintsStale.issues || []).length, '(suggestedControls has stale paths)');
console.log('AUTO_GENERATED_AUTOAPPROVED:', (autoGen.issues || []).length, '(auto-generated without human review)');
console.log();

// Analyze OTRONG issues
const otrongIssues = otrongAuto.issues || [];
const otrongByField = {};
otrongIssues.forEach(issue => {
  const field = issue.field || 'unknown';
  if (!otrongByField[field]) otrongByField[field] = [];
  otrongByField[field].push(issue);
});
console.log('=== OTRONG BY FIELD ===');
Object.entries(otrongByField).forEach(([field, issues]) => {
  console.log('  ' + field + ': ' + issues.length + ' issues');
  issues.slice(0, 3).forEach(i => {
    console.log('    - ' + i.slotId || i.path + ' | ' + i.label);
  });
});
console.log();

// Analyze RAW_PATTERN_MISMATCH
const rawIssues = rawMismatch.issues || [];
const rawBySlot = {};
rawIssues.forEach(issue => {
  const slot = issue.slotId || 'unknown';
  if (!rawBySlot[slot]) rawBySlot[slot] = [];
  rawBySlot[slot].push(issue);
});
console.log('=== RAW_PATTERN_MISMATCH BY SLOT ===');
Object.entries(rawBySlot).forEach(([slot, issues]) => {
  console.log('  ' + slot + ': ' + issues.length + ' issues');
  issues.slice(0, 2).forEach(i => {
    console.log('    expected:', i.expected, '| actual:', i.actual, '| generic:', i.generic);
  });
});
console.log();

// Analyze FORM_INPUT_HINTS_STALE
const hintsIssues = hintsStale.issues || [];
const uniquePaths = [...new Set(hintsIssues.map(i => i.path))];
console.log('=== FORM_INPUT_HINTS_STALE ===');
console.log('Total issues:', hintsIssues.length, '| Unique paths:', uniquePaths.length);
console.log('Paths:', uniquePaths.slice(0, 20).join(', '));
console.log();

// Count unique forms for each issue type
function countUniqueForms(issues) {
  const forms = new Set();
  (issues || []).forEach(i => {
    if (i.templateCode) forms.add(i.templateCode);
  });
  return forms.size;
}

console.log('=== UNIQUE FORMS PER ISSUE TYPE ===');
console.log('OTRONG_AUTOAPPROVED forms:', countUniqueForms(otrongIssues));
console.log('RAW_PATTERN_MISMATCH forms:', countUniqueForms(rawIssues));
console.log('FORM_INPUT_HINTS_STALE forms:', countUniqueForms(hintsIssues));
console.log('AUTO_GENERATED forms:', countUniqueForms(autoGen.issues || []));

// Check how many of these are in READY_FOR_FINAL_REVIEW forms
const readyForms = ['BM-001','BM-002','BM-005','BM-006','BM-008','BM-012','BM-015',
  'BM-017','BM-019','BM-065','BM-067','BM-079','BM-089','BM-124','BM-141','BM-144','BM-168'];
const legalReviewForms = ['BM-052','BM-062','BM-063','BM-066','BM-069','BM-096',
  'BM-117','BM-118','BM-136','BM-155','BM-203','BM-212'];

console.log('\n=== OTRONG IN READY_FORMS ===');
const otrongInReady = otrongIssues.filter(i => readyForms.includes(i.templateCode));
console.log('OTRONG in READY forms:', otrongInReady.length);

console.log('\n=== OTRONG IN LEGAL_REVIEW_FORMS ===');
const otrongInLegal = otrongIssues.filter(i => legalReviewForms.includes(i.templateCode));
console.log('OTRONG in LEGAL_REVIEW forms:', otrongInLegal.length);

console.log('\n=== RAW_MISMATCH IN READY_FORMS ===');
const rawInReady = rawIssues.filter(i => readyForms.includes(i.templateCode));
console.log('RAW_MISMATCH in READY forms:', rawInReady.length);

console.log('\n=== AUTO_GENERATED IN READY_FORMS ===');
const autoGenIssues = autoGen.issues || [];
const autoInReady = autoGenIssues.filter(i => readyForms.includes(i.templateCode));
console.log('AUTO_GENERATED in READY forms:', autoInReady.length);
