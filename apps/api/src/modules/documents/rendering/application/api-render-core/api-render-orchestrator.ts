import { Injectable } from '@nestjs/common';
import { assertRenderIntentBoundary } from './api-render-boundary.policy';
import { GeneratedDocumentRenderAdapter } from './generated-document-render.adapter';
import type {
  GeneratedDocumentRenderInput,
  GeneratedDocumentRenderResult,
} from './generated-document-render.adapter';
import { RuntimeTemplateRenderAdapter } from './runtime-template-render.adapter';
import type {
  RenderRuntimePreviewDocxInput,
  RenderRuntimePreviewDocxResult,
} from './runtime-template-render.adapter';

@Injectable()
export class ApiRenderOrchestrator {
  constructor(
    private readonly runtimeAdapter: RuntimeTemplateRenderAdapter,
    private readonly generatedAdapter: GeneratedDocumentRenderAdapter,
  ) {}

  renderRuntimePreviewSessionDocx(
    input: RenderRuntimePreviewDocxInput,
  ): Promise<RenderRuntimePreviewDocxResult> {
    assertRenderIntentBoundary({
      lifecycle: 'runtime-template',
      intent: 'RUNTIME_PREVIEW_SESSION',
    });

    return this.runtimeAdapter.renderPreviewDocx(input);
  }

  renderGeneratedDocumentDocx(
    input: GeneratedDocumentRenderInput,
  ): Promise<GeneratedDocumentRenderResult> {
    assertRenderIntentBoundary({
      lifecycle: 'generated-document',
      intent: 'GENERATED_RENDER_DOCX',
    });

    return this.generatedAdapter.renderDocx(input);
  }
}
