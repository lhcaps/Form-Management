import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { FormContractRepository } from '../forms-contracts/application/form-contract.repository';

const REQUIRED_LOCKED_CONTRACTS = ['BM-001', 'BM-002', 'BM-003'] as const;

export type ReadinessInfo = {
  ok: boolean;
  service: 'QUANLYVKS API';
  timestamp: string;
  checks: {
    contracts: {
      ok: boolean;
      contractsRoot: string;
      lockedCount: number;
      draftCount: number;
      invalidFileCount: number;
      requiredLocked: readonly string[];
      missingLocked: string[];
      error?: string;
    };
    fonts: {
      ok: boolean;
      policy: 'required' | 'fallback-allowed';
      requiredFamily: string;
      status:
        | 'FONT_REQUIRED_READY'
        | 'FONT_REQUIRED_NOT_READY'
        | 'FONT_FALLBACK_DEV_ONLY'
        | 'FONT_REPORT_MISSING'
        | 'FONT_FALLBACK_STRICT_REJECTED';
      aggregate: string | null;
      presentStyles: string[];
      missingStyles: string[];
      fontDir: string | null;
    };
  };
};

@Injectable()
export class ReadinessService {
  constructor(
    private readonly contracts: FormContractRepository,
    private readonly config: AppConfigService,
  ) {}

  async getReadiness(): Promise<ReadinessInfo> {
    const status = await this.contracts.inspect();
    let lockedCodes = new Set<string>();
    let error: string | undefined;

    if (status.ready) {
      try {
        const contracts = await this.contracts.list();
        lockedCodes = new Set(
          contracts
            .filter((contract) => contract.status === 'locked')
            .map((contract) => contract.templateCode),
        );
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }
    }

    const missingLocked = REQUIRED_LOCKED_CONTRACTS.filter(
      (templateCode) => !lockedCodes.has(templateCode),
    );
    const contractsOk =
      status.ready &&
      !error &&
      status.invalidFiles.length === 0 &&
      missingLocked.length === 0;

    const fontCheck = this.evaluateFontStatus();

    return {
      ok: contractsOk && fontCheck.ok,
      service: 'QUANLYVKS API',
      timestamp: new Date().toISOString(),
      checks: {
        contracts: {
          ok: contractsOk,
          contractsRoot: status.contractsRoot,
          lockedCount: status.lockedCount,
          draftCount: status.draftCount,
          invalidFileCount: status.invalidFiles.length,
          requiredLocked: REQUIRED_LOCKED_CONTRACTS,
          missingLocked,
          ...(error ? { error } : {}),
        },
        fonts: fontCheck,
      },
    };
  }

  /**
   * Map the entrypoint-written font verification report to one of the
   * documented readiness states.
   *
   * Readiness policy by mode:
   *   - Development (NODE_ENV=development): font report missing is OK
   *     (local dev machines may not have Times New Roman installed).
   *     Readiness passes with FONT_REPORT_MISSING as warning.
   *
   *   - Production demo (NODE_ENV=production + QLLAW_DOCKER_MODE=demo):
   *     fallback-allowed policy is permitted; readiness passes with
   *     FONT_FALLBACK_DEV_ONLY as warning. Demo mode is the ONLY way a
   *     production-optimised runtime may use font fallback.
   *
   *   - Strict production (NODE_ENV=production, QLLAW_DOCKER_MODE != demo):
   *     fallback-allowed policy is always rejected (HTTP 503,
   *     FONT_FALLBACK_STRICT_REJECTED). Font report must show
   *     EXACT_REQUIRED_FONT_PASS; any other state → HTTP 503.
   */
  private evaluateFontStatus(): ReadinessInfo['checks']['fonts'] {
    const policy = this.config.fontPolicy;
    const requiredFamily = this.config.requiredFontFamily;
    const report = this.config.readFontVerificationReport();
    const isDevelopment = !this.config.isProduction;
    const isProductionDemo = this.config.isProductionDemoMode;
    // Strict production: production AND NOT demo mode.
    const isStrictProduction = this.config.isProduction && !isProductionDemo;

    // Strict production rejects fallback-allowed policy outright (fail-closed).
    if (isStrictProduction && policy === 'fallback-allowed') {
      return {
        ok: false,
        policy,
        requiredFamily,
        status: 'FONT_FALLBACK_STRICT_REJECTED',
        aggregate: report?.aggregate ?? null,
        presentStyles: report?.presentStyles ?? [],
        missingStyles: report?.missingStyles ?? [
          'Regular',
          'Bold',
          'Italic',
          'Bold Italic',
        ],
        fontDir: report?.fontDir ?? null,
      };
    }

    if (!report) {
      // Development or demo: missing report is a warning, readiness still ok.
      // Strict production: missing report → 503.
      return {
        ok: isDevelopment || isProductionDemo,
        policy,
        requiredFamily,
        status: 'FONT_REPORT_MISSING',
        aggregate: null,
        presentStyles: [],
        missingStyles: ['Regular', 'Bold', 'Italic', 'Bold Italic'],
        fontDir: null,
      };
    }

    const aggregate = report.aggregate;

    // Development or demo mode: font fallback is acceptable.
    if (isDevelopment || isProductionDemo) {
      return {
        ok: true,
        policy,
        requiredFamily,
        status: 'FONT_FALLBACK_DEV_ONLY',
        aggregate,
        presentStyles: report.presentStyles,
        missingStyles: report.missingStyles,
        fontDir: report.fontDir,
      };
    }

    // Strict production with required policy: exact family mandatory.
    const ready = aggregate === 'EXACT_REQUIRED_FONT_PASS';
    return {
      ok: ready,
      policy,
      requiredFamily,
      status: ready ? 'FONT_REQUIRED_READY' : 'FONT_REQUIRED_NOT_READY',
      aggregate,
      presentStyles: report.presentStyles,
      missingStyles: report.missingStyles,
      fontDir: report.fontDir,
    };
  }
}
