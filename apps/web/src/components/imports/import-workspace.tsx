"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorBanner } from "@/components/common/error-banner";
import { LoadingState } from "@/components/common/loading-state";
import { PageSection } from "@/components/common/page-shell";
import {
  StatusBadge,
  importStatusLabel,
} from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UploadCloud } from "lucide-react";
import {
  confirmImportBatch,
  getImportBatch,
  getImportFileDownloadUrl,
  getImportHistory,
  searchCases,
  type CaseSummary,
  type ConfirmImportPayload,
  type ImportBatchDetail,
  type ImportDetectedCandidate,
  type ImportHistoryItem,
  type ImportParsedPayload,
  type ImportTargetType,
  uploadImportFiles,
} from "@/lib/imports-api";

const targetOptions: Array<{
  value: ImportTargetType;
  label: string;
  description: string;
}> = [
  {
    value: "RAW_REFERENCE",
    label: "Lưu làm tài liệu tham khảo",
    description: "Giữ file gốc và nội dung trích xuất để tra cứu lại sau.",
  },
  {
    value: "EXISTING_CASE",
    label: "Gắn vào hồ sơ có sẵn",
    description: "Đính kèm file import vào một hồ sơ hiện có.",
  },
  {
    value: "NEW_CASE",
    label: "Tạo hồ sơ mới",
    description: "Tạo hồ sơ mới từ dữ liệu gợi ý, sau đó gắn file import vào hồ sơ đó.",
  },
  {
    value: "TEMPLATE_SOURCE",
    label: "Lưu làm nguồn biểu mẫu",
    description: "Lưu lô import để tham khảo khi chuẩn hóa biểu mẫu sau này.",
  },
];

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

// Maps a candidate-column confidence value to a shadcn Badge variant.
// Preserves the exact threshold logic the previous `confidenceTone`
// helper used: `cao` → success, `vừa` → warning, anything else → muted.
// Display text (`cao` / `vừa` / `thấp`) is rendered separately by callers.
function confidenceBadgeVariant(
  value: ImportDetectedCandidate["confidence"] | "cao" | "vừa" | "thấp",
): "success" | "warning" | "muted" {
  switch (value) {
    case "cao":
      return "success";
    case "vừa":
      return "warning";
    default:
      return "muted";
  }
}

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <PageSection card className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[20px] font-black tracking-[-0.02em] text-slate-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[14px] leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div>{children}</div>
    </PageSection>
  );
}

