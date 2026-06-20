import { Injectable } from '@nestjs/common';
import { buildRenderPayload, compileContract } from '@qllaw/form-contracts';
import { Prisma } from '@prisma/client';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { WorkspacePathsService } from '../../../infrastructure/paths/workspace-paths.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { renderDocxTemplate } from '../../documents/rendering/infrastructure/docx-template-renderer';
import { FormStudioError } from '../domain/form-studio.error';
import { FormStudioService } from './form-studio.service';

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function flatten(
  value: Record<string, unknown>,
  prefix = '',
  output = new Map<string, unknown>(),
): Map<string, unknown> {
  for (const [key, nested] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (
      nested &&
      typeof nested === 'object' &&
      !Array.isArray(nested) &&
      !(nested instanceof Date)
    ) {
      flatten(nested as Record<string, unknown>, path, output);
    } else {
      output.set(path, nested);
    }
  }
  return output;
}

function isWithin(root: string, candidate: string): boolean {
  const pathFromRoot = relative(resolve(root), resolve(candidate));
  return (
    pathFromRoot === '' ||
    (!pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot))
  );
}

@Injectable()
export class FormPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studio: FormStudioService,
    private readonly paths: WorkspacePathsService,
  ) {}

  async createAndRun(
    draftId: string,
    actorId: string,
    sampleData: Record<string, unknown> = {},
  ) {
    const draft = await this.studio.get(draftId);
    const job = await this.prisma.form_preview_jobs.create({
      data: {
        contract_version_id: BigInt(draft.id),
        requested_by_official_id: BigInt(actorId),
        status: 'PENDING',
        sample_data_json: toJson(sampleData),
      },
    });

    await this.prisma.form_preview_jobs.update({
      where: { id: job.id },
      data: { status: 'RUNNING', started_at: new Date() },
    });

    try {
      const compiled = compileContract(draft.contract);
      if (!compiled.ok || !compiled.artifact) {
        throw new FormStudioError(
          'CONTRACT_VALIDATION_FAILED',
          'Contract chưa hợp lệ để render preview.',
          422,
          compiled.issues,
        );
      }
      const templatePath = this.resolveTemplatePath(
        draft.contract.normalizedDocxPath,
      );
      if (!templatePath || !existsSync(templatePath)) {
        throw new FormStudioError(
          'CONVERSION_BLOCKED',
          'Chưa có DOCX chuẩn hóa để render preview.',
          422,
        );
      }
      const payload = buildRenderPayload(draft.contract, sampleData);
      const rendered = renderDocxTemplate(
        readFileSync(templatePath),
        flatten(payload),
      );
      const outputPath = join(
        this.paths.storageRoot,
        'form-preview',
        String(job.id),
        'preview.docx',
      );
      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, rendered);
      const storedPath = relative(this.paths.repoRoot, outputPath).replace(
        /\\/g,
        '/',
      );
      const completed = await this.prisma.form_preview_jobs.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          artifact_path: storedPath,
          finished_at: new Date(),
          error_code: null,
          error_json: Prisma.JsonNull,
        },
      });
      return this.toResponse(completed);
    } catch (error) {
      const code =
        error instanceof FormStudioError ? error.code : 'PREVIEW_RENDER_FAILED';
      const message = error instanceof Error ? error.message : String(error);
      const failed = await this.prisma.form_preview_jobs.update({
        where: { id: job.id },
        data: {
          status: code === 'CONVERSION_BLOCKED' ? 'BLOCKED' : 'FAILED',
          error_code: code,
          error_json: toJson({ message }),
          finished_at: new Date(),
        },
      });
      return this.toResponse(failed);
    }
  }

  async get(jobId: string) {
    const job = await this.prisma.form_preview_jobs.findUnique({
      where: { id: BigInt(jobId) },
    });
    if (!job) {
      throw new FormStudioError(
        'PREVIEW_JOB_NOT_FOUND',
        'Không tìm thấy preview job.',
        404,
      );
    }
    return this.toResponse(job);
  }

  async getArtifactAbsolutePath(jobId: string): Promise<string> {
    const job = await this.prisma.form_preview_jobs.findUnique({
      where: { id: BigInt(jobId) },
      select: { status: true, artifact_path: true },
    });
    if (!job?.artifact_path || job.status !== 'COMPLETED') {
      throw new FormStudioError(
        'PREVIEW_ARTIFACT_NOT_READY',
        'Preview artifact chưa sẵn sàng.',
        404,
      );
    }
    const absolute = resolve(this.paths.repoRoot, job.artifact_path);
    const previewRoot = resolve(this.paths.storageRoot, 'form-preview');
    if (!isWithin(previewRoot, absolute)) {
      throw new FormStudioError(
        'UNSAFE_PREVIEW_PATH',
        'Preview artifact path không hợp lệ.',
        500,
      );
    }
    return absolute;
  }

  private resolveTemplatePath(value: string | undefined): string | null {
    if (!value) return null;
    const candidate = isAbsolute(value)
      ? resolve(value)
      : resolve(this.paths.repoRoot, value);
    if (
      !isWithin(this.paths.repoRoot, candidate) &&
      !isWithin(this.paths.storageRoot, candidate)
    ) {
      throw new FormStudioError(
        'UNSAFE_TEMPLATE_PATH',
        'Đường dẫn DOCX nằm ngoài workspace.',
        422,
      );
    }
    return candidate;
  }

  private toResponse(job: {
    id: bigint;
    contract_version_id: bigint;
    status: string;
    artifact_path: string | null;
    error_code: string | null;
    error_json: unknown;
    created_at: Date;
    finished_at: Date | null;
  }) {
    return {
      id: String(job.id),
      draftId: String(job.contract_version_id),
      status: job.status,
      artifactPath: job.artifact_path,
      errorCode: job.error_code,
      error: job.error_json,
      createdAt: job.created_at,
      finishedAt: job.finished_at,
    };
  }
}
