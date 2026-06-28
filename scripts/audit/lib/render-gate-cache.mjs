/**
 * Render Gate Cache for DOCX Atlas V1
 *
 * Provides caching for render-form-fidelity-gate results.
 * Only re-runs gate when render-diff.latest.json is stale.
 *
 * @module render-gate-cache
 */

import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ─── Path helpers ────────────────────────────────────────────────────────────────

export function renderDiffPath(root, templateCode) {
  return join(
    root,
    'docs',
    'audit',
    'per-form-render-accurate',
    templateCode,
    'render-diff.latest.json'
  );
}

export function normalizedDocxPath(root, templateCode) {
  return join(
    root,
    'storage',
    'templates',
    'normalized-docx',
    templateCode,
    `${templateCode}_normalized.docx`
  );
}

export function findLockedContractFile(root, templateCode) {
  const lockedDir = join(root, 'docs', 'audit', 'docx', 'contracts', 'locked');
  if (!existsSync(lockedDir)) {
    return null;
  }
  const files = readdirSync(lockedDir).filter(
    (f) => f.startsWith(`${templateCode}__`) && f.endsWith('.contract.locked.json')
  );
  if (files.length !== 1) {
    return null;
  }
  return join(lockedDir, files[0]);
}

// ─── Cache freshness check ─────────────────────────────────────────────────────

/**
 * Check if render-diff is fresh (newer than both normalized DOCX and locked contract).
 */
export function isRenderDiffFresh(root, templateCode) {
  const diffPath = renderDiffPath(root, templateCode);
  const docxPath = normalizedDocxPath(root, templateCode);
  const contractPath = findLockedContractFile(root, templateCode);

  if (!existsSync(diffPath)) {
    return { fresh: false, reason: 'render-diff not found' };
  }

  const diffStat = statSync(diffPath);
  const diffMtime = diffStat.mtimeMs;

  if (!existsSync(docxPath)) {
    return { fresh: false, reason: 'normalized DOCX not found' };
  }
  const docxStat = statSync(docxPath);
  const docxMtime = docxStat.mtimeMs;

  // If contract not found, use docx time only
  let sourceMtime = docxMtime;
  if (contractPath && existsSync(contractPath)) {
    const contractStat = statSync(contractPath);
    sourceMtime = Math.max(docxMtime, contractStat.mtimeMs);
  }

  const fresh = diffMtime >= sourceMtime;

  return {
    fresh,
    reason: fresh
      ? 'render-diff is newer than sources'
      : 'render-diff is stale',
    diffMtime,
    sourceMtime,
  };
}

/**
 * Read existing render-diff if available.
 */
export function readRenderDiff(root, templateCode) {
  const diffPath = renderDiffPath(root, templateCode);

  if (!existsSync(diffPath)) {
    return null;
  }

  try {
    const content = readFileSync(diffPath, 'utf8');
    const data = JSON.parse(content);
    return {
      data,
      path: diffPath,
      readAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      data: null,
      path: diffPath,
      readAt: new Date().toISOString(),
      error: error.message,
    };
  }
}

// ─── Render gate execution ──────────────────────────────────────────────────────

/**
 * Run render-form-fidelity-gate for a single BM.
 * Does NOT throw on FAIL - FAIL is a valid result.
 */
