import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  CompiledFormContract,
  ContractStatus,
  FormContractV2,
} from '@qllaw/form-contracts';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  FormContractVersionRepository,
  type FormContractVersionRecord,
  type RevisionRecord,
  type ReviewRecord,
} from '../application/form-contract-version.repository';

function bigint(value: string): bigint {
  return BigInt(value);
}

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

type ContractRow = Awaited<
  ReturnType<PrismaService['form_contract_versions']['findUnique']>
>;

function mapRow(row: NonNullable<ContractRow>): FormContractVersionRecord {
  return {
    id: String(row.id),
    templateId: String(row.template_id),
    agencyId: row.agency_id ? String(row.agency_id) : null,
    version: row.version_no,
    status: row.status as ContractStatus,
    revision: row.revision,
    contract: row.draft_json as FormContractV2,
    compiledContract:
      (row.compiled_json as CompiledFormContract | null) ?? null,
    createdByOfficialId: String(row.created_by_official_id),
    approvedByOfficialId: row.approved_by_official_id
      ? String(row.approved_by_official_id)
      : null,
    publishedByOfficialId: row.published_by_official_id
      ? String(row.published_by_official_id)
      : null,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

@Injectable()
export class PrismaFormContractVersionRepository extends FormContractVersionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(
    record: Omit<FormContractVersionRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<FormContractVersionRecord> {
    const row = await this.prisma.form_contract_versions.create({
      data: {
        template_id: bigint(record.templateId),
        agency_id: record.agencyId ? bigint(record.agencyId) : null,
        scope_key: record.agencyId ? `AGENCY:${record.agencyId}` : 'GLOBAL',
        version_no: record.version,
        status: record.status,
        revision: record.revision,
        base_contract_hash: record.contract.baseContractHash,
        contract_hash: record.contract.contractHash || null,
        template_hash: record.contract.templateHash,
        normalized_docx_path: record.contract.normalizedDocxPath,
        draft_json: json(record.contract),
        compiled_json: record.compiledContract
          ? json(record.compiledContract)
          : Prisma.JsonNull,
        created_by_official_id: bigint(record.createdByOfficialId),
        approved_by_official_id: record.approvedByOfficialId
          ? bigint(record.approvedByOfficialId)
          : null,
        published_by_official_id: record.publishedByOfficialId
          ? bigint(record.publishedByOfficialId)
          : null,
        submitted_at: record.submittedAt,
        approved_at: record.approvedAt,
        published_at: record.publishedAt,
        archived_at: record.archivedAt,
      },
    });
    return mapRow(row);
  }

  async findById(id: string): Promise<FormContractVersionRecord | null> {
    const row = await this.prisma.form_contract_versions.findUnique({
      where: { id: bigint(id) },
    });
    return row ? mapRow(row) : null;
  }

  async list(input?: {
    agencyId?: string | null;
    templateId?: string;
    status?: ContractStatus;
  }): Promise<FormContractVersionRecord[]> {
    const rows = await this.prisma.form_contract_versions.findMany({
      where: {
        ...(input && 'agencyId' in input
          ? { agency_id: input.agencyId ? bigint(input.agencyId) : null }
          : {}),
        ...(input?.templateId ? { template_id: bigint(input.templateId) } : {}),
        ...(input?.status ? { status: input.status } : {}),
      },
      orderBy: [{ updated_at: 'desc' }, { id: 'desc' }],
    });
    return rows.map(mapRow);
  }

  async save(
    record: FormContractVersionRecord,
    revision?: RevisionRecord,
  ): Promise<FormContractVersionRecord> {
    const row = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.form_contract_versions.update({
        where: { id: bigint(record.id) },
        data: {
          status: record.status,
          revision: record.revision,
          base_contract_hash: record.contract.baseContractHash,
          contract_hash: record.contract.contractHash || null,
          template_hash: record.contract.templateHash,
          normalized_docx_path: record.contract.normalizedDocxPath,
          draft_json: json(record.contract),
          compiled_json: record.compiledContract
            ? json(record.compiledContract)
            : Prisma.JsonNull,
          approved_by_official_id: record.approvedByOfficialId
            ? bigint(record.approvedByOfficialId)
            : null,
          published_by_official_id: record.publishedByOfficialId
            ? bigint(record.publishedByOfficialId)
            : null,
          submitted_at: record.submittedAt,
          approved_at: record.approvedAt,
          published_at: record.publishedAt,
          archived_at: record.archivedAt,
          updated_at: new Date(),
        },
      });
      if (revision) {
        await transaction.form_contract_revisions.create({
          data: {
            contract_version_id: bigint(record.id),
            revision_no: revision.revision,
            operation_type: revision.operationType,
            operations_json: json(revision.operations),
            snapshot_json: json(revision.snapshot),
            actor_official_id: bigint(revision.actorOfficialId),
            created_at: revision.createdAt,
          },
        });
      }
      return updated;
    });
    return mapRow(row);
  }

  async addReview(review: ReviewRecord): Promise<void> {
    await this.prisma.form_contract_reviews.create({
      data: {
        contract_version_id: bigint(review.contractVersionId),
        revision_no: review.revision,
        action: review.action,
        comment: review.comment,
        actor_official_id: bigint(review.actorOfficialId),
        created_at: review.createdAt,
      },
    });
  }

  async archivePublishedBefore(
    templateId: string,
    agencyId: string | null,
    exceptId: string,
  ): Promise<void> {
    await this.prisma.form_contract_versions.updateMany({
      where: {
        id: { not: bigint(exceptId) },
        template_id: bigint(templateId),
        agency_id: agencyId ? bigint(agencyId) : null,
        status: 'PUBLISHED',
      },
      data: {
        status: 'ARCHIVED',
        archived_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async deleteDraft(id: string): Promise<void> {
    await this.prisma.form_contract_versions.delete({
      where: { id: bigint(id) },
    });
  }
}
