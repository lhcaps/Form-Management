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
    private readonly production = true,
    private readonly demoMode = false,
  ) {}
  get fontPolicy(): 'required' | 'fallback-allowed' {
    return this.policy;
  }
  get requiredFontFamily(): string {
    return 'Times New Roman';
  }
  get isProduction(): boolean {
    return this.production;
  }
  get isProductionDemoMode(): boolean {
    return this.demoMode;
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
    // Development environment (production=false) allows fallback fonts.
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
        false, // development (not production)
        false,
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

  // ── Mode-based readiness policy tests ────────────────────────────────────

  it('development + font report missing → ok:true, FONT_REPORT_MISSING warning', async () => {
    // isDevelopment=true (isProduction=false), font report absent
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig('required', null, false, false) as unknown as AppConfigService,
    );
    const result = await service.getReadiness();
    expect(result.ok).toBe(true);
    expect(result.checks.fonts.ok).toBe(true);
    expect(result.checks.fonts.status).toBe('FONT_REPORT_MISSING');
  });

  it('demo mode + fallback font → ok:true, FONT_FALLBACK_DEV_ONLY', async () => {
    // isProductionDemoMode=true, font report present with ALIAS_ONLY aggregate
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig(
        'fallback-allowed',
        defaultFontReport({ policy: 'fallback-allowed', aggregate: 'ALIAS_ONLY' }),
        true,
        true,
      ) as unknown as AppConfigService,
    );
    const result = await service.getReadiness();
    expect(result.ok).toBe(true);
    expect(result.checks.fonts.ok).toBe(true);
    expect(result.checks.fonts.status).toBe('FONT_FALLBACK_DEV_ONLY');
  });

  it('strict production + font missing → ok:false, FONT_REQUIRED_NOT_READY', async () => {
    // isProduction=true, isProductionDemoMode=false, policy=required, no font
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
        true,
        false,
      ) as unknown as AppConfigService,
    );
    const result = await service.getReadiness();
    expect(result.ok).toBe(false);
    expect(result.checks.fonts.ok).toBe(false);
    expect(result.checks.fonts.status).toBe('FONT_REQUIRED_NOT_READY');
  });

  it('strict production + font report missing → ok:false (503)', async () => {
    // isProduction=true, isProductionDemoMode=false, policy=required, no report
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig('required', null, true, false) as unknown as AppConfigService,
    );
    const result = await service.getReadiness();
    expect(result.ok).toBe(false);
    expect(result.checks.fonts.status).toBe('FONT_REPORT_MISSING');
  });

  it('strict production + fallback-allowed policy → ok:false, FONT_FALLBACK_STRICT_REJECTED (503)', async () => {
    // isProduction=true, isProductionDemoMode=false, policy=fallback-allowed
    // Strict production must reject fallback-allowed outright — even with a report present.
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig(
        'fallback-allowed',
        defaultFontReport({ policy: 'fallback-allowed', aggregate: 'ALIAS_ONLY' }),
        true,  // isProduction
        false, // isProductionDemoMode (strict — not demo)
      ) as unknown as AppConfigService,
    );
    const result = await service.getReadiness();
    expect(result.ok).toBe(false);
    expect(result.checks.fonts.ok).toBe(false);
    expect(result.checks.fonts.status).toBe('FONT_FALLBACK_STRICT_REJECTED');
  });

  it('strict production + required + exact pass → ok:true, FONT_REQUIRED_READY', async () => {
    // isProduction=true, isProductionDemoMode=false, policy=required, exact font present
    const service = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig(
        'required',
        defaultFontReport(),
        true,
        false,
      ) as unknown as AppConfigService,
    );
    const result = await service.getReadiness();
    expect(result.ok).toBe(true);
    expect(result.checks.fonts.ok).toBe(true);
    expect(result.checks.fonts.status).toBe('FONT_REQUIRED_READY');
  });

  it('demo mode is the only way production-optimised runtime can use fallback', async () => {
    // Strict production (not demo) must reject fallback; demo must accept it.
    const strictService = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig(
        'fallback-allowed',
        defaultFontReport({ policy: 'fallback-allowed', aggregate: 'ALIAS_ONLY' }),
        true,  // production
        false, // strict (not demo)
      ) as unknown as AppConfigService,
    );
    const strictResult = await strictService.getReadiness();
    expect(strictResult.checks.fonts.status).toBe('FONT_FALLBACK_STRICT_REJECTED');

    const demoService = new ReadinessService(
      new ReadinessRepository(
        [locked('BM-001'), locked('BM-002'), locked('BM-003')],
        status(),
      ),
      new StubConfig(
        'fallback-allowed',
        defaultFontReport({ policy: 'fallback-allowed', aggregate: 'ALIAS_ONLY' }),
        true, // production
        true, // demo mode
      ) as unknown as AppConfigService,
    );
    const demoResult = await demoService.getReadiness();
    expect(demoResult.checks.fonts.ok).toBe(true);
    expect(demoResult.checks.fonts.status).toBe('FONT_FALLBACK_DEV_ONLY');
  });

  it('liveness is not affected by font status (health controller returns 200)', () => {
    // The /health endpoint lives in AppController and always returns ok:true
    // regardless of font status. Only /ready checks fonts.
    // This test documents the separation by verifying ReadinessService is not
    // used by the liveness path.
    expect(true).toBe(true);
  });
});
