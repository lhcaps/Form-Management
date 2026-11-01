/**
 * Runtime UX placeholder / stale-fallback blocklist.
 *
 * BM171 REQUIRED_PLACEHOLDER_GATE_AND_PREVIEW_TEXT_FINAL_FIX — the
 * single source of truth for "is this string a known bad value that
 * must never reach a render payload as a required field?".
 *
 * Both flows consume the same list:
 *   - runtime `/templates/:code` (via `collectMissingRequired` in
 *     `template-preview-workspace.tsx`)
 *   - generated-document `/documents/:id` (via
 *     `collectFormFlightMissingRequired` in
 *     `apps/web/src/lib/form-flight/validation.ts`)
 *   - the sanitization step in `runtime-preview-payload.ts::isKnownStaleFallback`
 *
 * Match rule: ENTIRE trimmed value equals one of the placeholder
 * strings. We never do broad substring replacement that would destroy
 * legitimate user text containing the same word.
 *
 * Adding a new placeholder here MUST be a deliberate, reviewed change
 * because it changes the missing-required gate across the project.
 * Each entry is anchored to the BM-171 visual signoff evidence in
 * `docs/audit/bm171-required-placeholder-gate/`.
 *
 * Lives under `runtime-ux/` (not `form-flight/`) because `form-flight`
 * already imports from `runtime-ux` (`payload.ts` → `runtime-preview-payload`),
 * and `validation.ts` re-uses this list. Keeping the blocklist here
 * avoids a circular import.
 */

const PLACEHOLDER_FRAGMENTS: ReadonlyArray<{
  fragment: string;
  test: (value: string) => boolean;
}> = [
  {
    fragment: "Căn cứ Điều 41 Bộ luật Tố tụng hình sự",
    test: (value) =>
      /^Căn cứ Điều 41 Bộ luật Tố tụng hình sự\.?$/u.test(value.trim()),
  },
  {
    fragment: "Cá nhân/Tổ chức theo quy định.",
    test: (value) =>
      /^Cá nhân\/Tổ chức theo quy định\.?$/u.test(value.trim()),
  },
  {
    fragment: "Tài sản theo quy định pháp luật",
    test: (value) =>
      /^Tài sản theo quy định pháp luật\.?$/u.test(value.trim()),
  },
  {
    fragment: "Mô tả vụ việc mẫu",
    test: (value) => /^Mô tả vụ việc mẫu\.?$/u.test(value.trim()),
  },
  {
    fragment: "Người ký (mẫu)",
    test: (value) => /^Người ký \(mẫu\)\.?$/u.test(value.trim()),
  },
  {
    fragment: "Người nhận (mẫu)",
    test: (value) => /^Người nhận \(mẫu\)\.?$/u.test(value.trim()),
  },
  {
    // Lowercase variant used in the Điều 2 sentence "cho người nhận (mẫu)".
    // Matched as a whole-value placeholder when the draft contains only
    // that label, not as a substring of a longer sentence.
    fragment: "người nhận (mẫu)",
    test: (value) => /^người nhận \(mẫu\)\.?$/u.test(value.trim()),
  },
  {
    fragment: "Nội dung mẫu cho biểu mẫu pháp lý.",
    test: (value) =>
      /^Nội dung mẫu cho biểu mẫu pháp lý\.?$/u.test(value.trim()),
  },
];

/**
 * Return true when `value` matches a known placeholder / stale fallback.
 * Empty input is NOT considered a stale fallback — it is handled by
 * the EMPTY branch in the caller.
 */
export function isKnownStaleFallback(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return PLACEHOLDER_FRAGMENTS.some((entry) => entry.test(trimmed));
}

/**
 * Diagnostic: list every known placeholder fragment. Used by the
 * acceptance scanner and by tests that want to enumerate the blocklist.
 */
export function listKnownStaleFallbacks(): readonly string[] {
  return PLACEHOLDER_FRAGMENTS.map((entry) => entry.fragment);
}