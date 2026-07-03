import assert from "node:assert/strict";
import Module from "node:module";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type KpiRenderProps = {
  label: string;
  value: number | string;
  tone?: "info" | "process" | "warning" | "success" | "neutral";
  description?: string;
};

const webSrcRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const cjsModule = Module as unknown as {
  _resolveFilename: (
    request: string,
    parent: unknown,
    isMain: boolean,
    options: unknown,
  ) => string;
};
const resolveFilename = cjsModule._resolveFilename;

cjsModule._resolveFilename = (request, parent, isMain, options) => {
  if (request.startsWith("@/")) {
    return resolveFilename.call(
      cjsModule,
      join(webSrcRoot, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return resolveFilename.call(cjsModule, request, parent, isMain, options);
};

async function renderKpiCard(props: KpiRenderProps) {
  const { KpiCard } = await import("./kpi-card");

  return renderToStaticMarkup(createElement(KpiCard, props));
}

test("KpiCard renders the dashboard metric label, value, and semantic tone", async () => {
  const markup = await renderKpiCard({
    label: "Tổng hồ sơ",
    value: "12",
    tone: "info",
  });

  assert.match(markup, /Tổng hồ sơ/);
  assert.match(markup, /12/);
  assert.match(markup, /data-kpi-tone="info"/);
  assert.match(markup, /tabular-nums/);
});

test("KpiCard surfaces tone through the shared Badge primitive, not inline dashboard washes", async () => {
  const markup = await renderKpiCard({
    label: "Biểu mẫu chờ duyệt",
    value: 3,
    tone: "warning",
  });

  assert.match(markup, /Biểu mẫu chờ duyệt/);

  // The tone is now surfaced through the shared Badge primitive — so
  // a `warning` KpiCard legitimately uses the toned-down amber tint
  // (`bg-amber-50 text-amber-700`). The KpiCard itself does not paint
  // an inline wash on its own root/card classes; only the inner Badge
  // carries the tone. The Badge markup itself must still avoid the
  // banned chunky/saturated passive styles (no `font-black`, no
  // `rounded-full`, no `text-white`).
  assert.match(markup, /bg-amber-50\s+text-amber-700/);
  assert.match(markup, /border-amber-200/);

  // The tone Badge is a small chip — it must not be the chunky CTA
  // variant (no rounded-full / no font-black / no text-white).
  assert.doesNotMatch(markup, /Cần xử lý[^<]*<[^>]*font-black/);
  assert.doesNotMatch(markup, /rounded-full[^"]*"[^>]*>Cần xử lý/);
});
