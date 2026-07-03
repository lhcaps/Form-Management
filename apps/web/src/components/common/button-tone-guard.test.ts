import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const webSrcRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function readSource(...segments: string[]) {
  return readFileSync(join(webSrcRoot, ...segments), "utf8");
}

// ---------------------------------------------------------------------------
// Phase: global button tone hotfix — guard the shared Button primitive.
// ---------------------------------------------------------------------------

/**
 * Strip JS/TS comments from a source string so assertions don't trip on
 * docstrings or prose that mention forbidden classes by name. We keep
 * string literals (unlike a generic stripper) so that cva(...) variant
 * definitions remain inspectable.
 */
function stripComments(source: string): string {
  return source
    // Block comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Line comments
    .replace(/^\s*\/\/.*$/gm, "");
}

test("Button primitive does not contain font-black on its base or variants", () => {
  const src = stripComments(readSource("components/ui/button.tsx"));
  assert.doesNotMatch(src, /font-black/, "Button must not use font-black");
});

test("Button primitive is not gradient-styled", () => {
  const src = stripComments(readSource("components/ui/button.tsx"));
  // No `bg-gradient-to-*`, no `from-*`, no `to-*` Tailwind utilities,
  // and no `linear-gradient(` / `radial-gradient(` in CSS-ish values.
  assert.doesNotMatch(src, /bg-gradient-to-/, "Button must not use gradient utilities");
  assert.doesNotMatch(src, /linear-gradient\(/, "Button must not use linear-gradient");
  assert.doesNotMatch(src, /radial-gradient\(/, "Button must not use radial-gradient");
});

test("Button primitive default variant is the only primary filled navy", () => {
  const src = readSource("components/ui/button.tsx");
  // The primitive's default variant must remain `bg-primary text-primary-foreground`
  // — this is the single dominant action surface, allowed by the spec.
  assert.match(src, /default:\s*\n\s*"bg-primary\s+text-primary-foreground/);
});

test("Button primitive destructive variant is subtle outlined rose, not saturated red", () => {
  const src = readSource("components/ui/button.tsx");
  // Subtle destructive: border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100.
  assert.match(
    src,
    /destructive:\s*\n\s*"border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100/,
  );
  // Forbidden saturated fills inside the primitive.
  const stripped = stripComments(src);
  assert.doesNotMatch(stripped, /destructive:\s*\n\s*"bg-destructive/, "destructive must not use bg-destructive (saturated red)");
  assert.doesNotMatch(stripped, /bg-rose-(500|600|700|800|900)/, "destructive must not use bg-rose-500..900 (saturated rose)");
  assert.doesNotMatch(stripped, /bg-red-(500|600|700|800|900)/, "destructive must not use bg-red-500..900 (saturated red)");
});

test("Button primitive success variant is subtle outlined emerald, not bright green", () => {
  const src = readSource("components/ui/button.tsx");
  // Subtle success: border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100.
  assert.match(
    src,
    /success:\s*\n\s*"border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/,
  );
  // Forbidden saturated fills inside the primitive.
  const stripped = stripComments(src);
  assert.doesNotMatch(stripped, /success:\s*\n\s*"bg-success/, "success must not use bg-success (saturated green)");
  assert.doesNotMatch(stripped, /bg-emerald-(500|600|700|800)/, "success must not use bg-emerald-500..800");
  assert.doesNotMatch(stripped, /bg-green-(500|600|700|800)/, "success must not use bg-green-500..800");
});

test("Button primitive warning variant is subtle outlined amber, not bright orange", () => {
  const src = readSource("components/ui/button.tsx");
  // Subtle warning: border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100.
  assert.match(
    src,
    /warning:\s*\n\s*"border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/,
  );
  // Forbidden saturated fills inside the primitive.
  const stripped = stripComments(src);
  assert.doesNotMatch(stripped, /warning:\s*\n\s*"bg-warning/, "warning must not use bg-warning (saturated orange)");
  assert.doesNotMatch(stripped, /bg-amber-(500|600|700|800)/, "warning must not use bg-amber-500..800");
  assert.doesNotMatch(stripped, /bg-orange-(500|600|700|800)/, "warning must not use bg-orange-500..800");
});

test("Button primitive non-default variants remove saturated `shadow` elevation", () => {
  const src = readSource("components/ui/button.tsx");
  // We allow `shadow-sm` only on the default (primary navy) variant.
  // Other variants should not carry decorative shadows so they remain
  // visually quiet and do not compete with primary.
  const defaultLine = /default:\s*\n\s*"([^"]+)"/.exec(src)?.[1] ?? "";
  for (const variant of ["secondary", "outline", "destructive", "success", "warning"]) {
    const variantLine =
      new RegExp(`${variant}:\\s*\\n\\s*"([^"]+)"`).exec(src)?.[1] ?? "";
    assert.ok(variantLine, `Button variant ${variant} must exist`);
    assert.doesNotMatch(
      variantLine,
      /\bshadow\b/,
      `Button variant ${variant} must not include decorative shadow (only default may)`,
    );
    assert.doesNotMatch(
      variantLine,
      /\bshadow-sm\b/,
      `Button variant ${variant} must not include shadow-sm`,
    );
  }
  // Default may carry a shadow-sm for the navy primary elevation.
  assert.ok(
    /\bshadow-sm\b/.test(defaultLine),
    "Button default variant must keep shadow-sm for navy primary elevation",
  );
});

test("Button primitive outline variant does not use accent fill on hover", () => {
  const src = readSource("components/ui/button.tsx");
  // The previous outline hover used `hover:bg-accent hover:text-accent-foreground`
  // — that introduces an undesirable accent fill. The new outline must
  // use `hover:bg-slate-50 hover:text-slate-900`.
  assert.doesNotMatch(
    src,
    /outline:\s*\n\s*"[^"]*hover:bg-accent/,
    "outline variant must not use hover:bg-accent (use hover:bg-slate-50)",
  );
  assert.match(
    src,
    /outline:\s*\n\s*"border border-input bg-background hover:bg-slate-50 hover:text-slate-900/,
  );
});

// ---------------------------------------------------------------------------
// Cross-cutting: review queue and reports pages must not bypass the
// Button primitive with raw saturated class strings.
// ---------------------------------------------------------------------------

test("review queue actions use the shared Button variant API, not raw saturated classes", () => {
  const stripped = stripComments(
    readSource("components/review-queue/review-queue-item-card.tsx"),
  );
  // Phê duyệt / Yêu cầu sửa / Hủy must use `<Button variant="success|warning|destructive">`
  // — never raw `bg-green-500`, `bg-orange-500`, `bg-red-500`, etc.
  const forbiddenRawSaturated = [
    /bg-green-[0-9]+/,
    /bg-emerald-[0-9]+/,
    /bg-orange-[0-9]+/,
    /bg-amber-[0-9]+/,
    /bg-red-[0-9]+/,
    /bg-rose-[0-9]+/,
  ];
  for (const pattern of forbiddenRawSaturated) {
    assert.doesNotMatch(
      stripped,
      pattern,
      `review queue card must not use raw ${pattern.source} on action buttons`,
    );
  }
});

test("review queue primary 'Mở xử lý' is rendered through the shared Button component", () => {
  const src = readSource("components/review-queue/review-queue-item-card.tsx");
  // Mở xử lý is the dominant local action — it should be the only
  // primary surface in the card, and it should ride on the Button
  // primitive, not on a raw `<a className="... bg-blue-700 ...">`.
  assert.match(src, /<Button[\s\S]*?Mở xử lý/);
  assert.doesNotMatch(src, /<a[^>]*bg-blue-[0-9]+/);
});

test("reports action row uses the shared Button component", () => {
  const stripped = stripComments(readSource("app/reports/page.tsx"));
  // Tải lại / Xuất CSV / In / PDF must use Button variant=outline|success|outline
  // — never raw `bg-green-500` / `bg-emerald-500` / `bg-orange-500` saturated fills.
  const forbiddenRawSaturated = [
    /bg-green-[0-9]+/,
    /bg-emerald-[0-9]+/,
    /bg-orange-[0-9]+/,
    /bg-amber-[0-9]+/,
    /bg-red-[0-9]+/,
    /bg-rose-[0-9]+/,
  ];
  for (const pattern of forbiddenRawSaturated) {
    assert.doesNotMatch(
      stripped,
      pattern,
      `reports page must not use raw ${pattern.source} on action buttons`,
    );
  }
});

test("standalone template preview uses Button for the long-label action row", () => {
  const src = readSource(
    "components/documents/template-preview-workspace.tsx",
  );
  // The cramped long-label button (Điền nhanh thông tin chung) must be
  // rendered through the Button primitive so it inherits the wrapping
  // and tone contract — not as a raw `<button ... bg-blue-600 ...>`.
  assert.match(src, /<Button[\s\S]*?Điền nhanh thông tin chung/);
  // Specifically, the old raw button styling must be gone.
  assert.doesNotMatch(
    src,
    /<button[^>]*bg-blue-600[^>]*Điền nhanh thông tin chung/,
    "the long-label prefill button must be migrated to <Button>",
  );
});

test("standalone template preview long-label button has reasonable min-width and wrap support", () => {
  const src = readSource(
    "components/documents/template-preview-workspace.tsx",
  );
  // "Điền nhanh thông tin chung" is a long Vietnamese label — the
  // wrapper className should give it room to breathe and wrap.
  assert.match(
    src,
    /<Button[\s\S]*?className="min-w-\[14rem\][^"]*"[\s\S]*?Điền nhanh thông tin chung/,
  );
  // The action row wrapper must support flex-wrap so labels do not get
  // squeezed at narrow widths.
  assert.match(
    src,
    /sm:flex-row sm:flex-wrap[^"]*"[\s\S]*?Điền nhanh thông tin chung/,
  );
});
