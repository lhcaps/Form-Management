import { ContractDocumentRendererAdapter } from './contract-document-renderer.adapter';
import { ContractShadowRendererOrchestrator } from '../application/contract-shadow-renderer.orchestrator';
import type { DocumentRenderCommand } from '../application/document-renderer.ports';

const command: DocumentRenderCommand = {
  documentId: '42',
  options: { force: true },
  actor: null,
};

describe('ContractDocumentRendererAdapter', () => {
  describe('renderActive', () => {
    it('calls renderActive on the orchestrator and returns a result', async () => {
      const orchestrator = {
        renderActive: jest.fn().mockResolvedValue(undefined),
      } as unknown as ContractShadowRendererOrchestrator;
      const adapter = new ContractDocumentRendererAdapter(orchestrator);

      const result = await adapter.renderActive(command);

      expect(orchestrator.renderActive).toHaveBeenCalledWith('42');
      expect(result).toEqual({ documentId: '42', renderedBy: 'contract-active' });
    });

    it('propagates orchestrator errors', async () => {
      const orchestrator = {
        renderActive: jest.fn().mockRejectedValue(new Error('plan build failed')),
      } as unknown as ContractShadowRendererOrchestrator;
      const adapter = new ContractDocumentRendererAdapter(orchestrator);

      await expect(adapter.renderActive(command)).rejects.toThrow('plan build failed');
    });
  });

  describe('renderShadow', () => {
    it('delegates to the orchestrator', async () => {
      const orchestrator = {
        renderShadow: jest.fn().mockResolvedValue(undefined),
      } as unknown as ContractShadowRendererOrchestrator;
      const adapter = new ContractDocumentRendererAdapter(orchestrator);

      await adapter.renderShadow(command, {});

      expect(orchestrator.renderShadow).toHaveBeenCalledWith(command, {});
    });

    it('passes orchestrator errors through', async () => {
      const orchestrator = {
        renderShadow: jest.fn().mockRejectedValue(new Error('orchestrator error')),
      } as unknown as ContractShadowRendererOrchestrator;
      const adapter = new ContractDocumentRendererAdapter(orchestrator);

      await expect(adapter.renderShadow(command, {})).rejects.toThrow(
        'orchestrator error',
      );
    });
  });
});
