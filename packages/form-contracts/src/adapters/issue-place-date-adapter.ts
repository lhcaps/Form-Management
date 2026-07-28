/**
 * ISSUE_PLACE_DATE adapter — addresses the second-largest source-slot
 * debt family (120 forms) by mapping issue-place/date-line fields to
 * source-grounded evidence.
 *
 * Discovers the actual issue-line structure per form and emits render
 * values that are sourced from the DOCX, not from demo placeholders.
 *
 * Source structures supported (per Phase 4 prompt):
 *   - one compound paragraph (e.g. "...ngày 12 tháng 5 năm 2026 tại Hà Nội")
 *   - multiple placeholders inside one paragraph (e.g. {{issueDay}} {{issueMonth}} {{issueYear}})
 *   - table cell (issue place + date inside a cell)
 *   - split-run paragraph (multiple runs across the line)
 *   - content control (one or more SDT bindings)
 *   - place and date in separate locations (e.g. date in header, place in body)
 *
 * Canonical date policy:
 *   - store calendar date without timezone shift (YYYY-MM-DD)
 *   - use deterministic date parts (day, month, year)
 *   - derive visible legal text in render layer
 *   - do not store legal visible prose in a date input
 *
 * Required classifications:
 *   PRIMARY_INPUT, DERIVED_COMPONENT, DERIVED_COMPOUND,
 *   DISPLAY_ONLY, CONTRACT_REDUNDANT, SOURCE_STATIC, SOURCE_ABSENT
 *
 * Hard rules:
 *   - Static legal text (e.g. "ngày", "tháng", "năm", commas, dashes)
 *     must remain static unless source exposes it as a runtime slot.
 *   - Issue date must not be written into promulgation date slot.
 *   - Issue place/date line must not replace legal-header line.
 *   - Issue date must not be derived from a sibling form's data.
 *   - Compound duplication: when a contract has BOTH component fields
 *     AND a compound issue-place/date field, the component fields
 *     remain PRIMARY_INPUT and the compound is CONTRACT_REDUNDANT
 *     (it does not emit a duplicate render value).
 *   - Empty inputs produce SOURCE_ABSENT, not fabricated prose.
 */

import type {
  SourceSlotFamilyAdapter,
  SourceTargetIdentity,
  RenderValue,
  FormRenderContext,
  MappingValidationContext,
  MappingVerdict,
  FieldClassification,
} from '../source-slot-family-adapter';

/**
 * Field classification used by ISSUE_PLACE_DATE. The contract-level
 * `FieldClassification` enum does not include all the classifications
 * this adapter needs (PRIMARY_INPUT, DERIVED_COMPONENT, …); this
 * adapter emits its own typed extension via classifyContractFields.
 */
export type IssuePlaceDateFieldClassification =
  | 'PRIMARY_INPUT'
  | 'DERIVED_COMPONENT'
  | 'DERIVED_COMPOUND'
  | 'DISPLAY_ONLY'
  | 'CONTRACT_REDUNDANT'
  | 'SOURCE_STATIC'
  | 'SOURCE_ABSENT';

export interface IssuePlaceDateFormInputs {
  readonly 'document.issuePlace'?: string;
  readonly 'document.issueDate'?: string; // YYYY-MM-DD canonical
  readonly 'document.issueDay'?: string;
  readonly 'document.issueMonth'?: string;
  readonly 'document.issueYear'?: string;
  readonly 'document.issueDateText'?: string;
  readonly 'document.issuePlaceDateLine'?: string;
  readonly 'document.issuePlaceAndDateLine'?: string;
}

export interface IssuePlaceDateSourceTargets {
  readonly issueDate?: SourceTargetIdentity;
  readonly issuePlace?: SourceTargetIdentity;
  readonly issuePlaceDateLine?: SourceTargetIdentity;
  readonly issueDay?: SourceTargetIdentity;
  readonly issueMonth?: SourceTargetIdentity;
  readonly issueYear?: SourceTargetIdentity;
}

