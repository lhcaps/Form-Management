/**
 * Controller-level tests for the GENERATED_DOCUMENT_ACCESS_DENIED audit wiring.
 *
 * Covers:
 * - Download denied (cross-agency) → audit ACCESS_DENIED, re-throw 403.
 * - Delete denied → audit ACCESS_DENIED, re-throw 403.
 * - Bulk-delete denied → audit ACCESS_DENIED for first file, re-throw 403.
 * - Cleanup denied → audit ACCESS_DENIED, re-throw 403.
 * - 404 (NotFound) → no audit entry (not an access-denied event).
 * - Success cases continue to record SUCCESS (regression for PR #28).
 */
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentFilesController } from './document-files.controller';
import { DocumentFilesService } from './document-files.service';
import {
  GeneratedDocumentAuditService,
  GENERATED_DOCUMENT_AUDIT_ACTIONS,
  GENERATED_DOCUMENT_AUDIT_RESULTS,
} from './generated-document-audit.service';
import type { CurrentUser } from '../auth/current-user.type';

jest.mock('node:fs', () => {
  const { Readable } = jest.requireActual('stream');
  return {
    createReadStream: jest.fn(() => new Readable({ read() { this.push(null); } })),
    existsSync: jest.fn(() => true),
    statSync: jest.fn(() => ({ isFile: () => true, size: 4096 })),
    realpathSync: jest.fn((p: string) => p),
    rmSync: jest.fn(),
  };
});

