"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getGeneratedDocumentPreviewAudit,
  type DocxPreviewAuditFinding,
  type DocxPreviewAuditStatus,
  type DocxPreviewResult,
} from "@/lib/generated-documents-api";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

function AuditStatusBadge({ status }: { status: DocxPreviewAuditStatus }) {
  const variant =
    status === "PASS" ? "success" : status === "WARN" ? "warning" : "destructive";

  return (
    <Badge variant={variant}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

// ─── Severity Badge ───────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<string, string> = {
  INFO: "Thông tin",
  WARN: "Cảnh báo",
  FAIL: "Lỗi",
};

function SeverityBadge({ severity }: { severity: string }) {
  const label = SEVERITY_LABELS[severity] ?? severity;
  const variant =
    severity === "INFO"
      ? "blue"
      : severity === "WARN"
        ? "warning"
        : severity === "FAIL"
          ? "destructive"
          : "muted";

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
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
    <Badge variant="outline">
      {label}
    </Badge>
  );
}

// ─── Finding Row ───────────────────────────────────────────────────────────────

function FindingRow({ finding }: { finding: DocxPreviewAuditFinding }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={finding.severity} />
        <LocationBadge location={finding.location} />
        <Badge variant="muted" className="font-mono">
          {finding.code}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{finding.message}</p>
      {finding.recommendation && (
        <div className="mt-1 rounded border border-slate-200 bg-slate-50 p-2">
          <p className="text-xs font-medium text-slate-700">
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

      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <Badge variant="success">{summary.pass} đạt</Badge>
        <Badge variant="warning">{summary.warning} cảnh báo</Badge>
        <Badge variant="destructive">{summary.fail} lỗi</Badge>
        {result.sample && (
          <Badge variant="violet">
            Dữ liệu mẫu
          </Badge>
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
      <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Kiểm tra định dạng</h2>
          <Button
            type="button"
            onClick={() => void load()}
            variant="outline"
            size="sm"
          >
            Thử lại
          </Button>
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
          <Badge variant="muted">
            {audit.profileName}
          </Badge>
        </div>

        <Button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          variant="outline"
          size="sm"
        >
          <RefreshCw data-icon="inline-start" aria-hidden="true" />
          Tải lại
        </Button>
      </div>

      <SummaryBar result={result} />

      {failFindings.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Badge variant="destructive">{failFindings.length}</Badge>
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
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Badge variant="warning">{warnFindings.length}</Badge>
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
            <Badge variant="blue">{infoFindings.length}</Badge>
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
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium text-slate-700">
            Đây là bản xem trước với dữ liệu mẫu. Không lưu dữ liệu mẫu vào hồ sơ.
          </p>
        </div>
      )}
    </section>
  );
}
