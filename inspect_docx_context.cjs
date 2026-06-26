/**
 * inspect_docx_context.cjs
 * Inspect normalized DOCX XML context for specific slot paths.
 * PLANNING ONLY.
 */

const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const NORM_DIR = path.join(process.cwd(), 'storage', 'templates', 'normalized-docx');

function getDocxContext(templateCode, slotPath) {
  const normPath = path.join(NORM_DIR, templateCode, `${templateCode}_normalized.docx`);
  if (!fs.existsSync(normPath)) return { found: false, error: 'file not found' };

  try {
    const buf = fs.readFileSync(normPath);
    if (buf[0] !== 0x50 || buf[1] !== 0x4B) return { found: false, error: 'not a zip' };
    const zip = new PizZip(buf);

    const results = {};
    const searchParts = ['word/document.xml', 'word/header1.xml', 'word/header2.xml',
      'word/footer1.xml', 'word/footer2.xml'];

    for (const partName of searchParts) {
      const file = zip.file(partName);
      if (!file) continue;
      const xmlStr = file.asText();

      const variant = '{{' + slotPath + '}}';

      let idx = xmlStr.indexOf(variant);
      if (idx >= 0) {
        const start = Math.max(0, idx - 400);
        const end = Math.min(xmlStr.length, idx + variant.length + 400);
        const snippet = xmlStr.slice(start, end);
        const text = snippet
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
          .replace(/\s+/g, ' ').trim();
        results[partName] = { offset: idx, context: text };
      }
    }

    const keys = Object.keys(results);
    if (keys.length === 0) return { found: false, error: 'placeholder not in docx' };
    return { found: true, matches: results };
  } catch (e) {
    return { found: false, error: e.message };
  }
}

// Inspect Wave 02 BMs
const wave02Paths = [
  { bm: 'BM-068', path: 'document.fullDocumentCode' },
  { bm: 'BM-068', path: 'person.dateOfBirth' },
  { bm: 'BM-069', path: 'document.fullDocumentCode' },
  { bm: 'BM-163', path: 'document.fullDocumentCode' },
  { bm: 'BM-080', path: 'document.fullDocumentCode' },
];

// O trong items
const oTrongItems = [
  { bm: 'BM-004', path: 'document.vietTat' },
  { bm: 'BM-004', path: 'agency.diaDanh' },
  { bm: 'BM-013', path: 'agency.tenCo' },
  { bm: 'BM-021', path: 'agency.issuePlace' },
  { bm: 'BM-021', path: 'decision.decisionLine' },
];

// Prior DOCX remediation items
const priorRemedItems = [
  { bm: 'BM-002', path: 'decision.decisionLine3' },
  { bm: 'BM-002', path: 'decision.decisionLine2' },
];

// Document line metadata items
const docLineItems = [
  { bm: 'BM-002', path: 'recipients.archiveLine' },
  { bm: 'BM-002', path: 'recipients.primaryLine' },
];

function print(label, bm, slotPath) {
  console.log('=== ' + label + ': ' + bm + ' / ' + slotPath + ' ===');
  const result = getDocxContext(bm, slotPath);
  if (result.found) {
    for (const [part, data] of Object.entries(result.matches)) {
      console.log('[' + part + '] ' + data.context);
    }
  } else {
    console.log('  NOT FOUND: ' + result.error);
  }
  console.log('');
}

for (const item of wave02Paths) print('WAVE02', item.bm, item.path);
for (const item of oTrongItems) print('O_TRONG', item.bm, item.path);
for (const item of priorRemedItems) print('PRIOR_REMED', item.bm, item.path);
for (const item of docLineItems) print('DOC_LINE', item.bm, item.path);
