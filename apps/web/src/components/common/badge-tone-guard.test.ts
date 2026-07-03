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
// Phase: global badge tone hotfix — guard the shared Badge primitive.
// ---------------------------------------------------------------------------

/**
 * Strip JS/TS comments and string-literal content from a source string so
 * assertions don't trip on docstrings or prose that mention forbidden
 * classes by name.
 */
function stripCommentsAndStrings(source: string): string {
  return source
    // Block comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Line comments
    .replace(/^\s*\/\/.*$/gm, "")
    // Double-quoted strings (greedy across one line)
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    // Single-quoted strings (greedy across one line)
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    // Backtick strings
    .replace(/`(?:\\.|[^`\\])*`/g, "``");
}

test("Badge primitive does not contain font-black on its base or variants", () => {
  const src = stripCommentsAndStrings(
    readSource("components/ui/badge.tsx"),
  );
  assert.doesNotMatch(src, /font-black/, "Badge must not use font-black");
});

test("Badge primitive base does not use chunky rounded-full", () => {
  const src = readSource("components/ui/badge.tsx");
  // The base cva string (the first arg to `cva(`) must not include
  // `rounded-full` — passive badges must be `rounded-md`.
  const baseMatch = /cva\(\s*"([^"]+)"/.exec(src);
  assert.ok(baseMatch, "Badge base cva string must be present");
  const base = baseMatch[1];
  assert.doesNotMatch(
    base,
    /rounded-full/,
    "Badge base must not default to rounded-full",
  );
});

test("Badge primitive passive variants do not contain text-white", () => {
  const src = stripCommentsAndStrings(
    readSource("components/ui/badge.tsx"),
  );
  // Pass through the variants object — every variant must avoid
  // `text-white` so passive status does not look like an action chip.
  assert.doesNotMatch(src, /text-white/, "Badge variants must not use text-white");
});

test("Badge primitive does not use saturated 500-level passive backgrounds", () => {
  const src = stripCommentsAndStrings(
    readSource("components/ui/badge.tsx"),
  );
  const forbiddenSaturated = [
    "bg-emerald-500",
    "bg-emerald-600",
    "bg-green-500",
    "bg-green-600",
    "bg-amber-500",
    "bg-amber-600",
    "bg-orange-500",
    "bg-rose-500",
    "bg-rose-600",
    "bg-blue-500",
    "bg-blue-600",
    "bg-blue-700",
    "bg-blue-900",
    "bg-slate-950",
    "bg-zinc-950",
    "bg-black",
  ];
  for (const cls of forbiddenSaturated) {
    assert.doesNotMatch(
      src,
      new RegExp(cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `Badge primitive must not use ${cls}`,
    );
  }
});

test("Badge primitive does not use bg-primary text-primary-foreground on passive variants", () => {
  const src = stripCommentsAndStrings(
    readSource("components/ui/badge.tsx"),
  );
  // `bg-primary text-primary-foreground` is reserved for primary
  // actions, active nav, and brand accents — it must not be the
  // default badge surface.
  assert.doesNotMatch(
    src,
    /bg-primary\s+text-primary-foreground/,
    "Badge must not use bg-primary text-primary-foreground on passive variants",
  );
});

test("Badge primitive passive color variants use light-tint backgrounds with borders", () => {
  const src = readSource("components/ui/badge.tsx");
  // Each of success / warning / destructive / blue / violet must use
  // a 50-level background with a 200-level border and a 700-level
  // text — the legal/admin quiet-tint palette.
  assert.match(src, /border-emerald-200\s+bg-emerald-50\s+text-emerald-700/);
  assert.match(src, /border-amber-200\s+bg-amber-50\s+text-amber-700/);
  assert.match(src, /border-rose-200\s+bg-rose-50\s+text-rose-700/);
  assert.match(src, /border-blue-200\s+bg-blue-50\s+text-blue-700/);
  assert.match(src, /border-violet-200\s+bg-violet-50\s+text-violet-700/);
});

test("StatusBadge does not use bg-primary text-primary-foreground on passive variants", () => {
  const src = stripCommentsAndStrings(
    readSource("components/common/status-badge.tsx"),
  );
  // Status values are passive statuses; they must never use
  // bg-primary text-primary-foreground (reserved for primary actions).
  assert.doesNotMatch(
    src,
    /variant:\s*"default"/,
    "StatusBadge must not map any status to variant=\"default\" (bg-primary text-primary-foreground)",
  );
});

// ---------------------------------------------------------------------------
// Cross-cutting: review queue card and settings Badge do not introduce
// passive text-white / saturated fills / font-black on badge wrappers.
// ---------------------------------------------------------------------------

test("review queue card tone: no font-black passive chip classes", () => {
  const src = readSource("components/review-queue/review-queue-item-card.tsx");
  // Only the header-badges block matters here — the document title
  // `<h2 className="... font-black ...">` is typography, not a passive
  // status chip. Scope the assertion to the header block between the
  // "Header badges" and "Document title" markers.
  const headerBlockMatch =
    /\{\/\* Header badges \*\/\}[\s\S]*?\{\/\* Document title \*\/\}/.exec(src);
  assert.ok(headerBlockMatch, "review queue header badges block must be present");
  const header = headerBlockMatch[0];
  assert.doesNotMatch(
    header,
    /font-black/,
    "review queue header chips must not use font-black",
  );
});

test("review queue card tone: no chunky rounded-full passive chips in header", () => {
  const src = readSource("components/review-queue/review-queue-item-card.tsx");
  // The template-code and file-availability chips live in the header
  // block. We only allow `rounded-full` on elements that are geometric
  // (progress bars, avatar images), not on chips/pills.
  const headerBlockMatch =
    /\{?\/\* Header badges \*\/\}[\s\S]*?\{?\/\* Document title \*\/\}/.exec(src);
  assert.ok(headerBlockMatch, "review queue header badges block must be present");
  const header = headerBlockMatch[0];
  assert.doesNotMatch(
    header,
    /rounded-full\s+bg-(blue|emerald|amber|rose|green|orange|violet|slate)-[0-9]+/,
    "review queue header chips must not be rounded-full colored pills",
  );
});

test("settings page Badge does not use saturated overrides", () => {
  const src = readSource("app/settings/page.tsx");
  // The template-count Badge uses variant="blue"; the wrapper
  // className must not introduce a saturated 500-level background or
  // text-white.
  const badgeMatch = /<Badge\s+variant="blue"[^>]*>/.exec(src);
  assert.ok(badgeMatch, "settings page must render a Badge variant=blue");
  const badgeTag = badgeMatch[0];
  assert.doesNotMatch(badgeTag, /bg-(blue|emerald|amber|rose)-[567]00/);
  assert.doesNotMatch(badgeTag, /text-white/);
  assert.doesNotMatch(badgeTag, /font-black/);
});

// ---------------------------------------------------------------------------
// Anti-slop: cases page must not introduce saturated status pill classes
// outside of StatusBadge. The badge tone comes from StatusBadge itself.
// ---------------------------------------------------------------------------

test("cases page does not introduce saturated status color pills", () => {
  const src = readSource("app/cases/page.tsx");
  // The Badge in the page header must use variant=outline and the
  // status/priority rendering must go through StatusBadge.
  assert.match(
    src,
    /<Badge\s+variant="outline"[^>]*bg-white/,
    "cases page header must render an outline Badge on white surface",
  );
  assert.match(
    src,
    /<StatusBadge\s+type="case"\s+value=\{item\.currentStatus\}\s*\/>/,
    "cases page must render case status via StatusBadge",
  );
  assert.match(
    src,
    /<StatusBadge\s+type="priority"\s+value=\{item\.priority\}\s*\/>/,
    "cases page must render priority via StatusBadge",
  );
});