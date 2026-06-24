/**
 * Vietnamese section title lookup for FormInputSchema (PLAN.md v2.3 §B2).
 *
 * The locked form contracts use English-camelCase section keys (e.g.
 * "informant", "legalBasis", "caseRecovery") which are not localized.
 * This module is the single source of truth for translating those keys
 * into Vietnamese section titles used by the form-inputs UI.
 *
 * Lookup order used by getSectionTitle:
 *  1. SECTION_TITLES map (Vietnamese, reviewed).
 *  2. humanizeSectionKey fallback (English title-case) so that
 *     newly-introduced section keys never produce an empty title.
 *
 * The map is intentionally conservative: it is updated only when a
 * representative BM demonstrates the key. Unknown keys fall back to
 * the English humanize output, and tests stay non-blocking for any
 * future key that is not yet translated.
 */

export const SECTION_TITLES: Record<string, string> = {
  agency: "Cơ quan",
  document: "Văn bản",
  caseInfo: "Thông tin vụ án",
  content: "Nội dung",
  recipients: "Nơi nhận",
  signature: "Chữ ký",
  decision: "Quyết định",
  legalBasis: "Căn cứ pháp lý",
  offense: "Hành vi / tội danh",
  measure: "Biện pháp tố tụng",
  reception: "Tiếp nhận",
  receiver: "Người tiếp nhận",
  informant: "Người cung cấp tin",
  crimeReport: "Tin báo / tố giác",
  accusedDecision: "Quyết định về bị can",
  caseDecision: "Quyết định vụ án",
  attachments: "Tài liệu kèm theo",
  indictment: "Cáo trạng",
  monitoring: "Kiểm sát",
  proposal: "Đề xuất",
  investigation: "Điều tra",
  investigationConclusion: "Kết luận điều tra",
  caseJoinder: "Nhập vụ án",
  caseRecovery: "Khôi phục vụ án",
  investigationExtension: "Gia hạn điều tra",
  prosecutionExtension: "Gia hạn truy tố",
  prosecutionTransfer: "Chuyển truy tố",
  approval: "Phê duyệt",
};

/**
 * Convert a section key into an English title-case fallback. Never
 * returns an empty string for a non-empty key. Whitespace-only input
 * is coerced to "Section" so that downstream consumers can rely on a
 * non-empty string.
 */
export function humanizeSectionKey(sectionKey: string): string {
  const trimmed = sectionKey.trim();
  if (trimmed.length === 0) return "Section";
  return trimmed
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Return the Vietnamese section title for a key, falling back to
 * humanizeSectionKey for unknown keys. Always returns a non-empty
 * string. Never throws.
 */
export function getSectionTitle(sectionKey: string): string {
  const mapped = SECTION_TITLES[sectionKey];
  if (typeof mapped === "string" && mapped.length > 0) return mapped;
  return humanizeSectionKey(sectionKey);
}
