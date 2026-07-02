import { join, relative } from 'node:path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  GENERATED_DOCUMENT_DESCRIPTOR,
  type GeneratedDocumentDescriptorPort,
} from '../application/document-renderer.ports';
import { ContractRenderPlanBuilder } from '../application/contract-render-plan.builder';
import { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';
import { DocxtemplaterContractRenderEngine } from '../infrastructure/docxtemplater-contract-render-engine';
import { PrismaService } from '../../../../prisma/prisma.service';
import type {
  DocumentRenderCommand,
  DocumentRenderResult,
} from '../application/document-renderer.ports';
import type { ContractRenderPlan } from '../domain/contract-render-plan';
import type { ActiveRenderArtifact } from '../infrastructure/docxtemplater-contract-render-engine';

@Injectable()
export class ContractShadowRendererOrchestrator {
  private readonly logger = new Logger(ContractShadowRendererOrchestrator.name);

  constructor(
    @Inject(GENERATED_DOCUMENT_DESCRIPTOR)
    private readonly descriptors: GeneratedDocumentDescriptorPort,
    private readonly planBuilder: ContractRenderPlanBuilder,
    private readonly renderEngine: DocxtemplaterContractRenderEngine,
    private readonly workspace: WorkspacePathsService,
    private readonly prisma: PrismaService,
  ) {}

  async renderActive(documentId: string): Promise<DocumentRenderResult> {
    let descriptor: Awaited<
      ReturnType<GeneratedDocumentDescriptorPort['findByDocumentId']>
    >;
    try {
      descriptor = await this.descriptors.findByDocumentId(documentId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Cannot resolve descriptor for documentId=${documentId}: ${msg}`,
      );
    }

    let plan: ContractRenderPlan;
    try {
      plan = this.planBuilder.build(descriptor);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to build render plan for documentId=${documentId}: ${msg}`,
      );
    }

    const formData = descriptor.formData ?? {};
    const renderedDocx = await this.renderEngine.renderActiveDocx(
      plan,
      formData,
    );

    const activeOutputDir = join(
      this.workspace.generatedDocumentsRoot,
      'cases',
    );

    let artifact: ActiveRenderArtifact;
    try {
      artifact = await this.renderEngine.persistActiveRender(
        plan,
        renderedDocx,
        activeOutputDir,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Active render persistence failed for documentId=${documentId}: ${msg}`,
      );
    }

    this.logger.log(
      `Active render complete for documentId=${documentId}, templateCode=${plan.templateCode}.`,
    );

    return this.recordActiveGeneratedDocx(documentId, plan, artifact);
  }

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

  private async recordActiveGeneratedDocx(
    documentId: string,
    plan: ContractRenderPlan,
    artifact: ActiveRenderArtifact,
  ): Promise<DocumentRenderResult> {
    const generatedDocument = await this.prisma.generated_documents.findUnique({
      where: { id: BigInt(documentId) },
      select: {
        id: true,
        case_id: true,
        document_title: true,
        generated_by_name: true,
        review_status: true,
      },
    });

    if (!generatedDocument) {
      throw new Error(
        `Generated document ${documentId} not found after active render.`,
      );
    }

    const relativePath = relative(
      this.workspace.repoRoot,
      artifact.docxPath,
    ).replace(/\\/g, '/');

    const result = await this.prisma.$transaction(async (tx) => {
      const storedFile = await tx.stored_files.create({
        data: {
          file_category: 'GENERATED_DOCX',
          original_file_name: artifact.fileName,
          stored_file_name: artifact.fileName,
          file_ext: 'docx',
          mime_type:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size_bytes: BigInt(artifact.bytes),
          relative_path: relativePath,
          absolute_path: artifact.docxPath,
          checksum: artifact.checksum,
          related_entity_type: 'generated_documents',
          related_entity_id: generatedDocument.id,
          created_by_name: generatedDocument.generated_by_name,
        },
      });

      await tx.generated_document_files.updateMany({
        where: {
          generated_document_id: generatedDocument.id,
          file_format: 'DOCX',
        },
        data: { is_final: false },
      });

      const generatedFile = await tx.generated_document_files.create({
        data: {
          generated_document_id: generatedDocument.id,
          stored_file_id: storedFile.id,
          file_format: 'DOCX',
          file_name: artifact.fileName,
          file_path: relativePath,
          file_size_bytes: BigInt(artifact.bytes),
          checksum: artifact.checksum,
          is_final: false,
        },
      });

      await tx.generated_documents.update({
        where: { id: generatedDocument.id },
        data: {
          validation_result: {
            status: 'RENDERED_DOCX_READY',
            renderer: 'contract-active',
            renderedAt: new Date().toISOString(),
            outputFilePath: relativePath,
            checksum: artifact.checksum,
            manifestPath: relative(
              this.workspace.repoRoot,
              artifact.manifestPath,
            ).replace(/\\/g, '/'),
            missingRequiredCount: plan.missingRequired.length,
            warnings: [...plan.warnings],
          } as any,
        },
      });

      await tx.case_events.create({
        data: {
          case_id: generatedDocument.case_id,
          event_type: 'DOCUMENT_DOCX_RENDERED',
          event_title: 'Render file DOCX',
          event_description: `Đã render DOCX cho biểu mẫu "${generatedDocument.document_title}" bằng contract renderer.`,
          stage_code: null,
          status_before: generatedDocument.review_status,
          status_after: generatedDocument.review_status,
          created_by_name: generatedDocument.generated_by_name,
        },
      });

      return { storedFile, generatedFile };
    });

    return {
      documentId,
      templateCode: plan.templateCode,
      renderedBy: 'contract-active',
      file: {
        id: String(result.generatedFile.id),
        storedFileId: String(result.storedFile.id),
        fileFormat: result.generatedFile.file_format,
        fileName: result.generatedFile.file_name,
        filePath: result.generatedFile.file_path,
        fileSizeBytes: String(result.generatedFile.file_size_bytes),
        checksum: result.generatedFile.checksum,
        isFinal: result.generatedFile.is_final,
      },
    };
  }
}
