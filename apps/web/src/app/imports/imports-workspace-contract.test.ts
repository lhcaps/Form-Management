import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Imports workspace contract guard.
 *
 * PR #12 — research-only. PR #13 — shell + read-only state surfaces.
 * PR #14 — centralized import status labels in shared StatusBadge.
 *
 * This test is read-only and never executes the imports workspace, the
 * upload XHR, the confirm endpoint, or any UI rendering. It only pins
 * behavior-critical strings in the source so that future implementation
 * PRs cannot silently break:
 *
 *   - the API helper surface (helpers are still imported by name)
 *   - the endpoint substrings each helper hits
 *   - the file `accept` attribute of the dropzone
 *   - the import status enum members that exist today (now in
 *     apps/web/src/components/common/status-badge.tsx IMPORT_CONFIG)
 *   - the `ImportTargetType` literal set used by radio control
 *   - the `ConfirmImportPayload` key names used by the confirm handler
 *   - the readApi `noStore: true` behavior for import flows
 *   - the upload progress strategy (XHR + onprogress)
 *   - the workspace routes every status render through `StatusBadge`
 *     with `type="import"` (no re-introduced local `statusLabelMap`)
 *
 * Allowed assertions only. NO snapshot. NO render. NO upload.
 *
 * If any of these assertions fail, it means a future PR edited the
 * imports workspace in a way that changes the upload/confirm/history
 * contract. Revert that change or update this guard intentionally in a
 * paired commit.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..", "..", "..");
const workspacePath = join(repoRoot, "apps", "web", "src", "components", "imports", "import-workspace.tsx");
const apiPath = join(repoRoot, "apps", "web", "src", "lib", "imports-api.ts");
const statusBadgePath = join(repoRoot, "apps", "web", "src", "components", "common", "status-badge.tsx");

const workspaceSource = readFileSync(workspacePath, "utf8");
const apiSource = readFileSync(apiPath, "utf8");
const statusBadgeSource = readFileSync(statusBadgePath, "utf8");

// ----------------------------------------------------------------------
// 1. API helper surface (must be exported from imports-api.ts)
// ----------------------------------------------------------------------

test("imports-api exports the six helpers the workspace depends on", () => {
  for (const helper of [
    /export\s+function\s+uploadImportFiles/,
    /export\s+async\s+function\s+getImportBatch/,
    /export\s+async\s+function\s+getImportHistory/,
    /export\s+async\s+function\s+confirmImportBatch/,
    /export\s+async\s+function\s+searchCases/,
    /export\s+function\s+getImportFileDownloadUrl/,
  ]) {
    assert.match(apiSource, helper, `missing import API helper: ${helper}`);
  }
});

test("imports-api still routes history through readApi with noStore=true", () => {
  assert.match(apiSource, /return\s+_readApi<T>\(\s*path,\s*\{\s*\.\.\.\(init\s*\?\?\s*\{\}\),\s*noStore:\s*true\s*\}\)/);
  assert.match(apiSource, /noStore:\s*true/);
});

