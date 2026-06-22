import fs from 'node:fs';

const xml = fs.readFileSync(
  'D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/_extract058/word/document.xml',
  'utf8'
);

// Find ALL paragraphs containing ellipsis and show their full XML text content
const re = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
let match;
let count = 0;
while ((match = re.exec(xml)) !== null) {
  if (match[0].includes('\u2026')) {
    // Extract text from w:t elements
    const textMatches = [...match[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
    const text = textMatches.map(m => m[1]).join('');
    const blockId = match[0].match(/w14:paraId="([^"]+)"/) || ['N/A'];
    console.log(`\n--- Paragraph ${count + 1} (paraId=${blockId[1]}) ---`);
    console.log(`TEXT: ${text}`);
    // Also show what it looks like in XML
    const cleanXml = match[0].replace(/\n/g, ' ').replace(/>\s+</g, '><');
    console.log(`XML[0:500]: ${cleanXml.substring(0, 500)}`);
    count++;
  }
}
console.log(`\nTotal: ${count} paragraphs with ellipsis`);
