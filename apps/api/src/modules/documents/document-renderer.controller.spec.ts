import type { CurrentUser } from '../auth/current-user.type';
import { DocumentRendererController } from './document-renderer.controller';

const user: CurrentUser = {
  id: '7',
  username: 'ksv-a',
  fullName: 'Kiểm sát viên A',
  positionTitle: null,
  rankTitle: null,
  email: null,
  phone: null,
  role: 'OFFICIAL',
  agencyId: null,
  agencyName: null,
  agencyCode: null,
  isActive: true,
  permissions: [],
};

describe('DocumentRendererController', () => {
  it('routes DOCX rendering through the application use case', async () => {
    const renderer = {
      renderDocx: jest.fn(),
    };
    const result = {
      skipped: false,
      file: {
        id: '99',
      },
    };
    const renderUseCase = {
      execute: jest.fn().mockResolvedValue(result),
    };
    const controller = new DocumentRendererController(
      renderer as never,
      renderUseCase as never,
      { save: jest.fn() } as never,
    );

    await expect(
      controller.renderDocx('42', { force: true }, user),
    ).resolves.toBe(result);
    expect(renderUseCase.execute).toHaveBeenCalledWith({
      documentId: '42',
      options: {
        force: true,
        renderedByName: user.fullName,
      },
      actor: user,
    });
    expect(renderer.renderDocx).not.toHaveBeenCalled();
  });

  it('keeps payload reads on the existing renderer service', () => {
    const payload = {
      documentId: '42',
    };
    const renderer = {
      getRenderPayload: jest.fn().mockReturnValue(payload),
    };
    const controller = new DocumentRendererController(
      renderer as never,
      { execute: jest.fn() } as never,
      { save: jest.fn() } as never,
    );

    expect(controller.getRenderPayload('42', user)).toBe(payload);
    expect(renderer.getRenderPayload).toHaveBeenCalledWith('42', user);
  });

  it('routes legacy form-inputs save through the generated input save orchestrator', async () => {
    const envelope = { ok: true, route: 'legacy-form-inputs', result: { documentId: '42' } };
    const renderer = { updateFormInputs: jest.fn() };
    const generatedInputSave = {
      save: jest.fn().mockResolvedValue(envelope),
    };
    const controller = new DocumentRendererController(
      renderer as never,
      { execute: jest.fn() } as never,
      generatedInputSave as never,
    );

    const body = { agency: { name: 'VKSKV7' } };
    const result = await controller.updateFormInputs('42', body, user);

    expect(result).toEqual({ documentId: '42' });
    expect(generatedInputSave.save).toHaveBeenCalledWith({
      intent: 'GENERATED_SAVE_LEGACY_INPUTS',
      documentId: '42',
      actor: user,
      body: { ...body, updatedByName: user.fullName },
    });
    expect(renderer.updateFormInputs).not.toHaveBeenCalled();
  });
});
