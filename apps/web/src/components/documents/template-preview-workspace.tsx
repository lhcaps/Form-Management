"use client";

import type { CompiledFormContract } from "@qllaw/form-contracts";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorBanner } from "@/components/common/error-banner";
import { RuntimePdfPreview } from "@/components/documents/runtime-pdf-preview";
import { ContractV2Renderer } from "@/features/forms-contracts/ContractV2Renderer";
import { getSampleData, mergeWithSampleData } from "@/features/forms-contracts/sample-data";
import { getCaseDetail, type CaseDetail } from "@/lib/case-detail-api";
import { readApi } from "@/lib/api-client";
import { getRuntimeFormContract } from "@/lib/form-studio-api";
import { normalizeTemplateCode } from "@/lib/template-open-workflow";
import {
  downloadRuntimeTemplateDocx,
} from "@/lib/runtime-template-export";
import {
  createRuntimePreviewSession,
  downloadRuntimePreviewDocxByUrl,
  type RuntimePreviewSessionResponse,
} from "@/lib/runtime-template-preview";
import {
  loadRuntimeTemplateDraft,
  saveRuntimeTemplateDraft,
} from "@/lib/runtime-template-draft";
import {
  buildRuntimeTemplateCaseImportData,
  mergeRuntimeTemplateCaseImportData,
} from "@/lib/runtime-template-case-import";

type RuntimeContract = {
  source: string;
  contractVersion: string;
  contractHash: string;
  templateHash: string;
  compiledContract: CompiledFormContract;
};

type CaseOption = {
  id: string;
  caseCode: string;
  caseTitle: string;
  currentStage: string | null;
  currentStatus: string | null;
};

function snapshot(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}

function safeTemplateCode(templateCode: string): string {
  try {
    return normalizeTemplateCode(templateCode);
  } catch {
    return templateCode;
  }
}

function loadStoredDraft(
  templateCode: string,
  contractHash: string,
): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  return loadRuntimeTemplateDraft(window.localStorage, templateCode, contractHash);
}

function saveStoredDraft(
  templateCode: string,
  contractHash: string,
  data: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  saveRuntimeTemplateDraft(window.localStorage, templateCode, contractHash, data);
}

function formatRuntimePreviewWarning(
  warning: RuntimePreviewSessionResponse["warnings"][number],
): string {
  if (typeof warning === "string") return warning;
  return `${warning.code}: ${warning.message}`;
}

