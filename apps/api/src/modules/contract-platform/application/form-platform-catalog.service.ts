import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FormContractRepository } from '../../forms-contracts/application/form-contract.repository';
import {
  FORM_STAGES,
  type LoadedFormContract,
} from '../../forms-contracts/domain/form-contract';
import { legacyRendererKind } from '../infrastructure/legacy-renderer-capabilities.generated';

/**
 * Unified catalog item returned by the Form Platform Catalog.
 * Provides a single view of contract publication status and runtime availability
 * for generated documents and runtime template selection.
 */
export type FormPlatformCatalogItem = {
  templateId: string;
  templateCode: string;
  title: string;
  stageCode: string | null;

  docx: {
    ready: boolean;
    normalizedPath: string | null;
    templateHash: string | null;
  };

  authoring: {
    status:
      | 'NOT_INITIALIZED'
      | 'DRAFT'
      | 'CHANGES_REQUESTED'
      | 'IN_REVIEW'
      | 'APPROVED'
      | 'PUBLISHED'
      | 'ARCHIVED';
    versionId: string | null;
    canOpen: boolean;
    mode: 'EDIT' | 'READ_ONLY' | 'CREATE_VERSION';
  };

  runtime: {
    available: boolean;
    source:
      | 'AGENCY_PUBLISHED'
      | 'GLOBAL_PUBLISHED'
      | 'LOCKED_FILE'
      | 'LEGACY_BESPOKE'
      | 'GENERIC_FALLBACK'
      | 'UNAVAILABLE';
    contractHash: string | null;
  };

  quality: {
    grade: 'LOCKED_VERIFIED' | 'EXTRACTED_NEEDS_REVIEW' | 'GENERIC_FALLBACK';
    fieldCount: number;
    bindingCount: number;
    unresolvedCount: number;
  };

  renderer: {
    kind: 'PUBLISHED_V2' | 'BESPOKE' | 'GENERIC';
    editableInStudio: boolean;
  };
};

