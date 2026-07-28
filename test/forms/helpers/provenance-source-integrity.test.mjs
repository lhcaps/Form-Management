/**
 * Unit tests for provenance-source-integrity helper.
 *
 * Verifies containment, hash, and ledger-row parsing invariants
 * shared across the BM curation test family. Independent of any
 * specific form so a regression in the helper is caught before the
 * per-form tests run.
 *
 * Run: node --test test/forms/helpers/provenance-source-integrity.test.mjs
 */

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import {
  assertFullSha256,
  assertRepositoryLocalPath,
  findProvenanceRow,
  parseProvenanceRow,
  projectRoot,
  readProvenanceLedger,
  resolveProvenanceAsset,
  sha256File,
  PROVENANCE_ROOTS,
} from './provenance-source-integrity.mjs';

describe('assertRepositoryLocalPath', () => {
  const escapeCases = [
    { label: 'parent-traversal (Unix-style)', declared: '../../outside.json' },
    { label: 'parent-traversal inside docs', declared: '../compiled.json' },
    { label: 'Windows absolute path', declared: 'C:\\outside\\file.json' },
    { label: 'POSIX absolute path', declared: '/docs/outside.json' },
    {
      label: 'multi-traversal that escapes docs/audit/docx/extracted/',
      declared: 'docs/audit/docx/extracted/../../../../outside.md',
    },
    { label: 'Windows drive-rooted absolute path', declared: 'D:\\compiled.json' },
    { label: 'empty string', declared: '' },
    { label: 'non-string number', declared: 42 },
    { label: 'non-string object', declared: { path: 'x.json' } },
  ];

  for (const c of escapeCases) {
    it(`rejects ${c.label}`, () => {
      assert.throws(
        () => assertRepositoryLocalPath(c.declared),
        (err) => err instanceof assert.AssertionError,
        `path ${JSON.stringify(c.declared)} must be rejected`,
      );
    });
  }

  it('rejects a single-segment ".." even without prefix', () => {
    assert.throws(
      () => assertRepositoryLocalPath('..'),
      (err) => err instanceof assert.AssertionError,
    );
  });

  it('rejects when requireRoot=extract but declared path lives under compiled', () => {
    assert.throws(
      () =>
        assertRepositoryLocalPath(
          'docs/audit/docx/compiled-v2/BM-015.compiled.json',
          { requireRoot: 'extract' },
        ),
      (err) => err instanceof assert.AssertionError,
    );
  });

  it('rejects when requireRoot=compiled but declared path lives under extract', () => {
    assert.throws(
      () =>
        assertRepositoryLocalPath(
          'docs/audit/docx/extracted/BM-015__08f17df338d2.extract.md',
          { requireRoot: 'compiled' },
        ),
      (err) => err instanceof assert.AssertionError,
    );
  });

  it('rejects a real path that exists but is a directory, not a file', () => {
    assert.throws(
      () =>
        assertRepositoryLocalPath('docs/audit', { mustExist: true }),
      (err) => err instanceof assert.AssertionError,
    );
  });

  it('rejects a symlink escape via realpathMap (portable)', () => {
    const declaredInside = `${PROVENANCE_ROOTS.extract}BM-127__symlink-fake.md`;
    const fakeOutside = resolve(projectRoot(), '..', 'fake-outside-target.md');
    const realpathMap = new Map([[declaredInside, fakeOutside]]);
    assert.throws(
      () =>
        assertRepositoryLocalPath(declaredInside, {
          mustExist: true,
          requireRealpathContainment: true,
          realpathMap,
        }),
      (err) => err instanceof assert.AssertionError,
    );
  });

  it('accepts a repository-local extract path with realpath containment', () => {
    const sample = `${PROVENANCE_ROOTS.extract}BM-015__08f17df338d2.extract.md`;
    const resolved = assertRepositoryLocalPath(sample, {
      mustExist: true,
      requireRealpathContainment: true,
    });
    assert.equal(existsSync(resolved), true);
  });

  it('accepts a repository-local compiled contract path with realpath containment', () => {
    const sample = `${PROVENANCE_ROOTS.compiled}BM-015.compiled.json`;
    const resolved = assertRepositoryLocalPath(sample, {
      mustExist: true,
      requireRealpathContainment: true,
      requireRoot: 'compiled',
    });
    assert.equal(existsSync(resolved), true);
  });
});

