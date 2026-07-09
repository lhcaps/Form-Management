#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import PizZip from 'pizzip';

const buf = readFileSync('storage/templates/normalized-docx/BM-171/BM-171_normalized.docx');
const zip = new PizZip(buf);

const stylesXml = zip.file('word/styles.xml').asText();
console.log('styles.xml byte length:', stylesXml.length);

const sz = [...stylesXml.matchAll(/<w:sz\s+w:val="(\d+)"/g)];
console.log('styles.xml sz values:', JSON.stringify(sz.map(m => m[1])));

const docDef = stylesXml.match(/<w:docDefaults>[\s\S]*?<\/w:docDefaults>/);
console.log('docDefaults in styles.xml:');
console.log(docDef ? docDef[0] : 'NONE');