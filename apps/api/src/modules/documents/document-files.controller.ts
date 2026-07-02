import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';
import {
  CleanupGeneratedDocumentFilesDto,
  DeleteGeneratedDocumentFilesDto,
} from './dto/delete-generated-document-files.dto';
import { DocumentFilesService } from './document-files.service';
import {
  GeneratedDocumentAuditService,
  GENERATED_DOCUMENT_AUDIT_ACTIONS,
  GENERATED_DOCUMENT_AUDIT_RESULTS,
} from './generated-document-audit.service';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';

@ApiTags('Documents')
@Controller('documents')
export class DocumentFilesController {
  constructor(
    private readonly documentFilesService: DocumentFilesService,
    private readonly audit: GeneratedDocumentAuditService,
  ) {}

  @Get('generated/:documentId/files/:fileId/download')
  @ApiOperation({
    summary: 'Tải file DOCX/PDF đã render của biểu mẫu',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID file trong generated_document_files.',
  })
  @ApiProduces(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/octet-stream',
  )
  async downloadGeneratedFile(
    @Param('documentId') documentId: string,
    @Param('fileId') fileId: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Req() req: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const download =
      await this.documentFilesService.getGeneratedFileForDownload(
        documentId,
        fileId,
        user,
      );

    const encodedFileName = encodeURIComponent(download.fileName);

    response.set({
      'Content-Type': download.mimeType,
      'Content-Length': String(download.fileSizeBytes),
      'Content-Disposition': `attachment; filename="${download.fileName}"; filename*=UTF-8''${encodedFileName}`,
      'Cache-Control': 'no-store',
    });

    // Audit: download success after authorization confirmed.
    await this.audit.record({
      action: GENERATED_DOCUMENT_AUDIT_ACTIONS.DOWNLOADED,
      result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
      actor: this.audit.buildActor(user),
      requestMeta: this.audit.normalizeRequestMeta(req),
      agencyId: download.file.generated_document_id ? undefined : undefined,
      generatedDocumentId: download.file.generated_document_id,
      file: this.audit.buildFileContext(download.file),
      metadata: {
        fileId: fileId,
        documentId,
        mimeType: download.mimeType,
      },
    });

    return new StreamableFile(createReadStream(download.fullPath));
  }

  @Delete('generated/:documentId/files/:fileId')
  @ApiOperation({
    summary: 'Xóa một file DOCX/PDF đã xuất của biểu mẫu',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID file trong generated_document_files.',
  })
  async deleteGeneratedFile(
    @Param('documentId') documentId: string,
    @Param('fileId') fileId: string,
    @CurrentUserDecorator() user: CurrentUser,
    @Req() req: Request,
  ) {
    const result = await this.documentFilesService.deleteGeneratedFile(
      documentId,
      fileId,
      user,
      true,
    );

    // Audit: capture file metadata before deletion context is lost.
    await this.audit.record({
      action: GENERATED_DOCUMENT_AUDIT_ACTIONS.FILE_DELETED,
      result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
      actor: this.audit.buildActor(user),
      requestMeta: this.audit.normalizeRequestMeta(req),
      generatedDocumentId: BigInt(documentId),
      file: {
        fileId: BigInt(fileId),
        fileName: result.fileName,
        fileKind:
          result.fileFormat === 'DOCX'
            ? 'DOCX'
            : result.fileFormat === 'PDF'
              ? 'PDF'
              : 'OTHER',
        sizeBytes: undefined,
      },
      metadata: {
        fileId,
        documentId,
        fileFormat: result.fileFormat,
      },
    });

    return result;
  }

  @Post('generated/:documentId/files/bulk-delete')
  @ApiOperation({
    summary: 'Xóa nhiều file DOCX/PDF đã chọn của biểu mẫu',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: DeleteGeneratedDocumentFilesDto,
  })
  async bulkDeleteGeneratedFiles(
    @Param('documentId') documentId: string,
    @Body() body: DeleteGeneratedDocumentFilesDto,
    @CurrentUserDecorator() user: CurrentUser,
    @Req() req: Request,
  ) {
    const result = await this.documentFilesService.bulkDeleteGeneratedFiles(
      documentId,
      body.fileIds,
      user,
      body.deletePhysical ?? true,
    );

    // Audit: one summary event per bulk operation.
    await this.audit.record({
      action: GENERATED_DOCUMENT_AUDIT_ACTIONS.FILES_BULK_DELETED,
      result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
      actor: this.audit.buildActor(user),
      requestMeta: this.audit.normalizeRequestMeta(req),
      generatedDocumentId: BigInt(documentId),
      metadata: {
        documentId,
        deletedCount: result.deletedCount,
        fileIds: body.fileIds,
      },
    });

    return result;
  }

  @Post('generated/:documentId/files/cleanup')
  @ApiOperation({
    summary:
      'Dọn file cũ của biểu mẫu, mặc định giữ lại DOCX mới nhất và PDF mới nhất',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID biểu mẫu đã tạo.',
  })
  @ApiBody({
    type: CleanupGeneratedDocumentFilesDto,
  })
  async cleanupGeneratedFiles(
    @Param('documentId') documentId: string,
    @Body() body: CleanupGeneratedDocumentFilesDto,
    @CurrentUserDecorator() user: CurrentUser,
    @Req() req: Request,
  ) {
    const result = await this.documentFilesService.cleanupGeneratedFiles(
      documentId,
      user,
      {
        keepLatestDocx: body.keepLatestDocx ?? true,
        keepLatestPdf: body.keepLatestPdf ?? true,
        deletePhysical: body.deletePhysical ?? true,
      },
    );

    // Audit: cleanup with count and configuration.
    await this.audit.record({
      action: GENERATED_DOCUMENT_AUDIT_ACTIONS.FILES_CLEANED_UP,
      result: GENERATED_DOCUMENT_AUDIT_RESULTS.SUCCESS,
      actor: this.audit.buildActor(user),
      requestMeta: this.audit.normalizeRequestMeta(req),
      generatedDocumentId: BigInt(documentId),
      metadata: {
        documentId,
        deletedCount: result.deletedCount,
        keptCount: result.keptCount,
        keepLatestDocx: body.keepLatestDocx ?? true,
        keepLatestPdf: body.keepLatestPdf ?? true,
      },
    });

    return result;
  }
}
