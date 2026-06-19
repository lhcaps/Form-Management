#!/usr/bin/env node
/**
 * smoke-bm001-shadow-render.mjs
 *
 * Smoke + generation test for BM-001 shadow render pipeline.
 *
 * Modes:
 *   --inspect-existing   Read and verify existing artifacts only.
 *   (default)           Generate shadow renders from scenario fixtures.
 *
 * Environment:
 *   DOCUMENT_RENDERER_MODE        shadow | active | off  (default: shadow)
 *   DOCUMENT_RENDERER_CONTRACT_TEMPLATES  comma-separated template codes
 *   SMOKE_STRICT                  true | false (default: false)
 *   SMOKE_SCENARIOS               comma-separated scenario IDs (default: all)
 *   API_BASE                      API base URL (default: http://localhost:3001/api/v1)
 *
 * Exit codes:
 *   0  — all checks pass
 *   1  — infra failure (API unreachable, manifest missing, etc.)
 *   2  — semantic/format/package gate failure, or warning in strict mode
 */

import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditDocxFormat,
  extractOoxmlPartsFromDocx,
} from '../apps/api/src/modules/documents/rendering/infrastructure/docx-format-auditor.ts';
import {
  compareDocxSemantic,
  extractDocumentXmlFromZip,
} from '../apps/api/src/modules/documents/rendering/infrastructure/docx-semantic-comparator.ts';
import {
  auditDocxPackageIntegrity,
  renderDocxTemplate,
} from '../apps/api/src/modules/documents/rendering/infrastructure/docx-template-renderer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPO_ROOT = join(__dirname, '..');
const SCENARIOS_DIR = join(REPO_ROOT, 'test', 'fixtures', 'rendering', 'bm001-shadow-scenarios');
const CONTRACTS_ROOT = join(REPO_ROOT, 'docs', 'audit', 'docx', 'contracts');
const LOCKED_CONTRACT_PATH = join(CONTRACTS_ROOT, 'locked', 'BM-001__f4c2aa3682d3.contract.locked.json');
const TEMPLATE_ROOT = join(REPO_ROOT, 'storage', 'templates', 'normalized-docx', 'BM-001');
const TEMPLATE_PATH = join(TEMPLATE_ROOT, 'BM-001_normalized.docx');
const SHADOW_OUTPUT_DIR = join(REPO_ROOT, 'storage', 'generated', 'shadow-renders', 'BM-001');

const RENDERER_MODE = process.env.DOCUMENT_RENDERER_MODE ?? 'shadow';
const CONTRACT_TEMPLATES = (process.env.DOCUMENT_RENDERER_CONTRACT_TEMPLATES ?? '').split(',').map((t) => t.trim()).filter(Boolean);
const STRICT = process.env.SMOKE_STRICT === 'true';
const INSPECT_ONLY = process.argv.includes('--inspect-existing');
const SCENARIOS_FILTER = (process.env.SMOKE_SCENARIOS ?? '').split(',').map((t) => t.trim()).filter(Boolean);

