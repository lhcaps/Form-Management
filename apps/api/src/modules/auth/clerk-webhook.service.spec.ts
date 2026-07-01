import { ClerkWebhookService } from './clerk-webhook.service';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { Webhook } from 'svix';

jest.mock('svix', () => ({
  Webhook: class MockWebhook {
    constructor(_secret: string) {}
    verify(rawBody: string, _headers: Record<string, string>): string {
      if (rawBody === 'test-payload') {
        return JSON.stringify({
          type: 'user.created',
          data: { id: 'user_test', email_addresses: [{ id: 'ema_1', email_address: 'test@example.test' }] },
        });
      }
      if (rawBody === 'user-deleted-payload') {
        return JSON.stringify({ type: 'user.deleted', data: { id: 'user_deleted_test' } });
      }
      if (rawBody === 'user-updated-payload') {
        return JSON.stringify({
          type: 'user.updated',
          data: { id: 'user_updated_test', email_addresses: [{ id: 'ema_2', email_address: 'updated@example.test' }] },
        });
      }
      return JSON.stringify({
        type: 'user.created',
        data: { id: 'user_default', email_addresses: [{ id: 'ema_3', email_address: 'new@example.test' }] },
      });
    }
  },
}));

interface MockPrisma {
  auth_identities: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    updateMany: jest.Mock;
  };
  officials: {
    findMany: jest.Mock;
  };
  $queryRaw: jest.Mock;
}

function createService(prisma: MockPrisma, configOverrides: Record<string, unknown> = {}) {
  const config = {
    get clerkWebhookSecret() {
      return configOverrides['clerkWebhookSecret'] as string | undefined;
    },
    ...configOverrides,
  };
  return new ClerkWebhookService(prisma as never, config as AppConfigService);
}

describe('ClerkWebhookService', () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = {
      auth_identities: { findUnique: jest.fn(), upsert: jest.fn(), updateMany: jest.fn() },
      officials: { findMany: jest.fn() },
      $queryRaw: jest.fn(),
    };
  });

  describe('verifySignature', () => {
    it('returns null when CLERK_WEBHOOK_SECRET is not configured', () => {
      const service = createService(prisma, { clerkWebhookSecret: undefined });
      const result = service.verifySignature('payload', 'svix-id', 'svix-ts', 'svix-sig');
      expect(result).toBeNull();
    });

    it('returns parsed event on valid signature', () => {
      const service = createService(prisma, { clerkWebhookSecret: 'test-secret' });
      const result = service.verifySignature('test-payload', 'svix-id', 'svix-ts', 'svix-sig');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('user.created');
    });
  });

  describe('processEvent', () => {
    it('returns true for unsupported event types', async () => {
      const service = createService(prisma, { clerkWebhookSecret: 'test-secret' });
      const result = await service.processEvent({ type: 'session.removed', data: {} });
      expect(result).toBe(true);
    });

    it('user.created: creates identity with official_id=null when no email match', async () => {
      prisma.auth_identities.upsert = jest.fn().mockResolvedValue({ id: 1n });
      prisma.$queryRaw = jest.fn().mockResolvedValue([]);

      const service = createService(prisma, { clerkWebhookSecret: 'test-secret' });
      await service.processEvent({
        type: 'user.created',
        data: {
          id: 'user_new',
          email_addresses: [{ id: 'ema_1', email_address: 'noreply@example.test' }],
          primary_email_address_id: 'ema_1',
        },
      });

      expect(prisma.auth_identities.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provider_provider_user_id: { provider: 'clerk', provider_user_id: 'user_new' } },
          create: expect.objectContaining({ provider: 'clerk', provider_user_id: 'user_new', official_id: null }),
        }),
      );
    });

    it('user.created: links to exactly one active official by email', async () => {
      prisma.auth_identities.upsert = jest.fn().mockResolvedValue({ id: 1n });
      prisma.$queryRaw = jest.fn().mockResolvedValue([{ id: 7n }]);

      const service = createService(prisma, { clerkWebhookSecret: 'test-secret' });
      await service.processEvent({
        type: 'user.created',
        data: {
          id: 'user_linked',
          email_addresses: [{ id: 'ema_1', email_address: 'nguyen.a@viện.test' }],
          primary_email_address_id: 'ema_1',
        },
      });

      expect(prisma.auth_identities.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ official_id: 7n }),
        }),
      );
    });

    it('user.created: does NOT link if multiple officials share the email', async () => {
      prisma.auth_identities.upsert = jest.fn().mockResolvedValue({ id: 1n });
      prisma.$queryRaw = jest.fn().mockResolvedValue([{ id: 1n }, { id: 2n }]);

      const service = createService(prisma, { clerkWebhookSecret: 'test-secret' });
      await service.processEvent({
        type: 'user.created',
        data: {
          id: 'user_ambiguous',
          email_addresses: [{ id: 'ema_1', email_address: 'duplicate@viện.test' }],
          primary_email_address_id: 'ema_1',
        },
      });

      expect(prisma.auth_identities.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ official_id: null }),
        }),
      );
    });

    it('user.updated: upserts identity without changing official_id', async () => {
      prisma.auth_identities.upsert = jest.fn().mockResolvedValue({ id: 1n });

      const service = createService(prisma, { clerkWebhookSecret: 'test-secret' });
      await service.processEvent({
        type: 'user.updated',
        data: {
          id: 'user_existing',
          email_addresses: [{ id: 'ema_1', email_address: 'existing@example.test' }],
          primary_email_address_id: 'ema_1',
        },
      });

      // verify upsert was called with proper where clause
      expect(prisma.auth_identities.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { provider_provider_user_id: { provider: 'clerk', provider_user_id: 'user_existing' } },
        }),
      );
      // verify upsert args are valid (no undefined fields)
      const call = prisma.auth_identities.upsert.mock.calls[0][0];
      expect(call.create.official_id).toBeNull();
      expect(call.update.official_id).toBeUndefined();
    });

    it('user.deleted: unlinks identity (sets official_id=null) and keeps row', async () => {
      prisma.auth_identities.updateMany = jest.fn().mockResolvedValue({ count: 1 });

      const service = createService(prisma, { clerkWebhookSecret: 'test-secret' });
      await service.processEvent({ type: 'user.deleted', data: { id: 'user_gone' } });

      expect(prisma.auth_identities.updateMany).toHaveBeenCalledWith({
        where: { provider: 'clerk', provider_user_id: 'user_gone' },
        data: expect.objectContaining({ official_id: null }),
      });
    });
  });
});
