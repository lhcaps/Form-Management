import { Bm031DirectController } from './bm031-direct.controller';

describe('Bm031DirectController', () => {
  it('routes BM-031 direct form-inputs save through the generated input save orchestrator', async () => {
    const envelope = {
      ok: true,
      route: 'bm031-direct' as const,
      result: { ok: true, snapshot: { documentId: '77' } },
    };
    const generatedInputSave = {
      save: jest.fn().mockResolvedValue(envelope),
    };
    const service = {
      resolveDocumentId: jest.fn().mockResolvedValue(77),
      saveFormInputs: jest.fn(),
      getDirectRenderPayload: jest.fn(),
    };
    const controller = new Bm031DirectController(
      service as never,
      generatedInputSave as never,
    );

    const body = {
      legalBasis: { requestApprovalLine: 'Lệnh bắt người bị giữ trong trường hợp khẩn cấp' },
    };
    const result = await controller.saveFormInputs('77', body);

    expect(result).toEqual({ ok: true, snapshot: { documentId: '77' } });
    expect(generatedInputSave.save).toHaveBeenCalledWith({
      intent: 'GENERATED_BM031_DIRECT_SAVE',
      documentId: '77',
      body,
    });
    expect(service.saveFormInputs).not.toHaveBeenCalled();
    expect(service.resolveDocumentId).not.toHaveBeenCalled();
  });

  it('forwards BM-031 template mismatch errors from the orchestrator unchanged', async () => {
    class BmTemplateMismatch extends Error {
      readonly code = 'BM031_TEMPLATE_MISMATCH';
    }
    const generatedInputSave = {
      save: jest.fn().mockRejectedValue(new BmTemplateMismatch('not BM-031')),
    };
    const service = {
      resolveDocumentId: jest.fn().mockResolvedValue(77),
      saveFormInputs: jest.fn(),
      getDirectRenderPayload: jest.fn(),
    };
    const controller = new Bm031DirectController(
      service as never,
      generatedInputSave as never,
    );

    await expect(
      controller.saveFormInputs('77', { anything: 'goes' }),
    ).rejects.toBeInstanceOf(BmTemplateMismatch);
    expect(generatedInputSave.save).toHaveBeenCalledTimes(1);
  });

  it('still resolves document id for getDirectRenderPayload (non-orchestrated route)', async () => {
    const generatedInputSave = { save: jest.fn() };
    const service = {
      resolveDocumentId: jest.fn().mockResolvedValue(77),
      saveFormInputs: jest.fn(),
      getDirectRenderPayload: jest.fn().mockResolvedValue({ id: '77' }),
    };
    const controller = new Bm031DirectController(
      service as never,
      generatedInputSave as never,
    );

    await expect(controller.getDirectRenderPayload('77')).resolves.toEqual({
      id: '77',
    });
    expect(service.resolveDocumentId).toHaveBeenCalledWith('77');
    expect(service.getDirectRenderPayload).toHaveBeenCalledWith(77);
    expect(generatedInputSave.save).not.toHaveBeenCalled();
  });
});