export function TemplatePreviewWorkspace({ templateCode }: { templateCode: string }) {
  const normalizedTemplateCode = useMemo(
    () => safeTemplateCode(templateCode),
    [templateCode],
  );
  const [runtime, setRuntime] = useState<RuntimeContract | null>(null);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot({}));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  const [casePickerOpen, setCasePickerOpen] = useState(false);
  const [caseOptions, setCaseOptions] = useState<CaseOption[]>([]);
  const [caseSearch, setCaseSearch] = useState("");
  const [casePickerLoading, setCasePickerLoading] = useState(false);
  const [casePickerError, setCasePickerError] = useState("");
  const [applyingCaseId, setApplyingCaseId] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseOption | null>(null);
  const [previewSession, setPreviewSession] = useState<RuntimePreviewSessionResponse | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    setMessage("");
    setRuntime(null);
    setData({});
    setSavedSnapshot(snapshot({}));

    try {
      normalizeTemplateCode(normalizedTemplateCode);
    } catch (err) {
      setError(err);
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    void getRuntimeFormContract(normalizedTemplateCode)
      .then((result) => {
        if (!active) return;
        const draft = loadStoredDraft(
          normalizedTemplateCode,
          result.contractHash,
        );
        const nextData = draft ?? {};
        setRuntime(result);
        setData(nextData);
        setSavedSnapshot(snapshot(nextData));
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error
              ? err
              : new Error(`Không tải được runtime contract ${normalizedTemplateCode}.`),
          );
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [normalizedTemplateCode]);

  const contract = runtime?.compiledContract ?? null;
  const currentSnapshot = useMemo(() => snapshot(data), [data]);
  const isDirty = !isLoading && currentSnapshot !== savedSnapshot;
  const hasVisualPreview = Boolean(previewSession?.pdfPreviewUrl);
  const hasDocxOnlyPreview = Boolean(
    previewSession && !previewSession.pdfPreviewUrl,
  );
  const title = contract?.title?.trim() || normalizedTemplateCode;
  const statusText = isSaving
    ? "Đang lưu bản nháp"
    : isExporting
      ? "Đang tạo bản xem trước"
      : isDirty
        ? "Có thay đổi chưa lưu"
        : previewSession
          ? hasVisualPreview
            ? "Đã tạo bản xem trước"
            : "Đã tạo file DOCX tạm thời"
          : "Bản nháp đã lưu";

  const filteredCaseOptions = useMemo(() => {
    const needle = caseSearch.trim().toLowerCase();
    if (!needle) return caseOptions;
    return caseOptions.filter((item) =>
      `${item.caseCode} ${item.caseTitle}`.toLowerCase().includes(needle),
    );
  }, [caseOptions, caseSearch]);

  function saveDraft(nextData = data) {
    if (!runtime) return;
    setIsSaving(true);
    try {
      saveStoredDraft(normalizedTemplateCode, runtime.contractHash, nextData);
      setSavedSnapshot(snapshot(nextData));
      setMessage("Đã lưu bản nháp biểu mẫu trên máy này.");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Không lưu được bản nháp."));
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Preview: create a runtime preview session and show the preview panel.
   * Uses the new preview-session endpoint. Does NOT auto-download.
   */
  async function previewDocx() {
    if (!runtime) return;
    setIsExporting(true);
    setError(null);
    setMessage("");
    try {
      saveStoredDraft(normalizedTemplateCode, runtime.contractHash, data);
      setSavedSnapshot(snapshot(data));
      const session = await createRuntimePreviewSession(normalizedTemplateCode, data);
      setPreviewSession(session);
      setMessage(session.pdfPreviewUrl ? "Đã tạo bản xem trước." : "");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Không tạo được bản xem trước."));
    } finally {
      setIsExporting(false);
    }
  }

  /**
   * Download: trigger immediate DOCX download.
   * Available only after preview succeeds.
   */
  async function exportDocx() {
    if (!runtime) return;
    setIsExporting(true);
    setError(null);
    setMessage("");
    try {
      saveStoredDraft(normalizedTemplateCode, runtime.contractHash, data);
      setSavedSnapshot(snapshot(data));
      await downloadRuntimeTemplateDocx(normalizedTemplateCode, data);
      setMessage("Đã xuất DOCX từ dữ liệu biểu mẫu hiện tại.");
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Không xuất được DOCX."));
    } finally {
      setIsExporting(false);
    }
  }

  function applySampleData() {
    if (!contract) return;
    const sample = getSampleData(contract.templateCode, contract.source.fields);
    if (Object.keys(sample).length === 0) {
      setError(new Error("Không có dữ liệu mẫu cho biểu mẫu này."));
      return;
    }
    const next = mergeWithSampleData(data, sample);
    setData(next);
    setMessage("Đã điền dữ liệu mẫu vào các trường còn trống.");
    setError(null);
  }

  function resetDraft() {
    setData({});
    setSavedSnapshot(snapshot({}));
    setMessage("");
    setError(null);
  }

  async function openCasePicker() {
    setCasePickerOpen(true);
    setCasePickerError("");
    if (caseOptions.length > 0) return;

    setCasePickerLoading(true);
    try {
      const result = await readApi<{ items: CaseOption[] }>("/cases?pageSize=100", {
        noStore: true,
      });
      setCaseOptions(result.items);
    } catch (err) {
      setCasePickerError(
        err instanceof Error ? err.message : "Không tải được danh sách hồ sơ.",
      );
    } finally {
      setCasePickerLoading(false);
    }
  }

  function applyCaseDetail(detail: CaseDetail) {
    const imported = buildRuntimeTemplateCaseImportData(detail);
    setData((current) => mergeRuntimeTemplateCaseImportData(current, imported));
    setMessage("Đã nhập dữ liệu từ hồ sơ vào các trường còn trống.");
    setError(null);
  }

  async function chooseCase(item: CaseOption) {
    setApplyingCaseId(item.id);
    setCasePickerError("");
    try {
      const detail = await getCaseDetail(item.id);
      applyCaseDetail(detail);
      setSelectedCase(item);
      setCasePickerOpen(false);
      setCaseSearch("");
    } catch (err) {
      setCasePickerError(
        err instanceof Error ? err.message : "Không nhập được dữ liệu từ hồ sơ.",
      );
    } finally {
      setApplyingCaseId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-7 md:px-10">
      <div className="mx-auto w-full max-w-[1500px] space-y-7">
        <header className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                QUANLYVKS / Biểu mẫu
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-slate-950 px-3.5 py-1.5 text-sm font-bold text-white">
                  {normalizedTemplateCode}
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-sm font-semibold text-cyan-700">
                  Hồ sơ là tùy chọn
                </span>
                {selectedCase ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700">
                    {selectedCase.caseCode}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                {isLoading ? "Đang tải biểu mẫu..." : title}
              </h1>
              <p className="mt-4 max-w-5xl text-base leading-7 text-slate-600">
                Bạn có thể nhập dữ liệu, lưu bản nháp và tạo bản xem trước DOCX.
                Chọn hồ sơ để lấy dữ liệu điền nhanh vào các trường còn trống.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
              <Link
                href="/documents"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Quay lại danh mục
              </Link>
              <button
                type="button"
                onClick={() => void openCasePicker()}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Nhập từ hồ sơ
              </button>
              <button
                type="button"
                onClick={() => saveDraft()}
                disabled={!runtime || isSaving}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu bản nháp"}
              </button>
              <button
                type="button"
                onClick={() => void previewDocx()}
                disabled={!runtime || isExporting}
                className="rounded-2xl bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isExporting ? "Đang tạo..." : "Xem trước bản in"}
              </button>
              <button
                type="button"
                disabled
                title="Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới."
                className="cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-400 opacity-60"
              >
                Tạo văn bản từ hồ sơ
              </button>
            </div>
          </div>
        </header>

        {casePickerOpen ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Chọn hồ sơ để nhập dữ liệu
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Dữ liệu từ hồ sơ chỉ điền vào trường còn trống.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCasePickerOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Đóng
              </button>
            </div>
            <input
              value={caseSearch}
              onChange={(event) => setCaseSearch(event.target.value)}
              placeholder="Tìm theo mã hoặc tên hồ sơ"
              className="mt-4 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            {casePickerError ? (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {casePickerError}
              </p>
            ) : null}
            <div className="mt-4 max-h-80 space-y-2 overflow-auto">
              {casePickerLoading ? (
                <p className="text-sm text-slate-500">Đang tải hồ sơ...</p>
              ) : null}
              {!casePickerLoading && filteredCaseOptions.length === 0 ? (
                <p className="text-sm text-slate-500">Không có hồ sơ phù hợp.</p>
              ) : null}
              {filteredCaseOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void chooseCase(item)}
                  disabled={Boolean(applyingCaseId)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="block text-sm font-bold text-slate-950">
                    {item.caseCode}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {item.caseTitle}
                  </span>
                  {applyingCaseId === item.id ? (
                    <span className="mt-1 block text-xs font-semibold text-blue-700">
                      Đang nhập dữ liệu...
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {error ? <ErrorBanner error={error} /> : null}

        {isLoading ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">Đang tải dữ liệu biểu mẫu...</p>
          </section>
        ) : null}

        {!isLoading && contract ? (
          <>
            <ContractV2Renderer
              contract={contract}
              data={data}
              onChange={(next) => {
                setData(next);
                setMessage("");
                setError(null);
              }}
            />

            {message ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
              >
                {message}
              </div>
            ) : null}

            {/* Preview panel — shown only after preview session is created */}
            {previewSession ? (
              previewSession.pdfPreviewUrl ? (
              /* Case 1: real visual preview exists — green success style */
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Đã tạo bản xem trước
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      Bản xem trước PDF này được tạo từ phiên runtime tạm thời.
                      Bạn có thể kiểm tra định dạng trực tiếp và tải DOCX khi cần.
                    </p>
                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <span className="text-emerald-800">
                          <span className="font-semibold">File:</span>{" "}
                          {previewSession.fileName}
                        </span>
                        <span className="text-emerald-800">
                          <span className="font-semibold">Kích thước:</span>{" "}
                          {previewSession.fileSizeBytes > 0
                            ? `${(previewSession.fileSizeBytes / 1024).toFixed(1)} KB`
                            : "—"}
                        </span>
                      </div>

                      {/* Audit status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-emerald-800">Kiểm tra định dạng:</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            previewSession.audit.status === "PASS"
                              ? "bg-emerald-100 text-emerald-700"
                              : previewSession.audit.status === "WARN"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {previewSession.audit.status}
                        </span>
                        {previewSession.audit.summary &&
                        "warning" in previewSession.audit.summary ? (
                          <span className="text-xs text-amber-700">
                            {Number(previewSession.audit.summary["warning"]) > 0
                              ? `${String(previewSession.audit.summary["warning"])} cảnh báo`
                              : null}
                          </span>
                        ) : null}
                      </div>

                      {/* Missing required fields */}
                      {previewSession.missingRequired &&
                      previewSession.missingRequired.length > 0 ? (
                        <div className="mt-1">
                          <span className="text-xs font-semibold text-amber-700">
                            Thiếu {previewSession.missingRequired.length} trường bắt buộc
                          </span>
                        </div>
                      ) : null}

                      {/* Warnings */}
                      {previewSession.warnings.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-xs font-semibold text-amber-700">
                            Lưu ý khi render:
                          </p>
                          <ul className="mt-1 list-inside list-disc text-xs text-amber-700">
                            {previewSession.warnings.slice(0, 3).map((warning, i) => (
                              <li key={i}>{formatRuntimePreviewWarning(warning)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <RuntimePdfPreview
                        pdfUrl={previewSession.pdfPreviewUrl}
                        fileName={previewSession.fileName}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void downloadRuntimePreviewDocxByUrl(
                            previewSession.docxDownloadUrl,
                            previewSession.fileName,
                          )
                        }
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        Tải DOCX
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới."
                        className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400 opacity-60"
                      >
                        Tạo văn bản từ hồ sơ
                      </button>
                      <button
                        type="button"
                        onClick={() => void previewDocx()}
                        disabled={isExporting}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Tạo lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              ) : (
              /* Case 2: no real visual preview — neutral/warning style, honest messaging */
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Đã tạo file DOCX tạm thời
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      File DOCX đã được tạo tạm thời nhưng hiện chưa thể hiển thị trực tiếp
                      trong trình duyệt. Bạn có thể tải DOCX để kiểm tra định dạng.
                    </p>
                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <span className="text-amber-800">
                          <span className="font-semibold">File:</span>{" "}
                          {previewSession.fileName}
                        </span>
                        <span className="text-amber-800">
                          <span className="font-semibold">Kích thước:</span>{" "}
                          {previewSession.fileSizeBytes > 0
                            ? `${(previewSession.fileSizeBytes / 1024).toFixed(1)} KB`
                            : "—"}
                        </span>
                      </div>

                      {/* Audit status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-amber-800">Kiểm tra định dạng:</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            previewSession.audit.status === "PASS"
                              ? "bg-amber-100 text-amber-700"
                              : previewSession.audit.status === "WARN"
                                ? "bg-amber-200 text-amber-800"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {previewSession.audit.status}
                        </span>
                        {previewSession.audit.summary &&
                        "warning" in previewSession.audit.summary ? (
                          <span className="text-xs text-amber-700">
                            {Number(previewSession.audit.summary["warning"]) > 0
                              ? `${String(previewSession.audit.summary["warning"])} cảnh báo`
                              : null}
                          </span>
                        ) : null}
                      </div>

                      {/* Missing required fields */}
                      {previewSession.missingRequired &&
                      previewSession.missingRequired.length > 0 ? (
                        <div className="mt-1">
                          <span className="text-xs font-semibold text-amber-700">
                            Thiếu {previewSession.missingRequired.length} trường bắt buộc
                          </span>
                        </div>
                      ) : null}

                      {/* Warnings */}
                      {previewSession.warnings.length > 0 ? (
                        <div className="mt-1">
                          <p className="text-xs font-semibold text-amber-700">
                            Lưu ý khi render:
                          </p>
                          <ul className="mt-1 list-inside list-disc text-xs text-amber-700">
                            {previewSession.warnings.slice(0, 3).map((warning, i) => (
                              <li key={i}>{formatRuntimePreviewWarning(warning)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {/* PDF note — PDF generation not yet implemented */}
                      <div className="mt-2">
                        <span className="text-xs italic text-slate-500">
                          Tính năng xem trước PDF đang được phát triển.
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void downloadRuntimePreviewDocxByUrl(
                            previewSession.docxDownloadUrl,
                            previewSession.fileName,
                          )
                        }
                        className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
                      >
                        Tải DOCX
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Tính năng tạo văn bản từ hồ sơ sẽ được bổ sung trong phiên bản tới."
                        className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-400 opacity-60"
                      >
                        Tạo văn bản từ hồ sơ
                      </button>
                      <button
                        type="button"
                        onClick={() => void previewDocx()}
                        disabled={isExporting}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Tạo lại
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              )
            ) : null}

            <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p
                role="status"
                aria-live="polite"
                className={`text-sm font-semibold ${
                  isDirty || hasDocxOnlyPreview
                    ? "text-amber-700"
                    : "text-emerald-700"
                }`}
              >
                {statusText}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={applySampleData}
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 sm:min-h-11"
                >
                  Điền dữ liệu mẫu
                </button>
                <button
                  type="button"
                  onClick={() => saveDraft()}
                  disabled={isSaving || !isDirty}
                  className="min-h-10 rounded-xl bg-slate-950 px-5 text-sm font-extrabold text-white disabled:opacity-50 sm:min-h-11"
                >
                  {isSaving ? "Đang lưu..." : "Lưu bản nháp"}
                </button>
                <button
                  type="button"
                  onClick={() => void previewDocx()}
                  disabled={isExporting}
                  className="min-h-10 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white disabled:opacity-50 sm:min-h-11"
                >
                  {isExporting ? "Đang tạo..." : "Xem trước bản in"}
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  disabled={!isDirty}
                  className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50 sm:min-h-11"
                >
                  Xóa bản nháp
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
