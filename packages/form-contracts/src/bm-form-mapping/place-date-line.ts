/**
 * Vietnamese "place, ngày DD tháng MM năm YYYY" header line builder.
 *
 * Mirrors the BE `document-renderer.service.ts` `issuePlaceAndDateLine`
 * shape exactly: `{place}, ngày {day} tháng {month} năm {year}` with
 * leading zeros preserved on day and month so the rendered DOCX text
 * matches the BM-001 / BM-053 / BM-058 / BM-156 audit expectations
 * (e.g. "ngày 04 tháng 07 năm 2026"). Empty / partial inputs degrade
 * to an empty string — never a fabricated place, never a fabricated
 * date.
 */

import {
  formatVietnameseDateParts,
  splitIsoDateToVietnameseParts,
  type VietnameseDateParts,
} from "./date-mapping.js";

export type PlaceDateLineInput = {
  place: string | null | undefined;
  isoDate: string | null | undefined;
  defaultPlace?: string | null | undefined;
};

/**
 * Build the BM-001 / BM-053 / BM-058 / BM-156 "issue place and date" line.
 *
 * Behaviour:
 *   - If `place` is empty and `defaultPlace` is provided, `defaultPlace`
 *     is used. If both are empty, the line has no place prefix.
 *   - If `isoDate` is empty / malformed, the line has no date segment.
 *   - If only the date is present, the date segment is returned alone.
 *   - If only the place is present, the place is returned with a trailing
 *     comma to keep the BM-001 wording stable.
 */
export function formatVietnamesePlaceDateLine(
  input: PlaceDateLineInput,
): string {
  const place = pickText(input.place) ?? pickText(input.defaultPlace) ?? "";
  const parts: VietnameseDateParts = splitIsoDateToVietnameseParts(
    input.isoDate,
  );
  const dateSegment = formatVietnameseDateParts(parts);

  if (!place && !dateSegment) {
    return "";
  }

  if (place && dateSegment) {
    return `${place}, ${dateSegment}`;
  }

  if (place) {
    return `${place},`;
  }

  return dateSegment;
}

function pickText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}