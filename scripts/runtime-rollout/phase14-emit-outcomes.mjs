/**
 * Phase 14 — emit honest, machine-derived outcome artifacts from the
 * Phase 14 lifecycle matrix + the empirical Playwright probe result.
 *
 * Produces:
 *   - standalone-results-6.json (6 rows, lifecycle = STANDALONE_RUNTIME_PREVIEW)
 *   - persisted-ui-results-77.json (77 rows, lifecycle = PERSISTED_DOCUMENT_WORKSPACE)
 *   - browser-lifecycle-verdicts-83.json (83 rows, unified)
 *   - artifact-lineage.json
 *   - divergent-artifact-visual-results.json (empty, no divergent artifacts)
 */
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE14_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase14-dual-browser-promotion",
);
const MATRIX = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
const PROBE = path.join(PHASE14_DIR, "playwright-probe.json");

const VERDICT_BY_LIFECYCLE = {
  STANDALONE_RUNTIME_PREVIEW: "STANDALONE_BROWSER_FAIL",
  PERSISTED_DOCUMENT_WORKSPACE: "PERSISTED_BROWSER_UI_FAIL",
};

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const matrix = JSON.parse(await readFile(MATRIX, "utf8"));
  const probe = JSON.parse(await readFile(PROBE, "utf8"));

  const standaloneRows = matrix.rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW");
  const persistedRows = matrix.rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE");

  const probeFindings = {
    probeOutcome: probe.targets.map((t) => ({
      formCode: t.formCode,
      route: t.route,
      lifecycle: t.lifecycle,
      browserLaunch: t.browserLaunch,
      navigationStatus: t.navigation?.status ?? null,
      formHeadingFound: t.formHeadingFound,
      error: t.error ?? null,
    })),
  };

  const baseRun = {
    schema: "qllaw.phase14.dual_lifecycle/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    runId: process.env.RUN_ID ?? "PHASE14_2026_07_27_0530",
    mode: "phase14-empirical",
    authMechanism: "qlv_session cookie only",
    empiricalVerdict: "BLOCKED_BY_AUTH_REFRESH_REQUIRED",
    empiricalProbeArtifacts: [path.relative(REPO_ROOT, PROBE)],
  };

  const standalone = {
    ...baseRun,
    lifecycle: "STANDALONE_RUNTIME_PREVIEW",
    totalForms: standaloneRows.length,
    forms: standaloneRows.map((r) => ({
      formCode: r.FORM_CODE,
      lifecycle: r.SUPPORTED_BROWSER_LIFECYCLE,
      standaloneRoute: r.STANDALONE_ROUTE,
      r1ControlsEntered: null,
      r1PreviewRequestPass: null,
      r1PersistedFalse: null,
      r1SessionId: null,
      r1PreviewPass: null,
      r1DownloadPass: null,
      r1DownloadSha256: null,
      r2ControlsEntered: null,
      r2PreviewRequestPass: null,
      r2PersistedFalse: null,
      r2SessionId: null,
      r2SessionDistinct: null,
      r2PreviewPass: null,
      r2DownloadPass: null,
      r2DownloadSha256: null,
      staleR1Absent: null,
      consoleErrors: null,
      networkFailures: null,
      processExitClean: null,
      finalVerdict: "STANDALONE_BROWSER_FAIL",
      blockerReason: "AUTH_REDIRECT_TO_SIGN_IN",
      blockerEvidence: probeFindings,
    })),
    summary: {
      attempted: 0,
      passed: 0,
      failed: standaloneRows.length,
      blockedByAuth: standaloneRows.length,
    },
  };

  const persisted = {
    ...baseRun,
    lifecycle: "PERSISTED_DOCUMENT_WORKSPACE",
    totalForms: persistedRows.length,
    forms: persistedRows.map((r) => ({
      formCode: r.FORM_CODE,
      lifecycle: r.SUPPORTED_BROWSER_LIFECYCLE,
      persistedRoute: r.PERSISTED_ROUTE,
      persistedDocumentId: r.PERSISTED_DOCUMENT_ID,
      r1ControlsEntered: null,
      r1SavePass: null,
      r1UiHydrationPass: null,
      r2ControlsEntered: null,
      r2SavePass: null,
      r2UiHydrationPass: null,
      staleR1UiFailures: null,
      staleR1DocxFailures: null,
      revisionParity: null,
      consoleErrors: null,
      networkFailures: null,
      processExitClean: null,
      finalVerdict: "PERSISTED_BROWSER_UI_FAIL",
      blockerReason: "AUTH_REDIRECT_TO_SIGN_IN",
      blockerEvidence: probeFindings,
    })),
    summary: {
      attempted: 0,
      passed: 0,
      failed: persistedRows.length,
      blockedByAuth: persistedRows.length,
    },
  };

  const unified = {
    schema: "qllaw.phase14.browser_lifecycle_verdicts/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    totalRows: matrix.rows.length,
    persistedPass: 0,
    persistedFail: persistedRows.length,
    standalonePass: 0,
    standaloneFail: standaloneRows.length,
    totalPass: 0,
    totalFail: matrix.rows.length,
    notExecuted: 0,
    authBlocked: matrix.rows.length,
    empiricalVerdict: "BLOCKED_BY_AUTH_REFRESH_REQUIRED",
    rows: matrix.rows.map((r) => ({
      FORM_CODE: r.FORM_CODE,
      LIFECYCLE: r.SUPPORTED_BROWSER_LIFECYCLE,
      FINAL_VERDICT: r.SUPPORTED_BROWSER_LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW"
        ? "STANDALONE_BROWSER_FAIL"
        : "PERSISTED_BROWSER_UI_FAIL",
      BLOCKER_REASON: "AUTH_REDIRECT_TO_SIGN_IN",
    })),
  };

  const artifactLineage = {
    schema: "qllaw.phase14.artifact_lineage/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    note: "No browser-downloaded artifacts were produced in this turn because the Playwright probe confirmed auth-redirect. The lineage is therefore empty. Phase 12 visual artifacts remain the canonical visual evidence for the 83 forms.",
    phase12VisualArtifact: "docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/phase12-visual/visual-final-verdicts-213.json",
    apiDownloadedArtifacts: "Phase 13c produced API-level DOCX via POST /api/v1/documents/generated/<id>/render-docx for 77 forms — these are NOT browser-downloaded artifacts and are not used as Phase 14 evidence.",
    browserDownloadedArtifacts: [],
    divergentArtifactCount: 0,
  };

  const divergentArtifacts = {
    schema: "qllaw.phase14.divergent_artifact_visual_results/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    totalDivergentArtifacts: 0,
    divergentArtifacts: [],
    note: "No browser-downloaded artifacts exist, so no divergent artifacts can be re-verified with Word/LibreOffice. Phase 12 visual evidence remains the canonical visual layer for the 83 forms.",
  };

  const out = {
    standalonePath: path.join(PHASE14_DIR, "standalone-results-6.json"),
    persistedPath: path.join(PHASE14_DIR, "persisted-ui-results-77.json"),
    unifiedPath: path.join(PHASE14_DIR, "browser-lifecycle-verdicts-83.json"),
    lineagePath: path.join(PHASE14_DIR, "artifact-lineage.json"),
    divergentPath: path.join(PHASE14_DIR, "divergent-artifact-visual-results.json"),
  };

  await writeFile(out.standalonePath, JSON.stringify(standalone, null, 2));
  await writeFile(out.persistedPath, JSON.stringify(persisted, null, 2));
  await writeFile(out.unifiedPath, JSON.stringify(unified, null, 2));
  await writeFile(out.lineagePath, JSON.stringify(artifactLineage, null, 2));
  await writeFile(out.divergentPath, JSON.stringify(divergentArtifacts, null, 2));

  const sha256 = (s) => createHash("sha256").update(s).digest("hex");
  console.log(JSON.stringify({
    artifactsWritten: Object.values(out).map((p) => path.relative(REPO_ROOT, p)),
    unifiedHash: sha256(JSON.stringify(unified.rows)),
    rows: unified.totalRows,
    persistedPass: unified.persistedPass,
    persistedFail: unified.persistedFail,
    standalonePass: unified.standalonePass,
    standaloneFail: unified.standaloneFail,
  }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-emit-outcomes] fatal:", err);
  process.exit(1);
});
