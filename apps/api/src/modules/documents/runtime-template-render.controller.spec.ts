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
  describe('renderDocxMetadata', () => {
    it('returns plain JSON metadata object without touching response headers', async () => {
      const mockBuffer = Buffer.from('fake-docx-content');
      const renderer = {
        renderDocx: jest.fn().mockResolvedValue({
          buffer: mockBuffer,
          fileName: 'BM-001-20260101-120000.docx',
          templateCode: 'BM-001',
          warnings: ['warn1', 'warn2'],
          missingRequired: [{ path: 'receiver.fullName', reason: 'missing' }],
        }),
      };
      const controller = new RuntimeTemplateRenderController(renderer as never);

      const result = await controller.renderDocxMetadata('BM-001', { data: {} });

      // Returns a plain serializable object, not StreamableFile or Response
      expect(result).not.toBeInstanceOf(StreamableFile);
      expect(typeof result).toBe('object');
      expect(result).toEqual({
        documentId: null,
        fileId: null,
        fileName: 'BM-001-20260101-120000.docx',
        fileSizeBytes: mockBuffer.length,
        fileFormat: 'DOCX',
        previewUrl: null,
        downloadUrl: '/forms/runtime/BM-001/render-docx',
        warnings: ['warn1', 'warn2'],
        missingRequired: [{ path: 'receiver.fullName', reason: 'missing' }],
      });
      expect(renderer.renderDocx).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: {},
      });
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
      const formData = { 'receiver.fullName': 'Nguyen Van A', 'document.no': '01' };

      await controller.renderDocxMetadata('BM-001', { data: formData });

      expect(renderer.renderDocx).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: formData,
      });
    });

    it('uses empty object when data is omitted', async () => {
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

      // @Body() with optional data field: body.data is undefined
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await controller.renderDocxMetadata('BM-001', {} as any);

      expect(renderer.renderDocx).toHaveBeenCalledWith({
        templateCode: 'BM-001',
        data: {},
      });
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
      const controller = new RuntimeTemplateRenderController(renderer as never);
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
      const controller = new RuntimeTemplateRenderController(renderer as never);
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
