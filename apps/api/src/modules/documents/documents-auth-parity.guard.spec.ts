import { ForbiddenException, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AgencyResourceAccessService } from '../auth/agency-resource-access.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { FormPermissionGuard } from '../auth/form-permission.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentRendererController } from './document-renderer.controller';
import { DocumentRendererService } from './document-renderer.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { GeneratedDocumentAuditService } from './generated-document-audit.service';
import { RenderGeneratedDocumentUseCase } from './rendering/application/render-generated-document.use-case';
import { GeneratedInputSaveOrchestrator } from './rendering/application/generated-input-save-core/generated-input-save.orchestrator';

/**
 * Auth-parity regression guard for the document routes that the runtime
 * readiness pilot depends on:
 *
 *   POST /documents/draft-from-template  (DocumentsController)
 *   POST /documents/generated/:documentId/render-docx (DocumentRendererController)
 *
 * The two routes MUST stay semantically equivalent in their auth posture.
 * If either route ever drifts (becomes @Public, drops the agency check,
 * removes the actor from the call into the service, etc.), this guard
 * fails. The guard runs against the actual controllers + the global
 * AuthGuard + FormPermissionGuard so the assertions exercise the same
 * NestJS pipeline the pilot exercises in production.
 */
describe('Auth-parity: /documents/draft-from-template vs /documents/generated/:id/render-docx', () => {
  let app: INestApplication;
  let renderUseCase: { execute: jest.Mock };
  let documentsService: { createDraftFromTemplate: jest.Mock };
  let accessService: { assertCanAccessCase: jest.Mock; assertCanAccessGeneratedDocument: jest.Mock };
  let accessCalls: { route: 'draft' | 'render'; user: unknown; id: string }[];

  const officialUser = {
    id: '1',
    username: 'official',
    fullName: 'Correct official',
    positionTitle: null,
    rankTitle: null,
    email: null,
    phone: null,
    role: 'OFFICIAL',
    agencyId: '5',
    agencyName: 'VKS KV7',
    agencyCode: 'VKS-KV7',
    isActive: true,
    permissions: [],
  };

  beforeEach(async () => {
    renderUseCase = {
      execute: jest.fn().mockResolvedValue({
        skipped: false,
        file: { id: '900', fileName: 'BM-001.docx', fileFormat: 'DOCX', filePath: '/tmp/BM-001.docx' },
        wasInserted: true,
      }),
    };
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
    accessCalls = [];
    accessService = {
      assertCanAccessCase: jest.fn().mockImplementation(async (user: any, caseId: string) => {
        accessCalls.push({ route: 'draft', user, id: caseId });
        if (user?.role === 'VIEWER') {
          throw new ForbiddenException('viewer rejected');
        }
        if (user.agencyId !== '5') {
          throw new ForbiddenException('wrong agency');
        }
        return {
          caseId: BigInt(caseId),
          agencyId: BigInt(user.agencyId),
          businessUser: {
            officialId: BigInt(user.id),
            role: user.role as 'OFFICIAL' | 'ADMIN',
            agencyId: BigInt(user.agencyId),
            fullName: user.fullName ?? '',
          },
          caseRow: { id: BigInt(caseId), agency_id: BigInt(user.agencyId) },
        };
      }),
      assertCanAccessGeneratedDocument: jest
        .fn()
        .mockImplementation(async (user: any, documentId: string) => {
          accessCalls.push({ route: 'render', user, id: documentId });
          if (user?.role === 'VIEWER') {
            throw new ForbiddenException('viewer rejected');
          }
          if (user.agencyId !== '5') {
            throw new ForbiddenException('wrong agency');
          }
          return {
            documentId: BigInt(documentId),
            caseId: 10n,
            agencyId: BigInt(user.agencyId),
            businessUser: {
              officialId: BigInt(user.id),
              role: user.role as 'OFFICIAL' | 'ADMIN',
              agencyId: BigInt(user.agencyId),
              fullName: user.fullName ?? '',
            },
          };
        }),
    };

    const prisma = {
      cases: { findFirst: jest.fn().mockResolvedValue({ id: 10n, agency_id: 5n }) },
      generated_documents: {
        findFirst: jest.fn().mockResolvedValue({ id: 100n, case_id: 10n }),
      },
      official_permissions: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const authService = {
      getCookieOptions: jest.fn().mockReturnValue({ name: 'qlv_session' }),
      validateSession: jest.fn().mockResolvedValue(null),
      validateClerkSession: jest.fn().mockResolvedValue(officialUser),
    };
    const audit = {
      record: jest.fn().mockResolvedValue(undefined),
      buildActor: jest.fn().mockReturnValue({}),
      normalizeRequestMeta: jest.fn().mockReturnValue({}),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentsController, DocumentRendererController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: DocumentsService, useValue: documentsService },
        { provide: DocumentRendererService, useValue: { renderDocx: jest.fn() } },
        { provide: GeneratedDocumentAuditService, useValue: audit },
        { provide: AgencyResourceAccessService, useValue: accessService },
        { provide: RenderGeneratedDocumentUseCase, useValue: renderUseCase },
        {
          provide: GeneratedInputSaveOrchestrator,
          useValue: { save: jest.fn() },
        },
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

  it('rejects both routes with 401 when no Bearer is present (no @Public drift)', async () => {
    await request(app.getHttpServer())
      .post('/documents/draft-from-template')
      .send({ templateCode: 'BM-002', caseId: '10' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/documents/generated/100/render-docx')
      .send({ force: true })
      .expect(401);
    expect(accessService.assertCanAccessCase).not.toHaveBeenCalled();
    expect(accessService.assertCanAccessGeneratedDocument).not.toHaveBeenCalled();
  });

  it('enforces agency-resource check on both routes (no agency check drift)', async () => {
    // Wrong-agency official must be rejected with 403 on both routes.
    const wrongAgencyUser = { ...officialUser, agencyId: '6' };
    const prisma = {
      cases: { findFirst: jest.fn().mockResolvedValue({ id: 10n, agency_id: 5n }) },
      generated_documents: {
        findFirst: jest.fn().mockResolvedValue({ id: 100n, case_id: 10n }),
      },
      official_permissions: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const authService = {
      getCookieOptions: jest.fn().mockReturnValue({ name: 'qlv_session' }),
      validateSession: jest.fn().mockResolvedValue(null),
      validateClerkSession: jest.fn().mockResolvedValue(wrongAgencyUser),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentsController, DocumentRendererController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: DocumentsService, useValue: documentsService },
        { provide: DocumentRendererService, useValue: { renderDocx: jest.fn() } },
        { provide: GeneratedDocumentAuditService, useValue: { record: jest.fn(), buildActor: jest.fn(), normalizeRequestMeta: jest.fn() } },
        { provide: AgencyResourceAccessService, useValue: accessService },
        { provide: RenderGeneratedDocumentUseCase, useValue: renderUseCase },
        { provide: GeneratedInputSaveOrchestrator, useValue: { save: jest.fn() } },
        AuthGuard,
        FormPermissionGuard,
        { provide: APP_GUARD, useExisting: AuthGuard },
        { provide: APP_GUARD, useExisting: FormPermissionGuard },
      ],
    }).compile();
    const wrongApp = moduleRef.createNestApplication();
    await wrongApp.init();
    try {
      await request(wrongApp.getHttpServer())
        .post('/documents/draft-from-template')
        .set('Authorization', 'Bearer wrong-agency')
        .send({ templateCode: 'BM-002', caseId: '10' })
        .expect(403);
      await request(wrongApp.getHttpServer())
        .post('/documents/generated/100/render-docx')
        .set('Authorization', 'Bearer wrong-agency')
        .send({ force: true })
        .expect(403);
    } finally {
      await wrongApp.close();
    }
  });

  it('forwards the canonical actor to the service on both routes (no actor-passing drift)', async () => {
    await request(app.getHttpServer())
      .post('/documents/draft-from-template')
      .set('Authorization', 'Bearer correct-official')
      .send({ templateCode: 'BM-002', caseId: '10' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/documents/generated/100/render-docx')
      .set('Authorization', 'Bearer correct-official')
      .send({ force: true })
      .expect(201);

    // Both routes must have called the access service with the canonical user.
    const draftCalls = accessCalls.filter((c) => c.route === 'draft');
    const renderCalls = accessCalls.filter((c) => c.route === 'render');
    expect(draftCalls.length).toBeGreaterThan(0);
    expect(renderCalls.length).toBeGreaterThan(0);
    expect(draftCalls[0].user).toEqual(officialUser);
    expect(renderCalls[0].user).toEqual(officialUser);

    // Both services must have been invoked with the canonical user as actor.
    expect(documentsService.createDraftFromTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        officialId: 1n,
        agencyId: 5n,
        officialName: 'Correct official',
      }),
    );
    expect(renderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: '100',
        options: expect.objectContaining({
          force: true,
          renderedByName: 'Correct official',
        }),
        actor: officialUser,
      }),
    );
  });

  it('rejects Clerk viewer on both routes with 403 (no role-bypass drift)', async () => {
    const viewerUser = { ...officialUser, id: 'viewer-1', role: 'VIEWER', agencyId: null, fullName: 'Viewer' };
    const prisma = {
      cases: { findFirst: jest.fn().mockResolvedValue({ id: 10n, agency_id: 5n }) },
      generated_documents: {
        findFirst: jest.fn().mockResolvedValue({ id: 100n, case_id: 10n }),
      },
      official_permissions: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const authService = {
      getCookieOptions: jest.fn().mockReturnValue({ name: 'qlv_session' }),
      validateSession: jest.fn().mockResolvedValue(null),
      validateClerkSession: jest.fn().mockResolvedValue(viewerUser),
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentsController, DocumentRendererController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: DocumentsService, useValue: documentsService },
        { provide: DocumentRendererService, useValue: { renderDocx: jest.fn() } },
        { provide: GeneratedDocumentAuditService, useValue: { record: jest.fn(), buildActor: jest.fn(), normalizeRequestMeta: jest.fn() } },
        { provide: AgencyResourceAccessService, useValue: accessService },
        { provide: RenderGeneratedDocumentUseCase, useValue: renderUseCase },
        { provide: GeneratedInputSaveOrchestrator, useValue: { save: jest.fn() } },
        AuthGuard,
        FormPermissionGuard,
        { provide: APP_GUARD, useExisting: AuthGuard },
        { provide: APP_GUARD, useExisting: FormPermissionGuard },
      ],
    }).compile();
    const viewerApp = moduleRef.createNestApplication();
    await viewerApp.init();
    try {
      await request(viewerApp.getHttpServer())
        .post('/documents/draft-from-template')
        .set('Authorization', 'Bearer viewer')
        .send({ templateCode: 'BM-002', caseId: '10' })
        .expect(403);
      await request(viewerApp.getHttpServer())
        .post('/documents/generated/100/render-docx')
        .set('Authorization', 'Bearer viewer')
        .send({ force: true })
        .expect(403);
    } finally {
      await viewerApp.close();
    }
  });
});