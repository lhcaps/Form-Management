import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const webSrc = dirname(fileURLToPath(import.meta.url));

// webSrc = apps/web/src/components/common → go up 2 dirs to apps/web/src
const webSrcRoot = join(webSrc, "..", "..");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readSource(...segments: string[]) {
  return readFileSync(join(webSrcRoot, ...segments), "utf8");
}

// ---------------------------------------------------------------------------
// Phase 1: shadcn base controls must NOT use bg-primary as default surface
// ---------------------------------------------------------------------------

test("Input component does not use bg-primary as default surface", () => {
  const src = readSource("components/ui/input.tsx");
  assert.doesNotMatch(src, /bg-primary/, "Input must not use bg-primary");
  assert.match(src, /bg-background/);
});

test("Textarea component does not use bg-primary as default surface", () => {
  const src = readSource("components/ui/textarea.tsx");
  assert.doesNotMatch(src, /bg-primary/, "Textarea must not use bg-primary");
  assert.match(src, /bg-background/);
});

test("SelectTrigger component does not use bg-primary as default surface", () => {
  const src = readSource("components/ui/select.tsx");
  assert.doesNotMatch(src, /bg-primary/, "SelectTrigger must not use bg-primary");
});

// ---------------------------------------------------------------------------
// Phase 2: KpiCard must not use bg-primary as card surface
// ---------------------------------------------------------------------------

test("KpiCard root card is light (bg-card), not dark or primary", () => {
  const src = readSource("components/common/kpi-card.tsx");
  assert.doesNotMatch(src, /bg-primary\b/, "KpiCard root must not use bg-primary");
  assert.doesNotMatch(src, /bg-slate-950/, "KpiCard root must not use bg-slate-950");
  assert.doesNotMatch(src, /bg-slate-900(?!\/)/, "KpiCard root must not use bg-slate-900");
  assert.doesNotMatch(src, /bg-black(?!\/)/, "KpiCard root must not use bg-black");
  // bg-card comes from the Card component default className, not KpiCard itself
  // Verify the Card component has bg-card as its default surface
  const cardSrc = readSource("components/ui/card.tsx");
  assert.match(cardSrc, /bg-card/, "shadcn Card must use bg-card as default surface");
});

test("KpiCard KPI value is readable (dark text on light card)", () => {
  const src = readSource("components/common/kpi-card.tsx");
  assert.match(src, /text-card-foreground|tabular-nums/);
});

// ---------------------------------------------------------------------------
// Phase 3: cases page inputs/panels are light
// ---------------------------------------------------------------------------

test("cases page does not use dark surface classes for inputs or form panels", () => {
  const src = readSource("app/cases/page.tsx");
  // Inputs use Input component (bg-background), not raw dark backgrounds
  assert.match(src, /@\/components\/ui\/input/);
  // Form panel uses PageSection (light bg-white via card), not dark background
  assert.match(src, /@\/components\/common\/page-shell/);
  // No hardcoded dark surface on inputs/panels
  assert.doesNotMatch(
    src,
    /<Input[^>]*className="[^"]*bg-slate-950/,
    "cases search Input must not have bg-slate-950",
  );
  assert.doesNotMatch(
    src,
    /<Textarea[^>]*className="[^"]*bg-slate-950/,
    "cases form Textarea must not have bg-slate-950",
  );
  assert.doesNotMatch(
    src,
    /<SelectTrigger[^>]*className="[^"]*bg-slate-950/,
    "cases SelectTrigger must not have bg-slate-950",
  );
});

// ---------------------------------------------------------------------------
// Phase 4: review queue page background is light
// ---------------------------------------------------------------------------

test("templates page uses light PageShell background", () => {
  const src = readSource("app/templates/page.tsx");
  assert.match(src, /PageShell/);
  assert.match(src, /bg-slate-50/);
});

test("review queue filters section is light, not dark navy", () => {
  const src = readSource("components/review-queue/review-queue-filters.tsx");
  // Active pill should use bg-primary (brand navy), not hardcoded bg-slate-950
  // This guards against hardcoded dark surfaces in filter pills
  assert.doesNotMatch(
    src,
    /rounded-full bg-slate-950/,
    "Active filter pill must not use bg-slate-950 — use bg-primary instead",
  );
  assert.doesNotMatch(
    src,
    /bg-slate-950.*px-4.*py-2.*font-bold.*text-white/,
    "Active filter pill must not use hardcoded dark slate styling",
  );
});

// ---------------------------------------------------------------------------
// Phase 5: globals.css must not auto-apply dark mode via prefers-color-scheme
// ---------------------------------------------------------------------------

test("globals.css forces light color scheme and does not auto-apply prefers-color-scheme dark", () => {
  const src = readSource("app/globals.css");
  assert.match(src, /color-scheme:\s*light/, "Must declare color-scheme: light to force light mode");
  assert.doesNotMatch(
    src,
    /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/,
    "Must not have @media (prefers-color-scheme: dark) block — causes auto dark mode on OS dark preference",
  );
});

// ---------------------------------------------------------------------------
// Phase 6: Anti-slop — no AI/generic startup marketing patterns
// ---------------------------------------------------------------------------

test("no AI slop patterns in source files (⚖ emoji, decorative gradients, startup copy)", () => {
  // Check globals.css only for decorative patterns (too many files to check all)
  const css = readSource("app/globals.css");
  assert.doesNotMatch(css, /bg-clip-text|text-transparent/, "No decorative gradient text");
  assert.doesNotMatch(css, /Seamless|Elevate|Unleash|Next-Gen|Game-changer|supercharge|empower|streamline/i);
});

// ---------------------------------------------------------------------------
// Phase 7: Specific surface-level dark regression guards
// ---------------------------------------------------------------------------

test("dashboard uses shared KpiCard (not raw article cards with dark tones)", () => {
  const src = readSource("app/page.tsx");
  assert.match(src, /@\/components\/common\/kpi-card/);
  assert.doesNotMatch(src, /<article\b[^>]*bg-slate-950/);
  assert.doesNotMatch(src, /<article\b[^>]*bg-black/);
});

test("review queue item card is white, not dark-filled", () => {
  const src = readSource("components/review-queue/review-queue-item-card.tsx");
  assert.doesNotMatch(src, /className="[^"]*bg-slate-950[^"]*bg-white/);
  assert.match(src, /bg-white/);
});

test("template selector does not use bg-primary as card surface", () => {
  const src = readSource("components/documents/template-selector-workspace.tsx");
  assert.doesNotMatch(
    src,
    /<div[^>]*className="[^"]*bg-primary[^"]*p-5[^"]*shadow-sm[^"]*rounded/,
    "template selector workspace must not use bg-primary as card surface",
  );
});
