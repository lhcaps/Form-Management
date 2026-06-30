import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = join(__dirname, '..', '..', 'docs', 'audit', '213-docx-fidelity-board', 'per-bm.csv');
const csv = readFileSync(csvPath, 'utf8');

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

const rootCausePath = join(__dirname, '..', '..', 'docs', 'audit', '213-docx-fidelity-board', 'forms-root-cause', 'latest.json');
let rootCauseData = {};
try {
  rootCauseData = JSON.parse(readFileSync(rootCausePath, 'utf8'));
} catch (e) {
  console.log('Root cause file not found, using CSV only');
}

const header = parseCsvLine(csv.split('\n')[0]);
const lines = csv.split('\n').slice(1).filter(l => l.trim());

// Get READY_FOR_FINAL_REVIEW forms
const readyForms = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[4] === 'READY_FOR_FINAL_REVIEW';
});

console.log('=== READY_FOR_FINAL_REVIEW FORMS ANALYSIS ===\n');
readyForms.forEach(l => {
  const cols = parseCsvLine(l);
  const bm = cols[0];
  const rc = rootCauseData[bm];
  console.log(`${bm}:`);
  console.log(`  Completion: ${cols[4]}`);
  console.log(`  Lane: ${cols[2]}`);
  console.log(`  Risk: ${cols[3]}`);
  console.log(`  Quality: ${cols[8]}`);
  console.log(`  Root issues: ${cols[5]} | FAIL: ${cols[6]} | REVIEW: ${cols[7]}`);
  console.log(`  Render: ${cols[10]}`);
  if (rc) {
    console.log(`  RC - fieldCount: ${rc.rootCause?.fieldCount}, issueCount: ${rc.rootCause?.issueCount}`);
    if (rc.rootCause?.issueCounts) {
      Object.entries(rc.rootCause.issueCounts).forEach(([k, v]) => {
        if (v > 0) console.log(`    ${k}: ${v}`);
      });
    }
  }
  console.log();
});

// Check the PATH_DOMAIN_BINDING forms - what are the actual root causes?
console.log('\n=== PATH_DOMAIN_BINDING SAMPLE ROOT CAUSES ===\n');
const pathDomainRows = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[2] === 'PATH_DOMAIN_BINDING';
});

pathDomainRows.slice(0, 3).forEach(l => {
  const cols = parseCsvLine(l);
  const bm = cols[0];
  const rc = rootCauseData[bm];
  console.log(`${bm}:`);
  if (rc) {
    console.log(`  fieldCount: ${rc.rootCause?.fieldCount}, issueCount: ${rc.rootCause?.issueCount}`);
    if (rc.rootCause?.issueCounts) {
      Object.entries(rc.rootCause.issueCounts).forEach(([k, v]) => {
        if (v > 0) console.log(`    ${k}: ${v}`);
      });
    }
    // Show first few issues
    if (rc.issues) {
      rc.issues.slice(0, 3).forEach(issue => {
        console.log(`  ISSUE: ${issue.severity} | ${issue.lane} | ${issue.fieldPath || issue.slotId || 'N/A'}`);
        console.log(`    rootCause: ${issue.rootCause?.substring(0, 100)}`);
      });
    }
  }
  console.log();
});

// Check how many PATH_DOMAIN_BINDING have FAIL > 0 vs FAIL === 0
const pdFail = pathDomainRows.filter(l => {
  const cols = parseCsvLine(l);
  return parseInt(cols[6]) > 0;
});
const pdReviewOnly = pathDomainRows.filter(l => {
  const cols = parseCsvLine(l);
  return parseInt(cols[6]) === 0 && parseInt(cols[7]) > 0;
});
console.log(`PATH_DOMAIN_BINDING: ${pathDomainRows.length} total`);
console.log(`  With FAIL > 0: ${pdFail.length}`);
console.log(`  REVIEW only (no FAIL): ${pdReviewOnly.length}`);
console.log(`  Total FAIL issues across all: ${pdFail.reduce((sum, l) => sum + parseInt(parseCsvLine(l)[6] || '0'), 0)}`);
