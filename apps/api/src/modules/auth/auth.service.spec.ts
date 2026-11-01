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

describe('AuthService JIT provisioning (demo mode)', () => {
  beforeEach(() => {
    verifyTokenMock.mockReset();
  });

  function createDemoService(overrides: ServiceOverrides & { demoMode?: boolean; prisma?: any } = {}) {
    const { secretKey = 'sk_test_unit', authorizedParties = [], demoMode = true, prisma = {} } = overrides;
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
      get isProductionDemoMode() {
        return demoMode;
      },
    };

    return new AuthService(
      {
        auth_identities: { findUnique: jest.fn() },
        agencies: { findFirst: jest.fn() },
        officials: { create: jest.fn() },
        $transaction: jest.fn(),
        ...prisma,
      } as never,
      config as never,
    );
  }

  it('JIT provisions an OFFICIAL when demo mode is on and no identity exists', async () => {
    const mockTx = {
      auth_identities: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      officials: {
        create: jest.fn().mockResolvedValue({
          id: 100n,
          username: null,
          full_name: 'Demo User',
          email: 'demo@example.test',
          position_title: null,
          rank_title: null,
          phone: null,
          role: 'OFFICIAL',
          is_active: true,
          agency_id: 1n,
          agencies: { id: 1n, agency_name: 'Demo Agency', agency_code: 'DEMO' },
          official_permissions: [],
        }),
      },
    };

    const mockPrisma = {
      auth_identities: { findUnique: jest.fn().mockResolvedValue(null) },
      agencies: { findFirst: jest.fn().mockResolvedValue({ id: 1n }) },
      $transaction: jest.fn(async (callback) => callback(mockTx)),
    };

    verifyTokenMock.mockResolvedValue({ sub: 'user_demo', email: 'demo@example.test', name: 'Demo User' });
    const service = createDemoService({ demoMode: true, prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    expect(result).toEqual({
      id: '100',
      username: null,
      fullName: 'Demo User',
      positionTitle: null,
      rankTitle: null,
      email: 'demo@example.test',
      phone: null,
      role: 'OFFICIAL',
      agencyId: '1',
      agencyName: 'Demo Agency',
      agencyCode: 'DEMO',
      isActive: true,
      permissions: [],
    });
    expect(mockPrisma.agencies.findFirst).toHaveBeenCalledWith({
      where: { parent_agency_id: null },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    expect(mockTx.officials.create).toHaveBeenCalledWith({
      data: {
        full_name: 'Demo User',
        email: 'demo@example.test',
        role: 'OFFICIAL',
        is_active: true,
        agency_id: 1n,
      },
      include: { agencies: true, official_permissions: true },
    });
    expect(mockTx.auth_identities.create).toHaveBeenCalledWith({
      data: {
        provider: 'clerk',
        provider_user_id: 'user_demo',
        official_id: 100n,
        email: 'demo@example.test',
      },
    });
  });

  it('falls back to VIEWER when JIT provisioning is disabled (strict production)', async () => {
    const mockPrisma = {
      auth_identities: { findUnique: jest.fn().mockResolvedValue(null) },
      agencies: { findFirst: jest.fn() },
    };
    verifyTokenMock.mockResolvedValue({ sub: 'user_strict', email: 'strict@example.test', name: 'Strict User' });
    const service = createDemoService({ demoMode: false, prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    expect(result).toEqual({
      id: 'clerk:user_strict',
      username: 'strict',
      fullName: 'Strict User',
      positionTitle: null,
      rankTitle: null,
      email: 'strict@example.test',
      phone: null,
      role: 'VIEWER',
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    });
    expect(mockPrisma.agencies.findFirst).not.toHaveBeenCalled();
  });

  it('falls back to VIEWER when no root agency exists', async () => {
    const mockPrisma = {
      auth_identities: { findUnique: jest.fn().mockResolvedValue(null) },
      agencies: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    verifyTokenMock.mockResolvedValue({ sub: 'user_no_agency', email: 'no-agency@example.test', name: 'No Agency' });
    const service = createDemoService({ demoMode: true, prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    expect(result).toEqual({
      id: 'clerk:user_no_agency',
      username: 'no-agency',
      fullName: 'No Agency',
      positionTitle: null,
      rankTitle: null,
      email: 'no-agency@example.test',
      phone: null,
      role: 'VIEWER',
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    });
  });

  it('handles race condition: returns existing official if identity was created concurrently', async () => {
    const mockTx = {
      auth_identities: {
        findUnique: jest.fn().mockResolvedValue({
          id: 2n,
          provider: 'clerk',
          provider_user_id: 'user_race',
          official_id: 50n,
          officials: {
            id: 50n,
            username: null,
            full_name: 'Race User',
            email: 'race@example.test',
            position_title: null,
            rank_title: null,
            phone: null,
            role: 'OFFICIAL',
            is_active: true,
            agency_id: 1n,
            agencies: { id: 1n, agency_name: 'Race Agency', agency_code: 'RACE' },
            official_permissions: [],
          },
        }),
      },
      officials: { create: jest.fn() },
    };

    const mockPrisma = {
      auth_identities: { findUnique: jest.fn().mockResolvedValue(null) },
      agencies: { findFirst: jest.fn().mockResolvedValue({ id: 1n }) },
      $transaction: jest.fn(async (callback) => callback(mockTx)),
    };

    verifyTokenMock.mockResolvedValue({ sub: 'user_race', email: 'race@example.test', name: 'Race User' });
    const service = createDemoService({ demoMode: true, prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    expect(result).toEqual({
      id: '50',
      username: null,
      fullName: 'Race User',
      positionTitle: null,
      rankTitle: null,
      email: 'race@example.test',
      phone: null,
      role: 'OFFICIAL',
      agencyId: '1',
      agencyName: 'Race Agency',
      agencyCode: 'RACE',
      isActive: true,
      permissions: [],
    });
    expect(mockTx.officials.create).not.toHaveBeenCalled();
  });

  it('falls back to VIEWER when JIT transaction fails', async () => {
    const mockPrisma = {
      auth_identities: { findUnique: jest.fn().mockResolvedValue(null) },
      agencies: { findFirst: jest.fn().mockResolvedValue({ id: 1n }) },
      $transaction: jest.fn().mockRejectedValue(new Error('DB connection lost')),
    };

    verifyTokenMock.mockResolvedValue({ sub: 'user_fail', email: 'fail@example.test', name: 'Fail User' });
    const service = createDemoService({ demoMode: true, prisma: mockPrisma });

    const result = await service.validateClerkSession('clerk-jwt');

    expect(result).toEqual({
      id: 'clerk:user_fail',
      username: 'fail',
      fullName: 'Fail User',
      positionTitle: null,
      rankTitle: null,
      email: 'fail@example.test',
      phone: null,
      role: 'VIEWER',
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    });
  });

  it('derives fullName from email when name is missing', async () => {
    const mockTx = {
      auth_identities: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      officials: {
        create: jest.fn().mockResolvedValue({
          id: 101n,
          username: null,
          full_name: 'derived',
          email: 'derived@example.test',
          position_title: null,
          rank_title: null,
          phone: null,
          role: 'OFFICIAL',
          is_active: true,
          agency_id: 1n,
          agencies: { id: 1n, agency_name: 'Agency', agency_code: 'AG' },
          official_permissions: [],
        }),
      },
    };

    const mockPrisma = {
      auth_identities: { findUnique: jest.fn().mockResolvedValue(null) },
      agencies: { findFirst: jest.fn().mockResolvedValue({ id: 1n }) },
      $transaction: jest.fn(async (callback) => callback(mockTx)),
    };

    verifyTokenMock.mockResolvedValue({ sub: 'user_derived', email: 'derived@example.test' });
    const service = createDemoService({ demoMode: true, prisma: mockPrisma });

    await service.validateClerkSession('clerk-jwt');

    expect(mockTx.officials.create).toHaveBeenCalledWith({
      data: {
        full_name: 'derived',
        email: 'derived@example.test',
        role: 'OFFICIAL',
        is_active: true,
        agency_id: 1n,
      },
      include: { agencies: true, official_permissions: true },
    });
  });

  it('derives fullName from subject when email and name are missing', async () => {
    const mockTx = {
      auth_identities: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
      officials: {
        create: jest.fn().mockResolvedValue({
          id: 102n,
          username: null,
          full_name: 'demo-abcd1234',
          email: null,
          position_title: null,
          rank_title: null,
          phone: null,
          role: 'OFFICIAL',
          is_active: true,
          agency_id: 1n,
          agencies: { id: 1n, agency_name: 'Agency', agency_code: 'AG' },
          official_permissions: [],
        }),
      },
    };

    const mockPrisma = {
      auth_identities: { findUnique: jest.fn().mockResolvedValue(null) },
      agencies: { findFirst: jest.fn().mockResolvedValue({ id: 1n }) },
      $transaction: jest.fn(async (callback) => callback(mockTx)),
    };

    verifyTokenMock.mockResolvedValue({ sub: 'user_1234567890abcd1234' });
    const service = createDemoService({ demoMode: true, prisma: mockPrisma });

    await service.validateClerkSession('clerk-jwt');

    const createCall = mockTx.officials.create.mock.calls[0][0];
    expect(createCall.data.full_name).toBe('demo-abcd1234');
  });
});
