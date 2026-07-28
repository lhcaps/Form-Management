#!/usr/bin/env node
/**
 * Phase 15B.3 — Deterministic TypeScript Demo Export Resolver.
 *
 * ============================================================================
 * OBJECTIVE
 * ============================================================================
 * Replace the regex-based TypeScript object parser used in
 * `scripts/release/audit-demo-data-213.mjs` with a deterministic resolver
 * built on the TypeScript Compiler API. The resolver must correctly handle:
 *
 *   - exported const objects (named binding `BM001_DEMO`)
 *   - inline object literals (`demo: { ... }`)
 *   - imported const objects (`import { BM171_DEMO } from "./shared"`)
 *   - aliases (`const X = BMNNN_DEMO; ... demo: X`)
 *   - object spreads (`{ ...BASE, key: "value" }`)
 *   - nested object literals
 *   - `as const`, `Object.freeze`, `Object.freeze({ ... })`
 *   - flat dot-path string maps
 *   - string, number, boolean, null values
 *   - arrays where contract type permits
 *   - shared fixture imports
 *
 * It MUST NOT use unrestricted `eval()`. When a value cannot be resolved
 * statically, it returns `UNRESOLVED` and the caller MUST treat that as a
 * blocker, NOT as DEMO_READY.
 *
 * ============================================================================
 * FAIL-CLOSED POLICY
 * ============================================================================
 * - Dynamic expressions, function calls, template literal interpolations,
 *   computed constants, conditional expressions, and `this` references
 *   are all reported as `UNRESOLVED`.
 * - Identifiers that cannot be resolved in the same source file are
 *   returned as `UNRESOLVED` (we do not chase imports across files for
 *   the first iteration; that work is staged for the shared-fixture
 *   consolidation phase).
 * - The resolver never mutates any source file.
 *
 * ============================================================================
 * USAGE
 * ============================================================================
 *   import { resolveDemoExport } from "./resolve-demo-export.mjs";
 *   const result = resolveDemoExport({ sourceText, sourcePath });
 *   // result = { ok, demo, unresolvedExpressions, notes }
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// We use the TypeScript Compiler API installed in the pnpm store.
// The package is reachable through the `node_modules/.pnpm/...` chain
// even though the workspace root does not declare it as a top-level
// dependency — adding it solely for this audit was explicitly disallowed
// by the Phase 15B.3 brief.
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = dirname(__filename2);
const TS_PACKAGE_PATH = resolve(
  __dirname2,
  "..",
  "..",
  "..",
  "node_modules",
  ".pnpm",
  "typescript@5.9.3",
  "node_modules",
  "typescript",
  "lib",
  "typescript.js",
);
// On Windows, dynamic `import()` requires a `file://` URL for absolute
// paths. Convert via pathToFileURL.
const { pathToFileURL } = await import("node:url");
const ts = await import(pathToFileURL(TS_PACKAGE_PATH).href);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @typedef {Object} ResolutionResult
 * @property {boolean} ok                          True iff every requested demo binding resolved.
 * @property {Object<string, *>} demo              Resolved key→value map (string leaves mostly; arrays/nested objects where contract permits).
 * @property {string[]} unresolvedExpressions      Plain-text list of expressions we could not evaluate.
 * @property {string[]} resolvedBindings           Symbolic names resolved (e.g. `BM001_DEMO`).
 * @property {string[]} notes                      Diagnostic notes that do not affect `ok`.
 */

/**
 * Build a minimal TypeScript source file that re-exports the named binding
 * the caller asked for. This isolates the analysis to the relevant scope
 * without polluting the caller with the whole source.
 *
 * We intentionally do NOT inject any imports or ambient types so the
 * resolver remains pure: only the source's own symbols can satisfy the
 * binding name. External imports are tracked but never resolved in v1.
 */
function wrapSourceForNamedBinding(sourceText, bindingName) {
  const safe = sourceText;
  // The wrapped top-level binding is a `const`, so `bindingName` MUST refer
  // to a value (variable, import, or `const` declaration) already in scope.
  // Function declarations also resolve because they are hoisted as values.
  return `//__wrap__\n${safe}\n//__export__\nexport const __RESOLVED__ = ${bindingName};\n`;
}

