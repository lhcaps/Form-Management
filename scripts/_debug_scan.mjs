import { readFileSync } from 'node:fs';
import JSZip from 'jszip';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();

async function checkDocx(code) {
  const docxPath = `${repoRoot}/storage/templates/normalized-docx/${code}/${code}_normalized.docx`;
  try {
    const data = readFileSync(docxPath);
    const zip = await JSZip.loadAsync(data);
    const xml = await zip.file('word/document.xml')?.async('string');
    if (!xml) {
      console.log(`${code}: no word/document.xml`);
      return;
    }

    // Count placeholder patterns
    const doubleBrace = (xml.match(/\{\{[^}]+\}\}/g) || []).length;
    const singleBrace = (xml.match(/\{[^}]+\}\}/g) || []).length;
    const rawContent = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    console.log(`${code}: doubleBrace=${doubleBrace} singleBrace=${singleBrace} xmlLen=${xml.length}`);

    // Check for problematic patterns
    const splitDouble = (xml.match(/\}\s*<\/?[^>]+>\s*\{/g) || []).length;
    const splitSingle = (xml.match(/\}\s*<\/?[^>]+>\s*\{/g) || []).length;
    if (splitDouble > 0 || splitSingle > 0) {
      console.log(`  WARNING: split patterns found: double=${splitDouble}`);
    }
  } catch (e) {
    console.log(`${code}: ERROR ${e.message}`);
  }
}

const codes = ['BM-019', 'BM-021', 'BM-024', 'BM-027', 'BM-034', 'BM-035', 'BM-041', 'BM-005'];
for (const code of codes) {
  await checkDocx(code);
}
