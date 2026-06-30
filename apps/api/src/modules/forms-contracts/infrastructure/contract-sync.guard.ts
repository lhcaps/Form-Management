/**
 * C1 — Contract Sync Guard
 *
 * Startup guard that verifies locked V1 contracts match runtime compiled contracts.
 * Compares compiled artifact hashes between filesystem and DB to detect drift.
 *
 * Strategy:
 *   locked V1 file → compile → artifact.contractHash (stableHash of compiled artifact)
 *   DB compiled_json → artifact.contractHash (already contains the hash)
 *   match = hashes equal
 *
 * Exit behavior:
 *   - Drift detected + ALLOW_CONTRACT_DRIFT=1 → log warning, allow startup
 *   - Drift detected + ALLOW_CONTRACT_DRIFT != 1 → throw error, block startup
 *   - No drift → startup proceeds normally
 *
 * DB unavailable fallback:
 *   - If DATABASE_URL not set or DB unreachable → verify all locked contracts have
 *     compiled-v2 artifacts, log warning, allow startup (file-only guard mode)
 */
import { Logger } from '@nestjs/common';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { resolveRepoRoot } from '../../../common/repo-root';

export type ContractSyncPathsOptions = {
  cwd?: string;
  repoRoot?: string;
};

export type ContractSyncPaths = {
  root: string;
  lockedDir: string;
  compiledV2Dir: string;
};

export function resolveContractSyncPaths(
  options: ContractSyncPathsOptions = {},
): ContractSyncPaths {
  const root = resolveRepoRoot({
    cwd: options.cwd,
    repoRoot: options.repoRoot ?? process.env.REPO_ROOT,
  });

  return {
    root,
    lockedDir: join(root, 'docs', 'audit', 'docx', 'contracts', 'locked'),
    compiledV2Dir: join(root, 'docs', 'audit', 'docx', 'compiled-v2'),
  };
}

interface ContractDrift {
  templateCode: string;
  sourceId: string;
  lockedHash: string;
  dbHash: string | null;
  status: 'MISSING_IN_DB' | 'STALE' | 'MATCHED';
}

interface GuardResult {
  strategy: 'DB_COMPARE' | 'FILE_ONLY' | 'DISABLED';
  totalLocked: number;
  matched: number;
  missingInDb: string[];
  stale: string[];
  driftDetected: boolean;
  canProceed: boolean;
  warnings: string[];
}

export class ContractSyncGuard {
  private readonly logger = new Logger('ContractSyncGuard');
  private readonly paths = resolveContractSyncPaths();

  /**
   * Main guard entry point
   * Called during app bootstrap
   */
  async verify(): Promise<void> {
    this.logger.log('🔍 Running contract sync guard...');

    const allowDrift = process.env.ALLOW_CONTRACT_DRIFT === '1';
    const result = await this.runGuard();

    // Log results
    this.logResults(result);

    // Decide whether to block startup
    if (result.driftDetected && !allowDrift) {
      const errorMsg = this.buildErrorMessage(result);
      this.logger.error('❌ Contract drift detected - blocking startup');
      throw new Error(errorMsg);
    }

    if (result.driftDetected && allowDrift) {
      this.logger.warn(
        '⚠️  Contract drift detected but ALLOW_CONTRACT_DRIFT=1 - startup allowed',
      );
    }

    if (!result.driftDetected && result.strategy !== 'DISABLED') {
      this.logger.log('✅ Contract sync guard passed');
    }
  }

  private async runGuard(): Promise<GuardResult> {
    // Check if guard is disabled
    if (process.env.DISABLE_CONTRACT_SYNC_GUARD === '1') {
      return {
        strategy: 'DISABLED',
        totalLocked: 0,
        matched: 0,
        missingInDb: [],
        stale: [],
        driftDetected: false,
        canProceed: true,
        warnings: ['Contract sync guard disabled via DISABLE_CONTRACT_SYNC_GUARD=1'],
      };
    }

    // Get locked contracts
    const lockedFiles = this.getLockedContractFiles();
    const lockedContracts = this.loadLockedContractsWithHashes(lockedFiles);

    // Try DB comparison first
    const dbAvailable = await this.isDatabaseAvailable();

    if (dbAvailable) {
      return await this.compareWithDatabase(lockedContracts);
    } else {
      return this.fileOnlyGuard(lockedContracts);
    }
  }

