const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const repoRoot = process.cwd();
const contractsDir = 'docs/audit/docx/contracts';
const normalizedDir = 'storage/templates/normalized-docx';

const contractFiles = fs.readdirSync(contractsDir).filter(f => f.endsWith('.contract.draft.json'));
const codes = contractFiles
  .map(f => f.match(/^(BM-\d+)/)?.[1])
  .filter(Boolean);

const candidates = [];
const noDocx = [];

for (const code of codes) {
  const cFiles = contractFiles.filter(f => f.startsWith(code + '__'));
  if (cFiles.length !== 1) continue;
  const c = JSON.parse(fs.readFileSync(path.join(contractsDir, cFiles[0]), 'utf8'));
  const hasGen = (c.canonicalFields ?? []).some(f => f.path.match(/\.field\d+$/));
  if (!hasGen) continue;

  const docxDir = path.join(normalizedDir, code);
  if (!fs.existsSync(docxDir)) { noDocx.push(code); continue; }

  const docxFiles = fs.readdirSync(docxDir).filter(f => f.endsWith('.docx'));
  if (docxFiles.length !== 1) { noDocx.push(code); continue; }

  try {
    const buf = fs.readFileSync(path.join(docxDir, docxFiles[0]));
    const zip = new PizZip(buf);
    const xml = zip.file('word/document.xml')?.asText();
    if (!xml) { noDocx.push(code); continue; }

    const plainText = xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const doubleBrace = (plainText.match(/\{\{[^}]+\}\}/g) || []).length;
    const singleBrace = (plainText.match(/\{[^}]+\}\}/g) || []).length;
    const total = doubleBrace + singleBrace;

    if (total > 0) {
      candidates.push({ code, total, doubleBrace, singleBrace });
    } else {
      noDocx.push(code);
    }
  } catch (e) {
    noDocx.push(code);
  }
}

candidates.sort((a, b) => a.code.localeCompare(b.code));
console.log(`=== CANDIDATES (DOCX placeholders + generic contract): ${candidates.length} ===`);
for (const c of candidates) {
  console.log(`  ${c.code}: ${c.total} placeholders (double=${c.doubleBrace} single=${c.singleBrace})`);
}
console.log(`\n=== NO DOCX PLACEHOLDERS: ${noDocx.length} ===`);
console.log(noDocx.sort().join(', '));
