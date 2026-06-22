import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.join(__dirname, '..', 'docs', 'audit', 'docx', 'contracts', 'locked');

for (const code of ['BM-054', 'BM-139', 'BM-159']) {
  const file = fs.readdirSync(base).find(n => n.startsWith(code + '__'));
  if (!file) { console.log(code + ': file not found'); continue; }
  const fp = path.join(base, file);
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
  console.log(`${code}: ${d.renderBindings.length} renderBindings`);
  for (let i = 0; i < d.renderBindings.length; i++) {
    const r = d.renderBindings[i];
    if (typeof r.fallback === 'undefined') {
      console.log(`  rb[${i}]: fallback=undefined, path=${JSON.stringify(r.path)}`);
    }
  }
  console.log();
}
