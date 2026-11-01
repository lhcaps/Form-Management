#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { config as loadDotEnv } from 'dotenv';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const webRoot = resolve(projectRoot, 'apps/web');
const rootEnvPath = resolve(projectRoot, '.env');

export function buildWebDevEnvironment({ inheritedEnv, rootEnv }) {
  const mergedEnv = {
    ...inheritedEnv,
    ...rootEnv,
  };

  // The Clerk and server configuration must come from root .env, but an
  // explicit API origin lets an isolated local web smoke target a non-default
  // API port without editing any env file.
  if (inheritedEnv.NEXT_PUBLIC_API_BASE_URL) {
    mergedEnv.NEXT_PUBLIC_API_BASE_URL = inheritedEnv.NEXT_PUBLIC_API_BASE_URL;
  }

  return mergedEnv;
}

export function normalizeNextArgs(args) {
  return args[0] === '--' ? args.slice(1) : args;
}

function main() {
  if (!existsSync(rootEnvPath)) {
    console.error(`[dev-web-with-root-env] Missing root .env: ${rootEnvPath}`);
    process.exit(1);
  }

  const rootEnv = {};
  const result = loadDotEnv({
    path: rootEnvPath,
    processEnv: rootEnv,
    override: true,
    quiet: true,
  });

  if (result.error) {
    console.error(`[dev-web-with-root-env] Cannot load root .env: ${result.error.message}`);
    process.exit(1);
  }

  const mergedEnv = buildWebDevEnvironment({
    inheritedEnv: process.env,
    rootEnv,
  });

  const publishableKey = mergedEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

  console.log(
    `[dev-web-with-root-env] Loaded ${Object.keys(rootEnv).length} vars from root .env`,
  );

  if (!publishableKey.startsWith('pk_test_') && !publishableKey.startsWith('pk_live_')) {
    console.error(
      '[dev-web-with-root-env] Invalid NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY prefix. Expected pk_test_ or pk_live_.',
    );
    process.exit(1);
  }

  const nextBinCandidates = [
    resolve(webRoot, 'node_modules/next/dist/bin/next'),
    resolve(projectRoot, 'node_modules/next/dist/bin/next'),
  ];

  const nextBin = nextBinCandidates.find((candidate) => existsSync(candidate));

  if (!nextBin) {
    console.error('[dev-web-with-root-env] Cannot find Next.js binary.');
    console.error(nextBinCandidates.map((candidate) => `- ${candidate}`).join('\n'));
    process.exit(1);
  }

  const nextArgs = normalizeNextArgs(process.argv.slice(2));
  const devArgs = nextArgs.length > 0 ? nextArgs : ['-p', '3000'];

  console.log(`[dev-web-with-root-env] Running: node ${nextBin} dev ${devArgs.join(' ')}`);
  console.log(`[dev-web-with-root-env] cwd=${webRoot}`);

  const child = spawn(
    process.execPath,
    [nextBin, 'dev', ...devArgs],
    {
      cwd: webRoot,
      env: mergedEnv,
      stdio: 'inherit',
      shell: false,
    },
  );

  child.on('error', (error) => {
    console.error('[dev-web-with-root-env] Failed to start Next.js:', error);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[dev-web-with-root-env] Next.js exited by signal ${signal}`);
      process.exit(1);
    }

    process.exit(code ?? 0);
  });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
