import { BadRequestException } from '@nestjs/common';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkWebhookService } from './clerk-webhook.service';

function createMockRequest(overrides: Record<string, unknown> = {}): unknown {
  return { headers: {}, body: {}, rawBody: undefined, ...overrides };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMock = jest.Mock<any, any[]>;

function makeSvc(): {
  verifySignature: AnyMock;
  processEvent: AnyMock;
} {
  return {
    verifySignature: jest.fn<AnyMock, []>(),
    processEvent: jest.fn<AnyMock, []>(),
  };
}

describe('ClerkWebhookController', () => {
  describe('handleClerkWebhook', () => {
    it('returns 400 when Svix headers are missing', async () => {
      const ws = makeSvc();
      const controller = new ClerkWebhookController(ws as unknown as ClerkWebhookService);
      await expect(controller.handleClerkWebhook(makeMockReq({ headers: {} }) as never, {}))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns 400 when Svix signature is invalid', async () => {
      const ws = makeSvc();
      ws.verifySignature.mockReturnValue(null);
      const controller = new ClerkWebhookController(ws as unknown as ClerkWebhookService);
      await expect(controller.handleClerkWebhook(makeMockReq({
        headers: { 'svix-id': 'msg_123', 'svix-timestamp': '1234567890', 'svix-signature': 'invalid' },
      }) as never, {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns { ok: true } on valid signature and processed event', async () => {
      const ws = makeSvc();
      ws.verifySignature.mockReturnValue({ type: 'user.created', data: { id: 'user_123' } });
      ws.processEvent.mockResolvedValue(true);
      const controller = new ClerkWebhookController(ws as unknown as ClerkWebhookService);
      const result = await controller.handleClerkWebhook(makeMockReq({
        headers: { 'svix-id': 'msg_123', 'svix-timestamp': '1234567890', 'svix-signature': 'v1,valid' },
        rawBody: Buffer.from('{"type":"user.created","data":{"id":"user_123"}}'),
      }) as never, {});
      expect(result).toEqual({ ok: true });
      expect(ws.processEvent).toHaveBeenCalledWith({ type: 'user.created', data: { id: 'user_123' } });
    });

    it('falls back to serializing body when rawBody is not available', async () => {
      const ws = makeSvc();
      ws.verifySignature.mockReturnValue({ type: 'user.updated', data: { id: 'user_456' } });
      ws.processEvent.mockResolvedValue(true);
      const controller = new ClerkWebhookController(ws as unknown as ClerkWebhookService);
      const result = await controller.handleClerkWebhook(makeMockReq({
        headers: { 'svix-id': 'msg_456', 'svix-timestamp': '1234567890', 'svix-signature': 'v1,valid' },
        rawBody: undefined,
      }) as never, {});
      expect(result).toEqual({ ok: true });
    });

    it('returns { ok: true } for unsupported event types', async () => {
      const ws = makeSvc();
      ws.verifySignature.mockReturnValue({ type: 'organization.created', data: { id: 'org_123' } });
      ws.processEvent.mockResolvedValue(true);
      const controller = new ClerkWebhookController(ws as unknown as ClerkWebhookService);
      const result = await controller.handleClerkWebhook(makeMockReq({
        headers: { 'svix-id': 'msg_org', 'svix-timestamp': '1234567890', 'svix-signature': 'v1,valid' },
        rawBody: Buffer.from('{"type":"organization.created","data":{}}'),
      }) as never, {});
      expect(result).toEqual({ ok: true });
    });
  });
});

function makeMockReq(overrides: Record<string, unknown> = {}): unknown {
  return { headers: {}, body: {}, rawBody: undefined, ...overrides };
}
