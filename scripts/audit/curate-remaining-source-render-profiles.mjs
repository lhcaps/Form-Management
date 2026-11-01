#!/usr/bin/env node
/**
 * Curates the remaining-eligible source/render runtime UX profiles.
 *
 * For each form classified ELIGIBLE_SOURCE_RENDER by
 * scripts/audit/select-remaining-source-render-candidates.mjs, this script
 * upgrades the auto-generated runtime UX profile to a
 * "remaining curated source-render profile" version by:
 *
 *   - Replacing the file header docstring.
 *   - Replacing the versionLabel string.
 *   - Stripping the "(mẫu BM-XXX)" placeholder suffix from the demo block
 *     so the demo data reads as semantic content rather than a templated
 *     marker.
 *
 * It does NOT mutate the locked contract, the normalized DOCX, or the
 * compiled contract. It does NOT introduce generatedDocument/workspace
 * lifecycle fields. It does NOT mark runtimeReady or promote any form
 * onto the FormFlight runtimeReady allowlist.
 *
 * It is safe to re-run; it only writes if the versionLabel still says
 * "auto-generated conservative profile" for a given code.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd()).replace(/\\/g, "/");
const OUT_DIR = `${ROOT}/docs/audit/unified-bm-workspace`;
const CANDIDATES = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CANDIDATES.latest.json`;
const ARTIFACT = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CURATION.latest.json`;
const ARTIFACT_MD = `${OUT_DIR}/QLLAW_REMAINING_SOURCE_RENDER_CURATION.latest.md`;
const PROFILES_DIR = `${ROOT}/apps/web/src/lib/runtime-ux`;

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function readJson(path, label) {
  if (!existsSync(path)) fail(`missing ${label}: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`invalid JSON in ${label}: ${err.message}`);
  }
}

const candidates = readJson(CANDIDATES, "remaining source/render candidates");
if (candidates.status !== "PASS") {
  fail(`candidate artifact status=${candidates.status}; expected PASS`);
}
const eligible = candidates.eligible ?? [];
if (eligible.length === 0) {
  fail("zero eligible forms; nothing to curate");
}

const NEW_LABEL = "runtime-ux remaining curated source-render profile";
const OLD_LABEL = "runtime-ux auto-generated conservative profile";
const OLD_LABEL_ESCAPED = OLD_LABEL.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

const results = [];
for (const cand of eligible) {
  const code = cand.code;
  const profilePath = `${PROFILES_DIR}/bm${code.slice(3)}-runtime-ux-profile.ts`;
  if (!existsSync(profilePath)) {
    fail(`missing profile for ${code}: ${profilePath}`);
  }
  const original = readFileSync(profilePath, "utf8");
  if (!original.includes(OLD_LABEL)) {
    results.push({
      code,
      status: "SKIP",
      reason: "versionLabel is not auto-generated (already curated or unrelated)",
    });
    continue;
  }

  // 1) Replace the file header docstring.
  let updated = original.replace(
    /Auto-generated runtime-ux profile for BM-\d{3}\./u,
    `${code} ${NEW_LABEL}.`,
  );

  // 2) Replace the versionLabel string.
  updated = updated.replace(
    new RegExp(
      `versionLabel:\\s*\`BM-\\d{3} ${escapeRegExp(OLD_LABEL)}\``,
      "u",
    ),
    `versionLabel: \`${code} ${NEW_LABEL}\``,
  );

  // 3) Strip "(mẫu BM-XXX)" suffix from the demo block.
  updated = updated.replace(
    /\(mẫu\s+BM-\d{3}\)/gu,
    "",
  );
  // 3b) Tidy trailing whitespace left by the suffix removal.
  updated = updated.replace(/[ \t]+$/gum, "");

  // Sanity check: ensure the new label is now present and old one is gone.
  if (!updated.includes(`${code} ${NEW_LABEL}`)) {
    fail(`${code}: failed to insert new versionLabel`);
  }
  if (updated.includes(OLD_LABEL)) {
    fail(`${code}: old versionLabel still present after replacement`);
  }
  if (updated.includes("(mẫu BM-")) {
    fail(`${code}: stale "(mẫu BM-XXX)" suffix still present in demo block`);
  }

  writeFileSync(profilePath, updated);
  results.push({
    code,
    status: "CURATED",
    profilePath: profilePath.replace(`${ROOT}/`, ""),
    newVersionLabel: `${code} ${NEW_LABEL}`,
    demoSuffixStripped: true,
  });
}

const snapshotDate = new Date().toISOString();
const curated = results.filter((r) => r.status === "CURATED");
const skipped = results.filter((r) => r.status === "SKIP");

const artifact = {
  snapshotDate,
  status: curated.length === eligible.length ? "PASS" : "PASS_PARTIAL",
  statusNote:
    curated.length === eligible.length
      ? `All ${eligible.length} eligible profiles were upgraded to the remaining curated source-render profile.`
      : `${curated.length}/${eligible.length} eligible profiles upgraded; the rest were already curated.`,
  totalEligible: eligible.length,
  formsCurated: curated.length,
  formsSkipped: skipped.length,
  selectionArtifact: CANDIDATES.replace(`${ROOT}/`, ""),
  results,
  notes: [
    "Profile versionLabel changed from auto-generated to remaining curated source-render.",
    "Demo block stripped of (mẫu BM-XXX) suffix to read as semantic demo content.",
    "No DOCX/contract/DB/schema mutation.",
    "No FormFlight runtimeReady promotion.",
    "No FIDELITY_COMPLETE_EVIDENCED claim.",
  ],
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(ARTIFACT, JSON.stringify(artifact, null, 2));

const lines = [];
lines.push("# QLLAW Remaining Source/Render Curation - latest");
lines.push("");
lines.push(`> Generated: ${artifact.snapshotDate}`);
lines.push(`> Status: ${artifact.status}`);
lines.push(`> Total eligible: ${artifact.totalEligible}`);
lines.push(`> Forms curated: ${artifact.formsCurated}`);
lines.push(`> Forms skipped: ${artifact.formsSkipped}`);
lines.push("");
lines.push("| Code | Status | New versionLabel |");
lines.push("|---|---|---|");
for (const r of results) {
  lines.push(
    `| ${r.code} | ${r.status} | ${r.newVersionLabel ?? "—"} |`,
  );
}
lines.push("");
writeFileSync(ARTIFACT_MD, lines.join("\n") + "\n");

console.log(
  JSON.stringify(
    {
      ok: true,
      status: artifact.status,
      totalEligible: artifact.totalEligible,
      formsCurated: curated.length,
      formsSkipped: skipped.length,
      artifact: ARTIFACT.replace(`${ROOT}/`, ""),
    },
    null,
    2,
  ),
);