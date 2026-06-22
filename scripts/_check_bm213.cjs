const fs = require('node:fs');
const path = require('node:path');
const os = require('os');
const { execSync } = require('child_process');

// Extract BM-213 normalized docx
const baseDir = 'D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-213';
const docxFile = path.join(baseDir, 'BM-213_normalized.docx');
const tmpDir = path.join(os.tmpdir(), 'bm213_check');
const tmpZip = path.join(os.tmpdir(), 'bm213_check.zip');

if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true });
if (fs.existsSync(tmpZip)) fs.unlinkSync(tmpZip);

fs.copyFileSync(docxFile, tmpZip);
execSync(`powershell -Command "Expand-Archive -Path '${tmpZip}' -DestinationPath '${tmpDir}' -Force"`, { stdio: 'pipe' });

const docXml = fs.readFileSync(path.join(tmpDir, 'word', 'document.xml'), 'utf8');

// Count ellipsis
const ellipsisCount = (docXml.match(/\u2026/g) || []).length;
const dotsCount = (docXml.match(/\.\./g) || []).length;

console.log('BM-213 normalized.docx:');
console.log('  File size:', fs.statSync(docxFile).size, 'bytes');
console.log('  Ellipsis chars (U+2026):', ellipsisCount);
console.log('  Double dots (..):', dotsCount);

// Find paragraphs with ellipsis
const paraRe = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
let match;
const paras = [];
while ((match = paraRe.exec(docXml)) !== null) {
  const text = (match[1].match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || []).map(m => m.replace(/<[^>]+>/g, '')).join('');
  if (text.includes('\u2026') || text.match(/\.\./)) {
    paras.push(text.substring(0, 100));
  }
}
console.log('\n  Paragraphs with dots/ellipsis:', paras.length);
paras.forEach((p, i) => console.log('  [' + i + '] ' + p));

// Count unique placeholders
const placeholders = [...docXml.matchAll(/\{\{([^}]+)\}\}/g)].map(m => m[1]);
const unique = [...new Set(placeholders)].sort();
console.log('\n  Unique placeholders:', unique.join(', '));

// Cleanup
fs.rmSync(tmpDir, { recursive: true });
fs.unlinkSync(tmpZip);
