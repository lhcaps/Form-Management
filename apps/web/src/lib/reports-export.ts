export type ReportPeriodForExport = "WEEK" | "MONTH";

export type ReportRowForExport = {
  time: string;
  wardName: string;
  offenseName: string;
  caseCount: number;
};

export type ReportSummaryForExport = {
  period: ReportPeriodForExport;
  range: {
    from: string;
    to: string;
  };
  totalCases: number;
  byWard: Array<{ wardName: string; caseCount: number }>;
  byOffense: Array<{ offenseName: string; caseCount: number }>;
  rows: ReportRowForExport[];
};

function formatDateForExport(value?: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizeExportText(value: unknown) {
  return String(value ?? "").replace(/\r\n|\r|\n/g, " ");
}

function neutralizeSpreadsheetFormula(value: string) {
  return /^[\s]*[=+\-@\t]/u.test(value) ? `'${value}` : value;
}

function normalizeCsvText(value: unknown) {
  return String(value ?? "")
    .split(/\r\n|\r|\n/g)
    .map(neutralizeSpreadsheetFormula)
    .join(" ");
}

function csvCell(value: unknown) {
  const safeValue = normalizeCsvText(value);
  return `"${safeValue.replace(/"/g, '""')}"`;
}

function csvRow(values: unknown[]) {
  return values.map(csvCell).join(",");
}

function escapeHtml(value: unknown) {
  return normalizeExportText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReportCsv(summary: ReportSummaryForExport) {
  const rows: string[] = [];

  rows.push(csvRow(["Báo cáo thống kê - Viện Kiểm sát nhân dân khu vực 7"]));
  rows.push(csvRow(["Kỳ báo cáo", summary.period === "WEEK" ? "Tuần" : "Tháng"]));
  rows.push(csvRow(["Từ ngày", formatDateForExport(summary.range.from)]));
  rows.push(csvRow(["Đến ngày", formatDateForExport(summary.range.to)]));
  rows.push(csvRow(["Tổng số hồ sơ", summary.totalCases]));
  rows.push("");

  rows.push("Chi tiết theo thời gian, phường và tội danh");
  rows.push(csvRow(["Thời gian", "Phường", "Tội danh", "Số hồ sơ"]));
  for (const row of summary.rows) {
    rows.push(
      csvRow([
        formatDateForExport(row.time),
        row.wardName,
        row.offenseName,
        row.caseCount,
      ]),
    );
  }
  rows.push("");

  rows.push("Thống kê theo phường");
  rows.push(csvRow(["Phường", "Số hồ sơ"]));
  for (const ward of summary.byWard) {
    rows.push(csvRow([ward.wardName, ward.caseCount]));
  }
  rows.push("");

  rows.push("Thống kê theo tội danh");
  rows.push(csvRow(["Tội danh", "Số hồ sơ"]));
  for (const offense of summary.byOffense) {
    rows.push(csvRow([offense.offenseName, offense.caseCount]));
  }

  return `\uFEFF${rows.join("\n")}`;
}

export function buildReportPrintHtml(
  summary: ReportSummaryForExport,
  generatedAt = new Date(),
) {
  const cellStyle = "padding:8px;border:1px solid #ccc";
  const rightCellStyle = `${cellStyle};text-align:right`;

  const wardRows = summary.byWard
    .map(
      (ward) =>
        `<tr><td style="${cellStyle}">${escapeHtml(ward.wardName)}</td><td style="${rightCellStyle}">${escapeHtml(ward.caseCount)}</td></tr>`,
    )
    .join("");

  const offenseRows = summary.byOffense
    .map(
      (offense) =>
        `<tr><td style="${cellStyle}">${escapeHtml(offense.offenseName)}</td><td style="${rightCellStyle}">${escapeHtml(offense.caseCount)}</td></tr>`,
    )
    .join("");

  const detailRows = summary.rows
    .map(
      (row) =>
        `<tr><td style="${cellStyle}">${escapeHtml(formatDateForExport(row.time))}</td><td style="${cellStyle}">${escapeHtml(row.wardName)}</td><td style="${cellStyle}">${escapeHtml(row.offenseName)}</td><td style="${rightCellStyle}">${escapeHtml(row.caseCount)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Báo cáo thống kê</title>
<style>
  body { font-family: Times New Roman, serif; font-size: 13pt; padding: 20px; }
  h1 { text-align: center; font-size: 16pt; }
  h2 { font-size: 14pt; border-bottom: 1px solid #000; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
  th { background: #f0f0f0; font-weight: bold; }
  .summary-box { background: #f9f9f9; padding: 12px; margin-bottom: 16px; }
  .meta { margin-bottom: 8px; }
</style>
</head>
<body>
<h1>VIỆN KIỂM SÁT NHÂN DÂN KHU VỰC 7</h1>
<h1>BÁO CÁO THỐNG KÊ HỒ SƠ VỤ ÁN</h1>
<div class="summary-box">
  <div class="meta"><strong>Kỳ báo cáo:</strong> ${summary.period === "WEEK" ? "Tuần" : "Tháng"}</div>
  <div class="meta"><strong>Từ ngày:</strong> ${escapeHtml(formatDateForExport(summary.range.from))} <strong>Đến ngày:</strong> ${escapeHtml(formatDateForExport(summary.range.to))}</div>
  <div class="meta"><strong>Tổng số hồ sơ:</strong> ${escapeHtml(summary.totalCases)}</div>
  <div class="meta"><strong>Ngày lập:</strong> ${escapeHtml(generatedAt.toLocaleDateString("vi-VN"))}</div>
</div>

<h2>Chi tiết theo thời gian, phường và tội danh</h2>
<table>
  <thead><tr><th style="${cellStyle}">Thời gian</th><th style="${cellStyle}">Phường</th><th style="${cellStyle}">Tội danh</th><th style="${rightCellStyle}">Số hồ sơ</th></tr></thead>
  <tbody>${detailRows}</tbody>
</table>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
  <div>
    <h2>Thống kê theo phường</h2>
    <table>
      <thead><tr><th style="${cellStyle}">Phường</th><th style="${rightCellStyle}">Số hồ sơ</th></tr></thead>
      <tbody>${wardRows}</tbody>
    </table>
  </div>
  <div>
    <h2>Thống kê theo tội danh</h2>
    <table>
      <thead><tr><th style="${cellStyle}">Tội danh</th><th style="${rightCellStyle}">Số hồ sơ</th></tr></thead>
      <tbody>${offenseRows}</tbody>
    </table>
  </div>
</div>

<script>window.onload=function(){window.print();}</script>
</body>
</html>`;
}
