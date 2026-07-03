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
 *   <StatusBadge value="CONFIRMED" type="import" />
 *   // Plain-text lookup (no badge) for inline rendering:
 *   <span>{importStatusLabel("CONFIRMED")}</span>
 */

import * as React from "react";
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

type Priority =
  | "THAP"
  | "TRUNG_BINH"
  | "CAO"
  | "KHAN"
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

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

type ImportStatus =
  | "UPLOADED"
  | "PARSED"
  | "PARTIAL"
  | "FAILED"
  | "CONFIRMED"
  | "STORED_ONLY"
  | "PARSED_WITH_WARNINGS"
  | "REJECTED";

type StatusType =
  | "review"
  | "case"
  | "priority"
  | "formAuthoring"
  | "formRuntime"
  | "import";

interface StatusBadgeProps {
  value: string;
  type: StatusType;
  label?: string;
  className?: string;
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

/**
 * `Badge` variant union — must mirror the `variant` keys of the shared
 * `Badge` primitive in `@/components/ui/badge`. Centralized here so every
 * domain `*_CONFIG` below stays in sync with the primitive.
 */
type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "outline"
  | "muted"
  | "blue"
  | "violet";

interface BadgeConfigEntry {
  label: string;
  variant: BadgeVariant;
}

// Review status badge contract:
//   - draft / cancelled = muted (passive terminal state, no colour noise)
//   - generated = violet (subtle violet tint; still semantic but quiet)
//   - waiting review = warning (subtle amber tint)
//   - approved / final exported = success (subtle emerald tint) or blue
//     for the file-availability flavour
//   - needs revision = destructive (subtle rose tint)
// "File availability" indicators on review cards (`Đã có PDF`, `Chưa có
// file`, `Đã có DOCX`) are kept as muted slate chips by callers — they
// are not routed through StatusBadge because they are not workflow
// statuses.
const REVIEW_CONFIG: Record<ReviewStatus, BadgeConfigEntry> = {
  DRAFT:            { label: "Bản nháp",    variant: "muted" },
  GENERATED:        { label: "Đã render",   variant: "violet" },
  WAITING_REVIEW:   { label: "Cần duyệt",   variant: "warning" },
  APPROVED:         { label: "Đã duyệt",    variant: "success" },
  NEEDS_REVISION:   { label: "Cần sửa",      variant: "destructive" },
  FINAL_EXPORTED:   { label: "Đã xuất",      variant: "blue" },
  CANCELLED:        { label: "Đã hủy",       variant: "muted" },
};

// Case status contract (calm legal/admin aesthetic):
//   - DRAFT / Nháp = muted (neutral, no colour)
//   - RECEIVED / Đã tiếp nhận = success (subtle emerald tint — calmer
//     than the previous primary-navy `default` flavour)
//   - IN_PROGRESS = blue (subtle blue tint; in-flight, not blocking)
//   - WAITING_REVIEW / Trình duyệt / Chờ duyệt = warning
//   - CLOSED / Đã đóng / Đã xử lý / DONG = muted
//   - Đã duyệt / Kết luận = success
// No dark navy or strong green for passive statuses.
const CASE_STATUS_CONFIG: Record<string, BadgeConfigEntry> = {
  TIEP_NHAN:      { label: "Tiếp nhận",    variant: "success" },
  DANG_XU_LY:     { label: "Đang xử lý",  variant: "blue" },
  DANG_TRINH_DUYET:{ label: "Trình duyệt",  variant: "warning" },
  DA_DUYET:       { label: "Đã duyệt",    variant: "success" },
  "DA Ket_LUAN":  { label: "Kết luận",    variant: "success" },
  DA_XU_LY:       { label: "Đã xử lý",   variant: "muted" },
  DONG:           { label: "Đóng",         variant: "muted" },
  DRAFT:          { label: "Nháp",         variant: "muted" },
  RECEIVED:       { label: "Đã tiếp nhận", variant: "success" },
  IN_PROGRESS:    { label: "Đang xử lý",  variant: "blue" },
  WAITING_REVIEW: { label: "Chờ duyệt",    variant: "warning" },
  CLOSED:         { label: "Đã đóng",      variant: "muted" },
};

// Priority contract (calm legal/admin aesthetic):
//   - LOW / Thấp = muted
//   - NORMAL / Trung bình / Bình thường = muted (was `default`/primary
//     navy before — now neutral so the common-case priority does not
//     read like an action chip)
//   - HIGH / Cao = warning (subtle amber tint)
//   - URGENT / Khẩn = destructive (subtle rose tint)
const PRIORITY_CONFIG: Record<Priority, BadgeConfigEntry> = {
  THAP:      { label: "Thấp",    variant: "muted" },
  TRUNG_BINH:{ label: "Trung bình", variant: "muted" },
  CAO:      { label: "Cao",     variant: "warning" },
  KHAN:      { label: "Khẩn",   variant: "destructive" },
  LOW:       { label: "Thấp",    variant: "muted" },
  NORMAL:    { label: "Bình thường", variant: "muted" },
  HIGH:      { label: "Cao",     variant: "warning" },
  URGENT:    { label: "Khẩn",   variant: "destructive" },
};

// Form authoring contract:
//   - not_initialized / draft / archived = muted (neutral, no colour)
//   - changes_requested / in_review = warning (subtle amber tint)
//   - approved = success (subtle emerald tint)
//   - published = success (subtle emerald tint — was `default`/primary
//     navy before; calmer and not CTA-flavoured for a passive status)
const FORM_AUTHORING_CONFIG: Record<string, BadgeConfigEntry> = {
  NOT_INITIALIZED:{ label: "Chưa khởi tạo", variant: "muted" },
  DRAFT:          { label: "Bản nháp",       variant: "muted" },
  CHANGES_REQUESTED:{ label: "Yêu cầu sửa",  variant: "warning" },
  IN_REVIEW:      { label: "Đang duyệt",    variant: "warning" },
  APPROVED:       { label: "Đã duyệt",       variant: "success" },
  PUBLISHED:      { label: "Đã công bố",    variant: "success" },
  ARCHIVED:       { label: "Lưu trữ",        variant: "muted" },
};

// Form runtime contract:
//   - agency_published / global_published = success (subtle emerald —
//     calm "this template is available")
//   - locked_file = warning (subtle amber)
//   - legacy_bespoke / generic_fallback = muted (neutral)
//   - unavailable = destructive (subtle rose)
const FORM_RUNTIME_CONFIG: Record<string, BadgeConfigEntry> = {
  AGENCY_PUBLISHED:  { label: "VKS địa phương", variant: "success" },
  GLOBAL_PUBLISHED:  { label: "Toàn quốc",      variant: "success" },
  LOCKED_FILE:       { label: "File khóa",       variant: "warning" },
  LEGACY_BESPOKE:    { label: "Tùy chỉnh cũ",  variant: "muted" },
  GENERIC_FALLBACK:  { label: "Mặc định",       variant: "muted" },
  UNAVAILABLE:       { label: "Không khả dụng", variant: "destructive" },
};

// Import batch / per-file status. Labels and ordering are the contract —
// they were previously inlined in apps/web/src/components/imports/import-workspace.tsx
// (statusLabelMap) and are now centralized here. Variants map through
// the shared `Badge` primitive's toned-down palette: destructive uses
// `border-rose-200 bg-rose-50 text-rose-700`, success uses
// `border-emerald-200 bg-emerald-50 text-emerald-700`, warning uses
// `border-amber-200 bg-amber-50 text-amber-700`, blue uses
// `border-blue-200 bg-blue-50 text-blue-700`. None of these are
// saturated 500-level fills — all are light-tint backgrounds with
// muted borders, consistent with the mature legal/admin aesthetic.
const IMPORT_CONFIG: Record<ImportStatus, BadgeConfigEntry> = {
  UPLOADED:             { label: "Đã tải lên",     variant: "blue" },
  PARSED:               { label: "Đã trích xuất",  variant: "blue" },
  PARTIAL:              { label: "Có cảnh báo",    variant: "warning" },
  PARSED_WITH_WARNINGS: { label: "Có cảnh báo",    variant: "warning" },
  FAILED:               { label: "Lỗi",            variant: "destructive" },
  REJECTED:             { label: "Bị từ chối",     variant: "destructive" },
  CONFIRMED:            { label: "Đã xác nhận",    variant: "success" },
  STORED_ONLY:          { label: "Đã lưu file",    variant: "muted" },
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

function StatusBadge({ value, type, label, className }: StatusBadgeProps) {
  let config: BadgeConfigEntry;

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
    case "import":
      config = IMPORT_CONFIG[value as ImportStatus] ?? { label: label ?? value, variant: "outline" as const };
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

/**
 * Plain-text lookup helper for the import status enum. Mirrors the
 * `IMPORT_CONFIG` label mapping and is the canonical replacement for the
 * local `statusLabelMap` that previously lived in
 * `apps/web/src/components/imports/import-workspace.tsx`. Falls back to
 * the raw status value for any unknown / future statuses so callers can
 * render defensively without a guard.
 */
function importStatusLabel(value: string): string {
  return IMPORT_CONFIG[value as ImportStatus]?.label ?? value;
}

export { StatusBadge, importStatusLabel };
