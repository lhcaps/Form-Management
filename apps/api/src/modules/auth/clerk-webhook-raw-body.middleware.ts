import type { Request, Response } from 'express';

/**
 * Attaches `req.rawBody` for Clerk webhook routes before JSON parsing.
 * Svix needs the exact raw bytes to verify the HMAC signature.
 */
export function clerkWebhookRawBodyMiddleware(
  req: Request,
  _res: Response,
  buf: Buffer,
): void {
  if (req.url?.includes('/auth/webhooks/clerk')) {
    (req as Request & { rawBody?: Buffer }).rawBody = buf;
  }
}
