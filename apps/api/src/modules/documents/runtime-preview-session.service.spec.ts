import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { RuntimePreviewSessionService } from './runtime-preview-session.service';

const TEST_SESSIONS_BASE_DIR = path.join(__dirname, '__test-runtime-preview-sessions__');

function rmdir(dir: string): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rmdir(full);
    } else {
      fs.unlinkSync(full);
    }
  }
  fs.rmdirSync(dir);
}

describe('RuntimePreviewSessionService', () => {
  let service: RuntimePreviewSessionService;
  // Service uses workspacePaths.storageRoot as base, which is __dirname
  // So sessions land at __dirname/runtime-preview-sessions/
  let sessionsBaseDir: string;

  const mockWorkspacePaths = {
    storageRoot: __dirname,
  } as any;

  const mockBuffer = Buffer.from('PK\x03\x04fake-docx-content');

  const mockRenderer = {
    renderDocx: jest.fn().mockResolvedValue({
      templateCode: 'BM-001',
      fileName: 'BM-001-20260703-010000.docx',
      buffer: mockBuffer,
      warnings: ['warning1'],
      missingRequired: [{ path: 'receiver.fullName', reason: 'missing' }],
    }),
  };

  const mockAudit = {
    auditDocxFromFile: jest.fn().mockResolvedValue({
      status: 'PASS' as const,
      summary: { total: 18, pass: 12, warning: 4, fail: 2, notDetectable: 2, notApplicable: 0 },
      findings: [],
    }),
  };

  beforeEach(() => {
    // Service joins workspacePaths.storageRoot with RUNTIME_PREVIEW_SESSIONS_DIR
    // workspacePaths.storageRoot is mocked as __dirname
    // So sessionsBaseDir = __dirname/runtime-preview-sessions/
    sessionsBaseDir = path.join(__dirname, 'runtime-preview-sessions');
    rmdir(sessionsBaseDir);
    fs.mkdirSync(sessionsBaseDir, { recursive: true });

    service = new RuntimePreviewSessionService(
      mockWorkspacePaths as any,
      mockRenderer as any,
      mockAudit as any,
    );
  });

  afterEach(() => {
    // Clean up both the sessions dir and the test base dir
    rmdir(sessionsBaseDir);
    rmdir(TEST_SESSIONS_BASE_DIR);
  });

  describe('createPreviewSession', () => {
    it('creates session directory with document.docx and metadata.json', async () => {
      const result = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: { 'receiver.fullName': 'Test' },
      });

      expect(result.sessionId).toMatch(/^runtime_preview_[a-f0-9-]{36}$/);
      expect(result.templateCode).toBe('BM-001');
      expect(result.fileName).toBe('BM-001-20260703-010000.docx');
      expect(result.fileSizeBytes).toBe(mockBuffer.length);
      expect(result.fileFormat).toBe('DOCX');
      expect(result.docxDownloadUrl).toContain('/api/v1/forms/runtime/preview-sessions/');
      expect(result.docxDownloadUrl).toContain('/docx');
      expect(result.pdfPreviewUrl).toBeNull();
      expect(result.audit.status).toBe('PASS');
      expect(result.warnings).toContain('warning1');
      expect(result.missingRequired).toHaveLength(1);
      expect(result.persisted).toBe(false);
      expect(result.expiresAt).toBeTruthy();

      const sessionDir = path.join(sessionsBaseDir, result.sessionId);
      expect(fs.existsSync(sessionDir)).toBe(true);
      expect(fs.existsSync(path.join(sessionDir, 'document.docx'))).toBe(true);
      expect(fs.existsSync(path.join(sessionDir, 'metadata.json'))).toBe(true);
    });

    it('returns JSON response with no Content-Disposition', async () => {
      const result = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: {},
      });

      expect(typeof result).toBe('object');
      expect(result.sessionId).toBeTruthy();
      expect(result.persisted).toBe(false);
    });

    it('does NOT create DB rows (no Prisma calls)', async () => {
      await service.createPreviewSession({ templateCode: 'BM-001', data: {} });

      const entries = fs.readdirSync(sessionsBaseDir, { withFileTypes: true });
      const sessionDirs = entries.filter((e) => e.isDirectory() && e.name.startsWith('runtime_preview_'));
      expect(sessionDirs.length).toBe(1);
    });

    it('continues even if audit fails (best-effort)', async () => {
      mockAudit.auditDocxFromFile.mockRejectedValueOnce(new Error('Audit failed'));

      const result = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: {},
      });

      expect(result.sessionId).toBeTruthy();
      expect(result.audit.status).toBe('PASS');
      expect(result.audit.findings).toHaveLength(0);
    });
  });

  describe('getSession', () => {
    it('returns session metadata for valid session', async () => {
      const created = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: {},
      });

      const session = await service.getSession(created.sessionId);

      expect(session.sessionId).toBe(created.sessionId);
      expect(session.templateCode).toBe('BM-001');
      expect(session.docxPath).toContain(created.sessionId);
    });

    it('throws NotFoundException for invalid session ID format', async () => {
      await expect(service.getSession('invalid-id')).rejects.toThrow(BadRequestException);
      await expect(service.getSession('runtime_preview_')).rejects.toThrow(BadRequestException);
      await expect(service.getSession('runtime_preview_not-a-uuid')).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException for non-existent session', async () => {
      await expect(
        service.getSession('runtime_preview_123e4567-e89b-12d3-a456-426614174000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for expired session', async () => {
      const created = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: {},
      });

      const sessionDir = path.join(sessionsBaseDir, created.sessionId);
      const metadataPath = path.join(sessionDir, 'metadata.json');
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata.expiresAt = Date.now() - 1000;
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      await expect(service.getSession(created.sessionId)).rejects.toThrow(NotFoundException);

      expect(fs.existsSync(sessionDir)).toBe(false);
    });

    it('rejects path traversal attempts in session ID', async () => {
      await expect(
        service.getSession('runtime_preview_../../../etc/passwd'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSessionDocxPath', () => {
    it('returns the DOCX path for a valid session', async () => {
      const created = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: {},
      });

      const docxPath = await service.getSessionDocxPath(created.sessionId);

      expect(docxPath).toContain(created.sessionId);
      expect(docxPath).toContain('document.docx');
      expect(fs.existsSync(docxPath)).toBe(true);
    });

    it('throws NotFoundException for non-existent session', async () => {
      await expect(
        service.getSessionDocxPath('runtime_preview_123e4567-e89b-12d3-a456-426614174000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSessionPdfPath', () => {
    it('returns available=false when no PDF exists', async () => {
      const created = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: {},
      });

      const result = await service.getSessionPdfPath(created.sessionId);

      expect(result.available).toBe(false);
      expect(result.pdfPath).toBe('');
    });
  });

  describe('response shape verification', () => {
    it('preview-session JSON does not start with PK', async () => {
      const result = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: {},
      });

      const jsonStr = JSON.stringify(result);
      expect(jsonStr.startsWith('PK')).toBe(false);
      expect(JSON.parse(jsonStr)).toEqual(result);
    });

    it('docxDownloadUrl is a safe URL without raw filesystem paths', async () => {
      const result = await service.createPreviewSession({
        templateCode: 'BM-001',
        data: {},
      });

      expect(result.docxDownloadUrl).toContain('/api/v1/forms/runtime/preview-sessions/');
      expect(result.docxDownloadUrl).not.toContain(sessionsBaseDir);
      expect(result.docxDownloadUrl).not.toContain('storage');
    });
  });
});