  private getLockedContractFiles(): string[] {
    if (!existsSync(this.paths.lockedDir)) {
      this.logger.warn(
        `Locked contracts directory not found: ${this.paths.lockedDir}`,
      );
      return [];
    }

    return readdirSync(this.paths.lockedDir)
      .filter((f) => f.endsWith('.contract.locked.json'))
      .sort()
      .map((f) => join(this.paths.lockedDir, f));
  }

  private loadLockedContractsWithHashes(files: string[]): Map<
    string,
    { sourceId: string; compiledHash: string | null; templateCode: string }
  > {
    const result = new Map();

    for (const file of files) {
      try {
        const raw = JSON.parse(readFileSync(file, 'utf8'));
        const templateCode = raw.templateCode || this.extractTemplateCodeFromFilename(file);
        const sourceId = raw.sourceId || templateCode;

        // Try to load compiled artifact
        const compiledPath = join(
          this.paths.compiledV2Dir,
          `${templateCode}.compiled.json`,
        );
        let compiledHash: string | null = null;

        if (existsSync(compiledPath)) {
          try {
            const compiled = JSON.parse(readFileSync(compiledPath, 'utf8'));
            compiledHash = compiled.contractHash || null;
          } catch (err) {
            this.logger.warn(`Failed to read compiled artifact for ${templateCode}: ${err.message}`);
          }
        }

        result.set(templateCode, { sourceId, compiledHash, templateCode });
      } catch (err) {
        this.logger.warn(`Failed to load locked contract ${file}: ${err.message}`);
      }
    }

    return result;
  }

  private extractTemplateCodeFromFilename(filePath: string): string {
    const filename = filePath.split(/[/\\]/).pop() || '';
    const match = filename.match(/^(BM-\d{3})/);
    return match ? match[1] : 'UNKNOWN';
  }

  private async isDatabaseAvailable(): Promise<boolean> {
    if (!process.env.DATABASE_URL) {
      return false;
    }

    try {
      const prisma = new PrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      return true;
    } catch {
      return false;
    }
  }

