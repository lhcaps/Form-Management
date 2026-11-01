/**
 * BM Form Mapping — re-export shim.
 *
 * Source of truth lives in `@qllaw/form-contracts` (see
 * `packages/form-contracts/src/bm-form-mapping/`). This module is kept
 * only as a stable import path inside `apps/web` so existing call
 * sites continue to read `from "@/lib/bm-form-mapping"`. New code
 * SHOULD import directly from `@qllaw/form-contracts`.
 */

export {
  splitIsoDateToVietnameseParts,
  formatVietnameseDateParts,
  formatIdentityVietnameseDateParts,
  formatSlashDate,
  type VietnameseDateParts,
} from "@qllaw/form-contracts";

export {
  formatVietnamesePlaceDateLine,
  type PlaceDateLineInput,
} from "@qllaw/form-contracts";

export {
  normalizeTextInput,
  emptyStringIfMissing,
  assertNoUnsafeMappedValue,
  type UnsafeValueKind,
  type UnsafeValueFinding,
} from "@qllaw/form-contracts";

export { buildArchiveLine } from "@qllaw/form-contracts";

export {
  mapIdentityIssueDateParts,
  formatIdentityIssueDateLine,
  IDENTITY_ISSUE_DATE_PREFIX,
} from "@qllaw/form-contracts";