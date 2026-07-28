/**
 * BM Form Mapping — public surface for the generic Vietnamese date / place /
 * identity / archive / text mapping toolkit.
 *
 * This is the **single source of truth** for reusable BM form input
 * normalization. It lives in `@qllaw/form-contracts` so both
 * `apps/web` (templateDraft payload) and `apps/api` (generatedDocument
 * render path) consume the exact same helpers and produce the exact
 * same wording. PR6G.3 introduced the toolkit under
 * `apps/web/src/lib/bm-form-mapping/`; PR6G.3.1 promotes it here so
 * the API can adopt it without an inverted dependency.
 *
 * Non-goals (enforced by review, not by code):
 *   - No fake generatedDocumentId.
 *   - No DB write from /templates/:templateCode.
 *   - No demo fallback.
 *   - No user-specific hardcode inside the toolkit.
 *   - The toolkit does not fabricate legal facts: any missing input
 *     becomes empty output, never a fabricated date or placeholder.
 */

export {
  splitIsoDateToVietnameseParts,
  formatVietnameseDateParts,
  formatIdentityVietnameseDateParts,
  formatSlashDate,
  type VietnameseDateParts,
} from "./date-mapping.js";

export {
  formatVietnamesePlaceDateLine,
  type PlaceDateLineInput,
} from "./place-date-line.js";

export {
  normalizeTextInput,
  emptyStringIfMissing,
  assertNoUnsafeMappedValue,
  type UnsafeValueKind,
  type UnsafeValueFinding,
} from "./text-mapping.js";

export { buildArchiveLine } from "./archive-line.js";

export {
  mapIdentityIssueDateParts,
  formatIdentityIssueDateLine,
  IDENTITY_ISSUE_DATE_PREFIX,
} from "./identity-date.js";