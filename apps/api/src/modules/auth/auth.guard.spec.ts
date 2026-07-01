import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function createReflector(isPublic = false) {
  return {
    getAllAndOverride: jest.fn().mockReturnValue(isPublic),
  };
}

function createAuthService() {
  return {
    getCookieOptions: jest.fn().mockReturnValue({ name: 'qlv_session' }),
    validateSession: jest.fn().mockResolvedValue(null),
    validateClerkSession: jest.fn().mockResolvedValue(null),
  };
}

describe('AuthGuard Clerk bearer fallback', () => {
  const clerkUser = {
    id: 'clerk:user_123',
    username: 'new.user',
    fullName: 'New Clerk User',
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

  it('accepts a protected request authenticated only by a Clerk bearer token', async () => {
    const authService = createAuthService();
    authService.validateClerkSession.mockResolvedValue(clerkUser);
    const guard = new AuthGuard(
      createReflector(false) as never,
      authService as never,
    );
    const request = {
      headers: { authorization: 'Bearer clerk-session-jwt' },
      cookies: {},
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(authService.validateSession).not.toHaveBeenCalled();
    expect(authService.validateClerkSession).toHaveBeenCalledWith(
      'clerk-session-jwt',
    );
    expect(request).toMatchObject({ currentUser: clerkUser });
  });

  it('prefers the legacy cookie session when both legacy and Clerk tokens exist', async () => {
    const authService = createAuthService();
    authService.validateSession.mockResolvedValue({ ...clerkUser, id: '7' });
    const guard = new AuthGuard(
      createReflector(false) as never,
      authService as never,
    );
    const request = {
      headers: { authorization: 'Bearer clerk-session-jwt' },
      cookies: { qlv_session: 'legacy-token' },
    };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(authService.validateSession).toHaveBeenCalledWith('legacy-token');
    expect(authService.validateClerkSession).not.toHaveBeenCalled();
    expect(request).toMatchObject({ currentUser: { id: '7' } });
  });

  it('rejects protected requests when neither legacy nor Clerk token validates', async () => {
    const authService = createAuthService();
    const guard = new AuthGuard(
      createReflector(false) as never,
      authService as never,
    );
    const request = {
      headers: { authorization: 'Bearer invalid-clerk-session' },
      cookies: {},
    };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
