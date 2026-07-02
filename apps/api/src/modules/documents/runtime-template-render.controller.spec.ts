import type { Response } from 'express';
import { StreamableFile } from '@nestjs/common';
import type { CurrentUser } from '../auth/current-user.type';
import { RuntimeTemplateRenderController } from './runtime-template-render.controller';

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
  describe('renderDocx', () => {
    it('returns StreamableFile when no mode query param is provided', async () => {
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
      const controller = new RuntimeTemplateRenderController(renderer as never);
      const mockRes = mockResponse() as unknown as Response;

      const result = await controller.renderDocx(
        'BM-001',
        { data: {} },
        mockUser,
        undefined,
        mockRes,
      );

      // Should return StreamableFile for download
      expect(result).toBeInstanceOf(StreamableFile);
      expect(renderer.renderDocx).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: {},
      });
    });

    it('returns StreamableFile when mode=download query param is provided', async () => {
      const mockBuffer = Buffer.from('fake-docx-content');
      const renderer = {
        renderDocx: jest.fn().mockResolvedValue({
          buffer: mockBuffer,
          fileName: 'BM-001-20260101-120000.docx',
          templateCode: 'BM-001',
          warnings: ['warn1'],
          missingRequired: [],
        }),
      };
      const controller = new RuntimeTemplateRenderController(renderer as never);
      const mockRes = mockResponse() as unknown as Response;

      const result = await controller.renderDocx(
        'BM-001',
        { data: {} },
        mockUser,
        'download',
        mockRes,
      );

      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('returns metadata JSON object when mode=metadata query param is provided', async () => {
      const mockBuffer = Buffer.from('fake-docx-content');
      const renderer = {
        renderDocx: jest.fn().mockResolvedValue({
          buffer: mockBuffer,
          fileName: 'BM-001-20260101-120000.docx',
          templateCode: 'BM-001',
          warnings: ['warn1', 'warn2'],
          missingRequired: [{ path: 'field1', reason: 'missing' }],
        }),
      };
      const controller = new RuntimeTemplateRenderController(renderer as never);
      const mockRes = mockResponse() as unknown as Response;

      const result = await controller.renderDocx(
        'BM-001',
        { data: {} },
        mockUser,
        'metadata',
        mockRes,
      );

      // Metadata mode returns a plain object, not StreamableFile
      expect(result).not.toBeInstanceOf(StreamableFile);
      expect(result).toEqual({
        documentId: null,
        fileId: null,
        fileName: 'BM-001-20260101-120000.docx',
        fileSizeBytes: mockBuffer.length,
        fileFormat: 'DOCX',
        previewUrl: null,
        downloadUrl: '/forms/runtime/BM-001/render-docx',
        warnings: ['warn1', 'warn2'],
        missingRequired: [{ path: 'field1', reason: 'missing' }],
      });
      expect(renderer.renderDocx).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: {},
      });
    });

    it('throws BadRequestException when mode has invalid value', async () => {
      const renderer = {
        renderDocx: jest.fn(),
      };
      const controller = new RuntimeTemplateRenderController(renderer as never);
      const mockRes = mockResponse() as unknown as Response;

      await expect(
        controller.renderDocx(
          'BM-001',
          { data: {} },
          mockUser,
          'invalid-mode',
          mockRes,
        ),
      ).rejects.toThrow('Invalid mode "invalid-mode". Allowed values: "metadata", "download".');

      // Renderer should not be called when mode is invalid
      expect(renderer.renderDocx).not.toHaveBeenCalled();
    });

    it('renders with provided data object', async () => {
      const mockBuffer = Buffer.from('docx');
      const renderer = {
        renderDocx: jest.fn().mockResolvedValue({
          buffer: mockBuffer,
          fileName: 'BM-001.docx',
          templateCode: 'BM-001',
          warnings: [],
          missingRequired: [],
        }),
      };
      const controller = new RuntimeTemplateRenderController(renderer as never);
      const mockRes = mockResponse() as unknown as Response;
      const formData = { 'receiver.fullName': 'Nguyen Van A', 'document.no': '01' };

      await controller.renderDocx(
        'BM-001',
        { data: formData },
        mockUser,
        undefined,
        mockRes,
      );

      expect(renderer.renderDocx).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: formData,
      });
    });
  });
});
