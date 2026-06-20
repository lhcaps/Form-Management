import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  adaptV1Contract,
  compileContract,
  createEmptyContract,
  type CompiledFormContract,
  type FormContractV2,
} from '@qllaw/form-contracts';
import { PrismaService } from '../../../prisma/prisma.service';
import { FormContractRepository } from '../../forms-contracts/application/form-contract.repository';
import { FormStudioError } from '../domain/form-studio.error';
import type {
  AuthoringBaseline,
  AuthoringWarning,
  MaterializedDraft,
  QualityGrade,
  SourceProvenance,
} from '../domain/authoring-contract.types';

const SPARSE_EXTRACTION_FIELD_THRESHOLD = 5;

@Injectable()
export class AuthoringContractService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileContracts: FormContractRepository,
  ) {}

  /**
   * Resolve the authoring baseline for a template without writing to the DB.
   *
   * Resolution chain:
   *  1. Agency editable draft (DRAFT / CHANGES_REQUESTED)
   *  2. Agency read-only version (IN_REVIEW / APPROVED)
   *  3. Agency published version (to create next version from)
   *  4. Global published V2
   *  5. Locked V1 file contract
   *  6. Draft V1 file contract
   *  7. Virtual baseline from normalized DOCX (GENERIC_FALLBACK)
   *
   * Returns null if there is no authoring base at all (no V1, no DOCX).
   */
  async resolveBaseline(
    templateCode: string,
    agencyId: string | null,
  ): Promise<AuthoringBaseline | null> {
    const template = await this.loadTemplate(templateCode);
    if (!template) return null;

    const [editable, readOnly, published] = await Promise.all([
      this.findAgencyDraft(template.id, agencyId),
      this.findAgencyReadOnly(template.id, agencyId),
      this.findAgencyPublished(template.id, agencyId),
    ]);

    if (editable)
      return this.fromDbRecord(editable, agencyId, 'EDIT', String(editable.id));
    if (readOnly)
      return this.fromDbRecord(readOnly, agencyId, 'READ_ONLY', null);
    if (published)
      return this.fromDbRecord(published, agencyId, 'CREATE_VERSION', null);

    const globalPublished = await this.findGlobalPublished(template.id);
    if (globalPublished) {
      return this.fromDbRecord(globalPublished, null, 'CREATE_VERSION', null);
    }

    const v1 = await this.fileContracts.findByIdentifier(templateCode);
    if (v1) {
      if (v1.status === 'locked') {
        return this.fromV1File(v1, template, 'LOCKED_V1', 'LOCKED_VERIFIED');
      }
      const grade = this.computeQualityGrade(v1);
      return this.fromV1File(v1, template, 'DRAFT_V1', grade);
    }

    return this.virtualBaselineFromDocx(template);
  }

  /**
   * Open (or materialize) a design session for a template.
   *
   * If an editable agency draft already exists, return it (idempotent).
   * Otherwise, materialize the virtual baseline into a DB record.
   */
  async openDesign(
    templateCode: string,
    agencyId: string | null,
    actorId: string,
  ): Promise<MaterializedDraft> {
    const template = await this.prisma.templates.findUnique({
      where: { template_code: templateCode },
    });
    if (!template) {
      throw new FormStudioError(
        'FORM_TEMPLATE_NOT_FOUND',
        `Không tìm thấy biểu mẫu "${templateCode}".`,
        404,
      );
    }

    const existing = await this.findAgencyEditable(template.id, agencyId);
    if (existing) {
      const baseline = await this.fromDbRecord(
        existing,
        agencyId,
        'EDIT',
        String(existing.id),
      );
      return { draftId: String(existing.id), baseline };
    }

    const baseline = await this.resolveBaseline(templateCode, agencyId);
    if (!baseline) {
      throw new FormStudioError(
        'AUTHORING_BASE_NOT_FOUND',
        `Không tìm thấy authoring base cho "${templateCode}". Cần có normalized DOCX hoặc V1 contract.`,
        422,
      );
    }

    if (baseline.mode === 'READ_ONLY') {
      if (!baseline.existingDraftId) {
        throw new FormStudioError(
          'AUTHORING_VERSION_NOT_FOUND',
          'Không tìm thấy phiên bản cấu hình để mở.',
          404,
        );
      }
      return {
        draftId: baseline.existingDraftId,
        baseline,
      };
    }

    if (!baseline.normalizedDocxPath) {
      throw new FormStudioError(
        'NORMALIZED_DOCX_REQUIRED',
        `Biểu mẫu "${templateCode}" cần normalized DOCX trước khi mở thiết kế.`,
        422,
      );
    }

    const nextVer = await this.nextVersion(template.id, agencyId);
    const contract: FormContractV2 = {
      ...structuredClone(baseline.baselineContract),
      agencyId,
      version: nextVer,
      status: 'DRAFT',
      baseContractHash: baseline.compiledBaseline?.contractHash ?? null,
      contractHash: '',
    };

    let materialized;
    try {
      materialized = await this.createDraftRecord(
        template.id,
        actorId,
        contract,
        nextVer,
      );
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) throw error;

      const winner = await this.findAgencyEditable(template.id, agencyId);
      if (!winner) {
        throw new FormStudioError(
          'AUTHORING_MATERIALIZATION_CONFLICT',
          'Có yêu cầu mở thiết kế đồng thời nhưng không tìm thấy draft thắng cuộc.',
          409,
          error,
        );
      }
      const winnerBaseline = await this.fromDbRecord(
        winner,
        agencyId,
        'EDIT',
        String(winner.id),
      );
      return {
        draftId: String(winner.id),
        baseline: winnerBaseline,
      };
    }
    return {
      draftId: String(materialized.id),
      baseline: {
        ...baseline,
        mode: 'EDIT' as const,
        existingDraftId: String(materialized.id),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // DB record creation
  // ---------------------------------------------------------------------------

  private async createDraftRecord(
    templateId: bigint,
    actorId: string,
    contract: FormContractV2,
    version: number,
  ) {
    return this.prisma.form_contract_versions.create({
      data: {
        template_id: templateId,
        agency_id: contract.agencyId ? BigInt(contract.agencyId) : null,
        scope_key: contract.agencyId ? `AGENCY:${contract.agencyId}` : 'GLOBAL',
        version_no: version,
        status: 'DRAFT',
        revision: 0,
        base_contract_hash: contract.baseContractHash,
        contract_hash: contract.contractHash || null,
        template_hash: contract.templateHash,
        normalized_docx_path: contract.normalizedDocxPath ?? null,
        draft_json: JSON.parse(
          JSON.stringify(contract),
        ) as Prisma.InputJsonValue,
        compiled_json: Prisma.JsonNull,
        created_by_official_id: BigInt(actorId),
        approved_by_official_id: null,
        published_by_official_id: null,
        submitted_at: null,
        approved_at: null,
        published_at: null,
        archived_at: null,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // DB lookups
  // ---------------------------------------------------------------------------

  private async loadTemplate(templateCode: string) {
    const template = await this.prisma.templates.findUnique({
      where: { template_code: templateCode },
      include: {
        template_versions: {
          where: { is_active: true },
          orderBy: [{ is_default: 'desc' }, { version_no: 'desc' }],
          take: 1,
        },
      },
    });
    if (!template) return null;
    return {
      id: template.id,
      templateCode: template.template_code,
      templateName: template.template_name,
      docxPath: template.template_versions[0]?.normalized_docx_path ?? null,
      docxChecksum: template.template_versions[0]?.checksum ?? null,
    };
  }

  private async findAgencyEditable(
    templateId: bigint,
    agencyId: string | null,
  ) {
    return this.prisma.form_contract_versions.findFirst({
      where: {
        template_id: templateId,
        agency_id: agencyId ? BigInt(agencyId) : null,
        status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  private async findAgencyDraft(templateId: bigint, agencyId: string | null) {
    return this.prisma.form_contract_versions.findFirst({
      where: {
        template_id: templateId,
        agency_id: agencyId ? BigInt(agencyId) : null,
        status: { in: ['DRAFT', 'CHANGES_REQUESTED'] },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  private async findAgencyReadOnly(
    templateId: bigint,
    agencyId: string | null,
  ) {
    return this.prisma.form_contract_versions.findFirst({
      where: {
        template_id: templateId,
        agency_id: agencyId ? BigInt(agencyId) : null,
        status: { in: ['IN_REVIEW', 'APPROVED'] },
      },
      orderBy: { updated_at: 'desc' },
    });
  }

  private async findAgencyPublished(
    templateId: bigint,
    agencyId: string | null,
  ) {
    return this.prisma.form_contract_versions.findFirst({
      where: {
        template_id: templateId,
        agency_id: agencyId ? BigInt(agencyId) : null,
        status: 'PUBLISHED',
      },
      orderBy: { published_at: 'desc' },
    });
  }

  private async findGlobalPublished(templateId: bigint) {
    return this.prisma.form_contract_versions.findFirst({
      where: {
        template_id: templateId,
        agency_id: null,
        status: 'PUBLISHED',
      },
      orderBy: { published_at: 'desc' },
    });
  }

  private async nextVersion(
    templateId: bigint,
    agencyId: string | null,
  ): Promise<number> {
    const latest = await this.prisma.form_contract_versions.findFirst({
      where: {
        template_id: templateId,
        agency_id: agencyId ? BigInt(agencyId) : null,
      },
      select: { version_no: true },
      orderBy: { version_no: 'desc' },
    });
    return (latest?.version_no ?? 0) + 1;
  }

  // ---------------------------------------------------------------------------
  // Baseline builders
  // ---------------------------------------------------------------------------

  private async fromDbRecord(
    row: {
      id: bigint;
      template_id: bigint;
      version_no: number;
      status: string;
      contract_hash: string | null;
      template_hash: string;
      normalized_docx_path: string | null;
      draft_json: unknown;
      compiled_json: unknown;
    },
    agencyId: string | null,
    mode: 'EDIT' | 'READ_ONLY' | 'CREATE_VERSION',
    existingDraftId: string | null,
  ): Promise<AuthoringBaseline> {
    const draft = row.draft_json as {
      templateCode: string;
      title: string;
      templateHash: string;
      sections: unknown[];
      fields: unknown[];
      renderBindings: unknown[];
    };
    const compiled = row.compiled_json as CompiledFormContract | null;
    const fileBase =
      row.status === 'PUBLISHED' || row.status === 'ARCHIVED'
        ? null
        : await this.fileContracts.findByIdentifier(draft.templateCode);
    const warnings = fileBase
      ? [
          ...this.buildWarnings(fileBase.canonicalFields, fileBase.docxSlots),
          ...this.buildSparseWarnings(fileBase.canonicalFields.length),
        ]
      : [];
    const unresolved = warnings
      .filter((warning) => warning.code === 'UNRESOLVED_FIELD')
      .reduce((total, warning) => total + (warning.fieldCount ?? 0), 0);
    const grade: QualityGrade = fileBase
      ? this.computeQualityGrade(fileBase)
      : this.computeGradeFromStatus(row.status);

    return {
      templateCode: draft.templateCode,
      title: draft.title,
      templateId: String(row.template_id),
      normalizedDocxPath: row.normalized_docx_path ?? null,
      templateHash: row.template_hash || draft.templateHash,
      baselineContract: row.draft_json as FormContractV2,
      compiledBaseline: compiled,
      provenance: {
        source:
          row.status === 'PUBLISHED'
            ? agencyId
              ? 'AGENCY_PUBLISHED'
              : 'GLOBAL_PUBLISHED'
            : 'AGENCY_DRAFT',
        sourceId: fileBase?.sourceId ?? String(row.id),
        v1Status: fileBase?.status ?? null,
        extractionHash: fileBase?.extractionSource?.sha256 ?? null,
      },
      quality: {
        grade,
        fieldCount: draft.fields.length,
        bindingCount: draft.renderBindings.length,
        unresolvedCount: Math.max(0, unresolved),
        warnings,
      },
      mode,
      existingDraftId: existingDraftId ?? String(row.id),
    };
  }

  private async fromV1File(
    v1: {
      sourceId: string;
      templateCode: string;
      title: string;
      status: string;
      docxSlots: unknown[];
      canonicalFields: unknown[];
      renderBindings: unknown[];
      extractionSource?: { sha256?: string; relativePath?: string };
    },
    template: {
      id: bigint;
      templateName: string;
      docxPath: string | null;
      docxChecksum: string | null;
    },
    source: SourceProvenance['source'],
    grade: QualityGrade,
  ): Promise<AuthoringBaseline> {
    const adapted = adaptV1Contract(
      {
        schemaVersion: '1.0',
        sourceId: v1.sourceId,
        templateCode: v1.templateCode,
        templateTitle: v1.title,
        documentKind: 'form',
        status: v1.status as 'locked' | 'draft',
        extractionSource: v1.extractionSource,
        docxSlots: v1.docxSlots as Parameters<
          typeof adaptV1Contract
        >[0]['docxSlots'],
        canonicalFields: v1.canonicalFields as Parameters<
          typeof adaptV1Contract
        >[0]['canonicalFields'],
        renderBindings: v1.renderBindings as Parameters<
          typeof adaptV1Contract
        >[0]['renderBindings'],
      },
      null,
    );
    if (template.docxPath) adapted.normalizedDocxPath = template.docxPath;
    if (template.docxChecksum) adapted.templateHash = template.docxChecksum;

    const compiled = compileContract(adapted);
    const warnings = this.buildWarnings(
      v1.canonicalFields as Array<{ source?: string; path?: string }>,
      v1.docxSlots as Array<{ reviewRequired?: boolean }>,
    );
    warnings.push(...this.buildSparseWarnings(v1.canonicalFields.length));

    return {
      templateCode: v1.templateCode,
      title: v1.title || template.templateName,
      templateId: String(template.id),
      normalizedDocxPath: template.docxPath ?? null,
      templateHash: template.docxChecksum ?? null,
      baselineContract: adapted,
      compiledBaseline: compiled.ok ? (compiled.artifact ?? null) : null,
      provenance: {
        source,
        sourceId: v1.sourceId,
        v1Status: v1.status as 'locked' | 'draft',
        extractionHash: v1.extractionSource?.sha256 ?? null,
      },
      quality: {
        grade,
        fieldCount: v1.canonicalFields.length,
        bindingCount: v1.renderBindings.length,
        unresolvedCount: warnings.filter((w) => w.code === 'UNRESOLVED_FIELD')
          .length,
        warnings,
      },
      mode: 'CREATE_VERSION',
      existingDraftId: null,
    };
  }

  private async virtualBaselineFromDocx(template: {
    id: bigint;
    templateCode: string;
    templateName: string;
    docxPath: string | null;
    docxChecksum: string | null;
  }): Promise<AuthoringBaseline | null> {
    if (!template.docxPath || !template.docxChecksum) return null;

    const contract = createEmptyContract({
      templateCode: template.templateCode,
      title: template.templateName,
      agencyId: null,
      templateHash: template.docxChecksum,
      normalizedDocxPath: template.docxPath,
    });

    return {
      templateCode: template.templateCode,
      title: template.templateName,
      templateId: String(template.id),
      normalizedDocxPath: template.docxPath,
      templateHash: template.docxChecksum,
      baselineContract: contract,
      compiledBaseline: null,
      provenance: {
        source: 'VIRTUAL_FROM_DOCX',
        sourceId: null,
        v1Status: null,
        extractionHash: null,
      },
      quality: {
        grade: 'GENERIC_FALLBACK',
        fieldCount: 0,
        bindingCount: 0,
        unresolvedCount: 0,
        warnings: [
          {
            code: 'VIRTUAL_BASELINE',
            message:
              'Chưa có V1 contract. Baseline được tạo từ normalized DOCX. Cần chạy extraction để tạo field mapping.',
          },
        ],
      },
      mode: 'CREATE_VERSION',
      existingDraftId: null,
    };
  }

  // ---------------------------------------------------------------------------
  // Quality helpers
  // ---------------------------------------------------------------------------

  private computeQualityGrade(v1: {
    canonicalFields?: unknown[];
    status: string;
  }): QualityGrade {
    if (v1.status === 'locked') return 'LOCKED_VERIFIED';
    return 'EXTRACTED_NEEDS_REVIEW';
  }

  private isUniqueConstraintError(error: unknown): error is { code: 'P2002' } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }

  private computeGradeFromStatus(dbStatus: string): QualityGrade {
    if (dbStatus === 'PUBLISHED' || dbStatus === 'ARCHIVED')
      return 'LOCKED_VERIFIED';
    return 'EXTRACTED_NEEDS_REVIEW';
  }

  private buildWarnings(
    canonicalFields: Array<{ source?: string; path?: string }>,
    docxSlots: Array<{ reviewRequired?: boolean }>,
  ): AuthoringWarning[] {
    const warnings: AuthoringWarning[] = [];
    const unresolved = canonicalFields.filter(
      (f) =>
        !f.source ||
        f.source === 'unknown' ||
        /^\w+\.field\d+$/i.test(f.path ?? ''),
    );
    if (unresolved.length > 0) {
      warnings.push({
        code: 'UNRESOLVED_FIELD',
        message: `${unresolved.length} trường chưa có nguồn dữ liệu được xác nhận.`,
        fieldCount: unresolved.length,
      });
    }
    const needsReview = docxSlots.filter((s) => s.reviewRequired);
    if (needsReview.length > 0) {
      warnings.push({
        code: 'REVIEW_REQUIRED',
        message: `${needsReview.length} slot cần được reviewer xác nhận trước khi publish.`,
        fieldCount: needsReview.length,
      });
    }
    return warnings;
  }

  private buildSparseWarnings(fieldCount: number): AuthoringWarning[] {
    if (fieldCount >= SPARSE_EXTRACTION_FIELD_THRESHOLD) return [];
    return [
      {
        code: 'EXTRACTION_SPARSE',
        message: `Extraction còn thô: mới nhận diện ${fieldCount} trường. Cần đối chiếu trực tiếp DOCX trước khi duyệt.`,
        fieldCount,
      },
    ];
  }
}
