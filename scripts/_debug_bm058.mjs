import fs from 'node:fs';

const xml = fs.readFileSync(
  'D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/_extract058/word/document.xml',
  'utf8'
);

const ELL = '\u2026';

// This is the EXACT pattern from the script that didn't match
const pattern = 'Căn cứ Quyết định khởi tố bị can số ' + ELL + ' ngày ' + ELL + ' tháng ' + ELL + ' năm ' + ELL + ' (Quyết định thay đổi/bổ sung Quyết định khởi tố bị can số ' + ELL + ' ngày ' + ELL + ' tháng ' + ELL + ' năm ' + ELL + ', nếu có) của' + ELL + ' đối với' + ELL + ' về tội ' + ELL + ' quy định tại khoản ' + ELL + ' Điều ' + ELL + ' của Bộ luật Hình sự; ';

const idx = xml.indexOf('khởi tố bị can');
const pStart = xml.lastIndexOf('<w:p', idx);
const pEnd = xml.indexOf('</w:p>', idx) + 6;
const para = xml.substring(pStart, pEnd);

// Get text from text nodes
const texts = [...para.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map(m => m[1]);
const xmlText = texts.join('');

console.log('Match?', pattern === xmlText);
console.log('Pattern len:', pattern.length, 'XML len:', xmlText.length);
if (pattern.length !== xmlText.length) {
  console.log('Length differs by:', pattern.length - xmlText.length);
}
if (pattern !== xmlText) {
  for (let i = 0; i < Math.max(pattern.length, xmlText.length); i++) {
    if (pattern[i] !== xmlText[i]) {
      console.log('Diff at', i, ':');
      console.log('  Pattern:', JSON.stringify(pattern.substring(i, i + 30)));
      console.log('  XML:     ', JSON.stringify(xmlText.substring(i, i + 30)));
      break;
    }
  }
}
