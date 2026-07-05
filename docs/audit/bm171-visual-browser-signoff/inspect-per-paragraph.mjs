#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import PizZip from 'pizzip';

const buf = readFileSync('docs/audit/bm171-visual-browser-signoff/rendered_with_v2_profile.latest.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

// Only check RUN-LEVEL sizes (not paragraph-default rPr sizes).
const paraRe = /<w:p[ >][\s\S]*?<\/w:p>/g;
const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
const szRe = /<w:sz\s+w:val="(\d+)"/g;

const paragraphs = xml.match(paraRe) ?? [];
console.log('Total non-empty paragraphs:', paragraphs.length);
console.log('---');
for (const p of paragraphs) {
  const texts = [];
  for (const m of p.matchAll(textRe)) texts.push(m[1]);
  const visible = texts.join('').replace(/\s+/g, ' ').trim();
  if (!visible) continue;

  // Collect sizes from <w:r> elements only (not paragraph-default rPr)
  const runs = p.match(/<w:r[ >][\s\S]*?<\/w:r>/g) ?? [];
  const sizes = new Set();
  for (const r of runs) {
    for (const m of r.matchAll(szRe)) sizes.add(parseInt(m[1], 10));
  }
  const sizeList = [...sizes];
  const bold = runs.some((r) => /<w:b\s*\/>/.test(r));
  const italic = runs.some((r) => /<w:i\s*\/>/.test(r));
  console.log(`sz=${JSON.stringify(sizeList)} b=${bold?'Y':'N'} i=${italic?'Y':'N'} | ${visible.slice(0, 80)}`);
}