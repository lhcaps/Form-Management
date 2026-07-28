import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CONTRACT_DOCUMENT_RENDERER,
  GENERATED_DOCUMENT_DESCRIPTOR,
  LEGACY_DOCUMENT_RENDERER,
  type ContractDocumentRendererPort,
  type DocumentRenderCommand,
  type DocumentRenderResult,
  type GeneratedDocumentDescriptorPort,
  type LegacyDocumentRendererPort,
} from '../document-renderer.ports';
import { ContractShadowRendererOrchestrator } from '../contract-shadow-renderer.orchestrator';
import { DocumentRendererRoutingPolicy } from '../document-renderer-routing.policy';
import { assertRenderIntentBoundary } from './api-render-boundary.policy';
import type { GeneratedDocumentRenderAdapterContract } from './api-render-adapter.contract';

export type GeneratedDocumentRenderInput = DocumentRenderCommand;
export type GeneratedDocumentRenderResult = DocumentRenderResult;

@Injectable()
export class GeneratedDocumentRenderAdapter implements GeneratedDocumentRenderAdapterContract {
  readonly lifecycle = 'generated-document' as const;

  private readonly logger = new Logger(GeneratedDocumentRenderAdapter.name);

  constructor(
    @Inject(LEGACY_DOCUMENT_RENDERER)
    private readonly legacyRenderer: LegacyDocumentRendererPort,
    @Inject(CONTRACT_DOCUMENT_RENDERER)
    private readonly contractRenderer: ContractDocumentRendererPort,
    @Inject(GENERATED_DOCUMENT_DESCRIPTOR)
    private readonly descriptors: GeneratedDocumentDescriptorPort,
    private readonly routingPolicy: DocumentRendererRoutingPolicy,
    private readonly shadowOrchestrator: ContractShadowRendererOrchestrator,
  ) {}

  async renderDocx(
    input: GeneratedDocumentRenderInput,
  ): Promise<GeneratedDocumentRenderResult> {
    assertRenderIntentBoundary({
      lifecycle: 'generated-document',
      intent: 'GENERATED_RENDER_DOCX',
    });

    if (this.routingPolicy.isDisabled) {
      return this.legacyRenderer.render(input);
    }

    const descriptor = await this.descriptors.findByDocumentId(
      input.documentId,
    );
    const route = this.routingPolicy.route(descriptor.templateCode);

    if (route === 'legacy') {
      return this.legacyRenderer.render(input);
    }

    if (route === 'active') {
      return this.contractRenderer.renderActive(input);
    }

    const legacyResult = await this.legacyRenderer.render(input);

    try {
      await this.shadowOrchestrator.renderShadow(input, legacyResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Contract renderer shadow failed for documentId=${input.documentId}, templateCode=${descriptor.templateCode}: ${message}`,
      );
    }

    return legacyResult;
  }
}
