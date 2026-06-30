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

const lines = csv.split('\n').slice(1).filter(l => l.trim());
const header = parseCsvLine(csv.split('\n')[0]);
console.log('Headers:', header);
console.log('Total rows:', lines.length);

const ready = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[4] === 'READY_FOR_FINAL_REVIEW';
});
console.log('\nREADY_FOR_FINAL_REVIEW count:', ready.length);
ready.forEach(l => {
  const cols = parseCsvLine(l);
  console.log(' -', cols[0], '|', cols[2], '|', cols[4]);
});

const notReady = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[4] !== 'READY_FOR_FINAL_REVIEW';
});
console.log('\nNOT READY_FOR_FINAL_REVIEW count:', notReady.length);

// Group by lane for not-ready forms
const laneGroups = {};
notReady.forEach(l => {
  const cols = parseCsvLine(l);
  const lane = cols[2] || 'UNKNOWN';
  if (!laneGroups[lane]) laneGroups[lane] = [];
  laneGroups[lane].push(cols[0]);
});
console.log('\nBy lane:');
Object.entries(laneGroups).forEach(([lane, bms]) => {
  console.log('  ' + lane + ': ' + bms.length + ' forms');
  bms.slice(0, 5).forEach(bm => console.log('    -', bm));
  if (bms.length > 5) console.log('    ... and', bms.length - 5, 'more');
});

// Quality state breakdown
const qualityCol = header.indexOf('Quality state');
const contractRepair = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[qualityCol] === 'CONTRACT_REPAIR_REQUIRED';
});
console.log('\nCONTRACT_REPAIR_REQUIRED:', contractRepair.length);

// Render status breakdown
const renderCol = header.indexOf('Render status');
const renderFail = lines.filter(l => {
  const cols = parseCsvLine(l);
  return cols[renderCol] === 'FAIL';
});
console.log('Render FAIL:', renderFail.length);
renderFail.forEach(l => {
  const cols = parseCsvLine(l);
  console.log('  -', cols[0]);
});
