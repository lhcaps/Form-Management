// Activation preflight: records path-scoped ownership of files this wave will
// touch. Reads git state without altering it. Writes only a single JSON artifact
// under the locked-authority-rebase owner directory.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_DIR = path.join(REPO_ROOT, 'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'activation-preflight.json');

const AUTHORITY_SCOPE_PREFIXES = [
  'scripts/runtime-rollout/',
  'scripts/audit/',
  'scripts/docx-contract/',
  'scripts/generate-bm-panel-registry.mjs',
  'scripts/dev-doctor.mjs',
  'scripts/docker-verify.mjs',
  'docs/audit/final-213-customer-ready/runtime-rollout/',
  'docs/audit/docx/',
  'docs/audit/infrastructure-modernization/',
  'docs/audit/sot-gates-v1/',
  'docs/audit/unified-bm-workspace/',
  'docs/audit/clerk-e2e-auth/',
  'docs/audit/docker-production/',
  'docs/audit/document-fidelity/',
  'docs/audit/forms-runtime-bridge/',
  'docs/audit/forms-runtime-forensic/',
  'docs/audit/runtime-readiness/',
  'docs/audit/user-readiness/',
  'docs/operations/',
  'docs/superpowers/',
  'docs/LOCAL_UNLOCK_213.md',
  'packages/form-contracts/',
  'apps/api/',
  'apps/web/',
  'test/',
  'tests/',
  'tests/e2e/',
  'infra/',
  'docker/',
  'docker-compose',
  'storage/',
  '.env',
  '.cursor/',
  '.ai/',
  'package.json',
  'pnpm-lock.yaml',
  '.gitignore',
];

const EXECUTION_OWNED_NEW_FILES = [
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/activation-preflight.json',
  'scripts/runtime-rollout/lib/locked-runtime-index.mjs',
  'scripts/runtime-rollout/lib/locked-runtime-index.test.mjs',
  'scripts/runtime-rollout/lib/locked-hash-model.mjs',
  'scripts/runtime-rollout/lib/locked-hash-model.test.mjs',
  'scripts/runtime-rollout/inspect-locked-contract-schema-v2.mjs',
  'scripts/runtime-rollout/inspect-locked-contract-schema-v2.test.mjs',
  'scripts/runtime-rollout/classify-locked-slot-evidence.mjs',
  'scripts/runtime-rollout/classify-locked-slot-evidence.test.mjs',
  'scripts/runtime-rollout/build-locked-contract-index-v2.1.mjs',
  'scripts/runtime-rollout/build-locked-contract-index-v2.1.test.mjs',
  'scripts/runtime-rollout/trace-runtime-authority-consumers.mjs',
  'scripts/runtime-rollout/trace-runtime-authority-consumers.test.mjs',
  'scripts/runtime-rollout/build-locked-authority-crosswalk.mjs',
  'scripts/runtime-rollout/build-locked-authority-crosswalk.test.mjs',
  'scripts/runtime-rollout/run-locked-shadow-transition.mjs',
  'scripts/runtime-rollout/run-locked-shadow-transition.test.mjs',
  'scripts/runtime-rollout/guard-locked-runtime-authority.mjs',
  'scripts/runtime-rollout/guard-locked-runtime-authority.test.mjs',
  'scripts/runtime-rollout/locked-runtime-authority-mutation-suite.mjs',
  'scripts/runtime-rollout/build-locked-r1-r2-payloads.mjs',
  'scripts/runtime-rollout/build-locked-r1-r2-payloads.test.mjs',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-runtime-index.v2.1.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-schema-profile.v2.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-contract-schema-profile.v2.md',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-slot-evidence-classification.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-consumer-trace.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-crosswalk.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-shadow-transition.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-guard-result.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-authority-mutation-results.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads/BM-NNN/R1-input.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads/BM-NNN/R2-input.json',
  'docs/audit/final-213-customer-ready/runtime-rollout/locked-authority-rebase/locked-r1-r2-payloads/BM-NNN/payload-validation.json',
];

