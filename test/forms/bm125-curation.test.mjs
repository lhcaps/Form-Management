/** Verifies BM-125 curation against independent contract and provenance sources. */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(TEST_DIR, '..', '..');
const WEB_ROOT = resolve(PROJECT_ROOT, 'apps', 'web');
const requireFromWeb = createRequire(resolve(WEB_ROOT, 'package.json'));
const ts = requireFromWeb('typescript');

const COMPILED_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/docx/compiled-v2/BM-125.compiled.json',
);
const PROFILE_PATH = resolve(
  WEB_ROOT,
  'src/lib/runtime-ux/bm125-runtime-ux-profile.ts',
);
const PROVENANCE_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md',
);
const MATURITY_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_MATURITY.latest.json',
);

const EXPECTED_PROVENANCE_REFERENCES = [
  'P0001',
  'P0006-P0011',
  'P0012-P0013',
  'P0014-P0015',
  'P0029-P0032',
  'P0035-P0037',
];

const compiled = JSON.parse(readFileSync(COMPILED_PATH, 'utf8'));
const profile = loadProfile(PROFILE_PATH, 'BM125_RUNTIME_UX_PROFILE');
const provenanceRow = readFileSync(PROVENANCE_PATH, 'utf8')
  .split(/\r?\n/u)
  .find((line) => /^\|\s*BM-125\s*\|/u.test(line));
const maturity = JSON.parse(readFileSync(MATURITY_PATH, 'utf8'));

function loadProfile(profilePath, variableName) {
  const sourceText = readFileSync(profilePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    profilePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declarations = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer) {
        declarations.set(declaration.name.text, declaration.initializer);
      }
    }
  }

  const root = declarations.get(variableName);
  assert.ok(root, `${variableName} must exist in ${profilePath}`);
  return evaluateLiteral(root, declarations);
}

function evaluateLiteral(node, declarations) {
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isParenthesizedExpression(node)
  ) {
    return evaluateLiteral(node.expression, declarations);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isIdentifier(node)) {
    const referenced = declarations.get(node.text);
    assert.ok(referenced, `Unsupported profile identifier: ${node.text}`);
    return evaluateLiteral(referenced, declarations);
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => evaluateLiteral(element, declarations));
  }
  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        assert.ok(
          ts.isPropertyAssignment(property),
          `Unsupported profile property: ${property.getText()}`,
        );
        return [
          propertyName(property.name),
          evaluateLiteral(property.initializer, declarations),
        ];
      }),
    );
  }
  throw new Error(`Unsupported profile expression: ${node.getText()}`);
}

function propertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  throw new Error(`Unsupported profile property name: ${name.getText()}`);
}

function validateCuration(candidateProfile, candidateContract, candidateProvenance) {
  const issues = [];
  const compiledFields = candidateContract.source.fields;
  const compiledFieldKeys = compiledFields.map((field) => field.key);
  const contractSectionIds = new Set(
    candidateContract.source.sections.map((section) => section.id),
  );
  const numberLabel = candidateProfile.fields?.['document.soQuyet']?.label ?? '';
  const demoNumber = candidateProfile.demo?.['document.soQuyet'] ?? '';
  const placeholders = Object.values(candidateProfile.fields ?? {}).map(
    (field) => field.placeholder ?? '',
  );
  const presentationSections = candidateProfile.presentationSections;

  if (candidateProfile.templateCode !== candidateContract.templateCode) {
    issues.push('TEMPLATE_CODE_MISMATCH');
  }
  if (/Số quyết định/iu.test(numberLabel)) {
    issues.push('DECISION_LABEL_PRESENT');
  }
  if (!/Số thông báo/iu.test(numberLabel)) {
    issues.push('NOTIFICATION_LABEL_MISSING');
  }
  if (!/\/TB-/iu.test(demoNumber) || /\/QĐ-/iu.test(demoNumber)) {
    issues.push('DEMO_NUMBER_NOT_NOTIFICATION');
  }
  if (placeholders.some((placeholder) => /\(mẫu\s+BM-125\)/iu.test(placeholder))) {
    issues.push('GENERATED_MARKER_PRESENT');
  }
  if (!Array.isArray(presentationSections) || presentationSections.length === 0) {
    issues.push('PRESENTATION_SECTIONS_MISSING');
  } else {
    const presentedKeys = presentationSections.flatMap((section) => section.fieldKeys);
    for (const fieldKey of compiledFieldKeys) {
      if (presentedKeys.filter((key) => key === fieldKey).length !== 1) {
        issues.push(`PRESENTATION_FIELD_COUNT:${fieldKey}`);
      }
    }
    for (const fieldKey of presentedKeys) {
      if (!compiledFieldKeys.includes(fieldKey)) {
        issues.push(`PRESENTATION_FIELD_OUTSIDE_CONTRACT:${fieldKey}`);
      }
    }
    for (const section of presentationSections) {
      if (!contractSectionIds.has(section.id)) {
        issues.push(`PRESENTATION_SECTION_OUTSIDE_CONTRACT:${section.id}`);
      }
      if (!section.description?.trim()) {
        issues.push(`PRESENTATION_SECTION_DESCRIPTION_MISSING:${section.id}`);
      }
    }
  }
  for (const section of candidateProfile.sections ?? []) {
    if (!contractSectionIds.has(section.sectionId)) {
      issues.push(`PROFILE_SECTION_OUTSIDE_CONTRACT:${section.sectionId}`);
    }
    if (!section.description?.trim()) {
      issues.push(`PROFILE_SECTION_DESCRIPTION_MISSING:${section.sectionId}`);
    }
  }
  if (!candidateProvenance) issues.push('PROVENANCE_MISSING');

  return issues;
}

