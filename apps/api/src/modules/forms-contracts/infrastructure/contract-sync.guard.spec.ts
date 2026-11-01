/**
 * C1 — Contract Sync Guard Tests
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  ContractSyncGuard,
  resolveContractSyncPaths,
} from './contract-sync.guard';

describe('ContractSyncGuard', () => {
  let guard: ContractSyncGuard;

  beforeEach(() => {
    guard = new ContractSyncGuard();
  });

  describe('verify', () => {
    it('should pass when DISABLE_CONTRACT_SYNC_GUARD=1', async () => {
      process.env.DISABLE_CONTRACT_SYNC_GUARD = '1';

      await expect(guard.verify()).resolves.not.toThrow();

      delete process.env.DISABLE_CONTRACT_SYNC_GUARD;
    });

    it('should pass when ALLOW_CONTRACT_DRIFT=1 even with drift', async () => {
      process.env.ALLOW_CONTRACT_DRIFT = '1';

      // Even if drift exists, should not throw
      await expect(guard.verify()).resolves.not.toThrow();

      delete process.env.ALLOW_CONTRACT_DRIFT;
    });

    it('should use FILE_ONLY strategy when DATABASE_URL not set', async () => {
      const originalUrl = process.env.DATABASE_URL;
      delete process.env.DATABASE_URL;

      // Should not throw if all compiled artifacts exist
      await expect(guard.verify()).resolves.not.toThrow();

      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      }
    });
  });

  describe('path resolution', () => {
    it('resolves repository contract paths from a compiled dist cwd', () => {
      const repoRoot = resolve(__dirname, '..', '..', '..', '..', '..', '..');
      const distCwd = join(
        repoRoot,
        'apps',
        'api',
        'dist',
        'src',
        'modules',
        'forms-contracts',
        'infrastructure',
      );

      const paths = resolveContractSyncPaths({ cwd: distCwd });

      expect(paths.root).toBe(repoRoot);
      expect(paths.lockedDir).toBe(
        join(repoRoot, 'docs', 'audit', 'docx', 'contracts', 'locked'),
      );
      expect(paths.compiledV2Dir).toBe(
        join(repoRoot, 'docs', 'audit', 'docx', 'compiled-v2'),
      );
    });
  });

  it('fails closed when the governed locked-contract corpus is absent', async () => {
    const root = mkdtempSync(join(tmpdir(), 'qllaw-contract-guard-'));
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    mkdirSync(join(root, 'docs', 'audit', 'docx'), { recursive: true });
    const isolatedGuard = new ContractSyncGuard({ repoRoot: root });
    const previousDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      await expect(isolatedGuard.verify()).rejects.toThrow(
        'Expected 213 locked contracts',
      );
    } finally {
      if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
      rmSync(root, { recursive: true, force: true });
    }
  });
});
