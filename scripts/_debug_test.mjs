import PizZip from 'pizzip';
import { readFileSync } from 'node:fs';

function decodeXml(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function plainTextFromXml(value) {
  return decodeXml(value.replace(/<[^>]+>/gu, ''));
}

const xml = new PizZip(readFileSync('storage/templates/normalized-docx/BM-031/BM-031_normalized.docx')).file('word/document.xml').asText();

// Find the split area
const pos = xml.indexOf('{{agency.bodyName}');
// Get context around it
const contextAround = xml.slice(pos - 50, pos + 200);
console.log('Context around split:');
console.log(JSON.stringify(contextAround));

// Find </w:r> boundaries
const closeRun = xml.lastIndexOf('</w:r>', pos);
const nextCloseRun = xml.indexOf('</w:r>', pos);
console.log('\nPrev </w:r> at:', closeRun);
console.log('Next </w:r> at:', nextCloseRun);

// Check what my script's pattern finds
const pat = /<w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t[^>]*>(\})<\/w:t><\/w:r>/g;
const matches = [...contextAround.matchAll(pat)];
console.log('\nPattern matches:', matches.length);

// Test merge approach: fix </w:t>} </w:t></w:r> to </w:t>}} </w:t></w:r>
const malformed = '{{agency.bodyName}</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:bCs/><w:szCs w:val="28"/></w:rPr><w:t>} </w:t></w:r>';
const replacement = '{{agency.bodyName}} </w:t></w:r>';
console.log('\nReplace:', JSON.stringify(malformed.slice(0, 50) + '...'));
console.log('With:', JSON.stringify(replacement));
