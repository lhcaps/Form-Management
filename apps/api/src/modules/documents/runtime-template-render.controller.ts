import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import type { Response } from 'express';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';
import { StandaloneTemplateRenderService } from './rendering/application/standalone-template-render.service';

class RenderRuntimeTemplateDocxDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  mode?: string;
}

function contentDisposition(fileName: string): string {
  return `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

@ApiTags('Runtime Forms')
@Controller('forms/runtime')
export class RuntimeTemplateRenderController {
  constructor(private readonly renderer: StandaloneTemplateRenderService) {}

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
  @ApiQuery({
    name: 'mode',
    required: false,
    description: 'Set to "metadata" to return JSON instead of file blob.',
  })
  async renderDocx(
    @Param('templateCode') templateCode: string,
    @Body() body: RenderRuntimeTemplateDocxDto,
    @CurrentUserDecorator() _user: CurrentUser,
    @Query('mode') queryMode: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.renderer.renderDocx({
      templateCode,
      data: body?.data ?? {},
    });

    // Metadata mode: return JSON with file info instead of the file blob
    // Check both body.mode and query mode for flexibility
    const isMetadataMode = body?.mode === 'metadata' || queryMode === 'metadata';
    if (isMetadataMode) {
      response.set({
        'Content-Type': 'application/json',
        'X-Qllaw-Template-Code': result.templateCode,
        'X-Qllaw-Missing-Required-Count': String(result.missingRequired.length),
        'X-Qllaw-Warning-Count': String(result.warnings.length),
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
