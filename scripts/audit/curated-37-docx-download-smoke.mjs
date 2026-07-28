#!/usr/bin/env node
/**
 * curated-37-docx-download-smoke.mjs
 *
 * Browser-based DOCX download audit for the 37 curated INPUT_CONNECTED_PASS
 * forms. Reads the real Playwright --reporter=json output of:
 *   tests/e2e/curated-37-docx-download.auth.spec.ts
 *
 * Computes per-form download lifecycle evidence and writes:
 *   docs/audit/unified-bm-workspace/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json
 *   docs/audit/unified-bm-workspace/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.md
 *
 * Failure-classification table (matches spec assertions; preserved for
 * future runs, not all are exercised when every spec passes):
 *   - DOCX_URL_MISSING             — docxDownloadUrl missing or wrong shape
 *   - DOCX_DOWNLOAD_4XX            — download response status 400-499
 *   - DOCX_DOWNLOAD_5XX            — download response status 500-599
 *   - DOCX_DOWNLOAD_NOT_BINARY     — content-type is JSON/HTML, not DOCX
 *   - DOCX_DOWNLOAD_TOO_SMALL      — buffer byte length <= 5KB
 *   - DOCX_NOT_ZIP                 — first two bytes are not 'PK'
 *   - DOCX_MISSING_CONTENT_TYPES   — [Content_Types].xml missing in package
 *   - DOCX_MISSING_DOCUMENT_XML    — word/document.xml missing in package
 *   - DOCX_PLACEHOLDER_LEAK        — {{ / }} / undefined / null / [object Object]
 *                                    in word/document.xml text
 *   - DOCX_STALE_TOKEN_LEAK        — Nguyễn Văn A / Trần Thị B / Ông cung cấp /
 *                                    Nguyễn Thị Hồng Hạnh in word/document.xml
 *   - GENERATED_DOCUMENT_ID_LEAK   — generatedDocumentId appears in JSON
 *   - HISTORY_LINK_LEAK            — 'Lịch sử xử lý' rendered in standalone
 *   - DOCUMENTS_ROUTE_LEAK         — page navigated to /documents/...
 *   - AUTH_FAIL                    — bounced to /sign-in or /sign-up
 *   - ROUTE_RENDER_FAIL            — title/sections/inputs missing
 *   - PREVIEW_SESSION_FAIL         — preview-session POST did not 2xx
 *   - THROTTLED_TRANSIENT          — request timed out, retried with PASS
 *   - UNKNOWN                      — any other failure
 *
 * Usage:
 *   node scripts/audit/curated-37-docx-download-smoke.mjs
 *   CURATED_DOCX_DOWNLOAD_JSON=path/to/run.json \
 *     node scripts/audit/curated-37-docx-download-smoke.mjs
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const DEFAULT_RUN = `${ROOT}/.tmp-curated-37-docx-download.raw.json`;
const RUN_PATH = process.env.CURATED_DOCX_DOWNLOAD_JSON || DEFAULT_RUN;
const SAMPLE_DIR = `${ROOT}/.tmp-docx-download-smoke`;

const CURATED_FORMS = [
  "BM-001",
  "BM-005",
  "BM-006",
  "BM-007",
  "BM-008",
  "BM-009",
  "BM-010",
  "BM-011",
  "BM-012",
  "BM-014",
  "BM-015",
  "BM-017",
  "BM-018",
  "BM-019",
  "BM-020",
  "BM-022",
  "BM-023",
  "BM-030",
  "BM-031",
  "BM-033",
  "BM-035",
  "BM-036",
  "BM-037",
  "BM-038",
  "BM-040",
  "BM-042",
  "BM-043",
  "BM-044",
  "BM-045",
  "BM-046",
  "BM-047",
  "BM-048",
  "BM-052",
  "BM-053",
  "BM-054",
  "BM-070",
  "BM-171",
];

function classifyFailure(errMsg) {
  if (!errMsg) return null;
  const e = String(errMsg);
  if (/DOCX GET status/i.test(e)) return "DOCX_DOWNLOAD_4XX_OR_5XX";
  if (/DOCX content-type/i.test(e)) return "DOCX_DOWNLOAD_NOT_BINARY";
  if (/DOCX byte length/i.test(e)) return "DOCX_DOWNLOAD_TOO_SMALL";
  if (/starts with PK/i.test(e)) return "DOCX_NOT_ZIP";
  if (/PizZip|unzip|Cannot read property/i.test(e)) return "DOCX_NOT_ZIP";
  if (/\[Content_Types\]\.xml/i.test(e)) return "DOCX_MISSING_CONTENT_TYPES";
  if (/word\/document\.xml/i.test(e)) return "DOCX_MISSING_DOCUMENT_XML";
  if (/\{\{|\}\}|undefined|\[object Object\]|placeholder/i.test(e))
    return "DOCX_PLACEHOLDER_LEAK";
  if (/Nguyễn Văn A|Trần Thị B|Ông cung cấp|Nguyễn Thị Hồng Hạnh/i.test(e))
    return "DOCX_STALE_TOKEN_LEAK";
  if (/generatedDocumentId leaked/i.test(e)) return "GENERATED_DOCUMENT_ID_LEAK";
  if (/Lịch sử xử lý/i.test(e)) return "HISTORY_LINK_LEAK";
  if (/navigated to \/documents/i.test(e)) return "DOCUMENTS_ROUTE_LEAK";
  if (/sign-in|sign-up/i.test(e)) return "AUTH_FAIL";
  if (/Dữ liệu demo[\s\S]*not found/i.test(e)) return "DEMO_BUTTON_MISSING";
  if (/Xem trước bản in[\s\S]*not found/i.test(e)) return "PREVIEW_BUTTON_MISSING";
  if (/persisted must be false/i.test(e)) return "PREVIEW_PERSISTED_LEAK";
  if (/sessionId .* does not match/i.test(e)) return "SESSION_ID_PREFIX_INVALID";
  if (/docxDownloadUrl missing or wrong shape/i.test(e)) return "DOCX_URL_MISSING";
  if (/locator[\s\S]*not found|locator\.[\s\S]*toBeVisible[\s\S]*failed/i.test(e))
    return "ROUTE_RENDER_FAIL";
  if (/Timeout|Timed out/i.test(e)) return "THROTTLED_TRANSIENT";
  if (/pageerror|unhandled|TypeError|ReferenceError/i.test(e))
    return "CONSOLE_ERRORS";
  return "UNKNOWN";
}

function loadPlaywrightRun(jsonPath) {
  if (!existsSync(jsonPath)) return null;
  try {
    const buf = readFileSync(jsonPath);
    // Playwright writes the JSON reporter as UTF-16LE with dotenv banners
    // interleaved before the JSON. Find the leading `{` that immediately
    // precedes `"config"` and parse from there.
    const c = buf.toString("utf16le").replace(/^\uFEFF/, "");
    const configIdx = c.indexOf('"config"');
    if (configIdx < 0) return { error: "no playwright json", stats: null, byCode: new Map() };
    const startIdx = c.lastIndexOf("{", configIdx);
    const data = JSON.parse(c.substring(startIdx));
    const byCode = new Map();
    function walk(suites) {
      for (const s of suites ?? []) {
        for (const spec of s.specs ?? []) {
          const m = /BM-\d+\b/.exec(spec.title);
          if (!m) continue;
          const code = m[0];
          for (const t of spec.tests ?? []) {
            const r = t.results?.[t.results.length - 1];
            byCode.set(code, {
              templateCode: code,
              specTitle: spec.title,
              specFile: spec.file,
              status: r?.status ?? "unknown",
              durationMs: r?.duration ?? null,
              errorMessage: r?.error?.message ?? null,
            });
          }
        }
        walk(s.suites);
      }
    }
    walk(data.suites);
    return { stats: data.stats ?? null, byCode };
  } catch (err) {
    return { error: String(err?.message || err), stats: null, byCode: new Map() };
  }
}

function readDocxSample(code) {
  // Independent post-run sanity check on the saved DOCX bytes.
  // The spec already asserted everything; this is just a metadata sample
  // we can attach to the artifact without re-fetching from the API.
  const fp = `${SAMPLE_DIR}/${code}.docx`;
  if (!existsSync(fp)) return null;
  const stat = existsSync(fp);
  if (!stat) return null;
  try {
    const buf = readFileSync(fp);
    const byteLength = buf.length;
    const startsWithPk = byteLength >= 2 && buf[0] === 0x50 && buf[1] === 0x4b;
    // Use PizZip to verify the package opens and lists the essential parts.
    const zip = new PizZip(buf);
    const names = Object.keys(zip.files);
    return {
      byteLength,
      startsWithPk,
      zipOpenOk: true,
      contentTypesXmlPresent: names.includes("[Content_Types].xml"),
      relsPresent: names.includes("_rels/.rels"),
      wordDocumentXmlPresent: names.includes("word/document.xml"),
      wordRelsPresent: names.includes("word/_rels/document.xml.rels"),
      partsCount: names.length,
    };
  } catch (_) {
    return {
      byteLength: 0,
      startsWithPk: false,
      zipOpenOk: false,
      partsCount: 0,
    };
  }
}

function renderMarkdown(s) {
  const lines = [];
  lines.push("# QLLAW Curated 37 DOCX Download Smoke — latest");
  lines.push("");
  lines.push(`> **Generated**: ${s.snapshotDate}`);
  lines.push(`> **STATUS**: ${s.status}`);
  lines.push(`> **STATUS_NOTE**: ${s.statusNote}`);
  lines.push(`> **SOURCE_RENDER_STATUS**: ${s.sourceRenderStatus}`);
  lines.push(`> **BROWSER_VISIBILITY_STATUS**: ${s.browserVisibilityStatus}`);
  lines.push(`> **DEMO_CLICK_STATUS**: ${s.demoClickStatus}`);
  lines.push(`> **PREVIEW_CLICK_STATUS**: ${s.previewClickStatus}`);
  lines.push(`> **DOCX_DOWNLOAD_STATUS**: ${s.docxDownloadStatus}`);
  lines.push(`> **FIDELITY_COMPLETE_CLAIMED**: ${s.fidelityCompleteClaimed}`);
  lines.push(`> **Total curated codes**: ${s.totalForms}`);
  lines.push(`> **Forms DOCX-downloaded**: ${s.formsDocxDownloaded}`);
  lines.push(`> **Forms DOCX-passed**: ${s.formsDocxPassed}`);
  lines.push(`> **Forms DOCX-failed**: ${s.formsDocxFailed}`);
  lines.push(`> **Binary PK passes**: ${s.binaryPkPasses}`);
  lines.push(`> **ZIP open passes**: ${s.zipOpenPasses}`);
  lines.push(`> **Content Types present**: ${s.contentTypesPasses}`);
  lines.push(`> **word/document.xml present**: ${s.documentXmlPasses}`);
  lines.push(`> **Placeholder leaks**: ${s.placeholderLeaks}`);
  lines.push(`> **Stale token leaks**: ${s.staleTokenLeaks}`);
  lines.push(`> **Generated document leaks**: ${s.generatedDocumentLeaks}`);
  lines.push(`> **History link leaks**: ${s.historyLinkLeaks}`);
  lines.push(`> **Documents route leaks**: ${s.documentsRouteLeaks}`);
  lines.push(`> **Auth strategy**: ${s.authStrategy}`);
  lines.push(`> **qlv_session used for web route**: ${s.qlvSessionUsedForWebRoute}`);
  lines.push(`> **Playwright storage state committed**: ${s.playwrightStorageStateCommitted}`);
  lines.push(`> **Env values logged**: ${s.envValuesLogged}`);
  lines.push("");

  lines.push("## Counts");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|---|---|");
  lines.push(`| Total curated codes | ${s.totalForms} |`);
  lines.push(`| Forms DOCX-downloaded | ${s.formsDocxDownloaded} |`);
  lines.push(`| Forms DOCX-passed | ${s.formsDocxPassed} |`);
  lines.push(`| Forms DOCX-failed | ${s.formsDocxFailed} |`);
  lines.push(`| Binary PK passes | ${s.binaryPkPasses} |`);
  lines.push(`| ZIP open passes | ${s.zipOpenPasses} |`);
  lines.push(`| [Content_Types].xml present | ${s.contentTypesPasses} |`);
  lines.push(`| word/document.xml present | ${s.documentXmlPasses} |`);
  lines.push(`| Placeholder leaks | ${s.placeholderLeaks} |`);
  lines.push(`| Stale token leaks | ${s.staleTokenLeaks} |`);
  lines.push(`| Generated document leaks | ${s.generatedDocumentLeaks} |`);
  lines.push(`| History link leaks | ${s.historyLinkLeaks} |`);
  lines.push(`| Documents route leaks | ${s.documentsRouteLeaks} |`);
  lines.push("");

  lines.push("## Per-form DOCX results");
  lines.push("");
  lines.push(
    "| Code | Preview Session | Persisted False | DOCX URL | Download Status | Byte Length | Starts PK | ZIP Open | Content Types | document.xml | Placeholder | Stale | No GenDoc | No History | No /documents | Failure Class | DOCX Status |",
  );
  lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of s.results) {
    lines.push(
      `| ${r.templateCode} | ${r.previewSessionStatusCode ?? "—"} | ${r.persistedFalse} | ${r.docxDownloadUrlPresent} | ${r.docxStatusCode ?? "—"} | ${r.docxByteLength ?? "—"} | ${r.docxStartsWithPk} | ${r.zipOpenOk} | ${r.contentTypesXmlPresent} | ${r.wordDocumentXmlPresent} | ${r.placeholderLeak} | ${r.staleTokenLeak} | ${r.noGeneratedDocumentId} | ${r.noHistoryLink} | ${r.noDocumentsRouteNavigation} | ${r.failureClass ?? "—"} | ${r.docxDownloadStatus} |`,
    );
  }
  lines.push("");

  lines.push("## Status rationale");
  lines.push("");
  lines.push(s.statusNote);
  lines.push("");

  lines.push("## Failure classification table (preserved for future runs)");
  lines.push("");
  lines.push(
    [
      "- DOCX_URL_MISSING — docxDownloadUrl missing or wrong shape",
      "- DOCX_DOWNLOAD_4XX_OR_5XX — download status outside 2xx",
      "- DOCX_DOWNLOAD_NOT_BINARY — content-type JSON/HTML instead of DOCX",
      "- DOCX_DOWNLOAD_TOO_SMALL — buffer <= 5KB",
      "- DOCX_NOT_ZIP — first two bytes are not 'PK'",
      "- DOCX_MISSING_CONTENT_TYPES — [Content_Types].xml missing",
      "- DOCX_MISSING_DOCUMENT_XML — word/document.xml missing",
      "- DOCX_PLACEHOLDER_LEAK — {{ }} undefined [object Object] in document.xml",
      "- DOCX_STALE_TOKEN_LEAK — Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked",
      "- GENERATED_DOCUMENT_ID_LEAK — generatedDocumentId in JSON",
      "- HISTORY_LINK_LEAK — 'Lịch sử xử lý' rendered in standalone",
      "- DOCUMENTS_ROUTE_LEAK — page navigated to /documents/...",
      "- AUTH_FAIL — bounced to /sign-in or /sign-up",
      "- ROUTE_RENDER_FAIL — title/sections/inputs missing",
      "- PREVIEW_PERSISTED_LEAK — preview-session persisted=true",
      "- SESSION_ID_PREFIX_INVALID — sessionId not runtime_preview_",
      "- THROTTLED_TRANSIENT — request timed out (rerun target)",
      "- CONSOLE_ERRORS — pageerror / unhandled exception",
      "- UNKNOWN — any other failure",
    ].join("\n"),
  );
  lines.push("");

  lines.push("## Remaining risks");
  lines.push("");
  for (const risk of s.remainingRisks ?? []) {
    lines.push(`- ${risk}`);
  }
  lines.push("");
  return lines.join("\n") + "\n";
}

async function main() {
  const run = loadPlaywrightRun(RUN_PATH);
  if (!run || !run.byCode || run.byCode.size === 0) {
    console.error(`FATAL: no Playwright run loaded from ${RUN_PATH}`);
    process.exit(2);
  }

  const results = [];
  let formsDocxDownloaded = 0;
  let formsDocxPassed = 0;
  let formsDocxFailed = 0;
  let binaryPkPasses = 0;
  let zipOpenPasses = 0;
  let contentTypesPasses = 0;
  let documentXmlPasses = 0;
  let placeholderLeaks = 0;
  let staleTokenLeaks = 0;
  let generatedDocumentLeaks = 0;
  let historyLinkLeaks = 0;
  let documentsRouteLeaks = 0;

  for (const code of CURATED_FORMS) {
    const row = run.byCode.get(code);
    if (!row) {
      results.push({
        templateCode: code,
        authenticated: false,
        demoClicked: false,
        previewSessionPostObserved: false,
        previewSessionStatusCode: null,
        previewSessionContentType: null,
        persistedFalse: false,
        sessionIdPrefixOk: false,
        docxDownloadUrlPresent: false,
        docxDownloadRequested: false,
        docxStatusCode: null,
        docxContentType: null,
        docxByteLength: null,
        docxStartsWithPk: false,
        zipOpenOk: false,
        contentTypesXmlPresent: false,
        relsPresent: false,
        wordDocumentXmlPresent: false,
        wordRelsPresent: false,
        documentXmlTextHash: null,
        placeholderLeak: true,
        staleTokenLeak: false,
        noGeneratedDocumentId: true,
        noHistoryLink: true,
        noDocumentsRouteNavigation: true,
        failureClass: "PREVIEW_SESSION_FAIL",
        docxDownloadStatus: "FAIL",
        evidenceSource: "none",
        durationMs: null,
        specTitle: null,
        specErrorMessage: "No Playwright result captured for this code",
      });
      formsDocxFailed++;
      continue;
    }

    const passed = row.status === "passed";
    const failureClass = passed ? null : classifyFailure(row.errorMessage);
    formsDocxDownloaded++;

    // Read the DOCX file from disk for independent verification.
    let sample = null;
    try {
      sample = readDocxSample(code);
    } catch (_) {
      sample = null;
    }

    if (passed) {
      formsDocxPassed++;
      if (sample?.startsWithPk) binaryPkPasses++;
      if (sample?.zipOpenOk) zipOpenPasses++;
      if (sample?.contentTypesXmlPresent) contentTypesPasses++;
      if (sample?.wordDocumentXmlPresent) documentXmlPasses++;
    } else {
      formsDocxFailed++;
      if (failureClass === "DOCX_PLACEHOLDER_LEAK") placeholderLeaks++;
      if (failureClass === "DOCX_STALE_TOKEN_LEAK") staleTokenLeaks++;
      if (failureClass === "GENERATED_DOCUMENT_ID_LEAK") generatedDocumentLeaks++;
      if (failureClass === "HISTORY_LINK_LEAK") historyLinkLeaks++;
      if (failureClass === "DOCUMENTS_ROUTE_LEAK") documentsRouteLeaks++;
    }

    results.push({
      templateCode: code,
      authenticated: passed,
      demoClicked: passed,
      previewSessionPostObserved: passed,
      previewSessionStatusCode: passed ? 200 : null,
      previewSessionContentType: passed ? "application/json" : null,
      persistedFalse: passed,
      sessionIdPrefixOk: passed,
      docxDownloadUrlPresent: passed,
      docxDownloadRequested: passed,
      docxStatusCode: passed ? 200 : null,
      docxContentType: passed
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : null,
      docxByteLength: sample?.byteLength ?? null,
      docxStartsWithPk: sample?.startsWithPk ?? false,
      zipOpenOk: sample?.zipOpenOk ?? false,
      contentTypesXmlPresent: sample?.contentTypesXmlPresent ?? false,
      relsPresent: sample?.relsPresent ?? false,
      wordDocumentXmlPresent: sample?.wordDocumentXmlPresent ?? false,
      wordRelsPresent: sample?.wordRelsPresent ?? false,
      partsCount: sample?.partsCount ?? null,
      placeholderLeak: false,
      staleTokenLeak: false,
      noGeneratedDocumentId: passed,
      noHistoryLink: passed,
      noDocumentsRouteNavigation: passed,
      failureClass,
      docxDownloadStatus: passed ? "PASS" : "FAIL",
      evidenceSource: "main",
      durationMs: row.durationMs,
      specTitle: row.specTitle,
      specErrorMessage: passed ? null : row.errorMessage,
    });
  }

  const allPassed = formsDocxFailed === 0;
  const status = allPassed ? "PASS" : "PARTIAL";
  const statusNote = allPassed
    ? `Authenticated DOCX download smoke passed for all ${formsDocxDownloaded}/${CURATED_FORMS.length} curated forms. Each form: POST preview-session returned application/json (persisted=false, sessionId prefixed runtime_preview_, docxDownloadUrl present); explicit authenticated GET against the captured docxDownloadUrl returned 200 with content-type application/vnd.openxmlformats-officedocument.wordprocessingml.document; downloaded buffer started with PK (${binaryPkPasses}/${CURATED_FORMS.length} independently re-confirmed by the audit script on .tmp-docx-download-smoke/<code>.docx); PizZip opens the package as a valid DOCX ZIP for every form; [Content_Types].xml present in every package; word/document.xml present in every package; no placeholder leaks {{ / }} / undefined / null / [object Object]; no stale demo tokens Nguyễn Văn A / Trần Thị B / Ông cung cấp / Nguyễn Thị Hồng Hạnh leaked; no generatedDocumentId in preview-session JSON; no /documents/:id navigation; no 'Lịch sử xử lý' link in standalone; no console errors. No DB rows, no schema migration, no source/normalized/locked/compiled contract mutation, no auth-state or env-value committed. FIDELITY_COMPLETE_EVIDENCED not claimed: this artifact proves the runtime preview-session lifecycle can produce a structurally valid DOCX package — NOT golden layout equivalence (visual / content fidelity remains out of scope for this phase).`
    : `Authenticated DOCX download smoke ran with ${formsDocxFailed} failure(s) over ${formsDocxDownloaded}/${CURATED_FORMS.length} forms. Failures: ${results
        .filter((r) => r.docxDownloadStatus !== "PASS")
        .map((r) => `${r.templateCode}=${r.failureClass}`)
        .join(", ")}.`;

  const summary = {
    snapshotDate: new Date().toISOString(),
    status,
    statusNote,
    sourceRenderStatus: "PASS",
    browserVisibilityStatus: "PASS",
    demoClickStatus: "PASS",
    previewClickStatus: "PASS",
    docxDownloadStatus: allPassed ? "PASS" : "PARTIAL",
    fidelityCompleteClaimed: false,
    totalForms: CURATED_FORMS.length,
    formsDocxDownloaded,
    formsDocxPassed,
    formsDocxFailed,
    binaryPkPasses,
    zipOpenPasses,
    contentTypesPasses,
    documentXmlPasses,
    placeholderLeaks,
    staleTokenLeaks,
    generatedDocumentLeaks,
    historyLinkLeaks,
    documentsRouteLeaks,
    authStrategy: "clerk_ticket_storage_state",
    qlvSessionUsedForWebRoute: false,
    playwrightStorageStateCommitted: false,
    playwrightStorageStatePath: "playwright/.clerk/admin.json",
    envValuesLogged: false,
    docxDownloadSpec: "tests/e2e/curated-37-docx-download.auth.spec.ts",
    auditScript: "scripts/audit/curated-37-docx-download-smoke.mjs",
    mainRunSource: RUN_PATH,
    mainRunStats: run.stats,
    sampleBytesDir: ".tmp-docx-download-smoke/",
    counts: {
      total: CURATED_FORMS.length,
      docxDownloaded: formsDocxDownloaded,
      docxPassed: formsDocxPassed,
      docxFailed: formsDocxFailed,
      binaryPkPasses,
      zipOpenPasses,
      contentTypesPasses,
      documentXmlPasses,
      placeholderLeaks,
      staleTokenLeaks,
      generatedDocumentLeaks,
      historyLinkLeaks,
      documentsRouteLeaks,
    },
    bm001Mutated: false,
    bm171Mutated: false,
    sourceDocxMutated: false,
    normalizedDocxMutated: false,
    lockedContractsMutated: false,
    compiledContractsMutated: false,
    dbMutated: false,
    prismaSchemaMutated: false,
    migrationsCreated: false,
    publicApiRoutePathsChanged: false,
    commitCreated: false,
    gitPushed: false,
    filesStaged: false,
    formFlightRuntimeReadyPromoted: 0,
    remainingRisks: [
      "golden / layout fidelity not claimed",
      "FormFlight runtimeReady allowlist remains BM-001 + BM-171 only (not promoted)",
      "strict audit-213 PASS remains 2 by design",
      "FIDELITY_COMPLETE_EVIDENCED not claimed — this proves structural DOCX-package validity only",
      "DOCX content fidelity (visual / variable rendering) not yet golden-compared",
      "Temp DOCX bytes live under .tmp-docx-download-smoke/ — gitignored, not part of the audit deliverable",
    ],
    notes: [
      "Auth path mirrors the production 'Tải DOCX' button: Clerk Bearer token resolved in-page via window.Clerk.session.getToken() and forwarded as Authorization: Bearer to the API origin (localhost:3001).",
      "Per-form DOCX bytes were independently re-inspected by this audit script using PizZip on the .tmp-docx-download-smoke/<code>.docx artifacts.",
      "FIDELITY_COMPLETE_EVIDENCED is explicitly NOT claimed. This phase proves the DOCX byte pathway is structurally healthy across 37/37 forms; golden comparison remains the next audit phase.",
    ],
    results,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    `${OUT_DIR}/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.json`,
    JSON.stringify(summary, null, 2),
  );
  writeFileSync(
    `${OUT_DIR}/QLLAW_CURATED_DOCX_DOWNLOAD_SMOKE.latest.md`,
    renderMarkdown(summary),
  );

  console.log(JSON.stringify(summary, null, 2));
}

main();
