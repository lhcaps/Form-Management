const fs = require('node:fs');
const xml = fs.readFileSync('D:/Study/Project/QLLaw-main/storage/templates/normalized-docx/BM-058/_extract058/word/document.xml', 'utf8');
const ELL = String.fromCharCode(0x2026);
console.log('ELL:', JSON.stringify(ELL), 'code:', ELL.charCodeAt(0));
console.log('XML includes ELL:', xml.includes(ELL));
const count1 = (xml.match(/\u2026/g) || []).length;
console.log('Match /\\u2026/:', count1);
const count2 = xml.split(ELL).length - 1;
console.log('Split by ELL:', count2);
