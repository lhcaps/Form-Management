const fs = require('node:fs');
const xmlPath = 'D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/_extract058/word/document.xml';
let xml = fs.readFileSync(xmlPath, 'utf8');

const ELL = String.fromCharCode(0x2026);
console.log('Processing BM-058 ellipsis...');

// Correct paragraph regex: match <w:p...> (no space needed)
const paraRe = /(<w:p[^>]*>)([\s\S]*?)(<\/w:p>)/g;
let match;
let total = 0;

while ((match = paraRe.exec(xml)) !== null) {
  const [full, pStart, content, pEnd] = match;
  const ellCount = (content.match(/\u2026/g) || []).length;
  if (ellCount === 0) continue;

  // Extract text nodes
  const textNodes = [];
  const nodeRe = /<w:t([^>]*)>([^<]*)<\/w:t>/g;
  let nm;
  while ((nm = nodeRe.exec(content)) !== null) {
    textNodes.push({ attrs: nm[1], text: nm[2] });
  }

  // Count ellipsis in text
  const textContent = textNodes.map(n => n.text).join('');
  if (!textContent.includes(ELL)) continue;

  // Replace ellipsis in each text node
  let newContent = content;
  for (const node of textNodes) {
    if (!node.text.includes(ELL)) continue;

    let newText = node.text;
    let idx = 0;
    while (newText.includes(ELL)) {
      newText = newText.replace(ELL, '{{document.placeholder_' + String(++idx).padStart(2, '0') + '}}');
    }

    const oldStr = '<w:t' + node.attrs + '>' + node.text + '</w:t>';
    const newStr = '<w:t' + node.attrs + '>' + newText + '</w:t>';
    newContent = newContent.replace(oldStr, newStr);
  }

  xml = xml.replace(full, pStart + newContent + pEnd);
  total += ellCount;
}

fs.writeFileSync(xmlPath, xml, 'utf8');

const remaining = (xml.match(/\u2026/g) || []).length;
console.log('Ellipsis replaced:', total);
console.log('Ellipsis remaining:', remaining);
