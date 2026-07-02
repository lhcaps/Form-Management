import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateDocumentGenerationBatchDto } from './dto/create-document-generation-batch.dto';
import { DocumentsService } from './documents.service';
import {
  GeneratedDocumentAuditService,
  GENERATED_DOCUMENT_AUDIT_ACTIONS,
  GENERATED_DOCUMENT_AUDIT_RESULTS,
} from './generated-document-audit.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    @Inject(GeneratedDocumentAuditService)
    private readonly audit: GeneratedDocumentAuditService,
  ) {}

  @Get('cases/:caseId/available-templates')
  @ApiOperation({
    summary: 'Lấy danh sách biểu mẫu có thể tạo cho một hồ sơ',
  })
  @ApiParam({
    name: 'caseId',
    description: 'ID hồ sơ.',
  })
  getAvailableTemplates(@Param('caseId') caseId: string) {
    return this.documentsService.getAvailableTemplates(caseId);
  }

  @Post('cases/:caseId/plan')
  @ApiOperation({
    summary: 'Xem trước kế hoạch tạo biểu mẫu theo render_scope',
  })
  @ApiParam({
    name: 'caseId',
    description: 'ID hồ sơ.',
  })
  @ApiBody({
    type: CreateDocumentGenerationBatchDto,
  })
  buildPlan(
    @Param('caseId') caseId: string,
    @Body() body: CreateDocumentGenerationBatchDto,
  ) {
    return this.documentsService.buildPlan(caseId, body);
  }

  @Post('cases/:caseId/batches')
  @ApiOperation({
    summary: 'Tạo batch biểu mẫu chờ duyệt cho hồ sơ',
  })
  @ApiParam({
    name: 'caseId',
    description: 'ID hồ sơ.',
  })
  @ApiBody({
    type: CreateDocumentGenerationBatchDto,
  })
  async createBatch(
    @Param('caseId') caseId: string,
    @Body() body: CreateDocumentGenerationBatchDto,
    @CurrentUserDecorator() user: CurrentUser,
    @Req() req: Request,
  ) {
    const batchResult = await this.documentsService.createBatch(caseId, {
      ...body,
      createdByName: user.fullName,
    });

    // Audit: after transaction succeeds, record one row per created document.
    // Fire-and-forget — non-blocking, consistent with PR #28 policy.
    void this.auditCreatedDocuments(batchResult, user, req, caseId);

    return this.documentsService.findBatch(String(batchResult.batch.id));
  }

  private async auditCreatedDocuments(
    batchResult: {
      batch: { id: bigint };
      documents: Array<{
        id: bigint;
        document_code: string | null;
        document_title: string;
        target_scope: string;
        target_person_id: bigint | null;
        generated_by_name: string | null;
      }>;
    },
    user: CurrentUser,
    req: Request,
    caseId: string,
  ): Promise<void> {
    try {
      const result = await batchResult;
      for (const doc of result.documents) {
        const planItem = await this.getPlanItemForDocument(doc.id);
        await this.audit.record({
          action: GENERATED_DOCUMENT_AUDIT_ACTIONS.CREATED,
          result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
          actor: this.audit.buildActor(user),
          requestMeta: this.audit.normalizeRequestMeta(req),
          agencyId: user.agencyId ? BigInt(user.agencyId) : undefined,
          caseId: BigInt(caseId),
          generatedDocumentId: doc.id,
          template: planItem
            ? {
                templateCode: planItem.templateCode,
                templateTitle: planItem.templateName ?? undefined,
                contractVersionId: undefined,
              }
            : undefined,
          metadata: {
            documentCode: doc.document_code ?? null,
            documentTitle: doc.document_title,
            targetScope: doc.target_scope,
            targetPersonId: doc.target_person_id
              ? String(doc.target_person_id)
              : null,
            generatedByName: doc.generated_by_name,
            requestedFormats: planItem?.outputStrategy ?? null,
          },
        });
      }
    } catch {
      // Swallow — audit is non-blocking, consistent with PR #28 policy.
    }
  }

  private async getPlanItemForDocument(documentId: bigint): Promise<{
    templateCode: string;
    templateName: string | null;
    outputStrategy: string | null;
  } | null> {
    const doc = await this.documentsService.findDocumentById(documentId);
    if (!doc) return null;
    return {
      templateCode: doc.template_code ?? '',
      templateName: doc.template_name ?? null,
      outputStrategy: doc.output_strategy ?? null,
    };
  }

  @Get('batches/:batchId')
  @ApiOperation({
    summary: 'Lấy chi tiết batch biểu mẫu đã tạo',
  })
  @ApiParam({
    name: 'batchId',
    description: 'ID batch.',
  })
  findBatch(@Param('batchId') batchId: string) {
    return this.documentsService.findBatch(batchId);
  }
}
