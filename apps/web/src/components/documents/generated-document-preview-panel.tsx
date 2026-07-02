"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGeneratedDocumentPreviewAudit,
  type DocxPreviewAuditFinding,
  type DocxPreviewAuditStatus,
  type DocxPreviewResult,
} from "@/lib/generated-documents-api";

type Props = {
  documentId: string;
  className?: string;
};

// ─── Audit Status Badge ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<DocxPreviewAuditStatus, string> = {
  PASS: "Đạt",
  WARN: "Cảnh báo",
  FAIL: "Lỗi",
};

const STATUS_COLORS: Record<
  DocxPreviewAuditStatus,
  { bg: string; text: string; border: string }
> = {
  PASS: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  WARN: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  FAIL: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function AuditStatusBadge({ status }: { status: DocxPreviewAuditStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<string, string> = {
  INFO: "Thông tin",
  WARN: "Cảnh báo",
  FAIL: "Lỗi",
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  INFO: { bg: "bg-blue-100", text: "text-blue-700" },
  WARN: { bg: "bg-amber-100", text: "text-amber-700" },
  FAIL: { bg: "bg-red-100", text: "text-red-700" },
};

function SeverityBadge({ severity }: { severity: string }) {
  const colors = SEVERITY_COLORS[severity] ?? { bg: "bg-slate-100", text: "text-slate-600" };
  const label = SEVERITY_LABELS[severity] ?? severity;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text}`}
    >
      {label}
    </span>
  );
}

// ─── Location Badge ────────────────────────────────────────────────────────────

const LOCATION_LABELS: Record<string, string> = {
  header: "Đầu trang",
  footer: "Chân trang",
  body: "Nội dung",
  settings: "Cài đặt",
  styles: "Kiểu chữ",
  document: "Tài liệu",
};

function LocationBadge({ location }: { location: string }) {
  const label = LOCATION_LABELS[location] ?? location;
  return (
    <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
      {label}
    </span>
  );
}

// ─── Finding Row ───────────────────────────────────────────────────────────────

function FindingRow({ finding }: { finding: DocxPreviewAuditFinding }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={finding.severity} />
        <LocationBadge location={finding.location} />
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
          {finding.code}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{finding.message}</p>
      {finding.recommendation && (
        <div className="mt-1 rounded bg-blue-50 p-2">
          <p className="text-xs font-medium text-blue-700">
            Đề xuất: {finding.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Summary Bar ───────────────────────────────────────────────────────────────

function SummaryBar({
  result,
}: {
  result: DocxPreviewResult;
}) {
  const { audit } = result;
  const summary = audit.summary;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      <AuditStatusBadge status={audit.status} />

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            {summary.pass}
          </span>
          <span>đạt</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            {summary.warning}
          </span>
          <span>cảnh báo</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700">
            {summary.fail}
          </span>
          <span>lỗi</span>
        </span>
        {result.sample && (
          <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-700">
            Dữ liệu mẫu
          </span>
        )}
      </div>

      {result.auditNote && (
        <p className="w-full text-xs text-slate-500">{result.auditNote}</p>
      )}
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export function GeneratedDocumentPreviewPanel({ documentId, className = "" }: Props) {
  const [result, setResult] = useState<DocxPreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGeneratedDocumentPreviewAudit(documentId);
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không tải được kết quả kiểm tra.",
      );
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  if (loading) {
    return (
      <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Kiểm tra định dạng</h2>
        </div>
        <p className="text-sm text-slate-500">Đang kiểm tra định dạng DOCX...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`rounded-2xl border border-red-200 bg-white p-6 shadow-sm ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Kiểm tra định dạng</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Thử lại
          </button>
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </section>
    );
  }

  if (!result) return null;

  const { audit } = result;

  const failFindings = audit.findings.filter((f) => f.severity === "FAIL");
  const warnFindings = audit.findings.filter((f) => f.severity === "WARN");
  const infoFindings = audit.findings.filter((f) => f.severity === "INFO");

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-950">Kiểm tra định dạng</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            {audit.profileName}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Tải lại
        </button>
      </div>

      <SummaryBar result={result} />

      {failFindings.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs">
              {failFindings.length}
            </span>
            Lỗi định dạng
          </h3>
          <div className="space-y-2">
            {failFindings.map((f, i) => (
              <FindingRow key={`fail-${f.code}-${i}`} finding={f} />
            ))}
          </div>
        </div>
      )}

      {warnFindings.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs">
              {warnFindings.length}
            </span>
            Cảnh báo định dạng
          </h3>
          <div className="space-y-2">
            {warnFindings.map((f, i) => (
              <FindingRow key={`warn-${f.code}-${i}`} finding={f} />
            ))}
          </div>
        </div>
      )}

      {infoFindings.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-600">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs">
              {infoFindings.length}
            </span>
            Kiểm tra đạt
          </h3>
          <div className="space-y-2">
            {infoFindings.map((f, i) => (
              <FindingRow key={`info-${f.code}-${i}`} finding={f} />
            ))}
          </div>
        </div>
      )}

      {result.sample && (
        <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
          <p className="text-xs font-medium text-purple-700">
            Đây là bản xem trước với dữ liệu mẫu. Không lưu dữ liệu mẫu vào hồ sơ.
          </p>
        </div>
      )}
    </section>
  );
}
