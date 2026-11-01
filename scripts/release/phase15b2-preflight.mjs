#!/usr/bin/env node
/**
 * Phase 15B.2 — PHASE 0: Preflight + remote topology
 * Captures git state, dirty tree hash, ahead/behind counts, and writes
 * docs/audit/final-213-customer-ready/release-integration/phase15b2-preflight.json
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'audit',
  'final-213-customer-ready',
  'release-integration',
);

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: opts.cwd ?? process.cwd(),
    encoding: 'utf8',
    shell: false,
    ...opts,
  });
}

function gitOut(args) {
  const r = run('git', args);
  if (r.status !== 0) {
    return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', exit: r.status ?? -1 };
  }
  return { stdout: (r.stdout ?? '').replace(/\r?\n$/, ''), stderr: r.stderr ?? '', exit: 0 };
}

function hashDirtyTree(items) {
  const h = crypto.createHash('sha256');
  for (const it of items.sort()) h.update(it + '\n');
  return h.digest('hex');
}

function main() {
  const statusShort = gitOut(['status', '--short', '--branch']);
  const porcelain = gitOut(['status', '--porcelain=v2']);
  const head = gitOut(['rev-parse', 'HEAD']);
  const branch = gitOut(['branch', '--show-current']);
  const cached = gitOut(['diff', '--cached', '--name-only']);
  const unstaged = gitOut(['diff', '--name-status']);
  const untracked = gitOut(['ls-files', '--others', '--exclude-standard']);
  const diffCheck = gitOut(['diff', '--check']);
  const untrackedCount = untracked.stdout ? untracked.stdout.split('\n').filter(Boolean).length : 0;

  const fetch = gitOut(['fetch', 'origin', '--prune', '--negotiate-only', '--dry-run']);
  // Use a real fetch separately below if no commits are pulled; here we attempt fetch non-destructively.
  // We rely on `git rev-parse origin/<branch>` for head-after-fetch (without mutating).
  const remoteBranchHead = gitOut(['rev-parse', `origin/${branch.stdout || 'HEAD'}`]);
  const remoteMainHead = gitOut(['rev-parse', 'origin/main']);
  const mergeBase = gitOut(['merge-base', 'HEAD', `origin/${branch.stdout || 'HEAD'}`]);
  const ahead = gitOut(['rev-list', '--count', `origin/${branch.stdout || 'HEAD'}..HEAD`]);
  const behind = gitOut(['rev-list', '--count', `HEAD..origin/${branch.stdout || 'HEAD'}`]);

  const trackedModified = unstaged.stdout
    .split('\n')
    .filter((l) => l && !l.startsWith('D'))
    .map((l) => l.split('\t').slice(1).join('\t'));
  const trackedDeleted = unstaged.stdout
    .split('\n')
    .filter((l) => l && l.startsWith('D'))
    .map((l) => l.split('\t').slice(1).join('\t'));
  const cachedList = cached.stdout ? cached.stdout.split('\n').filter(Boolean) : [];
  const untrackedList = untracked.stdout ? untracked.stdout.split('\n').filter(Boolean) : [];

  // Top-level group counts from modified paths.
  const groupCount = (list, prefixes) =>
    list.filter((p) => prefixes.some((pre) => p === pre || p.startsWith(pre + '/') || p.startsWith(pre))).length;
  const allChanged = [...trackedModified, ...trackedDeleted, ...cachedList, ...untrackedList];
  const groups = {
    'apps/api': groupCount(allChanged, ['apps/api']),
    'apps/web': groupCount(allChanged, ['apps/web']),
    'packages/form-contracts': groupCount(allChanged, ['packages/form-contracts']),
    'apps/api/scripts': groupCount(allChanged, ['apps/api/scripts']),
    'scripts': groupCount(allChanged, ['scripts']),
    'docs/audit': groupCount(allChanged, ['docs/audit']),
    'docs': allChanged.filter((p) => p.startsWith('docs/') && !p.startsWith('docs/audit/')).length,
    'config': groupCount(allChanged, [
      '.env.example',
      '.gitignore',
      '.cursor',
      '.ai',
      'package.json',
      'pnpm-workspace.yaml',
      'pnpm-lock.yaml',
    ]),
  };

  const dirtyItems = [
    ...cachedList,
    ...trackedModified,
    ...trackedDeleted,
    ...untrackedList,
  ];
  const dirtySetSha256 = hashDirtyTree(dirtyItems);

  const report = {
    phase: '15B.2',
    scope: 'Phase 0 — preflight + remote topology',
    capturedAt: new Date().toISOString(),
    branch: branch.stdout,
    localHead: head.stdout,
    remoteBranchHead: remoteBranchHead.stdout,
    remoteMainHead: remoteMainHead.stdout,
    mergeBase: mergeBase.stdout,
    aheadCount: Number(ahead.stdout || 0),
    behindCount: Number(behind.stdout || 0),
    trackedModified,
    trackedDeleted,
    untracked: untrackedList,
    stagedCount: cachedList.length,
    dirtySetSha256,
    gitDiffCheck: diffCheck.stdout,
    gitDiffNameStatus: unstaged.stdout,
    untrackedCount,
    totalChangedPaths: allChanged.length,
    groupCounts: groups,
    fetchResult: {
      exit: fetch.exit,
      stderr: fetch.stderr,
      stdout: fetch.stdout,
    },
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, 'phase15b2-preflight.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${out}`);
  console.log(
    `head=${report.localHead} branch=${report.branch} ahead=${report.aheadCount} behind=${report.behindCount} staged=${report.stagedCount}`,
  );
}

main();