function makeUser(): CurrentUser {
  return {
    id: '1',
    username: 'lehuy',
    fullName: 'Le Huy',
    positionTitle: null,
    rankTitle: null,
    email: 'lehuy@qllaw.vn',
    phone: null,
    role: 'OFFICIAL',
    agencyId: '5',
    agencyName: 'VKS TP.HCM',
    agencyCode: 'VKS-TPHCM',
    isActive: true,
    permissions: [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeMockRequest(): any {
  return {
    method: 'POST',
    originalUrl: '/documents/generated/1/files/2/download',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'TestBrowser/1.0' },
    get: jest.fn().mockImplementation((header: string) => {
      if (header === 'user-agent') return 'TestBrowser/1.0';
      return undefined;
    }),
  };
}

describe('DocumentFilesController — ACCESS_DENIED audit wiring', () => {
  let controller: DocumentFilesController;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fileService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditService: any;

  beforeEach(async () => {
    fileService = {
      getGeneratedFileForDownload: jest.fn(),
      deleteGeneratedFile: jest.fn(),
      bulkDeleteGeneratedFiles: jest.fn(),
      cleanupGeneratedFiles: jest.fn(),
    };
    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
      recordAccessDenied: jest.fn().mockResolvedValue(undefined),
      buildActor: jest.fn().mockReturnValue({ officialId: 1n, role: 'OFFICIAL', fullName: 'Le Huy', agencyId: 5n }),
      normalizeRequestMeta: jest.fn().mockReturnValue({ method: 'POST', path: '/test', ipAddress: '127.0.0.1', userAgent: 'TestBrowser/1.0' }),
      buildFileContext: jest.fn().mockReturnValue({ fileId: 2n, fileName: 'BM-001.docx', fileKind: 'DOCX', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: 4096n }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentFilesController],
      providers: [
        { provide: DocumentFilesService, useValue: fileService },
        { provide: GeneratedDocumentAuditService, useValue: auditService },
      ],
    }).compile();

    controller = moduleRef.get<DocumentFilesController>(DocumentFilesController);
  });

  describe('download — cross-agency denied', () => {
    it('records ACCESS_DENIED and re-throws 403', async () => {
      fileService.getGeneratedFileForDownload.mockRejectedValue(
        new ForbiddenException('Không có quyền truy cập tài nguyên thuộc cơ quan này.'),
      );

      const user = makeUser();
      const req = makeMockRequest();
      const response = {
        set: jest.fn(),
        getStream: jest.fn(),
      } as never;

      await expect(
        controller.downloadGeneratedFile('1', '2', user, req as Request, response),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(auditService.recordAccessDenied).toHaveBeenCalledTimes(1);
      expect(auditService.recordAccessDenied).toHaveBeenCalledWith({
        user,
        request: req,
        reason: 'ACCESS_DENIED',
        generatedDocumentId: '1',
        generatedDocumentFileId: '2',
        metadata: { route: 'download', documentId: '1', fileId: '2' },
      });
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('records DOWNLOADED SUCCESS on successful download — regression PR #28', async () => {
      fileService.getGeneratedFileForDownload.mockResolvedValue({
        file: { id: 2n, file_name: 'BM-001.docx', file_format: 'DOCX', file_size_bytes: 4096n, generated_document_id: 1n },
        fullPath: '/tmp/test.docx',
        fileName: 'BM-001.docx',
        fileSizeBytes: 4096,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const user = makeUser();
      const req = makeMockRequest();
      // Mock Response to prevent StreamableFile from actually reading from disk.
      const response = {
        set: jest.fn(),
        getStream: jest.fn(),
      };

      await controller.downloadGeneratedFile('1', '2', user, req as Request, response as never);

      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: GENERATED_DOCUMENT_AUDIT_ACTIONS.DOWNLOADED,
          result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
        }),
      );
      expect(auditService.recordAccessDenied).not.toHaveBeenCalled();
    });

    it('NotFoundException does NOT record audit — not an access-denied event', async () => {
      fileService.getGeneratedFileForDownload.mockRejectedValue(
        new NotFoundException('Không tìm thấy file.'),
      );

      const user = makeUser();
      const req = makeMockRequest();
      const response = { set: jest.fn() } as never;

      await expect(
        controller.downloadGeneratedFile('1', '2', user, req as Request, response),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(auditService.recordAccessDenied).not.toHaveBeenCalled();
      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  describe('delete — cross-agency denied', () => {
    it('records ACCESS_DENIED and re-throws 403', async () => {
      fileService.deleteGeneratedFile.mockRejectedValue(
        new ForbiddenException('Không có quyền.'),
      );

      const user = makeUser();
      const req = makeMockRequest();

      await expect(
        controller.deleteGeneratedFile('1', '2', user, req as Request),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(auditService.recordAccessDenied).toHaveBeenCalledTimes(1);
      expect(auditService.recordAccessDenied).toHaveBeenCalledWith({
        user,
        request: req,
        reason: 'ACCESS_DENIED',
        generatedDocumentId: '1',
        generatedDocumentFileId: '2',
        metadata: { route: 'delete', documentId: '1', fileId: '2' },
      });
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('records FILE_DELETED SUCCESS on success — regression PR #28', async () => {
      fileService.deleteGeneratedFile.mockResolvedValue({
        deleted: true,
        fileId: '2',
        fileFormat: 'DOCX',
        fileName: 'BM-001.docx',
      });

      const user = makeUser();
      const req = makeMockRequest();

      await controller.deleteGeneratedFile('1', '2', user, req as Request);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: GENERATED_DOCUMENT_AUDIT_ACTIONS.FILE_DELETED,
          result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
        }),
      );
      expect(auditService.recordAccessDenied).not.toHaveBeenCalled();
    });
  });

  describe('bulk-delete — cross-agency denied', () => {
    it('records ACCESS_DENIED for the first file ID and re-throws 403', async () => {
      fileService.bulkDeleteGeneratedFiles.mockRejectedValue(
        new ForbiddenException('Không có quyền.'),
      );

      const user = makeUser();
      const req = makeMockRequest();

      await expect(
        controller.bulkDeleteGeneratedFiles('1', { fileIds: ['2', '3', '4'] } as never, user, req as Request),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(auditService.recordAccessDenied).toHaveBeenCalledTimes(1);
      expect(auditService.recordAccessDenied).toHaveBeenCalledWith({
        user,
        request: req,
        reason: 'ACCESS_DENIED',
        generatedDocumentId: '1',
        generatedDocumentFileId: '2',
        metadata: { route: 'bulk-delete', documentId: '1', attemptedCount: 3 },
      });
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('records FILES_BULK_DELETED SUCCESS on success — regression PR #28', async () => {
      fileService.bulkDeleteGeneratedFiles.mockResolvedValue({
        deletedCount: 3,
        results: [],
      });

      const user = makeUser();
      const req = makeMockRequest();

      await controller.bulkDeleteGeneratedFiles('1', { fileIds: ['2', '3'] } as never, user, req as Request);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: GENERATED_DOCUMENT_AUDIT_ACTIONS.FILES_BULK_DELETED,
          result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
        }),
      );
      expect(auditService.recordAccessDenied).not.toHaveBeenCalled();
    });
  });

  describe('cleanup — cross-agency denied', () => {
    it('records ACCESS_DENIED and re-throws 403', async () => {
      fileService.cleanupGeneratedFiles.mockRejectedValue(
        new ForbiddenException('Không có quyền truy cập tài nguyên thuộc cơ quan này.'),
      );

      const user = makeUser();
      const req = makeMockRequest();

      await expect(
        controller.cleanupGeneratedFiles('1', {} as never, user, req as Request),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(auditService.recordAccessDenied).toHaveBeenCalledTimes(1);
      expect(auditService.recordAccessDenied).toHaveBeenCalledWith({
        user,
        request: req,
        reason: 'ACCESS_DENIED',
        generatedDocumentId: '1',
        metadata: { route: 'cleanup', documentId: '1' },
      });
      expect(auditService.record).not.toHaveBeenCalled();
    });

    it('records FILES_CLEANED_UP SUCCESS on success — regression PR #28', async () => {
      fileService.cleanupGeneratedFiles.mockResolvedValue({
        deletedCount: 2,
        keptCount: 2,
        keptFiles: [],
        deletedFiles: [],
      });

      const user = makeUser();
      const req = makeMockRequest();

      await controller.cleanupGeneratedFiles('1', {} as never, user, req as Request);

      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: GENERATED_DOCUMENT_AUDIT_ACTIONS.FILES_CLEANED_UP,
          result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
        }),
      );
      expect(auditService.recordAccessDenied).not.toHaveBeenCalled();
    });
  });
});
