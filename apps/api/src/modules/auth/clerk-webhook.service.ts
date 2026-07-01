import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { Prisma } from '@prisma/client';
import { Webhook } from 'svix';

export interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly config?: AppConfigService,
  ) {}

  /**
   * Verify Svix webhook signature and return parsed event payload.
   * Returns null if signature is invalid or webhook secret is not configured.
   */
  verifySignature(
    rawBody: string,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ): ClerkWebhookEvent | null {
    const secret = this.getWebhookSecret();
    if (!secret) {
      this.logger.error(
        'CLERK_WEBHOOK_SECRET is not configured — rejecting webhook',
      );
      return null;
    }

    const svix = new Webhook(secret);
    try {
      const raw = svix.verify(rawBody, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!this.isValidWebhookEvent(parsed)) {
        this.logger.warn('Clerk webhook payload is not a valid event object');
        return null;
      }
      return parsed;
    } catch {
      this.logger.warn('Clerk webhook signature verification failed');
      return null;
    }
  }

  /**
   * Validate that a value is a Clerk webhook event object.
   */
  private isValidWebhookEvent(value: unknown): value is ClerkWebhookEvent {
    if (typeof value !== 'object' || value === null) return false;
    if (typeof (value as Record<string, unknown>).type !== 'string')
      return false;
    if (typeof (value as Record<string, unknown>).data !== 'object')
      return false;
    return true;
  }

  /**
   * Process a Clerk webhook event.
   * Returns true if the event was processed successfully (including unsupported events).
   */
  async processEvent(event: ClerkWebhookEvent): Promise<boolean> {
    const { type, data } = event;

    switch (type) {
      case 'user.created':
        await this.handleUserCreated(data);
        return true;
      case 'user.updated':
        await this.handleUserUpdated(data);
        return true;
      case 'user.deleted':
        await this.handleUserDeleted(data);
        return true;
      default:
        this.logger.debug(`Ignoring unsupported Clerk event type: ${type}`);
        return true;
    }
  }

  /**
   * user.created: upsert identity, safe email-based linking.
   */
  private async handleUserCreated(
    data: Record<string, unknown>,
  ): Promise<void> {
    const userId = typeof data.id === 'string' ? data.id : null;
    if (!userId) {
      this.logger.warn('user.created event missing id — skipping');
      return;
    }

    const email = this.extractPrimaryEmail(data);
    const username = this.extractUsername(data);
    const fullName = this.extractFullName(data);
    const now = new Date();

    // Safe linking: only link if exactly one active official has this email.
    let officialId: bigint | null = null;
    if (email) {
      officialId = await this.findActiveOfficialByEmail(email);
    }

    await this.prisma.auth_identities.upsert({
      where: {
        provider_provider_user_id: {
          provider: 'clerk',
          provider_user_id: userId,
        },
      },
      create: {
        provider: 'clerk',
        provider_user_id: userId,
        official_id: officialId,
        email: email ?? null,
        username: username ?? null,
        full_name: fullName ?? null,
        last_synced_at: now,
        raw_profile_json: this.sanitizeProfile(data),
      },
      update: {
        email: email ?? null,
        username: username ?? null,
        full_name: fullName ?? null,
        last_synced_at: now,
        raw_profile_json: this.sanitizeProfile(data),
      },
    });

    this.logger.log(
      `Clerk user.created processed: clerk_id=${userId}, email=${email}, linked_official_id=${officialId}`,
    );
  }

  /**
   * user.updated: upsert identity, preserve existing official_id.
   */
  private async handleUserUpdated(
    data: Record<string, unknown>,
  ): Promise<void> {
    const userId = typeof data.id === 'string' ? data.id : null;
    if (!userId) {
      this.logger.warn('user.updated event missing id — skipping');
      return;
    }

    const email = this.extractPrimaryEmail(data);
    const username = this.extractUsername(data);
    const fullName = this.extractFullName(data);
    const now = new Date();

    await this.prisma.auth_identities.upsert({
      where: {
        provider_provider_user_id: {
          provider: 'clerk',
          provider_user_id: userId,
        },
      },
      create: {
        provider: 'clerk',
        provider_user_id: userId,
        official_id: null,
        email: email ?? null,
        username: username ?? null,
        full_name: fullName ?? null,
        last_synced_at: now,
        raw_profile_json: this.sanitizeProfile(data),
      },
      update: {
        email: email ?? null,
        username: username ?? null,
        full_name: fullName ?? null,
        last_synced_at: now,
        raw_profile_json: this.sanitizeProfile(data),
      },
    });

    this.logger.log(
      `Clerk user.updated processed: clerk_id=${userId}, email=${email}`,
    );
  }

  /**
   * user.deleted: unlink identity (set official_id=null), keep identity for audit.
   */
  private async handleUserDeleted(
    data: Record<string, unknown>,
  ): Promise<void> {
    const userId = typeof data.id === 'string' ? data.id : null;
    if (!userId) {
      this.logger.warn('user.deleted event missing id — skipping');
      return;
    }

    const now = new Date();

    // Preserve the identity row for audit traceability; just unlink the official.
    const result = await this.prisma.auth_identities.updateMany({
      where: {
        provider: 'clerk',
        provider_user_id: userId,
      },
      data: {
        official_id: null,
        last_synced_at: now,
      },
    });

    this.logger.log(
      `Clerk user.deleted processed: clerk_id=${userId}, identities_updated=${result.count}`,
    );
  }

  /**
   * Find exactly one active official with the given email (case-insensitive).
   * Uses raw SQL for MySQL case-insensitive comparison.
   * Returns null if zero or multiple matches.
   */
  private async findActiveOfficialByEmail(
    email: string,
  ): Promise<bigint | null> {
    const matches = await this.prisma.$queryRaw<Array<{ id: bigint }>>`
      SELECT id FROM officials
      WHERE is_active = TRUE
        AND email IS NOT NULL
        AND LOWER(email) = LOWER(${email})
      LIMIT 2
    `;

    if (matches.length === 1) {
      return matches[0].id;
    }
    // Zero or multiple matches — do not auto-link.
    return null;
  }

  private getWebhookSecret(): string | null {
    return (
      this.config?.clerkWebhookSecret ??
      process.env.CLERK_WEBHOOK_SECRET ??
      null
    );
  }

  private extractPrimaryEmail(data: Record<string, unknown>): string | null {
    // Clerk primary email is in email_addresses array.
    const emailAddresses = data.email_addresses as
      | Array<Record<string, unknown>>
      | undefined;
    if (Array.isArray(emailAddresses) && emailAddresses.length > 0) {
      const primary = emailAddresses.find(
        (ea) => ea.id === data.primary_email_address_id,
      );
      const addr = primary?.email_address ?? emailAddresses[0]?.email_address;
      if (typeof addr === 'string' && addr.includes('@')) return addr;
    }
    // Fallback: direct email field.
    const email = data.email_addresses ?? data.email;
    if (typeof email === 'string' && email.includes('@')) return email;
    return null;
  }

  private extractUsername(data: Record<string, unknown>): string | null {
    const username = data.username;
    if (typeof username === 'string' && username.length > 0) return username;
    return null;
  }

  private extractFullName(data: Record<string, unknown>): string | null {
    const name =
      data.first_name && data.last_name
        ? `${data.first_name} ${data.last_name}`
        : (data.first_name ?? data.last_name ?? data.name);
    if (typeof name === 'string' && name.length > 0) return name;
    return null;
  }

  /**
   * Remove sensitive fields from Clerk profile before storing in raw_profile_json.
   */
  private sanitizeProfile(
    data: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_enabled, totp_enabled, backup_code_enabled, ...safe } =
      data;
    return safe as Prisma.InputJsonValue;
  }

  /**
   * Manually link a Clerk identity to an official.
   * Used by admin workflow (not exposed via API in this PR — direct DB access required).
   *
   * SECURITY: This is a privileged operation that grants business access.
   * Only call this when the identity-to-official link is intentionally verified.
   *
   * Returns true if linked, false if identity not found.
   */
  async linkIdentityToOfficial(
    clerkUserId: string,
    officialId: bigint,
  ): Promise<boolean> {
    const existing = await this.prisma.auth_identities.findUnique({
      where: {
        provider_provider_user_id: {
          provider: 'clerk',
          provider_user_id: clerkUserId,
        },
      },
    });

    if (!existing) return false;

    await this.prisma.auth_identities.update({
      where: { id: existing.id },
      data: { official_id: officialId },
    });

    this.logger.log(
      `Identity link updated: clerk_id=${clerkUserId}, official_id=${officialId}`,
    );
    return true;
  }

  /**
   * Remove the official link from a Clerk identity.
   * Used by admin workflow to revoke Clerk business access.
   *
   * Returns true if unlinked, false if identity not found.
   */
  async unlinkIdentityFromOfficial(clerkUserId: string): Promise<boolean> {
    const existing = await this.prisma.auth_identities.findUnique({
      where: {
        provider_provider_user_id: {
          provider: 'clerk',
          provider_user_id: clerkUserId,
        },
      },
    });

    if (!existing) return false;

    await this.prisma.auth_identities.update({
      where: { id: existing.id },
      data: { official_id: null },
    });

    this.logger.log(`Identity unlinked: clerk_id=${clerkUserId}`);
    return true;
  }
}
