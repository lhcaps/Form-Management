/**
 * Unit tests for DocumentsService.createBatch — Phase 0 / Task A1.
 *
 * Verifies that newly created generated_documents rows always carry the
 * canonical render_payload_snapshot shape (PLAN.md v2.3 §A1):
 *   { case, target, template, formats, formInputs, payloadOverrides,
 *     renderPayloadOverrides, contractMeta }
 *
 * Only newly created snapshots are required to include the new keys.
 * Existing rows remain readable.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentsService } from './documents.service';

type CreateCallArgs = Record<string, unknown>;
type CreateCall = { data: Record<string, unknown> };

function createMockPrismaService() {
  const caseItem = {
    id: 100n,
    case_code: 'VKS-2026-0001',
    case_title: 'Hồ sơ test',
    current_stage: '01',
    current_status: 'PROCESSING',
    is_deleted: false,
  };

  const template = {
    id: 1n,
    template_code: 'BM-001',
    template_no: '001',
    template_name: 'Biên bản tiếp nhận',
    render_scope: 'CASE_LEVEL',
    output_strategy: 'SINGLE',
    stage_code: '01',
    is_active: true,
    default_output_formats: ['DOCX', 'PDF'],
    requires_review: false,
    group_id: null,
  };

  const generatedDocumentCreates: CreateCall[] = [];
  const txCreate = jest.fn((args: CreateCallArgs) => {
    generatedDocumentCreates.push(args as CreateCall);
    return { id: 900n };
  });
  const txBatchCreate = jest.fn(() => ({ id: 800n }));
  const txBatchUpdate = jest.fn(() => ({ id: 800n }));
  const txCaseEventCreate = jest.fn(() => ({ id: 1n }));

  type TxShape = {
    document_generation_batches: {
      create: typeof txBatchCreate;
      update: typeof txBatchUpdate;
    };
    generated_documents: {
      create: typeof txCreate;
    };
    case_events: {
      create: typeof txCaseEventCreate;
    };
  };

  const tx: TxShape = {
    document_generation_batches: {
      create: txBatchCreate,
      update: txBatchUpdate,
    },
    generated_documents: {
      create: txCreate,
    },
    case_events: {
      create: txCaseEventCreate,
    },
  };

  const prisma = {
    cases: {
      findFirst: jest.fn().mockResolvedValue(caseItem),
    },
    templates: {
      findMany: jest.fn().mockResolvedValue([template]),
    },
    case_people: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    people: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    document_generation_batches: {
      findUnique: jest.fn().mockResolvedValue({
        id: 800n,
        case_id: caseItem.id,
        batch_code: 'DGB-2026-1',
        requested_formats: ['DOCX', 'PDF'],
        selected_templates_snapshot: ['1'],
        target_selection_snapshot: { targetPersonIds: [] },
        status: 'COMPLETED',
        total_documents: 1,
        success_documents: 1,
        failed_documents: 0,
        error_message: null,
        created_by_name: 'Tester',
        created_at: new Date(),
        completed_at: new Date(),
      }),
    },
    generated_documents: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 900n,
          template_id: template.id,
          document_code: 'BM-001-1',
          document_title: 'Biên bản tiếp nhận - VKS-2026-0001',
          target_scope: 'CASE_LEVEL',
          target_person_id: null,
          review_status: 'WAITING_REVIEW',
          generated_at: new Date(),
          approved_at: null,
          note: null,
        },
      ]),
    },
    $transaction: jest.fn(
      async (callback: (tx: TxShape) => Promise<unknown>) => callback(tx),
    ),
  };

  return { prisma, generatedDocumentCreates, template };
}

describe('DocumentsService.createBatch — render_payload_snapshot canonical shape (A1)', () => {
  let service: DocumentsService;
  let generatedDocumentCreates: CreateCall[];
  let template: { template_code: string };

  beforeEach(async () => {
    const harness = createMockPrismaService();
    generatedDocumentCreates = harness.generatedDocumentCreates;
    template = harness.template;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: harness.prisma },
      ],
    }).compile();

    service = moduleRef.get(DocumentsService);
    await service.createBatch('100', {
      templateIds: ['1'],
      formats: ['DOCX', 'PDF'],
      createdByName: 'Tester',
    });
  });

  it('initializes render_payload_snapshot with the canonical shape on newly created documents', () => {
    expect(generatedDocumentCreates).toHaveLength(1);
    const snapshot = generatedDocumentCreates[0].data
      .render_payload_snapshot as Record<string, unknown>;

    expect(snapshot.formInputs).toBeDefined();
    expect(snapshot.formInputs).toEqual({});
    expect(snapshot.payloadOverrides).toBeDefined();
    expect(snapshot.payloadOverrides).toEqual({});
    expect(snapshot.renderPayloadOverrides).toBeDefined();
    expect(snapshot.renderPayloadOverrides).toEqual({});
  });

  it('initializes contractMeta with the expected envelope', () => {
    const snapshot = generatedDocumentCreates[0].data
      .render_payload_snapshot as Record<string, unknown>;
    const contractMeta = snapshot.contractMeta as Record<string, unknown>;

    expect(contractMeta).toBeDefined();
    expect(contractMeta.templateCode).toBe(template.template_code);
    expect(['FOUND', 'MISSING', 'STALE']).toContain(
      contractMeta.contractLookupStatus,
    );
  });

  it('preserves existing case, target, template, formats fields on the snapshot', () => {
    const snapshot = generatedDocumentCreates[0].data
      .render_payload_snapshot as Record<string, unknown>;

    expect(snapshot.case).toMatchObject({
      id: '100',
      caseCode: 'VKS-2026-0001',
    });
    expect(snapshot.target).toBeDefined();
    expect(snapshot.template).toMatchObject({
      templateCode: template.template_code,
    });
    expect(snapshot.formats).toEqual(['DOCX', 'PDF']);
  });
});