function log(level, ...args) {
  const prefix = level === 'FAIL' ? '[FAIL]' : level === 'WARN' ? '[WARN]' : level === 'PASS' ? '[PASS]' : '[INFO]';
  console.log(prefix, ...args);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

// ─── Locked contract loader ───────────────────────────────────────────────────

function loadLockedContract() {
  if (!existsSync(LOCKED_CONTRACT_PATH)) {
    throw new Error(`Locked contract not found: ${LOCKED_CONTRACT_PATH}`);
  }
  const raw = readFileSync(LOCKED_CONTRACT_PATH, 'utf-8');
  return JSON.parse(raw);
}

// ─── Scenario loader ─────────────────────────────────────────────────────────

function loadScenarios() {
  if (!existsSync(SCENARIOS_DIR)) {
    throw new Error(`Scenarios directory not found: ${SCENARIOS_DIR}`);
  }
  const files = readdirSync(SCENARIOS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No scenario JSON files found in ${SCENARIOS_DIR}`);
  }

  return files.map((file) => {
    const path = join(SCENARIOS_DIR, file);
    return JSON.parse(readFileSync(path, 'utf-8'));
  }).filter((s) => {
    if (SCENARIOS_FILTER.length === 0) return true;
    return SCENARIOS_FILTER.includes(s.scenarioId);
  });
}

// ─── Template loader ────────────────────────────────────────────────────────

function loadTemplate() {
  if (!existsSync(TEMPLATE_PATH)) {
    throw new Error(`Normalized template not found: ${TEMPLATE_PATH}`);
  }
  return readFileSync(TEMPLATE_PATH);
}

// ─── Render engine (simplified, in-process) ────────────────────────────────

function buildBindingMap(contract, formData) {
  const bindings = new Map();
  for (const binding of contract.renderBindings ?? []) {
    const rawValue = formData[binding.from];
    const resolvedValue = resolveValue(rawValue, binding.transform, binding.fallback);
    bindings.set(binding.slotId, resolvedValue);
  }
  return bindings;
}

function resolveValue(value, transform, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback ?? '';
  }
  switch (transform) {
    case 'identity':
    case 'derived':
    case 'ordinal':
    case 'ordinal_wards':
    case 'wardname':
    case 'reporttype':
      return typeof value === 'string' ? value : String(value);
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value;
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value;
    case 'trim':
      return typeof value === 'string' ? value.trim() : value;
    case 'date':
      try {
        return new Date(value).toLocaleDateString('vi-VN');
      } catch {
        return typeof value === 'string' ? value : String(value);
      }
    case 'dateiso':
      try {
        return new Date(value).toISOString().split('T')[0];
      } catch {
        return typeof value === 'string' ? value : String(value);
      }
    case 'titlecase':
      if (typeof value !== 'string') return value;
      return value.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.substr(1).toLowerCase());
    default:
      return typeof value === 'string' ? value : String(value);
  }
}

async function renderDocx(templateBuffer, bindingMap) {
  const buffer = renderDocxTemplate(templateBuffer, bindingMap);
  const xml = await extractDocumentXmlFromZip(buffer);
  return { buffer, xml };
}

// ─── Semantic comparison ─────────────────────────────────────────────────────

function formatSemanticMd(result) {
  const lines = [
    '# DOCX Semantic Diff',
    '',
    `**Status**: \`${result.status}\``,
    '',
    '| Metric | Value |',
    '|--------|-------|',
    `| Legacy text length | ${result.legacyTextLength} |`,
    `| Contract text length | ${result.contractTextLength} |`,
    '',
  ];
  if (result.missingExpectedText.length > 0) {
    lines.push('## Missing Expected Text');
    for (const t of result.missingExpectedText) lines.push(`- "${t}"`);
    lines.push('');
  }
  if (result.unexpectedUnresolvedPlaceholders.length > 0) {
    lines.push('## Unexpected Unresolved Placeholders');
    for (const p of result.unexpectedUnresolvedPlaceholders) lines.push(`- \`${p}\``);
    lines.push('');
  }
  if (result.unexpectedLiteralValues.length > 0) {
    lines.push('## Unexpected Literal Values');
    for (const value of result.unexpectedLiteralValues) lines.push(`- \`${value}\``);
    lines.push('');
  }
  if (result.notes.length > 0) {
    lines.push('## Notes');
    for (const n of result.notes) lines.push(`- ${n}`);
    lines.push('');
  }
  return lines.join('\n');
}

// ─── Format auditor (simplified) ─────────────────────────────────────────────

function formatAuditMd(audit) {
  const lines = [
    '# DOCX Format Audit',
    '',
    `**Overall Status**: \`${audit.status}\``,
    '',
    '| Check ID | Requirement | Status | Evidence |',
    '|----------|-------------|--------|---------|',
  ];
  for (const check of audit.checks) {
    const evidence = check.evidence ?? '-';
    lines.push(`| ${check.id} | ${check.requirement} | \`${check.status}\` | ${evidence} |`);
  }
  return lines.join('\n');
}

function formatPackageIntegrityMd(integrity) {
  const lines = [
    '# DOCX Package Integrity',
    '',
    `**Status**: \`${integrity.status}\``,
    '',
    `- Missing parts: ${integrity.missingParts.length}`,
    `- Changed preserved parts: ${integrity.changedPreservedParts.length}`,
  ];
  if (integrity.missingParts.length > 0) {
    lines.push('', '## Missing Parts');
    for (const part of integrity.missingParts) lines.push(`- \`${part}\``);
  }
  if (integrity.changedPreservedParts.length > 0) {
    lines.push('', '## Changed Preserved Parts');
    for (const part of integrity.changedPreservedParts) {
      lines.push(`- \`${part}\``);
    }
  }
  return lines.join('\n');
}

// ─── Render one scenario ────────────────────────────────────────────────────

async function renderScenario(scenario, contract, templateBuffer) {
  const bindingMap = buildBindingMap(contract, scenario.formData);
  const { buffer: docxBuffer, xml: renderedXml } = await renderDocx(templateBuffer, bindingMap);

  const legacyXml = await extractDocumentXmlFromZip(templateBuffer);
  const semanticResult = compareDocxSemantic(
    legacyXml,
    renderedXml,
    scenario.expectedText ?? [],
  );
  const formatResult = auditDocxFormat(
    await extractOoxmlPartsFromDocx(docxBuffer),
  );
  const packageIntegrity = auditDocxPackageIntegrity(
    templateBuffer,
    docxBuffer,
  );

  const ts = timestamp();
  const scenarioOutputDir = join(SHADOW_OUTPUT_DIR, `${scenario.scenarioId}-${ts}`);
  mkdirSync(scenarioOutputDir, { recursive: true });

  // Write contract.docx
  writeFileSync(join(scenarioOutputDir, 'contract.docx'), docxBuffer);

  // Write semantic-diff.json
  writeFileSync(join(scenarioOutputDir, 'semantic-diff.json'), JSON.stringify(semanticResult, null, 2));

  // Write semantic-diff.md
  writeFileSync(join(scenarioOutputDir, 'semantic-diff.md'), formatSemanticMd(semanticResult));

  // Write format-audit.json
  writeFileSync(join(scenarioOutputDir, 'format-audit.json'), JSON.stringify(formatResult, null, 2));

  // Write format-audit.md
  writeFileSync(join(scenarioOutputDir, 'format-audit.md'), formatAuditMd(formatResult));

  writeFileSync(
    join(scenarioOutputDir, 'package-integrity.json'),
    JSON.stringify(packageIntegrity, null, 2),
  );
  writeFileSync(
    join(scenarioOutputDir, 'package-integrity.md'),
    formatPackageIntegrityMd(packageIntegrity),
  );

  // Write manifest.json
  const contractBuffer = readFileSync(LOCKED_CONTRACT_PATH);
  const manifest = {
    schemaVersion: 2,
    scenarioId: scenario.scenarioId,
    templateCode: 'BM-001',
    timestamp: ts,
    description: scenario.description,
    provenance: {
      renderer: 'shared-full-package-docx-renderer/v1',
      sourceSha256: contract.docx?.sha256 ?? null,
      normalizedTemplateSha256: sha256(templateBuffer),
      lockedContractSha256: sha256(contractBuffer),
      renderedDocxSha256: sha256(docxBuffer),
    },
    renderPlan: {
      sourceId: contract.sourceId,
      contractStatus: contract.status,
      fieldCount: contract.canonicalFields?.length ?? 0,
      bindingCount: contract.renderBindings?.length ?? 0,
    },
    semanticComparison: semanticResult,
    formatAudit: formatResult,
    packageIntegrity,
    artifacts: {
      docx: join(scenarioOutputDir, 'contract.docx'),
      semanticDiffJson: join(scenarioOutputDir, 'semantic-diff.json'),
      semanticDiffMd: join(scenarioOutputDir, 'semantic-diff.md'),
      formatAuditJson: join(scenarioOutputDir, 'format-audit.json'),
      formatAuditMd: join(scenarioOutputDir, 'format-audit.md'),
      packageIntegrityJson: join(scenarioOutputDir, 'package-integrity.json'),
      packageIntegrityMd: join(scenarioOutputDir, 'package-integrity.md'),
    },
  };
  writeFileSync(join(scenarioOutputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  return {
    scenarioId: scenario.scenarioId,
    outputDir: scenarioOutputDir,
    semanticResult,
    formatResult,
    packageIntegrity,
  };
}

// ─── Inspect existing artifacts ─────────────────────────────────────────────

async function inspectExisting() {
  log('INFO', '=== INSPECT MODE ===');
  if (!existsSync(SHADOW_OUTPUT_DIR)) {
    log('WARN', `Shadow output dir does not exist: ${SHADOW_OUTPUT_DIR}`);
    return { scenarioResults: [], infraFail: false, hasWarning: false };
  }

  const entries = readdirSync(SHADOW_OUTPUT_DIR)
    .map((name) => ({ name, stat: statSync(join(SHADOW_OUTPUT_DIR, name)) }))
    .filter((e) => e.stat.isDirectory())
    .sort((a, b) => b.stat.mtime - a.stat.mtime);

  log('INFO', `Found ${entries.length} shadow render directories`);
  const latestByScenario = new Map();
  let staleArtifactCount = 0;

  for (const entry of entries) {
    const manifestPath = join(SHADOW_OUTPUT_DIR, entry.name, 'manifest.json');
    if (!existsSync(manifestPath)) {
      staleArtifactCount += 1;
      log('WARN', `No manifest in ${entry.name}`);
      continue;
    }

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const isStale =
        manifest.schemaVersion !== 2 ||
        manifest.provenance?.renderer !== 'shared-full-package-docx-renderer/v1';
      if (isStale) {
        staleArtifactCount += 1;
        log(
          'WARN',
          `Stale artifact: ${entry.name} (schema=${manifest.schemaVersion ?? 'unknown'}, renderer=${manifest.provenance?.renderer ?? 'unknown'})`,
        );
        continue;
      }
      const result = {
        scenarioId: manifest.scenarioId ?? entry.name,
        outputDir: join(SHADOW_OUTPUT_DIR, entry.name),
        semanticResult: manifest.semanticComparison,
        formatResult: manifest.formatAudit,
        packageIntegrity: manifest.packageIntegrity,
        provenance: manifest.provenance,
        schemaVersion: manifest.schemaVersion,
      };
      if (!latestByScenario.has(result.scenarioId)) {
        latestByScenario.set(result.scenarioId, result);
      }
    } catch (err) {
      staleArtifactCount += 1;
      log('WARN', `Failed to read manifest in ${entry.name}: ${err.message}`);
    }
  }

  if (staleArtifactCount > 0) {
    log(
      'WARN',
      `${staleArtifactCount} stale or non-shared-renderer artifacts present (not used as approval evidence).`,
    );
  }

  const results = [...latestByScenario.values()];
  let hasBlocker = results.length !== 5;

  for (const result of results) {
    const blockers = [];
    if (result.schemaVersion !== 2) blockers.push('stale manifest schema');
    if (result.provenance?.renderer !== 'shared-full-package-docx-renderer/v1') {
      blockers.push('missing shared-renderer provenance');
    }
    if (result.semanticResult?.status === 'fail') blockers.push('semantic fail');
    if (result.formatResult?.status === 'fail') blockers.push('format fail');
    if (result.packageIntegrity?.status !== 'pass') {
      blockers.push('package integrity not proven');
    }

    if (blockers.length > 0) {
      hasBlocker = true;
      log('FAIL', `${result.scenarioId}: ${blockers.join('; ')}`);
    } else {
      log(
        'PASS',
        `${result.scenarioId}: semantic=${result.semanticResult?.status}, format=${result.formatResult?.status}, package=pass`,
      );
    }
  }

  return {
    scenarioResults: results,
    infraFail: false,
    hasWarning: staleArtifactCount > 0,
    hasBlocker,
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== BM-001 Shadow Render Smoke Test ===\n');

  if (INSPECT_ONLY) {
    const result = await inspectExisting();
    if (result.hasBlocker) process.exit(2);
    // Warnings (stale artifacts) are reported but do not block; the readiness
    // checker is the source of truth for cutover decisions.
    process.exit(0);
    return;
  }

  // Default mode: generate shadow renders
  let infraFail = false;
  let hasWarning = false;
  let hasBlocker = false;
  let infraWarnings = [];

  // 1. Check renderer mode
  if (RENDERER_MODE !== 'shadow') {
    log('WARN', `DOCUMENT_RENDERER_MODE is "${RENDERER_MODE}", expected "shadow".`);
    infraWarnings.push(`Renderer mode is "${RENDERER_MODE}"`);
  }

  // 2. Check contract templates
  if (CONTRACT_TEMPLATES.length > 0 && !CONTRACT_TEMPLATES.includes('BM-001')) {
    log('FAIL', `DOCUMENT_RENDERER_CONTRACT_TEMPLATES does not include BM-001: [${CONTRACT_TEMPLATES.join(', ')}]`);
    infraFail = true;
  }

  // 3. Check locked contract exists
  if (!existsSync(LOCKED_CONTRACT_PATH)) {
    log('FAIL', `Locked contract not found: ${LOCKED_CONTRACT_PATH}`);
    infraFail = true;
  } else {
    log('PASS', `Locked contract: ${LOCKED_CONTRACT_PATH}`);
  }

  // 4. Check template exists
  if (!existsSync(TEMPLATE_PATH)) {
    log('FAIL', `Normalized template not found: ${TEMPLATE_PATH}`);
    infraFail = true;
  } else {
    log('PASS', `Template: ${TEMPLATE_PATH}`);
  }

  if (infraFail) {
    log('FAIL', 'INFRA FAILURE — required files missing');
    process.exit(1);
  }

  // 5. Load contract and scenarios
  const contract = loadLockedContract();
  const scenarios = loadScenarios();
  const templateBuffer = loadTemplate();

  log('INFO', `Locked contract: ${contract.templateCode} (${contract.status})`);
  log('INFO', `Rendering ${scenarios.length} scenarios to ${SHADOW_OUTPUT_DIR}`);
  mkdirSync(SHADOW_OUTPUT_DIR, { recursive: true });

  // 6. Render each scenario
  const results = [];
  for (const scenario of scenarios) {
    log('INFO', `Rendering scenario: ${scenario.scenarioId}`);
    try {
      const result = await renderScenario(scenario, contract, templateBuffer);
      results.push(result);

      if (result.semanticResult.status === 'fail') {
        log('FAIL', `${scenario.scenarioId}: semantic FAIL — missing: ${result.semanticResult.missingExpectedText.join(', ')}`);
        hasBlocker = true;
      } else if (result.semanticResult.status === 'warning') {
        log('WARN', `${scenario.scenarioId}: semantic warning — ${result.semanticResult.notes.join('; ')}`);
        hasWarning = true;
      } else {
        log('PASS', `${scenario.scenarioId}: semantic PASS`);
      }

      if (result.formatResult.status === 'fail') {
        log('FAIL', `${scenario.scenarioId}: format FAIL`);
        hasBlocker = true;
      } else if (result.formatResult.status === 'warning') {
        log('WARN', `${scenario.scenarioId}: format warning — some checks not detectable or weak`);
        hasWarning = true;
      } else {
        log('PASS', `${scenario.scenarioId}: format PASS`);
      }

      if (result.packageIntegrity.status === 'fail') {
        log(
          'FAIL',
          `${scenario.scenarioId}: package integrity FAIL — missing=${result.packageIntegrity.missingParts.length}, changed=${result.packageIntegrity.changedPreservedParts.length}`,
        );
        hasBlocker = true;
      } else {
        log('PASS', `${scenario.scenarioId}: package integrity PASS`);
      }
    } catch (err) {
      log('FAIL', `${scenario.scenarioId}: render error — ${err.message}`);
      hasWarning = true;
      infraFail = true;
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  const passCount = results.filter((r) => r.semanticResult.status === 'pass').length;
  const warnCount = results.filter((r) => r.semanticResult.status === 'warning').length;
  const failCount = results.filter((r) => r.semanticResult.status === 'fail').length;

  console.log(`  Scenarios rendered: ${results.length}`);
  console.log(`  Semantic pass: ${passCount}, warning: ${warnCount}, fail: ${failCount}`);

  if (infraFail) {
    log('FAIL', 'INFRA FAILURE — one or more renders failed');
    process.exit(1);
  }

  if (hasBlocker) {
    log('FAIL', 'One or more hard verification gates failed');
    process.exit(2);
  }

  if (hasWarning) {
    log('WARN', 'Warnings detected — see above');
    if (STRICT) process.exit(2);
  } else {
    log('PASS', 'All checks passed');
  }

  process.exit(0);
}

main().catch((err) => {
  log('FAIL', `Script crashed: ${err.message}`);
  process.exit(1);
});
