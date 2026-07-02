import { Injectable, Logger } from '@nestjs/common';
import type {
  ContractDocumentRendererPort,
  DocumentRenderCommand,
  DocumentRenderResult,
} from '../application/document-renderer.ports';
import { ContractShadowRendererOrchestrator } from '../application/contract-shadow-renderer.orchestrator';

@Injectable()
export class ContractDocumentRendererAdapter implements ContractDocumentRendererPort {
  private readonly logger = new Logger(ContractDocumentRendererAdapter.name);

  constructor(
    private readonly shadowOrchestrator: ContractShadowRendererOrchestrator,
  ) {}

  async renderActive(
    command: DocumentRenderCommand,
  ): Promise<DocumentRenderResult> {
    const documentId = command.documentId;
    try {
      return await this.shadowOrchestrator.renderActive(documentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Contract active render failed for documentId=${documentId}: ${message}`,
      );
      throw error;
    }
  }

  async renderShadow(
    _command: DocumentRenderCommand,
    _legacyResult: DocumentRenderResult,
  ): Promise<void> {
    await this.shadowOrchestrator.renderShadow(_command, _legacyResult);
  }
}
