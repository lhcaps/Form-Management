/**
 * Phase D — Shared types for forms catalog API.
 */

export type ContractStatus = 'locked' | 'draft';

export interface StageInfo {
  code?: string;
  label?: string;
}

export interface FormCatalogItem {
  sourceId: string;
  templateCode: string;
  title: string;
  stageCode?: string;
  stageLabel?: string;
  status: ContractStatus;
  runtimeEligible: boolean;
  reviewRequired: boolean;
  genericFieldCount: number;
  lockedAt?: string;
}

export interface FormCatalogQuery {
  stage?: string;
  q?: string;
  status?: ContractStatus;
  sourceId?: string;
}

export interface RenderBinding {
  slotId: string;
  from: string;
  transform: string;
  fallback: string;
}

export interface LoadedFormContract {
  sourceId: string;
  templateCode: string;
  title: string;
  status: ContractStatus;
  documentKind: 'form';
  stage?: StageInfo;
  docxSlots: DocxSlot[];
  canonicalFields: CanonicalField[];
  renderBindings: RenderBinding[];
  runtimeEligible: boolean;
  needsReview: boolean;
  genericFieldCount: number;
  fieldsNeedingReviewCount: number;
  lockedAt?: string;
}

export interface DocxSlot {
  slotId: string;
  required: boolean;
  reviewRequired: boolean;
  context?: string;
  label?: string;
  location?: {
    partName: string;
    blockId: string | null;
    tableCellId: string | null;
  };
}

export interface CanonicalField {
  path: string;
  type: string;
  source?: string;
  uiComponent?: string;
  section?: string;
  required?: boolean;
  transform?: string;
}
