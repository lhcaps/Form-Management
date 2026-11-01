import { strict as assert } from 'node:assert';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import PizZip from 'pizzip';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('runtime renderer writes a sampled form to an explicit isolated output root', async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), 'qllaw-runtime-render-'));
  execFileSync('node', [
    'scripts/runtime-rollout/render-runtime-batch.mjs',
    '--only=BM-003',
    '--audit-only',
    `--output-root=${outputRoot}`,
  ], { cwd: repoRoot, stdio: 'pipe' });

  const resultPath = path.join(outputRoot, 'BM-003', 'final-verdict.json');
  const result = JSON.parse(await readFile(resultPath, 'utf8'));
  assert.equal(result.bmCode, 'BM-003');
  assert.equal(result.formDir, path.join(outputRoot, 'BM-003'));
});

test('runtime renderer produces byte-identical R1 output across independent BM-098 runs', async () => {
  const firstRoot = await mkdtemp(path.join(os.tmpdir(), 'qllaw-runtime-render-'));
  execFileSync('node', [
    'scripts/runtime-rollout/render-runtime-batch.mjs',
    '--only=BM-098',
    '--audit-only',
    `--output-root=${firstRoot}`,
  ], { cwd: repoRoot, stdio: 'pipe' });
  await new Promise((resolve) => setTimeout(resolve, 2_200));
  const secondRoot = await mkdtemp(path.join(os.tmpdir(), 'qllaw-runtime-render-'));
  execFileSync('node', [
    'scripts/runtime-rollout/render-runtime-batch.mjs',
    '--only=BM-098',
    '--audit-only',
    `--output-root=${secondRoot}`,
  ], { cwd: repoRoot, stdio: 'pipe' });

  const first = JSON.parse(await readFile(path.join(firstRoot, 'BM-098', 'final-verdict.json'), 'utf8'));
  const second = JSON.parse(await readFile(path.join(secondRoot, 'BM-098', 'final-verdict.json'), 'utf8'));
  assert.equal(first.r1Hash, second.r1Hash);
});

test('runtime renderer gives a resolved adapter value precedence over a synthetic sentinel', async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), 'qllaw-runtime-render-'));
  execFileSync('node', [
    'scripts/runtime-rollout/render-runtime-batch.mjs',
    '--only=BM-019',
    '--audit-only',
    `--output-root=${outputRoot}`,
  ], { cwd: repoRoot, stdio: 'pipe' });

  const docx = await readFile(path.join(outputRoot, 'BM-019', 'R1.docx'));
  const xml = new PizZip(docx).file('word/document.xml')?.asText() || '';
  assert.ok(xml.includes('BM-019-R1-Signer'));
});
