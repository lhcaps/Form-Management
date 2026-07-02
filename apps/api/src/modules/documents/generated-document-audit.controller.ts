import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { GeneratedDocumentAuditService } from './generated-document-audit.service';
import { AgencyResourceAccessService } from '../auth/agency-resource-access.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

@ApiTags('Documents')
@Controller('documents')
export class GeneratedDocumentAuditController {
  constructor(
    private readonly audit: GeneratedDocumentAuditService,
    private readonly access: AgencyResourceAccessService,
  ) {}

  @Get('generated/:documentId/audit')
  @ApiOperation({
    summary: 'Lịch sử xuất/tải file của biểu mẫu đã tạo',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Số bản ghi trên trang (mặc định 50).',
    schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Số bản ghi bỏ qua (mặc định 0).',
    schema: { type: 'integer', minimum: 0, default: 0 },
  })
  async getDocumentAudit(
    @Param('documentId') documentId: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Query('limit') limitRaw?: string,
    @Query('offset') offsetRaw?: string,
  ) {
    // VIEWERs are forbidden — audit read is a business operation.
    if (user.role === 'VIEWER') {
      throw new ForbiddenException(
        'Người dùng Clerk không có quyền xem lịch sử xuất file.',
      );
    }

    const accessResult = await this.access.assertCanAccessGeneratedDocument(
      user,
      documentId,
    );

    const limit = limitRaw
      ? Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50))
      : 50;
    const offset = offsetRaw ? Math.max(0, parseInt(offsetRaw, 10) || 0) : 0;

    const result = await this.audit.readDocumentAudit({
      documentId: accessResult.documentId,
      actorOfficialId: accessResult.businessUser.officialId,
      actorRole: accessResult.businessUser.role,
      actorAgencyId: accessResult.businessUser.agencyId,
      limit,
      offset,
    });

    return result;
  }
}
