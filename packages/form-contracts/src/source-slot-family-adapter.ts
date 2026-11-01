/**
 * SourceSlotFamilyAdapter — contract for shared technical-family adapters.
 *
 * Each adapter addresses one of the 33 identified source-slot debt families
 * (SIGNATURE_SECTION, ISSUE_PLACE_DATE, RECIPIENT_COPY, CASE_INFO_BLOCK,
 * OFFICIAL_BLOCK, …). Adapters consume source-grounded evidence and emit
 * runtime render values. They are NOT a per-form code switch — they are
 * reusable technical-family implementations parameterised by per-form
 * source-target metadata.
 *
 * This module is intentionally free of runtime side effects; it is the
 * TypeScript contract that adapters and the runtime render core both
 * depend on.
 */

export type SourceSlotFamily =
  | 'SIGNATURE_SECTION'
  | 'ISSUE_PLACE_DATE'
  | 'DOCUMENT_BASIC'
  | 'RECIPIENT_COPY'
  | 'CASE_INFO_BLOCK'
  | 'OFFICIAL_BLOCK'
  | 'LEGAL_HEADER'
  | 'PROMULGATION'
  | 'MODEL_NUMBER'
  | 'CONDITIONAL_BOOLEAN'
  | 'REPEATER_REGION'
  | 'FLOATING_TEXTBOX'
  | 'TABLE_HEAVY'
  | 'SPLIT_RUN_PLACEHOLDER'
  | 'CONTENT_CONTROL_ALIAS'
  | 'OTHER';

/** Where a source target lives inside the source DOCX package. */
export interface SourceTargetIdentity {
  readonly docxPart:
    | 'word/document.xml'
    | 'word/header1.xml'
    | 'word/header2.xml'
    | 'word/header3.xml'
    | 'word/footer1.xml'
    | 'word/footer2.xml'
    | 'word/footer3.xml'
    | 'word/numbering.xml'
    | 'word/styles.xml'
    | 'word/settings.xml';
  readonly path: string; // xpath-like locator
  readonly occurrenceIndex: number;
  readonly structuralContext: 'paragraph' | 'table' | 'content-control' | 'sdt' | 'run' | 'floating-textbox';
  readonly sourceTextPreview: string; // first 80 chars of source text at target
  readonly sourceHash: string; // sha256 of the source XML fragment
  readonly renderStrategy:
    | 'INLINE_REPLACE'
    | 'CONTENT_CONTROL_BIND'
    | 'RUN_REPLACE'
    | 'TABLE_CELL_BIND'
    | 'PARAGRAPH_REPLACE'
    | 'FLOATING_TEXTBOX_BIND';
}

/** How a contract field is classified for runtime purposes. */
export type FieldClassification =
  | 'REQUIRED_SOURCE_SLOT'
  | 'DERIVED_COMPOUND_VALUE'
  | 'STATIC_SOURCE_TEXT'
  | 'DISPLAY_ONLY'
  | 'EDITOR_ONLY'
  | 'CONDITIONAL_SOURCE_SLOT'
  | 'REPEATED_SOURCE_REGION'
  | 'ROLE_DERIVED_VALUE'
  | 'GENUINE_SOURCE_ABSENT'
  | 'CONTRACT_REDUNDANT';

/** A render value emitted by the adapter. */
export interface RenderValue {
  readonly key: string;
  readonly value: string;
  readonly sourceTargetIdentity: SourceTargetIdentity;
  readonly classification: FieldClassification;
  readonly dependsOn?: readonly string[];
  readonly confidence: number; // 0..1
}

/** Lightweight per-form render context. */
export interface FormRenderContext {
  readonly formCode: string;
  readonly formInputs: Readonly<Record<string, unknown>>;
  readonly sourceTargets: readonly SourceTargetIdentity[];
  readonly family: SourceSlotFamily;
}

/** Validation context for a mapping verdict. */
export interface MappingValidationContext {
  readonly formCode: string;
  /** Family being validated; required for registry dispatch. */
  readonly family?: SourceSlotFamily;
  readonly contractFields: readonly { key: string; required: boolean }[];
  readonly sourceTargets: readonly SourceTargetIdentity[];
  readonly renderValues: readonly RenderValue[];
}

export type MappingVerdict =
  | { kind: 'PASS'; reason: string }
  | { kind: 'PASS_COMPOUND'; reason: string; compoundCoverage: readonly string[] }
  | { kind: 'FAIL'; reason: string; missingRequired: readonly string[]; staleR1Sources: readonly string[] };

/** The shared technical-family adapter interface. */
export interface SourceSlotFamilyAdapter {
  readonly family: SourceSlotFamily;
  supports(context: FormRenderContext): boolean;
  discoverSourceTargets(context: FormRenderContext): readonly SourceTargetIdentity[];
  classifyContractFields(context: FormRenderContext): readonly { key: string; classification: FieldClassification }[];
  buildRenderValues(context: FormRenderContext): readonly RenderValue[];
  validateMapping(context: MappingValidationContext): MappingVerdict;
}

/** Official role model for OFFICIAL_BLOCK family. */
export type OfficialRole =
  | 'ISSUING_OFFICIAL'
  | 'SIGNING_OFFICIAL'
  | 'RECEIVING_OFFICIAL'
  | 'PROSECUTOR'
  | 'INVESTIGATOR'
  | 'CLERK'
  | 'AGENCY_REPRESENTATIVE'
  | 'OTHER_SOURCE_DEFINED_ROLE';
