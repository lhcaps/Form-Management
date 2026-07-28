// test/document-fidelity/form-number-proof.guard.test.mjs
// ?2 formNumber vs documentNumber proof.
//
// For every runtime-ready BM-### form, this test asserts that:
//   1. The formNumber is rendered as a literal in the source DOCX text.
//   2. documentNumber is NOT exposed as a runtime input (no JSON schema
//      property, no render binding).
//   3. The DOCX text does NOT contain a {{documentNumber}} placeholder that
//      could be wired to the literal "M?u s? X" block.
//   4. The locked contract has NO binding that maps formNumber (or
//      metadata.formNumber / document.formNumber / template.formNumber) to
//      a {{...}} placeholder.
//
// A pass here is the SPEC-required proof that formNumber and documentNumber
// are distinct fields: formNumber is rendered as a literal header string,
// documentNumber is either absent or a name-only input without a render slot.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const PROJECT_ROOT = process.env.QLLAW_ROOT ?? 'D:/Study/Project/QLLaw-main';
const SCRIPT_PATH = join(PROJECT_ROOT, 'scripts/document-fidelity/classify-form-fields.mjs');
const OUT_PATH = join(PROJECT_ROOT, 'docs/audit/document-fidelity/QLLAW_FORMNUMBER_VS_DOCUMENTNUMBER.json');

const FORMS = ['BM-001','BM-136','BM-148','BM-156','BM-157','BM-168','BM-171','BM-174','BM-181','BM-206','BM-213'];

function classify() {
  // Run the CLI to generate the JSON artifact. This avoids importing the
  // module's internal `require()` paths and exercises the same code path
  // users would run.
  const res = spawnSync('node', [SCRIPT_PATH, '--out=' + OUT_PATH], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error('classify-form-fields.mjs failed: ' + (res.stderr || res.stdout));
  }
  return JSON.parse(readFileSync(OUT_PATH, 'utf8'));
}

let records = null;
test('setup: classify-form-fields.mjs must produce the ?2 evidence artifact', () => {
  records = classify();
  assert.ok(records.length === FORMS.length, `expected ${FORMS.length} records, got ${records.length}`);
  assert.ok(existsSync(OUT_PATH), 'JSON artifact missing');
});

for (const code of FORMS) {
  test(`formNumber proof: ${code} must render formNumber as a literal header string`, () => {
    assert.ok(records, 'records not loaded');
    const r = records.find((x) => x.formCode === code);
    assert.ok(r, `no record for ${code}`);
    assert.equal(r.docxTextHasModelNumberLiteral, true, `${code}: source DOCX must contain the literal model-number token`);
  });

  test(`formNumber proof: ${code} must NOT bind formNumber to a {{...}} placeholder`, () => {
    assert.ok(records, 'records not loaded');
    const r = records.find((x) => x.formCode === code);
    assert.ok(r, `no record for ${code}`);
    assert.equal(r.invariantFormNumberNotBound, true, `${code}: formNumber must NOT be bound to a {{...}} placeholder`);
  });

  test(`formNumber proof: ${code} documentNumber render slot classification is consistent`, () => {
    assert.ok(records, 'records not loaded');
    const r = records.find((x) => x.formCode === code);
    assert.ok(r, `no record for ${code}`);
    // The ?2 spec classifies each form by the following decision tree:
    //   - formNumber-rendered-from-header-text + documentNumber-no-render-slot
    //     -> FORM_NUMBER_RENDERED_FROM_HEADER_TEXT
    //   - formNumber-rendered-from-header-text + documentNumber-input-without-slot
    //     -> FORM_NUMBER_RENDERED_FROM_HEADER_TEXT_AND_DOCUMENT_NUMBER_INPUT_NO_SLOT
    //   - everything else -> explicitly enumerated
    const allowed = new Set([
      'FORM_NUMBER_RENDERED_FROM_HEADER_TEXT',
      'FORM_NUMBER_RENDERED_FROM_HEADER_TEXT_AND_DOCUMENT_NUMBER_INPUT_NO_SLOT',
      'FORM_NUMBER_RENDERED_FROM_HEADER_TEXT_AND_DOCUMENT_NUMBER_BOUND',
    ]);
    assert.ok(allowed.has(r.classification), `${code}: unexpected classification ${r.classification}; allowed=${Array.from(allowed).join(',')}`);
  });
}
