import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { DocumentFormSchemaService } from './application/document-form-schema.service';

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
