import type {
  CompiledFormContract,
  ContractStatus,
  FormContractV2,
} from '@qllaw/form-contracts';

export type FormContractVersionRecord = {
  id: string;
  templateId: string;
  agencyId: string | null;
  version: number;
  status: ContractStatus;
  revision: number;
  contract: FormContractV2;
  compiledContract: CompiledFormContract | null;
  createdByOfficialId: string;
  approvedByOfficialId: string | null;
  publishedByOfficialId: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  publishedAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RevisionRecord = {
  contractVersionId: string;
  revision: number;
  operationType: string;
  operations: unknown[];
  snapshot: FormContractV2;
  actorOfficialId: string;
  createdAt: Date;
};

export type ReviewRecord = {
  contractVersionId: string;
  revision: number;
  action: 'SUBMITTED' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED';
  comment: string | null;
  actorOfficialId: string;
  createdAt: Date;
};

export abstract class FormContractVersionRepository {
  abstract create(
    record: Omit<FormContractVersionRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<FormContractVersionRecord>;
  abstract findById(id: string): Promise<FormContractVersionRecord | null>;
  abstract list(input?: {
    agencyId?: string | null;
    templateId?: string;
    status?: ContractStatus;
  }): Promise<FormContractVersionRecord[]>;
  abstract save(
    record: FormContractVersionRecord,
    revision?: RevisionRecord,
  ): Promise<FormContractVersionRecord>;
  abstract addReview(review: ReviewRecord): Promise<void>;
  abstract archivePublishedBefore(
    templateId: string,
    agencyId: string | null,
    exceptId: string,
  ): Promise<void>;
  abstract deleteDraft(id: string): Promise<void>;
}
