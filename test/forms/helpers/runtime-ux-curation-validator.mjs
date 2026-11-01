/**
 * Shared runtime-ux curation validator.
 *
 * Loads a TypeScript runtime-ux profile via the TypeScript compiler API
 * (no eval) and validates its metadata against a compiled form contract
 * and the curation provenance ledger. Used by per-batch curation tests
 * to keep them small and to make every curated form hit the same
 * invariant set.
 *
 * Fail-closed semantics:
 *   - The AST evaluator throws on any unsupported node kind
 *     (spread, computed keys, imported identifiers, dynamic property
 *     names, etc.). A profile that imports runtime-evaluated data is
 *     not silently accepted.
 *   - The validator returns a non-empty issues list whenever a
 *     contract invariant is violated; tests assert `deepEqual([], [])`
 *     on the curated profile.
 */

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(TEST_DIR, '..', '..', '..');
const WEB_ROOT = resolve(PROJECT_ROOT, 'apps', 'web');

const requireFromWeb = createRequire(resolve(WEB_ROOT, 'package.json'));
const ts = requireFromWeb('typescript');

/** Compile-cached TypeScript compiler API accessor. */
function getTypeScript() {
  return ts;
}

/**
 * Load a runtime-ux profile by parsing its source file with the
 * TypeScript compiler API and walking the AST to extract a literal
 * representation of the named declaration.
 *
 * Throws on any unsupported node kind. Spreads, computed keys,
 * imported identifiers, dynamic property names, and template
 * expressions are not silently ignored.
 */
export function loadProfile(profilePath, variableName) {
  const { readFileSync } = requireFromWeb('node:fs');
  const sourceText = readFileSync(profilePath, 'utf8');
  const ts2 = getTypeScript();
  const sourceFile = ts2.createSourceFile(
    profilePath,
    sourceText,
    ts2.ScriptTarget.Latest,
    true,
    ts2.ScriptKind.TS,
  );
  const declarations = new Map();

  for (const statement of sourceFile.statements) {
    if (!ts2.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts2.isIdentifier(declaration.name) &&
        declaration.initializer
      ) {
        declarations.set(declaration.name.text, declaration.initializer);
      }
    }
  }

  const root = declarations.get(variableName);
  assert.ok(root, `${variableName} must exist in ${profilePath}`);
  return evaluateLiteral(root, declarations);
}

function evaluateLiteral(node, declarations) {
  const ts2 = getTypeScript();
  if (
    ts2.isAsExpression(node) ||
    ts2.isSatisfiesExpression(node) ||
    ts2.isParenthesizedExpression(node)
  ) {
    return evaluateLiteral(node.expression, declarations);
  }
  if (ts2.isStringLiteral(node) || ts2.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts2.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts2.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts2.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts2.SyntaxKind.NullKeyword) return null;
  if (ts2.isIdentifier(node)) {
    const referenced = declarations.get(node.text);
    assert.ok(referenced, `Unsupported profile identifier: ${node.text}`);
    return evaluateLiteral(referenced, declarations);
  }
  if (ts2.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => evaluateLiteral(element, declarations));
  }
  if (ts2.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        assert.ok(
          ts2.isPropertyAssignment(property),
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
  const ts2 = getTypeScript();
  if (ts2.isIdentifier(name) || ts2.isStringLiteral(name)) return name.text;
  throw new Error(`Unsupported profile property name: ${name.getText()}`);
}

/**
 * Validate a curated runtime-ux profile against the compiled contract
 * and the provenance ledger row.
 *
 * Returns an array of issue codes. An empty array means the profile
 * passes every invariant.
 */
export function validateCuration(candidateProfile, candidateContract, candidateProvenance) {
  const issues = [];
  const compiledFields = candidateContract.source.fields;
  const compiledFieldKeys = compiledFields.map((field) => field.key);
  const contractSectionIds = new Set(
    candidateContract.source.sections.map((section) => section.id),
  );
  const placeholders = Object.values(candidateProfile.fields ?? {}).map(
    (field) => field.placeholder ?? '',
  );
  const presentationSections = candidateProfile.presentationSections;

  if (candidateProfile.templateCode !== candidateContract.templateCode) {
    issues.push('TEMPLATE_CODE_MISMATCH');
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
  if (placeholders.some((placeholder) =>
    /\(m(?:ẫu|áº«u)\s+BM-\d{3}\)/iu.test(placeholder),
  )) {
    issues.push('GENERATED_MARKER_PRESENT');
  }
  if (!candidateProvenance) issues.push('PROVENANCE_MISSING');

  return issues;
}

/**
 * Apply an in-memory mutation to a curated profile. Tests use this to
 * prove that each validator issue is reachable: a failing mutation
 * must surface the matching issue code.
 */
export function mutateProfile(profile, mutator) {
  const mutated = structuredClone(profile);
  mutator(mutated);
  return mutated;
}

export { PROJECT_ROOT, WEB_ROOT };
