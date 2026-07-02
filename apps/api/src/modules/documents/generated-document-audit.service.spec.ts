import {
  GENERATED_DOCUMENT_AUDIT_ACTIONS,
  GENERATED_DOCUMENT_AUDIT_RESULTS,
  GeneratedDocumentAuditService,
  type GeneratedDocumentAuditAction,
  type GeneratedDocumentAuditResult,
  type WriteAuditEvent,
} from './generated-document-audit.service';
import type { CurrentUser } from '../auth/current-user.type';

function makePrismaMock(overrides: Partial<{
  create: jest.Mock;
  findMany: jest.Mock;
  count: jest.Mock;
}> = {}) {
  return {
    generated_document_audit_logs: {
      create: jest.fn().mockResolvedValue({ id: 1n }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      ...overrides,
    },
  };
}

function makeUser(partial: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: '1',
    username: 'lehuy',
    fullName: 'Le Huy',
    positionTitle: null,
    rankTitle: null,
    email: 'lehuy@qllaw.vn',
    phone: null,
    role: 'OFFICIAL',
    agencyId: '1',
    agencyName: 'VKS TP.HCM',
    agencyCode: 'VKS-TPHCM',
    isActive: true,
    permissions: [],
    ...partial,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeMockRequest(): any {
  return {
    method: 'GET',
    originalUrl: '/documents/generated/1/files/2/download',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'TestBrowser/1.0' },
    get: jest.fn().mockImplementation((header: string) => {
      if (header === 'user-agent') return 'TestBrowser/1.0';
      return undefined;
    }),
  } as unknown as Parameters<GeneratedDocumentAuditService['normalizeRequestMeta']>[0];
}

describe('GeneratedDocumentAuditService', () => {
  let service: GeneratedDocumentAuditService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(() => {
    prisma = makePrismaMock();
    service = new GeneratedDocumentAuditService(prisma as any);
  });

  describe('record', () => {
    it('creates an audit row with all fields', async () => {
      const event: WriteAuditEvent = {
        action: GENERATED_DOCUMENT_AUDIT_ACTIONS.DOWNLOADED,
        result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
        actor: { officialId: 1n, role: 'OFFICIAL', fullName: 'Le Huy', agencyId: 5n },
        agencyId: 5n,
        caseId: 10n,
        generatedDocumentId: 100n,
        file: {
          fileId: 200n,
          fileName: 'BM-001-001.docx',
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          sizeBytes: 12345n,
          fileKind: 'DOCX',
        },
        template: { templateCode: 'BM-001', templateTitle: 'Biên bản tiếp nhận', contractVersionId: 7n },
        reason: 'User requested download',
        metadata: { documentId: '100', fileId: '200' },
      };

      await service.record(event);

      expect(prisma.generated_document_audit_logs.create).toHaveBeenCalledTimes(1);
      const call = prisma.generated_document_audit_logs.create.mock.calls[0];
      expect(call[0].data.action).toBe('GENERATED_DOCUMENT_DOWNLOADED');
      expect(call[0].data.result).toBe('SUCCESS');
      expect(call[0].data.actor_official_id).toBe(1n);
      expect(call[0].data.actor_role).toBe('OFFICIAL');
      expect(call[0].data.actor_name).toBe('Le Huy');
      expect(call[0].data.agency_id).toBe(5n);
      expect(call[0].data.case_id).toBe(10n);
      expect(call[0].data.generated_document_id).toBe(100n);
      expect(call[0].data.generated_document_file_id).toBe(200n);
      expect(call[0].data.template_code).toBe('BM-001');
      expect(call[0].data.template_title).toBe('Biên bản tiếp nhận');
      expect(call[0].data.file_name).toBe('BM-001-001.docx');
      expect(call[0].data.file_mime_type).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(call[0].data.file_size_bytes).toBe(12345n);
      expect(call[0].data.file_kind).toBe('DOCX');
      expect(call[0].data.reason).toBe('User requested download');
    });

    it('does not throw when Prisma create fails', async () => {
      prisma.generated_document_audit_logs.create.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      const event: WriteAuditEvent = {
        action: GENERATED_DOCUMENT_AUDIT_ACTIONS.FILE_DELETED,
        result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
        actor: { officialId: 1n, fullName: 'Test' },
      };

      // Must not throw
      await expect(service.record(event)).resolves.not.toThrow();
    });

    it('sets result DENIED for access denied events', async () => {
      const event: WriteAuditEvent = {
        action: GENERATED_DOCUMENT_AUDIT_ACTIONS.ACCESS_DENIED,
        result: GENERATED_DOCUMENT_AUDIT_RESULTS.DENIED,
        actor: { officialId: 2n, role: 'OFFICIAL', fullName: 'Hacker', agencyId: 99n },
        generatedDocumentId: 1n,
        reason: 'Cross-agency access attempt',
      };

      await service.record(event);

      const call = prisma.generated_document_audit_logs.create.mock.calls[0];
      expect(call[0].data.action).toBe('GENERATED_DOCUMENT_ACCESS_DENIED');
      expect(call[0].data.result).toBe('DENIED');
      expect(call[0].data.reason).toBe('Cross-agency access attempt');
    });

    it('stores metadata JSON as-is without stripping tokens', async () => {
      // The service stores metadata as-is. Token stripping is the responsibility
      // of the caller — the controller/service must sanitize before calling record().
      const event: WriteAuditEvent = {
        action: GENERATED_DOCUMENT_AUDIT_ACTIONS.DOWNLOADED,
        result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
        actor: { officialId: 1n },
        metadata: {
          documentId: '100',
          fileId: '200',
          requestId: 'req-123',
        },
      };

      await service.record(event);

      const call = prisma.generated_document_audit_logs.create.mock.calls[0];
      expect(call[0].data.metadata_json).toEqual({
        documentId: '100',
        fileId: '200',
        requestId: 'req-123',
      });
    });
  });

  describe('normalizeRequestMeta', () => {
    it('returns null for null request', () => {
      expect(service.normalizeRequestMeta(null)).toBeNull();
    });

    it('returns null for undefined request', () => {
      expect(service.normalizeRequestMeta(undefined)).toBeNull();
    });

    it('extracts method, path, and user agent', () => {
      const req = makeMockRequest();
      req.method = 'POST';
      req.originalUrl = '/documents/generated/1/files/2/download?format=docx';
      const meta = service.normalizeRequestMeta(req as Parameters<GeneratedDocumentAuditService['normalizeRequestMeta']>[0]);
      expect(meta?.method).toBe('POST');
      expect(meta?.path).toBe('/documents/generated/1/files/2/download?format=docx');
      expect(meta?.userAgent).toBe('TestBrowser/1.0');
    });

    it('uses x-forwarded-for header for IP when present', () => {
      const req = makeMockRequest();
      req.ip = undefined;
      req.socket!.remoteAddress = '::ffff:192.168.1.1';
      (req.headers as Record<string, string | string[]>)['x-forwarded-for'] = '10.0.0.1, 10.0.0.2';
      const meta = service.normalizeRequestMeta(req as Parameters<GeneratedDocumentAuditService['normalizeRequestMeta']>[0]);
      expect(meta?.ipAddress).toBe('10.0.0.1');
    });

    it('strips IPv6 prefix from IP address when using socket remoteAddress', () => {
      const req = makeMockRequest();
      req.ip = '::ffff:192.168.1.1';
      const meta = service.normalizeRequestMeta(req as Parameters<GeneratedDocumentAuditService['normalizeRequestMeta']>[0]);
      expect(meta?.ipAddress).toBe('192.168.1.1');
    });

    it('does not include authorization header or cookie', () => {
      const req = makeMockRequest();
      // The audit service does NOT log authorization/cookies — only method, path, IP, user-agent.
      // This test verifies the normalizeRequestMeta does not extract auth headers.
      const meta = service.normalizeRequestMeta(req as Parameters<GeneratedDocumentAuditService['normalizeRequestMeta']>[0]);
      expect(meta).not.toHaveProperty('authorization');
      expect(meta).not.toHaveProperty('cookie');
      expect(meta?.method).toBe('GET');
    });
  });

  describe('buildActor', () => {
    it('builds actor from CurrentUser', () => {
      const user = makeUser({ id: '42', role: 'ADMIN', agencyId: '7', fullName: 'Admin User' });
      const actor = service.buildActor(user);
      expect(actor.officialId).toBe(42n);
      expect(actor.role).toBe('ADMIN');
      expect(actor.fullName).toBe('Admin User');
      expect(actor.agencyId).toBe(7n);
    });

    it('returns empty actor for null user', () => {
      const actor = service.buildActor(null);
      expect(actor.officialId).toBeUndefined();
      expect(actor.role).toBeUndefined();
    });

    it('overrides agencyId when provided', () => {
      const user = makeUser({ agencyId: '7' });
      const actor = service.buildActor(user, { agencyId: 99n });
      expect(actor.agencyId).toBe(99n);
    });
  });

  describe('buildFileContext', () => {
    it('converts file_format DOCX to DOCX kind', () => {
      const ctx = service.buildFileContext({
        id: 5n,
        file_name: 'BM-001.docx',
        file_format: 'DOCX',
        file_size_bytes: 4096n,
      });
      expect(ctx.fileKind).toBe('DOCX');
      expect(ctx.fileName).toBe('BM-001.docx');
      expect(ctx.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    });

    it('converts file_format PDF to PDF kind', () => {
      const ctx = service.buildFileContext({
        id: 6n,
        file_name: 'BM-001.pdf',
        file_format: 'PDF',
        file_size_bytes: 8192n,
      });
      expect(ctx.fileKind).toBe('PDF');
      expect(ctx.mimeType).toBe('application/pdf');
    });

    it('returns OTHER for unknown formats', () => {
      const ctx = service.buildFileContext({
        id: 7n,
        file_name: 'unknown.xyz',
        file_format: 'UNKNOWN',
        file_size_bytes: 1n,
      });
      expect(ctx.fileKind).toBe('OTHER');
      expect(ctx.mimeType).toBeUndefined();
    });
  });

  describe('readDocumentAudit', () => {
    it('returns empty entries when no audit rows exist', async () => {
      const result = await service.readDocumentAudit({
        documentId: 100n,
        actorOfficialId: 1n,
        actorRole: 'ADMIN',
        actorAgencyId: 5n,
      });

      expect(result.entries).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('returns formatted entries for ADMIN with full metadata', async () => {
      const now = new Date();
      prisma.generated_document_audit_logs.findMany.mockResolvedValueOnce([
        {
          id: 1n,
          action: 'GENERATED_DOCUMENT_DOWNLOADED',
          result: 'SUCCESS',
          actor_official_id: 1n,
          actor_role: 'OFFICIAL',
          actor_name: 'Le Huy',
          agency_id: 5n,
          case_id: 10n,
          generated_document_id: 100n,
          generated_document_file_id: 200n,
          template_code: 'BM-001',
          template_title: 'Biên bản',
          file_name: 'BM-001.docx',
          file_mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size_bytes: 4096n,
          reason: 'User download',
          created_at: now,
          ip_address: '192.168.1.1',
          user_agent: 'TestBrowser/1.0',
          request_method: 'GET',
          request_path: '/documents/generated/100/files/200/download',
          metadata_json: { key: 'value' },
        },
      ]);
      prisma.generated_document_audit_logs.count.mockResolvedValueOnce(1);

      const result = await service.readDocumentAudit({
        documentId: 100n,
        actorOfficialId: 1n,
        actorRole: 'ADMIN',
        actorAgencyId: 5n,
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].action).toBe('GENERATED_DOCUMENT_DOWNLOADED');
      expect(result.entries[0].result).toBe('SUCCESS');
      expect(result.entries[0].actorName).toBe('Le Huy');
      expect(result.entries[0].fileName).toBe('BM-001.docx');
      expect(result.entries[0].ipAddress).toBe('192.168.1.1');
      expect(result.entries[0].userAgent).toBe('TestBrowser/1.0');
      expect(result.total).toBe(1);
    });

    it('strips ip/userAgent for OFFICIAL role', async () => {
      const now = new Date();
      prisma.generated_document_audit_logs.findMany.mockResolvedValueOnce([
        {
          id: 1n,
          action: 'GENERATED_DOCUMENT_DOWNLOADED',
          result: 'SUCCESS',
          actor_official_id: 2n,
          actor_role: 'OFFICIAL',
          actor_name: 'Another User',
          agency_id: 5n,
          case_id: 10n,
          generated_document_id: 100n,
          generated_document_file_id: 200n,
          template_code: 'BM-001',
          template_title: 'Biên bản',
          file_name: 'BM-001.docx',
          file_mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size_bytes: 4096n,
          reason: 'Download',
          created_at: now,
        },
      ]);
      prisma.generated_document_audit_logs.count.mockResolvedValueOnce(1);

      const result = await service.readDocumentAudit({
        documentId: 100n,
        actorOfficialId: 2n,
        actorRole: 'OFFICIAL',
        actorAgencyId: 5n,
      });

      expect(result.entries[0].ipAddress).toBeNull();
      expect(result.entries[0].userAgent).toBeNull();
      expect(result.entries[0].action).toBe('GENERATED_DOCUMENT_DOWNLOADED');
    });

    it('respects limit and offset', async () => {
      await service.readDocumentAudit({
        documentId: 100n,
        actorOfficialId: 1n,
        actorRole: 'ADMIN',
        actorAgencyId: 5n,
        limit: 20,
        offset: 10,
      });

      const call = prisma.generated_document_audit_logs.findMany.mock.calls[0];
      expect(call[0].take).toBe(20);
      expect(call[0].skip).toBe(10);
    });
  });
});
