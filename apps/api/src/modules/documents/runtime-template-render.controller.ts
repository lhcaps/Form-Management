import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';
import type { Response } from 'express';
import * as fs from 'node:fs';
import { CurrentUser as CurrentUserDecorator } from '../auth/current-user.decorator';
import type { CurrentUser } from '../auth/current-user.type';
import { RuntimePreviewSessionService } from './runtime-preview-session.service';
import { StandaloneTemplateRenderService } from './rendering/application/standalone-template-render.service';

class RenderRuntimeTemplateDocxDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

class CreatePreviewSessionDto {
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
  constructor(
    private readonly renderer: StandaloneTemplateRenderService,
    private readonly previewSessionService: RuntimePreviewSessionService,
  ) {}

  /**
   * Create a runtime preview session.
   * Returns JSON metadata about the session including download URLs.
   * Does NOT auto-download. Does NOT create DB rows.
   */
  @Post(':templateCode/preview-session')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Tao mot runtime preview session. Tra ve metadata JSON voi URL tai DOCX.',
  })
  @ApiParam({
    name: 'templateCode',
    description: 'Ma bieu mau, vi du BM-001.',
  })
  @ApiBody({
    type: CreatePreviewSessionDto,
  })
  async createPreviewSession(
    @Param('templateCode') templateCode: string,
    @Body() body: CreatePreviewSessionDto,
  ) {
    return this.previewSessionService.createPreviewSession({
      templateCode,
      data: body?.data ?? {},
    });
  }

  /**
   * Download DOCX from a runtime preview session.
   * Returns binary DOCX / StreamableFile.
   */
  @Get('preview-sessions/:sessionId/docx')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tai DOCX tu runtime preview session.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID dang runtime_preview_<uuid>.',
  })
  async downloadPreviewSessionDocx(
    @Param('sessionId') sessionId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    let docxPath: string;
    let fileName: string;

    try {
      docxPath = await this.previewSessionService.getSessionDocxPath(sessionId);
      const session = await this.previewSessionService.getSession(sessionId);
      fileName = session.fileName;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new NotFoundException('Preview session not found or expired.');
    }

    const buffer = fs.readFileSync(docxPath);

    response.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': contentDisposition(fileName),
      'X-Qllaw-Preview-Session': sessionId,
    });

    return new StreamableFile(buffer);
  }

  /**
   * Download PDF from a runtime preview session (optional).
   * Returns PDF if available, otherwise a graceful error.
   */
  @Get('preview-sessions/:sessionId/pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tai PDF tu runtime preview session (neu co).',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Session ID dang runtime_preview_<uuid>.',
  })
  async getPreviewSessionPdf(
    @Param('sessionId') sessionId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const { pdfPath, available } =
        await this.previewSessionService.getSessionPdfPath(sessionId);

      if (!available) {
        throw new NotFoundException(
          'PDF chua san sang cho preview session nay. Vui long tai DOCX thay the.',
        );
      }

      const buffer = fs.readFileSync(pdfPath);
      const session = await this.previewSessionService.getSession(sessionId);
      const pdfFileName = session.fileName.replace(/\.docx$/i, '.pdf');

      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${pdfFileName}"`,
      });

      return new StreamableFile(buffer);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new NotFoundException(
        'PDF khong san sang cho preview session nay. Vui long tai DOCX thay the.',
      );
    }
  }

  /**
   * Download endpoint — always returns DOCX StreamableFile.
   * Pure binary download, no JSON mode, no query params.
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
