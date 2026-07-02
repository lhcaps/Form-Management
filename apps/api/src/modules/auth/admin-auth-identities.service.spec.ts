import { AdminAuthIdentitiesService } from './admin-auth-identities.service';
import type { CurrentUser } from './current-user.type';

type MockPrisma = {
  auth_identities: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
  officials: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

const adminUser: CurrentUser = {
  id: '3',
  username: 'admin',
  fullName: 'Admin',
  positionTitle: null,
  rankTitle: null,
  email: 'admin@example.test',
  phone: null,
  role: 'ADMIN',
  agencyId: '1',
  agencyName: 'Viện kiểm sát',
  agencyCode: 'VKS-DEFAULT',
  isActive: true,
  permissions: [],
};

function createService(prisma: MockPrisma) {
  return new AdminAuthIdentitiesService(prisma as never);
}

function containsModeOption(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsModeOption);

  return Object.entries(value).some(
    ([key, nested]) => key === 'mode' || containsModeOption(nested),
  );
}

describe('AdminAuthIdentitiesService', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      auth_identities: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      officials: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
  });

  it('lists identities with a MariaDB-compatible search filter', async () => {
    const service = createService(prisma);

    await service.listIdentities(adminUser, { q: 'HUY' });

    expect(prisma.auth_identities.findMany).toHaveBeenCalledTimes(1);
    const query = prisma.auth_identities.findMany.mock.calls[0]?.[0] as {
      where: unknown;
    };
    expect(containsModeOption(query.where)).toBe(false);
  });

  it('searches officials with a MariaDB-compatible search filter', async () => {
    const service = createService(prisma);

    await service.searchActiveOfficials(adminUser, { q: 'HUY' });

    expect(prisma.officials.findMany).toHaveBeenCalledTimes(1);
    const query = prisma.officials.findMany.mock.calls[0]?.[0] as {
      where: unknown;
    };
    expect(containsModeOption(query.where)).toBe(false);
  });
});
