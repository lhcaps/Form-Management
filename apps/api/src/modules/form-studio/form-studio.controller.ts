import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { RequireFormPermissions } from '../auth/form-permission.decorator';
import { AdminFormTemplatesService } from './application/admin-form-templates.service';
import { FormPreviewService } from './application/form-preview.service';
import { FormStudioService } from './application/form-studio.service';
import { RuntimeFormContractService } from './application/runtime-form-contract.service';
import { FormReviewQueryService } from './application/form-review-query.service';
import {
  CreateBlankFormTemplateDto,
  FormReviewCommentDto,
  PatchFormDraftDto,
  PreviewFormDraftDto,
} from './dto/form-studio.dto';
import { draftOperationsSchema } from './domain/draft-operation.schema';
import type { DraftOperation } from './domain/draft-operation';

@ApiTags('Admin Form Studio')
@Controller('admin/form-templates')
@RequireFormPermissions('FORM_TEMPLATE_EDIT')
export class AdminFormTemplatesController {
  constructor(private readonly templates: AdminFormTemplatesService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserType, @Query('q') query?: string) {
    return this.templates.list(user, query);
  }

  @Post()
  createBlank(
    @CurrentUser() user: CurrentUserType,
    @Body() body: CreateBlankFormTemplateDto,
  ) {
    return this.templates.createBlank(user, body);
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024, files: 1 },
    }),
  )
  import(
    @CurrentUser() user: CurrentUserType,
    @Body() body: CreateBlankFormTemplateDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Thiếu file DOC/DOCX.');
    return this.templates.importFile(user, body, file);
  }

  @Post(':id/clone')
  clone(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.templates.clone(user, id);
  }
}

@ApiTags('Admin Form Studio')
@Controller('admin/form-drafts')
@RequireFormPermissions('FORM_TEMPLATE_EDIT')
export class AdminFormDraftsController {
  constructor(
    private readonly studio: FormStudioService,
    private readonly previews: FormPreviewService,
  ) {}

  @Get(':draftId')
  get(@Param('draftId') draftId: string) {
    return this.studio.get(draftId);
  }

  @Patch(':draftId')
  patch(
    @Param('draftId') draftId: string,
    @Body() body: PatchFormDraftDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const parsed = draftOperationsSchema.safeParse(body.operations);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Draft operations không hợp lệ.',
        issues: parsed.error.issues,
      });
    }
    return this.studio.patchDraft(
      draftId,
      {
        expectedRevision: body.expectedRevision,
        operations: parsed.data as DraftOperation[],
      },
      user.id,
    );
  }

  @Delete(':draftId')
  async delete(@Param('draftId') draftId: string) {
    await this.studio.deleteDraft(draftId);
    return { ok: true };
  }

  @Post(':draftId/validate')
  validate(@Param('draftId') draftId: string) {
    return this.studio.validate(draftId);
  }

  @Post(':draftId/preview')
  preview(
    @Param('draftId') draftId: string,
    @Body() body: PreviewFormDraftDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.previews.createAndRun(draftId, user.id, body.sampleData ?? {});
  }

  @Post(':draftId/submit-review')
  submitReview(
    @Param('draftId') draftId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.studio.submitReview(draftId, user.id);
  }
}

@ApiTags('Admin Form Studio')
@Controller('admin/form-reviews')
@RequireFormPermissions('FORM_TEMPLATE_APPROVE')
export class AdminFormReviewsController {
  constructor(
    private readonly studio: FormStudioService,
    private readonly reviewQuery: FormReviewQueryService,
  ) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.reviewQuery.get(id);
  }

  @Post(':id/request-changes')
  requestChanges(
    @Param('id') id: string,
    @Body() body: FormReviewCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.studio.requestChanges(
      id,
      user.id,
      body.comment?.trim() || 'Yêu cầu chỉnh sửa.',
    );
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: FormReviewCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.studio.approve(id, user.id, body.comment?.trim() || null);
  }
}

@ApiTags('Admin Form Studio')
@Controller('admin/form-versions')
@RequireFormPermissions('FORM_TEMPLATE_APPROVE')
export class AdminFormVersionsController {
  constructor(private readonly studio: FormStudioService) {}

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.studio.publish(id, user.id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: CurrentUserType) {
    return this.studio.archive(id, user.id);
  }
}

@ApiTags('Form Preview')
@Controller('admin/form-preview-jobs')
@RequireFormPermissions('FORM_TEMPLATE_EDIT')
export class FormPreviewJobsController {
  constructor(private readonly previews: FormPreviewService) {}

  @Get(':jobId')
  get(@Param('jobId') jobId: string) {
    return this.previews.get(jobId);
  }

  @Get(':jobId/file')
  async file(@Param('jobId') jobId: string, @Res() response: Response) {
    const file = await this.previews.getArtifactAbsolutePath(jobId);
    return response.download(file, `form-preview-${jobId}.docx`);
  }
}

@ApiTags('Runtime Forms')
@Controller('forms/runtime')
export class RuntimeFormContractController {
  constructor(private readonly runtime: RuntimeFormContractService) {}

  @Get(':templateCode')
  get(
    @Param('templateCode') templateCode: string,
    @CurrentUser() user: CurrentUserType,
    @Query('contractHash') contractHash?: string,
  ) {
    return this.runtime.resolve(templateCode, user.agencyId, contractHash);
  }
}
