#!/usr/bin/env node
/**
 * Phase D — Smoke test: 213/213 forms render at runtime.
 *
 * For each BM-001 through BM-213, calls GET /forms/runtime/:templateCode
 * and validates the response is a valid CompiledFormContract (schemaVersion "2.0").
 *
 * Also verifies:
 *   - No generic paths remain in compiled contract fields/slots/bindings
 *   - source is GLOBAL_PUBLISHED (not LOCKED_FILE fallback) when DB is published
 *   - Compiled contract has uiSchema.sections and renderPlan.bindings
 *
 * Usage:
 *   node scripts/smoke-forms-runtime-213.mjs
 *   node scripts/smoke-forms-runtime-213.mjs --url=http://localhost:3001
 *   pnpm smoke:forms:runtime:213
 */

import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL =
  process.env.E2E_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") ??
  process.env.API_URL ??
  process.argv.find((a) => a.startsWith("--url="))?.replace("--url=", "") ??
  "http://localhost:3001";

const HEALTH_URL = `${API_URL}/api/v1/health`;
const WEB_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const CLERK_STORAGE_STATE_PATH = path.resolve(
  process.env.CLERK_STORAGE_STATE_PATH ??
    path.join("playwright", ".clerk", "admin.json"),
);

// BM-001 through BM-213
const ALL_CODES = Array.from({ length: 213 }, (_, i) => {
  const n = String(i + 1).padStart(3, "0");
  return `BM-${n}`;
});

