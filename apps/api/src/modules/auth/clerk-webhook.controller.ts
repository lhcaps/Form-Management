import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkWebhookService } from './clerk-webhook.service';
import { Public } from './public.decorator';

@ApiTags('Auth — Webhooks')
@Controller('auth/webhooks')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(private readonly webhookService: ClerkWebhookService) {}

  @Public()
  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clerk webhook endpoint (user lifecycle events)' })
  @ApiResponse({ status: 200, description: 'Event processed or ignored' })
  @ApiResponse({
    status: 400,
    description: 'Invalid signature or malformed payload',
  })
  async handleClerkWebhook(@Req() request: Request): Promise<{ ok: true }> {
    const svixId = request.headers['svix-id'] as string | undefined;
    const svixTimestamp = request.headers['svix-timestamp'] as
      | string
      | undefined;
    const svixSignature = request.headers['svix-signature'] as
      | string
      | undefined;

    if (!svixId || !svixTimestamp || !svixSignature) {
      this.logger.warn('Clerk webhook missing Svix headers — rejecting');
      throw new BadRequestException('Missing Svix webhook headers.');
    }

    // Read raw body for Svix signature verification.
    // With rawBody: true in NestFactory, NestJS buffers the body and sets req.rawBody.
    // Fallback to serializing parsed body if rawBody is not available.
    const rawBody = (request as Request & { rawBody?: Buffer }).rawBody
      ? (request as Request & { rawBody?: Buffer }).rawBody!.toString('utf8')
      : typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body);

    const event = this.webhookService.verifySignature(
      rawBody,
      svixId,
      svixTimestamp,
      svixSignature,
    );

    if (!event) {
      throw new BadRequestException('Invalid webhook signature.');
    }

    await this.webhookService.processEvent(event);

    return { ok: true };
  }
}
