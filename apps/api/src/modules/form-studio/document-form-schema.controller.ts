import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { DocumentFormSchemaService } from './application/document-form-schema.service';

/**
 * GET /documents/generated/:documentId/form-schema
 *
 * Locked response shape (PLAN.md v2.3 §B3):
 *   {
 *     generatedDocumentId, templateCode, sourceId, contractVersionHash,
 *     schema: FormInputSchema,
 *     values: Record<string, unknown>,         // editable fields only
 *     resolvedValues: Record<string, unknown>, // visible fields (read previews)
 *     validation: { missingRequiredFields: FormValidationError[] }
 *   }
 *
 * Read-only — does not mutate the DB. Reuses the same contract lookup
 * path as ContractFormInputsService (DB-first published, locked-file
 * fallback) so the schema always matches what the save endpoint validates
 * against. If the contract cannot be resolved, the existing FormStudioError
 * pattern surfaces 404 — see DocumentFormSchemaService.
 */
@ApiTags('Runtime Forms')
@Controller('documents/generated')
export class DocumentFormSchemaController {
  constructor(private readonly service: DocumentFormSchemaService) {}

  @Get(':documentId/form-schema')
  @ApiOperation({
    summary:
      'Lấy form schema và giá trị hiện tại của biểu mẫu đã tạo (chỉ đọc).',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  getFormSchema(
    @Param('documentId') documentId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.service.getFormSchema(documentId, user);
  }
}
