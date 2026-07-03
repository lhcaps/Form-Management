"use client";

import { useEffect, useState } from "react";
import {
  getGeneratedDocumentAudit,
  type GeneratedDocumentAuditEntry,
} from "@/lib/generated-documents-api";
import { Badge } from "@/components/ui/badge";

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

function getActionVariant(action: string) {
  switch (action) {
    case "GENERATED_DOCUMENT_CREATED":
      return "blue";
    case "GENERATED_DOCUMENT_RENDERED_DOCX":
      return "violet";
    case "GENERATED_DOCUMENT_EXPORTED":
    case "GENERATED_DOCUMENT_DOWNLOADED":
      return "success";
    case "GENERATED_DOCUMENT_FILE_DELETED":
    case "GENERATED_DOCUMENT_FILES_BULK_DELETED":
      return "destructive";
    case "GENERATED_DOCUMENT_FILES_CLEANED_UP":
      return "warning";
    case "GENERATED_DOCUMENT_ACCESS_DENIED":
      return "muted";
    default:
      return "outline";
  }
}

function getResultVariant(result: string) {
  if (result === "SUCCESS") return "success";
  if (result === "DENIED") return "destructive";
  return "warning";
}

function AuditActionBadge({ action, label }: { action: string; label: string }) {
  return (
    <Badge variant={getActionVariant(action)} className="shrink-0">
      {label}
    </Badge>
  );
}

function AuditEntryRow({ entry }: { entry: GeneratedDocumentAuditEntry }) {
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <AuditActionBadge action={entry.action} label={actionLabel} />
          <Badge variant={getResultVariant(entry.result)}>
            {entry.result}
          </Badge>
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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
          <Badge variant="muted">
            {total} sự kiện
          </Badge>
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
