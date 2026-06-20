import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const rendererPath = path.join(
  repoRoot,
  'apps',
  'web',
  'src',
  'features',
  'forms-contracts',
  'ContractV2Renderer.tsx',
);
const runtimePanelPath = path.join(
  repoRoot,
  'apps',
  'web',
  'src',
  'components',
  'documents',
  'published-contract-form-inputs.tsx',
);
const compiledDirectory = path.join(
  repoRoot,
  'docs',
  'audit',
  'docx',
  'compiled-v2',
);
const fixturePath = path.join(
  repoRoot,
  'packages',
  'form-contracts',
  'fixtures',
  'synthetic-v2.contract.json',
);
const supportedControls = new Set([
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'PARTIAL_DATE',
  'TIME',
  'SELECT',
  'RADIO',
  'CHECKBOX',
  'AGENCY_PICKER',
  'OFFICIAL_PICKER',
  'PERSON_PICKER',
  'READONLY',
  'COMPUTED',
]);

assert.ok(fs.existsSync(rendererPath), 'ContractV2Renderer.tsx is missing.');
assert.ok(
  fs.existsSync(runtimePanelPath),
  'Published runtime panel is missing.',
);
const rendererSource = fs.readFileSync(rendererPath, 'utf8');
for (const requiredFeature of [
  'repeatableGroups',
  'tables',
  'conditionalRules',
  'COMPUTED',
  'CHECKBOX',
  'SELECT',
]) {
  assert.ok(
    rendererSource.includes(requiredFeature),
    `Renderer registry does not expose ${requiredFeature}.`,
  );
}

const contractFiles = [
  fixturePath,
  ...(fs.existsSync(compiledDirectory)
    ? fs
        .readdirSync(compiledDirectory)
        .filter((file) => file.endsWith('.json'))
        .map((file) => path.join(compiledDirectory, file))
    : []),
];
let fieldCount = 0;
for (const file of contractFiles) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const contract = json.source ?? json;
  for (const field of contract.fields ?? []) {
    fieldCount += 1;
    assert.ok(
      supportedControls.has(field.control),
      `${path.basename(file)} uses unsupported control ${field.control}.`,
    );
  }
  for (const table of contract.tables ?? []) {
    assert.ok(
      table.rowLoopStart,
      `${path.basename(file)} table ${table.key} has no row loop marker.`,
    );
  }
}

console.log(
  `FORM_UI_SYNC_OK contracts=${contractFiles.length} fields=${fieldCount} controls=${supportedControls.size}`,
);
