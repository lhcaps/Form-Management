import type {
  CompiledFormContract,
  FormContractV2,
} from '@qllaw/form-contracts';

/** Quality grade assigned to an authoring baseline. */
export type QualityGrade =
  | 'LOCKED_VERIFIED'
  | 'EXTRACTED_NEEDS_REVIEW'
  | 'GENERIC_FALLBACK';

/**
 * Provenance of the authoring baseline's source.
 * Tracks where the baseline came from so operators know how much to trust it.
 */
export type SourceProvenance = {
  source:
    | 'AGENCY_DRAFT'
    | 'AGENCY_PUBLISHED'
    | 'GLOBAL_PUBLISHED'
    | 'LOCKED_V1'
    | 'DRAFT_V1'
    | 'VIRTUAL_FROM_DOCX';
  sourceId: string | null;
  v1Status: 'locked' | 'draft' | null;
  extractionHash: string | null;
};

/**
 * Warning flags that require human review before publishing.
 */
export type AuthoringWarning = {
  code: string;
  message: string;
  fieldCount?: number;
};

/**
 * A virtual authoring baseline — produced by the AuthoringContractResolver
 * without writing to the database. This is the canonical representation
 * of what Form Studio renders as the starting point for a new draft.
 */
export type AuthoringBaseline = {
  templateCode: string;
  title: string;
  templateId: string;

  /** Path to the normalized DOCX that is the layout authority. */
  normalizedDocxPath: string | null;
  /** Hash of the normalized DOCX file. */
  templateHash: string | null;

  /**
   * The V2 contract source from adapting V1 or inheriting from published.
   * Does NOT include contractHash (computed at compile time).
   */
  baselineContract: FormContractV2;
  compiledBaseline: CompiledFormContract | null;

  provenance: SourceProvenance;
  quality: {
    grade: QualityGrade;
    fieldCount: number;
    bindingCount: number;
    unresolvedCount: number;
    warnings: AuthoringWarning[];
  };

  /**
   * Whether the baseline can be opened as an editable draft.
   * READ_ONLY means the baseline is locked/published and the user can
   * only create a new version from it.
   */
  mode: 'EDIT' | 'READ_ONLY' | 'CREATE_VERSION';

  /**
   * Id of an existing agency draft that can be resumed, if any.
   * Only set when mode === 'EDIT' and a draft already exists.
   */
  existingDraftId: string | null;
};

/**
 * Resolved authoring baseline with a database record attached.
 * Returned after materialize() succeeds — this is what gets sent to
 * the Form Studio editor.
 */
export type MaterializedDraft = {
  draftId: string;
  baseline: AuthoringBaseline;
};

/**
 * Result of resolving a baseline for catalog display (non-editing).
 * Same as AuthoringBaseline but without the existingDraftId (catalog
 * does not open drafts, only reports their state).
 */
export type CatalogBaseline = Omit<AuthoringBaseline, 'existingDraftId'>;

export type ResolveOptions = {
  agencyId: string | null;
  actorId: string;
};
