import { Logger } from '@nestjs/common';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FormsCatalogService } from './forms-catalog.service';

type ContractFixture = {
  sourceId: string;
  templateCode: string;
  templateTitle: string;
  documentKind: 'form' | 'reference';
  status: 'locked' | 'draft';
  docxSlots: unknown[];
  canonicalFields: unknown[];
  renderBindings: unknown[];
};

describe('FormsCatalogService', () => {
  const temporaryRoots: string[] = [];
  const originalRepoRoot = process.env.REPO_ROOT;

  afterEach(() => {
    if (originalRepoRoot === undefined) {
      delete process.env.REPO_ROOT;
    } else {
      process.env.REPO_ROOT = originalRepoRoot;
    }

    jest.restoreAllMocks();
    for (const root of temporaryRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  function createWorkspace(options: { withContracts?: boolean } = {}): {
    root: string;
    contractsRoot: string;
  } {
    const root = mkdtempSync(join(tmpdir(), 'qlv-contracts-'));
    temporaryRoots.push(root);
    writeFileSync(join(root, 'pnpm-workspace.yaml'), 'packages: []\n');

    const contractsRoot = join(root, 'docs', 'audit', 'docx', 'contracts');
    if (options.withContracts !== false) {
      mkdirSync(join(contractsRoot, 'locked'), { recursive: true });
    }

    process.env.REPO_ROOT = root;
    return { root, contractsRoot };
  }

  function contract(
    templateCode: string,
    status: 'locked' | 'draft',
    documentKind: 'form' | 'reference' = 'form',
  ): ContractFixture {
    return {
      sourceId: `${templateCode}__${status}`,
      templateCode,
      templateTitle: `${templateCode} ${status}`,
      documentKind,
      status,
      docxSlots: [],
      canonicalFields: [],
      renderBindings: [],
    };
  }

  function writeContract(
    contractsRoot: string,
    fixture: ContractFixture,
    fileName: string,
  ): void {
    const directory =
      fixture.status === 'locked'
        ? join(contractsRoot, 'locked')
        : contractsRoot;
    writeFileSync(join(directory, fileName), JSON.stringify(fixture), 'utf8');
  }

  it('prefers a locked contract over the matching draft', () => {
    const { contractsRoot } = createWorkspace();
    writeContract(
      contractsRoot,
      contract('BM-001', 'draft'),
      'BM-001.contract.draft.json',
    );
    writeContract(
      contractsRoot,
      contract('BM-001', 'locked'),
      'BM-001.contract.locked.json',
    );

    const catalog = new FormsCatalogService().getCatalog();

    expect(catalog).toEqual([
      expect.objectContaining({
        templateCode: 'BM-001',
        status: 'locked',
        runtimeEligible: true,
      }),
    ]);
  });

  it('excludes reference documents', () => {
    const { contractsRoot } = createWorkspace();
    writeContract(
      contractsRoot,
      contract('BM-001', 'locked'),
      'BM-001.contract.locked.json',
    );
    writeContract(
      contractsRoot,
      contract('BM-999', 'draft', 'reference'),
      'BM-999.contract.draft.json',
    );

    const catalog = new FormsCatalogService().getCatalog();

    expect(catalog.map((item) => item.templateCode)).toEqual(['BM-001']);
  });

  it('throws when the contracts root is missing', () => {
    createWorkspace({ withContracts: false });

    expect(() => new FormsCatalogService().getCatalog()).toThrow(
      'Contracts root does not exist',
    );
  });

  it('logs the invalid contract path and parse error before skipping it', () => {
    const { contractsRoot } = createWorkspace();
    const invalidPath = join(contractsRoot, 'BM-004.contract.draft.json');
    writeFileSync(invalidPath, '{invalid-json', 'utf8');
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    expect(new FormsCatalogService().getCatalog()).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(invalidPath));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Cannot parse form contract'),
    );
  });

  it('keeps a draft contract non-runtime-eligible', () => {
    const { contractsRoot } = createWorkspace();
    writeContract(
      contractsRoot,
      contract('BM-004', 'draft'),
      'BM-004.contract.draft.json',
    );

    expect(new FormsCatalogService().getCatalog()).toEqual([
      expect.objectContaining({
        templateCode: 'BM-004',
        status: 'draft',
        runtimeEligible: false,
      }),
    ]);
  });
});
