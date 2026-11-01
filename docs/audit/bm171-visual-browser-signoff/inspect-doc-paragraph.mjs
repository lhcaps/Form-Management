#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import PizZip from 'pizzip';

const buf = readFileSync('docs/audit/bm171-visual-browser-signoff/rendered_with_v2_profile.latest.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();

// Find paragraphs containing "Số:" 
const paraRe = /<w:p[ >][\s\S]*?<\/w:p>/g;
const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
for (const p of xml.match(paraRe) ?? []) {
  const texts = [];
  for (const m of p.matchAll(textRe)) texts.push(m[1]);
  const visible = texts.join('');
  if (visible.includes('01/Q') || visible.startsWith('Số') || visible === 'Số:01') {
    console.log('FULL XML OF INTERESTING PARAGRAPH:');
    console.log(p);
    console.log('---');
  }
}