import { Injectable } from '@nestjs/common';
import {
  adaptV1Contract,
  compileContract,
  type CompiledFormContract,
  type V1Contract,
} from '@qllaw/form-contracts';
import { PrismaService } from '../../../prisma/prisma.service';
import { FormContractRepository } from '../../forms-contracts/application/form-contract.repository';
import { ContractPlatformError } from '../domain/contract-platform.error';

export type RuntimeFormContractResponse = {
  source: 'AGENCY_PUBLISHED' | 'GLOBAL_PUBLISHED' | 'LOCKED_FILE';
  contractVersion: string;
  contractHash: string;
  templateHash: string;
  compiledContract: CompiledFormContract;
};

@Injectable()
export class RuntimeFormContractService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileContracts: FormContractRepository,
  ) {}

  async resolve(
    templateCode: string,
    agencyId: string | null,
    contractHash?: string,
  ): Promise<RuntimeFormContractResponse> {
    const template = await this.prisma.templates.findUnique({
      where: { template_code: templateCode },
      select: {
        id: true,
        template_versions: {
          where: { is_active: true },
          orderBy: [{ is_default: 'desc' }, { version_no: 'desc' }],
          take: 1,
          select: {
            normalized_docx_path: true,
            checksum: true,
          },
        },
      },
    });

    if (contractHash) {
      const historical = await this.prisma.form_contract_versions.findFirst({
        where: {
          contract_hash: contractHash,
          status: { in: ['PUBLISHED', 'ARCHIVED'] },
          ...(template ? { template_id: template.id } : {}),
        },
      });
      if (historical?.compiled_json) {
        return this.fromDatabase(
          historical,
          historical.scope_key.startsWith('AGENCY:')
            ? 'AGENCY_PUBLISHED'
            : 'GLOBAL_PUBLISHED',
        );
      }
      throw new ContractPlatformError(
        'CONTRACT_HASH_NOT_FOUND',
        'Không tìm thấy contract lịch sử đã publish.',
        404,
      );
    }

    if (template) {
      if (agencyId) {
        const agencyPublished =
          await this.prisma.form_contract_versions.findFirst({
            where: {
              template_id: template.id,
              agency_id: BigInt(agencyId),
              scope_key: `AGENCY:${agencyId}`,
              status: 'PUBLISHED',
            },
            orderBy: [{ published_at: 'desc' }, { version_no: 'desc' }],
          });
        if (agencyPublished?.compiled_json) {
          return this.fromDatabase(agencyPublished, 'AGENCY_PUBLISHED');
        }
      }

      const globalPublished =
        await this.prisma.form_contract_versions.findFirst({
          where: {
            template_id: template.id,
            agency_id: null,
            scope_key: 'GLOBAL',
            status: 'PUBLISHED',
          },
          orderBy: [{ published_at: 'desc' }, { version_no: 'desc' }],
        });
      if (globalPublished?.compiled_json) {
        return this.fromDatabase(globalPublished, 'GLOBAL_PUBLISHED');
      }
    }

    const legacy = await this.fileContracts.findByIdentifier(templateCode);
    if (!legacy || !legacy.runtimeEligible) {
      throw new ContractPlatformError(
        'RUNTIME_CONTRACT_NOT_FOUND',
        'Biểu mẫu chưa có contract đã publish hoặc locked.',
        404,
      );
    }
    const adapted = adaptV1Contract({
      schemaVersion: '1.0',
      sourceId: legacy.sourceId,
      templateCode: legacy.templateCode,
      templateTitle: legacy.title,
      documentKind: 'form',
      status: 'locked',
      extractionSource: {
        sha256: `legacy-${legacy.sourceId}`,
      },
      docxSlots: legacy.docxSlots,
      canonicalFields: legacy.canonicalFields,
      renderBindings: legacy.renderBindings,
    } as V1Contract);
    const templateVersion = template?.template_versions[0];
    if (templateVersion?.normalized_docx_path) {
      adapted.normalizedDocxPath = templateVersion.normalized_docx_path;
    }
    if (templateVersion?.checksum) {
      adapted.templateHash = templateVersion.checksum;
    }
    const compiled = compileContract(adapted);
    if (!compiled.ok || !compiled.artifact) {
      throw new ContractPlatformError(
        'LOCKED_CONTRACT_INVALID',
        'Locked contract không compile được bằng Contract Platform v2.',
        500,
        compiled.issues,
      );
    }
    return {
      source: 'LOCKED_FILE',
      contractVersion: `locked:${legacy.sourceId}`,
      contractHash: compiled.artifact.contractHash,
      templateHash: compiled.artifact.templateHash,
      compiledContract: compiled.artifact,
    };
  }

  private fromDatabase(
    row: {
      id: bigint;
      version_no: number;
      contract_hash: string | null;
      template_hash: string;
      compiled_json: unknown;
    },
    source: RuntimeFormContractResponse['source'],
  ): RuntimeFormContractResponse {
    const compiledContract = row.compiled_json as CompiledFormContract;
    return {
      source,
      contractVersion: `db:${row.id}:v${row.version_no}`,
      contractHash: row.contract_hash ?? compiledContract.contractHash,
      templateHash: row.template_hash,
      compiledContract,
    };
  }
}
