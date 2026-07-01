import { verifyToken } from '@clerk/backend';
import { AuthService } from './auth.service';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

const verifyTokenMock = verifyToken as unknown as jest.Mock;

interface ServiceOverrides {
  prisma?: Record<string, unknown>;
  secretKey?: string;
  authorizedParties?: string[];
}

function createService(overrides: ServiceOverrides = {}) {
  const { secretKey = 'sk_test_unit', authorizedParties = [], prisma = {} } = overrides;
  const config = {
    get authSessionTtlMs() {
      return 60_000;
    },
    get clerkSecretKey() {
      return secretKey;
    },
    get clerkJwtAuthorizedParties() {
      return authorizedParties;
    },
  };

  return new AuthService(
    {
      auth_identities: { findUnique: jest.fn() },
      ...prisma,
    } as never,
    config as never,
  );
}

function mockClerkToken(overrides: Record<string, unknown> = {}) {
  return { sub: 'user_123', email: 'clerk.user@example.test', name: 'Clerk User', ...overrides };
}

describe('AuthService Clerk session validation', () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
  });

  it('does not call Clerk when no secret key is configured', async () => {
    const service = createService({ secretKey: '' });
    await expect(service.validateClerkSession('clerk-jwt')).resolves.toBeNull();
    expect(verifyTokenMock).not.toHaveBeenCalled();
  });

  it('maps a verified Clerk token to a safe viewer identity when no DB identity exists', async () => {
    const mockPrisma = { auth_identities: { findUnique: jest.fn().mockResolvedValue(null) } };
    verifyTokenMock.mockResolvedValue(mockClerkToken({ sub: 'user_123' }));
    const service = createService({ authorizedParties: ['http://localhost:3000'], prisma: mockPrisma });

    await expect(service.validateClerkSession('clerk-jwt')).resolves.toEqual({
      id: 'clerk:user_123',
      username: 'clerk.user',
      fullName: 'Clerk User',
      positionTitle: null,
      rankTitle: null,
      email: 'clerk.user@example.test',
      phone: null,
      role: 'VIEWER',
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    });

    expect(verifyTokenMock).toHaveBeenCalledWith('clerk-jwt', {
      secretKey: 'sk_test_unit',
      authorizedParties: ['http://localhost:3000'],
    });
  });

  it('returns null when Clerk verifies a token without a subject', async () => {
    verifyTokenMock.mockResolvedValue({ email: 'missing-sub@example.test' });
    const service = createService();
    await expect(service.validateClerkSession('clerk-jwt')).resolves.toBeNull();
  });

  it('resolves to a real DB official when auth_identities links to an active official', async () => {
    const mockPrisma = {
      auth_identities: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          provider: 'clerk',
          provider_user_id: 'user_123',
          official_id: 5n,
          officials: {
            id: 5n,
            username: 'nguyen.a',
            full_name: 'Nguyen Van A',
            position_title: 'Kiem sat vien',
            rank_title: null,
            email: 'nguyen.a@example.test',
            phone: null,
            is_active: true,
            role: 'OFFICIAL',
            agencies: { id: 2n, agency_name: 'VKS Quan 1', agency_code: 'VKS-Q1' },
            official_permissions: [],
          },
        }),
      },
    };
    verifyTokenMock.mockResolvedValue(mockClerkToken({ sub: 'user_123' }));
    const service = createService({ prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    expect(result).toEqual({
      id: '5',
      username: 'nguyen.a',
      fullName: 'Nguyen Van A',
      positionTitle: 'Kiem sat vien',
      rankTitle: null,
      email: 'nguyen.a@example.test',
      phone: null,
      role: 'OFFICIAL',
      agencyId: '2',
      agencyName: 'VKS Quan 1',
      agencyCode: 'VKS-Q1',
      isActive: true,
      permissions: [],
    });
  });

  it('falls back to VIEWER when auth_identities links to an inactive official', async () => {
    const mockPrisma = {
      auth_identities: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          provider: 'clerk',
          provider_user_id: 'user_inactive',
          official_id: 99n,
          officials: {
            id: 99n,
            username: 'inactive.user',
            full_name: 'Inactive User',
            position_title: null,
            rank_title: null,
            email: 'inactive@example.test',
            phone: null,
            is_active: false,
            role: 'OFFICIAL',
            agencies: null,
            official_permissions: [],
          },
        }),
      },
    };
    verifyTokenMock.mockResolvedValue({ sub: 'user_inactive', email: 'inactive@example.test', name: 'Inactive User' });
    const service = createService({ prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    expect(result).toEqual({
      id: 'clerk:user_inactive',
      username: 'inactive',
      fullName: 'Inactive User',
      positionTitle: null,
      rankTitle: null,
      email: 'inactive@example.test',
      phone: null,
      role: 'VIEWER',
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    });
  });

  it('ignores Clerk role/metadata claims — never grants DB permissions from token', async () => {
    const mockPrisma = { auth_identities: { findUnique: jest.fn().mockResolvedValue(null) } };
    verifyTokenMock.mockResolvedValue({
      sub: 'user_metadata_admin',
      email: 'fake.admin@example.test',
      name: 'Fake Admin',
      // These must NOT grant any real permissions
      public_metadata: { role: 'ADMIN', permissions: ['FORM_TEMPLATE_EDIT'] },
      unsafe_metadata: { is_superadmin: true },
    });
    const service = createService({ prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    // Must be a safe VIEWER — no business access regardless of token claims
    expect(result).toEqual({
      id: 'clerk:user_metadata_admin',
      username: 'fake.admin',
      fullName: 'Fake Admin',
      positionTitle: null,
      rankTitle: null,
      email: 'fake.admin@example.test',
      phone: null,
      role: 'VIEWER',
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    });
  });

  it('falls back to VIEWER when auth_identity has no official_id', async () => {
    const mockPrisma = {
      auth_identities: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1n,
          provider: 'clerk',
          provider_user_id: 'user_no_official',
          official_id: null,
          officials: null,
        }),
      },
    };
    verifyTokenMock.mockResolvedValue({ sub: 'user_no_official', email: 'noofficial@example.test', name: 'No Official' });
    const service = createService({ prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    expect(result).toEqual({
      id: 'clerk:user_no_official',
      username: 'noofficial',
      fullName: 'No Official',
      positionTitle: null,
      rankTitle: null,
      email: 'noofficial@example.test',
      phone: null,
      role: 'VIEWER',
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    });
  });
});
