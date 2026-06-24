"use client";

/**
 * Review Queue page — orchestration layer.
 *
 * Responsibilities:
 * - Fetch + cache review queue data
 * - Manage filter/search state
 * - Route status actions through the appropriate dialog
 * - Render extracted sub-components
 *
 * Extracted components live in @/components/review-queue/.
 */

import { useEffect, useMemo, useState } from "react";

import {
  fetchReviewQueue,
  updateReviewStatus,
  type ReviewQueueItem,
  type ReviewStatus,
  type ReviewQueueSummary,
} from "@/lib/documents-review-api";
import { ApiError } from "@/lib/api-client";

import { ErrorBanner } from "@/components/common/error-banner";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { PageShell, PageSection } from "@/components/common/page-shell";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import {
  ReviewNoteDialog,
  ReviewQueueItemCard,
  ReviewQueueFilters,
} from "@/components/review-queue";

// ---------------------------------------------------------------------------
// Filter definitions
// ---------------------------------------------------------------------------

type FilterKey = "ALL" | ReviewStatus;

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "WAITING_REVIEW", label: "Cần phê duyệt" },
  { key: "NEEDS_REVISION", label: "Cần sửa" },
  { key: "APPROVED", label: "Đã duyệt" },
  { key: "FINAL_EXPORTED", label: "Đã xuất cuối" },
  { key: "CANCELLED", label: "Đã hủy" },
];

// ---------------------------------------------------------------------------
// Confirm dialog state
// ---------------------------------------------------------------------------

type ConfirmAction = "APPROVED" | "FINAL_EXPORTED" | "CANCELLED";

interface ConfirmDialogState {
  open: boolean;
  action: ConfirmAction;
  item: ReviewQueueItem | null;
}

const ACTION_CONFIG: Record<
  ConfirmAction,
  {
    title: string;
    confirmText: string;
    note: string;
    destructive: boolean;
    description: (item: ReviewQueueItem) => string;
  }
