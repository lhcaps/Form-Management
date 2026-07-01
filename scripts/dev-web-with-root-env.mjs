#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const webRoot = resolve(projectRoot, 'apps/web');
const rootEnvPath = resolve(projectRoot, '.env');

function parseDotEnv(content) {
  const env = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

if (!existsSync(rootEnvPath)) {
  console.error(`[dev-web-with-root-env] Missing root .env: ${rootEnvPath}`);
  process.exit(1);
}

const rootEnv = parseDotEnv(readFileSync(rootEnvPath, 'utf8'));

// For local dev, root .env is the source of truth.
// Let root .env override existing shell env to avoid stale bad Clerk keys.
const mergedEnv = {
  ...process.env,
  ...rootEnv,
};

const publishableKey = mergedEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
const maskedPublishableKey = publishableKey
  ? `${publishableKey.slice(0, 12)}...${publishableKey.slice(-8)}`
  : '<missing>';

console.log(
  `[dev-web-with-root-env] Loaded ${Object.keys(rootEnv).length} vars from root .env`,
);
console.log(
  `[dev-web-with-root-env] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${maskedPublishableKey}`,
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

console.log(
  `[dev-web-with-root-env] Running: node ${nextBin} dev -p 3000`,
);
console.log(`[dev-web-with-root-env] cwd=${webRoot}`);

const child = spawn(
  process.execPath,
  [nextBin, 'dev', '-p', '3000'],
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
