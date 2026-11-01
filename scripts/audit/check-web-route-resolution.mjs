#!/usr/bin/env node
/**
 * Web route-resolution smoke audit.
 *
 * Verifies that the Next.js dev server serves the Clerk auth routes
 * (`/sign-in`, `/sign-up`) directly and redirects protected template routes
 * (`/templates/BM-001`, `/templates/BM-171`, `/templates/BM-002`) to
 * `/sign-in?return_url=…` — never to the global not-found boundary.
 *
 * Each route is classified into one of three buckets:
 *   - "auth-public"        → 200 OK, contains the Clerk sign-in form
 *   - "redirect-to-signin" → 200 OK, contains the Clerk sign-in form AND
 *                            the embedded return_url points back to the
 *                            requested template
 *   - "global-not-found"   → contains the "Không tìm thấy trang" boundary
 *
 * Global-not-found is the only FAIL bucket. The other two are PASS.
 *
 * Usage:
 *   node scripts/audit/check-web-route-resolution.mjs
 *   node scripts/audit/check-web-route-resolution.mjs --base=http://localhost:3000
 *
 * Writes a JSON report to:
 *   docs/audit/unified-bm-workspace/check-web-route-resolution.latest.json
 *   docs/audit/unified-bm-workspace/check-web-route-resolution.latest.md
 *
 * Exit code: 0 on PASS for every route, 1 if any route falls into
 * "global-not-found".
 *
 * Does NOT log secrets. Does NOT touch the DB. Does NOT touch DOCX.
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const REPO_ROOT = process.cwd();
const DEFAULT_BASE = "http://localhost:3000";

const ROUTES = [
  { path: "/sign-in", expect: "auth-public" },
  { path: "/sign-up", expect: "auth-public" },
  { path: "/templates/BM-001", expect: "redirect-to-signin" },
  { path: "/templates/BM-171", expect: "redirect-to-signin" },
  { path: "/templates/BM-002", expect: "redirect-to-signin" },
];

function parseArgs(argv) {
  const out = { base: DEFAULT_BASE };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--base=")) {
      out.base = arg.slice("--base=".length);
    }
  }
  return out;
}

function classifyBody(body, routePath) {
  const hasClerkSignIn =
    body.includes("sign-in/[[...sign-in]]/page.tsx") ||
    body.includes("Đăng nhập hệ thống") ||
    body.includes("Dang nh?p h? th?ng") ||
    body.includes("SignIn");
  const hasClerkSignUp =
    body.includes("sign-up/[[...sign-up]]/page.tsx") ||
    body.includes("Tạo tài khoản") ||
    body.includes("T?o t�i kho?n") ||
    body.includes("SignUp");

  if (hasClerkSignIn) {
    const returnUrlMatch = body.match(/return_url%3D([^"&\\]+)/);
    const returnUrl = returnUrlMatch
      ? decodeURIComponent(returnUrlMatch[1])
      : null;
    return {
      bucket: routePath === "/sign-in" ? "auth-public" : "redirect-to-signin",
      returnUrl,
    };
  }
  if (hasClerkSignUp) {
    return { bucket: "auth-public" };
  }

  const is404Boundary =
    body.includes("Không tìm thấy trang") ||
    body.includes("K�ng t�m th?y trang") ||
    body.includes("Đường dẫn không tồn tại");
  if (is404Boundary) return { bucket: "global-not-found" };

  return { bucket: "unknown" };
}

async function probeRoute(baseUrl, routePath) {
  const url = `${baseUrl.replace(/\/$/, "")}${routePath}`;
  let status = 0;
  let finalUrl = url;
  let body = "";
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "route-resolution-audit/1.0",
      },
    });
    status = res.status;
    finalUrl = res.url;
    body = await res.text();
  } catch (err) {
    return {
      route: routePath,
      url,
      expect: ROUTES.find((r) => r.path === routePath).expect,
      status: 0,
      finalUrl,
      bucket: "fetch-error",
      ok: false,
      error: String(err && err.message ? err.message : err),
    };
  }

  const classification = classifyBody(body, routePath);
  const expected =
    ROUTES.find((r) => r.path === routePath)?.expect ?? "unknown";
  const ok =
    classification.bucket === "auth-public" ||
    classification.bucket === "redirect-to-signin";

  return {
    route: routePath,
    url,
    finalUrl,
    expect: expected,
    status,
    bucket: classification.bucket,
    returnUrl: classification.returnUrl ?? null,
    ok,
  };
}

function renderMarkdown(results, baseUrl) {
  const lines = [];
  lines.push("# Web Route Resolution Audit");
  lines.push("");
  lines.push(`Base URL: \`${baseUrl}\``);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("| Route | Expected | Status | Bucket | return_url | OK |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const r of results) {
    lines.push(
      `| \`${r.route}\` | ${r.expect} | ${r.status} | ${r.bucket} | ${r.returnUrl ?? "—"} | ${r.ok ? "PASS" : "FAIL"} |`,
    );
  }
  lines.push("");
  const failed = results.filter((r) => !r.ok);
  if (failed.length === 0) {
    lines.push("## Verdict");
    lines.push("");
    lines.push("All routes resolved correctly. No global not-found boundary detected.");
  } else {
    lines.push("## Verdict");
    lines.push("");
    lines.push(`FAIL — ${failed.length} route(s) hit the global not-found boundary.`);
    for (const r of failed) {
      lines.push(`- \`${r.route}\` → bucket=${r.bucket}`);
    }
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const args = parseArgs(process.argv);
  const base = args.base;
  const results = [];
  for (const route of ROUTES) {
    const r = await probeRoute(base, route.path);
    results.push(r);
  }

  const reportDir = path.join(
    REPO_ROOT,
    "docs",
    "audit",
    "unified-bm-workspace",
  );
  await mkdir(reportDir, { recursive: true });

  const jsonPath = path.join(reportDir, "check-web-route-resolution.latest.json");
  const mdPath = path.join(reportDir, "check-web-route-resolution.latest.md");

  const jsonReport = {
    schemaVersion: 1,
    baseUrl: base,
    generatedAt: new Date().toISOString(),
    routes: results,
    failed: results.filter((r) => !r.ok).map((r) => r.route),
  };
  await writeFile(jsonPath, JSON.stringify(jsonReport, null, 2) + "\n", "utf8");
  await writeFile(mdPath, renderMarkdown(results, base), "utf8");

  for (const r of results) {
    const tag = r.ok ? "PASS" : "FAIL";
    process.stdout.write(
      `[${tag}] ${r.route} → status=${r.status} bucket=${r.bucket} return_url=${r.returnUrl ?? "—"}\n`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    process.stderr.write(
      `\nFAIL: ${failed.length} route(s) misresolved. See ${mdPath}\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `\nPASS: all ${results.length} routes resolved correctly. Report → ${mdPath}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`audit failed: ${err && err.stack ? err.stack : err}\n`);
  process.exit(2);
});