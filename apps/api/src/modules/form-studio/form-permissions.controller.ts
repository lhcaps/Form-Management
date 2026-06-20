import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type {
  CurrentUser as CurrentUserType,
  FormPermission,
} from '../auth/current-user.type';
import { RequireFormPermissions } from '../auth/form-permission.decorator';
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
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentUser() user: CurrentUserType) {
    const rows = await this.prisma.official_permissions.findMany({
      where: user.agencyId
        ? {
            OR: [{ agency_id: BigInt(user.agencyId) }, { agency_id: null }],
          }
        : undefined,
      include: {
        officials: {
          select: { id: true, full_name: true, position_title: true },
        },
      },
      orderBy: [{ official_id: 'asc' }, { permission_code: 'asc' }],
    });
    return rows.map((row) => ({
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
    const agencyId = body.agencyId ?? user.agencyId;
    const existing = await this.prisma.official_permissions.findFirst({
      where: {
        official_id: BigInt(body.officialId),
        agency_id: agencyId ? BigInt(agencyId) : null,
        permission_code: body.permission,
      },
    });
    const row = existing
      ? await this.prisma.official_permissions.update({
          where: { id: existing.id },
          data: { granted_by_official_id: BigInt(user.id) },
        })
      : await this.prisma.official_permissions.create({
          data: {
            official_id: BigInt(body.officialId),
            agency_id: agencyId ? BigInt(agencyId) : null,
            scope_key: agencyId ? `AGENCY:${agencyId}` : 'GLOBAL',
            permission_code: body.permission,
            granted_by_official_id: BigInt(user.id),
          },
        });
    return { id: String(row.id), permission: row.permission_code };
  }

  @Delete(':id')
  async revoke(@Param('id') id: string) {
    await this.prisma.official_permissions.delete({
      where: { id: BigInt(id) },
    });
    return { ok: true };
  }
}
