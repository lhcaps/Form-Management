import type { CurrentUser } from '../auth/current-user.type';
import { ContractFormInputsController } from './contract-form-inputs.controller';

const user: CurrentUser = {
  id: '7',
  username: 'ksv-a',
  fullName: 'Kiểm sát viên A',
  positionTitle: null,
  rankTitle: null,
  email: null,
  phone: null,
  role: 'OFFICIAL',
  agencyId: '3',
  agencyName: 'VKS 3',
  agencyCode: 'VKS3',
  isActive: true,
  permissions: [],
};

describe('ContractFormInputsController', () => {
  it('routes contract form-inputs save through the generated input save orchestrator', async () => {
    const envelope = {
      ok: true,
      route: 'contract-form-inputs' as const,
      result: { documentId: '11', contractHash: 'h-1' },
    };
    const generatedInputSave = {
      save: jest.fn().mockResolvedValue(envelope),
    };
    const controller = new ContractFormInputsController(
      generatedInputSave as never,
    );

    const body = { contractHash: 'h-1', data: { person: { fullName: 'A' } } };
    const result = await controller.save('11', body, user);

    expect(result).toEqual({ documentId: '11', contractHash: 'h-1' });
    expect(generatedInputSave.save).toHaveBeenCalledWith({
      intent: 'GENERATED_SAVE_CONTRACT_INPUTS',
      documentId: '11',
      actor: user,
      body,
    });
  });

  it('forwards contract validation errors from the orchestrator unchanged', async () => {
    class ContractValidationError extends Error {
      readonly code = 'CONTRACT_INPUT_VALIDATION_FAILED';
      readonly status = 422;
    }
    const generatedInputSave = {
      save: jest.fn().mockRejectedValue(new ContractValidationError('fail')),
    };
    const controller = new ContractFormInputsController(
      generatedInputSave as never,
    );

    await expect(
      controller.save(
        '11',
        { contractHash: 'h-1', data: {} },
        user,
      ),
    ).rejects.toBeInstanceOf(ContractValidationError);
    expect(generatedInputSave.save).toHaveBeenCalledTimes(1);
  });
});
