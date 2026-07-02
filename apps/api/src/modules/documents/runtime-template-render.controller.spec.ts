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
  json: jest.Mock;
  headers: Map<string, string>;
} {
  const headers = new Map<string, string>();
  return {
    set: jest.fn().mockReturnThis(),
    // response.json() returns the sent flag (true if the response was sent)
    json: jest.fn().mockReturnValue(true),
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

    it('returns truthy sent flag when mode=metadata query param is provided', async () => {
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

      // response.json() is called to send the JSON response directly.
      // The return value is the sent flag (truthy), NOT the JSON payload.
      expect(result).toBeTruthy();
      expect(result).not.toBeInstanceOf(StreamableFile);
      // Verify response.json() was called with the expected metadata
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: null,
          fileId: null,
          fileName: 'BM-001-20260101-120000.docx',
          fileSizeBytes: mockBuffer.length,
          fileFormat: 'DOCX',
          previewUrl: null,
          downloadUrl: '/forms/runtime/BM-001/render-docx',
          warnings: ['warn1', 'warn2'],
          missingRequired: [{ path: 'field1', reason: 'missing' }],
        }),
      );
      // Verify headers were set for JSON response
      expect(mockRes.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/json',
          'X-Qllaw-Template-Code': 'BM-001',
        }),
      );
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
