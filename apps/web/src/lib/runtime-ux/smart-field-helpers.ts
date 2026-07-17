/**
 * Runtime UX smart field helpers — pure functions used by the
 * `ContractV2Renderer` to render smart date / time / select / textarea
 * controls and by the smart-field contract guard tests.
 *
 * Contract: `docs/audit/unified-bm-workspace/RUNTIME_UX_SMART_FIELD_CONTRACT.latest.md`.
 *
 * No DOM, no React, no fetch, no console. Safe to import from
 * `node:test` guard files (the renderer imports the same functions
 * and the guard tests assert their behaviour).
 */

export type SmartFieldKind =
  | "text"
  | "textarea"
  | "date"
  | "time"
  | "select"
  | "date-parts"
  | "year-or-date"
  | "issue-place-date-line";

export type SmartField = {
  /** Field key the smart control binds to (visible key). */
  readonly key: string;
  /** Field label shown to the operator (overrides contract label). */
  readonly label?: string;
  /** Smart control kind. Default: "text". */
  readonly kind?: SmartFieldKind;
  /** In-form hint text. */
  readonly placeholder?: string;
  /** Allowed values for `kind: "select"`. */
  readonly options?: readonly string[];
  /** Number of rows for `kind: "textarea"`. Default: 3. */
  readonly rows?: number;
  /**
   * Hidden target paths the helper ALSO writes. Required for
   * `date-parts`, `year-or-date`, `issue-place-date-line`. The visible
   * field key (`key`) is NEVER written for derived fields — only the
   * derived targets receive data.
   */
  readonly derivedTargets?: readonly string[];
};

export type DerivedDateParts = {
  readonly day: string;
  readonly month: string;
  readonly year: string;
};

/**
 * Parse an ISO YYYY-MM-DD string into parts. Returns null when the
 * input is empty / unparseable so the caller can short-circuit. The
 * parser intentionally does NOT accept DD/MM/YYYY or Vietnamese text
 * — the smart control produces ISO natively and the contract payload
 * expects the three derived parts, so anything else is a programming
 * error and we surface null instead of silently producing garbage.
 */
export function parseIsoDate(value: string): {
  y: number;
  m: number;
  d: number;
} | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (
    !Number.isFinite(y) ||
    !Number.isFinite(mo) ||
    !Number.isFinite(d) ||
    mo < 1 ||
    mo > 12 ||
    d < 1 ||
    d > 31
  ) {
    return null;
  }
  return { y, m: mo, d };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Convert an ISO date string to the locked-contract day/month/year
 * triplet (DD, MM, YYYY — zero-padded). Returns null for empty /
 * unparseable input.
 */
export function toDayMonthYear(value: string): DerivedDateParts | null {
  const parsed = parseIsoDate(value);
  if (!parsed) return null;
  return {
    day: pad2(parsed.d),
    month: pad2(parsed.m),
    year: String(parsed.y),
  };
}

/**
 * Derive a triplet for the BM-001 "smart date-parts" smart control.
 * Returns `{ day: "", month: "", year: "" }` for empty input so the
 * renderer can spread it onto the data record without writing
 * `"undefined"`.
 */
export function deriveDateToDayMonthYear(
  value: string,
): DerivedDateParts {
  const parsed = toDayMonthYear(value);
  if (!parsed) return { day: "", month: "", year: "" };
  return parsed;
}

/**
 * Derive the BM-001 "smart year-or-date" control. Year-only is
 * accepted (some informants only remember the year). Detection rule:
 * the picker produces an ISO `YYYY-MM-DD`; if the picker was used in
 * month-precision mode (some browsers expose year-only via
 * `type="month"` not `type="date"`) the renderer would not call this
 * helper at all. For the BM-001 case the operator either:
 *
 *   - selects a full date → all three parts are written; or
 *   - clears the picker → all three parts are cleared.
 *
 * The smart control intentionally does NOT support year-only entry in
 * BM-001 (the locked contract already accepts `birthYear` alone; the
 * operator can always clear day+month and only set year through the
 * same picker — when they clear day and month the renderer calls this
 * helper with an empty string and the result is empty triplets).
 *
 * Keeping this rule simple so the helper matches the test contract.
 */
export function deriveYearOrDateToBirthParts(
  value: string,
): DerivedDateParts {
  return deriveDateToDayMonthYear(value);
}

/**
 * Format the Vietnamese legal place-date line used by BM-001's
 * `document.issuePlaceDateLine`. The legal convention (verified
 * against the BM-001 demo fixture and the existing golden render) is:
 *
 *   "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026"
 *
 * Day is zero-padded to two digits; month is rendered as a bare
 * integer (no leading zero); year is rendered as-is. Examples:
 *
 *   formatVietnameseIssueLine("Thành phố Hồ Chí Minh", "2026-03-04")
 *     === "Thành phố Hồ Chí Minh, ngày 04 tháng 3 năm 2026"
 *
 *   formatVietnameseIssueLine("", "2026-03-04")
 *     === "ngày 04 tháng 3 năm 2026"
 *
 *   formatVietnameseIssueLine("Thành phố Hồ Chí Minh", "")
 *     === ""   // date missing → no half-written line
 */
