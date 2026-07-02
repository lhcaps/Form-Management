import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import type { Response } from 'express';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';
import { StandaloneTemplateRenderService } from './rendering/application/standalone-template-render.service';

class RenderRuntimeTemplateDocxDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

function contentDisposition(fileName: string): string {
  return `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

@ApiTags('Runtime Forms')
@Controller('forms/runtime')
export class RuntimeTemplateRenderController {
  constructor(private readonly renderer: StandaloneTemplateRenderService) {}

  /**
   * Dedicated metadata endpoint — returns plain JSON, never a file.
   * Placed BEFORE render-docx so Nest matches the more-specific route first.
   */
  @Post(':templateCode/render-docx/metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Render bieu mau runtime va tra ve metadata (file info, warnings). Khong tra ve file.',
  })
  @ApiParam({
    name: 'templateCode',
    description: 'Ma bieu mau, vi du BM-001.',
  })
  @ApiBody({
    type: RenderRuntimeTemplateDocxDto,
  })
  async renderDocxMetadata(
    @Param('templateCode') templateCode: string,
    @Body() body: RenderRuntimeTemplateDocxDto,
  ): Promise<{
    documentId: null;
    fileId: null;
    fileName: string;
    fileSizeBytes: number;
    fileFormat: 'DOCX';
    previewUrl: null;
    downloadUrl: string;
    warnings: readonly string[];
    missingRequired: readonly unknown[];
  }> {
    const result = await this.renderer.renderDocx({
      templateCode,
      data: body?.data ?? {},
    });

    return {
      documentId: null,
      fileId: null,
      fileName: result.fileName,
      fileSizeBytes: result.buffer.length,
      fileFormat: 'DOCX',
      previewUrl: null,
      downloadUrl: `/forms/runtime/${encodeURIComponent(templateCode)}/render-docx`,
      warnings: result.warnings,
      missingRequired: result.missingRequired,
    };
  }

  /**
   * Download endpoint — always returns DOCX StreamableFile.
   */
  @Post(':templateCode/render-docx')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Render bieu mau runtime truc tiep ra file DOCX, khong bat buoc ho so.',
  })
  @ApiParam({
    name: 'templateCode',
    description: 'Ma bieu mau, vi du BM-001.',
  })
  @ApiBody({
    type: RenderRuntimeTemplateDocxDto,
  })
  async renderDocx(
    @Param('templateCode') templateCode: string,
    @Body() body: RenderRuntimeTemplateDocxDto,
    @CurrentUserDecorator() _user: CurrentUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.renderer.renderDocx({
      templateCode,
      data: body?.data ?? {},
    });

    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': contentDisposition(result.fileName),
      'X-Qllaw-Template-Code': result.templateCode,
      'X-Qllaw-Missing-Required-Count': String(result.missingRequired.length),
      'X-Qllaw-Warning-Count': String(result.warnings.length),
    });

    return new StreamableFile(result.buffer);
  }
}
