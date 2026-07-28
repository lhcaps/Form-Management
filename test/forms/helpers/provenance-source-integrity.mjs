/**
 * Shared provenance-source integrity helpers.
 *
 * Provides repository-local path-containment and SHA-256 verification
 * primitives used by every BM curation test. Extracted from the
 * per-batch tests so that:
 *
 *   - the same invariants are reused, not re-implemented per form;
 *   - each batch test file stays small and focused on its forms;
 *   - a malicious or buggy caller cannot bypass containment by
 *     re-introducing a different resolver.
 *
 * The exports are fail-closed: a path that does not satisfy the
 * lexical/realpath containment, the canonical directory root, or the
 * hash shape raises a strict AssertionError.
 *
 * Run: node --test test/forms/helpers/provenance-source-integrity.test.mjs
 */

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const HELPER_DIR = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(HELPER_DIR, '..', '..', '..');
const WEB_ROOT = resolve(PROJECT_ROOT, 'apps', 'web');
export const PROFILE_DIR = resolve(WEB_ROOT, 'src/lib/runtime-ux');

const SOURCE_EXTRACT_ROOT = 'docs/audit/docx/extracted/';
const COMPILED_CONTRACT_ROOT = 'docs/audit/docx/compiled-v2/';

export const PROVENANCE_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md',
);

export const MATURITY_PATH = resolve(
  PROJECT_ROOT,
  'docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_MATURITY.latest.json',
);

export function projectRoot() {
  return PROJECT_ROOT;
}

export function webRoot() {
  return WEB_ROOT;
}

/**
 * Assert that a declared path stays inside the project tree.
 *
 * Rejects when the declared path is not a string, is empty, is an
 * absolute path, contains a `..` segment, resolves outside
 * `PROJECT_ROOT` lexically or via realpath (symlink escape), does
 * not exist (when `mustExist` is set), or is not a regular file.
 *
 * When `requireRoot` is `'extract'` or `'compiled'`, the declared
 * path must additionally start with the canonical source-extract or
 * compiled-contract root. When `realpathMap` is supplied (portable
 * symlink-escape tests on Windows), the lookup realpath for the
 * declared path comes from the map instead of `realpathSync`.
 *
 * Returns the absolute path on success so callers can use it.
 */
export function assertRepositoryLocalPath(declaredPath, options = {}) {
  assert.equal(
    typeof declaredPath,
    'string',
    `declared path must be a string (got ${typeof declaredPath})`,
  );
  assert.notEqual(
    declaredPath,
    '',
    'declared path must not be empty',
  );
  assert.equal(
    isAbsolute(declaredPath),
    false,
    `declared path must not be absolute: ${declaredPath}`,
  );
  for (const segment of declaredPath.split(/[\\/]+/u)) {
    assert.notEqual(
      segment,
      '..',
      `declared path must not contain traversal segment "..": ${declaredPath}`,
    );
  }
  const resolved = resolve(PROJECT_ROOT, declaredPath);
  const rel = relative(PROJECT_ROOT, resolved);
  assert.equal(
    rel === '..' ||
      rel.startsWith(`..${sep}`) ||
      isAbsolute(rel),
    false,
    `resolved path must remain inside PROJECT_ROOT: ${declaredPath} -> ${resolved}`,
  );

  if (options.mustExist) {
    assert.ok(
      existsSync(resolved),
      `target file must exist: ${declaredPath} -> ${resolved}`,
    );
    const stats = statSync(resolved);
    assert.equal(
      stats.isFile(),
      true,
      `target must be a regular file: ${declaredPath}`,
    );
  }

  if (options.requireRealpathContainment) {
    const lookup = options.realpathMap?.get(declaredPath) ?? realpathSync(resolved);
    const projectReal = realpathSync(PROJECT_ROOT);
    assert.equal(
      lookup === projectReal ||
        lookup.startsWith(`${projectReal}${sep}`),
      true,
      `realpath of target must remain inside PROJECT_ROOT (symlink escape blocked): ${declaredPath} -> ${lookup}`,
    );
  }

  if (options.requireRoot) {
    if (options.requireRoot === 'extract') {
      assert.equal(
        declaredPath.startsWith(SOURCE_EXTRACT_ROOT),
        true,
        `sourceExtractPath must live under ${SOURCE_EXTRACT_ROOT}: ${declaredPath}`,
      );
    } else if (options.requireRoot === 'compiled') {
      assert.equal(
        declaredPath.startsWith(COMPILED_CONTRACT_ROOT),
        true,
        `compiledContractPath must live under ${COMPILED_CONTRACT_ROOT}: ${declaredPath}`,
      );
    }
  }

  return resolved;
}