export async function runRenderGate(root, templateCode) {
  const docxPath = normalizedDocxPath(root, templateCode);
  const contractPath = findLockedContractFile(root, templateCode);
  const reportJson = renderDiffPath(root, templateCode);

  // Validate inputs
  if (!existsSync(docxPath)) {
    return {
      templateCode,
      status: 'ERROR',
      exitCode: null,
      stdout: '',
      stderr: `Normalized DOCX not found: ${docxPath}`,
      reportJson,
      parsedReport: null,
      cacheHit: false,
      error: 'Normalized DOCX not found',
    };
  }

  if (!contractPath || !existsSync(contractPath)) {
    return {
      templateCode,
      status: 'ERROR',
      exitCode: null,
      stdout: '',
      stderr: `Locked contract not found: ${contractPath}`,
      reportJson,
      parsedReport: null,
      cacheHit: false,
      error: 'Locked contract not found',
    };
  }

  // Run the gate
  const scriptPath = join(root, 'scripts', 'audit', 'render-form-fidelity-gate.mjs');
  const args = ['--root', root, '--template-code', templateCode];

  let stdout = '';
  let stderr = '';
  let exitCode = null;

  try {
    const result = await execFileAsync('node', [scriptPath, ...args], {
      timeout: 60000, // 60 second timeout
      cwd: root,
    });
    stdout = result.stdout || '';
    stderr = result.stderr || '';
    exitCode = 0;
  } catch (error) {
    // execFile throws on non-zero exit code
    stdout = error.stdout || '';
    stderr = error.stderr || '';
    exitCode = error.code ?? 1;
  }

  // Determine status from exit code
  const status = exitCode === 0 ? 'PASS' : exitCode === 1 ? 'FAIL' : 'ERROR';

  // Read the report
  let parsedReport = null;
  if (existsSync(reportJson)) {
    try {
      const content = readFileSync(reportJson, 'utf8');
      parsedReport = JSON.parse(content);
    } catch {
      // Report exists but couldn't parse
    }
  }

  return {
    templateCode,
    status,
    exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
    reportJson,
    parsedReport,
    cacheHit: false,
    error: exitCode === null ? 'Execution failed' : null,
  };
}

// ─── Batch execution ────────────────────────────────────────────────────────────

/**
 * Run render gates for multiple BMs with controlled concurrency.
 * Does NOT abort on FAIL - FAIL is a valid result per BM.
 */
export async function runRenderGateBatch(
  root,
  templateCodes,
  options = {}
) {
  const { concurrency = 2, force = false } = options;

  const results = [];

  // Process in chunks
  for (let i = 0; i < templateCodes.length; i += concurrency) {
    const chunk = templateCodes.slice(i, i + concurrency);

    const chunkPromises = chunk.map(async (templateCode) => {
      // Check cache if not forcing
      if (!force) {
        const freshness = isRenderDiffFresh(root, templateCode);
        if (freshness.fresh) {
          // Use cached result
          const cached = readRenderDiff(root, templateCode);
          if (cached && cached.data) {
            return {
              templateCode,
              status: cached.data.status || 'UNKNOWN',
              exitCode: cached.data.status === 'PASS' ? 0 : 1,
              stdout: '',
              stderr: '',
              reportJson: cached.path,
              parsedReport: cached.data,
              cacheHit: true,
              error: null,
            };
          }
        }
      }

      // Run the gate
      return await runRenderGate(root, templateCode);
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    // Progress update
    const done = Math.min(i + concurrency, templateCodes.length);
    console.error(`[render-gate-cache] ${done}/${templateCodes.length} processed`);
  }

  // Summary
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  const errorCount = results.filter((r) => r.status === 'ERROR').length;
  const cacheHits = results.filter((r) => r.cacheHit).length;

  console.error(
    `[render-gate-cache] Summary: ${passCount} PASS, ${failCount} FAIL, ${errorCount} ERROR, ${cacheHits} cache hits`
  );

  return {
    results,
    summary: {
      total: templateCodes.length,
      pass: passCount,
      fail: failCount,
      error: errorCount,
      cacheHits,
    },
  };
}

/**
 * Read or run render gate for a single BM.
 * Uses cache if fresh, otherwise runs.
 */
export async function getRenderGateResult(root, templateCode, options = {}) {
  const { force = false } = options;

  if (!force) {
    const freshness = isRenderDiffFresh(root, templateCode);
    if (freshness.fresh) {
      const cached = readRenderDiff(root, templateCode);
      if (cached && cached.data) {
        return {
          ...cached.data,
          cacheHit: true,
          templateCode,
        };
      }
    }
  }

  return await runRenderGate(root, templateCode);
}
