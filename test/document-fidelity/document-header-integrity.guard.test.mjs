// test/document-fidelity/document-header-integrity.guard.test.mjs
// RED test: prove that every runtime-ready BM-### template places the legal model-number
// in a floating VML text box (the legacy contract placement) and not in a normal
// first-page header. A form passes only if BOTH the source normalized DOCX and
// the generated DOCX have a non-floating legal header.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const AUDIT_OUT = 'D:/Study/Project/QLLaw-main/docs/audit/document-fidelity/evidence/pre-fix/parts-audit.json';

const FORMS = ['BM-001','BM-136','BM-148','BM-156','BM-157','BM-168','BM-171','BM-174','BM-181','BM-206','BM-213'];

let auditData = null;
test('setup: parts audit must exist (run scripts/audit-docx-parts.mjs first)', () => {
  assert.ok(existsSync(AUDIT_OUT), `missing audit output ${AUDIT_OUT}; run scripts/audit-docx-parts.mjs first`);
  auditData = JSON.parse(readFileSync(AUDIT_OUT, 'utf8'));
  assert.equal(auditData.length, FORMS.length);
});

for (const code of FORMS) {
  test(`header-integrity: source template ${code} must NOT have floating model-number`, () => {
    assert.ok(auditData, 'auditData not loaded');
    const r = auditData.find((x) => x.code === code);
    assert.ok(r, `no audit row for ${code}`);
    assert.ok(r.source, `${code} source parts not present`);
    assert.equal(r.source.structural.anyFloating, false, `source template ${code} still uses floating VML textbox for model-number`);
  });

  test(`header-integrity: generated DOCX ${code} must NOT have floating model-number`, () => {
    assert.ok(auditData, 'auditData not loaded');
    const r = auditData.find((x) => x.code === code);
    assert.ok(r, `no audit row for ${code}`);
    assert.equal(r.structural.anyFloating, false, `generated DOCX ${code} still has floating model-number`);
  });
}