test("imports-api upload still uses XMLHttpRequest for progress reporting", () => {
  assert.match(apiSource, /new\s+XMLHttpRequest\(\)/);
  assert.match(apiSource, /xhr\.upload\.onprogress/);
  assert.match(apiSource, /formData\.append\("files"/);
});

test("imports-api endpoints preserve their paths", () => {
  for (const endpoint of [
    "/import/upload",
    "/import/batches/",
    "/confirm",
    "/import/history",
    "/import/files/",
    "/download",
    "/cases?q=",
  ]) {
    assert.ok(apiSource.includes(endpoint), `missing endpoint substring: ${endpoint}`);
  }
});

test("imports-api history helper still defaults to page 1 + pageSize 12", () => {
  assert.match(apiSource, /page\s*=\s*1/);
  assert.match(apiSource, /pageSize\s*=\s*12/);
});

// ----------------------------------------------------------------------
// 2. Workspace imports + helper calls
// ----------------------------------------------------------------------

test("workspace imports every required helper from @/lib/imports-api", () => {
  for (const helper of [
    "confirmImportBatch",
    "getImportBatch",
    "getImportFileDownloadUrl",
    "getImportHistory",
    "searchCases",
    "uploadImportFiles",
  ]) {
    assert.ok(
      workspaceSource.includes(helper),
      `workspace no longer references helper: ${helper}`,
    );
  }
});

test("workspace still calls getImportHistory(1, 12)", () => {
  assert.match(workspaceSource, /getImportHistory\(\s*1\s*,\s*12\s*\)/);
});

test("workspace still calls searchCases(keyword) and unwraps response", () => {
  assert.match(workspaceSource, /searchCases\(\s*keyword\s*\)/);
});

test("workspace still computes confirm payload using ConfirmImportPayload", () => {
  // The payload is constructed via object literal: { targetType, note: ... }
  // EXISTING_CASE branch assigns payload.existingCaseId = ...
  // NEW_CASE branch assigns payload.newCase = { ... } with the frozen keys.
  assert.match(workspaceSource, /payload:\s*ConfirmImportPayload\s*=\s*\{/);
  assert.match(workspaceSource, /targetType,/);
  assert.match(workspaceSource, /payload\.existingCaseId\s*=/);
  assert.match(workspaceSource, /payload\.newCase\s*=/);
  assert.match(workspaceSource, /note:\s*note\.trim\(\)\s*\|\|\s*undefined/);
});

// ----------------------------------------------------------------------
// 3. File input accept attribute (dropzone)
// ----------------------------------------------------------------------

test("dropzone file input preserves the exact accept attribute", () => {
  assert.match(
    workspaceSource,
    /accept="\.pdf,\.docx,\.doc,\.xlsx,\.xls,\.csv,\.txt,\.json,\.png,\.jpg,\.jpeg,\.webp,\.tif,\.tiff"/,
  );
  assert.match(workspaceSource, /<input[^>]*type="file"[^>]*multiple/);
});

// ----------------------------------------------------------------------
// 4. Drag/drop handlers and file picker still attached to dropzone
// ----------------------------------------------------------------------

test("dropzone still handles dragEnter/dragLeave/drop", () => {
  assert.match(workspaceSource, /onDragOver=\{[^}]*event\.preventDefault\(\)/);
  assert.match(workspaceSource, /onDragLeave=\{[^}]*setDragging\(false\)/);
  assert.match(workspaceSource, /onDrop=\{[^}]*handleChosenFiles\(event\.dataTransfer\.files\)/);
});

test("file picker change handler still feeds handleChosenFiles", () => {
  assert.match(
    workspaceSource,
    /onChange=\{\(event\) => handleChosenFiles\(event\.target\.files\)\}/,
  );
});

// ----------------------------------------------------------------------
// 5. Status enum + ImportTargetType + radio control
// ----------------------------------------------------------------------

test("every frozen import status is mapped by the shared StatusBadge import config", () => {
  // PR #14 centralized the import status enum into
  // apps/web/src/components/common/status-badge.tsx (IMPORT_CONFIG). The
  // workspace no longer carries a local `statusLabelMap`; it reads
  // labels via `StatusBadge type="import"` and `importStatusLabel`.
  // This contract still pins that every frozen status is mapped.
  for (const status of [
    "UPLOADED",
    "PARSED",
    "PARTIAL",
    "FAILED",
    "CONFIRMED",
    "STORED_ONLY",
    "PARSED_WITH_WARNINGS",
    "REJECTED",
  ]) {
    assert.ok(
      statusBadgeSource.includes(status),
      `IMPORT_CONFIG missing status: ${status}`,
    );
  }

  // Workspace must route every status render through the shared module,
  // not a re-introduced local helper.
  assert.match(
    workspaceSource,
    /from\s+["']@\/components\/common\/status-badge["']/,
  );
  assert.ok(
    workspaceSource.includes("type=\"import\"") ||
      workspaceSource.includes("type='import'"),
    "workspace no longer uses StatusBadge type=\"import\" for import statuses",
  );
});

test("targetOptions still list every ImportTargetType literal", () => {
  for (const literal of ["RAW_REFERENCE", "EXISTING_CASE", "NEW_CASE", "TEMPLATE_SOURCE"]) {
    assert.ok(
      workspaceSource.includes(literal),
      `targetOptions missing literal: ${literal}`,
    );
  }
  // The target-type radio group is now a shadcn RadioGroup primitive
  // (PR next Imports controls migration). The shadcn RadioGroup wrapper
  // does not forward a `name` attribute to native input semantics, but
  // the four literal values are still passed to each RadioGroupItem via
  // the `value` prop and are bound through `onValueChange` →
  // `setTargetType`. This keeps the contract guard equivalent (a
  // targetType control exists with the same four literal values) while
  // acknowledging the primitive migration.
  assert.match(
    workspaceSource,
    /onValueChange=\{\(value\) => setTargetType\(value as ImportTargetType\)\}/,
  );
  assert.match(
    workspaceSource,
    /<RadioGroupItem[^>]*value=\{option\.value\}/,
  );
  assert.doesNotMatch(
    workspaceSource,
    /<input[^>]*type="radio"[^>]*name="targetType"/,
    "raw targetType <input type=\"radio\"> must be migrated to RadioGroup primitive",
  );
});

// ----------------------------------------------------------------------
// 6. Confirm payload key names (mirror ConfirmImportPayload)
// ----------------------------------------------------------------------

test("workspace constructs the newCase payload with the frozen key names", () => {
  for (const key of [
    "caseCode:",
    "caseTitle:",
    "relatedPersonName:",
    "offenseName:",
    "createdDate:",
    "payload.existingCaseId",
    "payload.newCase",
    "note.trim()",
  ]) {
    assert.ok(
      workspaceSource.includes(key),
      `confirm payload construction lost key: ${key}`,
    );
  }
});

// ----------------------------------------------------------------------
// 7. Lifecycle flags: uploading / confirming / historyLoading
// ----------------------------------------------------------------------

test("workspace still toggles uploading/uploading progress/confirming flags", () => {
  assert.match(workspaceSource, /setUploading\(true\)/);
  assert.match(workspaceSource, /setUploading\(false\)/);
  assert.match(workspaceSource, /setConfirming\(true\)/);
  assert.match(workspaceSource, /setConfirming\(false\)/);
  assert.match(workspaceSource, /setHistoryLoading\(true\)/);
  assert.match(workspaceSource, /setHistoryLoading\(false\)/);
  assert.match(workspaceSource, /setUploadProgress\(0\)/);
});

// ----------------------------------------------------------------------
// 8. useTransition wraps the history load
// ----------------------------------------------------------------------

test("workspace still uses useTransition for the history effect", () => {
  assert.match(workspaceSource, /useTransition/);
  assert.match(workspaceSource, /startHistoryTransition\(\(\) => \{\s*void\s+loadHistory\(\)/);
});
