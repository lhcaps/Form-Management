/**
 * Adapter registry — single source of truth for shared technical-family
 * adapters (SIGNATURE_SECTION, ISSUE_PLACE_DATE, RECIPIENT_COPY, …).
 *
 * Phase 2 of the 18-phase rollout. The previous Phase 0 reconciliation
 * surfaced 33 debt families across 205 forms; this registry is the
 * mechanism the runtime mapping/render pipeline (build-slot-inventory,
 * compute-canonical-verdicts, render-runtime-batch, per-form
 * reconciliation, promotion gate) will use to share adapter logic
 * instead of maintaining per-form code switches.
 *
 * Behavioural guarantees:
 *   - Deterministic adapter ordering (registration order is canonical).
 *   - Explicit precedence (the first adapter that supports a family wins).
 *   - Collision detection at registration time.
 *   - Duplicate target detection at discover-time.
 *   - Compound-field composition support (multiple adapters can emit
 *     RenderValues for the same FormRenderContext).
 *   - No sibling-form mappings (per the prompt).
 *   - No static legal-text replacement.
 *   - No adapter silently claims unsupported fields (the resolver will
 *     leave missing required fields as SOURCE_SLOT_DEBT).
 *
 * This module is contract-only: it does not mutate any other artifact,
 * it just composes adapter executions. Adapters themselves remain free
 * of side effects.
 */

import type {
  SourceSlotFamilyAdapter,
  FormRenderContext,
  MappingValidationContext,
  SourceTargetIdentity,
  RenderValue,
  FieldClassification,
  MappingVerdict,
} from '../source-slot-family-adapter';

export interface ClassifiedField {
  readonly key: string;
  readonly classification: FieldClassification;
  readonly familyId: string;
}

export interface AdapterResolution {
  readonly formCode: string;
  readonly matchedAdapters: readonly SourceSlotFamilyAdapter[];
  readonly targets: readonly SourceTargetIdentity[];
  readonly renderValues: readonly RenderValue[];
  readonly fieldClassifications: readonly ClassifiedField[];
  readonly verdict: MappingVerdict;
  readonly collisionFindings: readonly string[];
  readonly duplicateTargetFindings: readonly string[];
}

export class AdapterRegistry {
  private readonly adapters: SourceSlotFamilyAdapter[] = [];
  private readonly byFamily: Map<string, SourceSlotFamilyAdapter> = new Map();

  /**
   * Register an adapter. Adapters for the same family are rejected as
   * collisions; the registration order is preserved for iteration so
   * precedence is deterministic.
   */
  register(adapter: SourceSlotFamilyAdapter): void {
    const existing = this.byFamily.get(adapter.family);
    if (existing) {
      throw new Error(
        `AdapterRegistry: family ${adapter.family} already registered by ${existing.constructor.name}; cannot also register ${adapter.constructor.name}`,
      );
    }
    this.adapters.push(adapter);
    this.byFamily.set(adapter.family, adapter);
  }

  /** The registered adapters in registration order. */
  list(): readonly SourceSlotFamilyAdapter[] {
    return [...this.adapters];
  }

  has(familyId: string): boolean {
    return this.byFamily.has(familyId);
  }

  /** Resolve the adapters whose `supports()` returns true for this context. */
  resolveForForm(context: FormRenderContext): SourceSlotFamilyAdapter[] {
    return this.adapters.filter((a) => a.supports(context));
  }

