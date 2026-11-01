const fs = require('fs');
const path = 'test/stage-a/runtime/run-golden-runtime.mjs';
let txt = fs.readFileSync(path, 'utf8');
const old = [
  "      const createResp = await client.createCase({",
  "        caseTitle: deterministicCaseName(stamp),",
  "        summary: 'Stage A runtime harness - execution-owned case ' + stamp,",
  "      });",
].join('\n');
const next = [
  "      const createResp = await client.createCase({",
  "        caseCode: 'STAGE-A-' + stamp,",
  "        caseTitle: deterministicCaseName(stamp),",
  "        caseSummary: 'Stage A runtime harness - execution-owned case ' + stamp,",
  "        caseType: 'CRIMINAL_CASE',",
  "        priority: 'NORMAL',",
  "      });",
].join('\n');
if (txt.indexOf(old) === -1) {
  console.log('NOT FOUND; snippet near createCase:');
  const i = txt.indexOf('createCase({');
  console.log(txt.substring(i, i + 400));
  process.exit(1);
}
txt = txt.replace(old, next);
fs.writeFileSync(path, txt, { encoding: 'utf8' });
console.log('patched bytes=', fs.statSync(path).size);
