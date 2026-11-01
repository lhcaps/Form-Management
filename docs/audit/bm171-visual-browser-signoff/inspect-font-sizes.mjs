#!/usr/bin/env node
/**
 * BM-171 rendered DOCX font-size audit.
 *
 * Read-only diagnostic. Inspects the rendered BM-171 DOCX and reports
 * distribution of <w:sz> values, docDefaults, and per-paragraph
 * sz summary.
 */

import { readFileSync } from 'node:fs';

const xml = readFileSync(
  'docs/audit/bm171-visual-browser-signoff/rendered_document_xml.latest.xml',
  'utf8',
);

const szMatches = [...xml.matchAll(/<w:sz\s+w:val="(\d+)"/g)];
const szCsMatches = [...xml.matchAll(/<w:szCs\s+w:val="(\d+)"/g)];
const counts = {};
for (const m of szMatches) counts['sz_' + m[1]] = (counts['sz_' + m[1]] ?? 0) + 1;
const csCounts = {};
for (const m of szCsMatches) csCounts['szCs_' + m[1]] = (csCounts['szCs_' + m[1]] ?? 0) + 1;
console.log('w:sz (run primary size, half-points):');
console.log(JSON.stringify(counts, null, 2));
console.log('w:szCs (run complex size, half-points):');
console.log(JSON.stringify(csCounts, null, 2));

const docDefaultsMatch = xml.match(/<w:docDefaults>[\s\S]*?<\/w:docDefaults>/);
console.log('docDefaults block (first 800 chars):');
console.log(docDefaultsMatch ? docDefaultsMatch[0].slice(0, 800) : 'NOT FOUND');

const paragraphMatches = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)];
const paragraphStats = paragraphMatches.map((p, idx) => {
  const text = (p[0].match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g) ?? [])
    .map((t) => {
      const m = t.match(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/);
      return m ? m[1] : '';
    })
    .join('');
  const runsSz = (p[0].match(/<w:sz\s+w:val="(\d+)"/g) ?? []).map((m) =>
    Number(m.match(/="(\d+)"/)[1]),
  );
  const runsBold = /<w:b\s*\/>/.test(p[0]) || /<w:b\s+w:val="true"/.test(p[0]);
  return {
    idx,
    visibleText: text.slice(0, 80),
    szValues: [...new Set(runsSz)],
    bold: runsBold,
    paragraphLen: text.length,
  };
});

console.log('\nPer-paragraph sz summary (first 80 chars of text):');
for (const p of paragraphStats) {
  console.log(
    `[#${p.idx}] sz=${p.szValues.join(',') || '(none)'} bold=${p.bold} len=${p.paragraphLen} text="${p.visibleText}"`,
  );
}