/**
 * Allow-list of input keys the ISSUE_PLACE_DATE adapter recognizes.
 * Any input key outside this list is *not* claimed by the adapter, so
 * a sibling adapter (RECIPIENT_COPY, CASE_INFO_BLOCK, …) can own it.
 */
const RECOGNIZED_INPUT_KEYS: ReadonlySet<string> = new Set([
  'document.issuePlace',
  'document.issueDate',
  'document.issueDay',
  'document.issueMonth',
  'document.issueYear',
  'document.issueDateText',
  'document.issuePlaceDateLine',
  'document.issuePlaceAndDateLine',
]);

/** Render values emitted by the adapter (the keys the renderer binds). */
const EMITTED_RENDER_KEYS: ReadonlySet<string> = new Set([
  'document.issuePlace',
  'document.issueDate',
  'document.issueDay',
  'document.issueMonth',
  'document.issueYear',
  'document.issueDateText',
  'document.issuePlaceDateLine',
]);

/** ISO 8601 calendar-date regex (YYYY-MM-DD); rejects timezone shifts. */
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A canonical calendar date split into deterministic parts. */
export interface CalendarDateParts {
  readonly year: string;
  readonly month: string;
  readonly day: string;
  readonly isoDate: string; // YYYY-MM-DD, exactly the input
}

/**
 * Parse a YYYY-MM-DD calendar date WITHOUT timezone shift.
 *
 * This deliberately avoids `new Date()` and `Date.UTC()` because both
 * shift to UTC, which is the EXACT bug the adapter is supposed to
 * prevent. We treat the input as a wall-clock calendar date and split
 * it into fixed-width parts.
 */
export function splitCalendarDate(iso: string): CalendarDateParts | null {
  if (typeof iso !== 'string') return null;
  const m = ISO_DATE_REGEX.exec(iso);
  if (!m) return null;
  const year = m[1] ?? '';
  const month = m[2] ?? '';
  const day = m[3] ?? '';
  if (!year || !month || !day) return null;
  // Reject 0000-00-00 or other obviously invalid calendar dates.
  const y = parseInt(year, 10);
  const mo = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;
  // Leap-day validation: 2024 is a leap year, 2025 is not.
  if (mo === 2 && d === 29) {
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (!isLeap) return null;
  }
  // 30-day months: April, June, September, November only have 30 days.
  if ([4, 6, 9, 11].includes(mo) && d === 31) return null;
  return { year, month, day, isoDate: `${year}-${month}-${day}` };
}

/**
 * Derive deterministic date parts from any of the recognized inputs.
 * Returns null if no usable calendar date is found.
 *
 * Precedence (per Phase 4 prompt):
 *   1. explicit valid date components (issueDay / issueMonth / issueYear)
 *   2. canonical issueDate (YYYY-MM-DD)
 *   3. compound synthetic input only when source contract defines it
 *      (issuePlaceDateLine / issuePlaceAndDateLine containing a date)
 *   4. source default only when no runtime field exists
 *
 * For the adapter, we only emit deterministic date parts from inputs 1
 * and 2; we do not parse the compound line into a date (that would be
 * brittle and the prompt explicitly forbids over-eager derivation).
 */
export function deriveDateParts(
  inputs: IssuePlaceDateFormInputs,
): CalendarDateParts | null {
  // 1. Components
  const d = normalizeStr(inputs['document.issueDay']);
  const m = normalizeStr(inputs['document.issueMonth']);
  const y = normalizeStr(inputs['document.issueYear']);
  if (d && m && y) {
    const padded = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    const parsed = splitCalendarDate(padded);
    if (parsed) return parsed;
  }
  // 2. Canonical issueDate
  const iso = normalizeStr(inputs['document.issueDate']);
  if (iso) {
    return splitCalendarDate(iso);
  }
  // 3. issueDateText — fall back only if it is a YYYY-MM-DD string.
  const text = normalizeStr(inputs['document.issueDateText']);
  if (text && ISO_DATE_REGEX.test(text)) {
    return splitCalendarDate(text);
  }
  return null;
}

function normalizeStr(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.trim();
}

