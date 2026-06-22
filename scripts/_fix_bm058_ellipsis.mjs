import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const xmlPath = path.join(dir, '..', 'storage', 'templates', 'normalized-docx', 'BM-058', '_extract058', 'word', 'document.xml');
let xml = fs.readFileSync(xmlPath, 'utf8');

const ELL = String.fromCharCode(0x2026);
console.log('ELL char code:', ELL.charCodeAt(0));

let counter = 1;

function replaceEllipsis(text) {
  const parts = text.split(ELL);
  let result = parts[0];
  for (let i = 1; i < parts.length; i++) {
    result += '{{document.placeholder_' + String(counter++).padStart(2, '0') + '}}' + parts[i];
  }
  return result;
}

const paraRe = /(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/g;
let match;
let total = 0;

while ((match = paraRe.exec(xml)) !== null) {
  const [full, pStart, content, pEnd] = match;
  const count = (content.match(/\u2026/g) || []).length;
  if (count === 0) continue;

  const newContent = replaceEllipsis(content);
  xml = xml.replace(full, pStart + newContent + pEnd);
  total += count;
}

fs.writeFileSync(xmlPath, xml, 'utf8');

const remaining = (xml.match(/\u2026/g) || []).length;
console.log('Ellipsis replaced:', total);
console.log('Ellipsis remaining:', remaining);
