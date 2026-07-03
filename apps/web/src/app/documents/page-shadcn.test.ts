import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Source guard for the `/documents` template chooser (TemplateSelectorWorkspace).
// The chooser is the page mounted by `apps/web/src/app/documents/page.tsx`; its
// source lives in `apps/web/src/components/documents/template-selector-workspace.tsx`.
// We assert there are no native browser `<select>` / `<option>` controls left
// in that chooser, that shadcn Select primitives are in use, and that the
// Vietnamese labels + sentinel values + open-template routing strings are
// preserved.

const chooserSource = readFileSync(
  join(here, "..", "..", "components", "documents", "template-selector-workspace.tsx"),
  "utf8",
);

// ---------------------------------------------------------------------------
// Phase A — no native select / option remains
// ---------------------------------------------------------------------------

test("/documents template chooser source contains no native <select> or <option>", () => {
  assert.doesNotMatch(
    chooserSource,
    /<select\b/,
    "template chooser must not use a native <select> element",
  );
  assert.doesNotMatch(
    chooserSource,
    /<\/select>/,
    "template chooser must not close a native <select> element",
  );
  assert.doesNotMatch(
    chooserSource,
    /<option\b/,
    "template chooser must not use a native <option> element",
  );
});

// ---------------------------------------------------------------------------
// Phase B — shadcn Select primitives are used
// ---------------------------------------------------------------------------

test("/documents template chooser imports the shadcn Select primitives", () => {
  assert.match(chooserSource, /from\s+"@\/components\/ui\/select"/);
  assert.match(chooserSource, /\bSelect\b/);
  assert.match(chooserSource, /SelectTrigger/);
  assert.match(chooserSource, /SelectContent/);
  assert.match(chooserSource, /SelectItem/);
  assert.match(chooserSource, /SelectValue/);
});

// ---------------------------------------------------------------------------
// Phase C — Vietnamese labels for the migrated controls are preserved
// ---------------------------------------------------------------------------

test("/documents template chooser preserves the 'Nhu cầu nghiệp vụ' label", () => {
  assert.match(chooserSource, /Nhu cầu nghiệp vụ/);
  assert.match(chooserSource, /Tất cả nhu cầu/);
});

test("/documents template chooser preserves the 'Giai đoạn biểu mẫu' label", () => {
  assert.match(chooserSource, /Giai đoạn biểu mẫu/);
  assert.match(chooserSource, /Tất cả giai đoạn/);
});

// ---------------------------------------------------------------------------
// Phase D — sentinel values exist and are wired in
// ---------------------------------------------------------------------------

test("/documents template chooser uses sentinel values for the 'all' state", () => {
  // Two distinct sentinels (one per control) keep the two SelectItem sets
  // unambiguous even if a future PR adds more empty-value meanings.
  assert.match(chooserSource, /__all_needs__/);
  assert.match(chooserSource, /__all_stages__/);
});

// ---------------------------------------------------------------------------
// Phase E — no dark surfaces on the migrated triggers
// ---------------------------------------------------------------------------

test("/documents template chooser SelectTriggers stay light (no bg-slate-950/black/zinc-950)", () => {
  // The SelectTrigger className passes through to the trigger button. Pull
  // every SelectTrigger opening and assert none of them use a dark fill.
  const triggerRe = /<SelectTrigger\b[^>]*>/g;
  const triggers = chooserSource.match(triggerRe) ?? [];
  assert.ok(triggers.length >= 2, "expected at least two SelectTriggers");
  for (const trigger of triggers) {
    assert.doesNotMatch(
      trigger,
      /bg-slate-950|bg-black|bg-zinc-950|bg-slate-900(?!\/)|bg-primary\b/,
      `SelectTrigger must use a light surface: ${trigger}`,
    );
  }
});

// ---------------------------------------------------------------------------
// Phase F — open-template routing strings unchanged
// ---------------------------------------------------------------------------

test("/documents template chooser preserves open-template / open-with-case routing", () => {
  // router.push target for opened template stays the same shape.
  assert.match(chooserSource, /router\.push\(`\/documents\/\$\{generatedDocument\.id\}`\)/);
  // Open-template helper still routes through the shared target helper.
  assert.match(chooserSource, /getPrimaryTemplateOpenTarget/);
  // Open-with-case still uses createDocumentBatch + the case picker.
  assert.match(chooserSource, /createDocumentBatch/);
  assert.match(chooserSource, /openCasePickerForTemplate/);
});

// ---------------------------------------------------------------------------
// Phase G — search / recommendation / filter logic preserved
// ---------------------------------------------------------------------------

test("/documents template chooser preserves search + recommendation wiring", () => {
  assert.match(chooserSource, /getTemplateRecommendationRule/);
  assert.match(chooserSource, /evaluateRecommendationRule/);
  assert.match(chooserSource, /NEED_OPTIONS/);
  assert.match(chooserSource, /vksTemplateStages/);
  // The state object that drives both filters is unchanged.
  assert.match(chooserSource, /processNeed: ""/);
  assert.match(chooserSource, /stageId: ""/);
});

