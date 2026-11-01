import { BadRequestException } from '@nestjs/common';
import type { ApiRenderLifecycle } from './api-render-intent';

export type RenderWriteClass =
  | 'runtime-preview-session-files'
  | 'generated-documents'
  | 'stored-files'
  | 'generated-document-files'
  | 'generated-document-audit-logs'
  | 'case-events';

const RUNTIME_WRITE_CLASSES = new Set<RenderWriteClass>([
  'runtime-preview-session-files',
]);

const GENERATED_WRITE_CLASSES = new Set<RenderWriteClass>([
  'generated-documents',
  'stored-files',
  'generated-document-files',
  'generated-document-audit-logs',
  'case-events',
]);

function isApiRenderLifecycle(value: unknown): value is ApiRenderLifecycle {
  return value === 'runtime-template' || value === 'generated-document';
}

function isRenderWriteClass(value: unknown): value is RenderWriteClass {
  return (
    typeof value === 'string' &&
    (RUNTIME_WRITE_CLASSES.has(value as RenderWriteClass) ||
      GENERATED_WRITE_CLASSES.has(value as RenderWriteClass))
  );
}

export function assertRenderWriteBoundary(input: {
  lifecycle: ApiRenderLifecycle;
  writeClass: RenderWriteClass;
}): void {
  if (!isApiRenderLifecycle(input?.lifecycle)) {
    throw new BadRequestException('Render lifecycle is invalid or missing.');
  }

  if (!isRenderWriteClass(input?.writeClass)) {
    throw new BadRequestException('Render write class is invalid or missing.');
  }

  const allowedWriteClasses =
    input.lifecycle === 'runtime-template'
      ? RUNTIME_WRITE_CLASSES
      : GENERATED_WRITE_CLASSES;

  if (!allowedWriteClasses.has(input.writeClass)) {
    throw new BadRequestException(
      `Render write class ${input.writeClass} is not allowed for ${input.lifecycle}.`,
    );
  }
}
