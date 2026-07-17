import {
  compileContract,
  createEmptyContract,
} from '@qllaw/form-contracts';
import type { CurrentUser } from '../../auth/current-user.type';
import { ContractFormInputsService } from './contract-form-inputs.service';
import type { FormValidationError } from './contract-form-inputs.service';

const user: CurrentUser = {
  id: '7',
  username: 'official',
  fullName: 'Kiểm sát viên',
  positionTitle: null,
  rankTitle: null,
  email: null,
  phone: null,
  role: 'OFFICIAL',
  agencyId: '3',
  agencyName: 'VKS 3',
  agencyCode: 'VKS3',
  isActive: true,
  permissions: [],
};

function runtimeResult() {
  const contract = createEmptyContract({
    templateCode: 'CUS-VKS3-0001',
    title: 'Dynamic form',
    agencyId: '3',
    templateHash: 'template-hash',
    normalizedDocxPath: 'storage/template.docx',
  });
  contract.sections.push({
    id: 'main',
    title: 'Thông tin',
    order: 0,
    columns: 2,
  });
  contract.fields.push(
    {
      id: 'name',
      key: 'person.fullName',
      sectionId: 'main',
      label: 'Họ tên',
      control: 'TEXT',
      order: 0,
      width: 6,
      required: true,
      dataSource: { kind: 'MANUAL' },
    },
    {
      id: 'note',
      key: 'document.note',
      sectionId: 'main',
      label: 'Ghi chú',
      control: 'TEXTAREA',
      order: 1,
      width: 6,
      required: false,
      dataSource: { kind: 'MANUAL' },
    },
    {
      id: 'summary',
      key: 'document.summary',
      sectionId: 'main',
      label: 'Tóm tắt',
      control: 'COMPUTED',
      order: 2,
      width: 12,
      required: true,
      dataSource: {
        kind: 'COMPUTED',
        expression: {
          op: 'concat',
          args: [
            { op: 'literal', value: 'Người khai: ' },
            { op: 'field', path: 'person.fullName' },
          ],
        },
      },
    },
  );
  contract.renderBindings.push({
    id: 'name-binding',
    target: { kind: 'SLOT', slotId: 'person.fullName' },
    source: { kind: 'FIELD', fieldKey: 'person.fullName' },
    transform: 'identity',
    fallback: '',
  });
  contract.renderBindings.push({
    id: 'note-binding',
    target: { kind: 'SLOT', slotId: 'document.note' },
    source: { kind: 'FIELD', fieldKey: 'document.note' },
    transform: 'identity',
    fallback: '',
  });
  contract.status = 'PUBLISHED';
  const compiled = compileContract(contract).artifact!;
  return {
    source: 'AGENCY_PUBLISHED' as const,
    contractVersion: 'db:1:v1',
    contractHash: compiled.contractHash,
    templateHash: compiled.templateHash,
    compiledContract: compiled,
  };
}