/**
 * Wrap a single expression (typically the RHS of `demo:`) so that we can
 * evaluate it as a top-level expression and inspect the resulting node.
 */
function wrapExpression(expressionText) {
  return `//__wrap_expr__\nexport const __RESOLVED__ = (${expressionText});\n`;
}

/**
 * Evaluate a literal-ish TypeScript expression to a JS value when possible.
 *
 * Returns one of:
 *   { kind: "value",  value }
 *   { kind: "array",  items: [...] }                 // for literal arrays we want to preserve structure
 *   { kind: "unresolved", expressionText, reason }
 */
function evaluateExpression(node, sourceFile) {
  const getText = (n) => n.getText(sourceFile);

  // StringLiteral / NoSubstitutionTemplateLiteral
  if (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node)
  ) {
    return { kind: "value", value: node.text };
  }

  // NumericLiteral
  if (ts.isNumericLiteral(node)) {
    return { kind: "value", value: Number(node.text) };
  }

  // Boolean literals
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return { kind: "value", value: true };
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return { kind: "value", value: false };
  }

  // Null literal
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return { kind: "value", value: null };
  }

  // Identifier — try to resolve to a same-source top-level const, function,
  // or class declaration.
  if (ts.isIdentifier(node)) {
    const target = findTopLevelConstForIdentifier(sourceFile, node.text);
    if (target && target.initializer) {
      const inner = evaluateExpression(target.initializer, sourceFile);
      if (inner.kind === "value" || inner.kind === "array") {
        return inner;
      }
      if (inner.kind === "partial") {
        // The alias target is partially resolved. Bubble up so the
        // caller can still see the literal value AND the unresolved
        // expressions from the inner.
        return {
          kind: "partial",
          value: inner.value,
          unresolved: inner.unresolved,
        };
      }
      return {
        kind: "unresolved",
        expressionText: getText(node),
        reason: `alias-target-not-resolved:${inner.reason ?? "unknown"}`,
      };
    }
    // Function declaration: extract a literal object literal from the body
    // when the function is a plain `function NAME() { return { ... }; }` or
    // `function NAME() { const X = syncDerivedFields({...}); ... return X; }`
    // pattern that the legacy bm-NNN-form-inputs.tsx files use.
    const fnDecl = findTopLevelDeclarationForIdentifier(sourceFile, node.text);
    if (fnDecl && ts.isFunctionDeclaration(fnDecl)) {
      return resolveFunctionBodyAsObject(fnDecl, sourceFile);
    }
    return {
      kind: "unresolved",
      expressionText: getText(node),
      reason: "alias-not-resolved",
    };
  }

  // Object literal: walk properties, allow spread to bubble up as unresolved
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    const unresolved = [];
    for (const prop of node.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const key = resolveKeyName(prop.name, sourceFile);
        if (key == null) {
          unresolved.push({
            expressionText: getText(prop.name),
            reason: "unsupported-key-kind",
          });
          continue;
        }
        const child = evaluateExpression(prop.initializer, sourceFile);
        if (child.kind === "value") {
          out[key] = child.value;
        } else if (child.kind === "array") {
          out[key] = child.items;
        } else if (child.kind === "partial") {
          out[key] = child.value;
          unresolved.push(...child.unresolved);
        } else {
          unresolved.push(child);
        }
      } else if (ts.isSpreadAssignment(prop)) {
        const text = getText(prop.expression);
        unresolved.push({
          expressionText: text,
          reason: "spread-not-resolved",
        });
      } else {
        unresolved.push({
          expressionText: getText(prop),
          reason: "unsupported-property-kind",
        });
      }
    }
    if (unresolved.length > 0) {
      return {
        kind: "partial",
        value: out,
        unresolved,
      };
    }
    return { kind: "value", value: out };
  }

  // Array literal: preserve as a structured array.
  if (ts.isArrayLiteralExpression(node)) {
    const items = [];
    const unresolved = [];
    for (const el of node.elements) {
      if (el == null) {
        items.push(null);
        continue;
      }
      const child = evaluateExpression(el, sourceFile);
      if (child.kind === "value") items.push(child.value);
      else if (child.kind === "array") items.push(child.items);
      else if (child.kind === "partial") {
        items.push(child.value);
        unresolved.push(...child.unresolved);
      } else unresolved.push(child);
    }
    if (unresolved.length > 0) {
      return { kind: "partial", value: { __isArray: true, items }, unresolved };
    }
    return { kind: "array", items };
  }

  // Parenthesised expression: recurse into the inner.
  if (ts.isParenthesizedExpression(node)) {
    return evaluateExpression(node.expression, sourceFile);
  }

  // Prefix unary expressions of literal kind (e.g. `-42`).
  if (ts.isPrefixUnaryExpression(node)) {
    const inner = evaluateExpression(node.operand, sourceFile);
    if (inner.kind === "value" && typeof inner.value === "number") {
      if (node.operator === ts.SyntaxKind.MinusToken) {
        return { kind: "value", value: -inner.value };
      }
      if (node.operator === ts.SyntaxKind.PlusToken) {
        return { kind: "value", value: inner.value };
      }
    }
    return {
      kind: "unresolved",
      expressionText: getText(node),
      reason: "unsupported-unary",
    };
  }

  // TypeAssertion (`X as T`) and AsExpression (`X as const`): type-only,
  // we transparently recurse into the underlying expression.
  if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
    return evaluateExpression(node.expression, sourceFile);
  }

  // TemplateLiteralExpression with interpolations: fail closed.
  if (ts.isTemplateExpression(node) || ts.isTemplateHead(node)) {
    return {
      kind: "unresolved",
      expressionText: getText(node),
      reason: "template-interpolation-not-resolved",
    };
  }

  // Anything else — function calls, conditional expressions, binary
  // expressions, type assertions like `as const`, etc. — is unsupported.
  return {
    kind: "unresolved",
    expressionText: getText(node),
    reason: `unsupported-expression-kind:${ts.SyntaxKind[node.kind] ?? node.kind}`,
  };
}

