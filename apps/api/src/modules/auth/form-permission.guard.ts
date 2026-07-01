import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUser, FormPermission } from './current-user.type';
import { FORM_PERMISSIONS_KEY } from './form-permission.decorator';

@Injectable()
export class FormPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.getAllAndOverride<FormPermission[]>(FORM_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (required.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { currentUser?: CurrentUser }>();
    const user = request.currentUser;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    let officialId: bigint;
    let agencyId: bigint | null = null;
    try {
      officialId = BigInt(user.id);
      agencyId = user.agencyId ? BigInt(user.agencyId) : null;
    } catch {
      throw new ForbiddenException(
        `Thiếu quyền quản trị biểu mẫu: ${required.join(', ')}.`,
      );
    }

    const rows = await this.prisma.official_permissions.findMany({
      where: {
        official_id: officialId,
        permission_code: { in: required },
        OR: [
          { agency_id: null },
          ...(agencyId ? [{ agency_id: agencyId }] : []),
        ],
      },
      select: { permission_code: true },
    });
    const granted = new Set(rows.map((row) => row.permission_code));
    const missing = required.filter((permission) => !granted.has(permission));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Thiếu quyền quản trị biểu mẫu: ${missing.join(', ')}.`,
      );
    }
    return true;
  }
}
