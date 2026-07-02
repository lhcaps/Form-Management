import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { CurrentUser } from './current-user.type';
import { PermissionAdminScopeService } from './permission-admin-scope.service';

function currentUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: '10',
    username: 'official.10',
    fullName: 'Official Ten',
    positionTitle: null,
    rankTitle: null,
    email: null,
    phone: null,
    role: 'OFFICIAL',
    agencyId: '100',
    agencyName: 'Agency 100',
    agencyCode: 'A100',
    isActive: true,
    permissions: ['FORM_TEMPLATE_PERMISSION_ADMIN'],
    ...overrides,
  };
}

function createService() {
  const prisma = {
    officials: {
      findFirst: jest.fn(),
    },
    official_permissions: {
      findFirst: jest.fn(),
    },
  };
  return {
    prisma,
    service: new PermissionAdminScopeService(prisma as never),
  };
}

describe('PermissionAdminScopeService', () => {
  it('rejects a missing user with 401', () => {
    const { service } = createService();

    expect(() => service.requirePermissionAdmin(null)).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects VIEWER users with 403', () => {
    const { service } = createService();

    expect(() =>
      service.requirePermissionAdmin(
        currentUser({
          id: 'clerk:user_123',
          role: 'VIEWER',
          agencyId: null,
          permissions: [],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects OFFICIAL users without FORM_TEMPLATE_PERMISSION_ADMIN', () => {
    const { service } = createService();

    expect(() =>
      service.requirePermissionAdmin(currentUser({ permissions: [] })),
    ).toThrow(ForbiddenException);
  });

  it('allows an agency permission admin to manage its own agency', () => {
    const { service } = createService();

    const actor = service.requirePermissionAdmin(currentUser());

    expect(actor).toEqual({
      officialId: 10n,
      role: 'OFFICIAL',
      agencyId: 100n,
      isGlobal: false,
    });
    expect(() =>
      service.assertCanManageAgencyPermission(actor, 100n),
    ).not.toThrow();
  });

  it('rejects an agency permission admin with null agencyId', () => {
    const { service } = createService();

    expect(() =>
      service.requirePermissionAdmin(currentUser({ agencyId: null })),
    ).toThrow(ForbiddenException);
  });

  it('allows ADMIN as a global permission admin', () => {
    const { service } = createService();

    const actor = service.requirePermissionAdmin(
      currentUser({
        id: '1',
        role: 'ADMIN',
        agencyId: null,
        permissions: [],
      }),
    );

    expect(actor).toEqual({
      officialId: 1n,
      role: 'ADMIN',
      agencyId: null,
      isGlobal: true,
    });
    expect(() =>
      service.assertCanManageAgencyPermission(actor, null),
    ).not.toThrow();
  });

  it('rejects non-admin global grants', async () => {
    const { service, prisma } = createService();
    prisma.officials.findFirst.mockResolvedValue({
      id: 20n,
      full_name: 'Target',
      position_title: null,
      agency_id: 100n,
      role: 'OFFICIAL',
      is_active: true,
    });
    const actor = service.requirePermissionAdmin(currentUser());

    await expect(
      service.assertCanGrantPermissionToOfficial(actor, '20', null),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects non-admin grants to officials in another agency', async () => {
    const { service, prisma } = createService();
    prisma.officials.findFirst.mockResolvedValue({
      id: 20n,
      full_name: 'Other Agency',
      position_title: null,
      agency_id: 200n,
      role: 'OFFICIAL',
      is_active: true,
    });
    const actor = service.requirePermissionAdmin(currentUser());

    await expect(
      service.assertCanGrantPermissionToOfficial(actor, '20', 100n),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects non-admin grants to ADMIN target officials', async () => {
    const { service, prisma } = createService();
    prisma.officials.findFirst.mockResolvedValue({
      id: 20n,
      full_name: 'Admin Target',
      position_title: null,
      agency_id: 100n,
      role: 'ADMIN',
      is_active: true,
    });
    const actor = service.requirePermissionAdmin(currentUser());

    await expect(
      service.assertCanGrantPermissionToOfficial(actor, '20', 100n),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 for missing target officials', async () => {
    const { service, prisma } = createService();
    prisma.officials.findFirst.mockResolvedValue(null);
    const actor = service.requirePermissionAdmin(currentUser());

    await expect(
      service.assertCanGrantPermissionToOfficial(actor, '20', 100n),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows non-admin revokes for own-agency permission rows', async () => {
    const { service, prisma } = createService();
    prisma.official_permissions.findFirst.mockResolvedValue({
      id: 30n,
      official_id: 20n,
      agency_id: 100n,
      permission_code: 'FORM_TEMPLATE_EDIT',
      officials: {
        agency_id: 100n,
        role: 'OFFICIAL',
      },
    });
    const actor = service.requirePermissionAdmin(currentUser());

    await expect(
      service.assertCanRevokePermissionRow(actor, '30'),
    ).resolves.toEqual({
      id: 30n,
      officialId: 20n,
      agencyId: 100n,
      permissionCode: 'FORM_TEMPLATE_EDIT',
    });
  });

  it('rejects non-admin revokes for other-agency permission rows', async () => {
    const { service, prisma } = createService();
    prisma.official_permissions.findFirst.mockResolvedValue({
      id: 30n,
      official_id: 20n,
      agency_id: 200n,
      permission_code: 'FORM_TEMPLATE_EDIT',
      officials: {
        agency_id: 200n,
        role: 'OFFICIAL',
      },
    });
    const actor = service.requirePermissionAdmin(currentUser());

    await expect(
      service.assertCanRevokePermissionRow(actor, '30'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns 404 for missing permission rows', async () => {
    const { service, prisma } = createService();
    prisma.official_permissions.findFirst.mockResolvedValue(null);
    const actor = service.requirePermissionAdmin(currentUser());

    await expect(
      service.assertCanRevokePermissionRow(actor, '30'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
