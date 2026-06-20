import { Injectable } from '@nestjs/common';
import {
  compileContract,
  type ContractIssue,
  type FormContractV2,
} from '@qllaw/form-contracts';
import {
  applyDraftOperations,
  type DraftOperation,
} from '../domain/draft-operation';
import { FormStudioError } from '../domain/form-studio.error';
import {
  FormContractVersionRepository,
  type FormContractVersionRecord,
} from './form-contract-version.repository';

@Injectable()
export class FormStudioService {
  constructor(private readonly repository: FormContractVersionRepository) {}

  list(input?: {
    agencyId?: string | null;
    templateId?: string;
    status?: FormContractVersionRecord['status'];
  }) {
    return this.repository.list(input);
  }

  async get(id: string): Promise<FormContractVersionRecord> {
    const record = await this.repository.findById(id);
    if (!record) {
      throw new FormStudioError(
        'FORM_DRAFT_NOT_FOUND',
        'Không tìm thấy phiên bản biểu mẫu.',
        404,
      );
    }
    return record;
  }

  async createDraft(input: {
    templateId: string;
    agencyId: string | null;
    actorId: string;
    contract: FormContractV2;
  }): Promise<FormContractVersionRecord> {
    const contract = structuredClone(input.contract);
    contract.agencyId = input.agencyId;
    contract.status = 'DRAFT';
    contract.contractHash = '';
    return this.repository.create({
      templateId: input.templateId,
      agencyId: input.agencyId,
      version: contract.version,
      status: 'DRAFT',
      revision: 0,
      contract,
      compiledContract: null,
      createdByOfficialId: input.actorId,
      approvedByOfficialId: null,
      publishedByOfficialId: null,
      submittedAt: null,
      approvedAt: null,
      publishedAt: null,
      archivedAt: null,
    });
  }

  async patchDraft(
    id: string,
    input: { expectedRevision: number; operations: DraftOperation[] },
    actorId: string,
  ): Promise<FormContractVersionRecord> {
    const current = await this.get(id);
    if (current.status === 'PUBLISHED' || current.status === 'ARCHIVED') {
      throw new FormStudioError(
        'PUBLISHED_VERSION_IMMUTABLE',
        'Phiên bản đã publish không thể chỉnh sửa.',
        409,
      );
    }
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(current.status)) {
      throw new FormStudioError(
        'DRAFT_NOT_EDITABLE',
        'Bản nháp đang được duyệt và không thể chỉnh sửa.',
        409,
      );
    }
    if (current.revision !== input.expectedRevision) {
      throw new FormStudioError(
        'DRAFT_REVISION_CONFLICT',
        'Bản nháp đã thay đổi ở phiên làm việc khác.',
        409,
        {
          expectedRevision: input.expectedRevision,
          currentRevision: current.revision,
        },
      );
    }