@Injectable()
export class FormPlatformCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileContracts: FormContractRepository,
  ) {}

  /**
   * Return catalog items for all templates, scoped to an agency.
   * For admin users with FORM_TEMPLATE_EDIT permission, includes
   * full authoring metadata. For normal users, only runtime fields
   * are populated.
   */
  async listCatalog(
    agencyId: string | null,
  ): Promise<FormPlatformCatalogItem[]> {
    const templates = await this.prisma.templates.findMany({
      include: {
        template_versions: {
          where: { is_active: true },
          orderBy: [{ is_default: 'desc' }, { version_no: 'desc' }],
          take: 1,
        },
        form_contract_versions: {
          where: agencyId
            ? {
                OR: [
                  {
                    agency_id: BigInt(agencyId),
                    scope_key: `AGENCY:${agencyId}`,
                  },
                  { agency_id: null, scope_key: 'GLOBAL' },
                ],
              }
            : { agency_id: null, scope_key: 'GLOBAL' },
          orderBy: [{ updated_at: 'desc' }, { version_no: 'desc' }],
        },
      },
      orderBy: { template_code: 'asc' },
    });

    const v1Contracts = await this.fileContracts.list();

    return templates.map((template) => {
      const activeVersion = template.template_versions[0];
      const v1 = v1Contracts.find(
        (c) => c.templateCode === template.template_code,
      );
      const agencyVersions = template.form_contract_versions.filter(
        (v) =>
          agencyId &&
          v.agency_id === BigInt(agencyId) &&
          v.scope_key === `AGENCY:${agencyId}`,
      );
      const globalVersions = template.form_contract_versions.filter(
        (v) => v.agency_id === null && v.scope_key === 'GLOBAL',
      );

      return this.buildCatalogItem(
        template,
        activeVersion,
        agencyVersions,
        globalVersions,
        v1 ?? null,
      );
    });
  }

  /**
   * Return a single catalog item for a specific template code.
   */
  async getCatalogItem(
    templateCode: string,
    agencyId: string | null,
  ): Promise<FormPlatformCatalogItem | null> {
    const template = await this.prisma.templates.findUnique({
      where: { template_code: templateCode },
      include: {
        template_versions: {
          where: { is_active: true },
          orderBy: [{ is_default: 'desc' }, { version_no: 'desc' }],
          take: 1,
        },
        form_contract_versions: {
          where: agencyId
            ? {
                OR: [
                  {
                    agency_id: BigInt(agencyId),
                    scope_key: `AGENCY:${agencyId}`,
                  },
                  { agency_id: null, scope_key: 'GLOBAL' },
                ],
              }
            : { agency_id: null, scope_key: 'GLOBAL' },
          orderBy: [{ updated_at: 'desc' }, { version_no: 'desc' }],
        },
      },
    });

    if (!template) return null;

    const v1 = await this.fileContracts.findByIdentifier(templateCode);
    const activeVersion = template.template_versions[0];
    const agencyVersions = template.form_contract_versions.filter(
      (v) =>
        agencyId &&
        v.agency_id === BigInt(agencyId) &&
        v.scope_key === `AGENCY:${agencyId}`,
    );
    const globalVersions = template.form_contract_versions.filter(
      (v) => v.agency_id === null && v.scope_key === 'GLOBAL',
    );

    return this.buildCatalogItem(
      template,
      activeVersion,
      agencyVersions,
      globalVersions,
      v1,
    );
  }

  private buildCatalogItem(
    template: {
      id: bigint;
      template_code: string;
      template_name: string;
      stage_code: string | null;
      form_contract_versions: Array<{
        id: bigint;
        agency_id: bigint | null;
        scope_key: string;
        version_no: number;
        status: string;
        contract_hash: string | null;
        template_hash: string;
        draft_json: unknown;
        compiled_json: unknown;
      }>;
      template_versions: Array<{
        normalized_docx_path: string | null;
        checksum: string | null;
      }>;
    },
    activeVersion: {
      normalized_docx_path: string | null;
      checksum: string | null;
    } | null,
    agencyVersions: Array<{
      id: bigint;
      agency_id: bigint | null;
      scope_key: string;
      version_no: number;
      status: string;
      contract_hash: string | null;
      template_hash: string;
      draft_json: unknown;
      compiled_json: unknown;
    }>,
    globalVersions: Array<{
      id: bigint;
      agency_id: bigint | null;
      scope_key: string;
      version_no: number;
      status: string;
      contract_hash: string | null;
      template_hash: string;
      draft_json: unknown;
      compiled_json: unknown;
    }>,
    v1: LoadedFormContract | null,
  ): FormPlatformCatalogItem {
    const stageCode =
      template.stage_code ?? this.inferStageCode(template.template_code);

    const docx = {
      ready: Boolean(activeVersion?.normalized_docx_path),
      normalizedPath: activeVersion?.normalized_docx_path ?? null,
      templateHash: activeVersion?.checksum ?? null,
    };

    const agencyPublished = agencyVersions.find(
      (version) =>
        version.status === 'PUBLISHED' && Boolean(version.compiled_json),
    );
    const globalPublished = globalVersions.find(
      (version) =>
        version.status === 'PUBLISHED' && Boolean(version.compiled_json),
    );

    const { authoring, quality: authQuality } = this.buildAuthoring(
      agencyVersions,
      globalVersions,
      v1,
    );

    const runtime = this.buildRuntime(
      template.template_code,
      agencyPublished,
      globalPublished,
      v1,
      docx,
    );

    const renderer = this.buildRenderer(
      template.template_code,
      v1,
      agencyPublished,
      globalPublished,
    );

    return {
      templateId: String(template.id),
      templateCode: template.template_code,
      title: template.template_name,
      stageCode,
      docx,
      authoring,
      runtime,
      quality: authQuality,
      renderer,
    };
  }

  private buildAuthoring(
    agencyVersions: Array<{
      id: bigint;
      status: string;
      draft_json: unknown;
    }>,
    globalVersions: Array<{
      id: bigint;
      status: string;
      draft_json: unknown;
    }>,
    v1: LoadedFormContract | null,
  ): {
    authoring: FormPlatformCatalogItem['authoring'];
    quality: FormPlatformCatalogItem['quality'];
  } {
    const agencyLatest = agencyVersions[0];

    if (agencyLatest) {
      const status =
        agencyLatest.status as FormPlatformCatalogItem['authoring']['status'];
      const draft = agencyLatest.draft_json as {
        fields?: unknown[];
        renderBindings?: unknown[];
      } | null;
      const mode = this.modeFromStatus(status);

      return {
        authoring: {
          status,
          versionId: String(agencyLatest.id),
          canOpen: true,
          mode,
        },
        quality: {
          grade: this.gradeFromStatus(status),
          fieldCount: draft?.fields?.length ?? 0,
          bindingCount: draft?.renderBindings?.length ?? 0,
          unresolvedCount: 0,
        },
      };
    }

    const globalPublished = globalVersions.find(
      (version) => version.status === 'PUBLISHED',
    );
    if (globalPublished) {
      const draft = globalPublished.draft_json as {
        fields?: unknown[];
        renderBindings?: unknown[];
      } | null;

      return {
        authoring: {
          status: 'NOT_INITIALIZED',
          versionId: null,
          canOpen: true,
          mode: 'CREATE_VERSION',
        },
        quality: {
          grade: this.gradeFromStatus(globalPublished.status),
          fieldCount: draft?.fields?.length ?? 0,
          bindingCount: draft?.renderBindings?.length ?? 0,
          unresolvedCount: 0,
        },
      };
    }

    const v1Status = v1?.status ?? null;
    const grade = this.gradeFromV1(v1, v1Status);

    return {
      authoring: {
        status: 'NOT_INITIALIZED',
        versionId: null,
        canOpen: Boolean(v1),
        mode: 'CREATE_VERSION',
      },
      quality: {
        grade,
        fieldCount: v1?.canonicalFields?.length ?? 0,
        bindingCount: v1?.renderBindings?.length ?? 0,
        unresolvedCount: this.countUnresolved(v1),
      },
    };
  }

  private buildRuntime(
    templateCode: string,
    agencyPublished:
      | { contract_hash: string | null; compiled_json: unknown }
      | undefined,
    globalPublished:
      | { contract_hash: string | null; compiled_json: unknown }
      | undefined,
    v1: LoadedFormContract | null,
    docx: { ready: boolean },
  ): FormPlatformCatalogItem['runtime'] {
    if (agencyPublished?.compiled_json) {
      const hash = agencyPublished.contract_hash;
      if (hash) {
        return {
          available: true,
          source: 'AGENCY_PUBLISHED',
          contractHash: hash,
        };
      }
    }

    if (globalPublished?.compiled_json) {
      const hash = globalPublished.contract_hash;
      if (hash) {
        return {
          available: true,
          source: 'GLOBAL_PUBLISHED',
          contractHash: hash,
        };
      }
    }

    if (v1 && v1.status === 'locked') {
      return { available: true, source: 'LOCKED_FILE', contractHash: null };
    }

    if (v1 && v1.status === 'draft') {
      const legacyKind = legacyRendererKind(templateCode);
      return {
        available: true,
        source:
          legacyKind === 'BESPOKE' ? 'LEGACY_BESPOKE' : 'GENERIC_FALLBACK',
        contractHash: null,
      };
    }

    if (docx.ready) {
      return {
        available: false,
        source: 'GENERIC_FALLBACK',
        contractHash: null,
      };
    }

    return { available: false, source: 'UNAVAILABLE', contractHash: null };
  }

  private buildRenderer(
    templateCode: string,
    v1: LoadedFormContract | null,
    agencyPublished: { compiled_json: unknown } | undefined,
    globalPublished: { compiled_json: unknown } | undefined,
  ): FormPlatformCatalogItem['renderer'] {
    if (agencyPublished?.compiled_json) {
      return { kind: 'PUBLISHED_V2', editableInStudio: true };
    }
    if (globalPublished?.compiled_json) {
      return { kind: 'PUBLISHED_V2', editableInStudio: false };
    }
    if (v1) {
      return {
        kind: legacyRendererKind(templateCode),
        editableInStudio: true,
      };
    }
    return { kind: 'GENERIC', editableInStudio: true };
  }

  private inferStageCode(templateCode: string): string | null {
    const match = /^BM-(\d{3})$/.exec(templateCode);
    if (!match) return null;
    const n = Number(match[1]);
    const stage = FORM_STAGES.find(
      (candidate) => n >= candidate.range[0] && n <= candidate.range[1],
    );
    return stage?.code ?? null;
  }

  private modeFromStatus(
    status: string,
  ): FormPlatformCatalogItem['authoring']['mode'] {
    switch (status) {
      case 'DRAFT':
      case 'CHANGES_REQUESTED':
        return 'EDIT';
      case 'IN_REVIEW':
      case 'APPROVED':
        return 'READ_ONLY';
      default:
        return 'CREATE_VERSION';
    }
  }

  private gradeFromStatus(
    status: string,
  ): FormPlatformCatalogItem['quality']['grade'] {
    if (status === 'PUBLISHED' || status === 'ARCHIVED')
      return 'LOCKED_VERIFIED';
    return 'EXTRACTED_NEEDS_REVIEW';
  }

  private gradeFromV1(
    v1: LoadedFormContract | null,
    status: string | null,
  ): FormPlatformCatalogItem['quality']['grade'] {
    if (!v1) return 'GENERIC_FALLBACK';
    if (status === 'locked') return 'LOCKED_VERIFIED';
    return 'EXTRACTED_NEEDS_REVIEW';
  }

  private countUnresolved(v1: LoadedFormContract | null): number {
    if (!v1) return 0;
    return v1.canonicalFields.filter(
      (f) =>
        !f.source || f.source === 'unknown' || /^\w+\.field\d+$/i.test(f.path),
    ).length;
  }
}
