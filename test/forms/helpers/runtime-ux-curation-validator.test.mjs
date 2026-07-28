/**
 * Unit tests for the shared runtime-ux curation validator.
 *
 * Verifies the helper loads profiles via the TypeScript AST (no eval),
 * throws on unsupported node kinds, and reports every invariant the
 * per-batch tests depend on.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  loadProfile,
  mutateProfile,
  validateCuration,
  WEB_ROOT,
  PROJECT_ROOT,
} from './runtime-ux-curation-validator.mjs';
import { createRequire } from 'node:module';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const requireFromWeb = createRequire(resolve(WEB_ROOT, 'package.json'));
const COMPILED_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/docx/compiled-v2/BM-125.compiled.json',
);
const PROFILE_PATH = resolve(
  WEB_ROOT,
  'src/lib/runtime-ux/bm125-runtime-ux-profile.ts',
);

const profile = loadProfile(PROFILE_PATH, 'BM125_RUNTIME_UX_PROFILE');
const compiled = JSON.parse(readFileSync(COMPILED_PATH, 'utf8'));

describe('runtime-ux-curation-validator AST loader', () => {
  it('loads BM-125 with the expected template code and presentation sections', () => {
    assert.equal(profile.templateCode, 'BM-125');
    assert.ok(Array.isArray(profile.presentationSections));
    assert.ok(profile.presentationSections.length >= 1);
  });

  it('returns literal values for string and array properties', () => {
    assert.equal(typeof profile.fields['agency.vienKiem'].label, 'string');
    assert.equal(typeof profile.demo['document.ngayBan'], 'string');
  });
});

describe('runtime-ux-curation-validator invariants', () => {
  it('passes a curated profile with provenance', () => {
    const issues = validateCuration(profile, compiled, 'BM-125');
    assert.deepEqual(issues, []);
  });

  it('detects missing presentationSections', () => {
    const mutated = mutateProfile(profile, (candidate) => {
      delete candidate.presentationSections;
    });
    assert.ok(
      validateCuration(mutated, compiled, 'BM-125').includes(
        'PRESENTATION_SECTIONS_MISSING',
      ),
    );
  });

  it('detects a generated (mẫu BM-NNN) placeholder marker', () => {
    const mutated = mutateProfile(profile, (candidate) => {
      candidate.fields['agency.vienKiem'].placeholder = 'Tên cơ quan (mẫu BM-125)';
    });
    assert.ok(
      validateCuration(mutated, compiled, 'BM-125').includes(
        'GENERATED_MARKER_PRESENT',
      ),
    );
  });

  it('detects a profile section outside the compiled contract', () => {
    const mutated = mutateProfile(profile, (candidate) => {
      candidate.sections.push({
        sectionId: 'section-fabricated',
        title: 'Hư cấu',
        description: 'Mục không thuộc hợp đồng.',
      });
    });
    assert.ok(
      validateCuration(mutated, compiled, 'BM-125').includes(
        'PROFILE_SECTION_OUTSIDE_CONTRACT:section-fabricated',
      ),
    );
  });

  it('detects a presentation section outside the compiled contract', () => {
    const mutated = mutateProfile(profile, (candidate) => {
      candidate.presentationSections.push({
        id: 'section-fabricated',
        title: 'Hư cấu',
        description: 'Mục trình bày không thuộc hợp đồng.',
        fieldKeys: [],
      });
    });
    assert.ok(
      validateCuration(mutated, compiled, 'BM-125').includes(
        'PRESENTATION_SECTION_OUTSIDE_CONTRACT:section-fabricated',
      ),
    );
  });

  it('detects a presentation field outside the compiled contract', () => {
    const mutated = mutateProfile(profile, (candidate) => {
      candidate.presentationSections[0].fieldKeys.push('fabricated.field');
    });
    assert.ok(
      validateCuration(mutated, compiled, 'BM-125').includes(
        'PRESENTATION_FIELD_OUTSIDE_CONTRACT:fabricated.field',
      ),
    );
  });

  it('detects a duplicate presentation field', () => {
    const mutated = mutateProfile(profile, (candidate) => {
      candidate.presentationSections[0].fieldKeys.push(
        candidate.presentationSections[0].fieldKeys[0],
      );
    });
    const issues = validateCuration(mutated, compiled, 'BM-125');
    assert.ok(
      issues.some((issue) => issue.startsWith('PRESENTATION_FIELD_COUNT:')),
      `expected duplicate presentation field issue, got ${JSON.stringify(issues)}`,
    );
  });

  it('detects missing provenance', () => {
    assert.ok(
      validateCuration(profile, compiled, null).includes('PROVENANCE_MISSING'),
    );
  });

  it('detects a template-code mismatch', () => {
    const mutated = mutateProfile(profile, (candidate) => {
      candidate.templateCode = 'BM-126';
    });
    assert.ok(
      validateCuration(mutated, compiled, 'BM-125').includes(
        'TEMPLATE_CODE_MISMATCH',
      ),
    );
  });
});

describe('runtime-ux-curation-validator fail-closed AST loading', () => {
  it('throws on an unsupported expression (template interpolation)', () => {
    const requireFromWeb2 = requireFromWeb;
    assert.throws(
      () =>
        loadProfileForExpression(
          'const X = `value-${1}`;',
          'X',
          requireFromWeb2,
        ),
      /Unsupported profile expression/,
    );
  });
});

function loadProfileForExpression(source, variableName, requireInstance) {
  const ts = requireInstance('typescript');
  const tmpPath = join(__dirname, '.tmp-invalid-profile.ts');
  const { writeFileSync, unlinkSync } = requireInstance('node:fs');
  writeFileSync(tmpPath, source, 'utf8');
  try {
    return loadProfile(tmpPath, variableName);
  } finally {
    unlinkSync(tmpPath);
  }
}
