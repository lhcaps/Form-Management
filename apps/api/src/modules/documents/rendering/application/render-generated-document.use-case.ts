import { Injectable } from '@nestjs/common';
import { ApiRenderOrchestrator } from './api-render-core/api-render-orchestrator';
import type {
  DocumentRenderCommand,
  DocumentRenderResult,
} from './document-renderer.ports';

@Injectable()
export class RenderGeneratedDocumentUseCase {
  constructor(private readonly apiRenderOrchestrator: ApiRenderOrchestrator) {}

  execute(command: DocumentRenderCommand): Promise<DocumentRenderResult> {
    return this.apiRenderOrchestrator.renderGeneratedDocumentDocx(command);
  }
}
