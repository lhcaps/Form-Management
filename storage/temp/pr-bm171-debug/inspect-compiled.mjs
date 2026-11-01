import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('docs/audit/docx/compiled-v2/BM-171.compiled.json', 'utf8'));
console.log('templateCode:', c.templateCode || c.source?.templateCode);
console.log('field count:', c.source?.fields?.length ?? c.fields?.length);
const src = c.source ?? c;
const keys = (src.fields ?? []).map(f => f.key);
console.log('first 5 keys:');
keys.slice(0, 8).forEach(k => console.log('  ', k));
console.log('has assetListLine in fields?',
  keys.some(k => k.includes('assetListLine')));
console.log('has executionRequestLine in fields?',
  keys.some(k => k.includes('executionRequestLine')));
const renderB = src.renderBindings ?? [];
console.log('renderBinding sample targets:');
renderB.slice(0, 8).forEach(b => console.log(' ', JSON.stringify({ src: b.source?.fieldKey, tgt: b.target?.slotId })));
const fields = src.fields ?? [];
const bm171Fields = fields.filter(f => f.key.startsWith('agency.') || f.key.startsWith('assetReturn.') || f.key.startsWith('assetOwner.'));
console.log('BM-171 specific field count:', bm171Fields.length);
bm171Fields.forEach(f => console.log('  ', f.key, '|', f.control, '|', f.required, '|', f.label));
