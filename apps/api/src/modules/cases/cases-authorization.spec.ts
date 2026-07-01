import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CasesService } from './cases.service';
import { DocumentFilesService } from '../documents/document-files.service';
import type { CurrentUser } from '../auth/current-user.type';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeOfficial(
  id: string,
  agencyId: string | null,
  role: 'ADMIN' | 'OFFICIAL' = 'OFFICIAL',
): CurrentUser {
  return {
    id,
    username: 'test',
    fullName: 'Test User',
    positionTitle: null,
    rankTitle: null,
    email: null,
    phone: null,
    role,
    agencyId,
    agencyName: 'Test Agency',
    agencyCode: 'TA',
    isActive: true,
    permissions: [],
  };
}

function makeClerk(id: string): CurrentUser {
  return {
    id,
    username: 'clerk',
    fullName: 'Clerk User',
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

function makeCaseRow(id: bigint, agencyId: bigint | null) {
  return {
    id,
    case_code: `CASE-${id}`,
    case_title: 'Test Case',
    case_summary: null,
    case_type: 'CRIMINAL_CASE',
    source_type: null,
    current_stage: 'RECEPTION',
    current_status: 'DRAFT',
    ward_id: null,
    agency_id: agencyId,
    received_date: null,
    accepted_date: null,
    prosecuted_date: null,
    closed_date: null,
    priority: 'NORMAL',
    note: null,
    is_deleted: false,
    created_by_name: 'System',
    updated_by_name: 'System',
    created_at: new Date(),
    updated_at: new Date(),
  };
}

function makeFileRow(id: bigint, documentId: bigint) {
  return {
    id,
    generated_document_id: documentId,
    stored_file_id: null,
    file_format: 'DOCX',
    file_name: 'test.docx',
    file_path: '/repo/uploads/test.docx',
    file_size_bytes: 1024n,
    checksum: null,
    is_final: false,
    created_at: new Date(),
  };
}

function makeAuthMock(overrides?: {
  requireBusinessUser?: jest.Mock;
  assertCanAccessAgency?: jest.Mock;
  assertCanAccessCase?: jest.Mock;
  assertCanAccessGeneratedDocumentFile?: jest.Mock;
}) {
  return {
    requireBusinessUser: overrides?.requireBusinessUser ?? jest.fn(),
    assertCanAccessAgency: overrides?.assertCanAccessAgency ?? jest.fn(),
    assertCanAccessCase: overrides?.assertCanAccessCase ?? jest.fn(),
    assertCanAccessGeneratedDocumentFile:
      overrides?.assertCanAccessGeneratedDocumentFile ?? jest.fn(),
  };
}

function makePrismaMock() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p: any = {
    cases: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
    },
    case_people: { findMany: jest.fn().mockResolvedValue([]) },
    people: { findMany: jest.fn().mockResolvedValue([]) },
    case_offenses: { findMany: jest.fn().mockResolvedValue([]) },
    offenses: { findMany: jest.fn().mockResolvedValue([]) },
    case_assignments: { findMany: jest.fn().mockResolvedValue([]) },
    officials: { findMany: jest.fn().mockResolvedValue([]) },
    evidence_items: { findMany: jest.fn().mockResolvedValue([]) },
    generated_documents: { findMany: jest.fn().mockResolvedValue([]) },
    case_events: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(null),
    },
    $transaction: jest.fn().mockImplementation(
      async (queries: unknown): Promise<unknown> => {
        if (Array.isArray(queries)) {
          return Promise.all(
            queries.map((q) => {
              if (typeof q === 'object' && q !== null && 'then' in q) {
                return q as Promise<unknown>;
              }
              return (q as () => Promise<unknown>)();
            }),
          );
        }
        return (queries as () => Promise<unknown>)();
      },
    ),
  };
  return p;
}

// ─── CasesService tests ────────────────────────────────────────────────────────

