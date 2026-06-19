import { join } from 'node:path';
import { WorkspacePathsService } from '../../../../infrastructure/paths/workspace-paths.service';
import type {
  GeneratedDocumentDescriptorPort,
  DocumentRenderCommand,
} from './document-renderer.ports';
import { ContractRenderPlanBuilder } from './contract-render-plan.builder';
import { ContractShadowRendererOrchestrator } from './contract-shadow-renderer.orchestrator';
import { DocxtemplaterContractRenderEngine } from '../infrastructure/docxtemplater-contract-render-engine';
import type { ContractRenderPlan } from '../domain/contract-render-plan';

describe('ContractShadowRendererOrchestrator', () => {
  it('writes shadow evidence under the configured generated documents root', async () => {
    const command: DocumentRenderCommand = {
      actor: null,
      documentId: 'document-1',
      options: {},
    };
    const descriptors = {
      findByDocumentId: jest.fn().mockResolvedValue({
        documentId: 'document-1',
        formData: {},
        templateCode: 'BM-001',
      }),
    } as unknown as GeneratedDocumentDescriptorPort;
    const plan = {
      templateCode: 'BM-001',
    } as ContractRenderPlan;
    const planBuilder = {
      build: jest.fn().mockReturnValue(plan),
    } as unknown as ContractRenderPlanBuilder;
    const renderEngine = {
      renderShadow: jest.fn().mockResolvedValue({}),
    } as unknown as DocxtemplaterContractRenderEngine;
    const workspace = {
      generatedDocumentsRoot: join('D:', 'configured-storage', 'generated'),
    } as WorkspacePathsService;
    const orchestrator = new ContractShadowRendererOrchestrator(
      descriptors,
      planBuilder,
      renderEngine,
      workspace,
    );

    await orchestrator.renderShadow(command, {});

    expect(renderEngine.renderShadow).toHaveBeenCalledWith(
      plan,
      {},
      join(workspace.generatedDocumentsRoot, 'shadow-renders'),
    );
  });

  it('delegates any allow-listed locked template instead of hard-coding BM-001', async () => {
    const command: DocumentRenderCommand = {
      actor: null,
      documentId: 'document-2',
      options: {},
    };
    const descriptors = {
      findByDocumentId: jest.fn().mockResolvedValue({
        documentId: 'document-2',
        formData: {},
        templateCode: 'BM-002',
      }),
    } as unknown as GeneratedDocumentDescriptorPort;
    const plan = {
      templateCode: 'BM-002',
    } as ContractRenderPlan;
    const planBuilder = {
      build: jest.fn().mockReturnValue(plan),
    } as unknown as ContractRenderPlanBuilder;
    const renderEngine = {
      renderShadow: jest.fn().mockResolvedValue({}),
    } as unknown as DocxtemplaterContractRenderEngine;
    const workspace = {
      generatedDocumentsRoot: join('D:', 'configured-storage', 'generated'),
    } as WorkspacePathsService;
    const orchestrator = new ContractShadowRendererOrchestrator(
      descriptors,
      planBuilder,
      renderEngine,
      workspace,
    );

    await orchestrator.renderShadow(command, {});

    expect(planBuilder.build).toHaveBeenCalled();
    expect(renderEngine.renderShadow).toHaveBeenCalledWith(
      plan,
      {},
      join(workspace.generatedDocumentsRoot, 'shadow-renders'),
    );
  });
});
