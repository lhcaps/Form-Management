/**
 * Empty-safe text helpers shared by every BM form mapper.
 *
 * The rules:
 *   - Never return the string `"undefined"`, `"null"`, or `"[object Object]"`.
 *   - Never throw on unknown input; narrow `unknown` to a printable string.
 *   - Never invent content: missing input becomes `""`, not a placeholder.
 *   - Pure functions; no I/O, no Date construction.
 */

/**
 * Convert any unknown input to a printable string. Nullish / empty inputs
 * collapse to `""`. Non-string inputs use `String(value)` so callers do
 * not see `[object Object]` leaking into rendered DOCX text.
 */
export function normalizeTextInput(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "";
    }
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  return "";
}

/**
 * Convenience wrapper used by BM form mappers for optional payload
 * fields. Equivalent to `normalizeTextInput` — kept as a separate
 * symbol so mapper call sites read as intent ("optional input")
 * rather than as raw coercion.
 */
export function emptyStringIfMissing(value: unknown): string {
  return normalizeTextInput(value);
}

/**
 * Sentinel string patterns that indicate a mapping bug: a missing value
 * was coerced through `String(value)` or `JSON.stringify(value)` and
 * produced a leak. The toolkit keeps this list short and explicit; the
 * checker is test-only — production mappers do not run it on every call.
 */
const UNSAFE_VALUE_PATTERNS: ReadonlyArray<{ kind: UnsafeValueKind; pattern: RegExp }> = [
  { kind: "undefined-literal", pattern: /^undefined$/u },
  { kind: "null-literal", pattern: /^null$/u },
  { kind: "object-toString", pattern: /^\[object Object\]$/u },
  { kind: "invalid-date", pattern: /^Invalid Date$/u },
  { kind: "placeholder-braces", pattern: /\{\{|^\{|\}$|^\}/u },
];

export type UnsafeValueKind =
  | "undefined-literal"
  | "null-literal"
  | "object-toString"
  | "invalid-date"
  | "placeholder-braces";

export type UnsafeValueFinding = {
  path: ReadonlyArray<string>;
  kind: UnsafeValueKind;
  value: string;
};

/**
 * Walk a payload object and collect every string value that matches the
 * `UNSAFE_VALUE_PATTERNS`. The function does not throw; callers (tests,
 * audit gates) use it as a hard smoke-check after mapping.
 *
 * `path` is the JSON-pointer-ish list of keys from the root to the
 * suspicious value. It is informational — it does not pretend to be a
 * full JSON Schema validator.
 */
export function assertNoUnsafeMappedValue(
  payload: unknown,
  options: { path?: ReadonlyArray<string> } = {},
): UnsafeValueFinding[] {
  const findings: UnsafeValueFinding[] = [];
  const path = options.path ?? [];

  walk(payload, path, findings);
  return findings;
}

function walk(
  value: unknown,
  path: ReadonlyArray<string>,
  findings: UnsafeValueFinding[],
): void {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === "string") {
    for (const { kind, pattern } of UNSAFE_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        findings.push({ path: [...path], kind, value });
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      walk(entry, [...path, String(index)], findings);
    });
    return;
  }

  if (typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      walk(entry, [...path, key], findings);
    }
  }
}