describe('CasesService — agency authorization', () => {
  // We use `any` for the mock objects to avoid TypeScript complexity.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildService(authMock: any, prismaMock: any) {
    const svc = new CasesService(prismaMock, authMock);
    return svc;
  }

  describe('findAll', () => {
    it('rejects VIEWER with 403', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockImplementation(() => {
          throw new ForbiddenException('Người dùng Clerk không có quyền truy cập API nghiệp vụ.');
        }),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.findAll({}, makeClerk('clerk:user_123')),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects null user with 403', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockImplementation(() => {
          throw new UnauthorizedException('Thiếu thông tin xác thực.');
        }),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(svc.findAll({}, null)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows ADMIN to list all cases', async () => {
      const authMock = makeAuthMock();
      const prismaMock = makePrismaMock();
      const rows = [makeCaseRow(1n, 1n), makeCaseRow(2n, 2n)];
      prismaMock.cases.count.mockResolvedValue(2);
      prismaMock.cases.findMany.mockResolvedValue(rows);
      const svc = buildService(authMock, prismaMock);

      const result = await svc.findAll({}, makeOfficial('1', '1', 'ADMIN'));

      expect(result.items).toHaveLength(2);
    });

    it('OFFICIAL sees only own agency cases', async () => {
      const authMock = makeAuthMock();
      const prismaMock = makePrismaMock();
      const ownAgencyRows = [makeCaseRow(1n, 1n)];
      prismaMock.cases.count.mockResolvedValue(1);
      prismaMock.cases.findMany.mockResolvedValue(ownAgencyRows);
      const svc = buildService(authMock, prismaMock);

      await svc.findAll({}, makeOfficial('5', '1', 'OFFICIAL'));

      const findManyCall = prismaMock.cases.findMany.mock.calls[0][0];
      expect(findManyCall.where.AND).toContainEqual({ agency_id: BigInt('1') });
    });
  });

  describe('getReportSummary', () => {
    it('rejects VIEWER with 403', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockImplementation(() => {
          throw new ForbiddenException('Người dùng Clerk không có quyền truy cập API nghiệp vụ.');
        }),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.getReportSummary({}, makeClerk('clerk:user_123')),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects null user with 403', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockImplementation(() => {
          throw new UnauthorizedException('Thiếu thông tin xác thực.');
        }),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.getReportSummary({}, undefined as unknown as CurrentUser),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('OFFICIAL without agency gets 403', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockImplementation(() => {
          throw new ForbiddenException('Không có quyền xem báo cáo nghiệp vụ.');
        }),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.getReportSummary({}, makeOfficial('5', null, 'OFFICIAL')),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('OFFICIAL summary scoped to own agency', async () => {
      const authMock = makeAuthMock();
      const prismaMock = makePrismaMock();
      prismaMock.cases.findMany.mockResolvedValue([]);
      const svc = buildService(authMock, prismaMock);

      await svc.getReportSummary({}, makeOfficial('5', '1', 'OFFICIAL'));

      const findManyCall = prismaMock.cases.findMany.mock.calls[0][0];
      expect(findManyCall.where.agency_id).toBe(BigInt('1'));
    });

    it('ADMIN summary not scoped to agency', async () => {
      const authMock = makeAuthMock();
      const prismaMock = makePrismaMock();
      prismaMock.cases.findMany.mockResolvedValue([]);
      const svc = buildService(authMock, prismaMock);

      await svc.getReportSummary({}, makeOfficial('1', '1', 'ADMIN'));

      const findManyCall = prismaMock.cases.findMany.mock.calls[0][0];
      expect(findManyCall.where.agency_id).toBeUndefined();
    });
  });

  describe('create', () => {
    it('rejects VIEWER with 403', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockImplementation(() => {
          throw new ForbiddenException('Người dùng Clerk không có quyền truy cập API nghiệp vụ.');
        }),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.create({ caseTitle: 'Test' }, makeClerk('clerk:user_123')),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('OFFICIAL create defaults agencyId to own agency', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockReturnValue({
          officialId: 5n,
          role: 'OFFICIAL',
          agencyId: 1n,
          fullName: 'Test User',
        }),
        assertCanAccessCase: jest.fn().mockResolvedValue({
          caseId: 10n,
          agencyId: 1n,
          businessUser: { officialId: 5n, role: 'OFFICIAL' as const, agencyId: 1n, fullName: 'Test User' },
          caseRow: { id: 10n, agency_id: 1n },
        }),
      });
      const prismaMock = makePrismaMock();
      const createdCase = makeCaseRow(10n, 1n);
      prismaMock.cases.create.mockResolvedValue(createdCase);
      prismaMock.cases.findFirst.mockResolvedValue(createdCase);
      const svc = buildService(authMock, prismaMock);

      await svc.create({ caseTitle: 'Test Case', agencyId: undefined }, makeOfficial('5', '1', 'OFFICIAL'));

      const createCall = prismaMock.cases.create.mock.calls[0][0];
      expect(createCall.data.agency_id).toBe(1n);
      expect(createCall.data.created_by_name).toBe('Test User');
    });

    it('OFFICIAL create with different agencyId throws 403', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockReturnValue({
          officialId: 5n,
          role: 'OFFICIAL',
          agencyId: 1n,
          fullName: 'Test User',
        }),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.create({ caseTitle: 'Test', agencyId: '2' }, makeOfficial('5', '1', 'OFFICIAL')),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('OFFICIAL create with matching agencyId succeeds', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockReturnValue({
          officialId: 5n,
          role: 'OFFICIAL',
          agencyId: 1n,
          fullName: 'Test User',
        }),
        assertCanAccessCase: jest.fn().mockResolvedValue({
          caseId: 10n,
          agencyId: 1n,
          businessUser: { officialId: 5n, role: 'OFFICIAL' as const, agencyId: 1n, fullName: 'Test User' },
          caseRow: { id: 10n, agency_id: 1n },
        }),
      });
      const prismaMock = makePrismaMock();
      const createdCase = makeCaseRow(10n, 1n);
      prismaMock.cases.create.mockResolvedValue(createdCase);
      prismaMock.cases.findFirst.mockResolvedValue(createdCase);
      const svc = buildService(authMock, prismaMock);

      await svc.create({ caseTitle: 'Test', agencyId: '1' }, makeOfficial('5', '1', 'OFFICIAL'));

      const createCall = prismaMock.cases.create.mock.calls[0][0];
      expect(createCall.data.agency_id).toBe(1n);
    });

    it('ADMIN can create for any agency', async () => {
      const authMock = makeAuthMock({
        requireBusinessUser: jest.fn().mockReturnValue({
          officialId: 1n,
          role: 'ADMIN',
          agencyId: 99n,
          fullName: 'Admin User',
        }),
        assertCanAccessCase: jest.fn().mockResolvedValue({
          caseId: 10n,
          agencyId: 5n,
          businessUser: { officialId: 1n, role: 'ADMIN' as const, agencyId: 99n, fullName: 'Admin User' },
          caseRow: { id: 10n, agency_id: 5n },
        }),
      });
      const prismaMock = makePrismaMock();
      const createdCase = makeCaseRow(10n, 5n);
      prismaMock.cases.create.mockResolvedValue(createdCase);
      prismaMock.cases.findFirst.mockResolvedValue(createdCase);
      const svc = buildService(authMock, prismaMock);

      await svc.create({ caseTitle: 'Test', agencyId: '5' }, makeOfficial('1', '99', 'ADMIN'));

      const createCall = prismaMock.cases.create.mock.calls[0][0];
      expect(createCall.data.agency_id).toBe(5n);
    });
  });

  describe('findOne', () => {
    it('calls assertCanAccessCase before returning case data', async () => {
      const authMock = makeAuthMock({
        assertCanAccessCase: jest.fn().mockResolvedValue({
          caseId: 10n,
          agencyId: 1n,
          businessUser: { officialId: 5n, role: 'OFFICIAL' as const, agencyId: 1n, fullName: 'Test' },
          caseRow: { id: 10n, agency_id: 1n },
        }),
      });
      const prismaMock = makePrismaMock();
      prismaMock.cases.findFirst.mockResolvedValue(makeCaseRow(10n, 1n));
      const svc = buildService(authMock, prismaMock);

      await svc.findOne('10', makeOfficial('5', '1', 'OFFICIAL'));

      expect(authMock.assertCanAccessCase).toHaveBeenCalledWith(
        makeOfficial('5', '1', 'OFFICIAL'),
        '10',
      );
    });

    it('throws NotFoundException when assertCanAccessCase fails', async () => {
      const authMock = makeAuthMock({
        assertCanAccessCase: jest.fn().mockRejectedValue(new NotFoundException('Not found')),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.findOne('99', makeOfficial('5', '1', 'OFFICIAL')),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException for cross-agency access', async () => {
      const authMock = makeAuthMock({
        assertCanAccessCase: jest.fn().mockRejectedValue(new ForbiddenException('Forbidden')),
      });
      const prismaMock = makePrismaMock();
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.findOne('10', makeOfficial('5', '1', 'OFFICIAL')),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('update', () => {
    it('calls assertCanAccessCase before mutation', async () => {
      const authMock = makeAuthMock({
        assertCanAccessCase: jest.fn().mockResolvedValue({
          caseId: 10n,
          agencyId: 1n,
          businessUser: { officialId: 5n, role: 'OFFICIAL' as const, agencyId: 1n, fullName: 'Test' },
          caseRow: { id: 10n, agency_id: 1n },
        }),
      });
      const prismaMock = makePrismaMock();
      const caseRow = makeCaseRow(10n, 1n);
      const updatedCase = { ...caseRow, case_title: 'Updated' };
      prismaMock.cases.findFirst.mockResolvedValue(caseRow);
      prismaMock.cases.update.mockResolvedValue(updatedCase);
      const svc = buildService(authMock, prismaMock);

      await svc.update('10', { caseTitle: 'Updated' }, makeOfficial('5', '1', 'OFFICIAL'));

      expect(authMock.assertCanAccessCase).toHaveBeenCalledWith(
        makeOfficial('5', '1', 'OFFICIAL'),
        '10',
      );
    });

    it('OFFICIAL cannot change case to different agency', async () => {
      const authMock = makeAuthMock({
        assertCanAccessCase: jest.fn().mockResolvedValue({
          caseId: 10n,
          agencyId: 1n,
          businessUser: { officialId: 5n, role: 'OFFICIAL' as const, agencyId: 1n, fullName: 'Test' },
          caseRow: { id: 10n, agency_id: 1n },
        }),
      });
      const prismaMock = makePrismaMock();
      prismaMock.cases.findFirst.mockResolvedValue(makeCaseRow(10n, 1n));
      const svc = buildService(authMock, prismaMock);

      await expect(
        svc.update('10', { agencyId: '2' }, makeOfficial('5', '1', 'OFFICIAL')),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updatedByName comes from validated business user', async () => {
      const authMock = makeAuthMock({
        assertCanAccessCase: jest.fn().mockResolvedValue({
          caseId: 10n,
          agencyId: 1n,
          businessUser: { officialId: 5n, role: 'OFFICIAL' as const, agencyId: 1n, fullName: 'Validated Name' },
          caseRow: { id: 10n, agency_id: 1n },
        }),
      });
      const prismaMock = makePrismaMock();
      const caseRow = makeCaseRow(10n, 1n);
      const updatedCase = { ...caseRow, case_title: 'Updated' };
      prismaMock.cases.findFirst.mockResolvedValue(caseRow);
      prismaMock.cases.update.mockResolvedValue(updatedCase);
      const svc = buildService(authMock, prismaMock);

      await svc.update('10', { caseTitle: 'Updated' }, makeOfficial('5', '1', 'OFFICIAL'));

      const updateCall = prismaMock.cases.update.mock.calls[0][0];
      expect(updateCall.data.updated_by_name).toBe('Validated Name');
    });
  });
});

// ─── DocumentFilesService authorization tests ─────────────────────────────────

describe('DocumentFilesService — authorization before file operations', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function buildDocService(authMock: any, prismaMock: any, pathsMock: any) {
    return new DocumentFilesService(prismaMock, pathsMock, authMock);
  }

  describe('download — no stream before authorization', () => {
    it('throws before any file system access when authorization fails', async () => {
      const authMock = makeAuthMock({
        assertCanAccessGeneratedDocumentFile: jest.fn().mockRejectedValue(
          new ForbiddenException('Cross-agency'),
        ),
      });
      const prismaMock = {
        generated_document_files: { findFirst: jest.fn() },
      };
      const pathsMock = { repoRoot: '/repo' };
      const svc = buildDocService(authMock, prismaMock, pathsMock);

      await expect(
        svc.getGeneratedFileForDownload('3', '7', makeOfficial('5', '1', 'OFFICIAL')),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Prisma should NOT have been queried
      expect(prismaMock.generated_document_files.findFirst).not.toHaveBeenCalled();
    });

    it('throws before file system access when file not found', async () => {
      const authMock = makeAuthMock({
        assertCanAccessGeneratedDocumentFile: jest.fn().mockResolvedValue({
          documentId: 3n,
          fileId: 7n,
          caseId: 4n,
          agencyId: 1n,
          businessUser: { officialId: 5n, role: 'OFFICIAL' as const, agencyId: 1n, fullName: 'Test' },
          fileRow: makeFileRow(7n, 3n),
        }),
      });
      const prismaMock = {
        generated_document_files: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const pathsMock = { repoRoot: '/repo' };
      const svc = buildDocService(authMock, prismaMock, pathsMock);

      await expect(
        svc.getGeneratedFileForDownload('3', '7', makeOfficial('5', '1', 'OFFICIAL')),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deleteGeneratedFile — no delete before authorization', () => {
    it('throws before DB delete when authorization fails', async () => {
      const authMock = makeAuthMock({
        assertCanAccessGeneratedDocumentFile: jest.fn().mockRejectedValue(
          new ForbiddenException('Cross-agency'),
        ),
      });
      const prismaMock = {
        generated_document_files: { findFirst: jest.fn() },
        $transaction: jest.fn(),
      };
      const pathsMock = { repoRoot: '/repo' };
      const svc = buildDocService(authMock, prismaMock, pathsMock);

      await expect(
        svc.deleteGeneratedFile('3', '7', makeOfficial('5', '1', 'OFFICIAL'), true),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Transaction should NOT have been called
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('bulkDelete — no partial deletes for cross-agency', () => {
    it('throws before any delete when any file is cross-agency', async () => {
      const authMock = makeAuthMock({
        assertCanAccessGeneratedDocumentFile: jest
          .fn()
          .mockResolvedValueOnce({
            documentId: 3n,
            fileId: 7n,
            caseId: 4n,
            agencyId: 1n,
            businessUser: { officialId: 5n, role: 'OFFICIAL' as const, agencyId: 1n, fullName: 'Test' },
            fileRow: makeFileRow(7n, 3n),
          })
          .mockRejectedValueOnce(new ForbiddenException('Cross-agency on file 8')),
      });
      const prismaMock = {
        generated_document_files: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce(makeFileRow(7n, 3n))
            .mockResolvedValueOnce(makeFileRow(8n, 3n)),
        },
        $transaction: jest.fn().mockResolvedValue({}),
      };
      const pathsMock = { repoRoot: '/repo' };
      const svc = buildDocService(authMock, prismaMock, pathsMock);

      await expect(
        svc.bulkDeleteGeneratedFiles('3', ['7', '8'], makeOfficial('5', '1', 'OFFICIAL'), true),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('cleanup — no list/delete before authorization', () => {
    it('throws before listing files when authorization fails', async () => {
      const authMock = makeAuthMock({
        assertCanAccessGeneratedDocumentFile: jest.fn().mockRejectedValue(
          new ForbiddenException('Cross-agency'),
        ),
      });
      const prismaMock = {
        generated_document_files: { findMany: jest.fn() },
      };
      const pathsMock = { repoRoot: '/repo' };
      const svc = buildDocService(authMock, prismaMock, pathsMock);

      await expect(
        svc.cleanupGeneratedFiles('3', makeOfficial('5', '1', 'OFFICIAL')),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // No files should be queried
      expect(prismaMock.generated_document_files.findMany).not.toHaveBeenCalled();
    });
  });
});
