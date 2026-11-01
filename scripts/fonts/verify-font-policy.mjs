#!/usr/bin/env node
/**
 * QLLAW Phase 8C — Font policy verification orchestrator.
 *
 * Reads the runtime font policy and the operator-provided Times New Roman
 * font directory, verifies the family + styles, and emits a machine-readable
 * JSON report that docker-verify.mjs consumes as an extension of the
 * image-runtime probe.
 *
 * Environment contract:
 *   QLLAW_FONT_POLICY=required        (default in production)
 *   QLLAW_FONT_POLICY=fallback-allowed (only for dev/test)
 *
 *   QLLAW_TNR_FONT_DIR                host directory containing the four
 *                                     operator-licensed TTFs. The script
 *                                     never copies these bytes; it only
 *                                     reads their metadata.
 *
 *   QLLAW_REQUIRED_FONT_FAMILY        family name to require. Default
 *                                     "Times New Roman".
 *
 * Exit codes:
 *   0  policy=required and exact family present with all 4 styles
 *   0  policy=fallback-allowed and at least one font is resolvable
 *   1  policy=required and exact family is missing or incomplete
 *   2  bad arguments / missing TNR dir / unreadable file
 *
 * Output:
 *   Always JSON to stdout. Path: <output-dir>/font-verification.json
 *   The same object is also printed to stdout when --stdout is given.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  inspectFont,
  verifyFontDirectory,
} from "./ttf-inspector.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..", "..");
const REQUIRED_STYLES = ["Regular", "Bold", "Italic", "Bold Italic"];

function readEnv() {
  const policyRaw = `${process.env.QLLAW_FONT_POLICY ?? "required"}`
    .trim()
    .toLowerCase();
  const policy = policyRaw === "fallback-allowed" ? "fallback-allowed" : "required";
  const family =
    process.env.QLLAW_REQUIRED_FONT_FAMILY?.trim() || "Times New Roman";
  const hostDir = process.env.QLLAW_TNR_FONT_DIR?.trim();
  const containerDir =
    process.env.QLLAW_CONTAINER_TNR_FONT_DIR?.trim() ||
    "/opt/qllaw/fonts/times-new-roman";
  return { policy, family, hostDir, containerDir };
}

function buildSummary(report, policy) {
  const lines = [];
  lines.push("# QLLAW Phase 8C - Font verification");
  lines.push("");
  lines.push(`policy: ${policy}`);
  lines.push(`required family: ${report.requiredFamily}`);
  lines.push(`aggregate: ${report.aggregate}`);
  lines.push(`present styles: ${report.presentStyles.join(", ") || "(none)"}`);
  if (report.missingStyles.length > 0) {
    lines.push(`missing styles: ${report.missingStyles.join(", ")}`);
  }
  lines.push("");
  lines.push("| file | family | subfamily | weight | size | status |");
  lines.push("|---|---|---|---:|---:|---|");
  for (const entry of report.perFont) {
    lines.push(
      `| ${entry.basename} | ${entry.family ?? "(unknown)"} | ${
        entry.subfamily ?? "(unknown)"
      } | ${entry.os2?.usWeightClass ?? "-"} | ${entry.size} | ${
        entry.status
      } |`,
    );
  }
  lines.push("");
  lines.push("Notes:");
  lines.push("- No font binary is embedded in this report.");
  lines.push("- File paths are intentionally not the operator host path.");
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const stdoutOnly = args.includes("--stdout");
  const outputIdx = args.indexOf("--output");
  const outputArg =
    outputIdx >= 0 ? args[outputIdx + 1] : undefined;
  // Positional font-dir is the first non-flag argument, excluding the
  // value paired with --output.
  const skipIndices = new Set();
  if (outputIdx >= 0) {
    skipIndices.add(outputIdx);
    skipIndices.add(outputIdx + 1);
  }
  const positional = args.filter(
    (arg, idx) => !arg.startsWith("--") && !skipIndices.has(idx),
  );
  const fontDirArg = positional[0];

  const env = readEnv();
  const fontDir =
    fontDirArg ??
    env.hostDir ??
    (env.policy === "required" ? env.containerDir : env.hostDir) ??
    null;

  if (!fontDir) {
    const message =
      "QLLAW_TNR_FONT_DIR is empty and no --font-dir argument was given. " +
      "Operator must supply a licensed Times New Roman directory.";
    const fail = {
      policy: env.policy,
      requiredFamily: env.family,
      fontDir: null,
      requiredStyles: REQUIRED_STYLES,
      aggregate: "EXACT_REQUIRED_FONT_MISSING",
      reason: message,
      perFont: [],
    };
    if (stdoutOnly) {
      console.log(JSON.stringify(fail, null, 2));
    } else if (outputArg) {
      mkdirSync(dirname(outputArg), { recursive: true });
      writeFileSync(outputArg, JSON.stringify(fail, null, 2), "utf8");
      console.error(`[font-verify] FONT_SOURCE_REQUIRED: ${message}`);
    } else {
      console.error(`[font-verify] FONT_SOURCE_REQUIRED: ${message}`);
    }
    process.exit(env.policy === "fallback-allowed" ? 0 : 1);
  }

  const allowFallback = env.policy === "fallback-allowed";
  const report = verifyFontDirectory({
    fontDir,
    requiredFamily: env.family,
    requiredStyles: REQUIRED_STYLES,
    allowFallback,
  });
  const fullReport = {
    policy: env.policy,
    requiredFamily: env.family,
    fontDir,
    ...report,
  };

  if (outputArg) {
    mkdirSync(dirname(outputArg), { recursive: true });
    writeFileSync(outputArg, JSON.stringify(fullReport, null, 2), "utf8");
    const summaryPath = outputArg.replace(/\.json$/u, ".md");
    writeFileSync(summaryPath, buildSummary(report, env.policy), "utf8");
    console.error(
      `[font-verify] wrote ${outputArg} and ${summaryPath}`,
    );
  }
  if (stdoutOnly || !outputArg) {
    console.log(JSON.stringify(fullReport, null, 2));
  }

  const ok =
    fullReport.aggregate === "EXACT_REQUIRED_FONT_PASS" ||
    (env.policy === "fallback-allowed" &&
      fullReport.aggregate !== "INVALID_FONT_METADATA" &&
      fullReport.aggregate !== "EXACT_REQUIRED_FONT_MISSING");
  process.exit(ok ? 0 : 1);
}

const SCRIPT_BASENAME = "verify-font-policy.mjs";
const isDirectExecution =
  process.argv[1] && process.argv[1].endsWith(SCRIPT_BASENAME);
if (isDirectExecution) {
  try {
    main();
  } catch (error) {
    console.error(
      "[font-verify] FAILED:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(2);
  }
}

export { main as verifyFontPolicy };