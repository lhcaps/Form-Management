import { BadRequestException } from '@nestjs/common';
import { assertRenderIntentBoundary } from './api-render-boundary.policy';
import type { ApiRenderIntent } from './api-render-intent';
import {
  assertRenderWriteBoundary,
  type RenderWriteClass,
} from './api-render-write.policy';

describe('api render lifecycle boundary policy', () => {
  it.each<ApiRenderIntent>([
    'RUNTIME_PREVIEW_SESSION',
    'RUNTIME_DIRECT_DOCX',
  ])('allows %s under runtime-template', (intent) => {
    expect(() =>
      assertRenderIntentBoundary({ lifecycle: 'runtime-template', intent }),
    ).not.toThrow();
  });

  it.each<ApiRenderIntent>([
    'GENERATED_RENDER_DOCX',
    'GENERATED_SAVE_CONTRACT_INPUTS',
    'GENERATED_SAVE_LEGACY_INPUTS',
    'GENERATED_BM031_DIRECT_SAVE',
  ])('allows %s under generated-document', (intent) => {
    expect(() =>
      assertRenderIntentBoundary({ lifecycle: 'generated-document', intent }),
    ).not.toThrow();
  });

  it('rejects generated render intent under runtime-template', () => {
    expect(() =>
      assertRenderIntentBoundary({
        lifecycle: 'runtime-template',
        intent: 'GENERATED_RENDER_DOCX',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects runtime preview intent under generated-document', () => {
    expect(() =>
      assertRenderIntentBoundary({
        lifecycle: 'generated-document',
        intent: 'RUNTIME_PREVIEW_SESSION',
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects missing or invalid intent values', () => {
    expect(() =>
      assertRenderIntentBoundary({
        lifecycle: 'runtime-template',
        intent: undefined as unknown as ApiRenderIntent,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      assertRenderIntentBoundary({
        lifecycle: 'runtime-template',
        intent: 'UNKNOWN_INTENT' as ApiRenderIntent,
      }),
    ).toThrow(BadRequestException);
  });

  it.each<RenderWriteClass>([
    'generated-documents',
    'stored-files',
    'generated-document-files',
    'generated-document-audit-logs',
    'case-events',
  ])('rejects %s under runtime-template', (writeClass) => {
    expect(() =>
      assertRenderWriteBoundary({ lifecycle: 'runtime-template', writeClass }),
    ).toThrow(BadRequestException);
  });

  it('allows runtime preview session files under runtime-template', () => {
    expect(() =>
      assertRenderWriteBoundary({
        lifecycle: 'runtime-template',
        writeClass: 'runtime-preview-session-files',
      }),
    ).not.toThrow();
  });

  it('rejects runtime preview session files under generated-document', () => {
    expect(() =>
      assertRenderWriteBoundary({
        lifecycle: 'generated-document',
        writeClass: 'runtime-preview-session-files',
      }),
    ).toThrow(BadRequestException);
  });

  it.each<RenderWriteClass>([
    'generated-documents',
    'stored-files',
    'generated-document-files',
    'generated-document-audit-logs',
    'case-events',
  ])('allows %s under generated-document', (writeClass) => {
    expect(() =>
      assertRenderWriteBoundary({ lifecycle: 'generated-document', writeClass }),
    ).not.toThrow();
  });
});