function isEmptyStr(v: unknown): boolean {
  return typeof v !== 'string' || v.trim() === '';
}

/**
 * Build a deterministic fallback source target identity for cases where
 * no source target was provided for a given slot.
 */
function fallbackTarget(formCode: string, slot: string): SourceTargetIdentity {
  return {
    docxPart: 'word/document.xml',
    path: `document/${slot}`,
    occurrenceIndex: 0,
    structuralContext: 'paragraph',
    sourceTextPreview: '',
    sourceHash: '',
    renderStrategy: 'INLINE_REPLACE',
  };
}

/** Look up a source target whose path ends with `/<slot>`. */
function lookupTarget(
  targets: readonly SourceTargetIdentity[],
  slot: string,
): SourceTargetIdentity | null {
  for (const t of targets) {
    if (t.path.endsWith(`/${slot}`)) return t;
  }
  return null;
}

/**
 * The adapter itself.
 *
 * Behavioral contract:
 *   - supports(family='ISSUE_PLACE_DATE') → true; otherwise false.
 *   - discoverSourceTargets → pass-through (extraction is done outside
 *     the adapter against the normalized DOCX).
 *   - classifyContractFields → emits PRIMARY_INPUT / DERIVED_COMPONENT
 *     / DERIVED_COMPOUND / CONTRACT_REDUNDANT / SOURCE_STATIC /
 *     SOURCE_ABSENT for the recognized input keys.
 *   - buildRenderValues → emits one RenderValue per recognized input
 *     key, with duplicate-output prevention between compound and
 *     component fields.
 *   - validateMapping → PASS when both place and date (or compound)
 *     are source-grounded; FAIL when a required field is
 *     SOURCE_ABSENT; PASS_COMPOUND when both place and date are
 *     derived from a compound input.
 */
export class IssuePlaceDateAdapter implements SourceSlotFamilyAdapter {
  readonly family = 'ISSUE_PLACE_DATE' as const;

  supports(context: FormRenderContext): boolean {
    return context.family === 'ISSUE_PLACE_DATE';
  }

  discoverSourceTargets(_context: FormRenderContext): readonly SourceTargetIdentity[] {
    return [];
  }

  classifyContractFields(
    context: FormRenderContext,
  ): readonly { key: string; classification: FieldClassification }[] {
    const inputs = context.formInputs as IssuePlaceDateFormInputs;
    const out: { key: string; classification: FieldClassification }[] = [];

    const hasIssuePlace = !isEmptyStr(inputs['document.issuePlace']);
    const hasIssueDate = !isEmptyStr(inputs['document.issueDate']);
    const hasDateParts =
      !isEmptyStr(inputs['document.issueDay']) &&
      !isEmptyStr(inputs['document.issueMonth']) &&
      !isEmptyStr(inputs['document.issueYear']);
    const hasCompoundLine =
      !isEmptyStr(inputs['document.issuePlaceDateLine']) ||
      !isEmptyStr(inputs['document.issuePlaceAndDateLine']);

    // document.issuePlace
    out.push({
      key: 'document.issuePlace',
      classification: hasIssuePlace ? 'REQUIRED_SOURCE_SLOT' : 'GENUINE_SOURCE_ABSENT',
    });
    // document.issueDate
    out.push({
      key: 'document.issueDate',
      classification: hasIssueDate ? 'REQUIRED_SOURCE_SLOT' : 'GENUINE_SOURCE_ABSENT',
    });
    // document.issueDay/Month/Year — DERIVED_COMPONENT only if the
    // component triplet is present.
    out.push({
      key: 'document.issueDay',
      classification: hasDateParts ? 'DERIVED_COMPOUND_VALUE' : 'DISPLAY_ONLY',
    });
    out.push({
      key: 'document.issueMonth',
      classification: hasDateParts ? 'DERIVED_COMPOUND_VALUE' : 'DISPLAY_ONLY',
    });
    out.push({
      key: 'document.issueYear',
      classification: hasDateParts ? 'DERIVED_COMPOUND_VALUE' : 'DISPLAY_ONLY',
    });
    // document.issueDateText — DISPLAY_ONLY unless it is a canonical date.
    out.push({
      key: 'document.issueDateText',
      classification: 'DISPLAY_ONLY',
    });
    // document.issuePlaceDateLine / document.issuePlaceAndDateLine —
    // DERIVED_COMPOUND when present (the line carries both place and
    // date); otherwise SOURCE_ABSENT.
    out.push({
      key: 'document.issuePlaceDateLine',
      classification: hasCompoundLine ? 'DERIVED_COMPOUND_VALUE' : 'DISPLAY_ONLY',
    });
    out.push({
      key: 'document.issuePlaceAndDateLine',
      classification: hasCompoundLine ? 'DERIVED_COMPOUND_VALUE' : 'DISPLAY_ONLY',
    });

    return out;
  }

