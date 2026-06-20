import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  evaluateExpression,
  readPath,
  type FieldDefinition,
} from '@qllaw/form-contracts';
import { PrismaService } from '../../../prisma/prisma.service';
import type { CurrentUser } from '../../auth/current-user.type';
import { FormStudioError } from '../domain/form-studio.error';
import { RuntimeFormContractService } from './runtime-form-contract.service';

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
        'Không được cập nhật biểu mẫu của cơ quan khác.',
        403,
      );
    }
    const resolved = await this.runtime.resolve(
      document.templates.template_code,
      user.agencyId,
    );
    if (resolved.contractHash !== input.contractHash) {
      throw new FormStudioError(
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
    const issues: Array<{ path: string; code: string; message: string }> = [];
    for (const field of source.fields) {
      const value = readPath(resolvedData, field.key);
      if (field.required && isEmpty(value)) {
        issues.push({
          path: field.key,
          code: 'REQUIRED',
          message: `Trường "${field.label}" là bắt buộc.`,
        });
      } else if (!typeMatches(field, value)) {
        issues.push({
          path: field.key,
          code: 'TYPE_MISMATCH',
          message: `Dữ liệu "${field.label}" không đúng kiểu ${field.control}.`,
        });
      }
    }
    for (const table of source.tables) {
      const value = readPath(resolvedData, table.key);
      if (value !== undefined && !Array.isArray(value)) {
        issues.push({
          path: table.key,
          code: 'TABLE_TYPE_MISMATCH',
          message: `Bảng "${table.label}" phải là danh sách dòng.`,
        });
      }
    }
    if (issues.length > 0) {
      throw new FormStudioError(
        'CONTRACT_INPUT_VALIDATION_FAILED',
        'Dữ liệu biểu mẫu chưa hợp lệ.',
        422,
        issues,
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
