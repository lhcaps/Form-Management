import { Injectable, Optional } from '@nestjs/common';
import * as yauzl from 'yauzl';

const MAX_ZIP_ENTRIES = 2_000;
const MAX_ZIP_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
const MAX_ZIP_COMPRESSION_RATIO = 100;

export type ImportFilePolicyResult =
  | { accepted: true; detectedMime: string | null }
  | { accepted: false; reasonCode: string };

type FileTypeModule = {
  fileTypeFromFile(path: string): Promise<{ mime: string } | undefined>;
};

// file-type@22 is ESM-only while the Nest API deliberately remains CommonJS.
// Keep the native import expression intact instead of falling back to a weaker
// extension-only detector.
const loadFileType = (): Promise<FileTypeModule> =>
  new Function('specifier', 'return import(specifier)')(
    'file-type',
  ) as Promise<FileTypeModule>;

function isTextExtension(extension: string): boolean {
  return ['.csv', '.txt', '.json'].includes(extension);
}

function expectedSignature(
  extension: string,
  detectedMime: string | null,
): boolean {
  if (isTextExtension(extension)) return detectedMime === null;
  if (extension === '.pdf') return detectedMime === 'application/pdf';
  if (extension === '.doc') return detectedMime === 'application/x-cfb';
  if (extension === '.docx' || extension === '.xlsx') {
    return detectedMime === 'application/zip';
  }
  if (['.png'].includes(extension)) return detectedMime === 'image/png';
  if (['.jpg', '.jpeg'].includes(extension))
    return detectedMime === 'image/jpeg';
  if (extension === '.webp') return detectedMime === 'image/webp';
  if (['.tif', '.tiff'].includes(extension))
    return detectedMime === 'image/tiff';
  return false;
}

function isDeclaredMimeCompatible(
  extension: string,
  declaredMime: string | null,
): boolean {
  if (!declaredMime) return true;

  const acceptedByExtension: Record<string, string[]> = {
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword', 'application/x-cfb'],
    '.docx': [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    '.xlsx': [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    '.csv': ['text/csv', 'text/plain'],
    '.txt': ['text/plain'],
    '.json': ['application/json', 'text/json'],
    '.png': ['image/png'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.webp': ['image/webp'],
    '.tif': ['image/tiff'],
    '.tiff': ['image/tiff'],
  };

  return (
    acceptedByExtension[extension]?.includes(declaredMime.toLowerCase()) ??
    false
  );
}

function expectedOfficeEntry(extension: string, entries: Set<string>): boolean {
  if (!entries.has('[Content_Types].xml')) return false;
  return extension === '.docx'
    ? entries.has('word/document.xml')
    : entries.has('xl/workbook.xml');
}

@Injectable()
export class ImportFilePolicyService {
  // @Optional() prevents NestJS DI from treating the function type as an
  // injection token. When resolved via DI the param is undefined and the
  // default implementation (loadFileType) is used. Tests that call
  // `new ImportFilePolicyService(mockFn)` directly still work unchanged.
  constructor(
    @Optional()
    private readonly _detectFileType?: (
      path: string,
    ) => Promise<{ mime: string } | undefined>,
  ) {}

  private async detectFileType(
    path: string,
  ): Promise<{ mime: string } | undefined> {
    if (this._detectFileType) return this._detectFileType(path);
    const { fileTypeFromFile } = await loadFileType();
    return fileTypeFromFile(path);
  }

  async validate(
    absolutePath: string,
    extension: string,
    declaredMime: string | null,
  ): Promise<ImportFilePolicyResult> {
    const detected = await this.detectFileType(absolutePath);
    const detectedMime = detected?.mime ?? null;
    if (
      !expectedSignature(extension, detectedMime) ||
      !isDeclaredMimeCompatible(extension, declaredMime)
    ) {
      return { accepted: false, reasonCode: 'SIGNATURE_MISMATCH' };
    }

    if (extension === '.docx' || extension === '.xlsx') {
      const archive = await this.inspectOfficeArchive(absolutePath, extension);
      if (!archive.accepted) return archive;
    }

    return { accepted: true, detectedMime };
  }

  private inspectOfficeArchive(
    absolutePath: string,
    extension: '.docx' | '.xlsx' | string,
  ): Promise<ImportFilePolicyResult> {
    return new Promise((resolve) => {
      yauzl.open(
        absolutePath,
        { lazyEntries: true, autoClose: true },
        (error: Error | null, zip?: yauzl.ZipFile) => {
          if (error || !zip) {
            resolve({ accepted: false, reasonCode: 'INVALID_OFFICE_ARCHIVE' });
            return;
          }

          let entries = 0;
          let uncompressedBytes = 0;
          const names = new Set<string>();
          let settled = false;
          const finish = (result: ImportFilePolicyResult) => {
            if (settled) return;
            settled = true;
            zip.close();
            resolve(result);
          };

          zip.on('error', () =>
            finish({ accepted: false, reasonCode: 'INVALID_OFFICE_ARCHIVE' }),
          );
          zip.on('entry', (entry: yauzl.Entry) => {
            entries += 1;
            const compressed = Math.max(1, entry.compressedSize);
            uncompressedBytes += entry.uncompressedSize;
            names.add(entry.fileName);

            if (
              entries > MAX_ZIP_ENTRIES ||
              uncompressedBytes > MAX_ZIP_UNCOMPRESSED_BYTES ||
              entry.uncompressedSize / compressed > MAX_ZIP_COMPRESSION_RATIO
            ) {
              finish({ accepted: false, reasonCode: 'ARCHIVE_LIMIT_EXCEEDED' });
              return;
            }
            zip.readEntry();
          });
          zip.on('end', () => {
            finish(
              expectedOfficeEntry(extension, names)
                ? { accepted: true, detectedMime: 'application/zip' }
                : { accepted: false, reasonCode: 'INVALID_OFFICE_ARCHIVE' },
            );
          });
          zip.readEntry();
        },
      );
    });
  }
}
