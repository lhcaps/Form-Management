/**
 * Archive-line helper for BM forms.
 *
 * BM-001 seeds `recipients.archiveLine = "Lưu: HSVA, HSKS, VP."`. The
 * helper exists so future BMs (BM-171, BM-053, ...) reuse the same
 * default-fallback shape without re-hardcoding the same string and
 * without leaking it into every BM-specific mapper.
 *
 * The helper never applies a fallback unless the caller passes one.
 * That keeps the contract explicit: "this BM uses `HSVA, HSKS, VP.`"
 * is a caller decision, not a toolkit default.
 */

/**
 * Return `value` when it is a non-empty string after trimming;
 * otherwise return `fallback` when provided and non-empty;
 * otherwise return `""`.
 *
 * Only string values count as "provided". Numbers, booleans, objects
 * and arrays never overwrite the fallback — they collapse to `""` so
 * callers cannot accidentally render `0`, `false`, or `[object Object]`
 * as an archive line.
 *
 * The fallback is consumed only when `value` is missing. Passing a
 * fallback never overwrites a user-provided string value.
 */
export function buildArchiveLine(
  value: unknown,
  fallback?: string | null,
): string {
  if (typeof value === "string") {
    const provided = value.trim();
    if (provided.length > 0) {
      return provided;
    }
  }

  if (typeof fallback === "string") {
    const fallbackText = fallback.trim();
    if (fallbackText.length > 0) {
      return fallbackText;
    }
  }

  return "";
}