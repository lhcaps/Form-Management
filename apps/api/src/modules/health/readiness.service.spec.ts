import type { ContractRepositoryStatus } from '../forms-contracts/application/form-contract.repository';
import { FormContractRepository } from '../forms-contracts/application/form-contract.repository';
import type { LoadedFormContract } from '../forms-contracts/domain/form-contract';
import type {
  FontVerificationReport,
  AppConfigService,
} from '../../infrastructure/config/app-config.service';
import { ReadinessService } from './readiness.service';

class ReadinessRepository extends FormContractRepository {
  constructor(
    private readonly contracts: LoadedFormContract[],
    private readonly status: ContractRepositoryStatus,
  ) {
    super();
  }

  async findByIdentifier(
    identifier: string,
  ): Promise<LoadedFormContract | null> {
    return (
      this.contracts.find(
        (contract) =>
          contract.sourceId === identifier ||
          contract.templateCode === identifier,
      ) ?? null
    );
  }

  async list(): Promise<LoadedFormContract[]> {
    return this.contracts;
  }

  async inspect(): Promise<ContractRepositoryStatus> {
    return this.status;
  }
}

/** Minimal stub for AppConfigService exercising the font-policy getters only. */
class StubConfig implements Partial<AppConfigService> {
  constructor(
    private readonly policy: 'required' | 'fallback-allowed' = 'required',
    private readonly report: FontVerificationReport | null = null,
  ) {}
  get fontPolicy(): 'required' | 'fallback-allowed' {
    return this.policy;
  }
  get requiredFontFamily(): string {
    return 'Times New Roman';
  }
  readFontVerificationReport(): FontVerificationReport | null {
    return this.report;
  }
}

function defaultFontReport(
  overrides: Partial<FontVerificationReport> = {},
): FontVerificationReport {
  return {
    policy: 'required',
    requiredFamily: 'Times New Roman',
    fontDir: '/opt/qllaw/fonts/times-new-roman',
    requiredStyles: ['Regular', 'Bold', 'Italic', 'Bold Italic'],
    aggregate: 'EXACT_REQUIRED_FONT_PASS',
    presentStyles: ['Regular', 'Bold', 'Italic', 'Bold Italic'],
    missingStyles: [],
    perFont: [],
    ...overrides,
  };
}

function locked(templateCode: string): LoadedFormContract {
  return {
    sourceId: `${templateCode}__locked`,
    templateCode,
    title: templateCode,
    status: 'locked',
    documentKind: 'form',
    docxSlots: [],
    canonicalFields: [],
    renderBindings: [],
    runtimeEligible: true,
    needsReview: false,
    genericFieldCount: 0,
    fieldsNeedingReviewCount: 0,
  };
}

function status(
  overrides: Partial<ContractRepositoryStatus> = {},
): ContractRepositoryStatus {
  return {
    ready: true,
    contractsRoot: 'D:/repo/docs/audit/docx/contracts',
    lockedCount: 3,
    draftCount: 210,
    invalidFiles: [],
    ...overrides,
  };
}

describe('ReadinessService', () => {
  it('is ready when all pilot contracts are locked and valid', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig('required', defaultFontReport()) as unknown as AppConfigService,
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: true,
      checks: {
        contracts: {
          ok: true,
          requiredLocked: ['BM-001', 'BM-002', 'BM-003'],
          missingLocked: [],
          lockedCount: 3,
          draftCount: 210,
          invalidFileCount: 0,
        },
        fonts: {
          ok: true,
          status: 'FONT_REQUIRED_READY',
          aggregate: 'EXACT_REQUIRED_FONT_PASS',
        },
      },
    });
  });

  it('is not ready when a required locked contract is missing', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-003')],
        status({ lockedCount: 2 }),
      ),
      new StubConfig('required', defaultFontReport()) as unknown as AppConfigService,
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: false,
      checks: {
        contracts: {
          ok: false,
          missingLocked: ['BM-002'],
        },
      },
    });
  });

  it('is not ready when the repository reports invalid files', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status({
          invalidFiles: [
            {
              path: 'D:/repo/contracts/BM-004.json',
              message: 'Invalid JSON',
            },
          ],
        }),
      ),
      new StubConfig('required', defaultFontReport()) as unknown as AppConfigService,
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: false,
      checks: {
        contracts: {
          ok: false,
          invalidFileCount: 1,
        },
      },
    });
  });

  it('is not ready when the contracts root is unavailable', async () => {
    const service = new ReadinessService(
      new ReadinessRepository([], status({ ready: false, lockedCount: 0 })),
      new StubConfig('required', defaultFontReport()) as unknown as AppConfigService,
    );

    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: false,
      checks: {
        contracts: {
          ok: false,
          missingLocked: ['BM-001', 'BM-002', 'BM-003'],
        },
      },
    });
  });

  it('reports FONT_REQUIRED_NOT_READY when production policy lacks the exact family', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig(
        'required',
        defaultFontReport({
          aggregate: 'EXACT_REQUIRED_FONT_MISSING',
          presentStyles: [],
          missingStyles: ['Regular', 'Bold', 'Italic', 'Bold Italic'],
        }),
      ) as unknown as AppConfigService,
    );
    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: false,
      checks: { fonts: { ok: false, status: 'FONT_REQUIRED_NOT_READY' } },
    });
  });

  it('reports FONT_FALLBACK_DEV_ONLY when dev policy permits substitution', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig(
        'fallback-allowed',
        defaultFontReport({
          policy: 'fallback-allowed',
          aggregate: 'ALIAS_ONLY',
        }),
      ) as unknown as AppConfigService,
    );
    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: true,
      checks: { fonts: { ok: true, status: 'FONT_FALLBACK_DEV_ONLY' } },
    });
  });

  it('reports FONT_REPORT_MISSING when the entrypoint did not write a report', async () => {
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig('required', null) as unknown as AppConfigService,
    );
    await expect(service.getReadiness()).resolves.toMatchObject({
      ok: false,
      checks: { fonts: { status: 'FONT_REPORT_MISSING' } },
    });
  });
});
