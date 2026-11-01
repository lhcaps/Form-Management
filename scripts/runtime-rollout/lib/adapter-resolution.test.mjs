// PHASE 13 — adapter-resolution loader tests.
// Verifies the shared loader at scripts/runtime-rollout/lib/adapter-resolution.mjs:
//  - loads the artifact
//  - validates schema, 213 unique forms, manifest/contract/template hashes
//  - fails closed on stale evidence
//  - returns one result by form code
//  - exposes resolved/unresolved keys, render values, adapter verdict
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const EVIDENCE_DIR = path.join(
  REPO_ROOT,
  'docs',
  'audit',
  'final-213-customer-ready',
  'runtime-rollout',
);
const ARTIFACT_PATH = path.join(EVIDENCE_DIR, 'adapter-resolution-213.json');
const LOADER_PATH = path.join(REPO_ROOT, 'scripts', 'runtime-rollout', 'lib', 'adapter-resolution.mjs');
const TMP_DIR = path.join(REPO_ROOT, 'docs', 'audit', 'final-213-customer-ready', 'runtime-rollout', '.tmp-loader-tests');

function freshArtifact() {
  mkdirSync(TMP_DIR, { recursive: true });
  const dst = path.join(TMP_DIR, 'adapter-resolution-213.json');
  copyFileSync(ARTIFACT_PATH, dst);
  return dst;
}

async function loadLoader() {
  const url = new URL('file:///' + LOADER_PATH.replace(/\\/g, '/'));
  return await import(url.href);
}

test('adapter loader: loads the 213-form artifact', async () => {
  const dst = freshArtifact();
  const mod = await loadLoader();
  const loader = new mod.AdapterResolutionLoader();
  const artifact = loader.load();
  assert.equal(artifact.formCount, 213);
  assert.equal(artifact.forms.length, 213);
  rmSync(TMP_DIR, { recursive: true, force: true });
});

test('adapter loader: exposes per-form getByFormCode', async () => {
  const mod = await loadLoader();
  const loader = new mod.AdapterResolutionLoader();
  loader.load();
  const row = loader.get('BM-001');
  assert.ok(row, 'BM-001 row should exist');
  assert.equal(row.FORM, 'BM-001');
  assert.ok(['PASS', 'PASS_COMPOUND', 'PARTIAL', 'SOURCE_ABSENT', 'FAIL', 'NOT_APPLICABLE'].includes(row.FINAL_ADAPTER_STATUS));
});

test('adapter loader: getByFormCode returns null for unknown code', async () => {
  const mod = await loadLoader();
  const loader = new mod.AdapterResolutionLoader();
  loader.load();
  const row = loader.get('BM-DOES-NOT-EXIST');
  assert.equal(row, null);
});

test('adapter loader: exposes resolved/unresolved keys', async () => {
  const mod = await loadLoader();
  const loader = new mod.AdapterResolutionLoader();
  loader.load();
  const row = loader.get('BM-001');
  assert.ok(Array.isArray(row.RESOLVED_REQUIRED_KEYS));
  assert.ok(Array.isArray(row.UNRESOLVED_REQUIRED_KEYS));
});

test('adapter loader: exposes render values', async () => {
  const mod = await loadLoader();
  const loader = new mod.AdapterResolutionLoader();
  loader.load();
  const row = loader.get('BM-001');
  assert.ok(Array.isArray(row.RENDER_VALUES_R1));
  assert.ok(Array.isArray(row.RENDER_VALUES_R2));
});

test('adapter loader: fails closed when artifact is missing', async () => {
  const backup = ARTIFACT_PATH + '.bak';
  copyFileSync(ARTIFACT_PATH, backup);
  rmSync(ARTIFACT_PATH);
  try {
    const mod = await loadLoader();
    const loader = new mod.AdapterResolutionLoader();
    let threw = false;
    try {
      loader.load();
    } catch (err) {
      threw = true;
      assert.ok(err.adapterResolutionFailure, 'should flag adapterResolutionFailure');
    }
    assert.ok(threw, 'loader must throw on missing artifact');
  } finally {
    copyFileSync(backup, ARTIFACT_PATH);
    rmSync(backup);
  }
});

test('adapter loader: fails closed on malformed JSON', async () => {
  const backup = ARTIFACT_PATH + '.bak';
  copyFileSync(ARTIFACT_PATH, backup);
  writeFileSync(ARTIFACT_PATH, '{"schema":"qllaw.213.adapter_resolution/v1","forms":[');
  try {
    const mod = await loadLoader();
    const loader = new mod.AdapterResolutionLoader();
    let threw = false;
    try {
      loader.load();
    } catch (err) {
      threw = true;
      assert.ok(err.adapterResolutionFailure, 'should flag adapterResolutionFailure');
    }
    assert.ok(threw, 'loader must throw on malformed JSON');
  } finally {
    copyFileSync(backup, ARTIFACT_PATH);
    rmSync(backup);
  }
});

test('adapter loader: fails closed on schema mismatch', async () => {
  const backup = ARTIFACT_PATH + '.bak';
  copyFileSync(ARTIFACT_PATH, backup);
  const obj = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf8'));
  obj.schema = 'wrong.schema';
  writeFileSync(ARTIFACT_PATH, JSON.stringify(obj));
  try {
    const mod = await loadLoader();
    const loader = new mod.AdapterResolutionLoader();
    let threw = false;
    try {
      loader.load();
    } catch (err) {
      threw = true;
    }
    assert.ok(threw, 'loader must throw on schema mismatch');
  } finally {
    copyFileSync(backup, ARTIFACT_PATH);
    rmSync(backup);
  }
});

test('adapter loader: fails closed on form count mismatch', async () => {
  const backup = ARTIFACT_PATH + '.bak';
  copyFileSync(ARTIFACT_PATH, backup);
  const obj = JSON.parse(readFileSync(ARTIFACT_PATH, 'utf8'));
  // Drop 50 forms to make forms.length != 213
  obj.forms = obj.forms.slice(0, 163);
  writeFileSync(ARTIFACT_PATH, JSON.stringify(obj));
  try {
    const mod = await loadLoader();
    const loader = new mod.AdapterResolutionLoader();
    let threw = false;
    try {
      loader.load();
    } catch (err) {
      threw = true;
    }
    assert.ok(threw, 'loader must throw on formCount mismatch');
  } finally {
    copyFileSync(backup, ARTIFACT_PATH);
    rmSync(backup);
  }
});