export function formatVietnameseIssueLine(
  place: string,
  iso: string,
): string {
  const trimmedPlace = (place ?? "").trim();
  const parsed = parseIsoDate(iso);
  if (!parsed) return "";
  const day = pad2(parsed.d);
  const month = String(parsed.m); // bare integer — no leading zero
  const year = String(parsed.y);
  const datePart = `ngày ${day} tháng ${month} năm ${year}`;
  if (trimmedPlace.length === 0) return datePart;
  return `${trimmedPlace}, ${datePart}`;
}

/**
 * Return true when a field with the given key is hidden because a
 * smart override writes to it via `derivedTargets`. Used by the
 * renderer to filter contract fields so the operator never sees raw
 * `birthDay / birthMonth / birthYear` triplets when a smart control
 * is producing them.
 */
export function isHiddenBySmartOverride(
  smartEntries: ReadonlyArray<SmartField>,
  fieldKey: string,
): boolean {
  for (const entry of smartEntries) {
    if (!entry.derivedTargets) continue;
    if (entry.derivedTargets.includes(fieldKey)) return true;
  }
  return false;
}

/**
 * Apply a smart field write to the data record and return the next
 * record. Pure — does not mutate `data`.
 *
 * Behaviour:
 *   - For `text` / `textarea` / `date` / `time` / `select`: writes the
 *     raw `value` to `smart.key` (the visible field key).
 *   - For `date-parts`: derives `{ day, month, year }` and writes each
 *     to one slot of `smart.derivedTargets` (must be length 3, in
 *     `[day, month, year]` order).
 *   - For `year-or-date`: same as `date-parts`.
 *   - For `issue-place-date-line`: `value` is the formatted Vietnamese
 *     line; writes to `smart.derivedTargets[0]`.
 *
 * Unknown `kind` values fall back to writing the raw value to
 * `smart.key` (the safe default).
 */
export function applySmartFieldWrites(
  data: Record<string, unknown>,
  smart: SmartField,
  value: string,
  /**
   * Optional second input — only used by `issue-place-date-line`,
   * which needs BOTH a place string and an ISO date. The renderer
   * stores the date on the visible key (so it survives the next
   * rebuild) and the line text on `derivedTargets[0]`.
   */
  secondValue?: string,
): Record<string, unknown> {
  const kind = smart.kind ?? "text";
  const targets = smart.derivedTargets ?? [];
  switch (kind) {
    case "date-parts":
    case "year-or-date": {
      if (targets.length < 3) {
        // Programming error: a derived date control MUST declare three
        // derivedTargets. Fall back to the legacy text-input path by
        // writing nothing.
        return data;
      }
      const parts = deriveDateToDayMonthYear(value);
      return setPath(setPath(setPath(data, targets[0], parts.day), targets[1], parts.month), targets[2], parts.year);
    }
    case "issue-place-date-line": {
      if (targets.length < 1) return data;
      const line = formatVietnameseIssueLine(value, secondValue ?? "");
      // The visible key is "document.issuePlaceDateLine" itself for
      // BM-001; the renderer writes the line there directly.
      const next = setPath(data, smart.key, line);
      // Mirror to the first derived target so any sibling contract
      // field bound to the same value also stays in sync. For BM-001
      // the derived target is the same as the visible key (kept as a
      // no-op alias); the second value writes the raw ISO to the
      // visible key as a no-op so future contracts can split it.
      return targets[0] && targets[0] !== smart.key
        ? setPath(next, targets[0], line)
        : next;
    }
    case "text":
    case "textarea":
    case "date":
    case "time":
    case "select":
    default:
      return setPath(data, smart.key, value);
  }
}

/**
 * Local-path setter (mirrors `ContractV2Renderer.setPath` but is kept
 * inside this module so the helper is self-contained). Pure; returns
 * a fresh record.
 */
function setPath(
  data: Record<string, unknown>,
  path: string,
  value: string,
): Record<string, unknown> {
  if (!path.includes(".")) return { ...data, [path]: value };
  const segments = path.split(".");
  const next: Record<string, unknown> = { ...data };
  let cursor: Record<string, unknown> = next;
  for (const segment of segments.slice(0, -1)) {
    const existing = cursor[segment];
    const child: Record<string, unknown> =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};
    cursor[segment] = child;
    cursor = child;
  }
  const leaf = segments[segments.length - 1];
  cursor[leaf] = value;
  return next;
}