async function checkJsonEndpoint(
  url,
  { fetchImpl = fetch, authorization = "" } = {},
) {
  try {
    const headers = {};
    if (authorization) headers.Authorization = authorization;
    const res = await fetchImpl(url, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    const body = await res.json();
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// Matches generic docxSlot/canonicalField paths like document.field, field1, field_legacy
const GENERIC_RE = /(^|\.)field(?:\d+)?(?:_|$)/iu;
function isGenericPath(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  return GENERIC_RE.test(value);
}

function validateCompiledContract(body, templateCode) {
  const errors = [];

  if (!body || typeof body !== "object") {
    errors.push("Response is not an object");
    return { ok: false, errors };
  }

  const { source, compiledContract } = body;

  if (!source) {
    errors.push("Missing field: source");
  }

  if (!compiledContract || typeof compiledContract !== "object") {
    errors.push("Missing field: compiledContract");
    return { ok: false, errors };
  }

  if (compiledContract.schemaVersion !== "2.0") {
    errors.push(
      `schemaVersion is "${compiledContract.schemaVersion}", expected "2.0"`,
    );
  }

  if (!Array.isArray(compiledContract.uiSchema?.sections)) {
    errors.push(
      "compiledContract.uiSchema.sections is missing or not an array",
    );
  }

  if (!Array.isArray(compiledContract.renderPlan?.bindings)) {
    errors.push(
      "compiledContract.renderPlan.bindings is missing or not an array",
    );
  }

  if (source !== "GLOBAL_PUBLISHED") {
    errors.push(`source is "${source}", expected "GLOBAL_PUBLISHED"`);
  }

  if (!Array.isArray(compiledContract.source?.fields)) {
    errors.push("compiledContract.source.fields is missing or not an array");
  }

  // Check generic paths in fields
  const fields = compiledContract.source?.fields ?? [];
  const genericFieldPaths = fields
    .filter((f) => isGenericPath(f.key ?? ""))
    .map((f) => f.key);
  if (genericFieldPaths.length > 0) {
    errors.push(`generic field keys: ${genericFieldPaths.join(", ")}`);
  }

  // Check generic paths in render bindings
  const bindings = compiledContract.renderPlan?.bindings ?? [];
  const genericSlotBindings = bindings.filter(
    (b) =>
      isGenericPath(b.target?.slotId ?? "") ||
      isGenericPath(b.source?.fieldKey ?? ""),
  );
  if (genericSlotBindings.length > 0) {
    errors.push(
      `${genericSlotBindings.length} binding(s) with generic slot/field paths`,
    );
  }

  return { ok: errors.length === 0, errors, source };
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function createClerkAuthorizationProvider({
  webUrl = WEB_URL,
  storageStatePath = CLERK_STORAGE_STATE_PATH,
} = {}) {
  if (!existsSync(storageStatePath)) {
    throw new Error(
      `Clerk storage state is missing: ${storageStatePath}. Run the clerk setup project first.`,
    );
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      storageState: storageStatePath,
    });
    const page = await context.newPage();
    await page.goto(`${webUrl}/templates/BM-001`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(
      () => Boolean(window.Clerk?.session?.getToken),
      undefined,
      { timeout: 20_000 },
    );
    return {
      getAuthorization: async () => {
        const token = await page.evaluate(async () =>
          window.Clerk?.session?.getToken?.(),
        );
        if (!token) {
          throw new Error("Clerk session did not provide a bearer token.");
        }
        return `Bearer ${token}`;
      },
      dispose: async () => {
        await browser.close();
      },
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

export async function createClerkAuthorization(options = {}) {
  const provider = await createClerkAuthorizationProvider(options);
  try {
    return await provider.getAuthorization();
  } finally {
    await provider.dispose();
  }
}

async function resolveAuthorization(getAuthorization) {
  const authorization = await getAuthorization();
  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    throw new Error("expected a Bearer token.");
  }
  return authorization;
}

export async function runSmoke({
  fetchImpl = fetch,
  getAuthorization,
  createAuthorizationProvider = createClerkAuthorizationProvider,
  requestDelayMs = 1_000,
} = {}) {
  const errors = [];
  const warnings = [];
  let disposeAuthorization = async () => {};

  if (!getAuthorization) {
    try {
      const provider = await createAuthorizationProvider();
      getAuthorization = provider.getAuthorization;
      disposeAuthorization = provider.dispose;
    } catch (error) {
      errors.push(
        `Clerk authorization failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        ok: false,
        errors,
        warnings,
        passedCount: 0,
        failedCount: 0,
        failedForms: [],
      };
    }
  }

  try {
    // 0. Resolve a Clerk bearer token from the authenticated browser state.
    // `qlv_session` is deliberately not accepted for Clerk-protected routes.
    console.log("Resolving Clerk authorization...");
    let authorization = await resolveAuthorization(getAuthorization);
    console.log("  Clerk authorization resolved\n");

    // 1. API health
    const health = await checkJsonEndpoint(HEALTH_URL, {
      fetchImpl,
      authorization,
    });
    if (!health.ok || health.body?.ok !== true) {
      errors.push(
        `API health failed: ${health.error ?? `HTTP ${health.status}`}`,
      );
      return {
        ok: false,
        errors,
        warnings,
        passedCount: 0,
        failedCount: 0,
        failedForms: [],
      };
    }

    // 2. Smoke each form with 1 request/second to avoid 429.
    // Resolve the token again per request so Clerk can refresh short-lived JWTs.
    let passedCount = 0;
    let failedCount = 0;
    const failedForms = [];

    console.log(`Checking ${ALL_CODES.length} forms (1 req/s)...`);
    const start = Date.now();

    for (let i = 0; i < ALL_CODES.length; i++) {
      const code = ALL_CODES[i];
      const url = `${API_URL}/api/v1/forms/runtime/${encodeURIComponent(code)}`;

      if (i > 0 && requestDelayMs > 0) await sleep(requestDelayMs); // 1 req/s by default to stay under throttle

      try {
        authorization = await resolveAuthorization(getAuthorization);
      } catch (error) {
        failedForms.push({
          code,
          errors: [
            `Clerk authorization failed: ${error instanceof Error ? error.message : String(error)}`,
          ],
        });
        failedCount++;
        continue;
      }

      const resp = await checkJsonEndpoint(url, { fetchImpl, authorization });

      if (!resp.ok) {
        failedForms.push({
          code,
          errors: [`HTTP ${resp.status}: ${resp.error}`],
        });
        failedCount++;
        console.log(`[FAIL] ${code} HTTP ${resp.status}`);
        continue;
      }

      const validation = validateCompiledContract(resp.body, code);
      if (!validation.ok) {
        failedForms.push({
          code,
          errors: validation.errors,
          source: validation.source,
        });
        failedCount++;
        console.log(`[FAIL] ${code}: ${validation.errors.join("; ")}`);
      } else {
        passedCount++;
        if (i % 50 === 0 || i === ALL_CODES.length - 1) {
          console.log(`[OK]   ${code} (${passedCount}/${i + 1} passed so far)`);
        }
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\nCompleted in ${elapsed}s`);

    // Build summary errors
    if (failedCount > 0) {
      errors.push(`${failedCount} form(s) failed runtime smoke:`);
      for (const f of failedForms) {
        errors.push(`  - ${f.code}: ${f.errors.join("; ")}`);
      }
    }

    return {
      ok: errors.length === 0,
      errors,
      warnings,
      passedCount,
      failedCount,
      failedForms,
      total: ALL_CODES.length,
    };
  } finally {
    await disposeAuthorization();
  }
}

export async function main() {
  console.log("\n=== Phase D: 213 Forms Runtime Smoke ===\n");
  console.log(`API:  ${API_URL}`);
  console.log(`Total forms to check: ${ALL_CODES.length}\n`);

  const result = await runSmoke();

  console.log(`\nPassed: ${result.passedCount}/${result.total}`);
  console.log(`Failed: ${result.failedCount}/${result.total}`);
  console.log();

  if (result.ok) {
    console.log(
      `[OK] All 213 forms returned valid CompiledFormContract (schemaVersion "2.0", uiSchema.sections, renderPlan.bindings, zero generic paths).`,
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
