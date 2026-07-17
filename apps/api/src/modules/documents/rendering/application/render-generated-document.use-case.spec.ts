import { AppConfigService } from '../../../../infrastructure/config/app-config.service';
import { ApiRenderOrchestrator } from './api-render-core/api-render-orchestrator';
import { GeneratedDocumentRenderAdapter } from './api-render-core/generated-document-render.adapter';
import type {
  ContractDocumentRendererPort,
  DocumentRenderCommand,
  DocumentRenderResult,
  GeneratedDocumentDescriptorPort,
  LegacyDocumentRendererPort,
} from './document-renderer.ports';
import { DocumentRendererRoutingPolicy } from './document-renderer-routing.policy';
import { RenderGeneratedDocumentUseCase } from './render-generated-document.use-case';
import { ContractShadowRendererOrchestrator } from './contract-shadow-renderer.orchestrator';

const command: DocumentRenderCommand = {
  documentId: '42',
  options: {
    force: true,
    renderedByName: 'KSV A',
  },
  actor: null,
};

function createAdapterHarness(env: Record<string, string> = {}) {
  const legacyResult: DocumentRenderResult = {
    skipped: false,
    renderer: 'legacy',
  };
  const contractResult: DocumentRenderResult = {
    skipped: false,
    renderer: 'contract',
  };
  const calls = {
    legacy: 0,
    descriptor: 0,
    active: 0,
    orchestrator: 0,
  };

  const legacy: LegacyDocumentRendererPort = {
    async render() {
      calls.legacy += 1;
      return legacyResult;
    },
  };
  const descriptor: GeneratedDocumentDescriptorPort = {
    async findByDocumentId() {
      calls.descriptor += 1;
      return {
        documentId: '42',
        templateCode: 'BM-001',
      };
    },
  };
  const contract: ContractDocumentRendererPort = {
    async renderActive() {
      calls.active += 1;
      return contractResult;
    },
    async renderShadow() {},
  };
  const shadowOrchestrator = {
    renderShadow: jest.fn().mockImplementation(async () => {
      calls.orchestrator += 1;
    }),
  } as unknown as ContractShadowRendererOrchestrator;
  const policy = new DocumentRendererRoutingPolicy(new AppConfigService(env));
  const adapter = new GeneratedDocumentRenderAdapter(
    legacy,
    contract,
    descriptor,
    policy,
    shadowOrchestrator,
  );

  return {
    adapter,
    calls,
    contract,
    contractResult,
    descriptor,
    legacyResult,
    shadowOrchestrator,
  };
}

describe('RenderGeneratedDocumentUseCase', () => {
  it('delegates generated DOCX render to the shared API render orchestrator', async () => {
    const result: DocumentRenderResult = {
      skipped: false,
      renderer: 'legacy',
      file: {
        id: '99',
        fileFormat: 'DOCX',
      },
    };
    const orchestrator = {
      renderGeneratedDocumentDocx: jest.fn().mockResolvedValue(result),
    } as unknown as ApiRenderOrchestrator;
    const useCase = new RenderGeneratedDocumentUseCase(orchestrator);

    await expect(useCase.execute(command)).resolves.toBe(result);
    expect(orchestrator.renderGeneratedDocumentDocx).toHaveBeenCalledWith(
      command,
    );
  });
});

