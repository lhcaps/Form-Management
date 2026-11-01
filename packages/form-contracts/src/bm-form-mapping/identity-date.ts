/**
 * Identity issue date helpers.
 *
 * The BM-001 / BM-053 / BM-156 wordings use the exact phrase
 *   `Cấp ngày DD tháng MM năm YYYY`
 * The toolkit centralises the date splitting so future BMs do not
 * re-implement the same `"Cấp ngày ..." + formatVietnameseDateParts`
 * concatenation.
 */

import {
  formatIdentityVietnameseDateParts,
  splitIsoDateToVietnameseParts,
  type VietnameseDateParts,
} from "./date-mapping.js";

export const IDENTITY_ISSUE_DATE_PREFIX = "Cấp ngày";

/**
 * Split an identity-issue ISO date into day/month/year parts. This is
 * the same shape BM-001 already consumes; the helper just guarantees
 * the call site reads as "identity issued date" instead of "any date".
 */
export function mapIdentityIssueDateParts(
  isoDate: string | null | undefined,
): VietnameseDateParts {
  return splitIsoDateToVietnameseParts(isoDate);
}

/**
 * Build the full `Cấp ngày DD tháng MM năm YYYY` sentence from an
 * identity-issue ISO date. Returns `""` if the input is empty or
 * malformed.
 *
 * Keeping the prefix as a single module constant prevents BMs from
 * drifting between `Cấp ngày`, `Cấp: ngày`, `Cấp tại ngày`, etc.
 *
 * The date segment is emitted by `formatIdentityVietnameseDateParts`
 * which omits the leading `ngày` (the prefix already carries it).
 */
export function formatIdentityIssueDateLine(
  isoDate: string | null | undefined,
): string {
  const parts = mapIdentityIssueDateParts(isoDate);
  const dateText = formatIdentityVietnameseDateParts(parts);
  if (!dateText) {
    return "";
  }
  return `${IDENTITY_ISSUE_DATE_PREFIX} ${dateText}`;
}