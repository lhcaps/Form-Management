import PizZip from 'pizzip';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function discoverDocx(code) {
  const path = join(process.cwd(), 'storage/templates/normalized-docx', code, `${code}_normalized.docx`);
  const buf = readFileSync(path);
  const zip = new PizZip(buf);
  const docEntry = zip.file(/^word\/document\.xml$/)[0];
  if (!docEntry) return { error: 'no word/document.xml' };
  const xml = docEntry.asText();
  const pattern = /\{\{([^}]+)\}\}/g;
  const found = [];
  const seen = new Set();
  let m;
  while ((m = pattern.exec(xml)) !== null) {
    const p = m[1].trim();
    if (!seen.has(p)) { seen.add(p); found.push(p); }
  }
  return { paths: found, count: found.length };
}

const contractsDir = join(process.cwd(), 'docs/audit/docx/contracts');

const refined = new Set([
  'BM-001','BM-002','BM-003',
  'BM-005','BM-006','BM-007','BM-008','BM-009','BM-010',
  'BM-011','BM-012','BM-014','BM-015','BM-016','BM-017','BM-018',
  'BM-023','BM-030','BM-031','BM-033',
  'BM-037','BM-038','BM-039','BM-040','BM-042','BM-043','BM-044',
  'BM-045','BM-046','BM-047',
  'BM-053','BM-054','BM-055','BM-056','BM-057','BM-058','BM-059',
  'BM-070','BM-071','BM-085','BM-086','BM-090',
  'BM-097',
  'BM-103','BM-104',
  'BM-141','BM-144',
  'BM-145','BM-146','BM-148',
  'BM-150','BM-156','BM-159',
  'BM-166','BM-168','BM-169','BM-170',
  'BM-171','BM-172','BM-173',
]);

let pass = 0, fail = 0;
const failed = [];

for (const code of [...refined].sort()) {
  const docx = discoverDocx(code);
  if (docx.error) {
    console.log(`FAIL ${code}: docx error: ${docx.error}`);
    fail++; failed.push({ code, reason: 'docx_' + docx.error });
    continue;
  }

  const contractFiles = readdirSync(contractsDir).filter(
    f => f.startsWith(code + '__') && f.endsWith('.contract.draft.json')
  );

  if (contractFiles.length !== 1) {
    console.log(`FAIL ${code}: contract count=${contractFiles.length}`);
    fail++; failed.push({ code, reason: 'contract_count_' + contractFiles.length });
    continue;
  }

  let c;
  try {
    c = JSON.parse(readFileSync(join(contractsDir, contractFiles[0]), 'utf8'));
  } catch(e) {
    console.log(`FAIL ${code}: parse error`);
    fail++; failed.push({ code, reason: 'parse_error' });
    continue;
  }

  const fields = c.canonicalFields || [];
  const slots = c.docxSlots || [];
  const bindings = c.renderBindings || [];
  const generic = fields.filter(f => f.path.match(/^\w+\.field\d+$/)).length;
  const noRR_fields = fields.filter(f => f.reviewRequired !== true).length;
  const noRR_slots = slots.filter(s => s.reviewRequired !== true).length;
  const noRR_bindings = bindings.filter(b => b.reviewRequired !== true).length;
  const noSource_trusted = fields.filter(f => f.source === 'trusted').length;
  const unboundSlots = slots.filter(s => !bindings.find(b => b.slotId === s.slotId)).length;

  const checks = {
    docx_match: docx.count === fields.length,
    slots_match: fields.length === slots.length,
    bindings_match: fields.length === bindings.length,
    no_generic: generic === 0,
    no_rr_slots: noRR_slots === 0,
    no_rr_fields: noRR_fields === 0,
    all_rr_bindings: noRR_bindings === 0,
    no_trusted: noSource_trusted === 0,
    all_bound: unboundSlots === 0,
    draft_status: c.status === 'draft',
  };

  const failedChecks = Object.entries(checks).filter(([,v]) => !v).map(([k]) => k);
  if (failedChecks.length === 0) {
    console.log(`PASS ${code}: docx=${docx.count} cf=${fields.length} slots=${slots.length} bind=${bindings.length} gen=${generic}`);
    pass++;
  } else {
    console.log(`FAIL ${code}: [${failedChecks.join(',')}] docx=${docx.count} cf=${fields.length} gen=${generic}`);
    fail++; failed.push({ code, reasons: failedChecks.join(','), docx: docx.count, cf: fields.length });
  }
}

console.log(`\n=== VERIFICATION SUMMARY ===`);
console.log(`Total: ${pass + fail} / PASS: ${pass} / FAIL: ${fail}`);
if (failed.length > 0) {
  console.log('\nFailed details:');
  failed.forEach(f => console.log(`  ${f.code}: ${f.reasons} (docx=${f.docx} cf=${f.cf})`));
}
