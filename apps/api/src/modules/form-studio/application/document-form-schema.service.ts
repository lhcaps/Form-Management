import { Injectable } from '@nestjs/common';
import {
  deriveFormInputSchema,
  type CompiledFormContract,
  type FormContractV2,
} from '@qllaw/form-contracts';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CurrentUser } from '../../auth/current-user.type';
import { type FormValidationError } from './contract-form-inputs.service';
import { FormStudioError } from '../domain/form-studio.error';
import { RuntimeFormContractService } from './runtime-form-contract.service';

export type DocumentFormSchemaResponse = {
  generatedDocumentId: string;
  templateCode: string;
  sourceId: string | null;
  contractVersionHash: string | null;
  schema: ReturnType<typeof deriveFormInputSchema>;
  values: Record<string, unknown>;
  resolvedValues: Record<string, unknown>;
  validation: {
    missingRequiredFields: FormValidationError[];
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readFieldPath(data: Record<string, unknown>, path: string): unknown {
  const segments = path.split('.');
  let cursor: unknown = data;
  for (const segment of segments) {
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

function getSectionFromPath(path: string): string {
  const head = path.split('.')[0]?.trim();
  return head ? head : path;
}

function getLabelFallback(path: string): string {
  const tail = path.split('.').pop()?.trim();
  return tail && tail.length > 0 ? tail : path;
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function controlToUiComponent(control: string | undefined): string {
  switch ((control ?? '').toUpperCase()) {
    case 'TEXTAREA':
      return 'textarea';
    case 'NUMBER':
      return 'number';
    case 'DATE':
    case 'PARTIAL_DATE':
    case 'TIME':
      return 'date';
    case 'SELECT':
      return 'select';
    case 'CHECKBOX':
      return 'checkbox';
    case 'READONLY':
      return 'readonly';
    case 'TEXT':
    case 'AGENCY_PICKER':
    case 'OFFICIAL_PICKER':
    case 'PERSON_PICKER':
    case 'RADIO':
    case 'COMPUTED':
    default:
      return 'text';
  }
}

function dataSourceToV1Source(kind: string | undefined): string | undefined {
  switch (kind) {
    case 'MANUAL':
      return 'manual';
    case 'CASE':
      return 'casePayload';
    case 'AGENCY':
      return 'agencyConfig';
    case 'OFFICIAL':
      return 'officialConfig';
    case 'SYSTEM':
      return 'systemDate';
    case 'COMPUTED':
      return 'computed';
    case 'CONSTANT':
    case 'DEFAULT':
    default:
      return undefined;
  }
}

/**
 * Best-effort V2 compiled contract -> V1 locked-contract shape used by
 * deriveFormInputSchema (PLAN.md v2.3 §B1). B3 only needs the subset
 * that deriveFormInputSchema consumes: canonicalFields, docxSlots,
 * renderBindings. The rest (extensionPoints, conditionalRules, etc.)
 * is dropped, which is fine because B1 is defensive about missing
 * arrays. The two shapes are not 1:1 in general (V2 has more
 * semantics), so this mapper stays local to B3.
 */
function compiledContractToV1(
  compiled: CompiledFormContract,
): Record<string, unknown> {
  const v2: FormContractV2 = compiled.source;

  const canonicalFields = (v2.fields ?? []).map((field) => ({
    path: field.key,
    type:
      field.control === 'NUMBER'
        ? 'number'
        : field.control === 'CHECKBOX'
          ? 'boolean'
          : 'string',
    label: field.label,
    source: dataSourceToV1Source(field.dataSource.kind) ?? 'manual',
    required: Boolean(field.required),
    uiComponent: controlToUiComponent(field.control),
    section: undefined,
    reviewRequired: Boolean(field.hiddenRequiredReason),
  }));

  const slotBindings = (v2.renderBindings ?? []).filter(
    (
      binding,
    ): binding is typeof binding & {
      target: { kind: 'SLOT'; slotId: string };
      source: { kind: 'FIELD'; fieldKey: string };
    } =>
      binding.target?.kind === 'SLOT' &&
      typeof (binding.target as { slotId?: unknown }).slotId === 'string' &&
      (binding.target as { slotId: string }).slotId.length > 0 &&
      binding.source?.kind === 'FIELD' &&
      typeof (binding.source as { fieldKey?: unknown }).fieldKey === 'string' &&
      (binding.source as { fieldKey: string }).fieldKey.length > 0,
  );

  // docxSlots are not a first-class concept in V2 — derive them from
  // renderBindings that target a SLOT. This is enough for B1 to pick
  // up the datePart / required flags via slotType for date suffixes.
  const docxSlots = slotBindings.map((binding) => {
    const isDateField = (v2.fields ?? []).some(
      (f) =>
        f.key === binding.target.slotId &&
        (f.control === 'DATE' ||
          f.control === 'PARTIAL_DATE' ||
          f.control === 'TIME'),
    );
    return {
      slotId: binding.target.slotId,
      slotType: isDateField ? 'datePart' : 'text',
      required: false,
      reviewRequired: false,
    };
  });

  const renderBindings = slotBindings.map((binding) => ({
    slotId: binding.target.slotId,
    from: binding.source.fieldKey,
    transform: binding.transform ?? 'identity',
    fallback: binding.fallback ?? '',
    reviewRequired: false,
  }));

  return {
    schemaVersion: '1.0',
    sourceId: v2.templateCode,
    templateCode: v2.templateCode,
    documentKind: 'form',
    status: 'locked',
    docxSlots,
    canonicalFields,
    renderBindings,
    rejectedCandidates: [],
  };
}

function buildMissingRequiredError(
  fieldPath: string,
  label: string,
  section: string,
  sectionTitle: string,
): FormValidationError {
  return {
    path: fieldPath,
    label,
    section,
    sectionTitle,
    required: true,
    code: 'REQUIRED',
    message: `Trường "${label}" là bắt buộc.`,
  };
}

@Injectable()
export class DocumentFormSchemaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtime: RuntimeFormContractService,
  ) {}

  async getFormSchema(
    documentId: string,
    user: CurrentUser,
  ): Promise<DocumentFormSchemaResponse> {
    const document = await this.prisma.generated_documents.findUnique({
      where: { id: BigInt(documentId) },
      include: {
        templates: { select: { template_code: true } },
        cases: { select: { agency_id: true } },
      },
    });
    if (!document) {
      throw new FormStudioError(
        'GENERATED_DOCUMENT_NOT_FOUND',
        'Không tìm thấy biểu mẫu đã tạo.',
        404,
      );
    }
    if (
      user.role !== 'ADMIN' &&
      user.agencyId &&
      document.cases.agency_id &&
      String(document.cases.agency_id) !== user.agencyId
    ) {
      throw new FormStudioError(
        'AGENCY_SCOPE_FORBIDDEN',
        'Không xem được biểu mẫu của cơ quan khác.',
        403,
      );
    }

    const templateCode = document.templates.template_code;
    const resolved = await this.runtime.resolve(
      templateCode,
      user.agencyId ?? null,
    );

    const v1Contract = compiledContractToV1(resolved.compiledContract);
    const schema = deriveFormInputSchema(v1Contract);

    const snapshot = isRecord(document.render_payload_snapshot)
      ? document.render_payload_snapshot
      : {};
    const formInputs = isRecord(snapshot['formInputs'])
      ? (snapshot['formInputs'] as Record<string, unknown>)
      : {};

    // values: only fields the user can edit. Readonly fields (case
    // payload / agency / system date / computed) MUST NOT be required
    // from the form; the FE only binds editable fields to inputs.
    const values: Record<string, unknown> = {};
    const resolvedValues: Record<string, unknown> = {};
    const missingRequiredFields: FormValidationError[] = [];

    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (!field.visible) continue;
        const raw = readFieldPath(formInputs, field.path);
        // resolvedValues carries the formInputs value for every visible
        // field. The FE uses it for readonly previews; the rest of
        // case/agency/system values are not in scope for B3 (they are
        // resolved by the renderer at preview time, not by this GET).
        if (raw !== undefined) {
          resolvedValues[field.path] = raw;
        }
        if (field.editable) {
          if (raw !== undefined) {
            values[field.path] = raw;
          }
          if (field.required && isEmpty(raw)) {
            const label =
              field.label && field.label.length > 0
                ? field.label
                : getLabelFallback(field.path);
            missingRequiredFields.push(
              buildMissingRequiredError(
                field.path,
                label,
                getSectionFromPath(field.path),
                section.title,
              ),
            );
          }
        }
      }
    }

    return {
      generatedDocumentId: documentId,
      templateCode,
      sourceId: resolved.compiledContract.source.templateCode,
      contractVersionHash: resolved.contractHash,
      schema,
      values,
      resolvedValues,
      validation: { missingRequiredFields },
    };
  }
}
