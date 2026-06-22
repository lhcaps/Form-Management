import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, '..', 'docs', 'audit', 'docx', 'contracts', 'locked');

// The fixed DOCX SHA256 (from earlier)
const NEW_SHA = '2d1177e634cd77c4e3eaaebeb02252fd613e5380597956f8ba1525048ff43f08';

const files = fs.readdirSync(base).filter(f => f.startsWith('BM-058__') && f.endsWith('.contract.locked.json'));
for (const file of files) {
  const fp = path.join(base, file);
  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

  const oldSha = data.extractionSource?.sha256;
  if (oldSha === NEW_SHA) {
    console.log(`${data.templateCode}: SHA already up to date`);
    continue;
  }

  console.log(`${data.templateCode}: updating extractionSource.sha256`);
  console.log(`  Old: ${oldSha}`);
  console.log(`  New: ${NEW_SHA}`);

  data.extractionSource.sha256 = NEW_SHA;

  // Also verify docxSlots use proper field names (no document.fieldN or generic fields)
  const badSlots = data.docxSlots.filter(s =>
    s.slotId.includes('.field') ||
    s.slotId === 'document.tenViet' ||
    s.slotId === 'document.field1' ||
    s.slotId === 'document.field2' ||
    s.slotId === 'document.field3' ||
    s.slotId === 'document.field4' ||
    s.slotId === 'document.field5' ||
    s.slotId === 'document.field6' ||
    s.slotId === 'document.field7' ||
    s.slotId === 'document.field8' ||
    s.slotId === 'document.field9' ||
    s.slotId === 'document.field10' ||
    s.slotId === 'document.field11' ||
    s.slotId === 'document.field12' ||
    s.slotId === 'document.field13'
  );

  if (badSlots.length > 0) {
    console.log(`  WARNING: ${badSlots.length} slots still have generic field names:`);
    badSlots.forEach(s => console.log(`    - ${s.slotId} (context: "${s.context}")`));
  } else {
    console.log(`  Slots: all have proper semantic field names`);
  }

  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  Saved\n`);
}

console.log('Done!');
