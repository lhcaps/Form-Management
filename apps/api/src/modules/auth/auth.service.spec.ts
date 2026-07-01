import { verifyToken } from '@clerk/backend';
import { AuthService } from './auth.service';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

const verifyTokenMock = verifyToken as unknown as jest.Mock;

function createService({
  secretKey = 'sk_test_unit',
  authorizedParties = [] as string[],
} = {}) {
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

  return new AuthService({} as never, config as never);
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

  it('maps a verified Clerk token to a safe viewer identity', async () => {
    verifyTokenMock.mockResolvedValue({
      sub: 'user_123',
      email: 'clerk.user@example.test',
      name: 'Clerk User',
    });
    const service = createService({
      authorizedParties: ['http://localhost:3000'],
    });

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
});
