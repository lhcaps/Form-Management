import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUser, FormPermission } from './current-user.type';

const FORM_PERMISSION_ADMIN_CODE: FormPermission =
  'FORM_TEMPLATE_PERMISSION_ADMIN';

/**
 * Normalized shape returned after a user has been validated as a permission admin.
 */
export interface PermissionAdminUser {
  officialId: bigint;
  role: 'ADMIN' | 'OFFICIAL';
  agencyId: bigint | null;
  isGlobal: boolean;
}

/**
 * Summary of a target official for permission operations.
 */
export interface TargetOfficialSummary {
  id: bigint;
  fullName: string;
  positionTitle: string | null;
  agencyId: bigint | null;
  role: string;
  isActive: boolean;
}

/**
 * Summary of a permission row for revoke operations.
 */
export interface PermissionRowSummary {
  id: bigint;
  officialId: bigint;
  agencyId: bigint | null;
  permissionCode: string;
}

function parsePositiveBigInt(raw: string, label: string): bigint {
  try {
    const value = BigInt(raw);
    if (value <= 0n) throw new Error('Non-positive');
    return value;
  } catch {
    throw new UnprocessableEntityException(`${label} không hợp lệ.`);
  }
}

/**
 * Server-side enforcement of form permission admin scope.
 *
 * - ADMIN users are global permission administrators.
 * - OFFICIAL users with FORM_TEMPLATE_PERMISSION_ADMIN may only manage
 *   permissions within their own agency.
 * - VIEWER / Clerk-only / unauthenticated users are forbidden.
 *
 * This service does NOT grant permissions — it only validates the actor's
 * authority to perform permission management operations.
 */
