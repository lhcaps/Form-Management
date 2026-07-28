import type {
  FieldClassification,
  FormRenderContext,
  MappingValidationContext,
  MappingVerdict,
  RenderValue,
  SourceSlotFamilyAdapter,
  SourceTargetIdentity,
} from '../source-slot-family-adapter';

const KEY = 'document.documentCode';

export class DocumentBasicAdapter implements SourceSlotFamilyAdapter {
  readonly family = 'DOCUMENT_BASIC' as const;

  supports(context: FormRenderContext): boolean {
    return context.family === this.family;
  }

  discoverSourceTargets(): readonly SourceTargetIdentity[] {
    return [];
  }

  classifyContractFields(
    context: FormRenderContext,
  ): readonly { key: string; classification: FieldClassification }[] {
    return [{
      key: KEY,
      classification: this.targetFor(context)
        ? 'REQUIRED_SOURCE_SLOT'
        : 'GENUINE_SOURCE_ABSENT',
    }];
  }

  buildRenderValues(context: FormRenderContext): readonly RenderValue[] {
    const value = context.formInputs[KEY];
    const target = this.targetFor(context);
    if (!target || typeof value !== 'string' || value.trim() === '') return [];
    return [{
      key: KEY,
      value: value.trim(),
      sourceTargetIdentity: target,
      classification: 'REQUIRED_SOURCE_SLOT',
      confidence: 1,
    }];
  }

  validateMapping(context: MappingValidationContext): MappingVerdict {
    const required = context.contractFields.some((field) => field.required && field.key === KEY);
    if (!required) return { kind: 'PASS', reason: 'NO_DOCUMENT_CODE_REQUIRED' };
    if (context.renderValues.some((value) => value.key === KEY && value.value !== '')) {
      return { kind: 'PASS', reason: 'DOCUMENT_CODE_SOURCE_GROUNDED' };
    }
    return {
      kind: 'FAIL',
      reason: 'MISSING_REQUIRED_DOCUMENT_CODE_SOURCE',
      missingRequired: [KEY],
      staleR1Sources: [],
    };
  }

  private targetFor(context: FormRenderContext): SourceTargetIdentity | undefined {
    return context.sourceTargets.find((target) => target.path === 'document/documentCode');
  }
}

export const DOCUMENT_BASIC_ADAPTER = new DocumentBasicAdapter();
