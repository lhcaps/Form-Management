const fs = require('fs');
const path = 'test/stage-a/runtime/run-golden-runtime.mjs';
let txt = fs.readFileSync(path, 'utf8');
const old = "    const templatesList = (templatesResp.body && (templatesResp.body.data || templatesResp.body)) || [];";
const next = [
  "    var templatesList = [];",
  "    if (templatesResp.body) {",
  "      if (Array.isArray(templatesResp.body)) templatesList = templatesResp.body;",
  "      else if (templatesResp.body.data && Array.isArray(templatesResp.body.data)) templatesList = templatesResp.body.data;",
  "      else if (templatesResp.body.items && Array.isArray(templatesResp.body.items)) templatesList = templatesResp.body.items;",
  "      else if (templatesResp.body.templates && Array.isArray(templatesResp.body.templates)) templatesList = templatesResp.body.templates;",
  "    }",
  "    evidence.templatesListRaw = templatesResp.body;",
  "    evidence.templatesListCount = templatesList.length;",
].join('\n');
if (txt.indexOf(old) === -1) {
  console.log('NOT FOUND');
  process.exit(1);
}
txt = txt.replace(old, next);
fs.writeFileSync(path, txt, { encoding: 'utf8' });
console.log('patched bytes=', fs.statSync(path).size);
