import { BadRequestException } from '@nestjs/common';
import type { ApiRenderIntent, ApiRenderLifecycle } from './api-render-intent';

const RUNTIME_INTENTS = new Set<ApiRenderIntent>([
  'RUNTIME_PREVIEW_SESSION',
  'RUNTIME_DIRECT_DOCX',
]);

const GENERATED_INTENTS = new Set<ApiRenderIntent>([
  'GENERATED_RENDER_DOCX',
  'GENERATED_SAVE_CONTRACT_INPUTS',
  'GENERATED_SAVE_LEGACY_INPUTS',
  'GENERATED_BM031_DIRECT_SAVE',
]);

function isApiRenderLifecycle(value: unknown): value is ApiRenderLifecycle {
  return value === 'runtime-template' || value === 'generated-document';
}

function isApiRenderIntent(value: unknown): value is ApiRenderIntent {
  return (
    typeof value === 'string' &&
    (RUNTIME_INTENTS.has(value as ApiRenderIntent) ||
      GENERATED_INTENTS.has(value as ApiRenderIntent))
  );
}

export function assertRenderIntentBoundary(input: {
  lifecycle: ApiRenderLifecycle;
  intent: ApiRenderIntent;
}): void {
  if (!isApiRenderLifecycle(input?.lifecycle)) {
    throw new BadRequestException('Render lifecycle is invalid or missing.');
  }

  if (!isApiRenderIntent(input?.intent)) {
    throw new BadRequestException('Render intent is invalid or missing.');
  }

  const allowedIntents =
    input.lifecycle === 'runtime-template'
      ? RUNTIME_INTENTS
      : GENERATED_INTENTS;

  if (!allowedIntents.has(input.intent)) {
    throw new BadRequestException(
      `Render intent ${input.intent} is not allowed for ${input.lifecycle}.`,
    );
  }
}