// ---------------------------------------------------------------------------
// Phase H — no dark CTA / saturated hardcoded action classes remain
// ---------------------------------------------------------------------------

test("/documents template chooser has no bg-slate-950 anywhere", () => {
  // After the reload-CTA polish, the chooser must not lean on the hardcoded
  // dark navy fill that the global Button tone contract supersedes.
  assert.doesNotMatch(
    chooserSource,
    /bg-slate-950/,
    "template chooser must not use bg-slate-950",
  );
});

test("/documents template chooser has no hardcoded text-white action class", () => {
  // text-white is reserved for the shared Button default variant; the
  // chooser must reach it through the Button primitive, not by typing the
  // class on a raw element. Allow occurrences inside JS strings/comments
  // (none today, but be defensive for future copy).
  assert.doesNotMatch(
    chooserSource,
    /\btext-white\b/,
    "template chooser must not hardcode text-white on action surfaces",
  );
});

test("/documents template chooser action buttons do not use font-black / font-extrabold", () => {
  // The shared Button variant uses font-semibold by design — no element
  // typed as an action button may opt back into the heavy-weight title look.
  // Headings and badges already use font-black by visual-design contract
  // and are intentionally out of scope; only enforce against Button
  // elements.
  const buttonRe = /<Button\b[^>]*>/g;
  const buttonTags = chooserSource.match(buttonRe) ?? [];
  assert.ok(buttonTags.length > 0, "expected at least one <Button> tag");
  for (const tag of buttonTags) {
    assert.doesNotMatch(
      tag,
      /font-black|font-extrabold/,
      `Button must not opt into heavy weights: ${tag}`,
    );
  }
});

test("/documents template chooser reload CTA label is preserved", () => {
  // The reload CTA still says "Tải lại dữ liệu" with the loading label
  // "Đang tải..." — this guards against accidental label drift.
  assert.match(chooserSource, /Tải lại dữ liệu/);
  assert.match(chooserSource, /Đang tải\.\.\./);
});

test("/documents template chooser template-card action labels are preserved", () => {
  assert.match(chooserSource, /Mở biểu mẫu/);
  assert.match(chooserSource, /Đang mở\.\.\./);
  assert.match(chooserSource, /Mở với hồ sơ/);
});

// ---------------------------------------------------------------------------
// Phase I — open-template routing strings unchanged
// ---------------------------------------------------------------------------

test("/documents template chooser preserves open-template / open-with-case routing (post-polish)", () => {
  // Same routing invariants as Phase F, restated under Phase I as the
  // button-polish hotfix re-touch point, so future regressions show up
  // adjacent to the action-button test block.
  assert.match(chooserSource, /router\.push\(`\/documents\/\$\{generatedDocument\.id\}`\)/);
  assert.match(chooserSource, /getPrimaryTemplateOpenTarget/);
  assert.match(chooserSource, /createDocumentBatch/);
  assert.match(chooserSource, /openCasePickerForTemplate/);
});

// ---------------------------------------------------------------------------
// Phase J — shared Button primitive is used for the polished actions
// ---------------------------------------------------------------------------

test("/documents template chooser imports the shared Button primitive", () => {
  assert.match(chooserSource, /from\s+"@\/components\/ui\/button"/);
  assert.match(chooserSource, /\bButton\b/);
});

test("/documents template chooser uses Button for template-card open actions", () => {
  // 'Mở biểu mẫu' sits inside a <Button>, 'Mở với hồ sơ' sits inside a
  // <Button variant="outline">. Search for the label near a <Button tag.
  assert.match(chooserSource, /<Button[\s\S]{0,400}Mở biểu mẫu/);
  assert.match(
    chooserSource,
    /<Button[\s\S]{0,400}variant="outline"[\s\S]{0,400}Mở với hồ sơ/,
  );
});

test("/documents template chooser reload CTA is an outline Button", () => {
  // The "Tải lại dữ liệu" reload CTA now lives on a Button variant="outline"
  // rather than a hardcoded dark fill. Allow the variant to appear above or
  // below onClick.
  assert.match(
    chooserSource,
    /<Button[\s\S]{0,400}variant="outline"[\s\S]{0,400}Tải lại dữ liệu[\s\S]{0,200}<\/Button>/,
  );
});

test("/documents template chooser no longer renders the raw dark reload button", () => {
  // Guard against accidental regression: there must be no raw <button
  // loading the reload label with bg-slate-950.
  assert.doesNotMatch(
    chooserSource,
    /<button[\s\S]{0,400}bg-slate-950[\s\S]{0,400}Tải lại dữ liệu/,
    "reload CTA must not be a raw bg-slate-950 button",
  );
});