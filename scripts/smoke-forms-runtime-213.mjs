#!/usr/bin/env node
/**
 * Phase D — Smoke test: 213/213 forms in runtime catalog.
 *
 * Checks that all 213 locked forms are available in the runtime API,
 * have the correct status (locked), are runtime-eligible, and contain
 * zero generic placeholder paths.
 *
 * Usage:
 *   node scripts/smoke-forms-runtime-213.mjs
 *   node scripts/smoke-forms-runtime-213.mjs --url http://localhost:3001
 *   pnpm smoke:forms-runtime:213
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL =
  process.env.API_URL ??
  process.argv.find((a) => a.startsWith("--url="))?.replace("--url=", "") ??
  "http://localhost:3001";

const HEALTH_URL = `${API_URL}/api/v1/health`;
const CATALOG_URL = `${API_URL}/api/v1/forms/catalog`;

async function checkJsonEndpoint(url, { fetchImpl = fetch } = {}) {
  try {
    const res = await fetchImpl(url, {
      signal: AbortSignal.timeout(10_000),
    });
    const body = await res.json();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;

function isGeneric(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  return GENERIC_RE.test(value);
}

export async function runSmoke({ fetchImpl = fetch } = {}) {
  const errors = [];
  const warnings = [];

  // 1. API health
  const health = await checkJsonEndpoint(HEALTH_URL, { fetchImpl });
  if (!health.ok || health.body?.ok !== true) {
    errors.push(
      `API health failed: ${health.error ?? `HTTP ${health.status}`}`,
    );
    return { ok: false, errors, warnings, catalogCount: 0 };
  }

  // 2. Forms catalog
  const catalogResp = await checkJsonEndpoint(CATALOG_URL, { fetchImpl });
  if (!catalogResp.ok) {
    errors.push(
      `Forms catalog failed: ${catalogResp.error ?? `HTTP ${catalogResp.status}`}`,
    );
    return { ok: false, errors, warnings, catalogCount: 0 };
  }

  const catalog = catalogResp.body;
  if (!Array.isArray(catalog)) {
    errors.push("Forms catalog response is not an array.");
    return { ok: false, errors, warnings, catalogCount: 0 };
  }

  // 3. Count by status
  const byStatus = {};
  for (const item of catalog) {
    const status = item?.status ?? "unknown";
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }

  const lockedCount = byStatus["locked"] ?? 0;
  const draftCount = byStatus["draft"] ?? 0;
  const totalCount = catalog.length;

  // 4. Check all 213 locked forms are present and eligible
  const missingLocked = [];
  const notEligible = [];
  const withGeneric = [];

  for (const item of catalog) {
    const code = item?.templateCode;
    if (!code) continue;

    if (item.status === "locked") {
      if (item.runtimeEligible !== true) {
        notEligible.push(`${code} (runtimeEligible=${item.runtimeEligible})`);
      }

      // Check compiledJson for generic paths
      const compiled = item.compiledJson ?? item.draftJson ?? {};
      const slots = compiled.docxSlots ?? [];
      const fields = compiled.canonicalFields ?? [];
      const bindings = compiled.renderBindings ?? [];

      const genericSlots = slots.filter((s) => isGeneric(s?.slotId ?? "")).map(
        (s) => s.slotId,
      );
      const genericFields = fields.filter((f) => isGeneric(f?.path ?? "")).map(
        (f) => f.path,
      );
      const genericBindings = bindings.filter(
        (b) => isGeneric(b?.slotId ?? "") || isGeneric(b?.from ?? ""),
      ).map((b) => b.slotId);

      if (
        genericSlots.length || genericFields.length || genericBindings.length
      ) {
        withGeneric.push({
          code,
          genericSlots,
          genericFields,
          genericBindings,
        });
      }
    }
  }

  // 5. Check reference documents don't leak into catalog
  for (const item of catalog) {
    const isRef =
      item?.documentKind === "reference" ||
      String(item?.sourceId ?? "").startsWith("REF__");
    if (isRef) {
      warnings.push(
        `Reference document leaked into catalog: ${item?.templateCode ?? item?.sourceId}`,
      );
    }
  }

  // Build errors
  if (lockedCount < 213) {
    errors.push(
      `Locked forms: ${lockedCount}/213 (${213 - lockedCount} missing)`,
    );
  }
  if (notEligible.length) {
    errors.push(
      `${notEligible.length} locked form(s) not runtime-eligible: ${notEligible.join(", ")}`,
    );
  }
  if (withGeneric.length) {
    errors.push(
      `${withGeneric.length} locked form(s) with generic paths: ${withGeneric
        .map((g) => g.code)
        .join(", ")}`,
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    catalogCount: totalCount,
    lockedCount,
    draftCount,
    byStatus,
    notEligible,
    withGeneric,
  };
}

export async function main() {
  console.log("\n=== Phase D: 213 Forms Runtime Smoke ===\n");
  console.log(`API:  ${API_URL}`);
  console.log(`URL:  ${CATALOG_URL}\n`);

  const result = await runSmoke();

  console.log(`Total catalog items:  ${result.catalogCount}`);
  console.log(`Locked forms:        ${result.lockedCount}`);
  console.log(`Draft forms:         ${result.draftCount}`);
  console.log(`Status breakdown:     ${JSON.stringify(result.byStatus)}`);
  console.log();

  if (result.warnings.length) {
    console.log("Warnings:");
    for (const w of result.warnings) console.log(`  - ${w}`);
    console.log();
  }

  if (result.ok) {
    console.log(
      `[OK] All 213 forms are locked, runtime-eligible, and contain zero generic paths.`,
    );
    return 0;
  }

  console.log("Errors:");
  for (const e of result.errors) console.log(`  - ${e}`);
  console.log();
  return 1;
}

const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? ".");

if (isDirectExecution) {
  process.exitCode = await main();
}
