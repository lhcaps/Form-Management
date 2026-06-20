import type { FormContractRepository } from '../../forms-contracts/application/form-contract.repository';
import type { LoadedFormContract } from '../../forms-contracts/domain/form-contract';
import { FormPlatformCatalogService } from './form-platform-catalog.service';

function v1(status: 'locked' | 'draft' = 'draft'): LoadedFormContract {
  return {
    sourceId: `BM-030__${status}`,
    templateCode: 'BM-030',
    title: 'Biểu mẫu BM-030',
    status,
    documentKind: 'form',
    stage: { code: '01', label: 'Tiếp nhận và giải quyết nguồn tin' },
    docxSlots: [
      {
        slotId: 'document.number',
        required: true,
        reviewRequired: status === 'draft',
      },
    ],
    canonicalFields: [
      {
        path: 'document.number',
        type: 'string',
        source: status === 'draft' ? 'unknown' : 'manual',
      },
    ],
    renderBindings: [
      {
        slotId: 'document.number',
        from: 'document.number',
        transform: 'identity',
        fallback: '',
      },
    ],
    runtimeEligible: status === 'locked',
    needsReview: status === 'draft',
    genericFieldCount: 0,
    fieldsNeedingReviewCount: status === 'draft' ? 1 : 0,
  };
}

function row(input: {
  id: bigint;
  agencyId: bigint | null;
  status: string;
  contractHash?: string | null;
  compiled?: unknown;
}) {
  return {
    id: input.id,
    agency_id: input.agencyId,
    version_no: 1,
    status: input.status,
    contract_hash: input.contractHash ?? null,
    template_hash: 'template-hash',
    draft_json: {
      fields: [{ id: 'field-1' }],
      renderBindings: [{ id: 'binding-1' }],
    },
    compiled_json: input.compiled ?? null,
    updated_at: new Date('2026-06-20T00:00:00Z'),
  };
}

function setup(input?: {
  versions?: ReturnType<typeof row>[];
  contract?: LoadedFormContract | null;
}) {
  const versions = input?.versions ?? [];
  const template = {
    id: 30n,
    template_code: 'BM-030',
    template_name: 'Biểu mẫu BM-030',
    stage_code: '01',
    template_versions: [
      {
        normalized_docx_path:
          'storage/templates/normalized-docx/BM-030/BM-030_normalized.docx',
        checksum: 'template-hash',
      },
    ],
    form_contract_versions: versions,
  };
  const prisma = {
    templates: {
      findMany: jest.fn(async () => [template]),
      findUnique: jest.fn(async () => template),
    },
  };
  const fileContracts = {
    list: jest.fn(async () =>
      input?.contract === null ? [] : [input?.contract ?? v1()],
    ),
    findByIdentifier: jest.fn(async () =>
      input?.contract === null ? null : (input?.contract ?? v1()),
    ),
    inspect: jest.fn(),
  } satisfies FormContractRepository;

  return new FormPlatformCatalogService(prisma as never, fileContracts);
}

describe('FormPlatformCatalogService', () => {
  it('never treats an agency draft hash as a published runtime contract', async () => {
    const service = setup({
      versions: [
        row({
          id: 1n,
          agencyId: 7n,
          status: 'DRAFT',
          contractHash: 'draft-hash-must-not-leak',
          compiled: { contractHash: 'draft-hash-must-not-leak' },
        }),
      ],
    });

    const [item] = await service.listCatalog('7');

    expect(item.authoring.status).toBe('DRAFT');
    expect(item.runtime).toEqual({
      available: true,
      source: 'LEGACY_BESPOKE',
      contractHash: null,
    });
    expect(item.renderer.kind).not.toBe('PUBLISHED_V2');
  });

  it('selects agency published before global published and ignores newer drafts', async () => {
    const service = setup({
      versions: [
        row({
          id: 3n,
          agencyId: 7n,
          status: 'DRAFT',
          contractHash: 'draft-hash',
          compiled: { contractHash: 'draft-hash' },
        }),
        row({
          id: 2n,
          agencyId: 7n,
          status: 'PUBLISHED',
          contractHash: 'agency-published-hash',
          compiled: { contractHash: 'agency-published-hash' },
        }),
        row({
          id: 1n,
          agencyId: null,
          status: 'PUBLISHED',
          contractHash: 'global-published-hash',
          compiled: { contractHash: 'global-published-hash' },
        }),
      ],
    });

    const [item] = await service.listCatalog('7');

    expect(item.runtime).toEqual({
      available: true,
      source: 'AGENCY_PUBLISHED',
      contractHash: 'agency-published-hash',
    });
  });

  it('uses canonical stage boundaries and keeps BM-030 in stage 01', async () => {
    const service = setup();

    const [item] = await service.listCatalog('7');

    expect(item.stageCode).toBe('01');
  });

  it('allows a published agency version to open as the base of a new version', async () => {
    const service = setup({
      versions: [
        row({
          id: 2n,
          agencyId: 7n,
          status: 'PUBLISHED',
          contractHash: 'agency-published-hash',
          compiled: { contractHash: 'agency-published-hash' },
        }),
      ],
    });

    const [item] = await service.listCatalog('7');

    expect(item.authoring).toMatchObject({
      status: 'PUBLISHED',
      canOpen: true,
      mode: 'CREATE_VERSION',
    });
  });
});
