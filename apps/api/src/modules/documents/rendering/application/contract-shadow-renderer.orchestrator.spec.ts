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
      repoRoot: join('D:', 'configured-storage'),
      generatedDocumentsRoot: join('D:', 'configured-storage', 'generated'),
    } as WorkspacePathsService;
    const prisma = {} as never;
    const orchestrator = new ContractShadowRendererOrchestrator(
      descriptors,
      planBuilder,
      renderEngine,
      workspace,
      prisma,
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
      repoRoot: join('D:', 'configured-storage'),
      generatedDocumentsRoot: join('D:', 'configured-storage', 'generated'),
    } as WorkspacePathsService;
    const prisma = {} as never;
    const orchestrator = new ContractShadowRendererOrchestrator(
      descriptors,
      planBuilder,
      renderEngine,
      workspace,
      prisma,
    );

    await orchestrator.renderShadow(command, {});

    expect(planBuilder.build).toHaveBeenCalled();
    expect(renderEngine.renderShadow).toHaveBeenCalledWith(
      plan,
      {},
      join(workspace.generatedDocumentsRoot, 'shadow-renders'),
    );
  });

  it('registers active renders as generated DOCX files for preview', async () => {
    const repoRoot = join('D:', 'repo');
    const artifactPath = join(
      repoRoot,
      'storage',
      'generated',
      'cases',
      'document-bm-001',
      'BM-001_active_20260702-231500.docx',
    );
    const descriptors = {
      findByDocumentId: jest.fn().mockResolvedValue({
        documentId: '101',
        formData: {},
        templateCode: 'BM-001',
      }),
    } as unknown as GeneratedDocumentDescriptorPort;
    const plan = {
      sourceId: 'BM-001',
      templateCode: 'BM-001',
      contractStatus: 'locked',
      fields: [],
      bindings: [],
      missingRequired: [],
      warnings: [],
    } as unknown as ContractRenderPlan;
    const planBuilder = {
      build: jest.fn().mockReturnValue(plan),
    } as unknown as ContractRenderPlanBuilder;
    const renderEngine = {
      renderActiveDocx: jest.fn().mockResolvedValue(Buffer.from('docx-data')),
      persistActiveRender: jest.fn().mockResolvedValue({
        fileName: 'BM-001_active_20260702-231500.docx',
        docxPath: artifactPath,
        manifestPath: artifactPath.replace('.docx', '.manifest.json'),
        checksum: 'abc123',
        bytes: 123,
      }),
    } as unknown as DocxtemplaterContractRenderEngine;
    const workspace = {
      repoRoot,
      generatedDocumentsRoot: join(repoRoot, 'storage', 'generated'),
    } as WorkspacePathsService;
    const tx = {
      stored_files: {
        create: jest.fn().mockResolvedValue({ id: 900n }),
      },
      generated_document_files: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({
          id: 9n,
          file_format: 'DOCX',
          file_name: 'BM-001_active_20260702-231500.docx',
          file_path:
            'storage/generated/cases/document-bm-001/BM-001_active_20260702-231500.docx',
          file_size_bytes: 123n,
          checksum: 'abc123',
          is_final: false,
        }),
      },
      generated_documents: {
        update: jest.fn().mockResolvedValue({}),
      },
      case_events: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      generated_documents: {
        findUnique: jest.fn().mockResolvedValue({
          id: 101n,
          case_id: 1n,
          document_title: 'BM-001 pilot',
          generated_by_name: 'Admin',
          review_status: 'WAITING_REVIEW',
        }),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    } as never;
    const orchestrator = new ContractShadowRendererOrchestrator(
      descriptors,
      planBuilder,
      renderEngine,
      workspace,
      prisma,
    );

    const result = await orchestrator.renderActive('101');

    expect(result).toMatchObject({
      documentId: '101',
      renderedBy: 'contract-active',
      file: {
        id: '9',
        fileFormat: 'DOCX',
        fileName: 'BM-001_active_20260702-231500.docx',
        filePath:
          'storage/generated/cases/document-bm-001/BM-001_active_20260702-231500.docx',
        fileSizeBytes: '123',
        checksum: 'abc123',
        isFinal: false,
      },
    });
    expect(tx.generated_document_files.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        generated_document_id: 101n,
        file_format: 'DOCX',
        file_path:
          'storage/generated/cases/document-bm-001/BM-001_active_20260702-231500.docx',
        file_size_bytes: 123n,
        checksum: 'abc123',
      }),
    });
  });
});
