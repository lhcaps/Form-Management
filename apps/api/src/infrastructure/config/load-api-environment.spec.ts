import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadApiEnvironment } from './load-api-environment';

describe('loadApiEnvironment', () => {
  it('keeps platform values ahead of root and package-local env files', () => {
    const root = mkdtempSync(join(tmpdir(), 'qllaw-api-env-'));
    const apiRoot = join(root, 'apps', 'api');
    mkdirSync(apiRoot, { recursive: true });
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    writeFileSync(
      join(root, '.env'),
      'ROOT_ONLY=root\nSHARED=root\nROOT_BEATS_PACKAGE=root\n',
    );
    writeFileSync(
      join(apiRoot, '.env'),
      'PACKAGE_ONLY=package\nSHARED=package\nROOT_BEATS_PACKAGE=package\n',
    );
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      SHARED: 'platform',
    };

    try {
      const report = loadApiEnvironment({ cwd: apiRoot, env });

      expect(env.SHARED).toBe('platform');
      expect(env.ROOT_ONLY).toBe('root');
      expect(env.ROOT_BEATS_PACKAGE).toBe('root');
      expect(env.PACKAGE_ONLY).toBe('package');
      expect(report.loadedFiles).toEqual([
        join(root, '.env'),
        join(apiRoot, '.env'),
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('can make the repository root env authoritative for local tooling', () => {
    const root = mkdtempSync(join(tmpdir(), 'qllaw-api-env-'));
    const apiRoot = join(root, 'apps', 'api');
    mkdirSync(apiRoot, { recursive: true });
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    writeFileSync(join(root, '.env'), 'DATABASE_URL=root-url\n');
    writeFileSync(join(apiRoot, '.env'), 'DATABASE_URL=package-url\n');
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: 'development',
      DATABASE_URL: 'stale-shell-url',
    };

    try {
      loadApiEnvironment({
        cwd: apiRoot,
        env,
        rootEnvOverridesExisting: true,
      });

      expect(env.DATABASE_URL).toBe('root-url');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('does not load repository env files in production', () => {
    const root = mkdtempSync(join(tmpdir(), 'qllaw-api-env-'));
    const apiRoot = join(root, 'apps', 'api');
    mkdirSync(apiRoot, { recursive: true });
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    writeFileSync(join(root, '.env'), 'MUST_NOT_LOAD=root\n');
    writeFileSync(join(apiRoot, '.env'), 'MUST_NOT_LOAD=package\n');
    const env: NodeJS.ProcessEnv = { NODE_ENV: 'production' };

    try {
      const report = loadApiEnvironment({ cwd: apiRoot, env });

      expect(env.MUST_NOT_LOAD).toBeUndefined();
      expect(report).toEqual({ mode: 'production', loadedFiles: [] });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
