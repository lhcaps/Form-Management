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
import { CreateDraftFromTemplateDto } from './dto/create-draft-from-template.dto';
import { CreateDraftFromTemplateResponseDto } from './dto/create-draft-from-template-response.dto';
import { DocumentsService } from './documents.service';
import {
  GeneratedDocumentAuditService,
  GENERATED_DOCUMENT_AUDIT_ACTIONS,
  GENERATED_DOCUMENT_AUDIT_RESULTS,
} from './generated-document-audit.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';
import { AgencyResourceAccessService } from '../auth/agency-resource-access.service';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    @Inject(GeneratedDocumentAuditService)
    private readonly audit: GeneratedDocumentAuditService,
    private readonly access: AgencyResourceAccessService,
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

  @Post('draft-from-template')
  @ApiOperation({
    summary: 'Tạo hoặc tái sử dụng bản nháp từ template bridge',
    description:
      'Used by template preview route to create/reuse draft document for skeleton forms with legacy panels',
  })
  @ApiBody({
    type: CreateDraftFromTemplateDto,
  })
  async createDraftFromTemplate(
    @Body() dto: CreateDraftFromTemplateDto,
    @CurrentUserDecorator() user: CurrentUser,
    @Req() req: Request,
  ): Promise<CreateDraftFromTemplateResponseDto> {
    const caseAccess = await this.access.assertCanAccessCase(user, dto.caseId);

    const result = await this.documentsService.createDraftFromTemplate({
      templateCode: dto.templateCode,
      caseId: dto.caseId,
      targetPersonId: dto.targetPersonId,
      source: 'TEMPLATE_BRIDGE',
      officialId: caseAccess.businessUser.officialId,
      agencyId: caseAccess.agencyId,
      officialName: caseAccess.businessUser.fullName,
    });

    void this.audit
      .record({
        action: GENERATED_DOCUMENT_AUDIT_ACTIONS.CREATED,
        result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
        actor: this.audit.buildActor(user),
        requestMeta: this.audit.normalizeRequestMeta(req),
        agencyId: caseAccess.agencyId,
        caseId: BigInt(dto.caseId),
        generatedDocumentId: BigInt(result.documentId),
        template: {
          templateCode: dto.templateCode,
          templateTitle: undefined,
          contractVersionId: undefined,
        },
        metadata: {
          source: 'TEMPLATE_BRIDGE', // Server-controlled
          event: result.reused ? 'DRAFT_REUSED' : 'DRAFT_CREATED',
          isNew: result.isNew,
          reused: result.reused,
          reviewStatus: result.reviewStatus,
        },
      })
      .catch(() => undefined);

    return result;
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
