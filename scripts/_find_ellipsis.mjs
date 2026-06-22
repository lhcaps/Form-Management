import fs from 'node:fs';

const xml = fs.readFileSync(
  'D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/_extract058/word/document.xml',
  'utf8'
);

const re = /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g;
let match;
let count = 0;
while ((match = re.exec(xml)) !== null && count < 20) {
  if (match[0].includes('\u2026')) {
    const textMatches = [...match[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)];
    const text = textMatches.map(m => m[1]).join('');
    const paraId = match[0].match(/w14:paraId="([^"]+)"/) || ['N/A'];
    console.log(`paraId=${paraId[1]} | ${text.substring(0, 300)}`);
    count++;
  }
}
