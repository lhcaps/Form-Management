import type { ApiRenderLifecycle } from '../api-render-core/api-render-intent';

export type GeneratedInputSaveIntent =
  | 'GENERATED_SAVE_LEGACY_INPUTS'
  | 'GENERATED_SAVE_CONTRACT_INPUTS'
  | 'GENERATED_BM031_DIRECT_SAVE';

export type GeneratedInputSaveRoute =
  | 'legacy-form-inputs'
  | 'contract-form-inputs'
  | 'bm031-direct';

export interface GeneratedInputSaveRequest {
  intent: GeneratedInputSaveIntent;
  documentId: string;
  actor?: unknown;
  body: unknown;
}

export type GeneratedInputSaveResult = {
  ok: true;
  route: GeneratedInputSaveRoute;
  result: unknown;
};

export type GeneratedInputSaveRejection =
  | { kind: 'runtime-lifecycle'; lifecycle: ApiRenderLifecycle; intent: string }
  | { kind: 'unknown-intent'; intent: string }
  | { kind: 'missing-document-id' };

export interface GeneratedInputSaveAdapter {
  readonly route: GeneratedInputSaveRoute;
  readonly intent: GeneratedInputSaveIntent;
  save(request: GeneratedInputSaveRequest): Promise<unknown>;
}
