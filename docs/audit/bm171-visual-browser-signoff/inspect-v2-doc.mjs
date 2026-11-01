#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import PizZip from 'pizzip';

const buf = readFileSync('docs/audit/bm171-visual-browser-signoff/rendered_with_v2_profile.latest.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
writeFileSync('docs/audit/bm171-visual-browser-signoff/rendered_v2_xml.latest.xml', xml);

// Find the paragraph containing the documentCode
const paraRe = /<w:p[ >][\s\S]*?<\/w:p>/g;
const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
let count = 0;
for (const p of xml.match(paraRe) ?? []) {
  const texts = [];
  for (const m of p.matchAll(textRe)) texts.push(m[1]);
  const visible = texts.join('');
  if (visible.includes('Số') || visible.includes('01/Q')) {
    count++;
    console.log('---PARAGRAPH #' + count + '---');
    console.log(JSON.stringify(visible));
    console.log('  size:', [...p.matchAll(/<w:sz\s+w:val="(\d+)"/g)].map(m => m[1]).join(','));
    console.log('  bold:', /<w:b\s*\/>/.test(p) ? 'YES' : 'no');
    console.log('  raw XML (first 1200 chars):');
    console.log(p.slice(0, 1200));
  }
}