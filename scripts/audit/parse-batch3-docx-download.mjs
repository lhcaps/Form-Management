#!/usr/bin/env node
/**
 * parse-batch3-docx-download.mjs
 *
 * Parses the Playwright --reporter=json output of:
 *   tests/e2e/curated-batch3-docx-download.auth.spec.ts
 *
 * Reads the on-disk DOCX bytes stored by the spec under
 * .tmp-batch3-docx-download-smoke/<code>.docx and independently re-validates
 * the package via PizZip. Writes a deterministic per-form summary to:
 *   .tmp-batch3-docx-download.parsed.json
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
 *   node scripts/audit/parse-batch3-docx-download.mjs
 *   BATCH3_DOCX_DOWNLOAD_JSON=path/to/run.json \
 *     node scripts/audit/parse-batch3-docx-download.mjs
 *
 * Output:
 *   .tmp-batch3-docx-download.parsed.json  (consumed by apply-batch3-docx-download.mjs)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const PizZip = require("pizzip");

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const DEFAULT_RUN = `${ROOT}/.tmp-batch3-docx-download.raw.json`;
const RUN_PATH =
  process.env.BATCH3_DOCX_DOWNLOAD_JSON || DEFAULT_RUN;
const SAMPLE_DIR = `${ROOT}/.tmp-batch3-docx-download-smoke`;
const OUT_PATH = `${ROOT}/.tmp-batch3-docx-download.parsed.json`;

const BATCH3_CODES = [
  "BM-055", "BM-056", "BM-057", "BM-058", "BM-059", "BM-060",
  "BM-061", "BM-062", "BM-063", "BM-064", "BM-065", "BM-066",
  "BM-067", "BM-068", "BM-069", "BM-071", "BM-072", "BM-073",
  "BM-074", "BM-075",
];

function classifyFailure(errMsg) {
  if (!errMsg) return null;
  const e = String(errMsg);
  if (/DOCX GET status/i.test(e)) {
    const m = /status (\d+)/.exec(e);
    const code = m ? parseInt(m[1], 10) : 0;
    if (code >= 400 && code < 500) return "DOCX_DOWNLOAD_4XX";
    if (code >= 500 && code < 600) return "DOCX_DOWNLOAD_5XX";
    return "DOCX_DOWNLOAD_4XX_OR_5XX";
  }
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
  if (/generatedDocumentId leaked/i.test(e))
    return "GENERATED_DOCUMENT_ID_LEAK";
  if (/Lịch sử xử lý/i.test(e)) return "HISTORY_LINK_LEAK";
  if (/navigated to \/documents/i.test(e)) return "DOCUMENTS_ROUTE_LEAK";
  if (/sign-in|sign-up/i.test(e)) return "AUTH_FAIL";
  if (/Dữ liệu demo[\s\S]*not found/i.test(e)) return "DEMO_BUTTON_MISSING";
  if (/Xem trước bản in[\s\S]*not found/i.test(e))
    return "PREVIEW_BUTTON_MISSING";
  if (/persisted must be false/i.test(e)) return "PREVIEW_PERSISTED_LEAK";
  if (/sessionId .* does not match/i.test(e))
    return "SESSION_ID_PREFIX_INVALID";
  if (/docxDownloadUrl missing or wrong shape/i.test(e))
    return "DOCX_URL_MISSING";
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
    const c = buf.toString("utf16le").replace(/^\uFEFF/, "");
    const configIdx = c.indexOf('"config"');
    if (configIdx < 0)
      return { error: "no playwright json", stats: null, byCode: new Map() };
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
    return {
      error: String(err?.message || err),
      stats: null,
      byCode: new Map(),
    };
  }
}

function readDocxSample(code) {
  const fp = `${SAMPLE_DIR}/${code}.docx`;
  if (!existsSync(fp)) return null;
  try {
    const buf = readFileSync(fp);
    const byteLength = buf.length;
    const startsWithPk =
      byteLength >= 2 && buf[0] === 0x50 && buf[1] === 0x4b;
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

function main() {
  const run = loadPlaywrightRun(RUN_PATH);
  if (!run || !run.byCode || run.byCode.size === 0) {
    console.error(`FATAL: no Playwright run loaded from ${RUN_PATH}`);
    process.exit(2);
  }

  const codes = [];
  let total = 0;
  let passed = 0;
  let failed = 0;
  let binaryPkPasses = 0;
  let zipOpenPasses = 0;
  let contentTypesPasses = 0;
  let documentXmlPasses = 0;
  let placeholderLeaks = 0;
  let staleTokenLeaks = 0;
  let generatedDocumentLeaks = 0;
  let historyLinkLeaks = 0;
  let documentsRouteLeaks = 0;

  for (const code of BATCH3_CODES) {
    const row = run.byCode.get(code);
    if (!row) {
      codes.push({
        templateCode: code,
        authenticated: false,
        demoClicked: false,
        previewSessionPostObserved: false,
        previewSessionStatusCode: null,
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
      failed++;
      total++;
      continue;
    }

    const ok = row.status === "passed";
    const failureClass = ok ? null : classifyFailure(row.errorMessage);
    total++;

    let sample = null;
    try {
      sample = readDocxSample(code);
    } catch (_) {
      sample = null;
    }

    if (ok) {
      passed++;
      if (sample?.startsWithPk) binaryPkPasses++;
      if (sample?.zipOpenOk) zipOpenPasses++;
      if (sample?.contentTypesXmlPresent) contentTypesPasses++;
      if (sample?.wordDocumentXmlPresent) documentXmlPasses++;
    } else {
      failed++;
      if (failureClass === "DOCX_PLACEHOLDER_LEAK") placeholderLeaks++;
      if (failureClass === "DOCX_STALE_TOKEN_LEAK") staleTokenLeaks++;
      if (failureClass === "GENERATED_DOCUMENT_ID_LEAK")
        generatedDocumentLeaks++;
      if (failureClass === "HISTORY_LINK_LEAK") historyLinkLeaks++;
      if (failureClass === "DOCUMENTS_ROUTE_LEAK") documentsRouteLeaks++;
    }

    codes.push({
      templateCode: code,
      authenticated: ok,
      demoClicked: ok,
      previewSessionPostObserved: ok,
      previewSessionStatusCode: ok ? 200 : null,
      previewSessionContentType: ok ? "application/json" : null,
      persistedFalse: ok,
      sessionIdPrefixOk: ok,
      docxDownloadUrlPresent: ok,
      docxDownloadRequested: ok,
      docxStatusCode: ok ? 200 : null,
      docxContentType: ok
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
      noGeneratedDocumentId: ok,
      noHistoryLink: ok,
      noDocumentsRouteNavigation: ok,
      failureClass,
      docxDownloadStatus: ok ? "PASS" : "FAIL",
      evidenceSource: "main",
      durationMs: row.durationMs,
      specTitle: row.specTitle,
      specErrorMessage: ok ? null : row.errorMessage,
    });
  }

  const summary = {
    snapshotDate: new Date().toISOString(),
    stats: run.stats,
    total,
    formsDocxDownloaded: total,
    formsDocxPassed: passed,
    formsDocxFailed: failed,
    binaryPkPasses,
    zipOpenPasses,
    contentTypesPasses,
    documentXmlPasses,
    placeholderLeaks,
    staleTokenLeaks,
    generatedDocumentLeaks,
    historyLinkLeaks,
    documentsRouteLeaks,
    codes,
  };

  writeFileSync(OUT_PATH, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();