function mutateProfile(mutator) {
  const mutated = structuredClone(profile);
  mutator(mutated);
  return mutated;
}

describe('BM-125 dedicated curation contract', () => {
  it('uses BM-125 as the compiled contract code', () => {
    assert.equal(compiled.templateCode, 'BM-125');
    assert.equal(compiled.source.templateCode, 'BM-125');
  });

  it('identifies the compiled document as a Thông báo', () => {
    assert.match(compiled.title, /Thông báo/iu);
    assert.match(compiled.source.title, /Thông báo/iu);
  });

  it('uses the notification label for document.soQuyet', () => {
    const label = profile.fields['document.soQuyet'].label;
    assert.doesNotMatch(label, /Số quyết định/iu);
    assert.match(label, /Số thông báo/iu);
  });

  it('uses a TB demo number instead of a QĐ demo number', () => {
    const demoNumber = profile.demo['document.soQuyet'];
    assert.match(demoNumber, /\/TB-/iu);
    assert.doesNotMatch(demoNumber, /\/QĐ-/iu);
  });

  it('contains no generated BM-125 placeholder marker', () => {
    const placeholders = Object.values(profile.fields).map(
      (field) => field.placeholder ?? '',
    );
    assert.equal(
      placeholders.some((placeholder) => /\(mẫu\s+BM-125\)/iu.test(placeholder)),
      false,
    );
  });

  it('presents every compiled field exactly once', () => {
    const compiledFieldKeys = compiled.source.fields.map((field) => field.key);
    const presentedKeys = profile.presentationSections.flatMap(
      (section) => section.fieldKeys,
    );
    assert.deepEqual([...presentedKeys].sort(), [...compiledFieldKeys].sort());
    assert.equal(new Set(presentedKeys).size, presentedKeys.length);
  });

  it('does not present fields outside the compiled contract', () => {
    const compiledFieldKeys = new Set(
      compiled.source.fields.map((field) => field.key),
    );
    const outsideFields = profile.presentationSections
      .flatMap((section) => section.fieldKeys)
      .filter((fieldKey) => !compiledFieldKeys.has(fieldKey));
    assert.deepEqual(outsideFields, []);
  });

  it('uses only compiled contract section IDs', () => {
    const sectionIds = new Set(
      compiled.source.sections.map((section) => section.id),
    );
    assert.equal(
      profile.sections.every((section) => sectionIds.has(section.sectionId)) &&
        profile.presentationSections.every((section) => sectionIds.has(section.id)),
      true,
    );
  });

  it('provides descriptions for every displayed section', () => {
    assert.equal(
      profile.sections.every((section) => section.description?.trim()) &&
        profile.presentationSections.every((section) => section.description?.trim()),
      true,
    );
  });

  it('does not promote BM-125 to runtimeReady', () => {
    // Phase 15B.1: 11 forms have curated semantic UI maturity — the
    // form-flight standalone baseline (BM-001, BM-136, BM-148, BM-156,
    // BM-157, BM-168, BM-171, BM-174, BM-181, BM-206, BM-213). BM-125
    // is intentionally NOT in this list; promoting it would require
    // an explicit hand-curated semantic UI profile.
    assert.equal(maturity.summary.runtimeReady.includes('BM-125'), false);
  });

  it('records BM-125 provenance with the reviewed extract references', () => {
    assert.ok(provenanceRow, 'BM-125 provenance row must exist');
    assert.match(
      provenanceRow,
      /docs\/audit\/docx\/extracted\/BM-125__77ec214513fb\.extract\.md/u,
    );
    for (const reference of EXPECTED_PROVENANCE_REFERENCES) {
      assert.ok(
        provenanceRow.includes(reference),
        `BM-125 provenance must cite ${reference}`,
      );
    }
  });

  it('passes the complete curation validator', () => {
    assert.deepEqual(validateCuration(profile, compiled, provenanceRow), []);
  });
});

describe('BM-125 mutation proof', () => {
  it('detects a Số quyết định regression', () => {
    const mutated = mutateProfile((candidate) => {
      candidate.fields['document.soQuyet'].label = 'Số quyết định';
    });
    assert.ok(
      validateCuration(mutated, compiled, provenanceRow).includes(
        'DECISION_LABEL_PRESENT',
      ),
    );
  });

  it('detects missing presentationSections', () => {
    const mutated = mutateProfile((candidate) => {
      delete candidate.presentationSections;
    });
    assert.ok(
      validateCuration(mutated, compiled, provenanceRow).includes(
        'PRESENTATION_SECTIONS_MISSING',
      ),
    );
  });

  it('detects a generated BM-125 marker', () => {
    const mutated = mutateProfile((candidate) => {
      candidate.fields['agency.vienKiem'].placeholder = 'Tên cơ quan (mẫu BM-125)';
    });
    assert.ok(
      validateCuration(mutated, compiled, provenanceRow).includes(
        'GENERATED_MARKER_PRESENT',
      ),
    );
  });

  it('detects missing provenance', () => {
    assert.ok(
      validateCuration(profile, compiled, null).includes('PROVENANCE_MISSING'),
    );
  });
});
