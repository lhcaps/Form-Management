/**
 * DOCX Preview Controller
 *
 * Provides preview endpoints for generated DOCX documents:
 * - GET  /documents/generated/:documentId/preview — Full preview with audit + PDF
 * - GET  /documents/generated/:documentId/preview/audit — Audit-only (no PDF conversion)
 * - GET  /documents/preview/sample-data — Available sample data keys
 *
 * @module documents/preview
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiProduces, ApiTags } from '@nestjs/swagger';
import { DocxPreviewService } from './docx-preview.service';
import { PreviewDocxQueryDto } from './docx-preview.dto';
import { CurrentUser as CurrentUserDecorator } from '../../auth/current-user.decorator';
import type { CurrentUser } from '../../auth/current-user.type';

@ApiTags('Documents')
@Controller('documents')
export class DocxPreviewController {
  constructor(private readonly previewService: DocxPreviewService) {}

  @Get('generated/:documentId/preview')
  @ApiOperation({
    summary: 'Xem trước bản in DOCX với kiểm tra định dạng',
    description:
      'Trả về audit định dạng và tùy chọn file PDF đã chuyển đổi. ' +
      'Không lưu dữ liệu mẫu vào cơ sở dữ liệu.',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiProduces('application/json')
  async previewDocx(
    @Param('documentId') documentId: string,
    @Query() query: PreviewDocxQueryDto,
    @CurrentUserDecorator() user: CurrentUser | null,
  ) {
    return this.previewService.previewGeneratedDocument(documentId, user, {
      sample: query.sample,
      auditOnly: false,
    });
  }

  @Get('generated/:documentId/preview/audit')
  @ApiOperation({
    summary: 'Kiểm tra định dạng DOCX (chỉ audit, không chuyển PDF)',
    description:
      'Chạy audit định dạng trên file DOCX đã tạo mà không chuyển đổi sang PDF. ' +
      'Nhanh hơn endpoint preview đầy đủ.',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiProduces('application/json')
  async auditDocx(
    @Param('documentId') documentId: string,
    @CurrentUserDecorator() user: CurrentUser | null,
  ) {
    return this.previewService.previewGeneratedDocument(documentId, user, {
      auditOnly: true,
    });
  }

  @Get('preview/sample-data')
  @ApiOperation({
    summary: 'Lấy danh sách dữ liệu mẫu cho preview',
    description:
      'Trả về danh sách các trường dữ liệu mẫu có sẵn. ' +
      'Dữ liệu mẫu không được lưu vào cơ sở dữ liệu hồ sơ.',
  })
  @ApiProduces('application/json')
  getSampleDataKeys() {
    return this.previewService.getSampleDataKeys();
  }
}
