import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import { ImportStorageService } from './import-storage.service';

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'qllaw-import-storage-'));
  writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
  const paths = new WorkspacePathsService(
    new AppConfigService({
      REPO_ROOT: root,
      STORAGE_ROOT: './custom-storage',
    }),
  );
  return { root, paths, service: new ImportStorageService(paths) };
}

describe('ImportStorageService path containment', () => {
  it('uses the configured storage root for batch and temp paths', () => {
    const fixture = createFixture();
    try {
      expect(fixture.service.getImportRoot()).toBe(
        join(fixture.root, 'custom-storage', 'imports'),
      );
      expect(fixture.service.getTempRoot()).toBe(
        join(fixture.root, 'custom-storage', 'imports', '_tmp'),
      );

      const batch = fixture.service.createBatchDirectory(
        'IMP-20260710120000-ABCDEF',
        new Date(2026, 6, 10, 12, 0, 0),
      );
      expect(batch.fullPath).toBe(
        join(
          fixture.root,
          'custom-storage',
          'imports',
          '2026',
          '07',
          '10',
          'IMP-20260710120000-ABCDEF',
        ),
      );
      expect(batch.relativePath).toBe(
        'custom-storage/imports/2026/07/10/IMP-20260710120000-ABCDEF',
      );
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('resolves only persisted relative paths contained by the import root', () => {
    const fixture = createFixture();
    try {
      const valid = 'custom-storage/imports/2026/07/10/file.docx';
      expect(fixture.service.resolveProjectPath(valid)).toBe(
        join(fixture.root, ...valid.split('/')),
      );
      expect(() =>
        fixture.service.resolveProjectPath('../outside.txt'),
      ).toThrow('outside the configured import storage root');
      expect(() =>
        fixture.service.resolveProjectPath(join(fixture.root, 'outside.txt')),
      ).toThrow('must be relative');
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it('refuses file mutations outside import storage', async () => {
    const fixture = createFixture();
    const outside = join(fixture.root, 'outside.txt');
    writeFileSync(outside, 'keep');

    try {
      await expect(fixture.service.deleteFileIfExists(outside)).rejects.toThrow(
        'outside the configured import storage root',
      );
      expect(existsSync(outside)).toBe(true);
      expect(() => fixture.service.toProjectRelativePath(outside)).toThrow(
        'outside the configured import storage root',
      );
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
