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

    const rawBodyBuffer = (request as Request & { rawBody?: Buffer }).rawBody;
    if (!rawBodyBuffer) {
      this.logger.warn('Clerk webhook missing raw body — rejecting');
      throw new BadRequestException('Missing raw webhook body.');
    }
    const rawBody = rawBodyBuffer.toString('utf8');

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