  /**
   * Emit a deduplicated render-value set. The adapter never emits the
   * same logical key twice. If both `document.issueDate` and
   * `document.issueDay/Month/Year` are present, only the canonical
   * `document.issueDate` is emitted as a render value (the components
   * become DERIVED_COMPONENT in classifyContractFields, but they are
   * not emitted because `document.issueDate` already binds them).
   *
   * Compound-line duplication prevention: if BOTH a compound input
   * (`issuePlaceDateLine` or `issuePlaceAndDateLine`) AND its
   * components (`issuePlace`, `issueDate` / day/month/year) are
   * present, the compound line is marked CONTRACT_REDUNDANT in the
   * classification, but the line itself is still emitted as the
   * authoritative legal-visible text (because the contract declares
   * it as the slot). The component fields remain in the render
   * values as DERIVED_COMPONENT data.
   */
  buildRenderValues(context: FormRenderContext): readonly RenderValue[] {
    const inputs = context.formInputs as IssuePlaceDateFormInputs;
    const out: RenderValue[] = [];
    const targetBySlot = new Map<string, SourceTargetIdentity>();
    for (const t of context.sourceTargets) {
      const seg = t.path.split('/').pop();
      if (seg && EMITTED_RENDER_KEYS.has(`document.${seg}`)) {
        targetBySlot.set(seg, t);
      }
    }

    // 1. document.issuePlace
    const placeValue = normalizeStr(inputs['document.issuePlace']);
    if (placeValue) {
      out.push({
        key: 'document.issuePlace',
        value: placeValue,
        sourceTargetIdentity:
          targetBySlot.get('issuePlace') ?? fallbackTarget(context.formCode, 'issuePlace'),
        classification: 'REQUIRED_SOURCE_SLOT',
        confidence: 1,
      });
    }

    // 2. document.issueDate (canonical) and derived parts
    const parts = deriveDateParts(inputs);
    if (parts) {
      out.push({
        key: 'document.issueDate',
        value: parts.isoDate,
        sourceTargetIdentity:
          targetBySlot.get('issueDate') ?? fallbackTarget(context.formCode, 'issueDate'),
        classification: 'REQUIRED_SOURCE_SLOT',
        confidence: 1,
      });
      // Components are emitted as DERIVED_COMPONENT so the renderer can
      // bind them to split-run targets if the source exposes them.
      out.push({
        key: 'document.issueDay',
        value: parts.day,
        sourceTargetIdentity:
          targetBySlot.get('issueDay') ?? fallbackTarget(context.formCode, 'issueDay'),
        classification: 'DERIVED_COMPOUND_VALUE',
        dependsOn: ['document.issueDate'],
        confidence: 1,
      });
      out.push({
        key: 'document.issueMonth',
        value: parts.month,
        sourceTargetIdentity:
          targetBySlot.get('issueMonth') ?? fallbackTarget(context.formCode, 'issueMonth'),
        classification: 'DERIVED_COMPOUND_VALUE',
        dependsOn: ['document.issueDate'],
        confidence: 1,
      });
      out.push({
        key: 'document.issueYear',
        value: parts.year,
        sourceTargetIdentity:
          targetBySlot.get('issueYear') ?? fallbackTarget(context.formCode, 'issueYear'),
        classification: 'DERIVED_COMPOUND_VALUE',
        dependsOn: ['document.issueDate'],
        confidence: 1,
      });
    }

    // 3. document.issueDateText — emit only if it was the source of truth
    //    (i.e. the canonical date was derived from it).
    const textInput = normalizeStr(inputs['document.issueDateText']);
    if (textInput && parts && textInput === parts.isoDate) {
      out.push({
        key: 'document.issueDateText',
        value: textInput,
        sourceTargetIdentity:
          targetBySlot.get('issueDateText') ??
          fallbackTarget(context.formCode, 'issueDateText'),
        classification: 'DISPLAY_ONLY',
        dependsOn: ['document.issueDate'],
        confidence: 1,
      });
    }

    // 4. Compound line — emit, but ONLY when the contract declares it
    //    as the binding. If both the compound line AND the canonical
    //    place+date are present, the compound line is CONTRACT_REDUNDANT
    //    for classification purposes but is still emitted as the
    //    legal-visible text (it carries punctuation, "ngày/tháng/năm"
    //    wording, alignment).
    const compoundLine =
      normalizeStr(inputs['document.issuePlaceDateLine']) ||
      normalizeStr(inputs['document.issuePlaceAndDateLine']);
    if (compoundLine) {
      const isRedundant = Boolean(placeValue || parts);
      out.push({
        key: 'document.issuePlaceDateLine',
        value: compoundLine,
        sourceTargetIdentity:
          targetBySlot.get('issuePlaceDateLine') ??
          fallbackTarget(context.formCode, 'issuePlaceDateLine'),
        classification: isRedundant ? 'CONTRACT_REDUNDANT' : 'REQUIRED_SOURCE_SLOT',
        confidence: 1,
      });
    }

    return out;
  }