> = {
  APPROVED: {
    title: "Duyệt biểu mẫu",
    confirmText: "Duyệt biểu mẫu",
    destructive: false,
    note: "Đã kiểm tra nội dung và phê duyệt biểu mẫu.",
    description: (item) =>
      `Bạn có chắc muốn duyệt biểu mẫu "${item.templateCode} — ${
        item.documentTitle || "Không có tiêu đề"
      }" không?`,
  },
  FINAL_EXPORTED: {
    title: "Đánh dấu đã xuất cuối",
    confirmText: "Đánh dấu đã xuất cuối",
    destructive: false,
    note: "Biểu mẫu đã được xuất bản chính thức.",
    description: (item) =>
      `Bạn có chắc muốn đánh dấu "${item.templateCode} — ${
        item.documentTitle || "Không có tiêu đề"
      }" là đã xuất cuối không?`,
  },
  CANCELLED: {
    title: "Hủy biểu mẫu",
    confirmText: "Hủy biểu mẫu",
    destructive: true,
    note: "Hủy biểu mẫu khỏi luồng phê duyệt.",
    description: (item) =>
      `Bạn có chắc muốn hủy biểu mẫu "${item.templateCode} — ${
        item.documentTitle || "Không có tiêu đề"
      }" không?`,
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [summary, setSummary] = useState<ReviewQueueSummary>({});
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Review note dialog state (NEEDS_REVISION)
  const [reviewNoteItem, setReviewNoteItem] = useState<ReviewQueueItem | null>(null);
  const [reviewNoteValue, setReviewNoteValue] = useState("");

  // Confirm dialog state (APPROVED / FINAL_EXPORTED / CANCELLED)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: "APPROVED",
    item: null,
  });

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  async function loadQueue() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchReviewQueue();
      setItems(Array.isArray(data.items) ? data.items : []);
      setSummary(data.summary ?? {});
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : err instanceof Error
            ? err
            : new Error("Không tải được danh sách biểu mẫu cần duyệt."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, []);

  // ---------------------------------------------------------------------------
  // Shared status update
  // ---------------------------------------------------------------------------

  async function performStatusUpdate(
    documentId: string,
    nextStatus: ReviewStatus,
    reviewNote: string,
  ) {
    setUpdatingId(documentId);
    setError(null);

    try {
      await updateReviewStatus(documentId, nextStatus, reviewNote);
      await loadQueue();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err
          : err instanceof Error
            ? err
            : new Error("Không cập nhật được trạng thái duyệt."),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  function handleApprove(item: ReviewQueueItem) {
    setConfirmDialog({ open: true, action: "APPROVED", item });
  }

  function handleFinalExport(item: ReviewQueueItem) {
    setConfirmDialog({ open: true, action: "FINAL_EXPORTED", item });
  }

  function handleCancel(item: ReviewQueueItem) {
    setConfirmDialog({ open: true, action: "CANCELLED", item });
  }

  function handleRequestRevision(item: ReviewQueueItem) {
    setReviewNoteValue(
      item.note || "Cần kiểm tra và chỉnh sửa lại biểu mẫu.",
    );
    setReviewNoteItem(item);
  }

  function handleRevisionSubmit(note: string) {
    if (!reviewNoteItem) return;
    void performStatusUpdate(reviewNoteItem.id, "NEEDS_REVISION", note);
    setReviewNoteItem(null);
  }

  function handleConfirmConfirm() {
    const { action, item } = confirmDialog;
    if (!item) return;
    const cfg = ACTION_CONFIG[action];
    void performStatusUpdate(item.id, action, cfg.note);
    setConfirmDialog({ open: false, action, item: null });
  }

  // ---------------------------------------------------------------------------
  // Client-side filtering
  // ---------------------------------------------------------------------------

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return items.filter((item) => {
      if (activeFilter !== "ALL" && item.reviewStatus !== activeFilter) {
        return false;
      }

      if (!normalizedKeyword) return true;

      return [
        item.templateCode,
        item.templateName,
        item.documentCode,
        item.documentTitle,
        item.caseCode,
        item.caseTitle,
        item.targetPersonName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedKeyword);
    });
  }, [activeFilter, items, keyword]);

  // ---------------------------------------------------------------------------
  // Dialog helpers
  // ---------------------------------------------------------------------------

  const confirmCfg = confirmDialog.item
    ? ACTION_CONFIG[confirmDialog.action]
    : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const totalCount = summary.total ?? items.length;

  return (
    <PageShell maxWidth="default">
      {/* Page header + summary cards */}
      <PageSection>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
              QUANLYVKS / REVIEW QUEUE
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Duyệt biểu mẫu đã xuất
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
              Biểu mẫu sau khi render DOCX/PDF sẽ xuất hiện ở đây để kiểm tra,
              mở xử lý, tải file và theo dõi trạng thái phê duyệt.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <SummaryCard label="Tổng biểu mẫu" value={totalCount} tone="neutral" />
          <SummaryCard
            label="Cần phê duyệt"
            value={summary.WAITING_REVIEW ?? 0}
            tone="amber"
          />
          <SummaryCard
            label="Cần sửa"
            value={summary.NEEDS_REVISION ?? 0}
            tone="red"
          />
          <SummaryCard
            label="Đã duyệt"
            value={summary.APPROVED ?? 0}
            tone="emerald"
          />
        </div>
      </PageSection>

      <ReviewQueueFilters
        filters={FILTERS}
        summary={summary}
        totalCount={totalCount}
        activeFilter={activeFilter}
        keyword={keyword}
        isLoading={isLoading}
        onFilterChange={setActiveFilter}
        onSearchChange={setKeyword}
        onReload={() => void loadQueue()}
      />

      {error ? <ErrorBanner error={error} /> : null}

      {isLoading ? <LoadingState variant="card" count={3} /> : null}

      {!isLoading && filteredItems.length === 0 ? (
        <EmptyState
          title="Không có biểu mẫu phù hợp"
          description="Không có biểu mẫu nào khớp với bộ lọc hiện tại. Hãy đổi trạng thái, từ khóa tìm kiếm hoặc tạo batch biểu mẫu mới."
        />
      ) : null}

      {!isLoading && filteredItems.length > 0 && (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <ReviewQueueItemCard
              key={item.id}
              item={item}
              updatingId={updatingId}
              onApprove={handleApprove}
              onRequestRevision={handleRequestRevision}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* Review note dialog for NEEDS_REVISION */}
      <ReviewNoteDialog
        open={reviewNoteItem !== null}
        documentTitle={reviewNoteItem?.documentTitle ?? ""}
        templateCode={reviewNoteItem?.templateCode ?? ""}
        defaultNote={reviewNoteValue}
        isSubmitting={updatingId !== null}
        onConfirm={handleRevisionSubmit}
        onCancel={() => setReviewNoteItem(null)}
      />

      {/* Confirm dialog for APPROVED / FINAL_EXPORTED / CANCELLED */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCfg?.title ?? ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.item
                ? confirmCfg?.description(confirmDialog.item)
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <button type="button">Hủy</button>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmConfirm}
              className={
                confirmCfg?.destructive
                  ? "bg-destructive hover:bg-destructive/90"
                  : undefined
              }
            >
              {confirmCfg?.confirmText ?? ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

type SummaryTone = "neutral" | "amber" | "red" | "emerald";

const SUMMARY_TONE_CLASSES: Record<
  SummaryTone,
  { border: string; bg: string; label: string }
> = {
  neutral: {
    border: "border-slate-200",
    bg: "bg-slate-50",
    label: "text-slate-500",
  },
  amber: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    label: "text-amber-700",
  },
  red: { border: "border-red-200", bg: "bg-red-50", label: "text-red-700" },
  emerald: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    label: "text-emerald-700",
  },
};

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: SummaryTone;
}) {
  const classes = SUMMARY_TONE_CLASSES[tone];
  return (
    <div
      className={`rounded-2xl border ${classes.border} ${classes.bg} p-4`}
    >
      <p className={`text-xs font-bold uppercase ${classes.label}`}>{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
