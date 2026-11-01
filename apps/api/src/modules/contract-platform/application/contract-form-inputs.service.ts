import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  evaluateExpression,
  readPath,
  type FieldDefinition,
  type SectionDefinition,
} from '@qllaw/form-contracts';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CurrentUser } from '../../auth/current-user.type';
import { ContractPlatformError } from '../domain/contract-platform.error';
import { RuntimeFormContractService } from './runtime-form-contract.service';

/**
 * Locked shape (PLAN.md v2.3 §A2). Every key is required and finite.
 * New keys must be added via the union and a builder, not by mutating
 * the call site, so A3 (FE render) can rely on exhaustiveness.
 */
export type FormValidationCode =
  | 'REQUIRED'
  | 'INVALID_TYPE'
  | 'INVALID_DATE'
  | 'UNKNOWN_FIELD'
  | 'CONTRACT_DRIFT';

export type FormValidationError = {
  path: string;
  label: string;
  section: string;
  sectionTitle: string;
  required: boolean;
  code: FormValidationCode;
  message: string;
};

export type FormValidationResponse = {
  ok: false;
  errors: FormValidationError[];
};

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sanitize(value: unknown): unknown {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        sanitize(nested),
      ]),
    );
  }
  return value;
}

function setPath(
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const segments = path.split('.');
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    const nested = cursor[segment];
    if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  const last = segments.at(-1);
  if (last) cursor[last] = value;
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function typeMatches(field: FieldDefinition, value: unknown): boolean {
  if (isEmpty(value)) return true;
  if (field.control === 'NUMBER') return typeof value === 'number';
  if (field.control === 'CHECKBOX') return typeof value === 'boolean';
  return typeof value === 'string';
}

/**
 * A2 helpers — keep small, pure, side-effect free so they are easy to
 * unit-test and reuse when Phase B introduces the dynamic schema.
 */

function getSectionFromPath(path: string): string {
  const head = path.split('.')[0]?.trim();
  return head ? head : path;
}

function getLabelFallback(path: string): string {
  const tail = path.split('.').pop()?.trim();
  return tail && tail.length > 0 ? tail : path;
}

function buildSectionTitleMap(
  sections: SectionDefinition[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const section of sections ?? []) {
    if (section.id && section.title) {
      map.set(section.id, section.title);
    }
  }
  return map;
}

function buildFormValidationError(input: {
  path: string;
  label: string;
  section: string;
  sectionTitle: string;
  required: boolean;
  code: FormValidationCode;
  message: string;
}): FormValidationError {
  return {
    path: input.path,
    label: input.label,
    section: input.section,
    sectionTitle: input.sectionTitle,
    required: input.required,
    code: input.code,
    message: input.message,
  };
}

function buildRequiredError(
  field: FieldDefinition,
  sectionTitle: string,
): FormValidationError {
  return buildFormValidationError({
    path: field.key,
    label: field.label?.trim() || getLabelFallback(field.key),
    section: getSectionFromPath(field.key),
    sectionTitle: sectionTitle || getSectionFromPath(field.key),
    required: true,
    code: 'REQUIRED',
    message: `Trường "${field.label?.trim() || getLabelFallback(field.key)}" là bắt buộc.`,
  });
}

function buildInvalidTypeError(
  field: FieldDefinition,
  sectionTitle: string,
  expectedControl: string,
): FormValidationError {
  return buildFormValidationError({
    path: field.key,
    label: field.label?.trim() || getLabelFallback(field.key),
    section: getSectionFromPath(field.key),
    sectionTitle: sectionTitle || getSectionFromPath(field.key),
    required: field.required,
    code: 'INVALID_TYPE',
    message: `Dữ liệu "${field.label?.trim() || getLabelFallback(field.key)}" không đúng kiểu ${expectedControl}.`,
  });
}

function buildInvalidDateError(
  field: FieldDefinition,
  sectionTitle: string,
): FormValidationError {
  return buildFormValidationError({
    path: field.key,
    label: field.label?.trim() || getLabelFallback(field.key),
    section: getSectionFromPath(field.key),
    sectionTitle: sectionTitle || getSectionFromPath(field.key),
    required: field.required,
    code: 'INVALID_DATE',
    message: `Ngày "${field.label?.trim() || getLabelFallback(field.key)}" không đúng định dạng.`,
  });
}

function buildUnknownFieldError(path: string): FormValidationError {
  return buildFormValidationError({
    path,
    label: getLabelFallback(path),
    section: getSectionFromPath(path),
    sectionTitle: getSectionFromPath(path),
    required: false,
    code: 'UNKNOWN_FIELD',
    message: `Trường "${getLabelFallback(path)}" không có trong hợp đồng biểu mẫu.`,
  });
}

/**
 * Helper exists for callers that detect contract drift via
 * `contractMeta.contractLookupStatus !== 'FOUND'`. The current save() flow
 * does not have access to that metadata yet (A1 stores it on the snapshot
 * but the contract-platform input-save path resolves its own contract);
 * auto-emit is intentionally deferred to a follow-up. Per PLAN.md v2.3 §A2:
 * CONTRACT_DRIFT support is type + helper only until J1 (contract cache)
 * + C1 (startup guard) wire the metadata path.
 */
export function buildContractDriftError(): FormValidationError {
  return buildFormValidationError({
    path: 'contractMeta',
    label: 'Hợp đồng biểu mẫu',
    section: 'contract',
    sectionTitle: 'Hợp đồng biểu mẫu',
    required: false,
    code: 'CONTRACT_DRIFT',
    message:
      'Hợp đồng biểu mẫu đã thay đổi kể từ lần lưu trước. Hãy tải lại trước khi lưu.',
  });
}

function isDateControl(control: FieldDefinition['control']): boolean {
  return control === 'DATE' || control === 'PARTIAL_DATE' || control === 'TIME';
}

function isValidDateString(value: string): boolean {
  if (value.trim().length === 0) return true;
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?$/.test(value)) {
    return false;
  }
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

function collectKnownKeys(
  fields: FieldDefinition[],
  computed: ReadonlyArray<{ key: string }>,
  defaults: ReadonlyArray<{ fieldKey: string }>,
  tables: ReadonlyArray<{ key: string }>,
): Set<string> {
  const known = new Set<string>();
  for (const field of fields) {
    if (field.key) known.add(field.key);
  }
  for (const field of computed) {
    if (field.key) known.add(field.key);
  }
  for (const rule of defaults) {
    if (rule.fieldKey) known.add(rule.fieldKey);
  }
  for (const table of tables) {
    if (table.key) known.add(table.key);
  }
  return known;
}

function collectUnknownFieldPaths(
  data: Record<string, unknown>,
  known: Set<string>,
): string[] {
  const seen = new Set<string>();
  const visit = (cursor: unknown, segments: string[]): void => {
    if (cursor === null || cursor === undefined) return;
    if (Array.isArray(cursor)) {
      for (const item of cursor) {
        visit(item, segments);
      }
      return;
    }
    if (typeof cursor === 'object') {
      for (const [key, nested] of Object.entries(
        cursor as Record<string, unknown>,
      )) {
        visit(nested, [...segments, key]);
      }
      return;
    }
    const path = segments.join('.');
    if (path && !known.has(path) && !seen.has(path)) {
      seen.add(path);
    }
  };
  visit(data, []);
  return Array.from(seen);
}

@Injectable()
export class ContractFormInputsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtime: RuntimeFormContractService,
  ) {}

  async save(
    documentId: string,
    input: {
      contractHash: string;
      data: Record<string, unknown>;
    },
    user: CurrentUser,
  ) {
    const document = await this.prisma.generated_documents.findUnique({
      where: { id: BigInt(documentId) },
      include: {
        templates: { select: { template_code: true } },
        cases: { select: { agency_id: true } },
      },
    });
    if (!document) {
      throw new ContractPlatformError(
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
      throw new ContractPlatformError(
        'AGENCY_SCOPE_FORBIDDEN',
        'Không được cập nhật biểu mẫu của cơ quan khác.',
        403,
      );
    }
    const resolved = await this.runtime.resolve(
      document.templates.template_code,
      user.agencyId,
    );
    if (resolved.contractHash !== input.contractHash) {
      throw new ContractPlatformError(
        'STALE_CONTRACT_HASH',
        'Biểu mẫu đã có phiên bản mới. Hãy tải lại trước khi lưu.',
        409,
        {
          expected: resolved.contractHash,
          received: input.contractHash,
        },
      );
    }
    const source = resolved.compiledContract.source;
    const resolvedData = structuredClone(input.data);
    for (const rule of source.defaultRules) {
      if (isEmpty(readPath(resolvedData, rule.fieldKey))) {
        setPath(resolvedData, rule.fieldKey, rule.value);
      }
    }
    for (const field of source.fields) {
      if (
        field.dataSource.kind === 'DEFAULT' &&
        isEmpty(readPath(resolvedData, field.key))
      ) {
        setPath(resolvedData, field.key, field.dataSource.value);
      }
      if (field.dataSource.kind === 'CONSTANT') {
        setPath(resolvedData, field.key, field.dataSource.value);
      }
      if (field.dataSource.kind === 'SYSTEM') {
        const now = new Date();
        setPath(
          resolvedData,
          field.key,
          field.dataSource.value === 'CURRENT_DATE'
            ? now.toISOString().slice(0, 10)
            : now.toISOString().slice(11, 19),
        );
      }
    }
    const computed = [
      ...source.computedFields,
      ...source.fields
        .filter((field) => field.dataSource.kind === 'COMPUTED')
        .map((field) => ({
          key: field.key,
          expression:
            field.dataSource.kind === 'COMPUTED'
              ? field.dataSource.expression
              : ({ op: 'literal', value: '' } as const),
        })),
    ];
    for (let pass = 0; pass < Math.max(1, computed.length); pass += 1) {
      for (const field of computed) {
        setPath(
          resolvedData,
          field.key,
          evaluateExpression(field.expression, resolvedData),
        );
      }
    }
    const sectionTitleById = buildSectionTitleMap(source.sections);
    const issues: FormValidationError[] = [];
    for (const field of source.fields) {
      const sectionTitle =
        sectionTitleById.get(field.sectionId) ?? getSectionFromPath(field.key);
      const value = readPath(resolvedData, field.key);
      if (field.required && isEmpty(value)) {
        issues.push(buildRequiredError(field, sectionTitle));
        continue;
      }
      if (isDateControl(field.control) && typeof value === 'string') {
        if (!isValidDateString(value)) {
          issues.push(buildInvalidDateError(field, sectionTitle));
          continue;
        }
      }
      if (!typeMatches(field, value)) {
        issues.push(buildInvalidTypeError(field, sectionTitle, field.control));
      }
    }
    for (const table of source.tables) {
      const value = readPath(resolvedData, table.key);
      if (value !== undefined && !Array.isArray(value)) {
        const sectionTitle = sectionTitleById.get('tables') ?? 'tables';
        issues.push(
          buildInvalidTypeError(
            {
              ...table,
              sectionId: 'tables',
              label: table.label,
              control: 'TABLE',
              required: false,
            } as unknown as FieldDefinition,
            sectionTitle,
            'TABLE',
          ),
        );
      }
    }
    const knownKeys = collectKnownKeys(
      source.fields,
      computed,
      source.defaultRules,
      source.tables,
    );
    for (const path of collectUnknownFieldPaths(input.data, knownKeys)) {
      issues.push(buildUnknownFieldError(path));
    }
    if (issues.length > 0) {
      throw new ContractPlatformError(
        'CONTRACT_INPUT_VALIDATION_FAILED',
        'Dữ liệu biểu mẫu chưa hợp lệ.',
        422,
        { ok: false, errors: issues } satisfies FormValidationResponse,
      );
    }

    const normalized = sanitize(resolvedData) as Record<string, unknown>;
    const current = object(document.render_payload_snapshot);
    const snapshot = {
      ...current,
      formInputs: normalized,
      contractRuntime: {
        contractVersion: resolved.contractVersion,
        contractHash: resolved.contractHash,
        templateHash: resolved.templateHash,
        savedAt: new Date().toISOString(),
        savedBy: user.fullName,
      },
    };
    await this.prisma.generated_documents.update({
      where: { id: document.id },
      data: {
        render_payload_snapshot: JSON.parse(
          JSON.stringify(snapshot),
        ) as Prisma.InputJsonValue,
        validation_result: {
          valid: true,
          contractHash: resolved.contractHash,
          issues: [],
        },
      },
    });
    return {
      documentId,
      contractVersion: resolved.contractVersion,
      contractHash: resolved.contractHash,
      templateHash: resolved.templateHash,
      data: normalized,
    };
  }
}
