import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { CurrentUser } from '../auth/current-user.type';
import { PermissionAdminScopeService } from '../auth/permission-admin-scope.service';
import { FormPermissionsController } from './form-permissions.controller';

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

function createController() {
  const prisma = {
    official_permissions: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    officials: {
      findFirst: jest.fn(),
    },
  };
  const scope = new PermissionAdminScopeService(prisma as never);
  return {
    prisma,
    controller: new FormPermissionsController(prisma as never, scope),
  };
}

function permissionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 30n,
    official_id: 20n,
    agency_id: 100n,
    permission_code: 'FORM_TEMPLATE_EDIT',
    created_at: new Date('2026-07-02T00:00:00.000Z'),
    officials: {
      id: 20n,
      full_name: 'Target Official',
      position_title: 'KSV',
      agency_id: 100n,
      role: 'OFFICIAL',
    },
    ...overrides,
  };
}

function activeOfficial(overrides: Record<string, unknown> = {}) {
  return {
    id: 20n,
    full_name: 'Target Official',
    position_title: 'KSV',
    agency_id: 100n,
    role: 'OFFICIAL',
    is_active: true,
    ...overrides,
  };
}

describe('FormPermissionsController scope hardening', () => {
  it('ADMIN lists all permission rows', async () => {
    const { controller, prisma } = createController();
    prisma.official_permissions.findMany.mockResolvedValue([
      permissionRow(),
      permissionRow({
        id: 31n,
        agency_id: 200n,
        officials: {
          id: 21n,
          full_name: 'Other Agency',
          position_title: null,
          agency_id: 200n,
          role: 'OFFICIAL',
        },
      }),
      permissionRow({
        id: 32n,
        agency_id: null,
        officials: {
          id: 22n,
          full_name: 'Global User',
          position_title: null,
          agency_id: null,
          role: 'OFFICIAL',
        },
      }),
    ]);

    const rows = await controller.list(
      currentUser({ id: '1', role: 'ADMIN', agencyId: null, permissions: [] }),
    );

    expect(prisma.official_permissions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(rows).toHaveLength(3);
  });

  it('agency permission admin lists only own-agency non-ADMIN rows', async () => {
    const { controller, prisma } = createController();
    prisma.official_permissions.findMany.mockResolvedValue([
      permissionRow(),
      permissionRow({
        id: 31n,
        agency_id: 100n,
        officials: {
          id: 21n,
          full_name: 'Admin Target',
          position_title: null,
          agency_id: 100n,
          role: 'ADMIN',
        },
      }),
      permissionRow({
        id: 32n,
        agency_id: 200n,
        officials: {
          id: 22n,
          full_name: 'Other Agency',
          position_title: null,
          agency_id: 200n,
          role: 'OFFICIAL',
        },
      }),
    ]);

    const rows = await controller.list(currentUser());

    expect(prisma.official_permissions.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { agency_id: 100n } }),
    );
    expect(rows).toEqual([
      expect.objectContaining({
        id: '30',
        officialId: '20',
        agencyId: '100',
        permission: 'FORM_TEMPLATE_EDIT',
      }),
    ]);
  });

  it('VIEWER is forbidden from listing permissions', async () => {
    const { controller } = createController();

    await expect(
      controller.list(
        currentUser({
          id: 'clerk:user_123',
          role: 'VIEWER',
          agencyId: null,
          permissions: [],
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('missing user is unauthorized from listing permissions', async () => {
    const { controller } = createController();

    await expect(controller.list(null as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('ADMIN can grant a permission for any agency', async () => {
    const { controller, prisma } = createController();
    prisma.officials.findFirst.mockResolvedValue(
      activeOfficial({ agency_id: 100n }),
    );
    prisma.official_permissions.findFirst.mockResolvedValue(null);
    prisma.official_permissions.create.mockResolvedValue({
      id: 40n,
      permission_code: 'FORM_TEMPLATE_EDIT',
    });

    const result = await controller.grant(
      {
        officialId: '20',
        agencyId: '200',
        permission: 'FORM_TEMPLATE_EDIT',
      },
      currentUser({ id: '1', role: 'ADMIN', agencyId: null, permissions: [] }),
    );

    expect(prisma.official_permissions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        official_id: 20n,
        agency_id: 200n,
        scope_key: 'AGENCY:200',
        permission_code: 'FORM_TEMPLATE_EDIT',
        granted_by_official_id: 1n,
      }),
    });
    expect(result).toEqual({ id: '40', permission: 'FORM_TEMPLATE_EDIT' });
  });

  it('agency permission admin can grant within own agency when agencyId is omitted', async () => {
    const { controller, prisma } = createController();
    prisma.officials.findFirst.mockResolvedValue(activeOfficial());
    prisma.official_permissions.findFirst.mockResolvedValue(null);
    prisma.official_permissions.create.mockResolvedValue({
      id: 40n,
      permission_code: 'FORM_TEMPLATE_APPROVE',
    });

    await controller.grant(
      { officialId: '20', permission: 'FORM_TEMPLATE_APPROVE' },
      currentUser(),
    );

    expect(prisma.official_permissions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        official_id: 20n,
        agency_id: 100n,
        scope_key: 'AGENCY:100',
        permission_code: 'FORM_TEMPLATE_APPROVE',
        granted_by_official_id: 10n,
      }),
    });
  });

  it('agency permission admin can delegate permission admin within own agency', async () => {
    const { controller, prisma } = createController();
    prisma.officials.findFirst.mockResolvedValue(activeOfficial());
    prisma.official_permissions.findFirst.mockResolvedValue(null);
    prisma.official_permissions.create.mockResolvedValue({
      id: 40n,
      permission_code: 'FORM_TEMPLATE_PERMISSION_ADMIN',
    });

    await controller.grant(
      { officialId: '20', permission: 'FORM_TEMPLATE_PERMISSION_ADMIN' },
      currentUser(),
    );

    expect(prisma.official_permissions.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        agency_id: 100n,
        permission_code: 'FORM_TEMPLATE_PERMISSION_ADMIN',
      }),
    });
  });

  it('agency permission admin cannot grant for another agency', async () => {
    const { controller, prisma } = createController();

    await expect(
      controller.grant(
        {
          officialId: '20',
          agencyId: '200',
          permission: 'FORM_TEMPLATE_EDIT',
        },
        currentUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.officials.findFirst).not.toHaveBeenCalled();
    expect(prisma.official_permissions.create).not.toHaveBeenCalled();
  });

  it('agency permission admin cannot grant to an official in another agency', async () => {
    const { controller, prisma } = createController();
    prisma.officials.findFirst.mockResolvedValue(
      activeOfficial({ agency_id: 200n }),
    );

    await expect(
      controller.grant(
        { officialId: '20', permission: 'FORM_TEMPLATE_EDIT' },
        currentUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.official_permissions.create).not.toHaveBeenCalled();
  });

  it('agency permission admin cannot grant to ADMIN target officials', async () => {
    const { controller, prisma } = createController();
    prisma.officials.findFirst.mockResolvedValue(
      activeOfficial({ role: 'ADMIN' }),
    );

    await expect(
      controller.grant(
        { officialId: '20', permission: 'FORM_TEMPLATE_EDIT' },
        currentUser(),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('missing grant target official returns 404', async () => {
    const { controller, prisma } = createController();
    prisma.officials.findFirst.mockResolvedValue(null);

    await expect(
      controller.grant(
        { officialId: '20', permission: 'FORM_TEMPLATE_EDIT' },
        currentUser(),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('ADMIN can revoke any permission row', async () => {
    const { controller, prisma } = createController();
    prisma.official_permissions.findFirst.mockResolvedValue(
      permissionRow({
        agency_id: null,
        officials: {
          id: 20n,
          full_name: 'Admin Target',
          position_title: null,
          agency_id: null,
          role: 'ADMIN',
        },
      }),
    );
    prisma.official_permissions.delete.mockResolvedValue(permissionRow());

    await expect(
      controller.revoke(
        '30',
        currentUser({
          id: '1',
          role: 'ADMIN',
          agencyId: null,
          permissions: [],
        }),
      ),
    ).resolves.toEqual({ ok: true });
    expect(prisma.official_permissions.delete).toHaveBeenCalledWith({
      where: { id: 30n },
    });
  });

  it('agency permission admin can revoke own-agency permission rows', async () => {
    const { controller, prisma } = createController();
    prisma.official_permissions.findFirst.mockResolvedValue(permissionRow());
    prisma.official_permissions.delete.mockResolvedValue(permissionRow());

    await expect(controller.revoke('30', currentUser())).resolves.toEqual({
      ok: true,
    });
    expect(prisma.official_permissions.delete).toHaveBeenCalledWith({
      where: { id: 30n },
    });
  });

  it('agency permission admin cannot revoke another agency permission row', async () => {
    const { controller, prisma } = createController();
    prisma.official_permissions.findFirst.mockResolvedValue(
      permissionRow({
        agency_id: 200n,
        officials: {
          id: 20n,
          full_name: 'Other Agency',
          position_title: null,
          agency_id: 200n,
          role: 'OFFICIAL',
        },
      }),
    );

    await expect(controller.revoke('30', currentUser())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.official_permissions.delete).not.toHaveBeenCalled();
  });

  it('missing revoke permission row returns 404', async () => {
    const { controller, prisma } = createController();
    prisma.official_permissions.findFirst.mockResolvedValue(null);

    await expect(controller.revoke('30', currentUser())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
