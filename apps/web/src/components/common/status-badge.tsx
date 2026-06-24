"use client";

/**
 * Centralized status badges for QUANLYVKS domain objects.
 *
 * Avoids scattered `statusTone()` / inline color functions across components.
 *
 * Usage:
 *   <StatusBadge value="WAITING_REVIEW" type="review" />
 *   <StatusBadge value="DANG_XU_LY" type="case" />
 *   <StatusBadge value="PUBLISHED" type="formAuthoring" />
 */

import { Badge } from "@/components/ui/badge";

type ReviewStatus =
  | "DRAFT"
  | "GENERATED"
  | "WAITING_REVIEW"
  | "APPROVED"
  | "NEEDS_REVISION"
  | "FINAL_EXPORTED"
  | "CANCELLED";

type CaseStatus =
  | "TIEP_NHAN"
  | "DANG_XU_LY"
  | "DANG_TRINH_DUYET"
  | "DA_DUYET"
  | "DA Ket_LUAN"
  | "DA_XU_LY"
  | "DONG";

type Priority = "THAP" | "TRUNG_BINH" | "CAO" | "KHAN";

type FormAuthoringStatus =
  | "NOT_INITIALIZED"
  | "DRAFT"
  | "CHANGES_REQUESTED"
  | "IN_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "ARCHIVED";

type FormRuntimeSource =
  | "AGENCY_PUBLISHED"
  | "GLOBAL_PUBLISHED"
  | "LOCKED_FILE"
  | "LEGACY_BESPOKE"
  | "GENERIC_FALLBACK"
  | "UNAVAILABLE";

type StatusType = "review" | "case" | "priority" | "formAuthoring" | "formRuntime";

interface StatusBadgeProps {
  value: string;
  type: StatusType;
  label?: string;
  className?: string;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

const REVIEW_CONFIG: Record<
  ReviewStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "muted" | "outline" }
> = {
  DRAFT:            { label: "Bản nháp",    variant: "muted" },
  GENERATED:        { label: "Đã render",  variant: "muted" },
  WAITING_REVIEW:   { label: "Cần duyệt",  variant: "warning" },
  APPROVED:         { label: "Đã duyệt",   variant: "success" },
  NEEDS_REVISION:   { label: "Cần sửa",     variant: "destructive" },
  FINAL_EXPORTED:   { label: "Đã xuất",     variant: "default" },
  CANCELLED:        { label: "Đã hủy",      variant: "muted" },
};

const CASE_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "muted" | "outline" }> = {
  TIEP_NHAN:      { label: "Tiếp nhận",    variant: "default" },
  DANG_XU_LY:     { label: "Đang xử lý",  variant: "warning" },
  DANG_TRINH_DUYET:{ label: "Trình duyệt",  variant: "warning" },
  DA_DUYET:       { label: "Đã duyệt",    variant: "success" },
  "DA Ket_LUAN":  { label: "Kết luận",    variant: "success" },
  DA_XU_LY:       { label: "Đã xử lý",   variant: "muted" },
  DONG:           { label: "Đóng",         variant: "muted" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "muted" | "outline" }> = {
  THAP:      { label: "Thấp",    variant: "muted" },
  TRUNG_BINH:{ label: "Trung bình", variant: "default" },
  CAO:      { label: "Cao",     variant: "warning" },
  KHAN:      { label: "Khẩn",   variant: "destructive" },
};

const FORM_AUTHORING_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "muted" | "outline" }> = {
  NOT_INITIALIZED:{ label: "Chưa khởi tạo", variant: "muted" },
  DRAFT:          { label: "Bản nháp",       variant: "muted" },
  CHANGES_REQUESTED:{ label: "Yêu cầu sửa",  variant: "warning" },
  IN_REVIEW:      { label: "Đang duyệt",    variant: "warning" },
  APPROVED:       { label: "Đã duyệt",       variant: "success" },
  PUBLISHED:      { label: "Đã công bố",    variant: "default" },
  ARCHIVED:       { label: "Lưu trữ",        variant: "muted" },
};

const FORM_RUNTIME_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "muted" | "outline" }> = {
  AGENCY_PUBLISHED:  { label: "VKS địa phương", variant: "success" },
  GLOBAL_PUBLISHED:  { label: "Toàn quốc",      variant: "default" },
  LOCKED_FILE:       { label: "File khóa",       variant: "warning" },
  LEGACY_BESPOKE:    { label: "Tùy chỉnh cũ",  variant: "muted" },
  GENERIC_FALLBACK:  { label: "Mặc định",       variant: "muted" },
  UNAVAILABLE:       { label: "Không khả dụng", variant: "destructive" },
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

function StatusBadge({ value, type, label, className }: StatusBadgeProps) {
  let config: { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" | "muted" | "outline" };

  switch (type) {
    case "review":
      config = REVIEW_CONFIG[value as ReviewStatus] ?? { label: label ?? value, variant: "outline" as const };
      break;
    case "case":
      config = CASE_STATUS_CONFIG[value] ?? { label: label ?? value, variant: "outline" as const };
      break;
    case "priority":
      config = PRIORITY_CONFIG[value as Priority] ?? { label: label ?? value, variant: "outline" as const };
      break;
    case "formAuthoring":
      config = FORM_AUTHORING_CONFIG[value] ?? { label: label ?? value, variant: "outline" as const };
      break;
    case "formRuntime":
      config = FORM_RUNTIME_CONFIG[value] ?? { label: label ?? value, variant: "outline" as const };
      break;
    default:
      config = { label: label ?? value, variant: "outline" as const };
  }

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

export { StatusBadge };
