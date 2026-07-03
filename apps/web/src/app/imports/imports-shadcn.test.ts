import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

/**
 * Imports workspace shadcn/layout source guard.
 *
 * PR #13 — Imports shell + read-only state surfaces migration.
 * PR #14 — Imports status pills + history surfaces migration.
 * PR (previous) — PreviewTable raw `<table>` / `<thead>` / `<tbody>` /
 *   `<tr>` / `<td>` / `<th>` migrated to the shadcn `Table` primitives.
 * PR (next) — Imports controls shadcn migration. Migrates:
 *   - 6 raw `<button>` call sites to the shared `Button` primitive
 *     (dropzone "Chọn file" via `Button asChild` wrapping the label,
 *     "Tải lên" upload, "Xác nhận import" confirm, "Tải lại" history
 *     reload, per-file selection row, per-case-search result row,
 *     history batch card).
 *   - 6 raw text/date `<input>` controls to `Input` (existingCaseQuery,
 *     caseCode, createdDate, caseTitle, relatedPersonName, offenseName).
 *   - The notes `<textarea>` to `Textarea`.
 *   - The target-type `<input type="radio">` group to `RadioGroup` +
 *     `RadioGroupItem` while preserving `name="targetType"` and the four
 *     literal values.
 *   - The raw hand-rolled dropzone `<svg>` to Lucide `UploadCloud`.
 *
 * The only raw `<input>` that remains is the hidden dropzone file input
 * (it has no shadcn equivalent and is required by the native file
 * picker — `accept`, `multiple`, and `onChange` are preserved verbatim).
 * The JSON / previewText `<pre>` blocks remain intentionally raw
 * (deferred — see convergence plan PR result).
 *
 * This test is read-only and only inspects source files. It does NOT
 * render the workspace, exercise the upload XHR, or touch the API.
 *
 * It asserts that the migration introduced the expected shared primitives
 * (PageShell at the route, ErrorBanner / LoadingState / EmptyState in the
 * workspace, PageSection composition via SectionCard, StatusBadge for
 * every frozen import status, Badge variants for confidence pills,
 * Table primitives for the parsed preview, Button / Input / Textarea /
 * RadioGroup for the controls, Lucide UploadCloud for the upload icon)
 * and did not introduce dark surfaces or `bg-primary` on cards. The
 * frozen behavior strings pinned by `imports-workspace-contract.test.ts`
 * are still required and that file must continue to pass.
 */

const webSrc = dirname(fileURLToPath(import.meta.url));
// webSrc = apps/web/src/app/imports → up 2 to apps/web/src
const webSrcRoot = join(webSrc, "..", "..");

function readSource(...segments: string[]) {
  return readFileSync(join(webSrcRoot, ...segments), "utf8");
}

const pageSource = readSource("app/imports/page.tsx");
const workspaceSource = readSource(
  "components/imports/import-workspace.tsx",
);

// ---------------------------------------------------------------------------
// Phase A — PageShell adoption at the route level
// ---------------------------------------------------------------------------

test("/imports route is wrapped in PageShell", () => {
  assert.match(pageSource, /@\/components\/common\/page-shell/);
  assert.match(pageSource, /PageShell/);
  // The shell must still render the workspace.
  assert.match(pageSource, /@\/components\/imports\/import-workspace/);
  assert.match(pageSource, /<ImportWorkspace/);
});

test("/imports route uses a light page surface (no dark slate as page bg)", () => {
  assert.match(pageSource, /bg-slate-50/);
  assert.doesNotMatch(pageSource, /bg-slate-950/);
  assert.doesNotMatch(pageSource, /bg-slate-900(?!\/)/);
  assert.doesNotMatch(pageSource, /bg-black(?!\/)/);
});

// ---------------------------------------------------------------------------
// Phase B — Shared primitive imports in the workspace
// ---------------------------------------------------------------------------

test("workspace imports the new shared primitives", () => {
  for (const primitive of [
    /@\/components\/common\/empty-state/,
    /@\/components\/common\/error-banner/,
    /@\/components\/common\/loading-state/,
    /@\/components\/common\/page-shell/,
  ]) {
    assert.match(workspaceSource, primitive, `workspace must import ${primitive}`);
  }
});

