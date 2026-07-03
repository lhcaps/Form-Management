"use client";

import { useEffect, useMemo, useState } from "react";
import {
  bulkDeleteGeneratedDocumentFiles,
  cleanupGeneratedDocumentFiles,
  type GeneratedDocumentDetail,
  type GeneratedDocumentFile,
  getGeneratedDocument,
  getGeneratedDocumentDownloadUrl,
} from "@/lib/generated-documents-api";
import {
  PreExportCustomizationPanel,
  type RenderedFileMetadata,
} from "@/components/documents/pre-export-customization-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/common/error-banner";
import { StatusBadge } from "@/components/common/status-badge";
import { downloadFile, DownloadError } from "@/lib/file-download";

type Props = {
  documentId: string;
};

function formatBytes(value: string | number): string {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes < 0) {
    return `${value} bytes`;
  }

  if (bytes < 1024) {
    return `${bytes} bytes`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}

function sortFiles(files: GeneratedDocumentFile[]): GeneratedDocumentFile[] {
  return [...files].sort((a, b) => Number(b.id) - Number(a.id));
}

export function GeneratedDocumentActionPanel({ documentId }: Props) {
  const [data, setData] = useState<GeneratedDocumentDetail | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [latestPreviewMeta, setLatestPreviewMeta] = useState<RenderedFileMetadata | null>(null);

  async function handleDownloadLatest(file: GeneratedDocumentFile | undefined, _format: "DOCX" | "PDF") {
    if (!file) return;
    setDownloadError(null);
    try {
      const url = getGeneratedDocumentDownloadUrl(documentId, file.id);
      await downloadFile(url, { filename: file.fileName });
    } catch (err) {
      setDownloadError(
        err instanceof DownloadError
          ? err.message
          : "Tải file thất bại. Vui lòng thử lại.",
      );
    }
  }

  async function handleDownloadFile(file: GeneratedDocumentFile) {
    setDownloadError(null);
    try {
      const url = getGeneratedDocumentDownloadUrl(documentId, file.id);
      await downloadFile(url, { filename: file.fileName });
    } catch (err) {
      setDownloadError(
        err instanceof DownloadError
          ? err.message
          : "Tải file thất bại. Vui lòng thử lại.",
      );
    }
  }

  async function handleDownloadPreview() {
    const meta = latestPreviewMeta;
    if (!meta || !meta.fileId) return;
    setDownloadError(null);
    try {
      const url = getGeneratedDocumentDownloadUrl(documentId, meta.fileId);
      await downloadFile(url, { filename: meta.fileName ?? "preview.docx" });
    } catch (err) {
      setDownloadError(
        err instanceof DownloadError
          ? err.message
          : "Tải file thất bại. Vui lòng thử lại.",
      );
    }
  }

  function handlePreviewSuccess(metadata: RenderedFileMetadata) {
    setLatestPreviewMeta(metadata);
  }

  const files = useMemo(() => sortFiles(data?.files ?? []), [data?.files]);

  const latestDocx = useMemo(() => {
    return files.find((file) => file.fileFormat === "DOCX");
  }, [files]);

  const latestPdf = useMemo(() => {
    return files.find((file) => file.fileFormat === "PDF");
  }, [files]);

  const allVisibleSelected =
    files.length > 0 &&
    files.every((file) => selectedFileIds.has(String(file.id)));

  async function load() {
    try {
      setError(null);
      setLoading(true);

      const result = await getGeneratedDocument(documentId);

      setData(result);
      setSelectedFileIds((current) => {
        const existingIds = new Set((result.files ?? []).map((file) => String(file.id)));
        const next = new Set<string>();

        for (const id of current) {
          if (existingIds.has(id)) {
            next.add(id);
          }
        }

        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
     
  }, [documentId]);

  function toggleFile(fileId: string) {
    setSelectedFileIds((current) => {
      const next = new Set(current);

      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }

      return next;
    });
  }

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedFileIds(new Set());
      return;
    }

    setSelectedFileIds(new Set(files.map((file) => String(file.id))));
  }

  async function handleDeleteSelected() {
    const fileIds = Array.from(selectedFileIds);

    if (fileIds.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Bạn chắc chắn muốn xóa ${fileIds.length} file đã chọn? File sẽ bị xóa khỏi database và ổ đĩa.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading("DELETE_SELECTED");
      setError(null);
      setSuccessMessage(null);

      await bulkDeleteGeneratedDocumentFiles(documentId, fileIds);
      setSelectedFileIds(new Set());
      await load();

      setSuccessMessage(`Đã xóa ${fileIds.length} file đã chọn.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Xóa tệp đã chọn thất bại.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCleanupOldFiles() {
    const confirmed = window.confirm(
      "Dọn tệp cũ sẽ giữ lại DOCX mới nhất và PDF mới nhất, xóa toàn bộ file còn lại. Tiếp tục?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading("CLEANUP");
      setError(null);
      setSuccessMessage(null);

      const result = await cleanupGeneratedDocumentFiles(documentId);

      setSelectedFileIds(new Set());
      await load();

      setSuccessMessage(
        `Đã dọn ${result.deletedCount} file cũ. Giữ lại ${result.keptCount} file mới nhất.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dọn tệp cũ thất bại.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Đang tải biểu mẫu...</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Biểu mẫu đã tạo
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          {data?.documentTitle || `Document #${documentId}`}
        </h2>
        {data?.reviewStatus ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <span>Trạng thái:</span>
            <StatusBadge type="review" value={data.reviewStatus} />
          </div>
        ) : null}
      </div>

      {error ? (
        <ErrorBanner
          error={error}
          title="Không thể cập nhật tệp đã tạo"
          className="mb-4"
        />
      ) : null}

      {downloadError ? (
        <ErrorBanner
          error={downloadError}
          title="Không tải được tệp"
          className="mb-4"
        />
      ) : null}

      {successMessage ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <Badge variant="success">Hoàn tất</Badge>
          <span>{successMessage}</span>
        </div>
      ) : null}

      <PreExportCustomizationPanel
        documentId={documentId}
        onFilesChanged={load}
        onPreviewSuccess={handlePreviewSuccess}
      />

      {/* Preview success panel - shown only after preview is generated */}
      {latestPreviewMeta ? (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="success">Đã tạo bản xem trước</Badge>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                Bạn có thể kiểm tra định dạng trước khi tải file DOCX.
              </h3>
              {latestPreviewMeta.fileName ? (
                <p className="mt-1 text-sm text-slate-600">
                  File: {latestPreviewMeta.fileName}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`/documents/${documentId}?tab=preview`}>
                    Mở bản xem trước
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={`/documents/${documentId}?tab=history`}>
                    Lịch sử xử lý
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                onClick={handleDownloadPreview}
                disabled={!latestPreviewMeta?.fileId}
              >
                Tải DOCX
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <Button
          type="button"
          onClick={() => handleDownloadLatest(latestDocx, "DOCX")}
          disabled={!latestDocx}
          variant="outline"
        >
          Tải DOCX mới nhất
        </Button>

        <Button
          type="button"
          onClick={() => handleDownloadLatest(latestPdf, "PDF")}
          disabled={!latestPdf}
          variant="outline"
        >
          Tải PDF mới nhất
        </Button>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Tệp đã tạo</p>
            <p className="text-xs text-slate-500">
              Chọn tệp để xóa thủ công hoặc dọn nhanh tệp cũ.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={toggleSelectAll}
              disabled={files.length === 0 || actionLoading !== null}
              variant="outline"
              size="sm"
            >
              {allVisibleSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </Button>

            <Button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedFileIds.size === 0 || actionLoading !== null}
              variant="destructive"
              size="sm"
            >
              {actionLoading === "DELETE_SELECTED"
                ? "Đang xóa..."
                : `Xóa tệp đã chọn (${selectedFileIds.size})`}
            </Button>

            <Button
              type="button"
              onClick={handleCleanupOldFiles}
              disabled={files.length <= 2 || actionLoading !== null}
              variant="warning"
              size="sm"
            >
              {actionLoading === "CLEANUP" ? "Đang dọn..." : "Dọn tệp cũ"}
            </Button>
          </div>
        </div>

        {files.length ? (
          <div className="space-y-2">
            {files.map((file) => {
              const isSelected = selectedFileIds.has(String(file.id));
              const isLatestDocx = latestDocx?.id === file.id;
              const isLatestPdf = latestPdf?.id === file.id;

              return (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    isSelected
                      ? "border-slate-400 bg-slate-100"
                      : "bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFile(String(file.id))}
                    className="h-4 w-4 rounded border-slate-300"
                    aria-label={`Chọn file ${file.fileName}`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="break-all text-sm font-medium text-slate-900">
                      {file.fileFormat} - {file.fileName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      ID: {file.id} · Size: {formatBytes(file.fileSizeBytes)}
                      {isLatestDocx ? " · DOCX mới nhất" : ""}
                      {isLatestPdf ? " · PDF mới nhất" : ""}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleDownloadFile(file)}
                    variant="ghost"
                    size="sm"
                  >
                    Tải
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
            Chưa có file nào. Hãy dùng mục &quot;Tùy chỉnh trước khi xuất&quot; ở trên để tạo Word hoặc PDF.
          </p>
        )}
      </div>
    </section>
  );
}
