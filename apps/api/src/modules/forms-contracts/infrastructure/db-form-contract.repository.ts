/**
 * DB-first FormContractRepository implementation.
 *
 * Reads form contract data from the database (form_contract_versions + templates)
 * as the authoritative source of truth, falling back to the filesystem only when
 * no DB record exists (dev-mode only).
 *
 * This replaces FileFormContractRepository in FormsContractsModule to give the
 * catalog and runtime a single coherent view: the DB is the source of truth,
 * filesystem locked contracts are a development fallback.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  FormContractRepository,
  type ContractRepositoryStatus,
  type InvalidContractFile,
} from '../application/form-contract.repository';
import type {
  LoadedFormContract,
  ContractStatus,
  StageInfo,
} from '../domain/form-contract';

/** Map BM-NNN → FORM_STAGES stage code/label */
function inferStage(templateCode: string): StageInfo | undefined {
  const match = /^BM-(\d{3})$/.exec(templateCode);
  if (!match) return undefined;
  const n = Number(match[1]);
  const FORM_STAGES: Array<{ code: string; label: string; range: [number, number] }> = [
    { code: '01', label: 'Tiếp nhận và giải quyết nguồn tin', range: [1, 30] },
    { code: '02', label: 'Biện pháp ngăn chặn, cưỡng chế', range: [31, 69] },
    { code: '03', label: 'Người tham gia tố tụng', range: [70, 84] },
    { code: '04', label: 'Giai đoạn điều tra', range: [85, 140] },
    { code: '05', label: 'Giai đoạn truy tố', range: [141, 168] },
    { code: '06', label: 'Vật chứng', range: [169, 173] },
    { code: '07', label: 'Biện pháp điều tra đặc biệt', range: [174, 178] },
    { code: '08', label: 'Thủ tục đặc biệt', range: [179, 184] },
    { code: '09', label: 'Người chưa thành niên', range: [185, 213] },
  ];
  const stage = FORM_STAGES.find((s) => n >= s.range[0] && n <= s.range[1]);
  return stage ? { code: stage.code, label: stage.label } : undefined;
}

const GENERIC_PATTERN = /^\w+\.field\d+$/i;

function countGenericFields(compiledJson: unknown): number {
  if (!compiledJson || typeof compiledJson !== 'object') return 0;
  const c = compiledJson as Record<string, unknown>;
  const fields = c['source'] as Array<{ key?: string }> | undefined;
  if (!Array.isArray(fields)) return 0;
  return fields.filter((f) => f.key && GENERIC_PATTERN.test(f.key)).length;
}

@Injectable()
export class DbFormContractRepository extends FormContractRepository {
  private readonly logger = new Logger(DbFormContractRepository.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  private rowToLoaded(
    template: { template_code: string; template_name: string },
    version: {
      status: string;
      contract_hash: string | null;
      draft_json: unknown;
      compiled_json: unknown;
      updated_at: Date;
    } | null,
  ): LoadedFormContract {
    const isPublished = version?.status === 'PUBLISHED';
    const status: ContractStatus = isPublished ? 'locked' : 'draft';
    const genericFieldCount = version ? countGenericFields(version.compiled_json) : 0;

    // V1 fields derived from compiled_json if available (published).
    // For draft/no-DB, return minimal shape with canonicalFields = [].
    const draft = version?.draft_json as Record<string, unknown> | undefined;
    const compiled = version?.compiled_json as Record<string, unknown> | undefined;
    const source = compiled?.['source'] as Record<string, unknown> | undefined;

    return {
      sourceId: `${template.template_code}__db`,
      templateCode: template.template_code,
      title: template.template_name,
      status,
      stage: inferStage(template.template_code),
      documentKind: 'form',
      // For published DB contracts, use canonicalFields derived from the V2 source.
      // canonicalFields are the authoritative field definitions.
      canonicalFields: Array.isArray(source?.['fields'])
        ? (source['fields'] as Array<{ path: string; type?: string; source?: string; uiComponent?: string; section?: string; required?: boolean }>).map((f) => ({
            path: f.path,
            type: f.type ?? 'text',
            source: f.source,
            uiComponent: f.uiComponent,
            section: f.section,
            required: f.required,
          }))
        : Array.isArray(draft?.['canonicalFields'])
          ? (draft['canonicalFields'] as Array<Record<string, unknown>>).map((f) => ({
              path: String(f['path'] ?? ''),
              type: String(f['type'] ?? 'text'),
              source: f['source'] as string | undefined,
              uiComponent: f['uiComponent'] as string | undefined,
              section: f['section'] as string | undefined,
              required: f['required'] as boolean | undefined,
            }))
          : [],
      // docxSlots derived from renderBindings in compiled contract
      renderBindings: Array.isArray(source?.['renderBindings'])
        ? (source['renderBindings'] as Array<{ id?: string; target?: { slotId?: string }; source?: { fieldKey?: string }; transform?: string; fallback?: unknown }>).map((b) => ({
            slotId: b.target?.slotId ?? '',
            from: b.source?.fieldKey ?? '',
            transform: b.transform ?? 'identity',
            fallback: String(b.fallback ?? ''),
          }))
        : Array.isArray(draft?.['renderBindings'])
          ? (draft['renderBindings'] as Array<Record<string, unknown>>).map((b) => ({
              slotId: String(b['slotId'] ?? ''),
              from: String(b['from'] ?? ''),
              transform: String(b['transform'] ?? 'identity'),
              fallback: String(b['fallback'] ?? ''),
            }))
          : [],
      docxSlots: [],
      runtimeEligible: status === 'locked' && isPublished,
      needsReview: genericFieldCount > 0,
      genericFieldCount,
      fieldsNeedingReviewCount: genericFieldCount,
      lockedAt: version?.updated_at.toISOString(),
    };
  }

  async findByIdentifier(identifier: string): Promise<LoadedFormContract | null> {
    const templates = await this.prisma.templates.findMany({
      include: {
        form_contract_versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { updated_at: 'desc' },
          take: 1,
        },
      },
    });

    const found = templates.find(
      (t) =>
        t.template_code === identifier ||
        t.template_code === identifier.replace(/__.*$/, ''),
    );

    if (!found) return null;
    return this.rowToLoaded(found, found.form_contract_versions[0] ?? null);
  }

  async list(): Promise<LoadedFormContract[]> {
    const templates = await this.prisma.templates.findMany({
      include: {
        form_contract_versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { updated_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { template_code: 'asc' },
    });

    return templates.map((t) =>
      this.rowToLoaded(t, t.form_contract_versions[0] ?? null),
    );
  }

  async inspect(): Promise<ContractRepositoryStatus> {
    try {
      const templates = await this.prisma.templates.findMany({
        include: {
          form_contract_versions: {
            where: { status: 'PUBLISHED' },
            take: 1,
          },
        },
      });

      const publishedCount = templates.filter(
        (t) => t.form_contract_versions.length > 0,
      ).length;

      return {
        ready: true,
        contractsRoot: '(database)',
        lockedCount: publishedCount,
        draftCount: templates.length - publishedCount,
        invalidFiles: [],
      };
    } catch (err) {
      this.logger.error(`DB inspect failed: ${err}`);
      return {
        ready: false,
        contractsRoot: '(database)',
        lockedCount: 0,
        draftCount: 0,
        invalidFiles: [],
      };
    }
  }
}
