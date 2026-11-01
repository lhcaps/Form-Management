import { readFileSync } from 'node:fs';

const profileSrc = readFileSync(
  'apps/web/src/lib/runtime-ux/bm171-runtime-ux-profile.ts',
  'utf8',
);
const startIdx = profileSrc.indexOf('const BM171_DEMO = {');
const openIdx = profileSrc.indexOf('{', startIdx);
let depth = 0;
let endIdx = -1;
for (let i = openIdx; i < profileSrc.length; i++) {
  const ch = profileSrc[i];
  if (ch === '{') depth++;
  else if (ch === '}') {
    depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }
}
const body = profileSrc.slice(openIdx + 1, endIdx);
const keys = [];
const re = /"([^"]+)":\s*"/g;
let m;
while ((m = re.exec(body)) !== null) keys.push(m[1]);

const locked = JSON.parse(
  readFileSync('docs/audit/docx/contracts/locked/BM-171__46b9a8be4e01.contract.locked.json', 'utf8'),
);
const contractPaths = locked.canonicalFields.map((f) => f.path);

const inProfileNotInContract = keys.filter((k) => !contractPaths.includes(k));
const inContractNotInProfile = contractPaths.filter((k) => !keys.includes(k));

console.log('BM171_DEMO keys count:', keys.length);
console.log('Contract canonicalFields count:', contractPaths.length);
console.log('In profile but not in contract:', inProfileNotInContract);
console.log('In contract but not in profile:', inContractNotInProfile);