/** Assert the SHA-256 hash is a full 64-character lowercase hex value. */
export function assertFullSha256(sha256) {
  assert.match(
    sha256,
    /^[0-9a-f]{64}$/u,
    `SHA-256 must be 64 lowercase hex characters: ${sha256}`,
  );
}

/** Compute and return the SHA-256 of a file as 64-character lowercase hex. */
export function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

/**
 * Resolve a provenance declared path against the project tree, verify
 * its existence + realpath containment, and compute its SHA-256 in a
 * single call. Returns { resolved, sha256 }.
 */
export function resolveProvenanceAsset(declaredPath, options = {}) {
  const resolved = assertRepositoryLocalPath(declaredPath, {
    mustExist: true,
    requireRealpathContainment: true,
    ...options,
  });
  const sha256 = sha256File(resolved);
  assertFullSha256(sha256);
  return { resolved, sha256 };
}

/** Read the full text of a provenance asset (must exist; realpath-contained). */
export function readProvenanceText(declaredPath, options = {}) {
  const resolved = assertRepositoryLocalPath(declaredPath, {
    mustExist: true,
    requireRealpathContainment: true,
    ...options,
  });
  return readFileSync(resolved, 'utf8');
}

/**
 * Parse a single CURATION provenance row.
 *
 * The ledger row shape is:
 *   | <formCode> | <compiledContractPath> ; <extractPath> (<pids>) |
 *     <documentType / Workflow / Section rationale / Field-by-field
 *      confidence / Medium/Low slots / Contract-only fields / reviewed>
 *     | Not promoted; <legal-fidelity note> |
 *
 * Returns an object with the parsed cells keyed by column name plus
 * the verbatim row text for further regex assertions.
 */
export function parseProvenanceRow(row) {
  if (!row) return null;
  const parts = row.split('|').map((c) => c.trim());
  // pipe-delimited with surrounding empty cells ("|| ... ||" pre/post)
  const formCode = parts[1] || '';
  const profileEvidence = parts[2] || '';
  const reviewed = parts[3] || '';
  const runtimeReadiness = parts[4] || '';

  const compiledMatch = profileEvidence.match(/docs\/audit\/docx\/compiled-v2\/(BM-\d{3}\.compiled\.json)/u);
  const extractMatch = profileEvidence.match(
    /docs\/audit\/docx\/extracted\/(BM-\d{3}__[0-9a-f]{12}\.extract\.md)/u,
  );

  return {
    formCode,
    profileEvidence,
    reviewed,
    runtimeReadiness,
    compiledContractPath: compiledMatch ? `docs/audit/docx/compiled-v2/${compiledMatch[1]}` : null,
    extractPath: extractMatch ? `docs/audit/docx/extracted/${extractMatch[1]}` : null,
    raw: row,
  };
}

/** Read the entire provenance ledger text from disk (realpath-contained). */
export function readProvenanceLedger() {
  return readProvenanceText('docs/audit/unified-bm-workspace/QLLAW_213_SEMANTIC_UI_CURATION_PROVENANCE.md');
}

/** Find a single provenance row for a given formCode. */
export function findProvenanceRow(text, code) {
  const lines = text.split(/\r?\n/u);
  return lines.find((line) => new RegExp(`^\\|\\s*${code}\\s*\\|`, 'u').test(line));
}

export const PROVENANCE_ROOTS = Object.freeze({
  extract: SOURCE_EXTRACT_ROOT,
  compiled: COMPILED_CONTRACT_ROOT,
});
