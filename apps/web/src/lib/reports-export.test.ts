import assert from "node:assert/strict";
import test from "node:test";

import {
  buildReportCsv,
  buildReportPrintHtml,
  type ReportSummaryForExport,
} from "./reports-export";

function makeSummary(): ReportSummaryForExport {
  return {
    period: "MONTH",
    range: { from: "2026-06-01", to: "2026-06-30" },
    totalCases: 1,
    rows: [
      {
        time: "2026-06-12",
        wardName: 'Phường "A"\n=SUM(1,1)',
        offenseName: '<img src=x onerror="alert(1)">',
        caseCount: 1,
      },
    ],
    byWard: [{ wardName: 'Phường "A"\n=SUM(1,1)', caseCount: 1 }],
    byOffense: [{ offenseName: '<img src=x onerror="alert(1)">', caseCount: 1 }],
  };
}

test("buildReportCsv escapes quotes, line breaks, and spreadsheet formulas", () => {
  const csv = buildReportCsv(makeSummary());

  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /"Phường ""A"" '=SUM\(1,1\)"/);
  assert.match(csv, /"<img src=x onerror=""alert\(1\)"">"/);
  assert.doesNotMatch(csv, /"Phường "A"\n=SUM/);
});

test("buildReportPrintHtml escapes report data before writing a print document", () => {
  const html = buildReportPrintHtml(makeSummary(), new Date("2026-06-29T00:00:00.000Z"));

  assert.match(html, /Phường &quot;A&quot;/);
  assert.match(html, /=SUM\(1,1\)/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(html, /<img src=x/);
  assert.doesNotMatch(html, /onerror="alert/);
});
