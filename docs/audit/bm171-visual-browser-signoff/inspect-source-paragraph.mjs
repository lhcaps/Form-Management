#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import PizZip from 'pizzip';

const buf = readFileSync('storage/templates/normalized-docx/BM-171/BM-171_normalized.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

const paraRe = /<w:p[ >][\s\S]*?<\/w:p>/g;
const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
for (const p of xml.match(paraRe) ?? []) {
  const texts = [];
  for (const m of p.matchAll(textRe)) texts.push(m[1]);
  const visible = texts.join('');
  if (visible.includes('documentCode') || visible.includes('Số:') || visible.includes('documentCode')) {
    console.log('SOURCE NORMALIZED DOCX PARAGRAPH:');
    console.log(visible);
    console.log('  raw XML:');
    console.log(p);
    console.log('---');
  }
}