function setup() {
  const runtime = runtimeResult();
  const prisma = {
    generated_documents: {
      findUnique: jest.fn().mockResolvedValue({
        id: 11n,
        render_payload_snapshot: {},
        templates: { template_code: 'CUS-VKS3-0001' },
        cases: { agency_id: 3n },
      }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const resolver = {
    resolve: jest.fn().mockResolvedValue(runtime),
  };
  return {
    runtime,
    prisma,
    service: new ContractFormInputsService(
      prisma as never,
      resolver as never,
    ),
  };
}

function setupWithDate() {
  const contract = createEmptyContract({
    templateCode: 'CUS-VKS3-DATE',
    title: 'Date form',
    agencyId: '3',
    templateHash: 'template-hash',
    normalizedDocxPath: 'storage/template.docx',
  });
  contract.sections.push({
    id: 'main',
    title: 'Thông tin ngày',
    order: 0,
    columns: 1,
  });
  contract.fields.push({
    id: 'signedAt',
    key: 'document.signedAt',
    sectionId: 'main',
    label: 'Ngày ký',
    control: 'DATE',
    order: 0,
    width: 12,
    required: true,
    dataSource: { kind: 'MANUAL' },
  });
  contract.renderBindings.push({
    id: 'signedAt-binding',
    target: { kind: 'SLOT', slotId: 'document.signedAt' },
    source: { kind: 'FIELD', fieldKey: 'document.signedAt' },
    transform: 'identity',
    fallback: '',
  });
  contract.status = 'PUBLISHED';
  const compiled = compileContract(contract).artifact!;
  const runtime = {
    source: 'AGENCY_PUBLISHED' as const,
    contractVersion: 'db:1:v1',
    contractHash: compiled.contractHash,
    templateHash: compiled.templateHash,
    compiledContract: compiled,
  };
  const prisma = {
    generated_documents: {
      findUnique: jest.fn().mockResolvedValue({
        id: 12n,
        render_payload_snapshot: {},
        templates: { template_code: 'CUS-VKS3-DATE' },
        cases: { agency_id: 3n },
      }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const resolver = { resolve: jest.fn().mockResolvedValue(runtime) };
  return {
    runtime,
    prisma,
    service: new ContractFormInputsService(
      prisma as never,
      resolver as never,
    ),
  };
}

function expectRequiredShape(error: FormValidationError) {
  const allowedCodes: FormValidationError['code'][] = [
    'REQUIRED',
    'INVALID_TYPE',
    'INVALID_DATE',
    'UNKNOWN_FIELD',
    'CONTRACT_DRIFT',
  ];
  expect(allowedCodes).toContain(error.code);
  for (const key of [
    'path',
    'label',
    'section',
    'sectionTitle',
    'required',
    'code',
    'message',
  ] as const) {
    expect(error).toHaveProperty(key);
    expect(error[key]).toBeDefined();
  }
  expect(typeof error.path).toBe('string');
  expect(typeof error.label).toBe('string');
  expect(typeof error.section).toBe('string');
  expect(typeof error.sectionTitle).toBe('string');
  expect(typeof error.required).toBe('boolean');
  expect(typeof error.message).toBe('string');
}

describe('ContractFormInputsService', () => {
  it('rejects stale contract hashes', async () => {
    const { service } = setup();

    await expect(
      service.save(
        '11',
        { contractHash: 'stale', data: { person: { fullName: 'A' } } },
        user,
      ),
    ).rejects.toMatchObject({ code: 'STALE_CONTRACT_HASH', status: 409 });
  });

  it('uses the published contract required metadata for API validation', async () => {
    const { service, runtime } = setup();

    await expect(
      service.save(
        '11',
        { contractHash: runtime.contractHash, data: {} },
        user,
      ),
    ).rejects.toMatchObject({
      code: 'CONTRACT_INPUT_VALIDATION_FAILED',
      status: 422,
    });
  });

  it('returns structured FormValidationError for missing required field with all 7 keys', async () => {
    const { service, runtime } = setup();

    const error = await service
      .save(
        '11',
        { contractHash: runtime.contractHash, data: {} },
        user,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      code: 'CONTRACT_INPUT_VALIDATION_FAILED',
      status: 422,
      message: 'Dữ liệu biểu mẫu chưa hợp lệ.',
    });
    const cause = (error as { cause: { ok: false; errors: FormValidationError[] } })
      .cause;
    expect(cause.ok).toBe(false);
    expect(Array.isArray(cause.errors)).toBe(true);
    expect(cause.errors.length).toBeGreaterThan(0);

    const requiredError = cause.errors.find(
      (entry) => entry.path === 'person.fullName',
    );
    expect(requiredError).toBeDefined();
    expect(requiredError?.code).toBe('REQUIRED');
    expect(requiredError?.required).toBe(true);
    expect(requiredShape(requiredError as FormValidationError));
  });

  it('returns structured FormValidationError with code INVALID_DATE for bad date format', async () => {
    const { service, runtime } = setupWithDate();

    const error = await service
      .save(
        '12',
        {
          contractHash: runtime.contractHash,
          data: { document: { signedAt: 'not-a-date' } },
        },
        user,
      )
      .catch((caught: unknown) => caught);

    const cause = (error as { cause: { ok: false; errors: FormValidationError[] } })
      .cause;
    const dateError = cause.errors.find(
      (entry) => entry.path === 'document.signedAt',
    );
    expect(dateError).toBeDefined();
    expect(dateError?.code).toBe('INVALID_DATE');
    expect(requiredShape(dateError as FormValidationError));
  });

  it('returns structured FormValidationError with code UNKNOWN_FIELD for paths not in the contract', async () => {
    const { service, runtime } = setup();

    const error = await service
      .save(
        '11',
        {
          contractHash: runtime.contractHash,
          data: {
            person: { fullName: 'A' },
            document: { note: 'x', rogueField: 'oops' },
          },
        },
        user,
      )
      .catch((caught: unknown) => caught);

    const cause = (error as { cause: { ok: false; errors: FormValidationError[] } })
      .cause;
    const unknown = cause.errors.find(
      (entry) => entry.path === 'document.rogueField',
    );
    expect(unknown).toBeDefined();
    expect(unknown?.code).toBe('UNKNOWN_FIELD');
    expect(requiredShape(unknown as FormValidationError));
  });

  it('keeps the legacy generic message string for backward compatibility', async () => {
    const { service, runtime } = setup();

    const error = await service
      .save(
        '11',
        { contractHash: runtime.contractHash, data: {} },
        user,
      )
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      code: 'CONTRACT_INPUT_VALIDATION_FAILED',
      status: 422,
      message: 'Dữ liệu biểu mẫu chưa hợp lệ.',
    });
  });

  it('sanitizes nulls and records the exact contract hash in the snapshot', async () => {
    const { service, runtime, prisma } = setup();

    const result = await service.save(
      '11',
      {
        contractHash: runtime.contractHash,
        data: {
          person: { fullName: 'Nguyễn Văn A' },
          document: { note: null },
        },
      },
      user,
    );

    expect(result.data).toEqual({
      person: { fullName: 'Nguyễn Văn A' },
      document: {
        note: '',
        summary: 'Người khai: Nguyễn Văn A',
      },
    });
    expect(prisma.generated_documents.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          render_payload_snapshot: expect.objectContaining({
            contractRuntime: expect.objectContaining({
              contractHash: runtime.contractHash,
            }),
          }),
        }),
      }),
    );
  });
});

function requiredShape(error: FormValidationError): void {
  expectRequiredShape(error);
}