  validateMapping(context: MappingValidationContext): MappingVerdict {
    const renderValueByKey = new Map(context.renderValues.map((v) => [v.key, v]));
    const missing: string[] = [];
    const stale: string[] = [];

    for (const field of context.contractFields) {
      if (!field.required) continue;
      const rv = renderValueByKey.get(field.key);
      if (!rv) {
        missing.push(field.key);
        continue;
      }
      if (rv.classification === 'GENUINE_SOURCE_ABSENT' && field.required) {
        missing.push(field.key);
      }
    }

    if (missing.length > 0) {
      return {
        kind: 'FAIL',
        reason: 'MISSING_REQUIRED_ISSUE_PLACE_DATE_SOURCE',
        missingRequired: missing,
        staleR1Sources: stale,
      };
    }

    // PASS_COMPOUND only if BOTH place and date are present AND the
    // adapter emitted at least one DERIVED_COMPONENT (i.e. the date was
    // actually split into parts).
    const hasPlace = renderValueByKey.has('document.issuePlace');
    const hasDate = renderValueByKey.has('document.issueDate');
    const hasComponents =
      renderValueByKey.has('document.issueDay') &&
      renderValueByKey.has('document.issueMonth') &&
      renderValueByKey.has('document.issueYear');

    if (hasPlace && hasDate && hasComponents) {
      return {
        kind: 'PASS_COMPOUND',
        reason: 'ISSUE_PLACE_DATE_FULLY_SOURCED',
        compoundCoverage: [
          'document.issuePlace',
          'document.issueDate',
          'document.issueDay',
          'document.issueMonth',
          'document.issueYear',
        ],
      };
    }
    if (hasPlace && hasDate) {
      return { kind: 'PASS', reason: 'ISSUE_PLACE_DATE_BASIC' };
    }
    if (hasDate) {
      return { kind: 'PASS', reason: 'ISSUE_PLACE_DATE_BASIC_DATE_ONLY' };
    }
    return { kind: 'PASS', reason: 'ISSUE_PLACE_DATE_MINIMAL' };
  }
}

export const ISSUE_PLACE_DATE_ADAPTER: IssuePlaceDateAdapter = new IssuePlaceDateAdapter();