/**
 * Controller-level tests for the GENERATED_DOCUMENT_CREATED audit wiring.
 *
 * Covers:
 * - Successful batch creation records one audit row per generated document.
 * - Audit write failure does not propagate (non-blocking).
 * - API response shape is unchanged (findBatch format).
 */
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import {
  GeneratedDocumentAuditService,
  GENERATED_DOCUMENT_AUDIT_ACTIONS,
  GENERATED_DOCUMENT_AUDIT_RESULTS,
} from './generated-document-audit.service';
import type { CurrentUser } from '../auth/current-user.type';
import { AgencyResourceAccessService } from '../auth/agency-resource-access.service';

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
    originalUrl: '/documents/cases/1/batches',
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
    headers: { 'user-agent': 'TestBrowser/1.0' },
    get: jest.fn().mockImplementation((header: string) => {
      if (header === 'user-agent') return 'TestBrowser/1.0';
      return undefined;
    }),
  };
}

describe('DocumentsController — audit wiring', () => {
  let controller: DocumentsController;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let docService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let auditService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let accessService: any;

  beforeEach(async () => {
    docService = {
      createBatch: jest.fn(),
      findBatch: jest.fn(),
      findDocumentById: jest.fn(),
    };
    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
      buildActor: jest
        .fn()
        .mockReturnValue({
          officialId: 1n,
          role: 'OFFICIAL',
          fullName: 'Le Huy',
          agencyId: 5n,
        }),
      normalizeRequestMeta: jest
        .fn()
        .mockReturnValue({
          method: 'POST',
          path: '/batches',
          ipAddress: '127.0.0.1',
          userAgent: 'TestBrowser/1.0',
        }),
    };
    accessService = {
      assertCanAccessCase: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: DocumentsService, useValue: docService },
        { provide: GeneratedDocumentAuditService, useValue: auditService },
        { provide: AgencyResourceAccessService, useValue: accessService },
      ],
    }).compile();

    controller = moduleRef.get<DocumentsController>(DocumentsController);
  });

  describe('createBatch audit', () => {
    it('records GENERATED_DOCUMENT_CREATED for each document after successful creation', async () => {
      const doc1 = {
        id: 10n,
        document_code: 'BM-001-1',
        document_title: 'BM 001',
        target_scope: 'CASE_LEVEL',
        target_person_id: null as unknown as bigint,
        generated_by_name: 'Le Huy',
      };
      const doc2 = {
        id: 11n,
        document_code: 'BM-002-1',
        document_title: 'BM 002',
        target_scope: 'CASE_LEVEL',
        target_person_id: null as unknown as bigint,
        generated_by_name: 'Le Huy',
      };
      const batchResult = {
        batch: {
          id: 100n,
          created_by_name: 'Le Huy',
          created_at: new Date(),
          case_id: 5n,
          batch_code: 'DGB-2026-1',
          requested_formats: null,
          selected_templates_snapshot: null,
          status: 'COMPLETED' as const,
          total_documents: 2,
          success_documents: 2,
          failed_documents: 0,
          error_message: null,
          completed_at: new Date(),
        },
        documents: [doc1, doc2],
      };
      const formattedResult = {
        batchId: '100',
        documents: [{ id: '10' }, { id: '11' }],
      };

      docService.createBatch.mockResolvedValue(batchResult);
      docService.findBatch.mockResolvedValue(formattedResult);
      docService.findDocumentById.mockResolvedValueOnce({
        id: 10n,
        template_code: 'BM-001',
        template_name: 'Biên bản',
        output_strategy: null,
        document_code: 'BM-001-1',
        document_title: 'BM 001',
        target_scope: 'CASE_LEVEL',
        target_person_id: null,
        generated_by_name: 'Le Huy',
      });
      docService.findDocumentById.mockResolvedValueOnce({
        id: 11n,
        template_code: 'BM-002',
        template_name: 'Biên bản 2',
        output_strategy: null,
        document_code: 'BM-002-1',
        document_title: 'BM 002',
        target_scope: 'CASE_LEVEL',
        target_person_id: null,
        generated_by_name: 'Le Huy',
      });

      const user = makeUser();
      const req = makeMockRequest();
      const result = await controller.createBatch(
        '5',
        { templateIds: ['1', '2'] } as never,
        user,
        req as Request,
      );

      expect(result).toBe(formattedResult);
      // Audit is fire-and-forget; verify via mock call count after await
      await new Promise(setImmediate);
      expect(auditService.record).toHaveBeenCalledTimes(2);

      const [call1, call2] = auditService.record.mock.calls;
      expect(call1[0].action).toBe(GENERATED_DOCUMENT_AUDIT_ACTIONS.CREATED);
      expect(call1[0].result).toBe(GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS);
      expect(call1[0].generatedDocumentId).toBe(10n);
      expect(call1[0].metadata.documentTitle).toBe('BM 001');
      expect(call2[0].generatedDocumentId).toBe(11n);
    });

    it('API response shape is unchanged — findBatch result returned', async () => {
      const batchResult = {
        batch: {
          id: 100n,
          created_by_name: null,
          created_at: new Date(),
          case_id: 5n,
          batch_code: 'DGB-2026-1',
          requested_formats: null,
          selected_templates_snapshot: null,
          status: 'COMPLETED' as const,
          total_documents: 1,
          success_documents: 1,
          failed_documents: 0,
          error_message: null,
          completed_at: new Date(),
        },
        documents: [],
      };
      const formattedResult = { batchId: '100' };

      docService.createBatch.mockResolvedValue(batchResult);
      docService.findBatch.mockResolvedValue(formattedResult);

      const user = makeUser();
      const req = makeMockRequest();
      const result = await controller.createBatch(
        '5',
        {} as never,
        user,
        req as Request,
      );

      expect(result).toBe(formattedResult);
    });

    it('non-blocking: audit failure does not break the response', async () => {
      const batchResult = {
        batch: {
          id: 100n,
          created_by_name: 'Le Huy',
          created_at: new Date(),
          case_id: 5n,
          batch_code: 'DGB-2026-1',
          requested_formats: null,
          selected_templates_snapshot: null,
          status: 'COMPLETED' as const,
          total_documents: 1,
          success_documents: 1,
          failed_documents: 0,
          error_message: null,
          completed_at: new Date(),
        },
        documents: [
          {
            id: 10n,
            document_code: 'BM-001-1',
            document_title: 'BM 001',
            target_scope: 'CASE_LEVEL',
            target_person_id: null as unknown as bigint,
            generated_by_name: 'Le Huy',
          },
        ],
      };
      const formattedResult = { batchId: '100' };

      docService.createBatch.mockResolvedValue(batchResult);
      docService.findBatch.mockResolvedValue(formattedResult);
      docService.findDocumentById.mockResolvedValueOnce({
        id: 10n,
        template_code: 'BM-001',
        template_name: null,
        output_strategy: null,
        document_code: 'BM-001-1',
        document_title: 'BM 001',
        target_scope: 'CASE_LEVEL',
        target_person_id: null,
        generated_by_name: 'Le Huy',
      });
      auditService.record.mockRejectedValueOnce(new Error('DB error'));

      const user = makeUser();
      const req = makeMockRequest();

      await expect(
        controller.createBatch('5', {} as never, user, req as Request),
      ).resolves.toBe(formattedResult);
    });
  });
});
