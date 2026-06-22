import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixes = {
  'BM-054': {
    typeFix: [{ idx: 27, field: 'type', val: 'string' }],
    removeRB: [25, 26, 27]
  },
  'BM-139': {
    typeFix: [
      { idx: 3, field: 'type', val: 'string' },
      { idx: 4, field: 'type', val: 'string' },
      { idx: 5, field: 'type', val: 'string' }
    ],
    removeRB: [4, 5, 6]
  },
  'BM-159': {
    typeFix: [{ idx: 14, field: 'type', val: 'string' }],
    removeRB: [12, 13, 14]
  }
};

const base = path.join(__dirname, '..', 'docs', 'audit', 'docx', 'contracts', 'locked');

for (const [code, fix] of Object.entries(fixes)) {
  const files = fs.readdirSync(base).filter(f =>
    f.startsWith(code + '__') && f.endsWith('.contract.locked.json')
  );
  for (const file of files) {
    const fp = path.join(base, file);
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    for (const { idx, field, val } of fix.typeFix) {
      if (data.canonicalFields[idx] && data.canonicalFields[idx][field]) {
        data.canonicalFields[idx][field] = val;
        console.log(`${code}: cf[${idx}].${field} = "${val}" (${data.canonicalFields[idx].path})`);
      }
    }

    const sorted = [...fix.removeRB].sort((a, b) => b - a);
    for (const idx of sorted) {
      if (data.renderBindings[idx] && data.renderBindings[idx].path === undefined) {
        data.renderBindings.splice(idx, 1);
        console.log(`${code}: removed renderBindings[${idx}] (path=undefined)`);
      }
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Saved: ${file}\n`);
  }
}

console.log('All done!');
