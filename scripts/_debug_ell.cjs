const fs = require('node:fs');
const xml = fs.readFileSync('D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/_extract058/word/document.xml', 'utf8');
const ELL = String.fromCharCode(0x2026);

// Test the paragraph regex
const paraRe = /(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/g;
let match;
let totalEll = 0;
let paraCount = 0;
while ((match = paraRe.exec(xml)) !== null) {
  paraCount++;
  const ell = (match[2].match(/\u2026/g) || []).length;
  if (ell > 0) totalEll += ell;
}
console.log('Total paragraphs:', paraCount);
console.log('Total ellipsis found:', totalEll);

// Test a specific paragraph
const idx = xml.indexOf('Số:');
if (idx >= 0) {
  const pStart = xml.lastIndexOf('<w:p', idx);
  const pEnd = xml.indexOf('</w:p>', idx) + 6;
  const para = xml.substring(pStart, pEnd);
  const ell2 = (para.match(/\u2026/g) || []).length;
  console.log('\nSố: paragraph length:', para.length);
  console.log('Số: paragraph ellipsis:', ell2);
  console.log('Contains "Số:":', para.includes('Số:'));
  console.log('Contains ELL:', para.includes(ELL));
  console.log('Contains backslash-u2026:', para.includes('\\u2026'));
}

const paraRe2 = /(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/g;
let m;
while ((m = paraRe2.exec(xml)) !== null) {
  const pStart2 = xml.substring(0, m.index).split('<w:p').length - 1;
  if (m[2].includes('Số:')) {
    console.log('\nPara # containing Số::', pStart2);
    console.log('Content ellipsis:', (m[2].match(/\u2026/g) || []).length);
    console.log('Content first 100 chars:', m[2].substring(0, 100));
    break;
  }
}