  private async compareWithDatabase(
    lockedContracts: Map<string, { sourceId: string; compiledHash: string | null; templateCode: string }>,
  ): Promise<GuardResult> {
    const prisma = new PrismaClient();
    const missingInDb: string[] = [];
    const stale: string[] = [];
    let matched = 0;

    try {
      // Compare against the latest global published contract per template.
      // Historical versions stay in the table and must not drive drift checks.
      const dbContracts = await prisma.form_contract_versions.findMany({
        where: { status: 'PUBLISHED', scope_key: 'GLOBAL', agency_id: null },
        select: {
          template_id: true,
          compiled_json: true,
          version_no: true,
        },
        orderBy: { version_no: 'desc' },
      });

      // Get template codes
      const templates = await prisma.templates.findMany({
        select: {
          id: true,
          template_code: true,
        },
      });

      const templateIdToCode = new Map(
        templates.map((t) => [t.id, t.template_code]),
      );

      const dbContractsByCode = new Map<string, unknown>();
      for (const contract of dbContracts) {
        const templateCode = templateIdToCode.get(contract.template_id);
        if (templateCode && !dbContractsByCode.has(templateCode)) {
          dbContractsByCode.set(templateCode, contract.compiled_json);
        }
      }

      // Compare each locked contract
      for (const [templateCode, locked] of lockedContracts.entries()) {
        if (!locked.compiledHash) {
          // No compiled artifact - consider as missing
          missingInDb.push(templateCode);
          continue;
        }

        const dbCompiledJson = dbContractsByCode.get(templateCode);
        if (!dbCompiledJson) {
          missingInDb.push(templateCode);
          continue;
        }

        // Extract contractHash from DB compiled_json
        const dbHash = (dbCompiledJson as any)?.contractHash || null;

        if (!dbHash) {
          // DB compiled_json doesn't have contractHash
          missingInDb.push(templateCode);
          continue;
        }

        // Compare hashes
        if (locked.compiledHash === dbHash) {
          matched++;
        } else {
          stale.push(templateCode);
        }
      }

      return {
        strategy: 'DB_COMPARE',
        totalLocked: lockedContracts.size,
        matched,
        missingInDb,
        stale,
        driftDetected: missingInDb.length > 0 || stale.length > 0,
        canProceed: false,
        warnings: [],
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  private fileOnlyGuard(
    lockedContracts: Map<string, { sourceId: string; compiledHash: string | null; templateCode: string }>,
  ): GuardResult {
    const missingCompiled: string[] = [];

    for (const [templateCode, locked] of lockedContracts.entries()) {
      if (!locked.compiledHash) {
        missingCompiled.push(templateCode);
      }
    }

    // FILE_ONLY mode: no DB available, so drift cannot be detected.
    // Missing compiled artifacts = pre-publish state (not drift).
    // Allow startup with a warning listing missing artifacts.
    // The CI gate (C2) will catch missing artifacts before merge.
    return {
      strategy: 'FILE_ONLY',
      totalLocked: lockedContracts.size,
      matched: lockedContracts.size - missingCompiled.length,
      missingInDb: missingCompiled,
      stale: [],
      driftDetected: false,
      canProceed: true,
      warnings: [
        'DATABASE_URL not set — using file-only guard mode',
        'Drift detection unavailable without DB. Only verifying compiled artifacts exist.',
        `${missingCompiled.length} locked contracts have no compiled artifact yet (run pnpm contract:compile)`,
      ],
    };
  }

  private logResults(result: GuardResult): void {
    this.logger.log(`Strategy: ${result.strategy}`);
    this.logger.log(`Total locked contracts: ${result.totalLocked}`);
    this.logger.log(`Matched: ${result.matched}`);
    this.logger.log(`Missing in DB: ${result.missingInDb.length}`);
    this.logger.log(`Stale: ${result.stale.length}`);

    if (result.warnings.length > 0) {
      result.warnings.forEach((w) => this.logger.warn(w));
    }

    if (result.missingInDb.length > 0) {
      this.logger.warn(
        `Missing in DB (first 10): ${result.missingInDb.slice(0, 10).join(', ')}`,
      );
    }

    if (result.stale.length > 0) {
      this.logger.warn(
        `Stale contracts (first 10): ${result.stale.slice(0, 10).join(', ')}`,
      );
    }
  }

  private buildErrorMessage(result: GuardResult): string {
    const lines = [
      'Contract sync guard failed - drift detected',
      '',
      `Strategy: ${result.strategy}`,
      `Total locked contracts: ${result.totalLocked}`,
      `Matched: ${result.matched}`,
      `Missing in DB: ${result.missingInDb.length}`,
      `Stale: ${result.stale.length}`,
      '',
    ];

    if (result.missingInDb.length > 0) {
      lines.push('Missing in DB:');
      result.missingInDb.slice(0, 20).forEach((tc) => lines.push(`  - ${tc}`));
      if (result.missingInDb.length > 20) {
        lines.push(`  ... and ${result.missingInDb.length - 20} more`);
      }
      lines.push('');
    }

    if (result.stale.length > 0) {
      lines.push('Stale contracts (hash mismatch):');
      result.stale.slice(0, 20).forEach((tc) => lines.push(`  - ${tc}`));
      if (result.stale.length > 20) {
        lines.push(`  ... and ${result.stale.length - 20} more`);
      }
      lines.push('');
    }

    lines.push('To allow startup despite drift:');
    lines.push('  Set environment variable: ALLOW_CONTRACT_DRIFT=1');
    lines.push('');
    lines.push('To fix:');
    if (result.missingInDb.length > 0) {
      lines.push('  1. Run: pnpm contract:compile');
      lines.push('  2. Run: pnpm publish:forms:db');
    }
    if (result.stale.length > 0) {
      lines.push('  1. Verify locked contracts match intended versions');
      lines.push('  2. Run: pnpm contract:compile');
      lines.push('  3. Run: pnpm publish:forms:db');
    }

    return lines.join('\n');
  }
}
