import {
  compileContract,
  createEmptyContract,
  type CompiledFormContract,
  type FormInputSchema,
} from '@qllaw/form-contracts';
import type { CurrentUser } from '../../auth/current-user.type';
import { DocumentFormSchemaService } from './document-form-schema.service';
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

function baseContract() {
  return createEmptyContract({
    templateCode: 'CUS-VKS3-FORMSCHEMA',
    title: 'Form Schema Test',
    agencyId: '3',
    templateHash: 'template-hash',
    normalizedDocxPath: 'storage/template.docx',
  });
}

function buildRuntime() {
  const contract = baseContract();
  contract.sections.push(
    {
      id: 'agency',
      title: 'Cơ quan',
      order: 0,
      columns: 2,
    },
    {
      id: 'person',
      title: 'Thông tin cá nhân',
      order: 1,
      columns: 2,
    },
  );
  contract.fields.push(
    {
      id: 'agencyName',
      key: 'agency.name',
      sectionId: 'agency',
      label: 'Tên cơ quan',
      control: 'TEXT',
      order: 0,
      width: 6,
      required: true,
      dataSource: { kind: 'MANUAL' },
    },
    {
      id: 'agencyIssuePlace',
      key: 'agency.issuePlace',
      sectionId: 'agency',
      label: 'Địa danh',
      control: 'TEXT',
      order: 1,
      width: 6,
      required: false,
      dataSource: { kind: 'MANUAL' },
    },
    {
      id: 'personFullName',
      key: 'person.fullName',
      sectionId: 'person',
      label: 'Họ tên',
      control: 'TEXT',
      order: 0,
      width: 6,
      required: true,
      dataSource: { kind: 'MANUAL' },
    },
    {
      id: 'personDob',
      key: 'person.dob',
      sectionId: 'person',
      label: 'Ngày sinh',
      control: 'DATE',
      order: 1,
      width: 6,
      required: false,
      dataSource: { kind: 'MANUAL' },
    },
    {
      id: 'caseCaseCode',
      key: 'case.caseCode',
      sectionId: 'agency',
      label: 'Mã hồ sơ',
      control: 'TEXT',
      order: 2,
      width: 6,
      required: false,
      dataSource: { kind: 'CASE', path: 'case' },
    },
    {
      id: 'computedSummary',
      key: 'document.summary',
      sectionId: 'person',
      label: 'Tóm tắt',
      control: 'COMPUTED',
      order: 2,
      width: 6,
      required: false,
      dataSource: {
        kind: 'COMPUTED',
        expression: { op: 'literal', value: '' },
      },
    },
  );
  contract.renderBindings.push(
    {
      id: 'agencyNameBinding',
      target: { kind: 'SLOT', slotId: 'agency.name' },
      source: { kind: 'FIELD', fieldKey: 'agency.name' },
      transform: 'identity',
      fallback: '',
    },
    {
      id: 'agencyIssuePlaceBinding',
      target: { kind: 'SLOT', slotId: 'agency.issuePlace' },
      source: { kind: 'FIELD', fieldKey: 'agency.issuePlace' },
      transform: 'identity',
      fallback: '',
    },
    {
      id: 'personFullNameBinding',
      target: { kind: 'SLOT', slotId: 'person.fullName' },
      source: { kind: 'FIELD', fieldKey: 'person.fullName' },
      transform: 'identity',
      fallback: '',
    },
    {
      id: 'personDobBinding',
      target: { kind: 'SLOT', slotId: 'person.dob' },
      source: { kind: 'FIELD', fieldKey: 'person.dob' },
      transform: 'vietnameseDate',
      fallback: '',
    },
  );
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

type RuntimeResult = ReturnType<typeof buildRuntime>;

function setup(
  options: {
    formInputs?: Record<string, unknown>;
    templateCode?: string;
    agencyId?: bigint | null;
    runtime?: RuntimeResult;
  } = {},
) {
  const runtime = options.runtime ?? buildRuntime();
  const prisma = {
    generated_documents: {
      findUnique: jest.fn().mockResolvedValue({
        id: 11n,
        render_payload_snapshot: options.formInputs
          ? { formInputs: options.formInputs }
          : {},
        templates: {
          template_code: options.templateCode ?? 'CUS-VKS3-FORMSCHEMA',
        },
        cases: {
          agency_id: options.agencyId === undefined ? 3n : options.agencyId,
        },
      }),
    },
  };
  const resolver = {
    resolve: jest.fn().mockResolvedValue(runtime),
  };
  return {
    runtime,
    prisma,
    resolver,
    service: new DocumentFormSchemaService(
      prisma as never,
      resolver as never,
    ),
  };
}

describe('DocumentFormSchemaService', () => {
  it('returns the locked response shape with schema, values, and validation', async () => {
    const { service, runtime } = setup({
      formInputs: { agency: { name: 'VKS Hà Nội' } },
    });

    const result = await service.getFormSchema('11', user);

    expect(result.generatedDocumentId).toBe('11');
    expect(result.templateCode).toBe('CUS-VKS3-FORMSCHEMA');
    expect(result.contractVersionHash).toBe(runtime.contractHash);
    expect(Array.isArray(result.schema.sections)).toBe(true);
    expect(result.schema.sections.length).toBeGreaterThan(0);
    expect(result.values).toBeDefined();
    expect(result.resolvedValues).toBeDefined();
    expect(result.validation.missingRequiredFields).toBeDefined();
  });

  it('returns existing formInputs under values', async () => {
    const { service } = setup({
      formInputs: {
        agency: { name: 'VKS Hà Nội', issuePlace: 'Hà Nội' },
        person: { fullName: 'Nguyễn Văn A' },
      },
    });

    const result = await service.getFormSchema('11', user);

    expect(result.values['agency.name']).toBe('VKS Hà Nội');
    expect(result.values['agency.issuePlace']).toBe('Hà Nội');
    expect(result.values['person.fullName']).toBe('Nguyễn Văn A');
    expect(result.values['person.dob']).toBeUndefined();
  });

  it('reports missing required editable fields as REQUIRED', async () => {
    const { service } = setup({
      formInputs: {
        // person.fullName and agency.name are required editable — both missing.
        person: { dob: '1990-01-01' },
      },
    });

    const result = await service.getFormSchema('11', user);

    const missing = result.validation.missingRequiredFields;
    expect(missing.length).toBeGreaterThanOrEqual(2);
    const requiredPaths = missing.map((m: FormValidationError) => m.path).sort();
    expect(requiredPaths).toEqual(
      expect.arrayContaining(['agency.name', 'person.fullName']),
    );
    for (const err of missing) {
      expect(err.code).toBe('REQUIRED');
      expect(err.required).toBe(true);
      for (const key of [
        'path',
        'label',
        'section',
        'sectionTitle',
        'required',
        'code',
        'message',
      ] as const) {
        expect(err).toHaveProperty(key);
        expect(err[key]).toBeDefined();
      }
    }
  });

  it('does not require readonly fields in missingRequiredFields', async () => {
    // person.fullName editable+required missing; case.caseCode is readonly
    // and caseDataSource.kind === 'CASE' — must not be required.
    const { service } = setup({
      formInputs: {
        agency: { name: 'VKS Hà Nội' },
        person: { fullName: 'A' },
      },
    });

    const result = await service.getFormSchema('11', user);

    const missing = result.validation.missingRequiredFields;
    const caseCaseCodeMissing = missing.find(
      (m: FormValidationError) => m.path === 'case.caseCode',
    );
    expect(caseCaseCodeMissing).toBeUndefined();
    // Also: computed document.summary should not appear in missing either.
    const computedMissing = missing.find(
      (m: FormValidationError) => m.path === 'document.summary',
    );
    expect(computedMissing).toBeUndefined();
  });

  it('treats missing formInputs snapshot as empty', async () => {
    const { service } = setup();

    const result = await service.getFormSchema('11', user);

    expect(result.values).toEqual({});
    // person.fullName + agency.name are required and editable; both missing.
    expect(result.validation.missingRequiredFields.length).toBeGreaterThanOrEqual(2);
  });

  it('throws GENERATED_DOCUMENT_NOT_FOUND when the document is missing', async () => {
    const prisma = {
      generated_documents: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const resolver = { resolve: jest.fn() };
    const service = new DocumentFormSchemaService(
      prisma as never,
      resolver as never,
    );

    await expect(service.getFormSchema('999', user)).rejects.toMatchObject({
      code: 'GENERATED_DOCUMENT_NOT_FOUND',
      status: 404,
    });
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it('throws AGENCY_SCOPE_FORBIDDEN when the user agency does not match', async () => {
    const { service } = setup({ agencyId: 99n });
    await expect(service.getFormSchema('11', user)).rejects.toMatchObject({
      code: 'AGENCY_SCOPE_FORBIDDEN',
      status: 403,
    });
  });

  it('allows ADMIN to read any agency scope', async () => {
    const admin: CurrentUser = { ...user, role: 'ADMIN', agencyId: null };
    const { service } = setup({ agencyId: 99n });
    const result = await service.getFormSchema('11', admin);
    expect(result.generatedDocumentId).toBe('11');
  });

  it('exposes resolvedValues for visible fields present in formInputs', async () => {
    const { service } = setup({
      formInputs: {
        agency: { name: 'VKS Hà Nội' },
        person: { fullName: 'A' },
      },
    });

    const result = await service.getFormSchema('11', user);

    // Resolved previews cover the same visible fields, including readonly ones.
    expect(result.resolvedValues['agency.name']).toBe('VKS Hà Nội');
    expect(result.resolvedValues['person.fullName']).toBe('A');
  });

  it('uses Vietnamese section titles from the corpus titles map', async () => {
    const { service } = setup({
      formInputs: { person: { fullName: 'A' } },
    });

    const result = await service.getFormSchema('11', user);

    const titles = result.schema.sections.map((s: FormInputSchema['sections'][number]) => s.title);
    // The B3 pre-step added "Thông tin cá nhân" for the person section.
    expect(titles).toContain('Thông tin cá nhân');
  });
});
