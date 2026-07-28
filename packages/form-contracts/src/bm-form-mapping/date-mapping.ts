/**
 * Vietnamese date helpers shared by every BM form mapper.
 *
 * All helpers are pure: no Date timezone drift, no implicit `Date(value)`
 * fallback, no mutation of input. They consume ISO `YYYY-MM-DD` strings
 * only — anything else is treated as empty so callers never see
 * `Invalid Date`, `NaN`, or a fabricated legal date.
 */

export type VietnameseDateParts = {
  day: string;
  month: string;
  year: string;
};

/**
 * Split an ISO `YYYY-MM-DD` value into the three parts the BM form
 * templates consume directly. Empty / malformed input yields three
 * empty strings — never `Invalid Date`.
 *
 * The function uses string parsing only; it never constructs a `Date`,
 * so the values do not shift with the host timezone.
 */
export function splitIsoDateToVietnameseParts(
  value: string | null | undefined,
): VietnameseDateParts {
  if (typeof value !== "string") {
    return { day: "", month: "", year: "" };
  }

  const trimmed = value.trim();
  if (trimmed.length < 10) {
    return { day: "", month: "", year: "" };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!match) {
    return { day: "", month: "", year: "" };
  }

  const year = match[1] ?? "";
  const month = match[2] ?? "";
  const day = match[3] ?? "";
  return { day, month, year };
}

/**
 * Format `{day, month, year}` into the Vietnamese legal sentence
 * "ngày DD tháng MM năm YYYY". Leading zeros on day and month are
 * preserved so the wording stays stable across BMs (e.g. BM-001 audit
 * asserts `ngày 04 tháng 07 năm 2026`, not `tháng 7`).
 *
 * If any part is empty the result is an empty string — the toolkit
 * never fabricates a legal date.
 */
export function formatVietnameseDateParts(
  parts: VietnameseDateParts | null | undefined,
): string {
  if (!parts) {
    return "";
  }

  const { day, month, year } = parts;
  if (!day || !month || !year) {
    return "";
  }

  return `ngày ${day} tháng ${month} năm ${year}`;
}

/**
 * Format `{day, month, year}` into the day-month-year tail segment
 * used by date prefixes that already carry the leading `ngày` token
 * (e.g. `Cấp ngày`). Returns `DD tháng MM năm YYYY` — no leading
 * `ngày`. Empty parts return `""`.
 *
 * The function exists to keep the prefix composition stable: callers
 * that prepend `Cấp ngày` must not double-print the `ngày` token.
 */
export function formatIdentityVietnameseDateParts(
  parts: VietnameseDateParts | null | undefined,
): string {
  if (!parts) {
    return "";
  }

  const { day, month, year } = parts;
  if (!day || !month || !year) {
    return "";
  }

  return `${day} tháng ${month} năm ${year}`;
}

/**
 * Format `{day, month, year}` into `dd/mm/yyyy`. Empty parts yield an
 * empty string. Leading zeros are preserved.
 */
export function formatSlashDate(
  parts: VietnameseDateParts | null | undefined,
): string {
  if (!parts) {
    return "";
  }

  const { day, month, year } = parts;
  if (!day || !month || !year) {
    return "";
  }

  return `${day}/${month}/${year}`;
}