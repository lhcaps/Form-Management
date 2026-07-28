/**
 * UI-only section label localization.
 *
 * Maps raw technical section keys to user-friendly Vietnamese labels.
 * This is a UI transform only — contract labels are NOT mutated.
 *
 * Unknown keys fall back to "Thông tin bổ sung" (Additional information).
 */

/** Map of section title keys to Vietnamese user-facing labels */
const SECTION_LABEL_MAP: Readonly<Record<string, string>> = {
  document: "Thông tin văn bản",
  receiver: "Người tiếp nhận",
  informant: "Người cung cấp tin",
  agency: "Cơ quan ban hành",
  case: "Thông tin vụ án",
  caseinfo: "Thông tin vụ án",
  content: "Nội dung",
  signature: "Chữ ký",
  official: "Thông tin người có thẩm quyền",
  sourceassignment: "Nội dung phân công",
  recipients: "Nơi nhận",
  suspect: "Bị can / Người liên quan",
  defendant: "Bị can",
  victim: "Bị hại",
  witness: "Người làm chứng",
  decision: "Nội dung quyết định",
  legalbasis: "Căn cứ pháp lý",
  measure: "Biện pháp áp dụng",
};

/**
 * Transform a raw section title into a user-friendly Vietnamese label.
 *
 * Falls back to "Thông tin bổ sung" for unknown keys to avoid
 * showing raw technical names to end users.
 */
export function localizeSectionTitle(rawTitle: string): string {
  const normalized = rawTitle.toLowerCase().trim();
  return SECTION_LABEL_MAP[normalized] ?? "Thông tin bổ sung";
}