test("workspace still wires to the frozen helpers + hooks", () => {
  // Helpers
  assert.match(workspaceSource, /confirmImportBatch/);
  assert.match(workspaceSource, /getImportBatch/);
  assert.match(workspaceSource, /getImportFileDownloadUrl/);
  assert.match(workspaceSource, /getImportHistory\(\s*1\s*,\s*12\s*\)/);
  assert.match(workspaceSource, /searchCases\(\s*keyword\s*\)/);
  assert.match(workspaceSource, /uploadImportFiles/);
  // Drag/drop + file picker (frozen contract — guard re-asserts to prevent accidental removal during migration).
  assert.match(workspaceSource, /onDrop=\{[^}]*handleChosenFiles\(event\.dataTransfer\.files\)/);
  assert.match(workspaceSource, /accept="\.pdf,\.docx,\.doc,\.xlsx,\.xls,\.csv,\.txt,\.json,\.png,\.jpg,\.jpeg,\.webp,\.tif,\.tiff"/);
  // Lifecycle + transition wrappers.
  assert.match(workspaceSource, /startHistoryTransition\(\(\) => \{\s*void\s+loadHistory\(\)/);
});

// ---------------------------------------------------------------------------
// Phase C — SectionCard composes PageSection card
// ---------------------------------------------------------------------------

test("local SectionCard composes PageSection card (no hand-rolled shadow card)", () => {
  // SectionCard must wrap its children in PageSection (so the wrapper
  // becomes the shared PageSection card surface rather than a bespoke
  // rounded-[28px] shadow card).
  assert.match(workspaceSource, /PageSection card/);
  // The hand-rolled shadow-card class chain must be gone from SectionCard.
  assert.doesNotMatch(
    workspaceSource,
    /rounded-\[28px\] border border-slate-200 bg-white p-5 shadow-\[0_16px_40px_rgba\(15,23,42,0\.06\)\]/,
    "SectionCard no longer uses the bespoke shadow-card wrapper",
  );
});

// ---------------------------------------------------------------------------
// Phase D — ErrorBanner adoption for direct error cards
// ---------------------------------------------------------------------------

test("ErrorBanner replaces direct rose error cards (upload / confirm / history)", () => {
  // Three ErrorBanner usages — one per error slot.
  for (const token of [
    /<ErrorBanner error=\{uploadError\} title="Không tải được tệp lên"/,
    /<ErrorBanner error=\{confirmError\} title="Không xác nhận được lô import"/,
    /<ErrorBanner error=\{historyError\} title="Không tải được lịch sử import"/,
  ]) {
    assert.match(workspaceSource, token, `expected ErrorBanner usage: ${token}`);
  }
  // The hand-rolled rose error class chain must be gone.
  assert.doesNotMatch(
    workspaceSource,
    /rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-\[14px\] text-rose-700/,
    "direct rose error cards must be replaced with ErrorBanner",
  );
});

// ---------------------------------------------------------------------------
// Phase E — LoadingState / EmptyState adoption for passive states
// ---------------------------------------------------------------------------

test("history loading card replaced with LoadingState variant=list", () => {
  assert.match(workspaceSource, /<LoadingState variant="list" count=\{3\} \/>/);
  assert.doesNotMatch(
    workspaceSource,
    /Đang tải lịch sử import\.\.\./,
    "the inline 'Đang tải lịch sử import...' card must be replaced",
  );
});

test("inline dashed empty cards replaced with EmptyState", () => {
  // At least two EmptyState usages — history empty + no-current-batch
  // empty. The preview 'no file selected' empty is also wired.
  assert.match(workspaceSource, /<EmptyState\s+title="Chưa có lịch sử import nào\."/);
  assert.match(
    workspaceSource,
    /<EmptyState\s+title="Chưa có lô import nào đang mở"/,
  );
  assert.match(
    workspaceSource,
    /<EmptyState\s+title="Chưa chọn file để xem trước"/,
  );
  // The hand-rolled dashed empty class chain must be gone.
  assert.doesNotMatch(
    workspaceSource,
    /rounded-\[26px\] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center/,
    "the 'Chưa có lô import nào đang mở' empty card must use EmptyState",
  );
});

// ---------------------------------------------------------------------------
// Phase F — PR D controls migration. PreviewTable was migrated to shadcn
// Table primitives in the prior PR. This PR (next) migrated the remaining
// raw dropzone / form / radio / icon controls to shadcn primitives. The
// only raw form control that remains is the hidden `<input type="file">`
// in the dropzone, which MUST stay raw (it is required by the native file
// picker — a hidden file input has no shadcn equivalent).
// ---------------------------------------------------------------------------

test("PreviewTable uses shadcn Table primitives (preserved across this PR)", () => {
  // PreviewTable still exists in the workspace.
  assert.match(workspaceSource, /function PreviewTable/);
  assert.match(workspaceSource, /<PreviewTable parsedJson=\{/);

  // PreviewTable now uses the shadcn Table primitive.
  assert.match(
    workspaceSource,
    /@\/components\/ui\/table/,
    "workspace must import the shadcn Table primitive",
  );
  assert.match(
    workspaceSource,
    /<Table[^>]*className="min-w-full border-collapse/,
    "PreviewTable must render <Table className=\"min-w-full border-collapse ...\">",
  );
  assert.match(workspaceSource, /<TableHeader>/);
  assert.match(workspaceSource, /<TableBody>/);
  assert.match(workspaceSource, /<TableRow/);
  assert.match(workspaceSource, /<TableHead/);
  assert.match(workspaceSource, /<TableCell/);

  // Raw `<table>` / `<thead>` / `<tbody>` / `<tr>` / `<td>` / `<th>` must
  // be gone from the PreviewTable markup (zero raw table tags from
  // PreviewTable). Allow only `</TableRow>` / `</TableBody>` etc.
  const rawTableMatches = workspaceSource.match(
    /<table\b|<thead\b|<tbody\b|<tr\b|<td\b|<th\b/g,
  );
  assert.equal(
    rawTableMatches,
    null,
    `raw table tags found in workspace; expected zero raw table markup after PreviewTable migration: ${JSON.stringify(
      rawTableMatches,
    )}`,
  );

  // parsedJson / candidateColumns / "Trống" preserved in PreviewTable.
  assert.match(workspaceSource, /parsedJson\.tables\.map/);
  assert.match(workspaceSource, /table\.candidateColumns\.map/);
  assert.match(workspaceSource, /Trống/);

  // Local StatusPill helper must stay removed.
  assert.doesNotMatch(
    workspaceSource,
    /function StatusPill/,
    "local StatusPill must be removed in PR #14",
  );
});

// ---------------------------------------------------------------------------
// Phase F2 — JSON / previewText <pre> blocks remain intentionally raw.
// The PreviewTable migration only touches the table-kind preview. The
// JSON `parsedJson.preview` block and the `selectedFile.previewText`
// block both render as `<pre>` and are intentionally deferred — they
// are pure text-only blocks with no table semantics, and the visual
// rhythm is already a calm light slate-50 surface. A future PR may
// replace them with a shared `<CodeBlock>` primitive, but this PR
// must NOT touch them.
// ---------------------------------------------------------------------------

test("JSON / previewText <pre> blocks remain intentionally raw (deferred)", () => {
  const preMatches = workspaceSource.match(/<pre\b/g) ?? [];
  // Two raw <pre> blocks: one for selectedFile.previewText, one for
  // parsedJson.kind === "json".preview.
  assert.ok(
    preMatches.length >= 2,
    `expected >= 2 raw <pre> blocks (previewText + JSON preview); got ${preMatches.length}`,
  );
  // They must NOT be inside PreviewTable — PreviewTable is the only
  // component being migrated in this PR.
  const previewTableSection = workspaceSource.match(
    /function PreviewTable[\s\S]*?\n\}/,
  );
  if (previewTableSection) {
    assert.equal(
      previewTableSection[0].match(/<pre\b/g),
      null,
      "PreviewTable must not contain <pre>; <pre> is intentionally outside PreviewTable",
    );
  }
});

// ---------------------------------------------------------------------------
// Phase G — No dark surface regression in the workspace
// ---------------------------------------------------------------------------

test("workspace does not introduce bg-slate-950 / bg-slate-900 / bg-black", () => {
  assert.doesNotMatch(workspaceSource, /bg-slate-950/);
  assert.doesNotMatch(workspaceSource, /bg-slate-900(?!\/)/);
  assert.doesNotMatch(workspaceSource, /bg-black(?!\/)/);
});

test("workspace does not use bg-primary as a card / page / section surface", () => {
  // bg-primary is allowed only for the dropzone "Chọn file" CTA (the one
  // correct primary action usage). It must not appear on cards / page /
  // section surfaces introduced by the migration.
  assert.doesNotMatch(
    workspaceSource,
    /<PageSection[^>]*bg-primary/,
    "PageSection card surface must not use bg-primary",
  );
  assert.doesNotMatch(
    workspaceSource,
    /className="[^"]*bg-primary[^"]*p-6[^"]*shadow-sm/,
    "card surface must not use bg-primary",
  );
});

// ---------------------------------------------------------------------------
// Phase H — Local statusLabelMap / statusTone / confidenceTone helpers were
// migrated to shared primitives in PR #14 (centralized in
// status-badge.tsx). The workspace must no longer define them locally.
// ---------------------------------------------------------------------------

test("workspace no longer defines local statusLabelMap / statusTone / confidenceTone (PR #14)", () => {
  assert.doesNotMatch(
    workspaceSource,
    /statusLabelMap:\s*Record<string, string>/,
    "statusLabelMap must be moved to status-badge.tsx in PR #14",
  );
  assert.doesNotMatch(
    workspaceSource,
    /function statusTone/,
    "statusTone must be removed in PR #14 (replaced by IMPORT_CONFIG + StatusBadge)",
  );
  assert.doesNotMatch(
    workspaceSource,
    /function confidenceTone/,
    "confidenceTone must be removed in PR #14 (replaced by Badge variants)",
  );
  // Hardcoded tone-pair helpers must also be gone from the workspace.
  assert.doesNotMatch(
    workspaceSource,
    /bg-rose-100 text-rose-700|bg-amber-100 text-amber-700|bg-emerald-100 text-emerald-700|bg-blue-100 text-blue-700|bg-slate-100 text-slate-600/,
    "hardcoded tone pairs must be removed from the workspace",
  );
});

// ---------------------------------------------------------------------------
// Phase I — Existing imports-workspace-contract guard compatibility
// ---------------------------------------------------------------------------

test("workspace source preserves the strings imports-workspace-contract pins", () => {
  // The companion guard pins the exact literals. Re-assert the load-bearing
  // ones here so a regression on a single test file is caught even if the
  // guard is moved or temporarily skipped.
  assert.match(workspaceSource, /getImportHistory\(\s*1\s*,\s*12\s*\)/);
  assert.match(workspaceSource, /payload:\s*ConfirmImportPayload\s*=\s*\{/);
  assert.match(workspaceSource, /payload\.existingCaseId\s*=/);
  assert.match(workspaceSource, /payload\.newCase\s*=/);
  assert.match(workspaceSource, /note:\s*note\.trim\(\)\s*\|\|\s*undefined/);
  assert.match(workspaceSource, /setUploading\(true\)/);
  assert.match(workspaceSource, /setConfirming\(true\)/);
  assert.match(workspaceSource, /setHistoryLoading\(true\)/);
  assert.match(workspaceSource, /useTransition/);
  // All four ImportTargetType literals still live in the workspace.
  for (const literal of ["RAW_REFERENCE", "EXISTING_CASE", "NEW_CASE", "TEMPLATE_SOURCE"]) {
    assert.ok(
      workspaceSource.includes(literal),
      `targetOptions missing literal: ${literal}`,
    );
  }
});

// ---------------------------------------------------------------------------
// Phase J — PR #14: every frozen import status render goes through the
// shared StatusBadge (type="import"); plain-text fallback labels come from
// `importStatusLabel` so no inlined label map is reintroduced.
// ---------------------------------------------------------------------------

test("workspace uses StatusBadge type=\"import\" for every frozen status render", () => {
  // 3 pill render sites: current batch header, file parse status, history
  // batch card status.
  const pillCount = (workspaceSource.match(/<StatusBadge[^>]*type="import"/g) ?? []).length;
  assert.ok(
    pillCount >= 3,
    `expected >= 3 StatusBadge type="import" call sites, got ${pillCount}`,
  );
});

test("workspace uses importStatusLabel for inline status text (no re-introduced label map)", () => {
  // 2 inline text sites: selected-file status cell + history file status.
  const labelCount = (workspaceSource.match(/importStatusLabel\(/g) ?? []).length;
  assert.ok(
    labelCount >= 2,
    `expected >= 2 importStatusLabel() call sites, got ${labelCount}`,
  );
});

test("workspace routes confidence pills through shared Badge variants", () => {
  // 2 confidence pill render sites: PreviewTable candidate columns +
  // selected-file parsedJson candidate detail.
  const badgeCount = (workspaceSource.match(/<Badge[^>]*variant=\{confidenceBadgeVariant\(/g) ?? []).length;
  assert.ok(
    badgeCount >= 2,
    `expected >= 2 Badge confidence call sites, got ${badgeCount}`,
  );
  // confidenceTone helper must not be referenced anywhere in the workspace.
  assert.doesNotMatch(
    workspaceSource,
    /confidenceTone\(/,
    "confidenceTone() call sites must be replaced with <Badge variant={...}/>",
  );
});

// ---------------------------------------------------------------------------
// Phase K — PR (next): Button / Input / Textarea / RadioGroup primitive
// imports landed in the workspace. The shared primitives now drive every
// non-decorative interactive control on /imports.
// ---------------------------------------------------------------------------

test("workspace imports the shared Button / Input / Textarea / RadioGroup primitives", () => {
  assert.match(workspaceSource, /from\s+["']@\/components\/ui\/button["']/);
  assert.match(workspaceSource, /from\s+["']@\/components\/ui\/input["']/);
  assert.match(workspaceSource, /from\s+["']@\/components\/ui\/textarea["']/);
  assert.match(workspaceSource, /from\s+["']@\/components\/ui\/radio-group["']/);
});

// ---------------------------------------------------------------------------
// Phase L — PR (next): Buttons are routed through the shared primitive.
// The expected Button call sites are: dropzone "Chọn file" CTA (Button
// asChild wrapping the label), "Tải lên" upload CTA, "Xác nhận import"
// confirm CTA, "Tải lại" history reload, per-file selection row, per-
// case-search result row, and history batch card.
// ---------------------------------------------------------------------------

test("workspace uses the shared Button primitive for the documented call sites", () => {
  const buttonCount = (workspaceSource.match(/<Button\b/g) ?? []).length;
  assert.ok(
    buttonCount >= 7,
    `expected >= 7 <Button ...> call sites; got ${buttonCount}`,
  );
  // Button asChild (Slot) is used only for the dropzone "Chọn file"
  // label-wraps-file-input pattern.
  assert.match(
    workspaceSource,
    /<Button[^>]*\basChild\b/,
    "dropzone 'Chọn file' must use <Button asChild> wrapping the label",
  );
  // Dropzone file input is still raw and wrapped by a label inside
  // the Button asChild Slot — the input's accept / multiple / onChange
  // contract is preserved verbatim (re-asserted by the contract guard).
  assert.match(workspaceSource, /<Button[\s\S]{0,80}asChild[\s\S]{0,400}<input/);
  // The literal button text "Tải lên", "Xác nhận import", and "Tải lại"
  // must still appear inside the Button primitive (the confirm button
  // label is "Đang lưu..." while confirming, but the default literal
  // text must still be present somewhere — either directly or inside
  // a conditional render expression).
  assert.match(workspaceSource, /Tải lên/);
  assert.match(workspaceSource, /Xác nhận import/);
  assert.match(workspaceSource, /Tải lại/);
  // Raw <button> must not remain in the workspace (any <button> would
  // be a regression on this PR).
  const rawButtonMatches = workspaceSource.match(/<button\b/g);
  assert.equal(
    rawButtonMatches,
    null,
    `raw <button> tags found in workspace after Button migration: ${JSON.stringify(
      rawButtonMatches,
    )}`,
  );
});

// ---------------------------------------------------------------------------
// Phase M — PR (next): Input / Textarea primitives replace the raw form
// controls. The dropzone hidden file input is the only raw <input> that
// may remain (a hidden file input has no shadcn equivalent and is
// required by the native file picker).
// ---------------------------------------------------------------------------

test("workspace uses shared Input / Textarea for the documented form controls", () => {
  // Six Inputs: existingCaseQuery, caseCode, createdDate, caseTitle,
  // relatedPersonName, offenseName.
  const inputCount = (workspaceSource.match(/<Input\b/g) ?? []).length;
  assert.ok(
    inputCount >= 6,
    `expected >= 6 <Input ...> call sites; got ${inputCount}`,
  );
  // One Textarea: note.
  const textareaCount = (workspaceSource.match(/<Textarea\b/g) ?? []).length;
  assert.ok(
    textareaCount >= 1,
    `expected >= 1 <Textarea ...> call sites; got ${textareaCount}`,
  );
  // createdDate preserves type="date" on the Input.
  assert.match(
    workspaceSource,
    /<Input[^>]*type="date"[^>]*value=\{newCaseForm\.createdDate\}/,
    "createdDate Input must preserve type=\"date\"",
  );
  // Raw <textarea> must be gone (the notes textarea was migrated).
  const rawTextareaMatches = workspaceSource.match(/<textarea\b/g);
  assert.equal(
    rawTextareaMatches,
    null,
    `raw <textarea> tags found in workspace after Textarea migration: ${JSON.stringify(
      rawTextareaMatches,
    )}`,
  );
  // Raw visible <input> elements must be gone — the only raw <input>
  // that may remain is the hidden dropzone file input. We verify
  // accept/multiple/onChange are still pinned by the contract guard;
  // here we just assert no stray visible raw inputs exist.
  const rawInputMatches =
    workspaceSource.match(/<input\b[^>]*type="text"/g) ?? [];
  assert.equal(
    rawInputMatches.length,
    0,
    `raw <input type="text"> found in workspace after Input migration: ${JSON.stringify(
      rawInputMatches,
    )}`,
  );
});

// ---------------------------------------------------------------------------
// Phase N — PR (next): RadioGroup primitive replaces the raw radio input
// set. The four ImportTargetType literals (RAW_REFERENCE, EXISTING_CASE,
// NEW_CASE, NEW_CASE_TEMPLATE_SOURCE) are preserved verbatim as the
// RadioGroupItem values; the group's `name` attribute is preserved.
// ---------------------------------------------------------------------------

test("workspace uses shared RadioGroup primitive for the target chooser", () => {
  // The shadcn RadioGroup primitive does not natively forward a `name`
  // attribute to native form input semantics. The PR (next) controls
  // migration therefore preserves the four literal values through the
  // `value` prop on each RadioGroupItem, and the group's selected state
  // is bound through `onValueChange` → `setTargetType(value as ImportTargetType)`.
  // The contract test pins the same four literals, so this guard
  // focuses on the primitive structure rather than the native `name`.
  assert.match(
    workspaceSource,
    /<RadioGroup[\s\S]{0,400}onValueChange=\{\(value\) => setTargetType\(value as ImportTargetType\)\}/,
  );
  // RadioGroupItem is rendered once per option via .map() — exactly one
  // <RadioGroupItem ...> JSX tag exists in source, but each option
  // receives the four literal values via `value={option.value}`.
  const itemCount = (workspaceSource.match(/<RadioGroupItem\b/g) ?? []).length;
  assert.ok(
    itemCount >= 1,
    `expected >= 1 <RadioGroupItem ...> JSX tag; got ${itemCount}`,
  );
  // All four literal values are still passed to RadioGroupItem.value.
  for (const literal of [
    "RAW_REFERENCE",
    "EXISTING_CASE",
    "NEW_CASE",
    "TEMPLATE_SOURCE",
  ]) {
    assert.ok(
      workspaceSource.includes(literal),
      `targetOptions must include ${literal}`,
    );
  }
  assert.match(
    workspaceSource,
    /<RadioGroupItem[^>]*value=\{option\.value\}/,
    "RadioGroupItem must accept option.value as its value prop",
  );
  // The raw <input type="radio" name="targetType"> is gone.
  const rawRadioMatches = workspaceSource.match(
    /<input\b[^>]*type="radio"[^>]*name="targetType"/g,
  );
  assert.equal(
    rawRadioMatches,
    null,
    `raw targetType radio input found in workspace after RadioGroup migration: ${JSON.stringify(
      rawRadioMatches,
    )}`,
  );
});

// ---------------------------------------------------------------------------
// Phase O — PR (next): Upload icon migrated to Lucide UploadCloud. The
// raw hand-rolled <svg> in the dropzone is replaced with the shared
// lucide-react icon (already used elsewhere in the web app).
// ---------------------------------------------------------------------------

test("workspace uses Lucide UploadCloud for the dropzone upload icon", () => {
  assert.match(
    workspaceSource,
    /from\s+["']lucide-react["']/,
    "workspace must import from lucide-react",
  );
  assert.match(
    workspaceSource,
    /<UploadCloud\b/,
    "dropzone upload icon must be the Lucide UploadCloud component",
  );
  // The raw hand-rolled <svg> is gone.
  const rawSvgMatches = workspaceSource.match(/<svg\b/g);
  assert.equal(
    rawSvgMatches,
    null,
    `raw <svg> tags found in workspace after Lucide migration: ${JSON.stringify(
      rawSvgMatches,
    )}`,
  );
});

// ---------------------------------------------------------------------------
// Phase P — Hidden file input still raw (intentional, cannot be migrated).
// The dropzone <input type="file"> is the ONLY raw <input> that may
// remain because the native file picker requires a real file input
// element with the literal `accept` attribute preserved verbatim.
// ---------------------------------------------------------------------------

test("hidden dropzone file input is the only raw input (intentional)", () => {
  // There must be exactly one <input> tag in the workspace — the file
  // input inside the dropzone label. Any additional raw <input> would
  // be a regression on the Input migration above.
  const rawInputTags = workspaceSource.match(/<input\b/g) ?? [];
  assert.equal(
    rawInputTags.length,
    1,
    `expected exactly 1 raw <input> tag (the hidden file input); got ${rawInputTags.length}`,
  );
  // It must carry the exact accept attribute and onChange handler.
  assert.match(
    workspaceSource,
    /<input[^>]*type="file"[^>]*accept="\.pdf,\.docx,\.doc,\.xlsx,\.xls,\.csv,\.txt,\.json,\.png,\.jpg,\.jpeg,\.webp,\.tif,\.tiff"/,
  );
  assert.match(
    workspaceSource,
    /onChange=\{\(event\) => handleChosenFiles\(event\.target\.files\)\}/,
  );
});

// ---------------------------------------------------------------------------
// Phase Q — Behavior-freeze re-assertions: the PR (next) imports controls
// migration MUST NOT change upload XHR, drag/drop, file picker, payload,
// parsing, history load, confirm, parsedJson / PreviewTable, or
// StatusBadge / import mapping. Re-assert the load-bearing strings.
// ---------------------------------------------------------------------------

test("upload XHR + drag/drop + payload + history load remain frozen", () => {
  // uploadImportFiles + XHR progress pinned via the workspace's
  // continued reference to the helper and the unchanged drag/drop
  // handlers.
  assert.match(workspaceSource, /uploadImportFiles/);
  assert.match(workspaceSource, /confirmImportBatch/);
  assert.match(workspaceSource, /getImportBatch/);
  assert.match(workspaceSource, /getImportFileDownloadUrl/);
  assert.match(workspaceSource, /getImportHistory\(\s*1\s*,\s*12\s*\)/);
  assert.match(workspaceSource, /searchCases\(\s*keyword\s*\)/);
  // Drag/drop handlers preserved.
  assert.match(
    workspaceSource,
    /onDragOver=\{[^}]*event\.preventDefault\(\)/,
  );
  assert.match(workspaceSource, /onDragLeave=\{[^}]*setDragging\(false\)/);
  assert.match(
    workspaceSource,
    /onDrop=\{[^}]*handleChosenFiles\(event\.dataTransfer\.files\)/,
  );
  // Confirm payload keys preserved.
  assert.match(workspaceSource, /payload:\s*ConfirmImportPayload\s*=\s*\{/);
  assert.match(workspaceSource, /targetType,/);
  assert.match(workspaceSource, /payload\.existingCaseId\s*=/);
  assert.match(workspaceSource, /payload\.newCase\s*=/);
  assert.match(workspaceSource, /note:\s*note\.trim\(\)\s*\|\|\s*undefined/);
  // selectedFiles slicing preserved.
  assert.match(
    workspaceSource,
    /setSelectedFiles\(Array\.from\(fileList\)\.slice\(0,\s*20\)\)/,
  );
  // useTransition for history load preserved.
  assert.match(
    workspaceSource,
    /startHistoryTransition\(\(\) => \{\s*void\s+loadHistory\(\)/,
  );
  // StatusBadge routing preserved.
  assert.match(
    workspaceSource,
    /<StatusBadge[^>]*type="import"\s+value=\{currentBatch\.status\}/,
  );
  assert.match(
    workspaceSource,
    /<StatusBadge[^>]*type="import"\s+value=\{file\.parseStatus\}/,
  );
  assert.match(
    workspaceSource,
    /<StatusBadge[^>]*type="import"\s+value=\{item\.status\}/,
  );
});