@Injectable()
export class PermissionAdminScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Require that the given user is an authorized form permission admin.
   *
   * - null / undefined user → UnauthorizedException
   * - VIEWER or Clerk identity → ForbiddenException
   * - ADMIN → returns PermissionAdminUser with isGlobal=true
   * - OFFICIAL with FORM_TEMPLATE_PERMISSION_ADMIN (and numeric id) → returns
   *   PermissionAdminUser with isGlobal=false and agencyId
   * - OFFICIAL without the permission → ForbiddenException
   * - OFFICIAL with the permission but null agencyId → ForbiddenException
   */
  requirePermissionAdmin(
    user: CurrentUser | null | undefined,
  ): PermissionAdminUser {
    if (!user) {
      throw new UnauthorizedException('Thiếu thông tin xác thực.');
    }

    // VIEWER / Clerk identity
    if (user.role === 'VIEWER') {
      throw new ForbiddenException(
        'Người dùng Clerk không có quyền quản trị biểu mẫu.',
      );
    }

    // ADMIN — global permission admin
    if (user.role === 'ADMIN') {
      let officialId: bigint;
      try {
        officialId = BigInt(user.id);
      } catch {
        throw new ForbiddenException(
          'Tài khoản ADMIN không hợp lệ để truy cập API nghiệp vụ.',
        );
      }
      return {
        officialId,
        role: 'ADMIN',
        agencyId: user.agencyId ? BigInt(user.agencyId) : null,
        isGlobal: true,
      };
    }

    // OFFICIAL
    if (user.role !== 'OFFICIAL') {
      throw new ForbiddenException(
        'Vai trò không được hỗ trợ để truy cập API nghiệp vụ.',
      );
    }

    // Must have numeric id
    let officialId: bigint;
    try {
      officialId = BigInt(user.id);
    } catch {
      throw new ForbiddenException(
        'Tài khoản không hợp lệ để truy cập API nghiệp vụ.',
      );
    }

    // Must have FORM_TEMPLATE_PERMISSION_ADMIN permission
    if (!user.permissions.includes(FORM_PERMISSION_ADMIN_CODE)) {
      throw new ForbiddenException(
        `Thiếu quyền quản trị biểu mẫu: ${FORM_PERMISSION_ADMIN_CODE}.`,
      );
    }

    // Must have a non-null agencyId
    if (!user.agencyId) {
      throw new ForbiddenException(
        'Không thể quản lý quyền: tài khoản không thuộc cơ quan nào.',
      );
    }

    let agencyId: bigint;
    try {
      agencyId = BigInt(user.agencyId);
    } catch {
      throw new ForbiddenException(
        'Mã cơ quan không hợp lệ để truy cập API nghiệp vụ.',
      );
    }

    return {
      officialId,
      role: 'OFFICIAL',
      agencyId,
      isGlobal: false,
    };
  }

  /**
   * Assert that the actor can list/manage permissions for the given target agency.
   *
   * - ADMIN → always allowed
   * - non-admin → targetAgencyId must equal actor's agencyId
   * - non-admin with null agencyId → ForbiddenException (already handled by requirePermissionAdmin)
   */
  assertCanManageAgencyPermission(
    actor: PermissionAdminUser,
    targetAgencyId: bigint | null,
  ): void {
    if (actor.isGlobal) return;

    if (targetAgencyId === null) {
      throw new ForbiddenException(
        'Không có quyền quản lý quyền không thuộc cơ quan nào.',
      );
    }

    if (actor.agencyId !== targetAgencyId) {
      throw new ForbiddenException(
        'Không có quyền quản lý quyền thuộc cơ quan khác.',
      );
    }
  }

  /**
   * Assert that the actor can grant a permission to the given target official.
   *
   * Validates:
   * - Target official exists and is active.
   * - Target official is in the actor's agency (non-admin).
   * - Non-admin cannot grant global permission (agencyId === null).
   *
   * Returns the target official summary.
   */
  async assertCanGrantPermissionToOfficial(
    actor: PermissionAdminUser,
    targetOfficialIdRaw: string,
    targetAgencyId: bigint | null,
  ): Promise<TargetOfficialSummary> {
    const targetOfficialId = parsePositiveBigInt(
      targetOfficialIdRaw,
      'Mã cán bộ',
    );

    const targetOfficial = await this.prisma.officials.findFirst({
      where: { id: targetOfficialId },
      select: {
        id: true,
        full_name: true,
        position_title: true,
        agency_id: true,
        role: true,
        is_active: true,
      },
    });

    if (!targetOfficial) {
      throw new NotFoundException('Không tìm thấy cán bộ.');
    }

    if (!targetOfficial.is_active) {
      throw new ForbiddenException(
        'Không thể cấp quyền cho cán bộ không hoạt động.',
      );
    }

    // Non-admin cannot grant global permission
    if (!actor.isGlobal && targetAgencyId === null) {
      throw new ForbiddenException(
        'Không có quyền cấp quyền không thuộc cơ quan nào.',
      );
    }

    // Non-admin: target must be in actor's agency
    if (!actor.isGlobal) {
      if (targetOfficial.role === 'ADMIN') {
        throw new ForbiddenException(
          'Không có quyền quản lý quyền của tài khoản ADMIN.',
        );
      }
      if (targetOfficial.agency_id === null) {
        throw new ForbiddenException(
          'Không thể cấp quyền cho cán bộ không thuộc cơ quan nào.',
        );
      }
      if (targetOfficial.agency_id !== actor.agencyId) {
        throw new ForbiddenException(
          'Không thể cấp quyền cho cán bộ thuộc cơ quan khác.',
        );
      }
      // Also verify the requested target agency matches
      if (targetAgencyId !== actor.agencyId) {
        throw new ForbiddenException('Không thể cấp quyền thuộc cơ quan khác.');
      }
    }

    return {
      id: targetOfficial.id,
      fullName: targetOfficial.full_name,
      positionTitle: targetOfficial.position_title,
      agencyId: targetOfficial.agency_id,
      role: targetOfficial.role ?? 'OFFICIAL',
      isActive: targetOfficial.is_active,
    };
  }

  /**
   * Assert that the actor can revoke the given permission row.
   *
   * - ADMIN → always allowed
   * - non-admin → row agency must equal actor's agencyId
   *
   * Returns the permission row summary.
   */
  async assertCanRevokePermissionRow(
    actor: PermissionAdminUser,
    permissionIdRaw: string,
  ): Promise<PermissionRowSummary> {
    const permissionId = parsePositiveBigInt(permissionIdRaw, 'Mã quyền');

    const row = await this.prisma.official_permissions.findFirst({
      where: { id: permissionId },
      select: {
        id: true,
        official_id: true,
        agency_id: true,
        permission_code: true,
        officials: {
          select: {
            agency_id: true,
            role: true,
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException('Không tìm thấy quyền.');
    }

    if (!actor.isGlobal) {
      if (row.officials.role === 'ADMIN') {
        throw new ForbiddenException(
          'Không có quyền quản lý quyền của tài khoản ADMIN.',
        );
      }
      if (row.agency_id === null) {
        throw new ForbiddenException(
          'Không có quyền thu hồi quyền không thuộc cơ quan nào.',
        );
      }
      if (row.agency_id !== actor.agencyId) {
        throw new ForbiddenException(
          'Không có quyền thu hồi quyền thuộc cơ quan khác.',
        );
      }
      if (row.officials.agency_id !== actor.agencyId) {
        throw new ForbiddenException(
          'Không có quyền quản lý cán bộ thuộc cơ quan khác.',
        );
      }
    }

    return {
      id: row.id,
      officialId: row.official_id,
      agencyId: row.agency_id,
      permissionCode: row.permission_code,
    };
  }
}
