// Convert any UTF-16 LE files in scripts/stage-a/ and test/stage-a/ to UTF-8.
const fs = require('fs');
const path = require('path');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.(mjs|cjs|js|ts|json|md)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const dirs = ['scripts/stage-a', 'test/stage-a'];
const files = dirs.flatMap(walk);
let converted = 0;
for (const f of files) {
  const b = fs.readFileSync(f);
  let utf16 = false;
  for (let i = 0; i < Math.min(64, b.length); i += 2) {
    if (b[i] !== 0 && b[i+1] === 0) { utf16 = true; break; }
  }
  if (utf16) {
    const text = b.toString('utf16le').replace(/^\uFEFF/, '');
    fs.writeFileSync(f, text, { encoding: 'utf8' });
    converted++;
    console.log('converted', f);
  }
}
console.log('total converted:', converted);
