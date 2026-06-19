#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluateBm001CutoverReadiness,
  parseHumanReviewApproval,
} from './lib/bm001-cutover-readiness.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const evidenceRoot = join(
  repoRoot,
  'storage',
  'generated',
  'shadow-renders',
  'BM-001',
);
const reviewPath = resolve(
  process.env.BM001_HUMAN_REVIEW_PATH ??
    join(repoRoot, 'docs', 'reviews', 'BM-001-human-review-2026-06-20.md'),
);
const requireReady = process.argv.includes('--require-ready');

function loadLatestManifests() {
  if (!existsSync(evidenceRoot)) return [];

  const directories = readdirSync(evidenceRoot)
    .map((name) => ({
      name,
      path: join(evidenceRoot, name),
      stat: statSync(join(evidenceRoot, name)),
    }))
    .filter((entry) => entry.stat.isDirectory())
    .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);
  const latest = new Map();

  for (const directory of directories) {
    const manifestPath = join(directory.path, 'manifest.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const scenarioId = manifest.scenarioId ?? directory.name;
    if (!latest.has(scenarioId)) latest.set(scenarioId, manifest);
  }

  return [...latest.values()];
}

const manifests = loadLatestManifests();
const humanReview = existsSync(reviewPath)
  ? parseHumanReviewApproval(readFileSync(reviewPath, 'utf8'))
  : { approved: false, reviewer: '', reviewDate: '' };
const readiness = evaluateBm001CutoverReadiness(manifests, humanReview);

console.log('\n=== BM-001 Active Cutover Readiness ===\n');
console.log(`Automated ready: ${readiness.automatedReady ? 'YES' : 'NO'}`);
console.log(`Human review approved: ${humanReview.approved ? 'YES' : 'NO'}`);
console.log(`Active ready: ${readiness.activeReady ? 'YES' : 'NO'}`);
console.log(`Review file: ${reviewPath}`);
console.log(
  `Blockers: ${readiness.blockers.length > 0 ? readiness.blockers.join(', ') : 'none'}`,
);
console.log('');

if (requireReady && !readiness.activeReady) process.exit(2);
