import { INestApplication } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AgencyResourceAccessService } from '../auth/agency-resource-access.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { FormPermissionGuard } from '../auth/form-permission.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import {
  GeneratedDocumentAuditService,
} from './generated-document-audit.service';

describe('POST /documents/draft-from-template authorization', () => {
  let app: INestApplication;
  let documentsService: { createDraftFromTemplate: jest.Mock };

  beforeEach(async () => {
    documentsService = {
      createDraftFromTemplate: jest.fn().mockResolvedValue({
        documentId: '100',
        templateCode: 'BM-002',
        isNew: true,
        reused: false,
        caseId: '10',
        reviewStatus: 'DRAFT',
        documentTitle: 'Bridge draft',
      }),
    };

    const prisma = {
      cases: {
        findFirst: jest.fn().mockResolvedValue({ id: 10n, agency_id: 5n }),
      },
      official_permissions: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const authService = {
      getCookieOptions: jest.fn().mockReturnValue({ name: 'qlv_session' }),
      validateSession: jest.fn().mockResolvedValue(null),
      validateClerkSession: jest.fn().mockImplementation((token: string) => {
        if (token === 'viewer') {
          return {
            id: 'viewer-1',
            role: 'VIEWER',
            agencyId: null,
            fullName: 'Viewer',
          };
        }
        if (token === 'wrong-agency') {
          return {
            id: '2',
            role: 'OFFICIAL',
            agencyId: '6',
            fullName: 'Wrong agency',
          };
        }
        if (token === 'correct-official') {
          return {
            id: '1',
            role: 'OFFICIAL',
            agencyId: '5',
            fullName: 'Correct official',
          };
        }
        return null;
      }),
    };
    const audit = {
      record: jest.fn().mockResolvedValue(undefined),
      buildActor: jest.fn().mockReturnValue({}),
      normalizeRequestMeta: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: DocumentsService, useValue: documentsService },
        { provide: GeneratedDocumentAuditService, useValue: audit },
        AgencyResourceAccessService,
        AuthGuard,
        FormPermissionGuard,
        { provide: APP_GUARD, useExisting: AuthGuard },
        { provide: APP_GUARD, useExisting: FormPermissionGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const payload = { templateCode: 'BM-002', caseId: '10' };

  it('rejects a request without a token with 401', async () => {
    await request(app.getHttpServer())
      .post('/documents/draft-from-template')
      .send(payload)
      .expect(401);
  });

  it('rejects a Clerk viewer with 403', async () => {
    await request(app.getHttpServer())
      .post('/documents/draft-from-template')
      .set('Authorization', 'Bearer viewer')
      .send(payload)
      .expect(403);
  });

  it('rejects an official from another agency with 403', async () => {
    await request(app.getHttpServer())
      .post('/documents/draft-from-template')
      .set('Authorization', 'Bearer wrong-agency')
      .send(payload)
      .expect(403);
  });

  it('accepts an official from the case agency and uses canonical identity', async () => {
    const response = await request(app.getHttpServer())
      .post('/documents/draft-from-template')
      .set('Authorization', 'Bearer correct-official')
      .send(payload)
      .expect(201);

    expect(response.body.documentId).toBe('100');
    expect(documentsService.createDraftFromTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        officialId: 1n,
        agencyId: 5n,
        officialName: 'Correct official',
      }),
    );
  });
});