describe('GeneratedDocumentRenderAdapter', () => {
  it('preserves the legacy path without descriptor lookup when mode is off', async () => {
    const harness = createAdapterHarness();

    await expect(harness.adapter.renderDocx(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls).toEqual({
      legacy: 1,
      descriptor: 0,
      active: 0,
      orchestrator: 0,
    });
  });

  it('uses legacy for templates outside the active allow-list', async () => {
    const harness = createAdapterHarness({
      DOCUMENT_RENDERER_MODE: 'active',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-002',
    });

    await expect(harness.adapter.renderDocx(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls).toEqual({
      legacy: 1,
      descriptor: 1,
      active: 0,
      orchestrator: 0,
    });
  });

  it('uses the contract renderer for an active allow-listed template', async () => {
    const harness = createAdapterHarness({
      DOCUMENT_RENDERER_MODE: 'active',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });

    await expect(harness.adapter.renderDocx(command)).resolves.toBe(
      harness.contractResult,
    );
    expect(harness.calls).toEqual({
      legacy: 0,
      descriptor: 1,
      active: 1,
      orchestrator: 0,
    });
  });

  it('does not silently fall back when active contract rendering fails', async () => {
    const harness = createAdapterHarness({
      DOCUMENT_RENDERER_MODE: 'active',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });
    harness.contract.renderActive = async () => {
      harness.calls.active += 1;
      throw new Error('contract renderer failed');
    };

    await expect(harness.adapter.renderDocx(command)).rejects.toThrow(
      'contract renderer failed',
    );
    expect(harness.calls.legacy).toBe(0);
  });

  it('returns the legacy result when shadow comparison succeeds', async () => {
    const harness = createAdapterHarness({
      DOCUMENT_RENDERER_MODE: 'shadow',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });

    await expect(harness.adapter.renderDocx(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls).toEqual({
      legacy: 1,
      descriptor: 1,
      active: 0,
      orchestrator: 1,
    });
    expect(harness.shadowOrchestrator.renderShadow).toHaveBeenCalledTimes(1);
  });

  it('keeps the user request successful when shadow comparison fails', async () => {
    const harness = createAdapterHarness({
      DOCUMENT_RENDERER_MODE: 'shadow',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });
    (harness.shadowOrchestrator.renderShadow as jest.Mock).mockRejectedValueOnce(
      new Error('shadow unavailable'),
    );

    await expect(harness.adapter.renderDocx(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls.legacy).toBe(1);
    expect(harness.shadowOrchestrator.renderShadow).toHaveBeenCalledTimes(1);
  });

  it('keeps the user request successful when shadow orchestrator throws', async () => {
    const harness = createAdapterHarness({
      DOCUMENT_RENDERER_MODE: 'shadow',
      DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-001',
    });
    (harness.shadowOrchestrator.renderShadow as jest.Mock).mockRejectedValueOnce(
      new Error('orchestrator error'),
    );

    await expect(harness.adapter.renderDocx(command)).resolves.toBe(
      harness.legacyResult,
    );
    expect(harness.calls.legacy).toBe(1);
    expect(harness.shadowOrchestrator.renderShadow).toHaveBeenCalledTimes(1);
  });

  it('returns the legacy result when template is allow-listed in shadow mode', async () => {
    const calls = { legacy: 0, descriptor: 0, active: 0, orchestrator: 0 };
    const legacyResult: DocumentRenderResult = {
      skipped: false,
      renderer: 'legacy',
    };
    const legacy: LegacyDocumentRendererPort = {
      async render() {
        calls.legacy += 1;
        return legacyResult;
      },
    };
    const descriptor: GeneratedDocumentDescriptorPort = {
      async findByDocumentId() {
        calls.descriptor += 1;
        return { documentId: '42', templateCode: 'BM-002' };
      },
    };
    const contract: ContractDocumentRendererPort = {
      async renderActive() {
        calls.active += 1;
        return {};
      },
      async renderShadow() {},
    };
    const shadowOrchestrator = {
      renderShadow: jest.fn().mockImplementation(async () => {
        calls.orchestrator += 1;
      }),
    } as unknown as ContractShadowRendererOrchestrator;
    const policy = new DocumentRendererRoutingPolicy(
      new AppConfigService({
        DOCUMENT_RENDERER_MODE: 'shadow',
        DOCUMENT_RENDERER_CONTRACT_TEMPLATES: 'BM-002',
      }),
    );
    const adapter = new GeneratedDocumentRenderAdapter(
      legacy,
      contract,
      descriptor,
      policy,
      shadowOrchestrator,
    );

    await expect(adapter.renderDocx(command)).resolves.toBe(legacyResult);
    expect(shadowOrchestrator.renderShadow).toHaveBeenCalledTimes(1);
  });
});
