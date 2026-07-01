import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { FormPermissionGuard } from './form-permission.guard';

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('FormPermissionGuard Clerk viewer safety', () => {
  it('returns a controlled 403 for Clerk viewer ids instead of throwing BigInt errors', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['FORM_TEMPLATE_EDIT']),
    };
    const prisma = {
      official_permissions: {
        findMany: jest.fn(),
      },
    };
    const guard = new FormPermissionGuard(reflector as never, prisma as never);

    await expect(
      guard.canActivate(
        createContext({
          currentUser: {
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
          },
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.official_permissions.findMany).not.toHaveBeenCalled();
  });
});
