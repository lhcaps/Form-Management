#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import PizZip from 'pizzip';

const buf = readFileSync('storage/templates/normalized-docx/BM-171/BM-171_normalized.docx');
const zip = new PizZip(buf);
const xml = zip.file('word/document.xml').asText();
writeFileSync('docs/audit/bm171-visual-browser-signoff/source_normalized_xml.latest.xml', xml);
console.log('Source XML bytes:', xml.length);

const szMatches = [...xml.matchAll(/<w:sz\s+w:val="(\d+)"/g)];
const counts = {};
for (const m of szMatches) counts['sz_' + m[1]] = (counts['sz_' + m[1]] ?? 0) + 1;
console.log('Source w:sz distribution:', JSON.stringify(counts));

const docDefaultsMatch = xml.match(/<w:docDefaults>[\s\S]*?<\/w:docDefaults>/);
console.log('Source docDefaults (first 800 chars):');
console.log(docDefaultsMatch ? docDefaultsMatch[0].slice(0, 800) : 'NOT FOUND');

// Print any default rPr at the top of docDefaults
const defaultRPr = xml.match(/<w:rPrDefault>[\s\S]*?<\/w:rPrDefault>/);
console.log('Source rPrDefault:');
console.log(defaultRPr ? defaultRPr[0] : 'NOT FOUND');