function safeStdout(cmd, args) {
  try {
    return execFileSync(cmd, args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    return `${error?.stdout ?? ''}${error?.stderr ?? ''}`;
  }
}

function readDiffNameStatus(scopeArgs) {
  const raw = safeStdout('git', ['diff', '--name-status', '--', ...scopeArgs]);
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split('\t');
      return { status, path: rest.join('\t') };
    });
}

function classifyPath(relativePath) {
  return AUTHORITY_SCOPE_PREFIXES.some((prefix) => relativePath.startsWith(prefix))
    ? 'authority-scope'
    : 'unrelated';
}

function sha256OfFile(filePath) {
  if (!existsSync(filePath)) return null;
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const currentHead = safeStdout('git', ['rev-parse', 'HEAD']).trim();
  const branch = safeStdout('git', ['branch', '--show-current']).trim();
  const stagedCount = safeStdout('git', ['diff', '--cached', '--name-only']).trim().split('\n').filter(Boolean).length;
  const trackedDeletedFiles = safeStdout('git', ['ls-files', '--deleted']).trim().split('\n').filter(Boolean);

  const statusRaw = safeStdout('git', ['status', '--short', '--branch']);
  const statusLines = statusRaw.split('\n').filter(Boolean);

  const diffEntries = readDiffNameStatus([
    'scripts',
    'docs/audit',
    'docs/operations',
    'docs/superpowers',
    'docs/LOCAL_UNLOCK_213.md',
    'packages/form-contracts',
    'apps/api',
    'apps/web',
    'test',
    'tests',
    'infra',
    'docker',
    'docker-compose',
    'storage',
    '.env',
    '.cursor',
    '.ai',
    'package.json',
    'pnpm-lock.yaml',
    '.gitignore',
  ]);

  const preExistingModifiedFiles = diffEntries.map((entry) => entry.path).sort();
  const preExistingUntrackedFiles = statusLines
    .filter((line) => line.startsWith('??'))
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .sort();

  const unrelatedDirtyFiles = preExistingModifiedFiles
    .filter((p) => classifyPath(p) === 'unrelated')
    .sort();

  const ownedFileBeforeHashes = {};
  for (const newFile of EXECUTION_OWNED_NEW_FILES) {
    const abs = path.join(REPO_ROOT, newFile);
    if (existsSync(abs)) {
      ownedFileBeforeHashes[newFile] = sha256OfFile(abs);
    }
  }

  const report = {
    schema: 'qllaw.activation_preflight/v1',
    writtenAt: new Date().toISOString(),
    currentHead,
    branch,
    stagedCount,
    trackedDeletedFiles,
    preExistingModifiedFiles,
    preExistingUntrackedFiles: preExistingUntrackedFiles.slice(0, 200),
    preExistingUntrackedFileCount: preExistingUntrackedFiles.length,
    authorityScope: {
      dirtyPathCount: diffEntries.length,
      authorityScopeDirtyPathCount: preExistingModifiedFiles.filter((p) => classifyPath(p) === 'authority-scope').length,
      unrelatedDirtyPathCount: unrelatedDirtyFiles.length,
      unrelatedDirtyFilesSample: unrelatedDirtyFiles.slice(0, 50),
    },
    executionOwnedFiles: EXECUTION_OWNED_NEW_FILES,
    ownedFileBeforeHashes,
    executionOwnedFilesExistingAtBaseline: Object.keys(ownedFileBeforeHashes),
    unrelatedDirtyFiles,
    invariant: {
      requireZeroStaged: stagedCount === 0,
      requireNoUnrelatedMutations: unrelatedDirtyFiles.length === 0,
      requireExistingLockedCorpus: existsSync(path.join(REPO_ROOT, 'docs/audit/docx/contracts/locked')),
    },
    status: 'RUNNING',
    productionReady: false,
  };

  writeFileSync(OUTPUT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`OK preflight: ${currentHead} @ ${branch}; staged=${stagedCount}; executionOwned=${EXECUTION_OWNED_NEW_FILES.length}; preExistingUntracked=${preExistingUntrackedFiles.length}`);
  console.log(`     artifact: ${path.relative(REPO_ROOT, OUTPUT_FILE)}`);
}

main();
