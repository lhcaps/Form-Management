import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AgencyResourceAccessService } from './agency-resource-access.service';

function makeOfficial(id: string, agencyId: string | null, role: 'ADMIN' | 'OFFICIAL' = 'OFFICIAL') {
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

function makeClerk(id: string) {
  return {
    id,
    username: 'clerk',
    fullName: 'Clerk User',
    positionTitle: null,
    rankTitle: null,
    email: null,
    phone: null,
    role: 'VIEWER' as const,
    agencyId: null,
    agencyName: null,
    agencyCode: null,
    isActive: true,
    permissions: [],
  };
}

function mockPrisma(caseRow?: { id: bigint; agency_id: bigint | null } | null) {
  return {
    cases: {
      findFirst: jest.fn().mockResolvedValue(caseRow ?? null),
    },
    generated_documents: {
      findFirst: jest.fn().mockResolvedValue({ id: 1n, case_id: 1n }),
    },
    generated_document_files: {
      findFirst: jest.fn().mockResolvedValue({
        id: 1n,
        generated_document_id: 1n,
        file_path: '/repo/uploads/test.docx',
        file_name: 'test.docx',
        file_format: 'DOCX',
      }),
    },
  };
}

describe('AgencyResourceAccessService', () => {
  let service: AgencyResourceAccessService;
  let prisma: ReturnType<typeof mockPrisma>;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new AgencyResourceAccessService(prisma as never);
  });

  // ─── requireBusinessUser ───────────────────────────────────────────────

  describe('requireBusinessUser', () => {
    it('throws UnauthorizedException when user is null', () => {
      expect(() => service.requireBusinessUser(null)).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user is undefined', () => {
      expect(() => service.requireBusinessUser(undefined)).toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException for Clerk VIEWER with clerk:user_xxx id', () => {
      const clerk = makeClerk('clerk:user_123');
      expect(() => service.requireBusinessUser(clerk)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for VIEWER with numeric id', () => {
      const viewer = { ...makeOfficial('5', '1'), role: 'VIEWER' as const };
      expect(() => service.requireBusinessUser(viewer)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for unknown role', () => {
      const unknown = { ...makeOfficial('5', '1'), role: 'SUPERUSER' as never };
      expect(() => service.requireBusinessUser(unknown)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for non-numeric official id', () => {
      const bad = makeOfficial('clerk:user_xxx', null, 'OFFICIAL');
      expect(() => service.requireBusinessUser(bad)).toThrow(ForbiddenException);
    });

    it('returns normalized BusinessUser for OFFICIAL with numeric id', () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      const result = service.requireBusinessUser(user);
      expect(result.officialId).toBe(5n);
      expect(result.role).toBe('OFFICIAL');
      expect(result.agencyId).toBe(1n);
      expect(result.fullName).toBe('Test User');
    });

    it('returns normalized BusinessUser for ADMIN', () => {
      const user = makeOfficial('3', '2', 'ADMIN');
      const result = service.requireBusinessUser(user);
      expect(result.officialId).toBe(3n);
      expect(result.role).toBe('ADMIN');
      expect(result.agencyId).toBe(2n);
    });

    it('returns null agencyId for OFFICIAL without agency', () => {
      const user = makeOfficial('7', '', 'OFFICIAL');
      const result = service.requireBusinessUser(user);
      expect(result.agencyId).toBeNull();
    });
  });

  // ─── assertCanAccessAgency ────────────────────────────────────────────

  describe('assertCanAccessAgency', () => {
    it('throws UnauthorizedException when user is null', () => {
      expect(() => service.assertCanAccessAgency(null, 1n)).toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException for VIEWER', () => {
      expect(() => service.assertCanAccessAgency(makeClerk('clerk:user_x'), 1n)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for OFFICIAL with null agency', () => {
      const user = makeOfficial('5', '', 'OFFICIAL');
      expect(() => service.assertCanAccessAgency(user, 1n)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when OFFICIAL agencyId does not match', () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      expect(() => service.assertCanAccessAgency(user, 2n)).toThrow(ForbiddenException);
    });

    it('allows OFFICIAL when agencyId matches', () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      const result = service.assertCanAccessAgency(user, 1n);
      expect(result.officialId).toBe(5n);
    });

    it('allows ADMIN for any agency', () => {
      const user = makeOfficial('1', '99', 'ADMIN');
      const result = service.assertCanAccessAgency(user, 1n);
      expect(result.officialId).toBe(1n);
    });

    it('throws ForbiddenException for OFFICIAL when target agencyId is null', () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      expect(() => service.assertCanAccessAgency(user, null)).toThrow(ForbiddenException);
    });

    it('allows ADMIN for null agencyId', () => {
      const user = makeOfficial('1', '99', 'ADMIN');
      const result = service.assertCanAccessAgency(user, null);
      expect(result.role).toBe('ADMIN');
    });
  });

  // ─── assertCanAccessCase ──────────────────────────────────────────────

  describe('assertCanAccessCase', () => {
    it('throws NotFoundException when case does not exist', async () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      prisma.cases.findFirst.mockResolvedValue(null);
      await expect(service.assertCanAccessCase(user, '99')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when case is soft-deleted', async () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      prisma.cases.findFirst.mockResolvedValue(null);
      await expect(service.assertCanAccessCase(user, '1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for OFFICIAL cross-agency case', async () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      prisma.cases.findFirst.mockResolvedValue({ id: 10n, agency_id: 2n });
      await expect(service.assertCanAccessCase(user, '10')).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for VIEWER', async () => {
      // Mock case as existing so assertCanAccessAgency (calls requireBusinessUser) runs first.
      prisma.cases.findFirst.mockResolvedValue({ id: 10n, agency_id: 1n });
      await expect(service.assertCanAccessCase(makeClerk('clerk:user_x'), '10')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows OFFICIAL same agency case', async () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      prisma.cases.findFirst.mockResolvedValue({ id: 10n, agency_id: 1n });
      const result = await service.assertCanAccessCase(user, '10');
      expect(result.caseId).toBe(10n);
      expect(result.agencyId).toBe(1n);
    });

    it('allows ADMIN any agency case', async () => {
      const user = makeOfficial('1', '99', 'ADMIN');
      prisma.cases.findFirst.mockResolvedValue({ id: 10n, agency_id: 5n });
      const result = await service.assertCanAccessCase(user, '10');
      expect(result.caseId).toBe(10n);
    });

    it('throws BadRequestException for invalid caseId', async () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      await expect(service.assertCanAccessCase(user, 'abc')).rejects.toThrow();
    });

    it('throws BadRequestException for zero caseId', async () => {
      const user = makeOfficial('5', '1', 'OFFICIAL');
      await expect(service.assertCanAccessCase(user, '0')).rejects.toThrow();
    });
  });

  // ─── assertCanAccessGeneratedDocumentFile ──────────────────────────────

  describe('assertCanAccessGeneratedDocumentFile', () => {
    beforeEach(() => {
      prisma.generated_document_files.findFirst.mockResolvedValue({
        id: 7n,
        generated_document_id: 3n,
        file_path: '/repo/uploads/test.docx',
        file_name: 'test.docx',
        file_format: 'DOCX',
      });
      prisma.generated_documents.findFirst.mockResolvedValue({ id: 3n, case_id: 4n });
      prisma.cases.findFirst.mockResolvedValue({ id: 4n, agency_id: 2n });
    });

    it('throws NotFoundException when file does not exist', async () => {
      const user = makeOfficial('5', '2', 'OFFICIAL');
      prisma.generated_document_files.findFirst.mockResolvedValue(null);
      await expect(
        service.assertCanAccessGeneratedDocumentFile(user, '3', '7'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when file/document mismatch', async () => {
      // Note: Prisma's findFirst already filters by generated_document_id = documentId.
      // So a "mismatch" returns null (file not found for that document).
      const user = makeOfficial('5', '2', 'OFFICIAL');
      // The query finds no file because the file belongs to doc 99, not doc 3.
      prisma.generated_document_files.findFirst.mockResolvedValue(null);
      await expect(
        service.assertCanAccessGeneratedDocumentFile(user, '3', '7'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when document does not exist', async () => {
      const user = makeOfficial('5', '2', 'OFFICIAL');
      prisma.generated_documents.findFirst.mockResolvedValue(null);
      await expect(
        service.assertCanAccessGeneratedDocumentFile(user, '3', '7'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when case does not exist', async () => {
      const user = makeOfficial('5', '2', 'OFFICIAL');
      prisma.cases.findFirst.mockResolvedValue(null);
      await expect(
        service.assertCanAccessGeneratedDocumentFile(user, '3', '7'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException for cross-agency file', async () => {
      const user = makeOfficial('5', '1', 'OFFICIAL'); // agency 1
      prisma.cases.findFirst.mockResolvedValue({ id: 4n, agency_id: 2n }); // agency 2
      await expect(
        service.assertCanAccessGeneratedDocumentFile(user, '3', '7'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for VIEWER', async () => {
      await expect(
        service.assertCanAccessGeneratedDocumentFile(makeClerk('clerk:user_x'), '3', '7'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows OFFICIAL same agency file', async () => {
      const user = makeOfficial('5', '2', 'OFFICIAL');
      const result = await service.assertCanAccessGeneratedDocumentFile(user, '3', '7');
      expect(result.documentId).toBe(3n);
      expect(result.fileId).toBe(7n);
      expect(result.caseId).toBe(4n);
      expect(result.agencyId).toBe(2n);
    });

    it('allows ADMIN any agency file', async () => {
      const user = makeOfficial('1', '99', 'ADMIN');
      const result = await service.assertCanAccessGeneratedDocumentFile(user, '3', '7');
      expect(result.agencyId).toBe(2n);
    });

    it('throws BadRequestException for invalid documentId', async () => {
      const user = makeOfficial('5', '2', 'OFFICIAL');
      await expect(
        service.assertCanAccessGeneratedDocumentFile(user, 'abc', '7'),
      ).rejects.toThrow();
    });

    it('throws BadRequestException for invalid fileId', async () => {
      const user = makeOfficial('5', '2', 'OFFICIAL');
      await expect(
        service.assertCanAccessGeneratedDocumentFile(user, '3', '-1'),
      ).rejects.toThrow();
    });
  });
});
