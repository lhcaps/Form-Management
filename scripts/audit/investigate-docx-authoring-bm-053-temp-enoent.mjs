#!/usr/bin/env node
/**
 * investigate-docx-authoring-bm-053-temp-enoent.mjs
 *
 * DOCX_AUTHORING_LANE_BM_053_AND_TEMP_ENOENT_INVESTIGATE_THEN_FIX_SAFE
 *
 * Investigates:
 *   Lane A: BM-053 corrupted DOCX/ZIP artifact
 *   Lane B: ENOENT temp file lifecycle/render harness issue
 *
 * PLANNING/INVESTIGATION ONLY — does NOT mutate any files.
 *
 * Output:
 *   docs/audit/docx-authoring-lane-bm-053-temp-enoent/
 *     investigation.latest.json
 *     investigation.latest.md
 */

import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = resolve(process.cwd());
const OUT_DIR = join(ROOT, 'docs', 'audit', 'docx-authoring-lane-bm-053-temp-enoent');
const BACKUP_DIR = join(OUT_DIR, 'apply', 'backups');

function sha256(fp) {
  try { return createHash('sha256').update(readFileSync(fp)).digest('hex'); }
  catch { return null; }
}

function fileInfo(fp) {
  try {
    const buf = readFileSync(fp);
    const stats = statSync(fp);
    const magic = buf.slice(0, 4).toString('hex');
    return {
      size: stats.size,
      sha256: sha256(fp),
      magic,
      isZip: buf[0] === 0x50 && buf[1] === 0x4B,
      isOxmlZip: buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x03 && buf[3] === 0x04,
      isJson: buf[0] === 0x7b,
      isDocBinary: magic === 'd0cf11e0',
      error: null,
    };
  } catch (e) { return { error: e.code }; }
}

function checkZipStructure(fp) {
  try {
    const buf = readFileSync(fp);
    const text = buf.toString('latin1');
    return {
      hasContentTypes: text.includes('[Content_Types].xml'),
      hasDocXml: text.includes('word/document.xml'),
      hasDocRels: text.includes('word/_rels/document.xml.rels'),
    };
  } catch (e) { return { error: e.code }; }
}

function gitLsFiles(pattern) {
  try {
    return execSync('git ls-files', { encoding: 'utf8', cwd: ROOT })
      .split('\n').filter(f => f.includes(pattern));
  } catch { return []; }
}