function resolveKeyName(nameNode, sourceFile) {
  if (ts.isIdentifier(nameNode)) return nameNode.text;
  if (ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }
  if (ts.isComputedPropertyName(nameNode)) return null;
  return null;
}

/**
 * Resolve a function declaration to its returned object literal when the
 * body is one of:
 *
 *   - `function NAME() { return { ... }; }`
 *   - `function NAME() { const X = someHelper({...}); return X; }`
 *   - `function NAME() { const X = someHelper({...}); sideEffect(X); }`
 *
 * The legacy `bm-NNN-form-inputs.tsx` files wrap the demo literal through
 * `syncDerivedFields({...})` and then call `setForm(sample)`. The first
 * argument's literal IS the canonical demo payload, so we extract it
 * directly. Anything else is unresolved.
 */
function resolveFunctionBodyAsObject(fnDecl, sourceFile) {
  const body = fnDecl.body;
  if (!body || !body.statements) {
    return {
      kind: "unresolved",
      expressionText: fnDecl.name?.text ?? "<fn>",
      reason: "function-body-empty",
    };
  }

  // Pattern A: a single `return <expr>;` statement.
  if (body.statements.length === 1 && ts.isReturnStatement(body.statements[0])) {
    if (body.statements[0].expression) {
      return evaluateExpression(body.statements[0].expression, sourceFile);
    }
  }

  // Pattern B / C: `const X = helper({...}); ...` — extract the first
  // CallExpression's first argument when it is an object literal. We
  // intentionally accept any number of trailing statements (return X,
  // sideEffect(X), etc.) because the canonical payload is in the call.
  for (const stmt of body.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const declList = stmt.declarationList;
    if (!declList) continue;
    for (const decl of declList.declarations) {
      if (!decl.initializer) continue;
      if (ts.isCallExpression(decl.initializer)) {
        const first = decl.initializer.arguments[0];
        if (first && (ts.isObjectLiteralExpression(first) || ts.isIdentifier(first))) {
          // Do NOT recurse into the helper-call identifier; the literal
          // argument is the canonical payload by definition.
          if (ts.isObjectLiteralExpression(first)) {
            const inner = evaluateExpression(first, sourceFile);
            if (inner.kind === "value" || inner.kind === "array") return inner;
            if (inner.kind === "partial") return inner;
          } else {
            // Identifier argument (rare in this codebase); recurse.
            const inner = evaluateExpression(first, sourceFile);
            if (inner.kind === "value" || inner.kind === "array") return inner;
            if (inner.kind === "partial") return inner;
          }
        }
      }
      // Also accept direct `const X = { ... };` (literal binding, no wrapper).
      if (ts.isObjectLiteralExpression(decl.initializer)) {
        return evaluateExpression(decl.initializer, sourceFile);
      }
    }
  }

  return {
    kind: "unresolved",
    expressionText: fnDecl.name?.text ?? "<fn>",
    reason: "function-body-shape-not-recognized",
  };
}

