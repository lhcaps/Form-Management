"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readApi } from "@/lib/api-client";
import {
  buildReportCsv,
  buildReportPrintHtml,
  type ReportSummaryForExport,
} from "@/lib/reports-export";
import { PageShell, PageHeader, PageSection } from "@/components/common/page-shell";
import { KpiCard } from "@/components/common/kpi-card";
import { ErrorBanner } from "@/components/common/error-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReportPeriod = ReportSummaryForExport["period"];

type ReportSummary = ReportSummaryForExport;

type ReviewQueueResponse = {
  summary: Record<string, number>;
};

function todayForInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDate(value?: string) {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatRange(summary: ReportSummary | null) {
  if (!summary) return "--";
  return `${formatDate(summary.range.from)} - ${formatDate(summary.range.to)}`;
}

function buildReportPath(period: ReportPeriod, anchorDate: string) {
  const params = new URLSearchParams({
    period,
    anchorDate,
  });
  return `/cases/reports/summary?${params.toString()}`;
}

// ─── CSV Export ─────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCsv(summary: ReportSummary) {
  const content = buildReportCsv(summary);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const filename = `bao-cao-${summary.period.toLowerCase()}-${summary.range.from}.csv`;
  downloadBlob(blob, filename);
}

function printReport(summary: ReportSummary) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(buildReportPrintHtml(summary));
  printWindow.document.close();
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("MONTH");
  const [anchorDate, setAnchorDate] = useState(todayForInput);
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [reviewData, setReviewData] = useState<ReviewQueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reportResponse, reviewResponse] = await Promise.all([
        readApi<ReportSummary>(buildReportPath(period, anchorDate), {
          noStore: true,
        }),
        readApi<ReviewQueueResponse>("/document-review-queue", {
          noStore: true,
        }),
      ]);
      setReportData(reportResponse);
      setReviewData(reviewResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [anchorDate, period]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const approvedDocuments = reviewData?.summary.APPROVED ?? 0;
  const waitingDocuments = reviewData?.summary.WAITING_REVIEW ?? 0;

  const totalGroupedRows = useMemo(
    () =>
      reportData?.rows.reduce((total, item) => total + item.caseCount, 0) ?? 0,
    [reportData],
  );

  return (
    <PageShell maxWidth="default" className="bg-slate-50">
      <PageHeader className="border-b border-slate-200 pb-5">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-black text-slate-950">
            Báo cáo - Thống kê
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Dữ liệu được tổng hợp trực tiếp từ hồ sơ, phường và tội danh đã lưu.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div>
            <label className="text-xs font-black uppercase text-zinc-500">
              Kỳ báo cáo
            </label>
            <div
              className="mt-2 inline-flex h-10 overflow-hidden rounded-md border border-zinc-200 bg-white p-0.5"
              role="group"
              aria-label="Kỳ báo cáo"
            >
              {(["WEEK", "MONTH"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={period === value ? "default" : "ghost"}
                  onClick={() => setPeriod(value)}
                  className="h-9 rounded-sm px-4"
                >
                  {value === "WEEK" ? "Tuần" : "Tháng"}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="report-anchor-date"
              className="text-xs font-black uppercase text-zinc-500"
            >
              Ngày neo
            </label>
            <Input
              id="report-anchor-date"
              type="date"
              value={anchorDate}
              onChange={(event) => setAnchorDate(event.target.value)}
              className="mt-2 h-10"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void loadReports()}
          >
            {loading ? "Đang tải..." : "Tải lại"}
          </Button>

          {reportData ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="success"
                onClick={() => exportCsv(reportData)}
              >
                Xuất CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => printReport(reportData)}
              >
                In / PDF
              </Button>
            </div>
          ) : null}
        </div>
      </PageHeader>

      {error ? <ErrorBanner error={error} /> : null}

      <section className="grid gap-3 md:grid-cols-4">
        <KpiCard
          label="Hồ sơ trong kỳ"
          value={reportData?.totalCases ?? 0}
          tone="info"
          description={formatRange(reportData)}
        />
        <KpiCard
          label="Dòng thống kê"
          value={totalGroupedRows}
          tone="process"
          description="Theo ngày, phường, tội danh"
        />
        <KpiCard
          label="Chờ duyệt biểu mẫu"
          value={waitingDocuments}
          tone="warning"
          description="Từ hàng đợi duyệt"
        />
        <KpiCard
          label="Đã duyệt biểu mẫu"
          value={approvedDocuments}
          tone="success"
          description="Từ hàng đợi duyệt"
        />
      </section>

      <PageSection card className="overflow-hidden p-0">
        <div className="flex flex-col gap-2 border-b border-zinc-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-base font-black text-zinc-950">
            Chi tiết theo thời gian, phường và tội danh
          </h2>
          <div className="text-sm font-bold text-zinc-500">
            {formatRange(reportData)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Phường</TableHead>
                <TableHead>Tội danh</TableHead>
                <TableHead className="text-right">Số hồ sơ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && reportData?.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-zinc-500">
                    Chưa có hồ sơ trong kỳ này.
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading && reportData
                ? reportData.rows.map((item) => (
                    <TableRow key={`${item.time}-${item.wardName}-${item.offenseName}`}>
                      <TableCell className="whitespace-nowrap font-semibold text-zinc-800">
                        {formatDate(item.time)}
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-700">
                        {item.wardName}
                      </TableCell>
                      <TableCell className="text-zinc-700">
                        {item.offenseName}
                      </TableCell>
                      <TableCell className="text-right font-black text-zinc-950 tabular-nums">
                        {item.caseCount}
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>
      </PageSection>

      <section className="grid gap-4 lg:grid-cols-2">
        <RankList
          title="Theo phường"
          emptyLabel="Chưa có dữ liệu phường."
          items={(reportData?.byWard ?? []).map((item) => ({
            label: item.wardName,
            count: item.caseCount,
          }))}
        />

        <RankList
          title="Theo tội danh"
          emptyLabel="Chưa có dữ liệu tội danh."
          items={(reportData?.byOffense ?? []).map((item) => ({
            label: item.offenseName,
            count: item.caseCount,
          }))}
        />
      </section>
    </PageShell>
  );
}

function RankList({
  title,
  emptyLabel,
  items,
}: {
  title: string;
  emptyLabel: string;
  items: Array<{ label: string; count: number }>;
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <h2 className="text-base font-black text-zinc-950">{title}</h2>
      <div className="mt-3 divide-y divide-zinc-100">
        {items.length === 0 ? (
          <div className="py-6 text-sm text-zinc-500">{emptyLabel}</div>
        ) : null}

        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 py-3 text-sm"
          >
            <span className="min-w-0 font-semibold text-zinc-700">
              {item.label}
            </span>
            <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 tabular-nums">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}