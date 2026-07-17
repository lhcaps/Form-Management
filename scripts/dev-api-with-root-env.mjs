#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const apiRoot = resolve(projectRoot, 'apps/api');
const rootEnvPath = resolve(projectRoot, '.env');

export function buildApiDevEnvironment({ inheritedEnv, rootEnv }) {
  const mergedEnv = {
    ...inheritedEnv,
    ...rootEnv,
  };

  // Preserve explicit isolation coordinates while keeping root .env
  // authoritative for database, Clerk, and application settings.
  for (const key of ['API_PORT', 'PORT', 'WEB_ORIGIN', 'API_CORS_ORIGIN']) {
    if (inheritedEnv[key]) mergedEnv[key] = inheritedEnv[key];
  }

  return mergedEnv;
}

function fail(message) {
  console.error(`[dev-api-with-root-env] ${message}`);
  process.exit(1);
}

function main() {
  if (!existsSync(rootEnvPath)) {
    fail(`Missing root .env: ${rootEnvPath}`);
  }

  const rootEnv = {};
  const result = loadDotEnv({
    path: rootEnvPath,
    processEnv: rootEnv,
    override: true,
    quiet: true,
  });

  if (result.error) {
    fail(`Cannot load root .env: ${result.error.message}`);
  }

  const mergedEnv = buildApiDevEnvironment({
    inheritedEnv: process.env,
    rootEnv,
  });

  if (!mergedEnv.DATABASE_URL?.startsWith('mysql://')) {
    fail('Root DATABASE_URL is missing or is not a mysql:// URL.');
  }

  const nestBinCandidates = [
    resolve(apiRoot, 'node_modules/@nestjs/cli/bin/nest.js'),
    resolve(projectRoot, 'node_modules/@nestjs/cli/bin/nest.js'),
  ];
  const nestBin = nestBinCandidates.find((candidate) => existsSync(candidate));

  if (!nestBin) {
    fail(`Cannot find Nest CLI binary.\n${nestBinCandidates.map((candidate) => `- ${candidate}`).join('\n')}`);
  }

  console.log(`[dev-api-with-root-env] Loaded ${Object.keys(rootEnv).length} vars from root .env`);
  console.log(`[dev-api-with-root-env] Running: node ${nestBin} start ${process.argv.slice(2).join(' ')}`.trim());
  console.log(`[dev-api-with-root-env] cwd=${apiRoot}`);

  const child = spawn(process.execPath, [nestBin, 'start', ...process.argv.slice(2)], {
    cwd: apiRoot,
    env: mergedEnv,
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (error) => {
    console.error('[dev-api-with-root-env] Failed to start Nest CLI:', error);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[dev-api-with-root-env] Nest CLI exited by signal ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 0);
  });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