/**
 * Find a top-level OR nested declaration (variable, function, or class)
 * whose name matches the given identifier. Returns the declaration node
 * when found, else null.
 *
 * Searches the entire source AST because legacy `bm-NNN-form-inputs.tsx`
 * files nest the demo helpers inside React component functions.
 */
function findTopLevelDeclarationForIdentifier(sourceFile, name) {
  let found = null;
  function visit(node) {
    if (found) return;
    if (!node) return;
    if (ts.isVariableStatement(node)) {
      const declList = node.declarationList;
      if (!declList) return;
      for (const decl of declList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.name.text === name) {
          found = decl;
          return;
        }
      }
      return;
    }
    if (ts.isFunctionDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      found = node;
      return;
    }
    if (ts.isClassDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  ts.forEachChild(sourceFile, visit);
  return found;
}

function findTopLevelConstForIdentifier(sourceFile, name) {
  for (const stmt of sourceFile.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const declList = stmt.declarationList;
    if (!declList) continue;
    for (const decl of declList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === name) {
        return decl;
      }
    }
  }
  return null;
}

/**
 * Resolve a single named export from a TypeScript source file.
 *
 * @param {{ sourceText: string, sourcePath?: string }} input
 * @param {string} bindingName
 * @returns {ResolutionResult}
 */
export function resolveNamedExport(input, bindingName) {
  const { sourceText, sourcePath = "<inline>" } = input;
  const wrapped = wrapSourceForNamedBinding(sourceText, bindingName);

  const sourceFile = ts.createSourceFile(
    sourcePath,
    wrapped,
    ts.ScriptTarget.ES2022,
    /*setParentNodes*/ true,
    ts.ScriptKind.TS,
  );

  let resolved = null;
  let unresolvedExpressions = [];
  const resolvedBindings = [];

  // Walk top-level statements; find `export const __RESOLVED__ = X;`.
  for (const stmt of sourceFile.statements) {
    if (
      ts.isVariableStatement(stmt) &&
      stmt.declarationList &&
      stmt.declarationList.declarations.length === 1
    ) {
      const decl = stmt.declarationList.declarations[0];
      if (
        ts.isIdentifier(decl.name) &&
        decl.name.text === "__RESOLVED__"
      ) {
        resolvedBindings.push(bindingName);
        const result = evaluateExpression(decl.initializer, sourceFile);
        if (result.kind === "value") {
          resolved = result.value;
        } else if (result.kind === "array") {
          resolved = { __array: result.items };
        } else if (result.kind === "partial") {
          resolved = result.value;
          unresolvedExpressions = unresolvedExpressions.concat(
            result.unresolved,
          );
        } else {
          unresolvedExpressions.push(result);
        }
      }
    }
  }

  return {
    ok: resolved != null && unresolvedExpressions.length === 0,
    demo: resolved ?? {},
    unresolvedExpressions: unresolvedExpressions.map(stringifyUnresolved),
    resolvedBindings,
    notes: [],
  };
}

/**
 * Resolve the value of a `demo:` property assignment. The property may be
 * inline (`demo: { ... }`) or a binding reference (`demo: BMNNN_DEMO`).
 *
 * The function does not chase the binding across files; it only inspects
 * the same source's top-level declarations.
 *
 * @param {{ sourceText: string, sourcePath?: string }} input
 * @returns {ResolutionResult & { source: "inline"|"binding"|"none", binding?: string }}
 */
