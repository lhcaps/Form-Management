import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

function validManifest(scenarioId) {
  return {
    schemaVersion: 2,
    scenarioId,
    provenance: {
      renderer: 'shared-full-package-docx-renderer/v1',
    },
    semanticComparison: {
      status: 'warning',
      missingExpectedText: [],
      unexpectedLiteralValues: [],
      unexpectedUnresolvedPlaceholders: [],
    },
    formatAudit: {
      status: 'warning',
    },
    packageIntegrity: {
      status: 'pass',
    },
  };
}

function writeManifest(shadowDir, scenarioId, timestamp, manifest) {
  const dir = join(shadowDir, `${scenarioId}-${timestamp}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return dir;
}

function makeIsolatedDir(label) {
  return mkdtempSync(join(tmpdir(), `qllaw-bm001-smoke-${label}-`));
}

test('smoke inspect classifies the latest per scenario as pass when all gates green', () => {
  const dir = makeIsolatedDir('all-green');
  const scenarios = [
    '01-basic-valid',
    '02-long-source-report',
    '03-organization-informant',
    '04-missing-optional-fields',
    '05-vietnamese-diacritics-and-addresses',
  ];
  for (const scenarioId of scenarios) {
    writeManifest(dir, scenarioId, '2026-06-20T00-00-00-000Z', validManifest(scenarioId));
  }
  const result = simulateSmokeInspect(dir);
  assert.equal(result.blocker, false);
  assert.equal(result.passingScenarios, 5);
  rmSync(dir, { recursive: true, force: true });
});

test('smoke inspect blocks when a latest manifest is missing semantic pass', () => {
  const dir = makeIsolatedDir('semantic-fail');
  const scenarioId = '01-basic-valid';
  const bad = validManifest(scenarioId);
  bad.semanticComparison.status = 'fail';
  bad.semanticComparison.missingExpectedText = ['Nguyễn Văn Minh'];
  writeManifest(dir, scenarioId, '2026-06-20T00-00-00-000Z', bad);

  const result = simulateSmokeInspect(dir);
  assert.equal(result.blocker, true);
  assert.ok(result.blockers.some((b) => b.includes('semantic fail')));
  rmSync(dir, { recursive: true, force: true });
});

test('smoke inspect blocks when package integrity is not pass', () => {
  const dir = makeIsolatedDir('package-integrity-fail');
  const scenarioId = '01-basic-valid';
  const bad = validManifest(scenarioId);
  bad.packageIntegrity.status = 'fail';
  bad.packageIntegrity.missingParts = ['word/styles.xml'];
  writeManifest(dir, scenarioId, '2026-06-20T00-00-00-000Z', bad);

  const result = simulateSmokeInspect(dir);
  assert.equal(result.blocker, true);
  assert.ok(result.blockers.some((b) => b.includes('package integrity')));
  rmSync(dir, { recursive: true, force: true });
});

test('smoke inspect blocks when manifest schema is stale', () => {
  const dir = makeIsolatedDir('stale-schema');
  const scenarios = [
    '01-basic-valid',
    '02-long-source-report',
    '03-organization-informant',
    '04-missing-optional-fields',
  ];
  for (const scenarioId of scenarios) {
    writeManifest(dir, scenarioId, '2026-06-20T00-00-00-000Z', validManifest(scenarioId));
  }
  // Add 5th scenario with stale schema
  const bad = validManifest('05-vietnamese-diacritics-and-addresses');
  bad.schemaVersion = 1;
  writeManifest(dir, '05-vietnamese-diacritics-and-addresses', '2026-06-20T00-00-00-000Z', bad);

  const result = simulateSmokeInspect(dir);
  assert.equal(result.blocker, true);
  assert.equal(result.staleArtifactCount, 1);
  assert.equal(result.passingScenarios, 4);
  rmSync(dir, { recursive: true, force: true });
});

test('smoke inspect blocks when renderer provenance is not shared', () => {
  const dir = makeIsolatedDir('untrusted-renderer');
  const scenarios = [
    '01-basic-valid',
    '02-long-source-report',
    '03-organization-informant',
    '04-missing-optional-fields',
  ];
  for (const scenarioId of scenarios) {
    writeManifest(dir, scenarioId, '2026-06-20T00-00-00-000Z', validManifest(scenarioId));
  }
  // Add 5th scenario with untrusted renderer
  const bad = validManifest('05-vietnamese-diacritics-and-addresses');
  bad.provenance.renderer = 'legacy-renderer/v0';
  writeManifest(dir, '05-vietnamese-diacritics-and-addresses', '2026-06-20T00-00-00-000Z', bad);

  const result = simulateSmokeInspect(dir);
  assert.equal(result.blocker, true);
  assert.equal(result.staleArtifactCount, 1);
  rmSync(dir, { recursive: true, force: true });
});

test('smoke inspect warns on stale artifacts but does not block', () => {
  const dir = makeIsolatedDir('stale-artifact-warn');
  const scenarios = [
    '01-basic-valid',
    '02-long-source-report',
    '03-organization-informant',
    '04-missing-optional-fields',
    '05-vietnamese-diacritics-and-addresses',
  ];
  for (const scenarioId of scenarios) {
    writeManifest(dir, scenarioId, '2026-06-20T00-00-00-000Z', validManifest(scenarioId));
  }
  // Add a stale (pre-D.2.3A) artifact
  mkdirSync(join(dir, '01-basic-valid-2026-06-15T00-00-00-000Z'), { recursive: true });

  const result = simulateSmokeInspect(dir);
  assert.equal(result.blocker, false);
  assert.equal(result.warning, true);
  assert.equal(result.staleArtifactCount, 1);
  rmSync(dir, { recursive: true, force: true });
});

test('smoke inspect requires 5 unique scenarios to pass', () => {
  const dir = makeIsolatedDir('scenario-coverage');
  for (const scenarioId of ['01-basic-valid', '02-long-source-report', '03-organization-informant', '04-missing-optional-fields']) {
    writeManifest(dir, scenarioId, '2026-06-20T00-00-00-000Z', validManifest(scenarioId));
  }

  const result = simulateSmokeInspect(dir);
  assert.equal(result.blocker, true);
  rmSync(dir, { recursive: true, force: true });
});

test('smoke inspect accepts a manifest with warning status (warnings do not block)', () => {
  const dir = makeIsolatedDir('warning-accepted');
  const scenarios = [
    '01-basic-valid',
    '02-long-source-report',
    '03-organization-informant',
    '04-missing-optional-fields',
    '05-vietnamese-diacritics-and-addresses',
  ];
  for (const scenarioId of scenarios) {
    const manifest = validManifest(scenarioId);
    manifest.semanticComparison.status = 'warning';
    manifest.formatAudit.status = 'warning';
    writeManifest(dir, scenarioId, '2026-06-20T00-00-00-000Z', manifest);
  }

  const result = simulateSmokeInspect(dir);
  assert.equal(result.blocker, false);
  assert.equal(result.warning, false);
  rmSync(dir, { recursive: true, force: true });
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function simulateSmokeInspect(shadowDir) {
  if (!existsSync(shadowDir)) {
    return { blocker: false, warning: false, passingScenarios: 0, staleArtifactCount: 0, blockers: [] };
  }
  const entries = readdirSync(shadowDir)
    .map((name) => ({ name, stat: statSync(join(shadowDir, name)) }))
    .filter((e) => e.stat.isDirectory())
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  const latestByScenario = new Map();
  let staleArtifactCount = 0;

  for (const entry of entries) {
    const manifestPath = join(shadowDir, entry.name, 'manifest.json');
    if (!existsSync(manifestPath)) {
      staleArtifactCount += 1;
      continue;
    }
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      const isStale =
        manifest.schemaVersion !== 2 ||
        manifest.provenance?.renderer !== 'shared-full-package-docx-renderer/v1';
      if (isStale) {
        staleArtifactCount += 1;
        continue;
      }
      if (!latestByScenario.has(manifest.scenarioId ?? entry.name)) {
        latestByScenario.set(manifest.scenarioId ?? entry.name, manifest);
      }
    } catch {
      staleArtifactCount += 1;
    }
  }

  const results = [...latestByScenario.values()];
  const blockers = [];
  let blocker = results.length !== 5;
  for (const r of results) {
    const itemBlockers = [];
    if (r.schemaVersion !== 2) itemBlockers.push('stale manifest schema');
    if (r.provenance?.renderer !== 'shared-full-package-docx-renderer/v1') {
      itemBlockers.push('missing shared-renderer provenance');
    }
    if (r.semanticComparison?.status === 'fail') itemBlockers.push('semantic fail');
    if (r.formatAudit?.status === 'fail') itemBlockers.push('format fail');
    if (r.packageIntegrity?.status !== 'pass') {
      itemBlockers.push('package integrity not proven');
    }
    if (itemBlockers.length > 0) {
      blocker = true;
      blockers.push(...itemBlockers);
    }
  }

  return {
    blocker,
    warning: staleArtifactCount > 0,
    passingScenarios: results.length,
    staleArtifactCount,
    blockers,
  };
}
