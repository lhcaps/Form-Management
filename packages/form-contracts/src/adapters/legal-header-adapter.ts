import type {
  FieldClassification,
  FormRenderContext,
  MappingValidationContext,
  MappingVerdict,
  RenderValue,
  SourceSlotFamilyAdapter,
  SourceTargetIdentity,
} from '../source-slot-family-adapter';

const KEYS = [
  'agency.name',
  'agency.parentName',
  'agency.nameUpper',
  'agency.parentNameUpper',
  'agency.issuePlace',
] as const;

type LegalHeaderKey = (typeof KEYS)[number];

function targetPath(key: LegalHeaderKey): string {
  return key.replace('.', '/');
}

export class LegalHeaderAdapter implements SourceSlotFamilyAdapter {
  readonly family = 'LEGAL_HEADER' as const;

  supports(context: FormRenderContext): boolean {
    return context.family === this.family;
  }

  discoverSourceTargets(): readonly SourceTargetIdentity[] {
    return [];
  }

  classifyContractFields(
    context: FormRenderContext,
  ): readonly { key: string; classification: FieldClassification }[] {
    return KEYS.map((key) => ({
      key,
      classification: this.targetFor(context, key)
        ? 'REQUIRED_SOURCE_SLOT'
        : 'GENUINE_SOURCE_ABSENT',
    }));
  }

  buildRenderValues(context: FormRenderContext): readonly RenderValue[] {
    const values: RenderValue[] = [];
    for (const key of KEYS) {
      const value = context.formInputs[key];
      const target = this.targetFor(context, key);
      if (!target || typeof value !== 'string' || value.trim() === '') continue;
      values.push({
        key,
        value: value.trim(),
        sourceTargetIdentity: target,
        classification: 'REQUIRED_SOURCE_SLOT',
        confidence: 1,
      });
    }
    return values;
  }

  validateMapping(context: MappingValidationContext): MappingVerdict {
    const required = context.contractFields
      .filter((field) => field.required && KEYS.includes(field.key as LegalHeaderKey))
      .map((field) => field.key);
    const emitted = new Set(context.renderValues.map((value) => value.key));
    const missingRequired = required.filter((key) => !emitted.has(key));
    if (missingRequired.length > 0) {
      return {
        kind: 'FAIL',
        reason: 'MISSING_REQUIRED_LEGAL_HEADER_SOURCE',
        missingRequired,
        staleR1Sources: [],
      };
    }
    return { kind: 'PASS', reason: 'LEGAL_HEADER_SOURCE_GROUNDED' };
  }

  private targetFor(
    context: FormRenderContext,
    key: LegalHeaderKey,
  ): SourceTargetIdentity | undefined {
    return context.sourceTargets.find((target) => target.path === targetPath(key));
  }
}

export const LEGAL_HEADER_ADAPTER = new LegalHeaderAdapter();
