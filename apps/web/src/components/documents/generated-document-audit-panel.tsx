"use client";

import { useEffect, useState } from "react";
import {
  getGeneratedDocumentAudit,
  type GeneratedDocumentAuditEntry,
} from "@/lib/generated-documents-api";

type Props = {
  documentId: string;
};

function formatDateTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(value: string | number | null): string {
  if (!value) return "--";
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return String(value);
  if (bytes < 1024) return `${bytes} bytes`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

const ACTION_LABELS: Record<string, string> = {
  GENERATED_DOCUMENT_CREATED: "Tạo biểu mẫu",
  GENERATED_DOCUMENT_RENDERED_DOCX: "Render DOCX",
  GENERATED_DOCUMENT_EXPORTED: "Xuất file",
  GENERATED_DOCUMENT_DOWNLOADED: "Tải file",
  GENERATED_DOCUMENT_FILE_DELETED: "Xóa file",
  GENERATED_DOCUMENT_FILES_BULK_DELETED: "Xóa nhiều file",
  GENERATED_DOCUMENT_FILES_CLEANED_UP: "Dọn file cũ",
  GENERATED_DOCUMENT_ACCESS_DENIED: "Từ chối truy cập",
};

const ACTION_ICONS: Record<string, string> = {
  GENERATED_DOCUMENT_CREATED: "+",
  GENERATED_DOCUMENT_RENDERED_DOCX: "W",
  GENERATED_DOCUMENT_EXPORTED: "↓",
  GENERATED_DOCUMENT_DOWNLOADED: "↓",
  GENERATED_DOCUMENT_FILE_DELETED: "✕",
  GENERATED_DOCUMENT_FILES_BULK_DELETED: "✕",
  GENERATED_DOCUMENT_FILES_CLEANED_UP: "⌫",
  GENERATED_DOCUMENT_ACCESS_DENIED: "⊘",
};

const ACTION_COLORS: Record<string, { bg: string; text: string }> = {
  GENERATED_DOCUMENT_CREATED: { bg: "bg-blue-100", text: "text-blue-700" },
  GENERATED_DOCUMENT_RENDERED_DOCX: { bg: "bg-indigo-100", text: "text-indigo-700" },
  GENERATED_DOCUMENT_EXPORTED: { bg: "bg-emerald-100", text: "text-emerald-700" },
  GENERATED_DOCUMENT_DOWNLOADED: { bg: "bg-emerald-100", text: "text-emerald-700" },
  GENERATED_DOCUMENT_FILE_DELETED: { bg: "bg-red-100", text: "text-red-700" },
  GENERATED_DOCUMENT_FILES_BULK_DELETED: { bg: "bg-red-100", text: "text-red-700" },
  GENERATED_DOCUMENT_FILES_CLEANED_UP: { bg: "bg-amber-100", text: "text-amber-700" },
  GENERATED_DOCUMENT_ACCESS_DENIED: { bg: "bg-slate-100", text: "text-slate-600" },
};

function AuditIcon({ action }: { action: string }) {
  const icon = ACTION_ICONS[action] ?? "?";
  const colors = ACTION_COLORS[action] ?? { bg: "bg-slate-100", text: "text-slate-600" };
  return (
    <span
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${colors.bg} ${colors.text}`}
    >
      {icon}
    </span>
  );
}

function AuditEntryRow({ entry }: { entry: GeneratedDocumentAuditEntry }) {
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;
  const isSuccess = entry.result === "SUCCESS";
  const isDenied = entry.result === "DENIED";

  return (
    <div className="flex items-start gap-3 py-3">
      <AuditIcon action={entry.action} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-slate-900">
            {actionLabel}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
              isSuccess
                ? "bg-emerald-50 text-emerald-700"
                : isDenied
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
            }`}
          >
            {entry.result}
          </span>
        </div>
        {entry.actorName ? (
          <p className="mt-0.5 text-xs text-slate-500">bởi {entry.actorName}</p>
        ) : null}
        {entry.fileName ? (
          <p className="mt-0.5 text-xs text-slate-400 truncate max-w-xs">
            {entry.fileName}
            {entry.fileSizeBytes ? ` · ${formatBytes(entry.fileSizeBytes)}` : ""}
          </p>
        ) : null}
        {entry.reason ? (
          <p className="mt-0.5 text-xs text-slate-400">{entry.reason}</p>
        ) : null}
      </div>
      <time className="shrink-0 text-xs text-slate-400 tabular-nums">
        {formatDateTime(entry.createdAt)}
      </time>
    </div>
  );
}

export function GeneratedDocumentAuditPanel({ documentId }: Props) {
  const [entries, setEntries] = useState<GeneratedDocumentAuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void getGeneratedDocumentAudit(documentId, { limit: 100 })
      .then((data) => {
        if (!cancelled) {
          setEntries(data.entries);
          setTotal(data.total);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được lịch sử xuất/tải.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Lịch sử xuất/tải</h2>
        <p className="mt-2 text-sm text-slate-500">Đang tải...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">Lịch sử xuất/tải</h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-slate-950">Lịch sử xuất/tải</h2>
        {total > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {total} sự kiện
          </span>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">
          Chưa có lịch sử xuất/tải cho biểu mẫu này.
        </p>
      ) : (
        <>
          <div className="divide-y divide-slate-100">
            {entries.map((entry, idx) => (
              <AuditEntryRow
                key={`${entry.id}-${idx}`}
                entry={entry}
              />
            ))}
          </div>

          {total > entries.length && (
            <p className="mt-3 text-xs text-slate-400">
              Hiển thị {entries.length} / {total} sự kiện. Liên hệ quản trị viên để xem đầy đủ.
            </p>
          )}
        </>
      )}
    </section>
  );
}
