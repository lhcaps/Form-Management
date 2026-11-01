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
import { RenderGeneratedDocumentUseCase } from './rendering/application/render-generated-document.use-case';
import { GeneratedInputSaveOrchestrator } from './rendering/application/generated-input-save-core/generated-input-save.orchestrator';

describe('POST /documents/generated/:documentId/render-docx authorization', () => {
  let app: INestApplication;
  let renderUseCase: { execute: jest.Mock };
  let rendererService: { renderDocx: jest.Mock };
  let accessService: { assertCanAccessGeneratedDocument: jest.Mock };

  beforeEach(async () => {
    renderUseCase = {
      execute: jest.fn().mockResolvedValue({
        skipped: false,
        file: { id: '900', fileName: 'BM-001.docx', fileFormat: 'DOCX', filePath: '/tmp/BM-001.docx' },
        wasInserted: true,
      }),
    };
    rendererService = {
      renderDocx: jest.fn(),
    };
    // Document 100 belongs to case 10, agency 5.
    // VIEWER must be rejected, OFFICIAL with wrong agency must be rejected,
    // OFFICIAL/ADMIN with correct agency must be allowed.
    accessService = {
      assertCanAccessGeneratedDocument: jest
        .fn()
        .mockImplementation(async (user: any, documentId: string) => {
          if (!user) {
            const err = new Error('Missing user') as Error & { status?: number };
            (err as any).status = 403;
            throw err;
          }
          if (user.role === 'VIEWER') {
            throw new ForbiddenException(
              'Người dùng Clerk không có quyền truy cập API nghiệp vụ.',
            );
          }
          if (user.role !== 'ADMIN' && user.agencyId !== '5') {
            throw new ForbiddenException(
              'Không có quyền truy cập tài nguyên thuộc cơ quan này.',
            );
          }
          return {
            documentId: BigInt(documentId),
            caseId: 10n,
            agencyId: user.agencyId ? BigInt(user.agencyId) : null,
            businessUser: {
              officialId: BigInt(user.id),
              role: user.role as 'OFFICIAL' | 'ADMIN',
              agencyId: user.agencyId ? BigInt(user.agencyId) : null,
              fullName: user.fullName ?? '',
            },
          };
        }),
    };

    const prisma = {
      cases: { findFirst: jest.fn().mockResolvedValue({ id: 10n, agency_id: 5n }) },
      generated_documents: { findFirst: jest.fn().mockResolvedValue({ id: 100n, case_id: 10n }) },
      official_permissions: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const authService = {
      getCookieOptions: jest.fn().mockReturnValue({ name: 'qlv_session' }),
      validateSession: jest.fn().mockResolvedValue(null),
      validateClerkSession: jest.fn().mockImplementation((token: string) => {
        if (token === 'viewer') {
          return {
            id: 'viewer-1',
            username: 'viewer',
            fullName: 'Viewer',
            positionTitle: null,
            rankTitle: null,
            email: null,
            phone: null,
            role: 'VIEWER',
            agencyId: null,
            agencyName: null,
            agencyCode: null,
            isActive: true,
            permissions: [],
          };
        }
        if (token === 'wrong-agency') {
          return {
            id: '2',
            username: 'wrong',
            fullName: 'Wrong agency',
            positionTitle: null,
            rankTitle: null,
            email: null,
            phone: null,
            role: 'OFFICIAL',
            agencyId: '6',
            agencyName: 'Wrong agency',
            agencyCode: null,
            isActive: true,
            permissions: [],
          };
        }
        if (token === 'correct-official') {
          return {
            id: '1',
            username: 'correct',
            fullName: 'Correct official',
            positionTitle: null,
            rankTitle: null,
            email: null,
            phone: null,
            role: 'OFFICIAL',
            agencyId: '5',
            agencyName: 'Correct agency',
            agencyCode: null,
            isActive: true,
            permissions: [],
          };
        }
        if (token === 'admin') {
          return {
            id: '99',
            username: 'admin',
            fullName: 'Admin user',
            positionTitle: null,
            rankTitle: null,
            email: null,
            phone: null,
            role: 'ADMIN',
            agencyId: null,
            agencyName: null,
            agencyCode: null,
            isActive: true,
            permissions: [
              'FORM_TEMPLATE_EDIT',
              'FORM_TEMPLATE_APPROVE',
              'FORM_TEMPLATE_PERMISSION_ADMIN',
            ],
          };
        }
        return null;
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DocumentRendererController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: authService },
        { provide: DocumentRendererService, useValue: rendererService as never },
        { provide: RenderGeneratedDocumentUseCase, useValue: renderUseCase as never },
        { provide: GeneratedInputSaveOrchestrator, useValue: { save: jest.fn() } },
        { provide: AgencyResourceAccessService, useValue: accessService },
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

  const payload = { force: true };

  it('rejects a request without a token with 401 and never reaches the use case', async () => {
    await request(app.getHttpServer())
      .post('/documents/generated/100/render-docx')
      .send(payload)
      .expect(401);
    expect(renderUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects a request with an invalid Bearer with 401 and never reaches the use case', async () => {
    await request(app.getHttpServer())
      .post('/documents/generated/100/render-docx')
      .set('Authorization', 'Bearer not-a-valid-clerk-token')
      .send(payload)
      .expect(401);
    expect(renderUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects a Clerk viewer with 403 and never reaches the use case', async () => {
    await request(app.getHttpServer())
      .post('/documents/generated/100/render-docx')
      .set('Authorization', 'Bearer viewer')
      .send(payload)
      .expect(403);
    expect(renderUseCase.execute).not.toHaveBeenCalled();
  });

  it('rejects an official from a different agency with 403 and never reaches the use case', async () => {
    await request(app.getHttpServer())
      .post('/documents/generated/100/render-docx')
      .set('Authorization', 'Bearer wrong-agency')
      .send(payload)
      .expect(403);
    expect(renderUseCase.execute).not.toHaveBeenCalled();
  });

  it('accepts a Clerk official from the document agency and forwards the canonical actor', async () => {
    await request(app.getHttpServer())
      .post('/documents/generated/100/render-docx')
      .set('Authorization', 'Bearer correct-official')
      .send(payload)
      .expect(201);

    expect(renderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: '100',
        options: expect.objectContaining({
          force: true,
          renderedByName: 'Correct official',
        }),
        actor: expect.objectContaining({
          id: '1',
          fullName: 'Correct official',
          role: 'OFFICIAL',
          agencyId: '5',
        }),
      }),
    );
  });

  it('accepts a Clerk admin and forwards the canonical actor (admin cross-agency is allowed)', async () => {
    await request(app.getHttpServer())
      .post('/documents/generated/100/render-docx')
      .set('Authorization', 'Bearer admin')
      .send(payload)
      .expect(201);

    expect(renderUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: '100',
        options: expect.objectContaining({
          force: true,
          renderedByName: 'Admin user',
        }),
        actor: expect.objectContaining({
          id: '99',
          fullName: 'Admin user',
          role: 'ADMIN',
        }),
      }),
    );
  });
});
