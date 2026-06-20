import {
  createEmptyContract,
  type FormContractV2,
} from '@qllaw/form-contracts';
import type { FormContractRepository } from '../../forms-contracts/application/form-contract.repository';
import type { LoadedFormContract } from '../../forms-contracts/domain/form-contract';
import { AuthoringContractService } from './authoring-contract.service';

function loadedV1(
  overrides: Partial<LoadedFormContract> = {},
): LoadedFormContract {
  return {
    sourceId: 'BM-004__2775520fd22c',
    templateCode: 'BM-004',
    title: 'Biểu mẫu BM-004',
    status: 'draft',
    documentKind: 'form',
    stage: { code: '01', label: 'Tiếp nhận nguồn tin' },
    docxSlots: [
      {
        slotId: 'decision.number',
        required: true,
        reviewRequired: true,
      },
    ],
    canonicalFields: [
      {
        path: 'decision.number',
        type: 'string',
        source: 'unknown',
        required: true,
      },
    ],
    renderBindings: [
      {
        slotId: 'decision.number',
        from: 'decision.number',
        transform: 'identity',
        fallback: '',
      },
    ],
    runtimeEligible: false,
    needsReview: true,
    genericFieldCount: 0,
    fieldsNeedingReviewCount: 1,
    ...overrides,
  };
}

function contract(status: FormContractV2['status']): FormContractV2 {
  return {
    ...createEmptyContract({
      templateCode: 'BM-004',
      title: 'Biểu mẫu BM-004',
      agencyId: '7',
      templateHash: 'template-hash',
      normalizedDocxPath:
        'storage/templates/normalized-docx/BM-004/BM-004_normalized.docx',
    }),
    version: 1,
    status,
  };
}

function dbRow(status: FormContractV2['status']) {
  return {
    id: 91n,
    template_id: 4n,
    agency_id: 7n,
    version_no: 1,
    status,
    revision: 0,
    base_contract_hash: null,
    contract_hash: null,
    template_hash: 'template-hash',
    normalized_docx_path:
      'storage/templates/normalized-docx/BM-004/BM-004_normalized.docx',
    draft_json: contract(status),
    compiled_json: null,
    created_by_official_id: 10n,
    approved_by_official_id: null,
    published_by_official_id: null,
    submitted_at: null,
    approved_at: null,
    published_at: null,
    archived_at: null,
    created_at: new Date('2026-06-20T00:00:00Z'),
    updated_at: new Date('2026-06-20T00:00:00Z'),
  };
}

function setup(input?: {
  v1?: LoadedFormContract | null;
  normalizedPath?: string | null;
  rows?: ReturnType<typeof dbRow>[];
}) {
  const rows = input?.rows ?? [];
  const template = {
    id: 4n,
    template_code: 'BM-004',
    template_name: 'Biểu mẫu BM-004',
    template_versions: [
      {
        normalized_docx_path:
          input?.normalizedPath === undefined
            ? 'storage/templates/normalized-docx/BM-004/BM-004_normalized.docx'
            : input.normalizedPath,
        checksum: 'template-hash',
      },
    ],
  };

  const findFirst = jest.fn(
    async (args: {
      where: {
        status?: string | { in: string[] };
        agency_id?: bigint | null;
      };
    }) => {
      const statuses =
        typeof args.where.status === 'string'
          ? [args.where.status]
          : (args.where.status?.in ?? []);
      return (
        rows.find(
          (row) =>
            statuses.includes(row.status) &&
            row.agency_id === (args.where.agency_id ?? null),
        ) ?? null
      );
    },
  );

  const prisma = {
    templates: {
      findUnique: jest.fn(async () => template),
    },
    form_contract_versions: {
      findFirst,
      create: jest.fn(async () => dbRow('DRAFT')),
    },
  };
  const fileContracts = {
    findByIdentifier: jest.fn(async () =>
      input?.v1 === undefined ? loadedV1() : input.v1,
    ),
    list: jest.fn(async () => []),
    inspect: jest.fn(),
  } satisfies FormContractRepository;

  return {
    service: new AuthoringContractService(prisma as never, fileContracts),
    prisma,
  };
}

