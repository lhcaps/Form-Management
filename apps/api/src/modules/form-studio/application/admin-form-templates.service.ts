import { Injectable } from '@nestjs/common';
import { createEmptyContract } from '@qllaw/form-contracts';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { WorkspacePathsService } from '../../../infrastructure/paths/workspace-paths.service';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CurrentUser } from '../../auth/current-user.type';
import { TemplateNormalizerService } from '../../templates/template-normalizer.service';
import PizZip from 'pizzip';
import { AuthoringContractService } from './authoring-contract.service';
import { FormStudioError } from '../domain/form-studio.error';
import { FormStudioService } from './form-studio.service';

function normalizeAgencyCode(value: string | null): string {
  const normalized = (value ?? 'AGENCY')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 20);
  return normalized || 'AGENCY';
}

@Injectable()
export class AdminFormTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studio: FormStudioService,
    private readonly authoring: AuthoringContractService,
    private readonly paths: WorkspacePathsService,
    private readonly normalizer: TemplateNormalizerService,
  ) {}

  async list(user: CurrentUser, query?: string) {
    const templates = await this.prisma.templates.findMany({
      where: query?.trim()
        ? {
            OR: [
              { template_code: { contains: query.trim() } },
              { template_name: { contains: query.trim() } },
            ],
          }
        : undefined,
      include: {
        form_contract_versions: {
          where: user.agencyId
            ? {
                OR: [{ agency_id: BigInt(user.agencyId) }, { agency_id: null }],
              }
            : { agency_id: null },
          orderBy: [{ updated_at: 'desc' }, { version_no: 'desc' }],
          take: 5,
        },
      },
      orderBy: [{ template_code: 'asc' }],
    });

    return templates.map((template) => ({
      id: String(template.id),
      templateCode: template.template_code,
      title: template.template_name,
      description: template.description,
      originalExt: template.original_ext,
      isActive: template.is_active,
      versions: template.form_contract_versions.map((version) => ({
        id: String(version.id),
        agencyId: version.agency_id ? String(version.agency_id) : null,
        version: version.version_no,
        revision: version.revision,
        status: version.status,
        contractHash: version.contract_hash,
        updatedAt: version.updated_at,
      })),
    }));
  }

  async createBlank(
    user: CurrentUser,
    input: { title: string; description?: string },
  ) {
    if (!user.agencyId) {
      throw new FormStudioError(
        'AGENCY_REQUIRED',
        'Tài khoản cần thuộc một cơ quan để tạo biểu mẫu tùy chỉnh.',
        422,
      );
    }
    const code = await this.allocateCustomCode(user.agencyCode);
    const template = await this.prisma.templates.create({
      data: {
        template_code: code,
        template_name: input.title.trim(),
        description: input.description?.trim() || null,
        source_file_name: null,
        original_ext: null,
        render_scope: 'CASE_LEVEL',
        output_strategy: 'ONE_FILE_PER_CASE',
        default_output_formats: ['docx'],
        requires_review: true,
        created_by_official_id: BigInt(user.id),
      },
    });
    await this.prisma.template_versions.create({
      data: {
        template_id: template.id,
        version_no: 1,
        is_default: true,
        is_active: true,
        created_by_name: user.fullName,
        created_by_official_id: BigInt(user.id),
        placeholder_summary: { status: 'DOCX_REQUIRED' },
      },
    });
    const contract = createEmptyContract({
      templateCode: code,
      title: input.title.trim(),
      agencyId: user.agencyId,
      templateHash: `pending-${code}`,
    });
    return this.studio.createDraft({
      templateId: String(template.id),
      agencyId: user.agencyId,
      actorId: user.id,
      contract,
    });
  }

  async openDesign(user: CurrentUser, templateId: string) {
    let parsedTemplateId: bigint;
    try {
      parsedTemplateId = BigInt(templateId);
    } catch {
      throw new FormStudioError(
        'FORM_TEMPLATE_NOT_FOUND',
        'Không tìm thấy biểu mẫu để mở thiết kế.',
        404,
      );
    }
    const template = await this.prisma.templates.findUnique({
      where: { id: parsedTemplateId },
    });
    if (!template) {
      throw new FormStudioError(
        'FORM_TEMPLATE_NOT_FOUND',
        'Không tìm thấy biểu mẫu nguồn.',
        404,
      );
    }
    return this.authoring.openDesign(
      template.template_code,
      user.agencyId,
      user.id,
    );
  }

  async importFile(
    user: CurrentUser,
    input: { title: string; description?: string },
    file: Express.Multer.File,
  ) {
    if (!user.agencyId) {
      throw new FormStudioError(
        'AGENCY_REQUIRED',
        'Tài khoản cần thuộc một cơ quan để import biểu mẫu.',
        422,
      );
    }
    this.assertSupportedOfficeFile(file);
    const extension = file.originalname.toLowerCase().endsWith('.docx')
      ? '.docx'
      : '.doc';
    const code = await this.allocateCustomCode(user.agencyCode);
    const uploadDirectory = join(
      this.paths.storageRoot,
      'templates',
      'uploads',
      code,
    );
    mkdirSync(uploadDirectory, { recursive: true });
    const originalPath = join(uploadDirectory, `${randomUUID()}${extension}`);
    writeFileSync(originalPath, file.buffer);
    const normalizedPath = join(
      this.paths.normalizedTemplatesRoot,
      code,
      `${code}_normalized.docx`,
    );
    const checksum = createHash('sha256').update(file.buffer).digest('hex');
    const template = await this.prisma.templates.create({
      data: {
        template_code: code,
        template_name: input.title.trim(),
        description: input.description?.trim() || null,
        source_file_name: file.originalname,
        original_ext: extension.slice(1),
        render_scope: 'CASE_LEVEL',
        output_strategy: 'ONE_FILE_PER_CASE',
        default_output_formats: ['docx'],
        requires_review: true,
        created_by_official_id: BigInt(user.id),
      },
    });
    const version = await this.prisma.template_versions.create({
      data: {
        template_id: template.id,
        version_no: 1,
        original_file_path: this.workspaceRelative(originalPath),
        normalized_docx_path: this.workspaceRelative(normalizedPath),
        checksum,
        is_default: true,
        is_active: true,
        created_by_name: user.fullName,
        created_by_official_id: BigInt(user.id),
        placeholder_summary: { status: 'CONVERSION_PENDING' },
      },
    });

    let conversionStatus = 'NORMALIZED_DOCX_READY';
    let templateHash = checksum;
    let readyNormalizedPath: string | undefined;
    try {
      const result = await this.normalizer.normalizeVersion(String(version.id));
      templateHash = result.checksum;
      readyNormalizedPath = result.normalizedDocxPath;
    } catch (error) {
      conversionStatus = 'CONVERSION_BLOCKED';
      if (extension === '.docx') throw error;
    }

    const contract = createEmptyContract({
      templateCode: code,
      title: input.title.trim(),
      agencyId: user.agencyId,
      templateHash,
      normalizedDocxPath: readyNormalizedPath,
    });
    const draft = await this.studio.createDraft({
      templateId: String(template.id),
      agencyId: user.agencyId,
      actorId: user.id,
      contract,
    });
    return { draft, conversionStatus };
  }

  private async allocateCustomCode(agencyCode: string | null): Promise<string> {
    const prefix = `CUS-${normalizeAgencyCode(agencyCode)}-`;
    const rows = await this.prisma.templates.findMany({
      where: { template_code: { startsWith: prefix } },
      select: { template_code: true },
    });
    const highest = rows.reduce((max, row) => {
      const value = Number(row.template_code.slice(prefix.length));
      return Number.isInteger(value) ? Math.max(max, value) : max;
    }, 0);
    return `${prefix}${String(highest + 1).padStart(4, '0')}`;
  }

  private workspaceRelative(value: string): string {
    return relative(this.paths.repoRoot, value).replace(/\\/g, '/');
  }

  private assertSupportedOfficeFile(file: Express.Multer.File): void {
    const name = file.originalname.toLowerCase();
    const isDocx = name.endsWith('.docx');
    const isDoc = name.endsWith('.doc');
    const zipMagic =
      file.buffer[0] === 0x50 &&
      file.buffer[1] === 0x4b &&
      file.buffer[2] === 0x03 &&
      file.buffer[3] === 0x04;
    const oleMagic = Buffer.from([
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
    ]);
    const isOle = file.buffer.subarray(0, 8).equals(oleMagic);
    if ((!isDocx || !zipMagic) && (!isDoc || !isOle)) {
      throw new FormStudioError(
        'UNSUPPORTED_TEMPLATE_UPLOAD',
        'Chỉ chấp nhận file DOC hoặc DOCX hợp lệ.',
        422,
      );
    }
    if (isDocx) this.assertSafeDocxPackage(file.buffer);
  }

  private assertSafeDocxPackage(buffer: Buffer): void {
    let zip: PizZip;
    try {
      zip = new PizZip(buffer);
    } catch {
      throw new FormStudioError(
        'INVALID_DOCX_PACKAGE',
        'Không đọc được cấu trúc DOCX.',
        422,
      );
    }
    const entries = Object.values(zip.files).filter((entry) => !entry.dir);
    if (entries.length > 5000) {
      throw new FormStudioError(
        'DOCX_ZIP_BOMB_BLOCKED',
        'DOCX có quá nhiều package parts.',
        422,
      );
    }
    let totalUncompressedBytes = 0;
    for (const entry of entries) {
      const name = entry.name.replace(/\\/g, '/');
      if (
        name.startsWith('/') ||
        name.split('/').some((segment) => segment === '..')
      ) {
        throw new FormStudioError(
          'DOCX_PATH_TRAVERSAL_BLOCKED',
          'DOCX chứa package path không an toàn.',
          422,
        );
      }
      const metadata = entry as unknown as {
        _data?: { uncompressedSize?: number };
      };
      totalUncompressedBytes += metadata._data?.uncompressedSize ?? 0;
      if (totalUncompressedBytes > 100 * 1024 * 1024) {
        throw new FormStudioError(
          'DOCX_ZIP_BOMB_BLOCKED',
          'DOCX vượt giới hạn dữ liệu giải nén 100 MB.',
          422,
        );
      }
    }
    if (!zip.file('[Content_Types].xml') || !zip.file('word/document.xml')) {
      throw new FormStudioError(
        'INVALID_DOCX_PACKAGE',
        'File không có cấu trúc tài liệu Word hợp lệ.',
        422,
      );
    }
  }
}