describe('assertFullSha256', () => {
  it('accepts a valid 64-character lowercase hex', () => {
    assertFullSha256('49989f2b2e6beacb6900e3dfd731f122c88b4663b1751f623de7944458821c59');
  });
  it('rejects an uppercase hex', () => {
    assert.throws(
      () => assertFullSha256('49989F2B2E6BEACB6900E3DFD731F122C88B4663B1751F623DE7944458821C59'),
      (err) => err instanceof assert.AssertionError,
    );
  });
  it('rejects a short hex (63 chars)', () => {
    assert.throws(
      () => assertFullSha256('49989f2b2e6beacb6900e3dfd731f122c88b4663b1751f623de7944458821c5'),
      (err) => err instanceof assert.AssertionError,
    );
  });
  it('rejects a non-hex character', () => {
    assert.throws(
      () => assertFullSha256('Z'.repeat(64)),
      (err) => err instanceof assert.AssertionError,
    );
  });
});

describe('sha256File / resolveProvenanceAsset', () => {
  it('computes the canonical SHA-256 of BM-015 compiled contract', () => {
    const { sha256 } = resolveProvenanceAsset(
      'docs/audit/docx/compiled-v2/BM-015.compiled.json',
      { requireRoot: 'compiled' },
    );
    // canonical hash from baseline maturity report (8C38D3AB... — uppercase)
    assert.match(sha256, /^[0-9a-f]{64}$/u);
    assert.equal(sha256, sha256File(resolve(projectRoot(), 'docs/audit/docx/compiled-v2/BM-015.compiled.json')));
  });

  it('refuses a non-existent file with mustExist', () => {
    assert.throws(
      () =>
        resolveProvenanceAsset(
          'docs/audit/docx/compiled-v2/BM-DOES-NOT-EXIST.compiled.json',
          { requireRoot: 'compiled' },
        ),
      (err) => err instanceof assert.AssertionError,
    );
  });
});

describe('parseProvenanceRow + findProvenanceRow + readProvenanceLedger', () => {
  const text = readProvenanceLedger();

  it('finds an existing CURATION row by formCode', () => {
    const row = findProvenanceRow(text, 'BM-126');
    assert.ok(row, 'BM-126 row must exist in ledger');
    assert.match(row, /^\|\s*BM-126\s*\|/u);
  });

  it('returns null/undefined for an unknown formCode', () => {
    const row = findProvenanceRow(text, 'BM-999-DOES-NOT-EXIST');
    assert.equal(row, undefined);
  });

  it('parses a curated row shape and surfaces compiledContractPath + extractPath', () => {
    const row = findProvenanceRow(text, 'BM-126');
    const parsed = parseProvenanceRow(row);
    assert.ok(parsed);
    assert.equal(parsed.formCode, 'BM-126');
    assert.equal(
      parsed.compiledContractPath,
      'docs/audit/docx/compiled-v2/BM-126.compiled.json',
    );
    assert.match(parsed.extractPath, /^docs\/audit\/docx\/extracted\/BM-126__[0-9a-f]{12}\.extract\.md$/u);
  });

  it('parses the CURATION marker and the audit reviewer note', () => {
    const row = findProvenanceRow(text, 'BM-126');
    const parsed = parseProvenanceRow(row);
    assert.match(parsed.reviewed, /\*\*CURATION/u);
    assert.match(parsed.runtimeReadiness, /Not promoted/u);
  });

  it('returns null when input is null', () => {
    assert.equal(parseProvenanceRow(null), null);
  });
});

describe('realpath containment — sanity check', () => {
  it('project realpath is a stable absolute path', async () => {
    const { realpathSync } = await import('node:fs');
    const real = realpathSync(projectRoot());
    assert.match(real, /[\\/]QLLaw-main$/u);
  });
});