function PreviewTable({ parsedJson }: { parsedJson?: ImportParsedPayload | null }) {
  if (!parsedJson || parsedJson.kind !== "table") {
    return null;
  }

  return (
    <div className="space-y-4">
      {parsedJson.tables.map((table) => (
        <div
          key={table.sheetName}
          className="overflow-hidden rounded-2xl border border-slate-200"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <div className="text-[14px] font-black text-slate-900">
                {table.sheetName}
              </div>
              <div className="text-[12px] text-slate-500">
                {table.totalRows} dòng
              </div>
            </div>
            {table.candidateColumns.length ? (
              <div className="flex flex-wrap gap-2">
                {table.candidateColumns.map((column) => (
                  <Badge
                    key={column.id}
                    variant={confidenceBadgeVariant(column.confidence)}
                    className="whitespace-nowrap px-2 py-0.5 text-[11px]"
                  >
                    {column.columnName} → {column.mappedField}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <Table className="min-w-full border-collapse text-left text-[13px]">
            <TableHeader>
              <TableRow className="bg-white hover:bg-white">
                {table.headers.map((header) => (
                  <TableHead
                    key={header}
                    className="border-b border-slate-200 px-4 py-3 font-black text-slate-700"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row, index) => (
                <TableRow
                  key={`${table.sheetName}-${index}`}
                  className="odd:bg-white even:bg-slate-50/70"
                >
                  {table.headers.map((header) => (
                    <TableCell
                      key={`${index}-${header}`}
                      className="border-b border-slate-100 px-4 py-3 align-top text-slate-700"
                    >
                      {row[header] || <span className="text-slate-300">Trống</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

export function ImportWorkspace() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState<ImportBatchDetail | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<ImportTargetType>("RAW_REFERENCE");
  const [selectedExistingCaseId, setSelectedExistingCaseId] = useState("");
  const [existingCaseQuery, setExistingCaseQuery] = useState("");
  const [caseOptions, setCaseOptions] = useState<CaseSummary[]>([]);
  const [caseSearchError, setCaseSearchError] = useState<string | null>(null);
  const [caseSearchLoading, setCaseSearchLoading] = useState(false);
  const [note, setNote] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [, startHistoryTransition] = useTransition();
  const [loadingBatchId, setLoadingBatchId] = useState<string | null>(null);
  const [newCaseForm, setNewCaseForm] = useState({
    caseCode: "",
    caseTitle: "",
    relatedPersonName: "",
    offenseName: "",
    createdDate: "",
  });

  const selectedFile = useMemo(() => {
    if (!currentBatch?.files.length) {
      return null;
    }

    return (
      currentBatch.files.find((file) => file.fileId === selectedFileId) ??
      currentBatch.files[0]
    );
  }, [currentBatch, selectedFileId]);

  const canConfirm = useMemo(() => {
    if (!currentBatch || currentBatch.status === "CONFIRMED") {
      return false;
    }

    if (targetType === "EXISTING_CASE") {
      return Boolean(selectedExistingCaseId);
    }

    if (targetType === "NEW_CASE") {
      return Boolean(newCaseForm.caseTitle.trim());
    }

    return true;
  }, [currentBatch, newCaseForm.caseTitle, selectedExistingCaseId, targetType]);

  async function loadHistory() {
    setHistoryError(null);
    setHistoryLoading(true);

    try {
      const response = await getImportHistory(1, 12);
      setHistory(response.items);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Không tải được lịch sử import.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    startHistoryTransition(() => {
      void loadHistory();
    });
  }, []);

  useEffect(() => {
    if (!currentBatch) {
      return;
    }

    setSelectedFileId(currentBatch.files[0]?.fileId ?? null);
    setTargetType(currentBatch.target?.type ?? "RAW_REFERENCE");
    setNewCaseForm(currentBatch.suggestedNewCase);
    setNote("");
    setConfirmError(null);
  }, [currentBatch?.batchId]);

  useEffect(() => {
    if (targetType !== "EXISTING_CASE") {
      return;
    }

    const keyword = existingCaseQuery.trim();

    if (!keyword) {
      setCaseOptions([]);
      setCaseSearchError(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      setCaseSearchLoading(true);
      setCaseSearchError(null);

      try {
        const response = await searchCases(keyword);
        setCaseOptions(response);
      } catch (error) {
        setCaseSearchError(
          error instanceof Error
            ? error.message
            : "Không tìm được hồ sơ phù hợp.",
        );
      } finally {
        setCaseSearchLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [existingCaseQuery, targetType]);

  function handleChosenFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    setSelectedFiles(Array.from(fileList).slice(0, 20));
    setUploadError(null);
  }

  async function handleUpload() {
    if (!selectedFiles.length) {
      setUploadError("Vui lòng chọn ít nhất một tệp trước khi tải lên.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const batch = await uploadImportFiles(selectedFiles, {
        onProgress: setUploadProgress,
      });
      setCurrentBatch(batch);
      setSelectedFiles([]);
      await loadHistory();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Không tải được tệp lên.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleOpenHistoryBatch(batchId: string) {
    setLoadingBatchId(batchId);
    setUploadError(null);

    try {
      const batch = await getImportBatch(batchId);
      setCurrentBatch(batch);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Không mở được lô import.",
      );
    } finally {
      setLoadingBatchId(null);
    }
  }

  async function handleConfirmImport() {
    if (!currentBatch) {
      return;
    }

    const payload: ConfirmImportPayload = {
      targetType,
      note: note.trim() || undefined,
    };

    if (targetType === "EXISTING_CASE") {
      payload.existingCaseId = selectedExistingCaseId;
    }

    if (targetType === "NEW_CASE") {
      payload.newCase = {
        caseCode: newCaseForm.caseCode.trim() || undefined,
        caseTitle: newCaseForm.caseTitle.trim(),
        relatedPersonName: newCaseForm.relatedPersonName.trim() || undefined,
        offenseName: newCaseForm.offenseName.trim() || undefined,
        createdDate: newCaseForm.createdDate || undefined,
      };
    }

    setConfirming(true);
    setConfirmError(null);

    try {
      const batch = await confirmImportBatch(currentBatch.batchId, payload);
      setCurrentBatch(batch);
      await loadHistory();
    } catch (error) {
      setConfirmError(
        error instanceof Error
          ? error.message
          : "Không xác nhận được lô import.",
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Import dữ liệu"
        description="Kéo thả file vào đây hoặc bấm để chọn. Chấp nhận PDF, Word, Excel, CSV, TXT, JSON, hình ảnh."
      >
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              handleChosenFiles(event.dataTransfer.files);
            }}
            className={[
              "rounded-[24px] border-2 border-dashed px-6 py-10 text-center transition",
              dragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50",
            ].join(" ")}
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-slate-700 shadow-sm">
              <UploadCloud
                className="h-8 w-8"
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>
            <div className="mt-5 text-[18px] font-black tracking-[-0.02em] text-slate-950">
              Kéo thả file vào đây hoặc bấm để chọn
            </div>
            <p className="mt-2 text-[14px] leading-6 text-slate-500">
              Chấp nhận PDF, Word, Excel, CSV, TXT, JSON, hình ảnh. Mỗi file tối đa 50MB.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 rounded-full px-5"
            >
              <label className="cursor-pointer">
                Chọn file
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.png,.jpg,.jpeg,.webp,.tif,.tiff"
                  onChange={(event) => handleChosenFiles(event.target.files)}
                />
              </label>
            </Button>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="text-[15px] font-black text-slate-950">Danh sách file</div>
            <div className="mt-3 space-y-3">
              {selectedFiles.length ? (
                selectedFiles.map((file) => (
                  <div
                    key={`${file.name}-${file.lastModified}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="truncate text-[14px] font-bold text-slate-900">
                      {file.name}
                    </div>
                    <div className="mt-1 text-[12px] text-slate-500">
                      {formatBytes(file.size)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-[14px] text-slate-500">
                  Chưa có file nào được chọn.
                </div>
              )}
            </div>

            {uploading ? (
              <div className="mt-5">
                <div className="flex items-center justify-between text-[13px] font-bold text-slate-600">
                  <span>Đang tải lên và trích xuất dữ liệu...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {uploadError ? (
              <div className="mt-4">
                <ErrorBanner error={uploadError} title="Không tải được tệp lên" />
              </div>
            ) : null}

            <Button
              type="button"
              size="lg"
              onClick={() => void handleUpload()}
              disabled={uploading || !selectedFiles.length}
              className="mt-5 w-full sm:w-auto"
            >
              Tải lên
            </Button>
          </div>
        </div>
      </SectionCard>

      {currentBatch ? (
        <div className="grid gap-6 xl:grid-cols-[0.38fr_0.62fr]">
          <SectionCard
            title="Xem trước dữ liệu"
            description="Nếu không trích xuất được nội dung, hệ thống vẫn giữ an toàn file gốc."
            action={<StatusBadge type="import" value={currentBatch.status} />}
          >
            <div className="space-y-4">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Lô import
                </div>
                <div className="mt-2 text-[16px] font-black text-slate-950">
                  {currentBatch.batchId}
                </div>
                <div className="mt-2 text-[13px] leading-6 text-slate-600">
                  {currentBatch.fileCount} file • {currentBatch.processedFiles} đã xử lý •{" "}
                  {currentBatch.failedFiles} lỗi
                </div>
                <div className="text-[13px] leading-6 text-slate-500">
                  Tạo lúc {formatDateTime(currentBatch.createdAt)}
                </div>
              </div>

              <div className="space-y-2">
                {currentBatch.files.map((file) => (
                  <Button
                    key={file.fileId}
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedFileId(file.fileId)}
                    className={[
                      "h-auto w-full justify-start rounded-[22px] border px-4 py-3 text-left whitespace-normal shadow-none",
                      selectedFile?.fileId === file.fileId
                        ? "border-blue-400 bg-blue-50 text-foreground hover:bg-blue-50"
                        : "bg-white hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-black text-slate-900">
                          {file.fileName}
                        </div>
                        <div className="mt-1 text-[12px] text-slate-500">
                          {file.fileType} • {formatBytes(file.sizeBytes)}
                        </div>
                      </div>
                      <StatusBadge type="import" value={file.parseStatus} />
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="space-y-6">
            <SectionCard
              title="Nội dung trích xuất"
              description="Nếu không nhập gì thêm, hệ thống chỉ lưu kết quả đã trích xuất và file gốc."
              action={
                selectedFile?.downloadAvailable ? (
                  <a
                    href={getImportFileDownloadUrl(selectedFile.fileId)}
                    className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-[13px] font-black text-slate-700 transition hover:bg-slate-50"
                  >
                    Tải file gốc
                  </a>
                ) : null
              }
            >
              {selectedFile ? (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        Tên file
                      </div>
                      <div className="mt-1 text-[14px] font-black text-slate-900">
                        {selectedFile.fileName}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        Loại file
                      </div>
                      <div className="mt-1 text-[14px] font-black text-slate-900">
                        {selectedFile.fileType}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        Dung lượng
                      </div>
                      <div className="mt-1 text-[14px] font-black text-slate-900">
                        {formatBytes(selectedFile.sizeBytes)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        Trạng thái
                      </div>
                      <div className="mt-1 text-[14px] font-black text-slate-900">
                        {importStatusLabel(selectedFile.parseStatus)}
                      </div>
                    </div>
                  </div>

                  {selectedFile.previewText ? (
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[15px] font-black text-slate-950">
                        Xem trước dữ liệu
                      </div>
                      <pre className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-6 text-slate-700">
                        {selectedFile.previewText}
                      </pre>
                    </div>
                  ) : (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
                      {selectedFile.warnings[0] ??
                        "Không trích xuất được nội dung, nhưng file gốc đã được lưu."}
                    </div>
                  )}

                  {selectedFile.parsedJson?.kind === "table" ? (
                    <div>
                      <div className="mb-3 text-[15px] font-black text-slate-950">
                        Bảng dữ liệu
                      </div>
                      <PreviewTable parsedJson={selectedFile.parsedJson} />
                    </div>
                  ) : null}

                  {selectedFile.parsedJson?.kind === "json" ? (
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-[15px] font-black text-slate-950">
                        Bảng dữ liệu
                      </div>
                      <pre className="mt-3 whitespace-pre-wrap break-words text-[13px] leading-6 text-slate-700">
                        {selectedFile.parsedJson.preview}
                      </pre>
                    </div>
                  ) : null}

                  {selectedFile.candidates.length ? (
                    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                      <div className="text-[15px] font-black text-slate-950">
                        Trường dữ liệu gợi ý
                      </div>
                      <div className="mt-4 space-y-3">
                        {selectedFile.candidates.map((candidate) => (
                          <div
                            key={candidate.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-[14px] font-black text-slate-900">
                                {candidate.label}: {candidate.value}
                              </div>
                              <Badge
                                  variant={confidenceBadgeVariant(candidate.confidence)}
                                >
                                  {candidate.confidence}
                                </Badge>
                            </div>
                            <div className="mt-2 text-[13px] leading-6 text-slate-500">
                              {candidate.source}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {(selectedFile.warnings.length || selectedFile.errorMessage) ? (
                    <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                      <div className="text-[15px] font-black text-amber-900">
                        Cảnh báo
                      </div>
                      <div className="mt-3 space-y-2 text-[14px] leading-6 text-amber-800">
                        {selectedFile.warnings.map((warning, index) => (
                          <p key={`${warning}-${index}`}>{warning}</p>
                        ))}
                        {selectedFile.errorMessage ? <p>{selectedFile.errorMessage}</p> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="Chưa chọn file để xem trước"
                  description="Chọn một file ở cột bên trái để xem trước dữ liệu."
                />
              )}
            </SectionCard>

            <SectionCard
              title="Chọn nơi lưu"
              description="Nếu không nhập, hệ thống sẽ giữ nguyên kết quả trích xuất và file gốc."
            >
              <RadioGroup
                value={targetType}
                onValueChange={(value) => setTargetType(value as ImportTargetType)}
                className="space-y-3"
                name="targetType"
              >
                {targetOptions.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`targetType-${option.value}`}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-[22px] border px-4 py-4 transition",
                      targetType === option.value
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <RadioGroupItem
                      id={`targetType-${option.value}`}
                      value={option.value}
                      className="mt-1"
                    />
                    <div>
                      <div className="text-[15px] font-black text-slate-950">
                        {option.label}
                      </div>
                      <div className="mt-1 text-[13px] leading-6 text-slate-500">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </RadioGroup>

              {targetType === "EXISTING_CASE" ? (
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[15px] font-black text-slate-950">
                    Gắn vào hồ sơ có sẵn
                  </div>
                  <Input
                    value={existingCaseQuery}
                    onChange={(event) => setExistingCaseQuery(event.target.value)}
                    placeholder="Nhập mã hồ sơ hoặc tên vụ án"
                    className="mt-3 h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]"
                  />
                  {caseSearchLoading ? (
                    <p className="mt-3 text-[13px] text-slate-500">Đang tìm hồ sơ...</p>
                  ) : null}
                  {caseSearchError ? (
                    <p className="mt-3 text-[13px] text-rose-600">{caseSearchError}</p>
                  ) : null}
                  <div className="mt-3 space-y-2">
                    {caseOptions.map((item) => (
                      <Button
                        key={item.id}
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedExistingCaseId(item.id);
                          setExistingCaseQuery(`${item.caseCode} - ${item.caseTitle}`);
                        }}
                        className={[
                          "h-auto w-full justify-start whitespace-normal rounded-2xl border px-4 py-3 text-left shadow-none",
                          selectedExistingCaseId === item.id
                            ? "border-blue-400 bg-blue-50 text-foreground hover:bg-blue-50"
                            : "bg-white hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <div>
                          <div className="text-[14px] font-black text-slate-900">
                            {item.caseCode}
                          </div>
                          <div className="mt-1 text-[13px] text-slate-500">
                            {item.caseTitle}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {targetType === "NEW_CASE" ? (
                <div className="mt-5 grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-[13px] font-bold text-slate-600">Mã hồ sơ</span>
                    <Input
                      value={newCaseForm.caseCode}
                      onChange={(event) =>
                        setNewCaseForm((current) => ({
                          ...current,
                          caseCode: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-bold text-slate-600">Ngày tạo</span>
                    <Input
                      type="date"
                      value={newCaseForm.createdDate}
                      onChange={(event) =>
                        setNewCaseForm((current) => ({
                          ...current,
                          createdDate: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-[13px] font-bold text-slate-600">Tên vụ án</span>
                    <Input
                      value={newCaseForm.caseTitle}
                      onChange={(event) =>
                        setNewCaseForm((current) => ({
                          ...current,
                          caseTitle: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-bold text-slate-600">
                      Tên bị can/người liên quan
                    </span>
                    <Input
                      value={newCaseForm.relatedPersonName}
                      onChange={(event) =>
                        setNewCaseForm((current) => ({
                          ...current,
                          relatedPersonName: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-bold text-slate-600">Tội danh</span>
                    <Input
                      value={newCaseForm.offenseName}
                      onChange={(event) =>
                        setNewCaseForm((current) => ({
                          ...current,
                          offenseName: event.target.value,
                        }))
                      }
                      className="mt-2 h-11 rounded-2xl border-slate-200 bg-white px-4 text-[14px]"
                    />
                  </label>
                </div>
              ) : null}

              <label className="mt-5 block">
                <span className="text-[13px] font-bold text-slate-600">Ghi chú</span>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Có thể để trống nếu không cần."
                  className="mt-2 min-h-[88px] rounded-[22px] border-slate-200 bg-white px-4 py-3 text-[14px]"
                />
              </label>

              {confirmError ? (
                <div className="mt-4">
                  <ErrorBanner error={confirmError} title="Không xác nhận được lô import" />
                </div>
              ) : null}

              {currentBatch.target ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800">
                  <div className="font-black">Import thành công</div>
                  <div className="mt-1">{currentBatch.target.summary}</div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="success"
                  size="lg"
                  onClick={() => void handleConfirmImport()}
                  disabled={!canConfirm || confirming}
                  className="min-h-11 px-5"
                >
                  {confirming ? "Đang lưu..." : "Xác nhận import"}
                </Button>
                <Link
                  href="/cases"
                  className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-5 text-[14px] font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Hồ sơ vụ án
                </Link>
              </div>
            </SectionCard>
          </div>
        </div>
      ) : (
        <SectionCard
          title="Xem trước dữ liệu"
          description="Sau khi tải lên, hệ thống sẽ hiển thị nội dung trích xuất, bảng dữ liệu, cảnh báo và gợi ý trường dữ liệu ngay tại đây."
        >
          <EmptyState
            title="Chưa có lô import nào đang mở"
            description="Tải lên file để bắt đầu quy trình: chọn file → xem trước → xác nhận import."
          />
        </SectionCard>
      )}

      <SectionCard
        title="Lịch sử import"
        description="Danh sách các lô đã tải lên gần đây. Bấm vào một lô để xem lại dữ liệu."
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              startHistoryTransition(() => {
                void loadHistory();
              });
            }}
            className="rounded-full px-4 text-[13px] font-bold"
          >
            Tải lại
          </Button>
        }
      >
        {historyError ? (
          <div className="mb-4">
            <ErrorBanner error={historyError} title="Không tải được lịch sử import" />
          </div>
        ) : null}

        {historyLoading ? (
          <LoadingState variant="list" count={3} />
        ) : null}

        {!historyLoading && !history.length ? (
          <EmptyState
            title="Chưa có lịch sử import nào."
            description="Danh sách các lô đã tải lên sẽ xuất hiện ở đây."
          />
        ) : null}

        {!historyLoading && history.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {history.map((item) => (
              <Button
                key={item.batchId}
                type="button"
                variant="outline"
                onClick={() => void handleOpenHistoryBatch(item.batchId)}
                className="h-auto w-full flex-col items-stretch justify-start whitespace-normal rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-none hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              >
                <div className="flex w-full items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-black text-slate-950">
                      {item.batchId}
                    </div>
                    <div className="mt-1 text-[13px] text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                  <StatusBadge type="import" value={item.status} />
                </div>
                <div className="mt-4 text-[13px] leading-6 text-slate-600">
                  {item.fileCount} file • {item.processedFiles} đã xử lý • {item.failedFiles} lỗi
                </div>
                {item.target?.summary ? (
                  <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
                    {item.target.summary}
                  </div>
                ) : null}
                {item.files.length ? (
                  <div className="mt-4 space-y-2">
                    {item.files.map((file) => (
                      <div key={file.fileId} className="rounded-2xl bg-slate-50 px-3 py-2">
                        <div className="truncate text-[13px] font-bold text-slate-800">
                          {file.fileName}
                        </div>
                        <div className="mt-1 text-[12px] text-slate-500">
                          {importStatusLabel(file.parseStatus)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 text-[13px] font-black text-blue-700">
                  {loadingBatchId === item.batchId ? "Đang mở..." : "Mở lại lô import"}
                </div>
              </Button>
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
