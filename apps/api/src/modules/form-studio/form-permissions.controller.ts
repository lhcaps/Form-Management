import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type {
  CurrentUser as CurrentUserType,
  FormPermission,
} from '../auth/current-user.type';
import { RequireFormPermissions } from '../auth/form-permission.decorator';
import { PermissionAdminScopeService } from '../auth/permission-admin-scope.service';
import { FormStudioError } from './domain/form-studio.error';
import { GrantFormPermissionDto } from './dto/form-studio.dto';

const FORM_PERMISSIONS = new Set<FormPermission>([
  'FORM_TEMPLATE_EDIT',
  'FORM_TEMPLATE_APPROVE',
  'FORM_TEMPLATE_PERMISSION_ADMIN',
]);

@ApiTags('Admin Form Permissions')
@Controller('admin/form-permissions')
@RequireFormPermissions('FORM_TEMPLATE_PERMISSION_ADMIN')
export class FormPermissionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: PermissionAdminScopeService,
  ) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserType) {
    const actor = this.scope.requirePermissionAdmin(user);

    // Build the where clause based on actor scope
    const where = actor.isGlobal ? {} : { agency_id: actor.agencyId };

    const rows = await this.prisma.official_permissions.findMany({
      where,
      include: {
        officials: {
          select: {
            id: true,
            full_name: true,
            position_title: true,
            agency_id: true,
            role: true,
          },
        },
      },
      orderBy: [{ official_id: 'asc' }, { permission_code: 'asc' }],
    });
    const visibleRows = actor.isGlobal
      ? rows
      : rows.filter(
          (row) =>
            row.agency_id === actor.agencyId &&
            row.officials.agency_id === actor.agencyId &&
            row.officials.role !== 'ADMIN',
        );

    return visibleRows.map((row) => ({
      id: String(row.id),
      officialId: String(row.official_id),
      officialName: row.officials.full_name,
      positionTitle: row.officials.position_title,
      agencyId: row.agency_id ? String(row.agency_id) : null,
      permission: row.permission_code,
      createdAt: row.created_at,
    }));
  }

  @Post()
  async grant(
    @Body() body: GrantFormPermissionDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!FORM_PERMISSIONS.has(body.permission as FormPermission)) {
      throw new FormStudioError(
        'UNKNOWN_FORM_PERMISSION',
        'Quyền Form Studio không hợp lệ.',
        422,
      );
    }

    const actor = this.scope.requirePermissionAdmin(user);

    // Determine the effective target agency
    let targetAgencyId: bigint | null = null;
    if (body.agencyId) {
      try {
        targetAgencyId = BigInt(body.agencyId);
      } catch {
        throw new FormStudioError(
          'INVALID_AGENCY_ID',
          'Mã cơ quan không hợp lệ.',
          422,
        );
      }
    }

    if (!actor.isGlobal && targetAgencyId !== null) {
      this.scope.assertCanManageAgencyPermission(actor, targetAgencyId);
    }

    const effectiveAgencyId = actor.isGlobal ? targetAgencyId : actor.agencyId;

    // Scope check: verify the target agency is within the actor's scope
    this.scope.assertCanManageAgencyPermission(actor, effectiveAgencyId);

    // Verify grant target and scope constraints
    const targetOfficial = await this.scope.assertCanGrantPermissionToOfficial(
      actor,
      body.officialId,
      effectiveAgencyId,
    );

    const existing = await this.prisma.official_permissions.findFirst({
      where: {
        official_id: targetOfficial.id,
        agency_id: effectiveAgencyId,
        permission_code: body.permission,
      },
    });

    const row = existing
      ? await this.prisma.official_permissions.update({
          where: { id: existing.id },
          data: { granted_by_official_id: actor.officialId },
        })
      : await this.prisma.official_permissions.create({
          data: {
            official_id: targetOfficial.id,
            agency_id: effectiveAgencyId,
            scope_key: effectiveAgencyId
              ? `AGENCY:${effectiveAgencyId}`
              : 'GLOBAL',
            permission_code: body.permission,
            granted_by_official_id: actor.officialId,
          },
        });

    return { id: String(row.id), permission: row.permission_code };
  }

  @Delete(':id')
  async revoke(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    const actor = this.scope.requirePermissionAdmin(user);

    // Load the row and check scope in one call
    const permissionRow = await this.scope.assertCanRevokePermissionRow(
      actor,
      id,
    );

    await this.prisma.official_permissions.delete({
      where: { id: permissionRow.id },
    });
    return { ok: true };
  }
}