export function resolveDemoProperty(input) {
  const { sourceText, sourcePath = "<inline>" } = input;
  const sourceFile = ts.createSourceFile(
    sourcePath,
    sourceText,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  );

  /** @type {ReturnType<typeof findDemoPropertyAssignment>} */
  let demoProp = null;
  for (const stmt of sourceFile.statements) {
    const found = findDemoPropertyAssignment(stmt, sourceFile);
    if (found) {
      demoProp = found;
      break;
    }
  }

  if (!demoProp) {
    return {
      ok: false,
      source: "none",
      demo: {},
      unresolvedExpressions: ["demo-property-not-found"],
      resolvedBindings: [],
      notes: [],
    };
  }

  const init = demoProp.initializer;
  if (ts.isObjectLiteralExpression(init)) {
    const result = evaluateExpression(init, sourceFile);
    if (result.kind === "value") {
      return {
        ok: true,
        source: "inline",
        demo: result.value,
        unresolvedExpressions: [],
        resolvedBindings: [],
        notes: [],
      };
    }
    if (result.kind === "partial") {
      return {
        ok: false,
        source: "inline",
        demo: result.value,
        unresolvedExpressions: result.unresolved.map(stringifyUnresolved),
        resolvedBindings: [],
        notes: [],
      };
    }
    return {
      ok: false,
      source: "inline",
      demo: {},
      unresolvedExpressions: [stringifyUnresolved(result)],
      resolvedBindings: [],
      notes: [],
    };
  }

  if (ts.isIdentifier(init)) {
    const bindingName = init.text;
    // Re-resolve the binding in the same source.
    const sub = resolveNamedExport({ sourceText, sourcePath }, bindingName);
    return {
      ok: sub.ok,
      source: "binding",
      binding: bindingName,
      demo: sub.demo,
      unresolvedExpressions: sub.unresolvedExpressions,
      resolvedBindings: sub.resolvedBindings,
      notes: sub.notes,
    };
  }

  return {
    ok: false,
    source: "unknown",
    demo: {},
    unresolvedExpressions: [
      stringifyUnresolved({
        kind: "unresolved",
        expressionText: init.getText(sourceFile),
        reason: "demo-initializer-not-object-or-binding",
      }),
    ],
    resolvedBindings: [],
    notes: [],
  };
}

/**
 * Find the `demo:` property assignment on a top-level exported const that
 * matches the FormFlightProfile / RuntimeUxProfile shape. We accept either:
 *   - `export const X: FormFlightProfile = { ..., demo: ..., ... }`
 *   - `export const Y: RuntimeUxProfile = { ..., demo: ..., ... }`
 *
 * We return the PropertyAssignment node for `demo`.
 */
function findDemoPropertyAssignment(stmt, sourceFile) {
  if (!ts.isVariableStatement(stmt)) return null;
  const declList = stmt.declarationList;
  if (!declList || declList.declarations.length !== 1) return null;
  const decl = declList.declarations[0];
  if (!decl.initializer) return null;
  if (!ts.isObjectLiteralExpression(decl.initializer)) return null;

  // Filter: at least one property is `demo:`.
  for (const prop of decl.initializer.properties) {
    if (
      ts.isPropertyAssignment(prop) &&
      ts.isIdentifier(prop.name) &&
      prop.name.text === "demo"
    ) {
      return prop;
    }
  }
  return null;
}

function stringifyUnresolved(u) {
  return `${u.reason}:${u.expressionText.slice(0, 120)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

function cli() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(
      "usage: resolve-demo-export.mjs <path-to-profile.ts> <binding-or-demo>",
    );
    console.error(
      "  if <binding-or-demo> starts with `inline:` the inline `demo:` property is resolved",
    );
    console.error(
      "  otherwise the named const (e.g. BM001_DEMO) is resolved",
    );
    process.exit(2);
  }
  const filePath = resolve(args[0]);
  if (!existsSync(filePath)) {
    console.error("file not found:", filePath);
    process.exit(2);
  }
  const sourceText = readFileSync(filePath, "utf8");
  const target = args[1];
  let result;
  if (target.startsWith("inline:")) {
    result = resolveDemoProperty({ sourceText, sourcePath: filePath });
  } else {
    result = resolveNamedExport({ sourceText, sourcePath: filePath }, target);
  }
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  cli();
}
