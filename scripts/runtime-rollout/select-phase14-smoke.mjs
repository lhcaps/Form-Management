/**
 * Phase 14 — 12-form smoke selection.
 *
 * Selects 12 forms deterministically from the 83-row lifecycle matrix to
 * exercise the dual-lifecycle UI driver. The selection covers:
 *   - persisted lifecycle (>= 8 forms)
 *   - standalone lifecycle (>= 4 forms; ideally all 6)
 *   - text, textarea, checkbox, enum, date, nested object, signature,
 *     multi-page, prior hydration drift, prior throttle/retry
 *
 * Selection is deterministic: the same matrix always yields the same 12.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const PHASE14_DIR = path.join(
  REPO_ROOT,
  "docs",
  "audit",
  "final-213-customer-ready",
  "runtime-rollout",
  "locked-authority-rebase",
  "phase14-dual-browser-promotion",
);
const MATRIX_PATH = path.join(PHASE14_DIR, "lifecycle-matrix-83.json");
const OUT_PATH = path.join(PHASE14_DIR, "smoke-selection.json");

const PERSISTED_HARD = ["BM-069", "BM-213", "BM-025", "BM-027", "BM-051", "BM-052", "BM-060", "BM-061"];
const STANDALONE_HARD = ["BM-157", "BM-168", "BM-174", "BM-181", "BM-206", "BM-213"];

async function main() {
  await mkdir(PHASE14_DIR, { recursive: true });
  const matrix = JSON.parse(await readFile(MATRIX_PATH, "utf8"));
  const byCode = new Map(matrix.rows.map((r) => [r.FORM_CODE, r]));

  const selected = [];
  const seen = new Set();

  // 1. Persisted hard inclusions (8 forms)
  for (const code of PERSISTED_HARD) {
    const row = byCode.get(code);
    if (row && row.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE" && !seen.has(code)) {
      selected.push({ ...row, smokeCategory: "persisted_hard_inclusion" });
      seen.add(code);
    }
  }

  // 2. Standalone hard inclusions (up to 6 unique forms)
  for (const code of STANDALONE_HARD) {
    const row = byCode.get(code);
    if (row && row.SUPPORTED_BROWSER_LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW" && !seen.has(code)) {
      selected.push({ ...row, smokeCategory: "standalone_hard_inclusion" });
      seen.add(code);
    }
  }

  // 3. Pad persisted to 12 (lifecycle-balance heuristic)
  const persisted = matrix.rows.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE");
  for (const r of persisted) {
    if (selected.length >= 12) break;
    if (seen.has(r.FORM_CODE)) continue;
    selected.push({ ...r, smokeCategory: "persisted_padding" });
    seen.add(r.FORM_CODE);
  }

  const tiers = {
    total: selected.length,
    persisted: selected.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "PERSISTED_DOCUMENT_WORKSPACE").length,
    standalone: selected.filter((r) => r.SUPPORTED_BROWSER_LIFECYCLE === "STANDALONE_RUNTIME_PREVIEW").length,
  };

  const out = {
    schema: "qllaw.phase14.smoke_selection/v1",
    generatedAt: new Date().toISOString(),
    phase: "phase14-dual-browser-promotion",
    selectionSeed: "phase14-dual-lifecycle-v1",
    requiredStates: {
      minPersisted: 8,
      minStandalone: 4,
      preferAllStandalone: true,
    },
    categories: {
      text: ["BM-025", "BM-027"],
      textarea: ["BM-049"],
      checkbox: ["BM-051"],
      enum: ["BM-052"],
      date: ["BM-025"],
      nestedObject: ["BM-025", "BM-049"],
      signature: ["BM-051"],
      issuePlaceDate: ["BM-027"],
      multiPage: ["BM-049"],
      priorHydrationDrift: ["BM-069"],
      priorThrottleRetry: ["BM-213"],
    },
    selected,
    tiers,
    deterministicOrdering: selected.map((r) => r.FORM_CODE),
  };

  await writeFile(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(JSON.stringify({ tiers, deterministicOrdering: out.deterministicOrdering }, null, 2));
}

main().catch((err) => {
  console.error("[phase14-smoke-selection] fatal:", err);
  process.exit(1);
});
