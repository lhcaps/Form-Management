#!/usr/bin/env node
/**
 * status-matrix-213.mjs
 *
 * Final completion matrix for all 213 forms. Combines:
 *   - audit-213-form-input-linkage.mjs (linkage classification)
 *   - smoke-213-template-routes.mjs  (route HTTP 200)
 *   - render-smoke-curated.mjs       (render smoke for INPUT_CONNECTED_PASS)
 *
 * Output: docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.{md,json}
 */

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const COMPILED_DIR = `${ROOT}/docs/audit/docx/compiled-v2`;
const LOCKED_DIR = `${ROOT}/docs/audit/docx/contracts/locked`;
const PROFILES_DIR = `${ROOT}/apps/web/src/lib/runtime-ux`;
const INDEX_FILE = `${PROFILES_DIR}/index.ts`;
const LEGACY_DIR = `${ROOT}/apps/web/src/components/documents`;
const FORMS_DIR = `${ROOT}/apps/web/src/lib/form-flight/profiles`;
const MATRIX_FILE = `${ROOT}/docs/audit/unified-bm-workspace/QLLAW_213_FORM_INPUT_LINKAGE_MATRIX.latest.json`;
const ROUTE_SMOKE_FILE = `${ROOT}/docs/audit/unified-bm-workspace/QLLAW_213_TEMPLATE_BROWSER_SMOKE.latest.json`;
const RENDER_SMOKE_FILE = `${ROOT}/docs/audit/unified-bm-workspace/QLLAW_CURATED_RENDER_SMOKE.latest.json`;
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const STATUS_MATRIX_OUT_FILE = `${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.json`;
const PRESERVE_APPLY_FIELDS =
  process.env.QLLAW_STATUS_MATRIX_PRESERVE_APPLY_FIELDS !== "0";

const BASE_ROW_FIELDS = new Set([
  "templateCode",
  "status",
  "compiledExists",
  "lockedExists",
  "runtimeUxProfileExists",
  "runtimeUxProfileRegistered",
  "formFlightProfileExists",
  "legacyComponentExists",
  "routeHttpStatus",
  "routeHasCodeInBody",
  "sourceRenderVerified",
]);

function readJsonSafe(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return null; }
}

function existingSummary() {
  if (!PRESERVE_APPLY_FIELDS) return null;
  return readJsonSafe(STATUS_MATRIX_OUT_FILE);
}

function existingRowsByCode(existing) {
  const rows = Array.isArray(existing?.rows) ? existing.rows : [];
  return new Map(rows.map((row) => [row.templateCode, row]));
}

function preserveApplyOwnedFields(row, existingRow) {
  if (!existingRow || typeof existingRow !== "object") return row;

  if (
    existingRow.remainingSourceRenderVerified === true &&
    existingRow.status === "INPUT_CONNECTED_PASS" &&
    existingRow.sourceRenderVerified === true
  ) {
    row.status = existingRow.status;
    row.sourceRenderVerified = true;
  }

  for (const [key, value] of Object.entries(existingRow)) {
    if (key === "templateCode") continue;
    if (BASE_ROW_FIELDS.has(key)) continue;
    row[key] = value;
  }
  return row;
}

const BASE_SUMMARY_FIELDS = new Set([
  "snapshotDate",
  "total",
  "counts",
  "rows",
  "curated22BrowserEvidence",
  "notes",
]);

function preserveApplyOwnedSummaries(summary, existing) {
  if (!existing || typeof existing !== "object") return summary;
  for (const [key, value] of Object.entries(existing)) {
    if (BASE_SUMMARY_FIELDS.has(key)) continue;
    summary[key] = value;
  }
  return summary;
}

function lockedExists(code) {
  if (!existsSync(LOCKED_DIR)) return false;
  const needle = `${code}__`;
  return readdirSync(LOCKED_DIR).some((n) => n.startsWith(needle) && n.endsWith(".contract.locked.json"));
}