describe('AuthoringContractService', () => {
  it('keeps a sparse extracted V1 contract reviewable instead of labelling it generic', async () => {
    const { service } = setup();

    const baseline = await service.resolveBaseline('BM-004', '7');

    expect(baseline).toMatchObject({
      templateCode: 'BM-004',
      provenance: {
        source: 'DRAFT_V1',
        sourceId: 'BM-004__2775520fd22c',
      },
      quality: {
        grade: 'EXTRACTED_NEEDS_REVIEW',
        fieldCount: 1,
        bindingCount: 1,
      },
    });
    expect(baseline?.quality.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'EXTRACTION_SPARSE' }),
      ]),
    );
  });

  it('opens an in-review agency version read-only instead of creating or rejecting it', async () => {
    const { service, prisma } = setup({
      rows: [dbRow('IN_REVIEW')],
    });

    const result = await service.openDesign('BM-004', '7', '10');

    expect(result.draftId).toBe('91');
    expect(result.baseline).toMatchObject({
      templateId: '4',
      mode: 'READ_ONLY',
      existingDraftId: '91',
    });
    expect(prisma.form_contract_versions.create).not.toHaveBeenCalled();
  });

  it('retains V1 provenance and extraction warnings when reopening a materialized draft', async () => {
    const { service } = setup({
      rows: [dbRow('DRAFT')],
    });

    const baseline = await service.resolveBaseline('BM-004', '7');

    expect(baseline).toMatchObject({
      provenance: {
        source: 'AGENCY_DRAFT',
        sourceId: 'BM-004__2775520fd22c',
        v1Status: 'draft',
      },
      quality: {
        grade: 'EXTRACTED_NEEDS_REVIEW',
        warnings: expect.arrayContaining([
          expect.objectContaining({ code: 'EXTRACTION_SPARSE' }),
        ]),
      },
    });
  });

  it('requires the canonical normalized DOCX before materializing a V1 baseline', async () => {
    const { service, prisma } = setup({ normalizedPath: null });

    await expect(service.openDesign('BM-004', '7', '10')).rejects.toMatchObject(
      {
        code: 'NORMALIZED_DOCX_REQUIRED',
        status: 422,
      },
    );
    expect(prisma.form_contract_versions.create).not.toHaveBeenCalled();
  });

  it('returns AUTHORING_BASE_NOT_FOUND when neither contract nor normalized DOCX exists', async () => {
    const { service } = setup({ v1: null, normalizedPath: null });

    await expect(service.openDesign('BM-004', '7', '10')).rejects.toMatchObject(
      {
        code: 'AUTHORING_BASE_NOT_FOUND',
        status: 422,
      },
    );
  });

  it('returns the winning editable draft when concurrent materialization hits the unique constraint', async () => {
    const winner = dbRow('DRAFT');
    let winnerVisible = false;
    const prisma = {
      templates: {
        findUnique: jest.fn(async () => ({
          id: 4n,
          template_code: 'BM-004',
          template_name: 'Biểu mẫu BM-004',
          template_versions: [
            {
              normalized_docx_path:
                'storage/templates/normalized-docx/BM-004/BM-004_normalized.docx',
              checksum: 'template-hash',
            },
          ],
        })),
      },
      form_contract_versions: {
        findFirst: jest.fn(
          async (args: {
            where: {
              status?: string | { in: string[] };
              agency_id?: bigint | null;
            };
          }) => {
            const statuses =
              typeof args.where.status === 'string'
                ? [args.where.status]
                : (args.where.status?.in ?? []);
            if (
              winnerVisible &&
              statuses.some((status) =>
                ['DRAFT', 'CHANGES_REQUESTED'].includes(status),
              )
            ) {
              return winner;
            }
            return null;
          },
        ),
        create: jest.fn(async () => {
          winnerVisible = true;
          throw { code: 'P2002' };
        }),
      },
    };
    const fileContracts = {
      findByIdentifier: jest.fn(async () => loadedV1()),
      list: jest.fn(async () => []),
      inspect: jest.fn(),
    } satisfies FormContractRepository;
    const service = new AuthoringContractService(
      prisma as never,
      fileContracts,
    );

    const result = await service.openDesign('BM-004', '7', '10');

    expect(result).toMatchObject({
      draftId: '91',
      baseline: {
        mode: 'EDIT',
        existingDraftId: '91',
      },
    });
    expect(prisma.form_contract_versions.create).toHaveBeenCalledTimes(1);
  });
});