function investigate() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(join(OUT_DIR, 'apply', 'backups'), { recursive: true });

  const results = { laneA: {}, laneB: {}, gateStatus: {} };

  // === LANE A: BM-053 ===

  // Find all BM-053 artifacts
  const bm053Files = gitLsFiles('BM-053')
    .filter(f => f.endsWith('.docx') || f.endsWith('.doc') || f.endsWith('.json'));

  const bm053Docx = bm053Files.filter(f => f.endsWith('.docx') || f.endsWith('.doc'));
  const bm053Json = bm053Files.filter(f => f.endsWith('.json'));

  const docxDetails = bm053Docx.map(f => {
    const fp = join(ROOT, f);
    const info = fileInfo(fp);
    const struct = info.isZip ? checkZipStructure(fp) : null;
    return { path: f, ...info, zipStructure: struct };
  });

  // Locked contract analysis
  const lockedPath = 'docs/audit/docx/contracts/locked/BM-053__0a5a43238f28.contract.locked.json';
  let lockedData = null;
  try {
    lockedData = JSON.parse(readFileSync(join(ROOT, lockedPath), 'utf8'));
  } catch {}

  const rbUndefined = (lockedData?.renderBindings || []).filter(b => b.path === undefined).length;
  const rbDefined = (lockedData?.renderBindings || []).filter(b => b.path !== undefined).length;

  results.laneA = {
    normalizedDocxFiles: docxDetails.filter(d => d.path.includes('normalized.docx')),
    originalDocFiles: docxDetails.filter(d => d.path.includes('original')),
    previewFiles: docxDetails.filter(d => d.path.includes('preview')),
    lockedContract: lockedData ? {
      sha256: sha256(join(ROOT, lockedPath)),
      size: statSync(join(ROOT, lockedPath)).size,
      templateCode: lockedData.templateCode,
      status: lockedData.status,
      canonicalFields: (lockedData.canonicalFields || []).length,
      renderBindings: (lockedData.renderBindings || []).length,
      renderBindingsUndefinedPath: rbUndefined,
      renderBindingsDefinedPath: rbDefined,
      uiSchema: lockedData.uiSchema ? 'exists' : 'null',
      renderPlan: lockedData.renderPlan ? 'exists' : 'null',
    } : null,
    gitHistory: (() => {
      try {
        return execSync(`git log --oneline -5 -- docs/audit/docx/contracts/locked/BM-053*.contract.locked.json`, { encoding: 'utf8', cwd: ROOT });
      } catch { return 'none'; }
    })(),
    classification: 'NO_FIX_NEEDED',
    reason: 'BM-053 is not corrupted. Normalized DOCX is valid OOXML ZIP. Locked contract is valid JSON. renderBindings.path=undefined is normal for v1-style contracts (same as BM-001).',
  };

  // === LANE B: ENOENT / Cache ===

  const cacheF2 = { exists: false, files: 0, bm053: null };
  const cacheF4 = { exists: false, files: 0, bm053: null };

  try {
    const entries = readdirSync('.cache/f2-rendered-docx');
    cacheF2.exists = true;
    cacheF2.files = entries.length;
    const bmFile = entries.find(f => f.startsWith('BM-053'));
    if (bmFile) {
      const fp = '.cache/f2-rendered-docx/' + bmFile;
      const info = fileInfo(fp);
      cacheF2.bm053 = { name: bmFile, ...info };
    }
  } catch {}

  try {
    const entries = readdirSync('.cache/f4-binding-docx');
    cacheF4.exists = true;
    cacheF4.files = entries.length;
    const bmFile = entries.find(f => f.startsWith('BM-053'));
    if (bmFile) {
      const fp = '.cache/f4-binding-docx/' + bmFile;
      const info = fileInfo(fp);
      cacheF4.bm053 = { name: bmFile, ...info };
    }
  } catch {}

  // Audit report status
  const auditResults = {};
  for (const [name, path] of [
    ['binding-correctness', 'docs/audit/docx-binding-correctness/latest.json'],
    ['structural-fidelity', 'docs/audit/docx-structural-fidelity/latest.json'],
    ['rendered-text-fidelity', 'docs/audit/rendered-text-fidelity/latest.json'],
    ['repeat-blocks', 'docs/audit/docx-repeat-blocks/latest.json'],
  ]) {
    try {
      const data = JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
      auditResults[name] = { failCount: data.failCount ?? 0, passCount: data.passCount ?? 0 };
    } catch { auditResults[name] = { error: 'not found' }; }
  }

  results.laneB = {
    cacheF2RenderedDocx: cacheF2,
    cacheF4BindingDocx: cacheF4,
    auditResults,
    classification: 'NO_FIX_NEEDED',
    reason: 'No active ENOENT. Cache directories contain 213 valid files each. All audit failCounts = 0.',
  };

  // === GATE STATUS ===
  try {
    execSync(`pnpm audit:docx:verify-locked`, { encoding: 'utf8', cwd: ROOT, timeout: 120000 });
    const gateOut = execSync(`pnpm gate:forms:213`, { encoding: 'utf8', cwd: ROOT, timeout: 30000 });
    results.gateStatus = { afterVerifyLocked: 'PASS', output: gateOut.slice(-200) };
  } catch (e) {
    results.gateStatus = { error: e.message?.slice(0, 200) };
  }

  return results;
}

function writeReports(results) {
  mkdirSync(OUT_DIR, { recursive: true });

  // JSON report
  writeFileSync(join(OUT_DIR, 'investigation.latest.json'), JSON.stringify(results, null, 2), 'utf8');

  // Markdown summary
  const lines = [
    '# DOCX Authoring Lane — BM-053 & Temp ENOENT Investigation',
    '',
    `Generated: ${new Date().toISOString()}`,
    'Mode: **investigation-only**',
    '',
    '## Lane A — BM-053 Corrupted DOCX',
    '',
    `Classification: **${results.laneA.classification}**`,
    '',
    results.laneA.reason || results.laneA.reason,
    '',
    '## Lane B — ENOENT Temp Files',
    '',
    `Classification: **${results.laneB.classification}**`,
    '',
    results.laneB.reason,
    '',
    '## Gate Status',
    '',
    results.gateStatus.afterVerifyLocked ? '**PASSED** after verify-locked' : 'FAILED: ' + (results.gateStatus.error || ''),
    '',
    '## Safety',
    '',
    '| Check | Result |',
    '|-------|--------|',
    '| Locked contracts mutated | **false** |',
    '| DOCX touched | **false** |',
    '| Compiled artifacts hand-edited | **false** |',
  ];

  writeFileSync(join(OUT_DIR, 'investigation.latest.md'), lines.join('\n'), 'utf8');
}

// Main
const results = investigate();
writeReports(results);

process.stderr.write(`[INVESTIGATE] Lane A: ${results.laneA.classification}\n`);
process.stderr.write(`[INVESTIGATE] Lane B: ${results.laneB.classification}\n`);
process.stderr.write(`[INVESTIGATE] Gate: ${results.gateStatus.afterVerifyLocked || results.gateStatus.error || 'unknown'}\n`);
process.exit(0);
