export type ApiRenderLifecycle = 'runtime-template' | 'generated-document';

export type ApiRenderIntent =
  | 'RUNTIME_PREVIEW_SESSION'
  | 'RUNTIME_DIRECT_DOCX'
  | 'GENERATED_RENDER_DOCX'
  | 'GENERATED_SAVE_CONTRACT_INPUTS'
  | 'GENERATED_SAVE_LEGACY_INPUTS'
  | 'GENERATED_BM031_DIRECT_SAVE';
