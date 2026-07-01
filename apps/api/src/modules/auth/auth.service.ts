import {
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { generateSessionToken, hashSessionToken } from './token.util';
import { PublicUser } from './current-user.type';
import { verifyPassword } from './password.util';

interface CreateSessionInput {
  officialId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly config: AppConfigService;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() config?: AppConfigService,
  ) {
    this.config = config ?? new AppConfigService();
  }

  /**
   * Tìm official theo username (fullName match lowercase, normalized).
   * Vì schema hiện không có cột `username`, dùng `full_name` (lower comparison) làm identity.
   */
  async findOfficialByCredentials(
    username: string,
    password: string,
  ): Promise<PublicUser | null> {
    const normalized = username.trim().toLowerCase();
    if (!normalized || !password) return null;

    const official = await this.prisma.officials.findFirst({
      where: {
        is_active: true,
        username: normalized,
      },
      include: {
        agencies: true,
        official_permissions: true,
      },
    });

    if (!official) return null;
    if (!verifyPassword(password, official.password_hash)) return null;
    return this.toPublicUser(official);
  }

  /**
   * Tạo session cho official (sau khi verify identity).
   */
  async createSession(input: CreateSessionInput): Promise<{
    token: string;
    expiresAt: Date;
    user: PublicUser;
  }> {
    const { raw, hash } = generateSessionToken();
    const expiresAt = new Date(Date.now() + this.config.authSessionTtlMs);

    await this.prisma.$executeRaw`
      INSERT INTO auth_sessions
        (token_hash, official_id, expires_at, ip_address, user_agent, created_at, updated_at)
      VALUES
        (${hash}, ${BigInt(input.officialId)}, ${expiresAt}, ${
          input.ipAddress ?? null
        }, ${input.userAgent ?? null}, NOW(), NOW())
    `;

    const user = await this.findOfficialById(input.officialId);
    if (!user) {
      throw new UnauthorizedException('Session user không hợp lệ.');
    }
    return { token: raw, expiresAt, user };
  }

  /**
   * Verify session token (raw) → trả PublicUser nếu hợp lệ, null nếu không.
   */
  async validateSession(rawToken: string): Promise<PublicUser | null> {
    if (!rawToken) return null;
    const hash = hashSessionToken(rawToken);

    const rows = await this.prisma.$queryRaw<
      Array<{
        official_id: bigint;
        expires_at: Date;
      }>
    >`
      SELECT official_id, expires_at
      FROM auth_sessions
      WHERE token_hash = ${hash}
      LIMIT 1
    `;
    const row = rows?.[0];
    if (!row) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) {
      // Hết hạn: dọn luôn
      await this.prisma.$executeRaw`
        DELETE FROM auth_sessions WHERE token_hash = ${hash}
      `;
      return null;
    }

    return this.findOfficialById(String(row.official_id));
  }

  async validateClerkSession(rawToken: string): Promise<PublicUser | null> {
    const secretKey = this.config.clerkSecretKey;
    if (!rawToken || !secretKey) return null;

    const authorizedParties = this.config.clerkJwtAuthorizedParties;
    const payload = await verifyToken(rawToken, {
      secretKey,
      ...(authorizedParties.length > 0
        ? { authorizedParties: [...authorizedParties] }
        : {}),
    });
    const payloadRecord = payload as Record<string, unknown>;
    const subject = typeof payload.sub === 'string' ? payload.sub : null;
    if (!subject) return null;

    // Phase 2B: Try to resolve to DB official via auth_identities.
    // QUANLYVKS DB is the source of truth for role/agency/permissions.
    const dbUser = await this.resolveClerkIdentityToDbUser(
      subject,
      payloadRecord,
    );
    if (dbUser) return dbUser;

    // Unknown Clerk user — safe VIEWER identity.
    const email =
      typeof payloadRecord.email === 'string'
        ? payloadRecord.email
        : typeof payloadRecord.email_address === 'string'
          ? payloadRecord.email_address
          : null;
    const username =
      typeof payloadRecord.username === 'string'
        ? payloadRecord.username
        : email
          ? email.split('@')[0] || null
          : null;
    const fullName =
      typeof payloadRecord.name === 'string'
        ? payloadRecord.name
        : typeof payloadRecord.full_name === 'string'
          ? payloadRecord.full_name
          : (username ?? email ?? 'Clerk account');

    return {
      id: `clerk:${subject}`,
      username,
      fullName,
      positionTitle: null,
      rankTitle: null,
      email,
      phone: null,
      role: 'VIEWER',
      agencyId: null,
      agencyName: null,
      agencyCode: null,
      isActive: true,
      permissions: [],
    };
  }

  /**
   * Resolve a Clerk user to a DB official via auth_identities.
   * Returns a real PublicUser when a linked active official exists.
   * Returns null when no identity record exists or the linked official is inactive.
   * Clerk role/metadata claims are NEVER used for authorization.
   */
  private async resolveClerkIdentityToDbUser(
    subject: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _payloadRecord: Record<string, unknown>,
  ): Promise<PublicUser | null> {
    const identity = await this.prisma.auth_identities.findUnique({
      where: {
        provider_provider_user_id: {
          provider: 'clerk',
          provider_user_id: subject,
        },
      },
      include: {
        officials: {
          include: {
            agencies: true,
            official_permissions: true,
          },
        },
      },
    });

    if (!identity) return null;
    if (!identity.officials) return null;
    if (!identity.officials.is_active) return null;

    return this.toPublicUser(identity.officials);
  }

  /**
   * Xoá session (logout).
   */
  async destroySession(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const hash = hashSessionToken(rawToken);
    await this.prisma.$executeRaw`
      DELETE FROM auth_sessions WHERE token_hash = ${hash}
    `;
  }

  /**
   * Xoá TẤT CẢ sessions của một official (trừ session hiện tại nếu có).
   * Dùng khi đổi mật khẩu: buộc mọi thiết bị khác phải đăng nhập lại.
   * Trả về số session đã xoá.
   */
  async revokeOtherSessions(
    officialId: string,
    keepRawToken?: string,
  ): Promise<number> {
    let officialIdBig: bigint;
    try {
      officialIdBig = BigInt(officialId);
    } catch {
      return 0;
    }

    if (keepRawToken) {
      const keepHash = hashSessionToken(keepRawToken);
      const result = await this.prisma.$executeRaw`
        DELETE FROM auth_sessions
        WHERE official_id = ${officialIdBig}
          AND token_hash <> ${keepHash}
      `;
      this.logger.log(
        `Revoked ${result} other session(s) for official=${officialId} (kept current)`,
      );
      return Number(result ?? 0);
    }

    const result = await this.prisma.$executeRaw`
      DELETE FROM auth_sessions WHERE official_id = ${officialIdBig}
    `;
    this.logger.log(
      `Revoked all ${result} session(s) for official=${officialId}`,
    );
    return Number(result ?? 0);
  }

  /**
   * Xoá tất cả session của official (kể cả session hiện tại).
   * Dùng khi disable account.
   */
  async revokeAllSessions(officialId: string): Promise<number> {
    let officialIdBig: bigint;
    try {
      officialIdBig = BigInt(officialId);
    } catch {
      return 0;
    }

    const result = await this.prisma.$executeRaw`
      DELETE FROM auth_sessions WHERE official_id = ${officialIdBig}
    `;
    return Number(result ?? 0);
  }

  /**
   * Cookie options cho session.
   * `domain` được đọc từ env `AUTH_COOKIE_DOMAIN` (optional). Không set mặc định
   * để cookie chỉ gắn vào exact host (an toàn cho single-origin deployment).
   * Set domain khi cần share cookie giữa subdomain (vd: app.qlv.local, api.qlv.local).
   */
  getCookieOptions() {
    const domain = this.config.authCookieDomain;
    return {
      name: this.config.authSessionCookieName,
      secure: this.config.effectiveAuthCookieSecure,
      httpOnly: true,
      sameSite: this.config.effectiveAuthCookieSameSite,
      maxAge: this.config.authSessionTtlMs,
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }

  private async findOfficialById(id: string): Promise<PublicUser | null> {
    let officialId: bigint;
    try {
      officialId = BigInt(id);
    } catch {
      return null;
    }

    const official = await this.prisma.officials.findUnique({
      where: { id: officialId },
      include: { agencies: true, official_permissions: true },
    });
    if (!official || !official.is_active) return null;
    return this.toPublicUser(official);
  }

  private toPublicUser(official: {
    id: bigint;
    username: string | null;
    password_hash?: string | null;
    full_name: string;
    role: string | null;
    position_title: string | null;
    rank_title: string | null;
    email: string | null;
    phone: string | null;
    is_active: boolean;
    agencies: {
      id: bigint;
      agency_name: string;
      agency_code: string | null;
    } | null;
    official_permissions?: Array<{ permission_code: string }>;
  }): PublicUser {
    // Use explicit role from DB. Fallback heuristic only for legacy rows
    // where role is NULL (migrated data from before this column existed).
    const rawRole = official.role ?? '';
    let role: 'ADMIN' | 'OFFICIAL';
    if (rawRole === 'ADMIN') {
      role = 'ADMIN';
    } else if (rawRole === 'OFFICIAL') {
      role = 'OFFICIAL';
    } else {
      // Legacy fallback: keep old heuristic so existing data isn't broken
      const lowerPosition = (official.position_title ?? '').toLowerCase();
      const lowerName = official.full_name.toLowerCase();
      const isHeadPosition =
        lowerPosition.startsWith('trưởng') ||
        lowerPosition.startsWith('viện trưởng');
      role = isHeadPosition || lowerName === 'admin' ? 'ADMIN' : 'OFFICIAL';
    }

    const adminPermissions = [
      'FORM_TEMPLATE_EDIT',
      'FORM_TEMPLATE_APPROVE',
      'FORM_TEMPLATE_PERMISSION_ADMIN',
    ] as const;
    const permissions =
      role === 'ADMIN'
        ? [...adminPermissions]
        : (official.official_permissions ?? [])
            .map((permission) => permission.permission_code)
            .filter(
              (permission): permission is (typeof adminPermissions)[number] =>
                adminPermissions.includes(
                  permission as (typeof adminPermissions)[number],
                ),
            );

    return {
      id: String(official.id),
      username: official.username,
      fullName: official.full_name,
      positionTitle: official.position_title,
      rankTitle: official.rank_title,
      email: official.email,
      phone: official.phone,
      role,
      agencyId: official.agencies ? String(official.agencies.id) : null,
      agencyName: official.agencies?.agency_name ?? null,
      agencyCode: official.agencies?.agency_code ?? null,
      isActive: official.is_active,
      permissions,
    };
  }
}
