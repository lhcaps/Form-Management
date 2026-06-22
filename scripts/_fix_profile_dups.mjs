import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';

const codes = ['BM-031', 'BM-044', 'BM-056', 'BM-059'];

for (const code of codes) {
  const profilePath = `scripts/form-refinement/profiles/${code}.json`;
  const raw = readFileSync(profilePath, 'utf8');

  // Check for duplicate keys by parsing and re-stringifying
  const parsed = JSON.parse(raw);
  const uniqueKeys = new Set(Object.keys(parsed.fields));
  const totalKeys = Object.keys(parsed.fields).length;

  console.log(`${code}: totalKeys=${totalKeys} unique=${uniqueKeys.size}`);

  if (totalKeys !== uniqueKeys.size) {
    // Remove duplicates by keeping first occurrence
    const seen = new Set();
    const deduped = {};
    for (const [k, v] of Object.entries(parsed.fields)) {
      if (!seen.has(k)) {
        seen.add(k);
        deduped[k] = v;
      } else {
        console.log(`  removing duplicate key: ${k}`);
      }
    }
    parsed.fields = deduped;
    writeFileSync(profilePath, JSON.stringify(parsed, null, 2));
    console.log(`  fixed: now ${Object.keys(parsed.fields).length} fields`);
  } else {
    console.log('  no duplicates');
  }
}

console.log('Done.');
