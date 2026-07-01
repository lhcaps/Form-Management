"use client";

/**
 * ReviewQueueItemCard — presentational component for a single review queue item.
 *
 * This component is purely presentational. All dialog logic lives in the page.
 *
 * Props:
 *   item          — the review queue item
 *   updatingId    — id of the item currently being updated (null = none)
 *   onApprove(item)       — open approve confirm dialog
 *   onRequestRevision(item) — open review note dialog
 *   onCancel(item)        — open cancel confirm dialog
 */

import { useState } from "react";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import type { ReviewQueueItem } from "@/lib/documents-review-api";
import { buildDocumentDownloadUrl } from "@/lib/documents-review-api";
import { downloadFile, DownloadError } from "@/lib/file-download";

interface ReviewQueueItemCardProps {
  item: ReviewQueueItem;
  updatingId: string | null;
  onApprove: (item: ReviewQueueItem) => void;
  onRequestRevision: (item: ReviewQueueItem) => void;
  onCancel: (item: ReviewQueueItem) => void;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Chưa có";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function FileDownloadLink({
  documentId,
  fileId,
  label,
}: {
  documentId: string;
  fileId: string;
  label: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const url = buildDocumentDownloadUrl(documentId, fileId);

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    if (isDownloading) return;

    setIsDownloading(true);
    setErrorMsg(null);

    try {
      await downloadFile(url, { filename: label });
    } catch (err) {
      setErrorMsg(
        err instanceof DownloadError
          ? err.message
          : "Tải file thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="contents">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDownloading}
        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={`Tải ${label}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {isDownloading ? "Đang tải..." : label}
      </button>
      {errorMsg ? (
        <span className="text-xs text-red-500" role="alert">
          {errorMsg}
        </span>
      ) : null}
    </div>
  );
}

export function ReviewQueueItemCard({
  item,
  updatingId,
  onApprove,
  onRequestRevision,
  onCancel,
}: ReviewQueueItemCardProps) {
  const isUpdating = updatingId === item.id;
  const docxFile = item.latestDocxFile;
  const pdfFile = item.latestPdfFile;

  return (
    <article
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
      aria-label={`Biểu mẫu ${item.templateCode}: ${item.documentTitle || item.templateName}`}
    >
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
          {item.templateCode}
        </span>

        <StatusBadge
          value={item.reviewStatus}
          type="review"
          label={item.reviewStatusLabel}
        />

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {item.hasPdf ? "Đã có PDF" : item.hasDocx ? "Đã có DOCX" : "Chưa có file"}
        </span>

        {/* File download links */}
        {(docxFile || pdfFile) && (
          <div className="ml-auto flex gap-1.5">
            {docxFile && (
              <FileDownloadLink
                documentId={item.id}
                fileId={docxFile.id}
                label="DOCX"
              />
            )}
            {pdfFile && (
              <FileDownloadLink
                documentId={item.id}
                fileId={pdfFile.id}
                label="PDF"
              />
            )}
          </div>
        )}
      </div>

      {/* Document title */}
      <h2 className="mt-3 text-xl font-black text-slate-950">
        {item.documentTitle || `${item.templateCode} — ${item.templateName}`}
      </h2>

      {/* Metadata grid */}
      <dl className="mt-3 grid gap-1.5 text-sm text-slate-600 md:grid-cols-2">
        <div className="contents">
          <dt className="flex-shrink-0 font-bold text-slate-800">Ngày tạo:</dt>
          <dd>{formatDateTime(item.generatedAt)}</dd>
        </div>

        {(item.caseCode || item.caseTitle) && (
          <div className="contents">
            <dt className="flex-shrink-0 font-bold text-slate-800">Hồ sơ:</dt>
            <dd>{item.caseCode || item.caseTitle}</dd>
          </div>
        )}

        {item.targetPersonName && (
          <div className="contents">
            <dt className="flex-shrink-0 font-bold text-slate-800">Người liên quan:</dt>
            <dd>{item.targetPersonName}</dd>
          </div>
        )}

        {item.generatedByName && (
          <div className="contents">
            <dt className="flex-shrink-0 font-bold text-slate-800">Người tạo:</dt>
            <dd>{item.generatedByName}</dd>
          </div>
        )}
      </dl>

      {/* Review note */}
      {item.note && (
        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-700">Ghi chú: </span>
          {item.note}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <a
          href={`/documents/${item.id}`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 sm:w-36"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Mở xử lý
        </a>

        <div className="flex flex-wrap gap-2">
          {item.reviewStatus !== "APPROVED" && (
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={() => onApprove(item)}
              disabled={isUpdating}
              className="rounded-2xl"
            >
              {isUpdating ? "Đang duyệt..." : "Phê duyệt"}
            </Button>
          )}

          {item.reviewStatus !== "NEEDS_REVISION" && (
            <Button
              type="button"
              variant="warning"
              size="sm"
              onClick={() => onRequestRevision(item)}
              disabled={isUpdating}
              className="rounded-2xl"
            >
              Yêu cầu sửa
            </Button>
          )}

          {item.reviewStatus !== "CANCELLED" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onCancel(item)}
              disabled={isUpdating}
              className="rounded-2xl"
            >
              Hủy
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
