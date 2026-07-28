import type { FieldClassification, FormRenderContext, MappingValidationContext, MappingVerdict, RenderValue, SourceSlotFamilyAdapter, SourceTargetIdentity } from '../source-slot-family-adapter';

const KEY = 'recipients.archiveLine';

export class RecipientCopyAdapter implements SourceSlotFamilyAdapter {
  readonly family = 'RECIPIENT_COPY' as const;
  supports(context: FormRenderContext): boolean { return context.family === this.family; }
  discoverSourceTargets(): readonly SourceTargetIdentity[] { return []; }
  classifyContractFields(context: FormRenderContext): readonly { key: string; classification: FieldClassification }[] {
    return [{ key: KEY, classification: this.target(context) ? 'REQUIRED_SOURCE_SLOT' : 'GENUINE_SOURCE_ABSENT' }];
  }
  buildRenderValues(context: FormRenderContext): readonly RenderValue[] {
    const target = this.target(context);
    const value = context.formInputs[KEY];
    if (!target || typeof value !== 'string' || value.trim() === '') return [];
    return [{ key: KEY, value: value.trim(), sourceTargetIdentity: target, classification: 'REQUIRED_SOURCE_SLOT', confidence: 1 }];
  }
  validateMapping(context: MappingValidationContext): MappingVerdict {
    const required = context.contractFields.some((f) => f.required && f.key === KEY);
    if (!required) return { kind: 'PASS', reason: 'NO_RECIPIENT_COPY_REQUIRED' };
    const value = context.renderValues.find((v) => v.key === KEY);
    if (!value || value.value === '') return { kind: 'FAIL', reason: 'MISSING_REQUIRED_RECIPIENT_COPY_SOURCE', missingRequired: [KEY], staleR1Sources: [] };
    return { kind: 'PASS', reason: 'RECIPIENT_COPY_SOURCE_GROUNDED' };
  }
  private target(context: FormRenderContext) { return context.sourceTargets.find((t) => t.path === 'recipients/archiveLine'); }
}
export const RECIPIENT_COPY_ADAPTER = new RecipientCopyAdapter();
