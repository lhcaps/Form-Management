#!/usr/bin/env node
/**
 * Phase 8D — authenticated nine-form throttling closure.
 *
 * This collector performs one navigation per target form with an existing
 * Clerk Playwright storageState. It stores only sanitized transport/auth
 * metadata: no cookies, tokens, response bodies, form data, or legal payload.
 *
 * Exit codes:
 *   0 - authenticated evidence packet produced
 *   1 - unexpected collector failure
 *   3 - operator credential/server prerequisite required
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { classifyAuthenticatedThrottlingEvidence } from './lib/throttling-classifier.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = join(
  REPO_ROOT,
  'docs',
  'audit',
  'infrastructure-modernization',
  'phase-8c-throttling',
);
const OUT_FILE = join(OUT_DIR, 'throttling-closure.latest.json');
const STORAGE_STATE_RELATIVE = 'playwright/.clerk/admin.json';
const STORAGE_STATE = join(REPO_ROOT, ...STORAGE_STATE_RELATIVE.split('/'));
const WEB_BASE_URL = process.env.QLLAW_WEB_BASE_URL || 'http://127.0.0.1:3000';
const API_READY_URL =
  process.env.QLLAW_API_READY_URL || 'http://127.0.0.1:3001/api/v1/health';
const MAX_AUTH_STATE_AGE_MS = Number(
  process.env.QLLAW_AUTH_STATE_MAX_AGE_MS || 24 * 60 * 60 * 1000,
);
const OPERATOR_COMMAND =
  'pnpm exec playwright test --config=playwright.config.ts --project="clerk setup" --workers=1 --reporter=line; if ($LASTEXITCODE -eq 0) { node scripts/audit/build-phase-8c-throttling-closure.mjs }';

const TARGET_FORMS = [
  'BM-118',
  'BM-119',
  'BM-120',
  'BM-151',
  'BM-152',
  'BM-153',
  'BM-185',
  'BM-186',
  'BM-187',
];

const nowIso = () => new Date().toISOString();

function writePacket(packet) {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
}

function unavailableEvidence(reasonCode, authState = {}) {
  const perForm = TARGET_FORMS.map((templateCode) => ({
    form: templateCode,
    route: `/templates/${templateCode}`,
    method: 'GET',
    httpStatus: null,
    durationMs: null,
    authValid: false,
    collectorComplete: false,
    rateLimitHeaderPresent: false,
    explicit429Evidence: false,
    classifierResult: 'UNVERIFIED',
    artifact: 'docs/audit/infrastructure-modernization/phase-8c-throttling/throttling-closure.latest.json',
  }));
  const packet = {
    schemaVersion: '2.0.0',
    generatedAt: nowIso(),
    authState: 'OPERATOR_CREDENTIAL_REQUIRED',
    reasonCode,
    storageState: {
      path: STORAGE_STATE_RELATIVE,
      ...authState,
    },
    targetCount: TARGET_FORMS.length,
    verifiedCount: 0,
    unverifiedCount: TARGET_FORMS.length,
    operatorPrerequisite:
      'Start the documented local `pnpm dev` flow and wait for web /healthz plus API /api/v1/health before running the command.',
    operatorCommand: OPERATOR_COMMAND,
    perForm,
  };
  writePacket(packet);
  console.error(
    `[OPERATOR_CREDENTIAL_REQUIRED] ${reasonCode}; ${TARGET_FORMS.length}/${TARGET_FORMS.length} forms remain UNVERIFIED`,
  );
  return 3;
}

function gitStatusForStorageState() {
  const ignored =
    spawnSync('git', ['check-ignore', '--quiet', '--', STORAGE_STATE_RELATIVE], {
      cwd: REPO_ROOT,
      windowsHide: true,
    }).status === 0;
  const tracked =
    spawnSync('git', ['ls-files', '--error-unmatch', '--', STORAGE_STATE_RELATIVE], {
      cwd: REPO_ROOT,
      windowsHide: true,
    }).status === 0;
  return { ignored, tracked };
}

async function endpointReady(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}

function sanitizedFailureEntry(templateCode, durationMs, errorClass) {
  return {
    form: templateCode,
    route: `/templates/${templateCode}`,
    method: 'GET',
    httpStatus: null,
    durationMs,
    authValid: false,
    collectorComplete: false,
    rateLimitHeaderPresent: false,
    explicit429Evidence: false,
    classifierResult: 'UNVERIFIED',
    errorClass,
    artifact: 'docs/audit/infrastructure-modernization/phase-8c-throttling/throttling-closure.latest.json',
  };
}

async function collectAuthenticatedEvidence() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();

    const smokeStartedAt = Date.now();
    const smokeResponse = await page.goto(`${WEB_BASE_URL}/cases`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    const smokeFinalUrl = page.url();
    let smokeAuthValid = false;
    if (!/\/sign-in|\/sign-up/u.test(smokeFinalUrl)) {
      try {
        await page.waitForFunction(
          () => Boolean(window.Clerk?.user?.id && window.Clerk?.session?.id),
          null,
          { timeout: 15_000 },
        );
        smokeAuthValid = await page.evaluate(() =>
          Boolean(window.Clerk?.user?.id && window.Clerk?.session?.id),
        );
      } catch {
        smokeAuthValid = false;
      }
    }
    const authSmoke = {
      route: '/cases',
      method: 'GET',
      httpStatus: smokeResponse?.status() ?? null,
      durationMs: Date.now() - smokeStartedAt,
      authValid: smokeAuthValid,
      redirectedToAuth: /\/sign-in|\/sign-up/u.test(smokeFinalUrl),
    };
    if (!smokeAuthValid || authSmoke.httpStatus !== 200) {
      return { authSmoke, perForm: null };
    }

    const perForm = [];
    for (const templateCode of TARGET_FORMS) {
      const startedAt = Date.now();
      try {
        const response = await page.goto(
          `${WEB_BASE_URL}/templates/${templateCode}`,
          { waitUntil: 'domcontentloaded', timeout: 30_000 },
        );
        const durationMs = Date.now() - startedAt;
        const finalUrl = page.url();
        const headers = response ? await response.allHeaders() : {};
        const headerNames = Object.keys(headers).map((name) => name.toLowerCase());
        const httpStatus = response?.status() ?? null;
        const redirectedToAuth = /\/sign-in|\/sign-up/u.test(finalUrl);
        let routeClerkValid = false;
        if (!redirectedToAuth && httpStatus !== 429) {
          try {
            await page.waitForFunction(
              () => Boolean(window.Clerk?.user?.id && window.Clerk?.session?.id),
              null,
              { timeout: 15_000 },
            );
            routeClerkValid = await page.evaluate(() =>
              Boolean(window.Clerk?.user?.id && window.Clerk?.session?.id),
            );
          } catch {
            routeClerkValid = false;
          }
        }
        // A 429 body may not hydrate the app. The preceding authenticated smoke
        // still proves the storageState, provided this navigation did not redirect.
        const authValid =
          smokeAuthValid &&
          !redirectedToAuth &&
          (httpStatus === 429 || routeClerkValid);
        const collectorComplete = response !== null;
        const rateLimitHeaderPresent = headerNames.some(
          (name) => name === 'retry-after' || name.startsWith('x-ratelimit-'),
        );
        const explicit429Evidence = httpStatus === 429;
        const result = classifyAuthenticatedThrottlingEvidence({
          authValid,
          collectorComplete,
          httpStatus,
          durationMs,
          structuredError: explicit429Evidence
            ? { status: 429, name: 'HTTP 429' }
            : null,
          responseHeaders: {
            'retry-after': headers['retry-after'] ?? null,
          },
        });
        perForm.push({
          form: templateCode,
          route: `/templates/${templateCode}`,
          method: 'GET',
          httpStatus,
          durationMs,
          authValid,
          collectorComplete,
          rateLimitHeaderPresent,
          explicit429Evidence,
          classifierResult: result.classification,
          artifact: 'docs/audit/infrastructure-modernization/phase-8c-throttling/throttling-closure.latest.json',
        });
      } catch (error) {
        const errorClass =
          error instanceof Error && /timeout/iu.test(error.name)
            ? 'NAVIGATION_TIMEOUT'
            : 'NAVIGATION_ERROR';
        perForm.push(
          sanitizedFailureEntry(templateCode, Date.now() - startedAt, errorClass),
        );
      }
    }
    return { authSmoke, perForm };
  } finally {
    await browser.close();
  }
}

async function main() {
  if (!existsSync(STORAGE_STATE)) {
    return unavailableEvidence('STORAGE_STATE_MISSING', {
      exists: false,
      ignored: null,
      tracked: null,
      recent: false,
    });
  }

  const { ignored, tracked } = gitStatusForStorageState();
  const stateStat = statSync(STORAGE_STATE);
  const ageMs = Math.max(0, Date.now() - stateStat.mtimeMs);
  const recent =
    Number.isFinite(MAX_AUTH_STATE_AGE_MS) &&
    MAX_AUTH_STATE_AGE_MS > 0 &&
    ageMs <= MAX_AUTH_STATE_AGE_MS;
  const storageStateMetadata = {
    exists: true,
    ignored,
    tracked,
    recent,
    ageMs,
    maxAgeMs: MAX_AUTH_STATE_AGE_MS,
    sizeBytes: stateStat.size,
  };
  if (!ignored || tracked) {
    return unavailableEvidence('STORAGE_STATE_GIT_POLICY_FAILED', storageStateMetadata);
  }
  if (!recent) {
    return unavailableEvidence('STORAGE_STATE_NOT_RECENT', storageStateMetadata);
  }

  const [webReady, apiReady] = await Promise.all([
    endpointReady(`${WEB_BASE_URL}/healthz`),
    endpointReady(API_READY_URL),
  ]);
  if (!webReady || !apiReady) {
    return unavailableEvidence('LOCAL_SERVERS_NOT_READY', {
      ...storageStateMetadata,
      webReady,
      apiReady,
    });
  }

  const evidence = await collectAuthenticatedEvidence();
  if (!evidence.perForm) {
    return unavailableEvidence('AUTHENTICATED_SMOKE_FAILED', {
      ...storageStateMetadata,
      smokeHttpStatus: evidence.authSmoke.httpStatus,
      smokeAuthValid: evidence.authSmoke.authValid,
      smokeRedirectedToAuth: evidence.authSmoke.redirectedToAuth,
    });
  }

  const verifiedCount = evidence.perForm.filter((entry) =>
    ['THROTTLED_VERIFIED', 'NOT_THROTTLED_VERIFIED'].includes(
      entry.classifierResult,
    ),
  ).length;
  const unverifiedCount = evidence.perForm.length - verifiedCount;
  const packet = {
    schemaVersion: '2.0.0',
    generatedAt: nowIso(),
    authState: 'AUTHENTICATED_SMOKE_PASS',
    storageState: storageStateMetadata,
    authSmoke: evidence.authSmoke,
    targetCount: TARGET_FORMS.length,
    verifiedCount,
    unverifiedCount,
    perForm: evidence.perForm,
  };
  writePacket(packet);
  console.log(
    `[PASS] Authenticated throttling evidence collected: verified=${verifiedCount} unverified=${unverifiedCount}`,
  );
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(
    `[FAIL] THROTTLING_COLLECTOR_ERROR: ${error instanceof Error ? error.name : 'UNKNOWN_ERROR'}`,
  );
  process.exitCode = 1;
}