    let contract: FormContractV2;
    try {
      contract = applyDraftOperations(current.contract, input.operations);
    } catch (error) {
      throw new FormStudioError(
        'DRAFT_OPERATION_INVALID',
        (error as Error).message,
        400,
      );
    }
    const revision = current.revision + 1;
    return this.repository.save(
      {
        ...current,
        revision,
        status: 'DRAFT',
        contract,
        compiledContract: null,
        approvedByOfficialId: null,
        approvedAt: null,
      },
      {
        contractVersionId: current.id,
        revision,
        operationType: 'PATCH',
        operations: input.operations,
        snapshot: contract,
        actorOfficialId: actorId,
        createdAt: new Date(),
      },
    );
  }

  async validate(id: string): Promise<{
    valid: boolean;
    issues: ContractIssue[];
  }> {
    const record = await this.get(id);
    const result = compileContract(record.contract);
    return { valid: result.ok, issues: result.issues };
  }

  async submitReview(
    id: string,
    actorId: string,
  ): Promise<FormContractVersionRecord> {
    const current = await this.get(id);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(current.status)) {
      throw new FormStudioError(
        'INVALID_REVIEW_TRANSITION',
        'Chỉ bản nháp có thể gửi duyệt.',
        409,
      );
    }
    this.assertPublishableContract(current.contract);
    const submittedAt = new Date();
    const saved = await this.repository.save({
      ...current,
      status: 'IN_REVIEW',
      contract: { ...current.contract, status: 'IN_REVIEW' },
      submittedAt,
    });
    await this.repository.addReview({
      contractVersionId: current.id,
      revision: current.revision,
      action: 'SUBMITTED',
      comment: null,
      actorOfficialId: actorId,
      createdAt: submittedAt,
    });
    return saved;
  }

  async requestChanges(
    id: string,
    actorId: string,
    comment: string,
  ): Promise<FormContractVersionRecord> {
    const current = await this.get(id);
    if (current.status !== 'IN_REVIEW') {
      throw new FormStudioError(
        'INVALID_REVIEW_TRANSITION',
        'Phiên bản không ở trạng thái chờ duyệt.',
        409,
      );
    }
    const saved = await this.repository.save({
      ...current,
      status: 'CHANGES_REQUESTED',
      contract: { ...current.contract, status: 'CHANGES_REQUESTED' },
    });
    await this.repository.addReview({
      contractVersionId: current.id,
      revision: current.revision,
      action: 'CHANGES_REQUESTED',
      comment,
      actorOfficialId: actorId,
      createdAt: new Date(),
    });
    return saved;
  }

  async approve(
    id: string,
    actorId: string,
    comment: string | null = null,
  ): Promise<FormContractVersionRecord> {
    const current = await this.get(id);
    if (current.status !== 'IN_REVIEW') {
      throw new FormStudioError(
        'INVALID_REVIEW_TRANSITION',
        'Phiên bản không ở trạng thái chờ duyệt.',
        409,
      );
    }
    if (current.createdByOfficialId === actorId) {
      throw new FormStudioError(
        'SELF_APPROVAL_FORBIDDEN',
        'Người tạo bản nháp không được tự phê duyệt.',
        403,
      );
    }
    this.assertPublishableContract(current.contract);
    const approvedAt = new Date();
    const saved = await this.repository.save({
      ...current,
      status: 'APPROVED',
      contract: { ...current.contract, status: 'APPROVED' },
      approvedByOfficialId: actorId,
      approvedAt,
    });
    await this.repository.addReview({
      contractVersionId: current.id,
      revision: current.revision,
      action: 'APPROVED',
      comment,
      actorOfficialId: actorId,
      createdAt: approvedAt,
    });
    return saved;
  }

  async publish(
    id: string,
    actorId: string,
  ): Promise<FormContractVersionRecord> {
    const current = await this.get(id);
    if (current.status !== 'APPROVED') {
      throw new FormStudioError(
        'VERSION_NOT_APPROVED',
        'Phiên bản phải được phê duyệt trước khi publish.',
        409,
      );
    }
    const publishSource: FormContractV2 = {
      ...current.contract,
      status: 'PUBLISHED',
      contractHash: '',
    };
    const result = compileContract(publishSource);
    if (!result.ok || !result.artifact) {
      throw new FormStudioError(
        'CONTRACT_VALIDATION_FAILED',
        'Contract không vượt qua publish gate.',
        422,
        result.issues,
      );
    }
    const publishedAt = new Date();
    const saved = await this.repository.save({
      ...current,
      status: 'PUBLISHED',
      contract: result.artifact.source,
      compiledContract: result.artifact,
      publishedByOfficialId: actorId,
      publishedAt,
    });
    await this.repository.archivePublishedBefore(
      saved.templateId,
      saved.agencyId,
      saved.id,
    );
    return saved;
  }

  async archive(
    id: string,
    actorId: string,
  ): Promise<FormContractVersionRecord> {
    void actorId;
    const current = await this.get(id);
    if (current.status !== 'PUBLISHED') {
      throw new FormStudioError(
        'ONLY_PUBLISHED_CAN_ARCHIVE',
        'Chỉ phiên bản đã publish mới có thể archive.',
        409,
      );
    }
    return this.repository.save({
      ...current,
      status: 'ARCHIVED',
      contract: { ...current.contract, status: 'ARCHIVED' },
      archivedAt: new Date(),
    });
  }

  async deleteDraft(id: string): Promise<void> {
    const current = await this.get(id);
    if (!['DRAFT', 'CHANGES_REQUESTED'].includes(current.status)) {
      throw new FormStudioError(
        'DRAFT_DELETE_FORBIDDEN',
        'Chỉ draft đang chỉnh sửa mới có thể xóa.',
        409,
      );
    }
    await this.repository.deleteDraft(id);
  }

  private assertPublishableContract(contract: FormContractV2): void {
    if (!contract.normalizedDocxPath) {
      throw new FormStudioError(
        'NORMALIZED_DOCX_REQUIRED',
        'Biểu mẫu cần DOCX chuẩn hóa trước khi gửi duyệt.',
        422,
      );
    }
    const result = compileContract(contract);
    if (!result.ok) {
      throw new FormStudioError(
        'CONTRACT_VALIDATION_FAILED',
        'Contract chưa vượt qua validation gate.',
        422,
        result.issues,
      );
    }
  }
}
