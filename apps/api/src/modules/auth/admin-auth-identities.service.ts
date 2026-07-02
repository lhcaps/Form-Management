import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUser } from './current-user.type';
import type {
  LinkIdentityDto,
  ListIdentitiesDto,
  SearchOfficialsDto,
  UnlinkIdentityDto,
} from './dto/admin-auth-identities.dto';

export type IdentitySummary = {
  id: string;
  provider: string;
  providerUserId: string;
  email: string | null;
  username: string | null;
  fullName: string | null;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  linkedOfficial: {
    officialId: string;
    fullName: string;
    email: string | null;
    role: string;
    agencyName: string | null;
    isActive: boolean;
  } | null;
};

export type OfficialSearchResult = {
  officialId: string;
  fullName: string;
  email: string | null;
  username: string | null;
  role: string;
  agencyId: string | null;
  agencyName: string | null;
  alreadyLinked: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/**
 * Server-side authorization check for admin identity linking operations.
 * Only ADMIN role with a numeric official ID may perform these actions.
 */
function requireAdmin(user: CurrentUser | null): bigint {
  if (!user) {
    throw new UnauthorizedException('Thiếu thông tin xác thực.');
  }

  if (user.role !== 'ADMIN') {
    throw new ForbiddenException(
      'Chỉ ADMIN mới có quyền quản lý liên kết Clerk identity.',
    );
  }

  let officialId: bigint;
  try {
    officialId = BigInt(user.id);
  } catch {
    throw new ForbiddenException(
      'Tài khoản không hợp lệ để thực hiện thao tác này.',
    );
  }

  return officialId;
}

@Injectable()
export class AdminAuthIdentitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listIdentities(
    user: CurrentUser | null,
    dto: ListIdentitiesDto,
  ): Promise<PaginatedResult<IdentitySummary>> {
    requireAdmin(user);

    const page = Math.max(1, parseInt(dto.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(dto.pageSize ?? '20', 10) || 20),
    );
    const skip = (page - 1) * pageSize;

    const whereClause: {
      provider: 'clerk';
      official_id?: { not: null } | null;
      OR?: Array<{
        email?: { contains: string };
        username?: { contains: string };
        full_name?: { contains: string };
        provider_user_id?: { contains: string };
      }>;
    } = { provider: 'clerk' };

    if (dto.linked === 'linked') {
      whereClause.official_id = { not: null };
    } else if (dto.linked === 'unlinked') {
      whereClause.official_id = null;
    }

    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      whereClause.OR = [
        { email: { contains: q } },
        { username: { contains: q } },
        { full_name: { contains: q } },
        { provider_user_id: { contains: q } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.auth_identities.findMany({
        where: whereClause,
        include: {
          officials: {
            include: { agencies: { select: { agency_name: true } } },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auth_identities.count({ where: whereClause }),
    ]);

    const items: IdentitySummary[] = rows.map((row) => ({
      id: String(row.id),
      provider: row.provider,
      providerUserId: row.provider_user_id,
      email: row.email,
      username: row.username,
      fullName: row.full_name,
      lastSyncedAt: row.last_synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      linkedOfficial: row.officials
        ? {
            officialId: String(row.officials.id),
            fullName: row.officials.full_name,
            email: row.officials.email,
            role: row.officials.role ?? 'OFFICIAL',
            agencyName: row.officials.agencies?.agency_name ?? null,
            isActive: row.officials.is_active,
          }
        : null,
    }));

    return { items, total, page, pageSize };
  }

  async searchActiveOfficials(
    user: CurrentUser | null,
    dto: SearchOfficialsDto,
  ): Promise<PaginatedResult<OfficialSearchResult>> {
    requireAdmin(user);

    const page = Math.max(1, parseInt(dto.page ?? '1', 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(dto.pageSize ?? '20', 10) || 20),
    );
    const skip = (page - 1) * pageSize;

    const whereClause: {
      is_active: boolean;
      agency_id?: bigint;
      OR?: Array<{
        full_name?: { contains: string };
        email?: { contains: string };
        username?: { contains: string };
        agencies?: { agency_name?: { contains: string } };
      }>;
    } = { is_active: true };

    if (dto.agencyId) {
      try {
        whereClause.agency_id = BigInt(dto.agencyId);
      } catch {
        // ignore invalid agencyId
      }
    }

    if (dto.q && dto.q.trim()) {
      const q = dto.q.trim();
      whereClause.OR = [
        { full_name: { contains: q } },
        { email: { contains: q } },
        { username: { contains: q } },
        { agencies: { agency_name: { contains: q } } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.officials.findMany({
        where: whereClause,
        include: { agencies: { select: { id: true, agency_name: true } } },
        orderBy: { full_name: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.officials.count({ where: whereClause }),
    ]);

    // Get all auth_identities that are linked to any of these officials
    const officialIds = rows.map((r) => r.id);
    const linkedMap = new Map<string, boolean>();

    if (officialIds.length > 0) {
      const linkedIdentities = await this.prisma.auth_identities.findMany({
        where: {
          provider: 'clerk',
          official_id: { in: officialIds },
        },
        select: { official_id: true },
      });

      for (const identity of linkedIdentities) {
        if (identity.official_id) {
          linkedMap.set(String(identity.official_id), true);
        }
      }
    }

    const items: OfficialSearchResult[] = rows.map((row) => ({
      officialId: String(row.id),
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      role: row.role ?? 'OFFICIAL',
      agencyId: row.agencies ? String(row.agencies.id) : null,
      agencyName: row.agencies?.agency_name ?? null,
      alreadyLinked: linkedMap.get(String(row.id)) ?? false,
    }));

    return { items, total, page, pageSize };
  }

  async linkIdentity(
    user: CurrentUser | null,
    identityIdRaw: string,
    dto: LinkIdentityDto,
  ): Promise<IdentitySummary> {
    const actorOfficialId = requireAdmin(user);

    // Parse and validate identity ID
    let identityId: bigint;
    try {
      identityId = BigInt(identityIdRaw);
      if (identityId <= 0n) throw new Error('Non-positive');
    } catch {
      throw new BadRequestException('identityId không hợp lệ.');
    }

    // Parse and validate official ID
    let officialId: bigint;
    try {
      officialId = BigInt(dto.officialId);
      if (officialId <= 0n) throw new Error('Non-positive');
    } catch {
      throw new BadRequestException('officialId không hợp lệ.');
    }

    // Load identity with transaction
    return this.prisma.$transaction(async (tx) => {
      // Validate identity exists and is a Clerk identity
      const identity = await tx.auth_identities.findUnique({
        where: { id: identityId },
      });

      if (!identity) {
        throw new NotFoundException('Không tìm thấy Clerk identity.');
      }

      if (identity.provider !== 'clerk') {
        throw new BadRequestException('Chỉ có thể liên kết Clerk identity.');
      }

      if (identity.official_id !== null) {
        throw new ConflictException(
          'Identity đã được liên kết. Hãy unlink trước.',
        );
      }

      // Validate official exists and is active
      const official = await tx.officials.findUnique({
        where: { id: officialId },
        include: { agencies: { select: { agency_name: true } } },
      });

      if (!official) {
        throw new NotFoundException('Không tìm thấy cán bộ.');
      }

      if (!official.is_active) {
        throw new ConflictException(
          'Không thể liên kết với cán bộ không hoạt động. Vui lòng kích hoạt tài khoản trước.',
        );
      }

      // Check if official is already linked to another Clerk identity
      const existingLink = await tx.auth_identities.findFirst({
        where: {
          provider: 'clerk',
          official_id: officialId,
        },
      });

      if (existingLink) {
        throw new ConflictException(
          'Cán bộ này đã được liên kết với một Clerk identity khác. Hãy unlink trước.',
        );
      }

      // Perform the link
      const updated = await tx.auth_identities.update({
        where: { id: identityId },
        data: { official_id: officialId },
        include: {
          officials: {
            include: { agencies: { select: { agency_name: true } } },
          },
        },
      });

      // Write audit log
      await tx.auth_identity_audit_logs.create({
        data: {
          actor_official_id: actorOfficialId,
          action: 'AUTH_IDENTITY_LINKED',
          identity_id: identityId,
          provider: identity.provider,
          provider_user_id: identity.provider_user_id,
          before_official_id: null,
          after_official_id: officialId,
          reason: dto.reason ?? null,
          metadata_json: undefined,
        },
      });

      return this.toIdentitySummary(updated);
    });
  }

  async unlinkIdentity(
    user: CurrentUser | null,
    identityIdRaw: string,
    dto: UnlinkIdentityDto,
  ): Promise<IdentitySummary> {
    const actorOfficialId = requireAdmin(user);

    // Parse and validate identity ID
    let identityId: bigint;
    try {
      identityId = BigInt(identityIdRaw);
      if (identityId <= 0n) throw new Error('Non-positive');
    } catch {
      throw new BadRequestException('identityId không hợp lệ.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Validate identity exists
      const identity = await tx.auth_identities.findUnique({
        where: { id: identityId },
      });

      if (!identity) {
        throw new NotFoundException('Không tìm thấy Clerk identity.');
      }

      if (identity.official_id === null) {
        throw new ConflictException('Identity chưa được liên kết.');
      }

      const beforeOfficialId = identity.official_id;

      // Perform the unlink
      const updated = await tx.auth_identities.update({
        where: { id: identityId },
        data: { official_id: null },
        include: {
          officials: {
            include: { agencies: { select: { agency_name: true } } },
          },
        },
      });

      // Write audit log
      await tx.auth_identity_audit_logs.create({
        data: {
          actor_official_id: actorOfficialId,
          action: 'AUTH_IDENTITY_UNLINKED',
          identity_id: identityId,
          provider: identity.provider,
          provider_user_id: identity.provider_user_id,
          before_official_id: beforeOfficialId,
          after_official_id: null,
          reason: dto.reason ?? null,
          metadata_json: undefined,
        },
      });

      return this.toIdentitySummary(updated);
    });
  }

  private toIdentitySummary(row: {
    id: bigint;
    provider: string;
    provider_user_id: string;
    email: string | null;
    username: string | null;
    full_name: string | null;
    last_synced_at: Date | null;
    created_at: Date;
    updated_at: Date;
    officials: {
      id: bigint;
      full_name: string;
      email: string | null;
      role: string | null;
      is_active: boolean;
      agencies: { agency_name: string } | null;
    } | null;
  }): IdentitySummary {
    return {
      id: String(row.id),
      provider: row.provider,
      providerUserId: row.provider_user_id,
      email: row.email,
      username: row.username,
      fullName: row.full_name,
      lastSyncedAt: row.last_synced_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      linkedOfficial: row.officials
        ? {
            officialId: String(row.officials.id),
            fullName: row.officials.full_name,
            email: row.officials.email,
            role: row.officials.role ?? 'OFFICIAL',
            agencyName: row.officials.agencies?.agency_name ?? null,
            isActive: row.officials.is_active,
          }
        : null,
    };
  }
}
