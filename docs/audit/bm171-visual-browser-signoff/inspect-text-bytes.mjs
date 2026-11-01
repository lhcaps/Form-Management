#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import PizZip from 'pizzip';

const buf = readFileSync('docs/audit/bm171-visual-browser-signoff/rendered_with_v2_profile.latest.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

const paraRe = /<w:p[ >][\s\S]*?<\/w:p>/g;
const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
for (const p of xml.match(paraRe) ?? []) {
  const texts = [];
  for (const m of p.matchAll(textRe)) texts.push(m[1]);
  const visible = texts.join('');
  if (visible.includes('Căn cứ Điều 134')) {
    console.log('PARAGRAPH TEXT BYTES:');
    for (let i = 0; i < visible.length && i < 10; i++) {
      console.log(`  [${i}] char=${JSON.stringify(visible[i])} code=${visible.charCodeAt(i).toString(16)}`);
    }
    console.log('  full text:', JSON.stringify(visible));
  }
}