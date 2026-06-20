import {
  createEmptyContract,
  type FormContractV2,
} from '@qllaw/form-contracts';
import {
  FormContractVersionRepository,
  type FormContractVersionRecord,
  type RevisionRecord,
  type ReviewRecord,
} from './form-contract-version.repository';
import { FormStudioService } from './form-studio.service';

class InMemoryRepository extends FormContractVersionRepository {
  records = new Map<string, FormContractVersionRecord>();
  revisions: RevisionRecord[] = [];
  reviews: ReviewRecord[] = [];
  nextId = 1;

  async create(
    record: Omit<FormContractVersionRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    const now = new Date();
    const created = {
      ...record,
      id: String(this.nextId++),
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(created.id, created);
    return created;
  }

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async list() {
    return [...this.records.values()];
  }

  async save(
    record: FormContractVersionRecord,
    revision?: RevisionRecord,
  ) {
    const saved = { ...record, updatedAt: new Date() };
    this.records.set(record.id, saved);
    if (revision) this.revisions.push(revision);
    return saved;
  }

  async addReview(review: ReviewRecord) {
    this.reviews.push(review);
  }

  async archivePublishedBefore(
    templateId: string,
    agencyId: string | null,
    exceptId: string,
  ) {
    for (const record of this.records.values()) {
      if (
        record.id !== exceptId &&
        record.templateId === templateId &&
        record.agencyId === agencyId &&
        record.status === 'PUBLISHED'
      ) {
        this.records.set(record.id, {
          ...record,
          status: 'ARCHIVED',
          archivedAt: new Date(),
        });
      }
    }
  }

  async deleteDraft(id: string) {
    this.records.delete(id);
  }
}

function validContract(): FormContractV2 {
  const contract = createEmptyContract({
    templateCode: 'BM-001',
    title: 'Biên bản tiếp nhận',
    agencyId: '10',
    templateHash: 'template-hash',
    normalizedDocxPath: 'storage/templates/BM-001.docx',
  });
  contract.sections.push({
    id: 'main',
    title: 'Thông tin',
    order: 0,
    columns: 2,
  });
  contract.fields.push({
    id: 'full-name',
    key: 'receiver.fullName',
    sectionId: 'main',
    label: 'Họ tên',
    control: 'TEXT',
    order: 0,
    width: 6,
    required: true,
    dataSource: { kind: 'MANUAL' },
  });
  contract.renderBindings.push({
    id: 'receiver-name',
    target: { kind: 'SLOT', slotId: 'receiver.fullName' },
    source: { kind: 'FIELD', fieldKey: 'receiver.fullName' },
    transform: 'identity',
    fallback: '',
  });
  return contract;
}

describe('FormStudioService governance workflow', () => {
  let repository: InMemoryRepository;
  let service: FormStudioService;

  beforeEach(() => {
    repository = new InMemoryRepository();
    service = new FormStudioService(repository);
  });

  it('applies typed operations with optimistic revision control', async () => {
    const draft = await service.createDraft({
      templateId: '1',
      agencyId: '10',
      actorId: '100',
      contract: validContract(),
    });

    const updated = await service.patchDraft(
      draft.id,
      {
        expectedRevision: 0,
        operations: [
          {
            type: 'UPDATE_FIELD',
            fieldId: 'full-name',
            patch: { control: 'TEXTAREA', width: 12 },
          },
        ],
      },
      '100',
    );

    expect(updated.revision).toBe(1);
    expect(updated.contract.fields[0]?.control).toBe('TEXTAREA');
    expect(repository.revisions).toHaveLength(1);

    await expect(
      service.patchDraft(
        draft.id,
        {
          expectedRevision: 0,
          operations: [],
        },
        '100',
      ),
    ).rejects.toMatchObject({ code: 'DRAFT_REVISION_CONFLICT', status: 409 });
  });

  it('enforces four-eyes approval and immutable publish snapshots', async () => {
    const draft = await service.createDraft({
      templateId: '1',
      agencyId: '10',
      actorId: '100',
      contract: validContract(),
    });
    const review = await service.submitReview(draft.id, '100');

    await expect(service.approve(review.id, '100')).rejects.toMatchObject({
      code: 'SELF_APPROVAL_FORBIDDEN',
    });

    const approved = await service.approve(review.id, '200', 'Đạt yêu cầu');
    expect(approved.status).toBe('APPROVED');

    const published = await service.publish(approved.id, '200');
    expect(published.status).toBe('PUBLISHED');
    expect(published.compiledContract?.contractHash).toMatch(/^[a-f0-9]{64}$/);

    await expect(
      service.patchDraft(
        published.id,
        {
          expectedRevision: published.revision,
          operations: [],
        },
        '100',
      ),
    ).rejects.toMatchObject({ code: 'PUBLISHED_VERSION_IMMUTABLE' });
  });

  it('blocks submit and publish when technical validation fails', async () => {
    const contract = validContract();
    contract.renderBindings = [];
    const draft = await service.createDraft({
      templateId: '1',
      agencyId: '10',
      actorId: '100',
      contract,
    });

    await expect(service.submitReview(draft.id, '100')).rejects.toMatchObject({
      code: 'CONTRACT_VALIDATION_FAILED',
    });
  });
});