function profileExists(code) {
  return existsSync(`${PROFILES_DIR}/bm${code.slice(3)}-runtime-ux-profile.ts`);
}

function profileRegistered(code) {
  if (!existsSync(INDEX_FILE)) return false;
  return readFileSync(INDEX_FILE, "utf8").includes(`./bm${code.slice(3)}-runtime-ux-profile`);
}

function compiledExists(code) {
  return existsSync(`${COMPILED_DIR}/${code}.compiled.json`);
}

function formFlightExists(code) {
  const codeLower = code.toLowerCase();
  const candidates = [
    `${FORMS_DIR}/${codeLower}.ts`,
    `${FORMS_DIR}/${codeLower}/index.ts`,
    `${FORMS_DIR}/${code}.ts`,
  ];
  return candidates.some((p) => existsSync(p));
}

function legacyComponentExists(code) {
  return existsSync(`${LEGACY_DIR}/${code.toLowerCase()}-form-inputs.tsx`);
}

function main() {
  const matrix = readJsonSafe(MATRIX_FILE) || { results: [] };
  const routeSmoke = readJsonSafe(ROUTE_SMOKE_FILE);
  const renderSmoke = readJsonSafe(RENDER_SMOKE_FILE);
  const previousSummary = existingSummary();
  const previousRows = existingRowsByCode(previousSummary);

  const routeStatus = new Map();
  for (const r of routeSmoke?.results || []) {
    routeStatus.set(r.templateCode, { status: r.status, hasCodeInBody: r.hasCodeInBody });
  }
  const renderPass = new Set((renderSmoke?.codes || []).filter((c) => c.passes).map((c) => c.templateCode));
const curatedBrowserEvidence = readJsonSafe(`${OUT_DIR}/QLLAW_CURATED_BROWSER_SMOKE.latest.json`);

  // Phase 3 linkage-matrix is the source of truth for classification.
  // For each code we re-derive and overlay:
  //   - browser smoke result
  //   - render smoke pass (if applicable)
  //   - 211-form guardrail: only BM-001/BM-171 have formFlight readiness allowlisted.
  const rows = [];
  let counts = {
    INPUT_CONNECTED_PASS: 0,
    INPUT_CONNECTED_PARTIAL: 0,
    FIDELITY_PENDING: 0,
    ROUTE_BLOCKED: 0,
    CONTRACT_BLOCKED: 0,
    PREVIEW_BLOCKED: 0,
  };

  for (let n = 1; n <= 213; n++) {
    const code = `BM-${String(n).padStart(3, "0")}`;
    const locked = lockedExists(code);
    const compiled = compiledExists(code);
    const profile = profileExists(code);
    const registered = profileRegistered(code);
    const flight = formFlightExists(code);
    const legacy = legacyComponentExists(code);
    const route = routeStatus.get(code);

    let status = "FIDELITY_PENDING";
    if (!compiled && !locked) status = "ROUTE_BLOCKED";
    else if (!locked) status = "CONTRACT_BLOCKED";
    else if (!compiled) status = "PREVIEW_BLOCKED";
    else if (renderPass.has(code)) status = "INPUT_CONNECTED_PASS";
    else if (registered) status = "INPUT_CONNECTED_PARTIAL";

    const row = {
      templateCode: code,
      status,
      compiledExists: compiled,
      lockedExists: locked,
      runtimeUxProfileExists: profile,
      runtimeUxProfileRegistered: registered,
      formFlightProfileExists: flight,
      legacyComponentExists: legacy,
      routeHttpStatus: route?.status ?? null,
      routeHasCodeInBody: route?.hasCodeInBody ?? null,
      // Evidence flags. Only the curated INPUT_CONNECTED_PASS codes carry
      // these; everything else leaves the fields undefined to avoid
      // implying verification we did not perform.
      sourceRenderVerified: renderPass.has(code) ? true : undefined,
      // browserVisibilitySpecReady is the existence of the spec, not the
      // outcome — true whenever the curated spec includes this code.
      browserVisibilitySpecReady: curatedBrowserEvidence?.results?.some(
        (r) => r.templateCode === code,
      )
        ? true
        : undefined,
      // Per-form Playwright visibility from the curated browser artifact.
      // `null` distinguishes "no real run was loaded" from "ran and failed"
      // (false) and "ran and passed" (true).
      browserVerified: curatedBrowserEvidence?.results?.find(
        (r) => r.templateCode === code,
      )
        ? Boolean(
            curatedBrowserEvidence.results.find(
              (r) => r.templateCode === code,
            )?.browserVisibilityVerified,
          )
        : null,
      // Per-form reason text. Empty when the form passed silently.
      browserVerifiedReason:
        curatedBrowserEvidence?.results?.find((r) => r.templateCode === code)
          ?.blockerReason ||
        curatedBrowserEvidence?.results?.find((r) => r.templateCode === code)
          ?.specErrorMessage ||
        curatedBrowserEvidence?.results?.find((r) => r.templateCode === code)
          ?.consoleErrors ||
        "",
      "browserVerifiedReason":
        curatedBrowserEvidence?.results?.find((r) => r.templateCode === code)
          ?.blockerReason ||
        curatedBrowserEvidence?.results?.find((r) => r.templateCode === code)
          ?.specErrorMessage ||
        curatedBrowserEvidence?.results?.find((r) => r.templateCode === code)
          ?.consoleErrors ||
        "",
      // Per-form Playwright spec duration when available.
      browserVerifiedDurationMs:
        curatedBrowserEvidence?.results?.find((r) => r.templateCode === code)
          ?.specDurationMs ?? undefined,
      // Per-form Playwright spec raw status (passed/failed/skipped/etc.)
      browserVerifiedStatus:
        curatedBrowserEvidence?.results?.find((r) => r.templateCode === code)
          ?.specStatus ?? undefined,
      // Tri-state for click-flow / preview-session flows — updated by apply-*
      // scripts after respective smoke phases. Default false until evidence exists.
      demoClickVerified: false,
      previewClickVerified: false,
      fidelityComplete: false,
    };

    rows.push(preserveApplyOwnedFields(row, previousRows.get(code)));

  }

  counts = Object.fromEntries(Object.keys(counts).map((key) => [key, 0]));
  for (const row of rows) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }

  const summary = preserveApplyOwnedSummaries({
    snapshotDate: new Date().toISOString(),
    total: rows.length,
    counts,
    rows,
    curated22BrowserEvidence: curatedBrowserEvidence
      ? {
          snapshotDate: curatedBrowserEvidence.snapshotDate,
          authStrategy: curatedBrowserEvidence.authStrategy,
          browserRunnable: curatedBrowserEvidence.browserRunnable,
          browserBlockedReason: curatedBrowserEvidence.browserBlockedReason,
          counts: curatedBrowserEvidence.counts,
          staleHits: curatedBrowserEvidence.staleHits,
        }
      : null,
    notes: [
      "INPUT_CONNECTED_PASS = curated profile with all source/render invariants verified end-to-end.",
      "INPUT_CONNECTED_PARTIAL = auto-generated runtime-ux profile, registered, smoke 200, but no hand-curated labels yet.",
      "FIDELITY_PENDING = no auto-generated profile (should now be 0 after Phase 4).",
      "ROUTE_BLOCKED / CONTRACT_BLOCKED / PREVIEW_BLOCKED = missing compiled or locked contract.",
      "sourceRenderVerified=true means the runtime-ux render smoke passes for that code (read-only audit, no browser).",
      "browserVerified=true ONLY when an authenticated Playwright visibility run passed for that code; false ONLY when the run executed and the form failed; null when no run was loaded.",
      "demoClickVerified / previewClickVerified / docxDownloadVerified are set by apply-* scripts after each smoke phase. fidelityComplete remains false until golden/layout fidelity audit passes.",
      "FIDELITY_COMPLETE_EVIDENCED not claimed until golden/layout fidelity audit proves source/locked DOCX structural parity.",
    ],
  }, previousSummary);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(STATUS_MATRIX_OUT_FILE, JSON.stringify(summary, null, 2));

  const lines = [];
  lines.push("# QLLAW 213 Form Input Status Matrix — latest");
  lines.push("");
  lines.push(`> **Generated**: ${summary.snapshotDate}`);
  lines.push(`> **Total forms**: ${summary.total}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push("| Status | Count |");
  lines.push("|---|---|");
  for (const [k, v] of Object.entries(counts)) lines.push(`| ${k} | ${v} |`);
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  for (const note of summary.notes) lines.push(`- ${note}`);
  if (summary.curated22BrowserEvidence) {
    lines.push("");
    lines.push("## Curated 22 Browser Evidence");
    lines.push("");
    lines.push(`- snapshotDate: ${summary.curated22BrowserEvidence.snapshotDate}`);
    lines.push(`- authStrategy: ${summary.curated22BrowserEvidence.authStrategy}`);
    lines.push(`- browserRunnable: ${summary.curated22BrowserEvidence.browserRunnable}`);
    lines.push(`- browserBlockedReason: ${summary.curated22BrowserEvidence.browserBlockedReason}`);
    lines.push(`- routeProtected: ${summary.curated22BrowserEvidence.counts.routeProtected}/${summary.curated22BrowserEvidence.counts.total}`);
    lines.push(`- routeNotFailing: ${summary.curated22BrowserEvidence.counts.routeNotFailing}/${summary.curated22BrowserEvidence.counts.total}`);
    lines.push(`- browserSmoked: ${summary.curated22BrowserEvidence.counts.browserSmoked}/${summary.curated22BrowserEvidence.counts.total}`);
    lines.push(`- browserPassed: ${summary.curated22BrowserEvidence.counts.browserPassed}/${summary.curated22BrowserEvidence.counts.total}`);
    lines.push(`- browserFailed: ${summary.curated22BrowserEvidence.counts.browserFailed}/${summary.curated22BrowserEvidence.counts.total}`);
    lines.push(`- staleTokensDetected: ${summary.curated22BrowserEvidence.counts.staleTokensDetected}`);
    lines.push("");
    lines.push("Artifact: `docs/audit/unified-bm-workspace/QLLAW_CURATED_BROWSER_SMOKE.latest.{md,json}`");
    lines.push("");
    lines.push("### Per-form evidence (curated INPUT_CONNECTED_PASS codes)");
    lines.push("");
    lines.push("| Code | Source render | Browser spec ready | Browser verified | Spec status | Spec duration (ms) | Reason |");
    lines.push("|---|---|---|---|---|---|---|");
    const curatedRows = rows
      .filter((r) => r.status === "INPUT_CONNECTED_PASS")
      .sort((a, b) => a.templateCode.localeCompare(b.templateCode));
    for (const r of curatedRows) {
      lines.push(
        `| ${r.templateCode} | ${r.sourceRenderVerified ? "yes" : "no"} | ${
          r.browserVisibilitySpecReady ? "yes" : "no"
        } | ${r.browserVerified === true ? "yes" : r.browserVerified === false ? "no" : "—"} | ${
          r.browserVerifiedStatus ?? "—"
        } | ${r.browserVerifiedDurationMs ?? "—"} | ${(r.browserVerifiedReason || "").toString().slice(0, 80)} |`,
      );
    }
    lines.push("");
  }
  lines.push("");
  writeFileSync(`${OUT_DIR}/QLLAW_213_FORM_INPUT_STATUS_MATRIX.latest.md`, lines.join("\n") + "\n");

  console.log(JSON.stringify(counts, null, 2));
}

main();
