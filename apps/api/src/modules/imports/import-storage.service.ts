import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promises as fsp } from 'node:fs';
import { WorkspacePathsService } from '../../infrastructure/paths/workspace-paths.service';
import type { ImportBatchMetadata } from './import.types';

function toAsciiSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
    .toLowerCase();
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

@Injectable()
export class ImportStorageService {
  constructor(private readonly paths: WorkspacePathsService) {}

  getProjectRoot(): string {
    return this.paths.repoRoot;
  }

  getImportRoot(): string {
    return path.join(this.paths.storageRoot, 'imports');
  }

  getTempRoot(): string {
    return this.paths.importsTempRoot;
  }

  ensureDirectory(dirPath: string): void {
    fs.mkdirSync(dirPath, {
      recursive: true,
    });
  }

  createBatchCode(date = new Date()): string {
    const stamp = [
      date.getFullYear(),
      pad2(date.getMonth() + 1),
      pad2(date.getDate()),
      pad2(date.getHours()),
      pad2(date.getMinutes()),
      pad2(date.getSeconds()),
    ].join('');

    return `IMP-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  createBatchDirectory(batchCode: string, date = new Date()) {
    if (!/^IMP-\d{14}-[A-F0-9]{6}$/u.test(batchCode)) {
      throw new Error('Import batch code has an invalid format.');
    }

    const fullPath = this.assertWithinImportRoot(
      path.join(
        this.getImportRoot(),
        String(date.getFullYear()),
        pad2(date.getMonth() + 1),
        pad2(date.getDate()),
        batchCode,
      ),
    );
    const relativePath = this.toProjectRelativePath(fullPath);

    this.ensureDirectory(fullPath);

    return {
      relativePath,
      fullPath,
    };
  }

  makeSafeFileName(originalName: string, index: number): string {
    const extension = path.extname(originalName || '').toLowerCase();
    const baseName = path.basename(originalName || 'tep-tin', extension);
    const safeBase = toAsciiSlug(baseName) || `tep-tin-${index + 1}`;
    const suffix = randomBytes(2).toString('hex').toLowerCase();

    return `${String(index + 1).padStart(2, '0')}-${safeBase}-${suffix}${extension}`;
  }

  toProjectRelativePath(fullPath: string): string {
    const safePath = this.assertWithinImportRoot(fullPath);
    return path.relative(this.getProjectRoot(), safePath).replace(/\\/g, '/');
  }

  resolveProjectPath(storedPath: string | null | undefined): string | null {
    if (!storedPath) {
      return null;
    }

    if (path.isAbsolute(storedPath)) {
      throw new Error('Persisted import path must be relative.');
    }

    return this.assertWithinImportRoot(
      path.resolve(this.getProjectRoot(), storedPath),
    );
  }

  async moveTempFile(tempPath: string, destinationPath: string): Promise<void> {
    const safeTempPath = this.assertWithinImportRoot(tempPath);
    const safeDestinationPath = this.assertWithinImportRoot(destinationPath);
    this.ensureDirectory(path.dirname(safeDestinationPath));
    await fsp.rename(safeTempPath, safeDestinationPath);
  }

  async deleteFileIfExists(filePath: string | null | undefined): Promise<void> {
    if (!filePath) {
      return;
    }

    const safePath = this.assertWithinImportRoot(filePath);
    try {
      await fsp.unlink(safePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  sha256(filePath: string): string {
    const safePath = this.assertWithinImportRoot(filePath);
    return createHash('sha256').update(fs.readFileSync(safePath)).digest('hex');
  }

  async writeBatchMetadata(
    batchDirectoryRelativePath: string,
    metadata: ImportBatchMetadata,
  ): Promise<string> {
    const batchPath = this.resolveProjectPath(batchDirectoryRelativePath);
    if (!batchPath) throw new Error('Import batch path is required.');
    const metadataPath = this.assertWithinImportRoot(
      path.join(batchPath, 'metadata.json'),
    );

    await fsp.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8',
    );

    return this.toProjectRelativePath(metadataPath);
  }

  async readBatchMetadata(
    batchDirectoryRelativePath: string | null | undefined,
  ): Promise<ImportBatchMetadata | null> {
    const batchPath = this.resolveProjectPath(batchDirectoryRelativePath);

    if (!batchPath) {
      return null;
    }

    const metadataPath = this.assertWithinImportRoot(
      path.join(batchPath, 'metadata.json'),
    );

    try {
      const raw = await fsp.readFile(metadataPath, 'utf8');
      const parsed = JSON.parse(raw) as ImportBatchMetadata;

      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      return parsed;
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }

  private assertWithinImportRoot(candidatePath: string): string {
    const root = path.resolve(this.getImportRoot());
    const candidate = path.resolve(candidatePath);
    const relativePath = path.relative(root, candidate);
    const outside =
      relativePath === '..' ||
      relativePath.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relativePath);

    if (outside) {
      throw new Error(
        'Import path is outside the configured import storage root.',
      );
    }
    return candidate;
  }
}
