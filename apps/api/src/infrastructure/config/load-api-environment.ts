import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveRepoRoot } from '../../common/repo-root';

export type LoadApiEnvironmentOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /**
   * Local CLI tooling can opt in to the repository root `.env` taking
   * precedence over stale inherited shell variables. Package-local `.env`
   * remains lower precedence so the root stays the single local authority.
   */
  rootEnvOverridesExisting?: boolean;
};

export type ApiEnvironmentLoadReport = {
  mode: string;
  loadedFiles: string[];
};

/**
 * Load local API env files without allowing them to replace platform values.
 * Precedence is: platform environment > repository .env > apps/api/.env.
 * Production relies exclusively on the platform environment.
 */
export function loadApiEnvironment(
  options: LoadApiEnvironmentOptions = {},
): ApiEnvironmentLoadReport {
  const env = options.env ?? process.env;
  const mode = (env.NODE_ENV ?? 'development').trim().toLowerCase();

  if (mode === 'production') {
    return { mode, loadedFiles: [] };
  }

  const repoRoot = resolveRepoRoot({
    cwd: options.cwd,
    repoRoot: env.REPO_ROOT,
  });
  const candidates = [
    resolve(repoRoot, '.env'),
    resolve(repoRoot, 'apps', 'api', '.env'),
  ];
  const loadedFiles: string[] = [];

  for (const [index, path] of candidates.entries()) {
    if (!existsSync(path)) continue;
    const result = loadDotenv({
      path,
      processEnv: env,
      override: index === 0 && options.rootEnvOverridesExisting === true,
      quiet: true,
    });
    if (result.error) throw result.error;
    loadedFiles.push(path);
  }

  return { mode, loadedFiles };
}
