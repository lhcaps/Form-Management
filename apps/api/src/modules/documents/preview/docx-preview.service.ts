/**
 * DOCX Preview Service
 *
 * High-fidelity preview pipeline for generated DOCX documents:
 * 1. Authorize access via AgencyResourceAccessService
 * 2. Locate the latest DOCX file
 * 3. Run style audit (read-only)
 * 4. Convert to PDF for rendered preview (optional, depends on conversion availability)
 * 5. Return preview metadata + audit results
 *
 * Security guarantees:
 * - Agency-scoped authorization before any file access
 * - File paths never exposed
 * - No path traversal (validated via isInsideProject)
 * - Sample preview does not persist any data
 *
 * @module documents/preview
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveRepoRoot } from '../../../common/repo-root';
import { PrismaService } from '../../../prisma/prisma.service';
import { AgencyResourceAccessService } from '../../auth/agency-resource-access.service';
import { DocumentPdfService } from '../document-pdf.service';
import type { CurrentUser } from '../../auth/current-user.type';
import { DocxStyleAuditService } from '../style/docx-style-audit.service';
import { SAMPLE_DATA_PROVIDER } from './sample-data-provider';

function parsePositiveBigint(value: string, entityName = 'ID'): bigint {
  try {
    const parsed = BigInt(value);
    if (parsed <= 0n) throw new Error('Non-positive');
    return parsed;
  } catch {
    throw new BadRequestException(`${entityName} không hợp lệ.`);
  }
}

@Injectable()
export class DocxPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AgencyResourceAccessService,
    private readonly pdfService: DocumentPdfService,
    private readonly styleAudit: DocxStyleAuditService,
  ) {}

  /**
   * Generate a preview of the latest DOCX file for a generated document.
   *
   * @param documentIdRaw - The generated document ID
   * @param user - Current user for authorization
   * @param options.sample - If true, use sample preview data (does not persist)
   * @param options.auditOnly - If true, skip PDF conversion and return audit only
   * @returns Preview metadata including audit results and optional PDF preview URL
   */
  async previewGeneratedDocument(
    documentIdRaw: string,
    user: CurrentUser | null | undefined,
    options?: {
      sample?: boolean;
      auditOnly?: boolean;
    },
  ): Promise<DocxPreviewResult> {
    const documentId = parsePositiveBigint(documentIdRaw, 'documentId');

    // 1. Authorize access BEFORE any file system operations
    await this.auth.assertCanAccessGeneratedDocument(user, documentIdRaw);

    // 2. Fetch generated document record
    const generatedDocument = await this.prisma.generated_documents.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        document_title: true,
        document_code: true,
        case_id: true,
        generated_by_name: true,
        generated_at: true,
      },
    });

    if (!generatedDocument) {
      throw new NotFoundException('Không tìm thấy biểu mẫu đã tạo.');
    }

    // 3. Find the latest DOCX file
    const latestDocx = await this.prisma.generated_document_files.findFirst({
      where: {
        generated_document_id: generatedDocument.id,
        file_format: 'DOCX',
      },
      orderBy: { id: 'desc' },
    });

    if (!latestDocx) {
      throw new NotFoundException(
        'Biểu mẫu chưa có file DOCX. Hãy render DOCX trước.',
      );
    }

    // 4. Resolve file path (never expose raw path)
    const docxFullPath = this.resolveProjectPath(latestDocx.file_path);

    if (!this.isInsideProject(docxFullPath)) {
      throw new BadRequestException('Đường dẫn file không hợp lệ.');
    }

    if (!fs.existsSync(docxFullPath)) {
      throw new NotFoundException(
        `File DOCX không tồn tại trên ổ đĩa: ${latestDocx.file_name}`,
      );
    }

    // 5. Read DOCX buffer for audit
    const docxBuffer = fs.readFileSync(docxFullPath);

    // 6. Run style audit (read-only, does not mutate)
    const auditResult = await this.styleAudit.auditDocxFromBuffer(docxBuffer);

    // 7. Build base response
    const result: DocxPreviewResult = {
      documentId: String(generatedDocument.id),
      documentTitle: generatedDocument.document_title,
      documentCode: generatedDocument.document_code,
      fileId: String(latestDocx.id),
      fileName: latestDocx.file_name,
      fileSizeBytes: String(latestDocx.file_size_bytes),
      checksum: latestDocx.checksum ?? null,
      generatedAt: latestDocx.created_at?.toISOString() ?? null,
      sample: options?.sample ?? false,
      audit: {
        status: auditResult.status,
        profileId: auditResult.profileId,
        profileName: auditResult.profileName,
        summary: auditResult.summary,
        findings: auditResult.findings.map((f) => ({
          severity: f.severity,
          code: f.code,
          message: f.message,
          location: f.location,
          recommendation: f.recommendation,
        })),
      },
      preview: null,
    };

    // 8. If auditOnly, return without PDF conversion
    if (options?.auditOnly) {
      return result;
    }

    // 9. Attempt PDF conversion for rendered preview
    // This may fail silently on non-Windows environments without LibreOffice.
    // The preview will still include the audit results.
    try {
      const pdfResult = await this.pdfService.convertLatestDocxToPdf(
        documentIdRaw,
        {
          force: true,
          convertedByName: 'preview-service',
        },
      );

      if (!pdfResult.skipped && pdfResult.file) {
        result.preview = {
          pdfFileId: pdfResult.file.id ?? '',
          pdfFileName: pdfResult.file.fileName ?? null,
          pdfFileSizeBytes: pdfResult.file.fileSizeBytes ?? null,
          sourceDocxFileId: latestDocx ? String(latestDocx.id) : null,
          convertedAt: new Date().toISOString(),
        };
      } else if (pdfResult.skipped && pdfResult.file) {
        // Use existing PDF
        result.preview = {
          pdfFileId: pdfResult.file.id ?? '',
          pdfFileName: pdfResult.file.fileName ?? null,
          pdfFileSizeBytes: pdfResult.file.fileSizeBytes ?? null,
          sourceDocxFileId: latestDocx ? String(latestDocx.id) : null,
          convertedAt: new Date().toISOString(),
          skipped: true,
        };
      }
    } catch {
      // PDF conversion not available; return audit-only result
      result.preview = null;
      result.auditNote =
        'PDF preview not available on this environment. Audit results are shown.';
    }

    return result;
  }

  /**
   * Get sample data keys for preview.
   * Returns all available sample field keys without persisting any data.
   */
  getSampleDataKeys(): {
    keys: string[];
    categories: string[];
    count: number;
  } {
    const samples = SAMPLE_DATA_PROVIDER.getAll();
    const categories = [...new Set(samples.map((s) => s.category))];

    return {
      keys: samples.map((s) => s.key),
      categories,
      count: samples.length,
    };
  }

  /**
   * Get sample data values.
   * Returns sample values without persisting any data.
   */
  getSampleData(): Record<string, string> {
    return SAMPLE_DATA_PROVIDER.toObject();
  }

  private resolveProjectPath(storedPath: string): string {
    const projectRoot = this.getProjectRoot();
    if (path.isAbsolute(storedPath)) {
      return path.normalize(storedPath);
    }
    return path.resolve(projectRoot, storedPath);
  }

  private getProjectRoot(): string {
    return resolveRepoRoot({ repoRoot: process.env.REPO_ROOT });
  }

  private isInsideProject(fullPath: string): boolean {
    const projectRoot = this.getProjectRoot();
    const normalizedRoot = path.normalize(projectRoot);
    const normalizedFile = path.normalize(fullPath);

    if (
      normalizedFile !== normalizedRoot &&
      !normalizedFile.startsWith(normalizedRoot + path.sep)
    ) {
      return false;
    }

    try {
      const realFile = fs.realpathSync.native
        ? fs.realpathSync.native(normalizedFile)
        : fs.realpathSync(normalizedFile);
      const realRoot = fs.realpathSync.native
        ? fs.realpathSync.native(normalizedRoot)
        : fs.realpathSync(normalizedRoot);
      return realFile.startsWith(realRoot + path.sep);
    } catch {
      return true;
    }
  }
}

/** Preview result shape */
export interface DocxPreviewResult {
  documentId: string;
  documentTitle: string | null;
  documentCode: string | null;
  fileId: string;
  fileName: string;
  fileSizeBytes: string;
  checksum: string | null;
  generatedAt: string | null;
  sample: boolean;
  audit: {
    status: 'PASS' | 'WARN' | 'FAIL';
    profileId: string;
    profileName: string;
    summary: {
      total: number;
      pass: number;
      warning: number;
      fail: number;
      notDetectable: number;
      notApplicable: number;
    };
    findings: Array<{
      severity: 'INFO' | 'WARN' | 'FAIL';
      code: string;
      message: string;
      location: string;
      recommendation?: string;
    }>;
  };
  preview: {
    pdfFileId: string;
    pdfFileName: string | null;
    pdfFileSizeBytes: string | null;
    sourceDocxFileId: string | null;
    convertedAt: string;
    skipped?: boolean;
  } | null;
  auditNote?: string;
}
