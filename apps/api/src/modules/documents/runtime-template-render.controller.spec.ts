import type { Response } from 'express';
import { StreamableFile } from '@nestjs/common';
import type { CurrentUser } from '../auth/current-user.type';
import { RuntimeTemplateRenderController } from './runtime-template-render.controller';
import type { RuntimePreviewSession } from './runtime-preview-session.service';

const mockUser: CurrentUser = {
  id: '7',
  username: 'ksv-a',
  fullName: 'Kiểm sát viên A',
  positionTitle: null,
  rankTitle: null,
  email: null,
  phone: null,
  role: 'OFFICIAL',
  agencyId: null,
  agencyName: null,
  agencyCode: null,
  isActive: true,
  permissions: [],
};

function mockResponse(): {
  set: jest.Mock;
  headers: Map<string, string>;
} {
  const headers = new Map<string, string>();
  return {
    set: jest.fn().mockReturnThis(),
    headers,
  };
}

describe('RuntimeTemplateRenderController', () => {
  describe('createPreviewSession', () => {
    it('returns RuntimePreviewSessionResponse JSON', async () => {
      const mockSession: RuntimePreviewSession = {
        sessionId: 'runtime_preview_123e4567-e89b-12d3-a456-426614174000',
        templateCode: 'BM-001',
        fileName: 'BM-001-20260101-120000.docx',
        fileSizeBytes: 116009,
        fileFormat: 'DOCX',
        docxDownloadUrl: '/api/v1/forms/runtime/preview-sessions/runtime_preview_123e4567-e89b-12d3-a456-426614174000/docx',
        pdfPreviewUrl: null,
        audit: {
          status: 'PASS',
          summary: { total: 18, pass: 12, warning: 4, fail: 2, notDetectable: 2, notApplicable: 0 },
          findings: [],
        },
        warnings: ['warn1'],
        missingRequired: [],
        expiresAt: '2026-07-03T02:00:00.000Z',
        persisted: false,
      };
      const previewService = {
        createPreviewSession: jest.fn().mockResolvedValue(mockSession),
      };
      const renderer = { renderDocx: jest.fn() };
      const controller = new RuntimeTemplateRenderController(renderer as never, previewService as never);

      const result = await controller.createPreviewSession('BM-001', { data: { 'receiver.fullName': 'Test' } });

      expect(result).toEqual(mockSession);
      expect(previewService.createPreviewSession).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: { 'receiver.fullName': 'Test' },
      });
    });

    it('uses empty object when data is omitted', async () => {
      const mockSession: RuntimePreviewSession = {
        sessionId: 'runtime_preview_123e4567-e89b-12d3-a456-426614174000',
        templateCode: 'BM-001',
        fileName: 'BM-001-20260101-120000.docx',
        fileSizeBytes: 116009,
        fileFormat: 'DOCX',
        docxDownloadUrl: '/api/v1/forms/runtime/preview-sessions/runtime_preview_123e4567-e89b-12d3-a456-426614174000/docx',
        pdfPreviewUrl: null,
        audit: { status: 'PASS', summary: {}, findings: [] },
        warnings: [],
        missingRequired: [],
        expiresAt: '2026-07-03T02:00:00.000Z',
        persisted: false,
      };
      const previewService = {
        createPreviewSession: jest.fn().mockResolvedValue(mockSession),
      };
      const renderer = { renderDocx: jest.fn() };
      const controller = new RuntimeTemplateRenderController(renderer as never, previewService as never);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await controller.createPreviewSession('BM-001', {} as any);

      expect(previewService.createPreviewSession).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: {},
      });
    });
  });

  describe('downloadPreviewSessionDocx', () => {
    it('returns StreamableFile with DOCX content type', async () => {
      const mockSession = {
        sessionId: 'runtime_preview_123e4567-e89b-12d3-a456-426614174000',
        templateCode: 'BM-001',
        fileName: 'BM-001-20260101-120000.docx',
      };
      const mockBuffer = Buffer.from('PK\x03\x04fake-docx');
      const previewService = {
        getSession: jest.fn().mockResolvedValue(mockSession),
        getSessionDocxPath: jest.fn().mockResolvedValue('/fake/path/BM-001.docx'),
      };
      const renderer = { renderDocx: jest.fn() };
      const controller = new RuntimeTemplateRenderController(renderer as never, previewService as never);
      const mockRes = mockResponse() as unknown as Response;

      // Mock fs.readFileSync
      const originalReadFileSync = require('fs').readFileSync;
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(mockBuffer);

      const result = await controller.downloadPreviewSessionDocx(
        'runtime_preview_123e4567-e89b-12d3-a456-426614174000',
        mockRes,
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': expect.stringContaining('attachment'),
          'X-Qllaw-Preview-Session': 'runtime_preview_123e4567-e89b-12d3-a456-426614174000',
        }),
      );

      jest.restoreAllMocks();
    });

    it('throws NotFoundException for invalid session', async () => {
      const { NotFoundException } = require('@nestjs/common');
      const previewService = {
        getSession: jest.fn().mockRejectedValue(new NotFoundException('Session not found')),
        getSessionDocxPath: jest.fn().mockRejectedValue(new NotFoundException('Session not found')),
      };
      const renderer = { renderDocx: jest.fn() };
      const controller = new RuntimeTemplateRenderController(renderer as never, previewService as never);
      const mockRes = mockResponse() as unknown as Response;

      await expect(
        controller.downloadPreviewSessionDocx('invalid-session-id', mockRes),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPreviewSessionPdf', () => {
    it('returns StreamableFile with PDF content type when available', async () => {
      const mockSession = {
        sessionId: 'runtime_preview_123e4567-e89b-12d3-a456-426614174000',
        templateCode: 'BM-001',
        fileName: 'BM-001-20260101-120000.docx',
      };
      const mockBuffer = Buffer.from('%PDF-1.4 fake pdf content');
      const previewService = {
        getSession: jest.fn().mockResolvedValue(mockSession),
        getSessionPdfPath: jest.fn().mockResolvedValue({ pdfPath: '/fake/path/BM-001.pdf', available: true }),
      };
      const renderer = { renderDocx: jest.fn() };
      const controller = new RuntimeTemplateRenderController(renderer as never, previewService as never);
      const mockRes = mockResponse() as unknown as Response;

      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(mockBuffer);

      const result = await controller.getPreviewSessionPdf(
        'runtime_preview_123e4567-e89b-12d3-a456-426614174000',
        mockRes,
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
          'Content-Disposition': expect.stringContaining('inline'),
        }),
      );

      jest.restoreAllMocks();
    });

    it('throws NotFoundException when PDF is not available', async () => {
      const { NotFoundException } = require('@nestjs/common');
      const previewService = {
        getSession: jest.fn().mockResolvedValue({ sessionId: 's', fileName: 'f.docx' }),
        getSessionPdfPath: jest.fn().mockResolvedValue({ pdfPath: '', available: false }),
      };
      const renderer = { renderDocx: jest.fn() };
      const controller = new RuntimeTemplateRenderController(renderer as never, previewService as never);
      const mockRes = mockResponse() as unknown as Response;

      await expect(
        controller.getPreviewSessionPdf('runtime_preview_123e4567-e89b-12d3-a456-426614174000', mockRes),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('renderDocx (download)', () => {
    it('returns StreamableFile with correct headers', async () => {
      const mockBuffer = Buffer.from('fake-docx-content');
      const renderer = {
        renderDocx: jest.fn().mockResolvedValue({
          buffer: mockBuffer,
          fileName: 'BM-001-20260101-120000.docx',
          templateCode: 'BM-001',
          warnings: [],
          missingRequired: [],
        }),
      };
      const previewService = {};
      const controller = new RuntimeTemplateRenderController(renderer as never, previewService as never);
      const mockRes = mockResponse() as unknown as Response;

      const result = await controller.renderDocx(
        'BM-001',
        { data: {} },
        mockUser,
        mockRes,
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': expect.stringContaining('attachment'),
          'X-Qllaw-Template-Code': 'BM-001',
        }),
      );
      expect(renderer.renderDocx).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: {},
      });
    });

    it('returns StreamableFile with provided data', async () => {
      const mockBuffer = Buffer.from('docx');
      const renderer = {
        renderDocx: jest.fn().mockResolvedValue({
          buffer: mockBuffer,
          fileName: 'BM-001.docx',
          templateCode: 'BM-001',
          warnings: ['warn1'],
          missingRequired: [],
        }),
      };
      const previewService = {};
      const controller = new RuntimeTemplateRenderController(renderer as never, previewService as never);
      const mockRes = mockResponse() as unknown as Response;
      const formData = { 'receiver.fullName': 'Nguyen Van A' };

      const result = await controller.renderDocx(
        'BM-001',
        { data: formData },
        mockUser,
        mockRes,
      );

      expect(result).toBeInstanceOf(StreamableFile);
      expect(renderer.renderDocx).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: formData,
      });
    });
  });
});