  /**
   * Aggregate `discoverSourceTargets()` across all matching adapters.
   * Detects duplicate targets (same docxPart + path + occurrenceIndex).
   */
  discoverTargets(context: FormRenderContext): {
    targets: SourceTargetIdentity[];
    duplicates: string[];
  } {
    const matched = this.resolveForForm(context);
    const all: SourceTargetIdentity[] = [];
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const adapter of matched) {
      for (const t of adapter.discoverSourceTargets(context)) {
        const key = `${t.docxPart}::${t.path}::${t.occurrenceIndex}`;
        if (seen.has(key)) {
          duplicates.push(
            `${context.formCode} duplicate target ${key} from ${adapter.family}`,
          );
          continue;
        }
        seen.add(key);
        all.push(t);
      }
    }
    return { targets: all, duplicates };
  }

  /**
   * Aggregate `classifyContractFields()` across matching adapters. The
   * first adapter to claim a key wins; later classifications for the
   * same key are surfaced as collision findings.
   */
  classifyFields(context: FormRenderContext): {
    classifications: ClassifiedField[];
    collisionFindings: string[];
  } {
    const matched = this.resolveForForm(context);
    const out: ClassifiedField[] = [];
    const claimed = new Map<string, string>();
    const collisionFindings: string[] = [];
    for (const adapter of matched) {
      for (const cf of adapter.classifyContractFields(context)) {
        const prior = claimed.get(cf.key);
        if (prior) {
          collisionFindings.push(
            `${context.formCode} field ${cf.key} claimed by both ${prior} and ${adapter.family}`,
          );
          continue;
        }
        claimed.set(cf.key, adapter.family);
        out.push({
          key: cf.key,
          classification: cf.classification,
          familyId: adapter.family,
        });
      }
    }
    return { classifications: out, collisionFindings };
  }

  /**
   * Aggregate `buildRenderValues()` across matching adapters. The first
   * adapter to emit a key wins; later values for the same key are
   * surfaced as collision findings.
   */
  buildRenderValues(context: FormRenderContext): {
    renderValues: RenderValue[];
    collisionFindings: string[];
  } {
    const matched = this.resolveForForm(context);
    const out: RenderValue[] = [];
    const claimed = new Map<string, string>();
    const collisionFindings: string[] = [];
    for (const adapter of matched) {
      const rvs = adapter.buildRenderValues(context);
      for (const rv of rvs) {
        const prior = claimed.get(rv.key);
        if (prior) {
          collisionFindings.push(
            `${context.formCode} render key ${rv.key} emitted by both ${prior} and ${adapter.family}`,
          );
          continue;
        }
        claimed.set(rv.key, adapter.family);
        out.push(rv);
      }
    }
    return { renderValues: out, collisionFindings };
  }

  /**
   * Compose a single mapping verdict from all matching adapters. The
   * first FAIL wins (fail-closed); otherwise if any adapter reports
   * PASS_COMPOUND, that wins; otherwise PASS.
   */
  validate(context: MappingValidationContext): AdapterResolution {
    const matched = this.resolveForForm({
      formCode: context.formCode,
      formInputs: {},
      sourceTargets: context.sourceTargets,
      family: context.family ?? 'OTHER',
    });
    const discovery = this.discoverTargets({
      formCode: context.formCode,
      formInputs: {},
      sourceTargets: context.sourceTargets,
      family: context.family ?? 'OTHER',
    });
    const fieldInfo = this.classifyFields({
      formCode: context.formCode,
      formInputs: {},
      sourceTargets: context.sourceTargets,
      family: context.family ?? 'OTHER',
    });
    const renderInfo = this.buildRenderValues({
      formCode: context.formCode,
      formInputs: {},
      sourceTargets: context.sourceTargets,
      family: context.family ?? 'OTHER',
    });

    let verdict: MappingVerdict = {
      kind: 'PASS',
      reason: 'NO_ADAPTER_MATCHED',
    };
    // Compose the highest-severity verdict across all matching adapters.
    // FAIL trumps everything; PASS_COMPOUND trumps PASS. We must check
    // every adapter for FAIL before settling on PASS_COMPOUND.
    let firstPassCompound: MappingVerdict | null = null;
    let firstPass: MappingVerdict | null = null;
    let failVerdict: MappingVerdict | null = null;
    for (const adapter of matched) {
      const v = adapter.validateMapping(context);
      if (v.kind === 'FAIL') {
        failVerdict = v;
        break;
      }
      if (v.kind === 'PASS_COMPOUND' && firstPassCompound === null) {
        firstPassCompound = v;
      }
      if (v.kind === 'PASS' && firstPass === null) {
        firstPass = v;
      }
    }
    if (failVerdict) {
      verdict = failVerdict;
    } else if (firstPassCompound) {
      verdict = firstPassCompound;
    } else if (firstPass) {
      verdict = firstPass;
    }

    return {
      formCode: context.formCode,
      matchedAdapters: matched,
      targets: discovery.targets,
      renderValues: renderInfo.renderValues,
      fieldClassifications: fieldInfo.classifications,
      verdict,
      collisionFindings: [...fieldInfo.collisionFindings, ...renderInfo.collisionFindings],
      duplicateTargetFindings: discovery.duplicates,
    };
  }
}

/** The default registry has no adapters pre-registered. */
export function buildEmptyRegistry(): AdapterRegistry {
  return new AdapterRegistry();
}
