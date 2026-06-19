import { join } from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GENERATED_DOCUMENT_DESCRIPTOR,
  type GeneratedDocumentDescriptorPort,
} from '../application/document-renderer.ports';
import { ContractRenderPlanBuilder } from '../application/contract-render-plan.builder';
import { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';
import { DocxtemplaterContractRenderEngine } from '../infrastructure/docxtemplater-contract-render-engine';
import type {
  DocumentRenderCommand,
  DocumentRenderResult,
} from '../application/document-renderer.ports';
import type { ContractRenderPlan } from '../domain/contract-render-plan';

@Injectable()
export class ContractShadowRendererOrchestrator {
  private readonly logger = new Logger(ContractShadowRendererOrchestrator.name);

  constructor(
    @Inject(GENERATED_DOCUMENT_DESCRIPTOR)
    private readonly descriptors: GeneratedDocumentDescriptorPort,
    private readonly planBuilder: ContractRenderPlanBuilder,
    private readonly renderEngine: DocxtemplaterContractRenderEngine,
    private readonly workspace: WorkspacePathsService,
  ) {}

  async renderShadow(
    command: DocumentRenderCommand,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _legacyResult: DocumentRenderResult,
  ): Promise<void> {
    const documentId = command.documentId;

    let descriptor: Awaited<
      ReturnType<GeneratedDocumentDescriptorPort['findByDocumentId']>
    >;
    try {
      descriptor = await this.descriptors.findByDocumentId(documentId);
    } catch (error) {
      this.logger.error(
        `Cannot resolve descriptor for documentId=${documentId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    let plan: ContractRenderPlan;
    try {
      plan = this.planBuilder.build(descriptor);
    } catch (error) {
      this.logger.error(
        `Failed to build render plan for documentId=${documentId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }

    const shadowOutputDir = this.resolveShadowOutputDir();

    try {
      await this.renderEngine.renderShadow(
        plan,
        descriptor.formData ?? {},
        shadowOutputDir,
      );
    } catch (error) {
      this.logger.error(
        `Shadow render failed for documentId=${documentId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
  }

  private resolveShadowOutputDir(): string {
    return join(this.workspace.generatedDocumentsRoot, 'shadow-renders');
  }
}
