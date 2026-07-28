import { RuntimeFormContractService } from './runtime-form-contract.service';

describe('RuntimeFormContractService target semantics', () => {
  it('returns the template render scope alongside a published contract', async () => {
    const prisma = {
      templates: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7n,
          render_scope: 'PERSON_LEVEL',
          template_versions: [],
        }),
      },
      form_contract_versions: {
        findFirst: jest.fn().mockResolvedValue({
          id: 11n,
          version_no: 3,
          contract_hash: 'contract-hash',
          template_hash: 'template-hash',
          compiled_json: {
            contractHash: 'contract-hash',
            templateHash: 'template-hash',
          },
        }),
      },
    };
    const fileContracts = {
      findByIdentifier: jest.fn(),
    };
    const service = new RuntimeFormContractService(
      prisma as never,
      fileContracts as never,
    );

    const result = await service.resolve('BM-002', null);

    expect(result.source).toBe('GLOBAL_PUBLISHED');
    expect(result.renderScope).toBe('PERSON_LEVEL');
  });
});
