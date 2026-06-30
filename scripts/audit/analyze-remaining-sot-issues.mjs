import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseDir = join(__dirname, '..', '..', 'docs', 'audit', 'sot-rebase-v1');

// Load OTRONG issues
const otrongIssues = JSON.parse(readFileSync(join(baseDir, 'otrong-autoapproved.latest.json'), 'utf8'));

// Load RAW_PATTERN_MISMATCH issues
const rawMismatch = JSON.parse(readFileSync(join(baseDir, 'raw-pattern-mismatch.latest.json'), 'utf8'));

// Load AUTO_GENERATED issues
const autoGen = JSON.parse(readFileSync(join(baseDir, 'auto-generated-autoapproved.latest.json'), 'utf8'));

console.log('=== SOT ISSUE ANALYSIS ===\n');
console.log('OTRONG_AUTOAPPROVED:', otrongIssues.length);
console.log('RAW_PATTERN_MISMATCH:', rawMismatch.length);
console.log('AUTO_GENERATED_AUTOAPPROVED:', autoGen.length);
console.log();

// Analyze OTRONG by slotId to understand what can be auto-fixed
const otrongBySlot = {};
otrongIssues.forEach(issue => {
  const slotId = issue.slotId || issue.path || 'unknown';
  if (!otrongBySlot[slotId]) otrongBySlot[slotId] = [];
  otrongBySlot[slotId].push(issue);
});

console.log('=== OTRONG BY SLOT (top 20) ===');
const sortedSlots = Object.entries(otrongBySlot).sort((a, b) => b[1].length - a[1].length);
sortedSlots.slice(0, 20).forEach(([slot, issues]) => {
  console.log(`  ${slot}: ${issues.length} issues`);
  issues.slice(0, 2).forEach(i => {
    console.log(`    template: ${i.templateCode || 'N/A'} | label: ${i.label} | reason: ${i.reason.substring(0, 80)}`);
  });
});
console.log();

// Analyze OTRONG by field type (docxSlot vs canonicalField)
const otrongByField = { docxSlot: [], canonicalField: [] };
otrongIssues.forEach(issue => {
  if (issue.field === 'docxSlot') otrongByField.docxSlot.push(issue);
  else if (issue.field === 'canonicalField') otrongByField.canonicalField.push(issue);
  else otrongByField.docxSlot.push(issue);
});
console.log('OTRONG by field type:');
console.log('  docxSlot:', otrongByField.docxSlot.length);
console.log('  canonicalField:', otrongByField.canonicalField.length);
console.log();

// Check if OTRONG issues have tokenId or rawPattern that could help auto-fix
const otrongWithToken = otrongIssues.filter(i => i.tokenId || (i.reason && i.reason.includes('tokenId')));
const otrongWithRawPattern = otrongIssues.filter(i => i.rawPattern || (i.reason && i.reason.includes('rawPattern')));
console.log('OTRONG with tokenId:', otrongWithToken.length);
console.log('OTRONG with rawPattern:', otrongWithRawPattern.length);

// Sample a few OTRONG issues to understand the fix path
console.log('\n=== OTRONG SAMPLE (first 5) ===');
otrongIssues.slice(0, 5).forEach(i => {
  console.log(`  slotId: ${i.slotId || i.path}`);
  console.log(`  field: ${i.field}`);
  console.log(`  label: ${i.label}`);
  console.log(`  reason: ${i.reason}`);
  console.log();
});

// Check RAW_PATTERN_MISMATCH
console.log('\n=== RAW_PATTERN_MISMATCH SAMPLE (first 5) ===');
rawMismatch.slice(0, 5).forEach(i => {
  console.log(`  slotId: ${i.slotId}`);
  console.log(`  expected: ${i.expected}`);
  console.log(`  actual: ${i.actual}`);
  console.log(`  generic: ${i.generic}`);
  console.log();
});

// Count unique forms per issue type
function countUniqueForms(issues) {
  const forms = new Set();
  (issues || []).forEach(i => {
    if (i.templateCode) forms.add(i.templateCode);
  });
  return forms.size;
}
console.log('\n=== UNIQUE FORMS ===');
console.log('OTRONG unique forms:', countUniqueForms(otrongIssues));
console.log('RAW_PATTERN unique forms:', countUniqueForms(rawMismatch));
console.log('AUTO_GEN unique forms:', countUniqueForms(autoGen));

// Check how many READY_FOR_FINAL_REVIEW forms have which issue types
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
